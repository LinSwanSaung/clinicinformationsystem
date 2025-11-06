# Stage 5 Phase B — Lifecycle Integrity Migration Guide

## Overview

This migration adds database constraints to enforce lifecycle integrity between appointments, tokens, visits, and invoices. It ensures:

1. **All tokens have a visit** (`queue_tokens.visit_id` NOT NULL + FK RESTRICT)
2. **All invoices have a visit** (`invoices.visit_id` FK RESTRICT)
3. **One active visit per patient** (unique partial index)

## Prerequisites

- Backend server can be stopped (recommended for safety)
- Database backup created
- Access to Supabase SQL Editor or psql

## Migration Files

1. **`010_backfill_tokens_without_visit.sql`** — Links orphaned tokens to visits
2. **`010_backfill_invoices_without_visit.sql`** — Links orphaned invoices to visits
3. **`010_lifecycle_integrity.sql`** — Adds constraints and indexes

## Step-by-Step Migration Process

### Step 1: Pre-Migration Check

Run these queries to assess the current state:

```sql
-- Check for orphaned tokens
SELECT COUNT(*) as orphaned_tokens
FROM queue_tokens
WHERE visit_id IS NULL
  AND status NOT IN ('cancelled', 'missed')
  AND created_at > NOW() - INTERVAL '30 days';

-- Check for orphaned invoices
SELECT COUNT(*) as orphaned_invoices
FROM invoices
WHERE visit_id IS NULL;

-- Check for multiple active visits per patient
SELECT patient_id, COUNT(*) as active_visits
FROM visits
WHERE status = 'in_progress'
GROUP BY patient_id
HAVING COUNT(*) > 1;
```

**Expected Results:**

- Orphaned tokens: Should be 0 or low (will be fixed by backfill)
- Orphaned invoices: Should be 0 (invoices already have NOT NULL constraint)
- Multiple active visits: Should be 0 (will be prevented by unique index)

### Step 2: Run Backfill Scripts

**IMPORTANT:** Run backfill scripts BEFORE the main migration.

#### 2.1: Backfill Tokens

```sql
-- Run in Supabase SQL Editor or psql
\i backend/database/migrations/010_backfill_tokens_without_visit.sql
```

**What it does:**

- Identifies tokens without `visit_id`
- Attempts to link them to visits by matching `patient_id`, `doctor_id`, and `created_at` (within 1 hour)
- For tokens with appointments, tries to find visit via `appointment_id`
- For very old tokens (>30 days), marks them as `cancelled`
- Exports unlinkable tokens to a temp table for review

**Expected Output:**

```
NOTICE: Found X orphaned tokens
NOTICE: Successfully linked Y tokens to visits
NOTICE: Final orphan count (after backfill): Z
```

**If unlinkable tokens remain:**

- Review the `unlinkable_tokens_report` temp table
- Manually link them or cancel them before proceeding

#### 2.2: Backfill Invoices

```sql
-- Run in Supabase SQL Editor or psql
\i backend/database/migrations/010_backfill_invoices_without_visit.sql
```

**What it does:**

- Identifies invoices without `visit_id` (should be rare)
- Attempts to link them to visits by matching `patient_id` and `created_at` (within 1 day)
- For paid invoices, tries broader search (7 days)
- Exports unlinkable invoices to a temp table for review

**Expected Output:**

```
NOTICE: Found X orphaned invoices (or "No orphaned invoices found")
NOTICE: Successfully linked Y invoices to visits
NOTICE: All invoices successfully linked to visits
```

**If unlinkable invoices remain:**

- **CRITICAL:** Do NOT proceed until all invoices are linked
- Review the `unlinkable_invoices_report` temp table
- Manually link them or create missing visits

### Step 3: Verify Backfill Results

Run these verification queries:

```sql
-- Verify tokens
SELECT
    COUNT(*) as total_tokens,
    COUNT(visit_id) as tokens_with_visit,
    COUNT(*) - COUNT(visit_id) as tokens_without_visit
FROM queue_tokens
WHERE status NOT IN ('cancelled', 'missed')
  AND created_at > NOW() - INTERVAL '30 days';

-- Verify invoices
SELECT
    COUNT(*) as total_invoices,
    COUNT(visit_id) as invoices_with_visit,
    COUNT(*) - COUNT(visit_id) as invoices_without_visit
FROM invoices;
```

