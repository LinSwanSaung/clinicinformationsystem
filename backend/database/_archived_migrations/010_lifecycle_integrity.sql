-- ===============================================
-- Stage 5 Phase B: Lifecycle Integrity Constraints
-- Migration: 010_lifecycle_integrity.sql
-- ===============================================
-- 
-- Purpose: Add database constraints to enforce lifecycle integrity
-- - queue_tokens.visit_id: NOT NULL + FK with RESTRICT
-- - invoices.visit_id: FK with RESTRICT (already NOT NULL)
-- - Unique index: one active visit per patient
--
-- Prerequisites:
-- 1. Run backfill scripts first (010_backfill_tokens_without_visit.sql, 010_backfill_invoices_without_visit.sql)
-- 2. Verify no orphaned records remain
-- 3. Then run this migration
--
-- Created: 2025-01-XX
-- ===============================================

BEGIN;

-- ===============================================
-- STEP 1: Preflight Check - Verify no orphans
-- ===============================================
DO $$
DECLARE
    orphan_tokens_count INTEGER;
    orphan_invoices_count INTEGER;
BEGIN
    -- Count tokens without visit_id
    SELECT COUNT(*) INTO orphan_tokens_count
    FROM queue_tokens
    WHERE visit_id IS NULL
      AND status NOT IN ('cancelled', 'missed')
      AND created_at > NOW() - INTERVAL '30 days'; -- Only check recent tokens
    
    -- Count invoices without visit_id (should be 0 if schema is correct)
    SELECT COUNT(*) INTO orphan_invoices_count
    FROM invoices
    WHERE visit_id IS NULL;
    
    -- Report findings
    RAISE NOTICE 'Preflight Check Results:';
    RAISE NOTICE '  Tokens without visit_id (recent, non-cancelled): %', orphan_tokens_count;
    RAISE NOTICE '  Invoices without visit_id: %', orphan_invoices_count;
    
    -- Abort if orphans found (after backfill should have fixed them)
    IF orphan_tokens_count > 0 OR orphan_invoices_count > 0 THEN
        RAISE EXCEPTION 'Preflight check failed: Orphaned records found. Run backfill scripts first. Tokens: %, Invoices: %', 
            orphan_tokens_count, orphan_invoices_count;
    END IF;
    
    RAISE NOTICE 'Preflight check passed. Proceeding with constraints...';
END $$;

-- ===============================================
-- STEP 2: Update Foreign Key Constraints
-- ===============================================

-- 2.1: Update queue_tokens.visit_id to NOT NULL with RESTRICT
-- First, set visit_id for any remaining NULLs (should be none after backfill)
UPDATE queue_tokens
SET visit_id = (
    SELECT v.id
    FROM visits v
    WHERE v.patient_id = queue_tokens.patient_id
      AND v.doctor_id = queue_tokens.doctor_id
      AND v.created_at BETWEEN queue_tokens.created_at - INTERVAL '1 hour' 
                           AND queue_tokens.created_at + INTERVAL '1 hour'
      AND v.status = 'in_progress'
    ORDER BY v.created_at DESC
    LIMIT 1
)
WHERE visit_id IS NULL
  AND status NOT IN ('cancelled', 'missed')
  AND created_at > NOW() - INTERVAL '30 days';

-- For very old tokens without visit_id, cancel them
UPDATE queue_tokens
SET status = 'cancelled',
    updated_at = NOW()
WHERE visit_id IS NULL
  AND status NOT IN ('cancelled', 'missed')
  AND created_at <= NOW() - INTERVAL '30 days';

-- Now add NOT NULL constraint
ALTER TABLE queue_tokens
    ALTER COLUMN visit_id SET NOT NULL;

-- Drop existing FK if it exists and recreate with RESTRICT
ALTER TABLE queue_tokens
    DROP CONSTRAINT IF EXISTS queue_tokens_visit_id_fkey;

ALTER TABLE queue_tokens
    ADD CONSTRAINT queue_tokens_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE RESTRICT;

-- 2.2: Update invoices.visit_id FK to RESTRICT (already NOT NULL)
ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS invoices_visit_id_fkey;

ALTER TABLE invoices
    ADD CONSTRAINT invoices_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE RESTRICT;

-- ===============================================
-- STEP 3: Unique Index - One Active Visit Per Patient
-- ===============================================

-- Create unique partial index to ensure only one active visit per patient
CREATE UNIQUE INDEX IF NOT EXISTS visits_one_active_per_patient
ON visits(patient_id)
WHERE status = 'in_progress';

COMMENT ON INDEX visits_one_active_per_patient IS 
    'Ensures only one active (in_progress) visit per patient at a time';

-- ===============================================
-- STEP 4: Add Indexes for Performance
-- ===============================================

-- Index for queue_tokens.visit_id lookups
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id 
ON queue_tokens(visit_id);

-- Index for invoices.visit_id lookups (may already exist)
CREATE INDEX IF NOT EXISTS idx_invoices_visit_id 
ON invoices(visit_id);

-- ===============================================
-- STEP 5: Verification
-- ===============================================

DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Verify constraints exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE constraint_name IN (
        'queue_tokens_visit_id_fkey',
        'invoices_visit_id_fkey'
    );
    
    IF constraint_count < 2 THEN
        RAISE EXCEPTION 'Constraint verification failed. Expected 2 constraints, found %', constraint_count;
    END IF;
    
    -- Verify unique index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'visits_one_active_per_patient'
    ) THEN
        RAISE EXCEPTION 'Unique index verification failed. visits_one_active_per_patient not found.';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. All constraints and indexes verified.';
END $$;

COMMIT;

-- ===============================================
-- Rollback Instructions
-- ===============================================
-- To rollback this migration:
--
-- 1. Drop unique index:
--    DROP INDEX IF EXISTS visits_one_active_per_patient;
--
-- 2. Revert FK constraints:
--    ALTER TABLE queue_tokens
--        DROP CONSTRAINT IF EXISTS queue_tokens_visit_id_fkey,
--        ALTER COLUMN visit_id DROP NOT NULL;
--    ALTER TABLE queue_tokens
--        ADD CONSTRAINT queue_tokens_visit_id_fkey
--        FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL;
--
--    ALTER TABLE invoices
--        DROP CONSTRAINT IF EXISTS invoices_visit_id_fkey;
--    ALTER TABLE invoices
--        ADD CONSTRAINT invoices_visit_id_fkey
--        FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;
--
-- 3. Drop performance indexes (optional):
--    DROP INDEX IF EXISTS idx_queue_tokens_visit_id;
--    DROP INDEX IF EXISTS idx_invoices_visit_id;
-- ===============================================

