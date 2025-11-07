# Stage 5 Phase B — Database Lifecycle Integrity Constraints

## Summary

Added database-level constraints to enforce lifecycle integrity between appointments, tokens, visits, and invoices. This provides defense-in-depth alongside the service-layer fixes from Phase A.

## Changes

### 1. Foreign Key Constraints

#### `queue_tokens.visit_id`

- **Before:** `UUID REFERENCES visits(id) ON DELETE SET NULL` (nullable)
- **After:** `UUID NOT NULL REFERENCES visits(id) ON DELETE RESTRICT`
- **Impact:** All tokens must have a visit, and visits cannot be deleted if tokens reference them

#### `invoices.visit_id`

- **Before:** `UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE`
- **After:** `UUID NOT NULL REFERENCES visits(id) ON DELETE RESTRICT`
- **Impact:** Visits cannot be deleted if invoices reference them (prevents accidental data loss)

### 2. Unique Index

#### `visits_one_active_per_patient`

- **Type:** Partial unique index
- **Definition:** `CREATE UNIQUE INDEX visits_one_active_per_patient ON visits(patient_id) WHERE status = 'in_progress'`
- **Impact:** Prevents multiple active visits per patient at the database level

### 3. Performance Indexes

- `idx_queue_tokens_visit_id` — For fast lookups of tokens by visit
- `idx_invoices_visit_id` — Already existed, kept for consistency

## Migration Files

### `010_backfill_tokens_without_visit.sql`

- Links orphaned tokens to visits by matching `patient_id`, `doctor_id`, and `created_at` (within 1 hour)
- For tokens with appointments, tries to find visit via `appointment_id`
- For very old tokens (>30 days), marks them as `cancelled`
- Exports unlinkable tokens to temp table for review

### `010_backfill_invoices_without_visit.sql`

- Links orphaned invoices to visits by matching `patient_id` and `created_at` (within 1 day)
- For paid invoices, tries broader search (7 days)
- Exports unlinkable invoices to temp table for review

### `010_lifecycle_integrity.sql`

- Preflight check: Verifies no orphaned records remain
- Updates FK constraints: `queue_tokens.visit_id` (NOT NULL + RESTRICT), `invoices.visit_id` (RESTRICT)
- Creates unique index: `visits_one_active_per_patient`
- Adds performance indexes: `idx_queue_tokens_visit_id`, `idx_invoices_visit_id`
- Verification: Confirms all constraints and indexes are created

## Schema Updates

### `db/schema.sql`

- Updated `queue_tokens.visit_id`: `NOT NULL REFERENCES visits(id) ON DELETE RESTRICT`
- Updated `invoices.visit_id`: `NOT NULL REFERENCES visits(id) ON DELETE RESTRICT`
- Added unique index: `visits_one_active_per_patient`
- Added performance index: `idx_queue_tokens_visit_id`

### `backend/database/schema.sql`

- Same updates as `db/schema.sql`

## Migration Process

1. **Pre-Migration Check:** Verify current state (orphaned tokens/invoices, multiple active visits)
2. **Run Backfill Scripts:** Link orphaned records to visits
3. **Verify Backfill:** Confirm all records are linked
4. **Run Main Migration:** Apply constraints and indexes
5. **Post-Migration Verification:** Confirm constraints and indexes exist

See `backend/database/migrations/README_LIFECYCLE_MIGRATION.md` for detailed instructions.

## Rollback

If needed, rollback instructions are included in the migration file:

1. Drop unique index: `DROP INDEX visits_one_active_per_patient`
2. Revert FK constraints: Restore `ON DELETE SET NULL` for tokens, `ON DELETE CASCADE` for invoices
3. Drop performance indexes (optional)

## Benefits

1. **Data Integrity:** Database enforces relationships at the schema level
2. **Prevents Orphans:** Cannot create tokens without visits
3. **Prevents Duplicates:** Cannot have multiple active visits per patient
4. **Prevents Accidental Deletion:** Visits cannot be deleted if referenced by tokens/invoices
5. **Performance:** Indexes improve query performance for visit lookups

## Testing

After migration, verify:

- [ ] Cannot create token without `visit_id` (NOT NULL constraint)
- [ ] Cannot delete visit with tokens (RESTRICT constraint)
- [ ] Cannot delete visit with invoices (RESTRICT constraint)
- [ ] Cannot create second active visit for same patient (unique index)
- [ ] All existing tokens have `visit_id`
- [ ] All existing invoices have `visit_id`

## Files Changed

**New Files:**

- `backend/database/migrations/010_backfill_tokens_without_visit.sql`
- `backend/database/migrations/010_backfill_invoices_without_visit.sql`
- `backend/database/migrations/010_lifecycle_integrity.sql`
- `backend/database/migrations/README_LIFECYCLE_MIGRATION.md`
- `STAGE_5_PHASE_B_CHANGELOG.md`

**Modified Files:**

- `db/schema.sql`
- `backend/database/schema.sql`

## Next Steps (Phase C)

- Auto-cancel end-of-day appointments job