**Expected Results:**

- `tokens_without_visit`: 0 (or very low, only for old cancelled tokens)
- `invoices_without_visit`: 0

### Step 4: Run Main Migration

**ONLY proceed if backfill scripts report 0 orphans.**

```sql
-- Run in Supabase SQL Editor or psql
\i backend/database/migrations/010_lifecycle_integrity.sql
```

**What it does:**

1. **Preflight Check:** Verifies no orphaned records remain
2. **Update FK Constraints:**
   - `queue_tokens.visit_id`: Add NOT NULL + FK with RESTRICT
   - `invoices.visit_id`: Change FK from CASCADE to RESTRICT
3. **Create Unique Index:** One active visit per patient
4. **Add Performance Indexes:** For `visit_id` lookups
5. **Verification:** Confirms all constraints and indexes are created

**Expected Output:**

```
NOTICE: Preflight Check Results:
NOTICE:   Tokens without visit_id (recent, non-cancelled): 0
NOTICE:   Invoices without visit_id: 0
NOTICE: Preflight check passed. Proceeding with constraints...
NOTICE: Migration completed successfully. All constraints and indexes verified.
```

### Step 5: Post-Migration Verification

Run these queries to verify constraints:

```sql
-- Verify constraints exist
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('queue_tokens', 'invoices')
  AND kcu.column_name = 'visit_id'
ORDER BY tc.table_name;

-- Verify unique index exists
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname = 'visits_one_active_per_patient';

-- Test constraint: Try to create token without visit_id (should fail)
-- DO NOT RUN IN PRODUCTION - This is just a test
-- INSERT INTO queue_tokens (token_number, patient_id, doctor_id, status)
-- VALUES (99999, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'waiting');
-- Expected: ERROR: null value in column "visit_id" violates not-null constraint
```

## Rollback Instructions

If you need to rollback the migration:

```sql
BEGIN;

-- 1. Drop unique index
DROP INDEX IF EXISTS visits_one_active_per_patient;

-- 2. Revert FK constraints
ALTER TABLE queue_tokens
    DROP CONSTRAINT IF EXISTS queue_tokens_visit_id_fkey,
    ALTER COLUMN visit_id DROP NOT NULL;

ALTER TABLE queue_tokens
    ADD CONSTRAINT queue_tokens_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL;

ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS invoices_visit_id_fkey;

ALTER TABLE invoices
    ADD CONSTRAINT invoices_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- 3. Drop performance indexes (optional)
DROP INDEX IF EXISTS idx_queue_tokens_visit_id;
DROP INDEX IF EXISTS idx_invoices_visit_id;

COMMIT;
```

## Troubleshooting

### Error: "Preflight check failed: Orphaned records found"

**Solution:**

1. Run backfill scripts again
2. Manually fix remaining orphans
3. Re-run migration

### Error: "null value in column visit_id violates not-null constraint"

**Solution:**

1. Check for tokens created during migration
2. Link them to visits manually
3. Re-run migration

### Error: "duplicate key value violates unique constraint visits_one_active_per_patient"

**Solution:**

1. Find patients with multiple active visits:
   ```sql
   SELECT patient_id, COUNT(*) as active_visits
   FROM visits
   WHERE status = 'in_progress'
   GROUP BY patient_id
   HAVING COUNT(*) > 1;
   ```
2. Complete or cancel duplicate visits
3. Re-run migration

### Migration Fails Midway

**Solution:**

1. Check transaction status (should be rolled back automatically)
2. Review error messages
3. Fix issues
4. Re-run migration

## Dry-Run Mode

To test the migration without applying changes, you can:

1. Create a test database
2. Copy production schema
3. Run backfill scripts (they're safe to re-run)
4. Run migration
5. Verify results

## Post-Migration Monitoring

After migration, monitor:

1. **Token creation:** Ensure all new tokens have `visit_id`
2. **Invoice creation:** Ensure all new invoices have `visit_id`
3. **Active visits:** Check for patients with multiple active visits (should be 0)
4. **Error logs:** Watch for constraint violation errors

## Support

If you encounter issues:

1. Check migration logs
2. Review unlinkable tokens/invoices reports
3. Consult `CLINIC_WORKFLOW_AND_BUG_ANALYSIS.md` for workflow context
4. Review `STAGE_5_PHASE_A_CHANGELOG.md` for service-layer changes
