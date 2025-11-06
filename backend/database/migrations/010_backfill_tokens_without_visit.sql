-- ===============================================
-- Stage 5 Phase B: Backfill Tokens Without Visit
-- Script: 010_backfill_tokens_without_visit.sql
-- ===============================================
-- 
-- Purpose: Link orphaned queue_tokens to visits by matching:
--   - patient_id
--   - doctor_id
--   - created_at (within 1 hour window)
--
-- This script attempts to link tokens to visits, and exports
-- unlinkable tokens to a CSV report.
--
-- Run this BEFORE 010_lifecycle_integrity.sql
--
-- Created: 2025-01-XX
-- ===============================================

BEGIN;

-- ===============================================
-- STEP 1: Identify Orphaned Tokens
-- ===============================================

CREATE TEMP TABLE IF NOT EXISTS orphaned_tokens AS
SELECT 
    qt.id,
    qt.token_number,
    qt.patient_id,
    qt.doctor_id,
    qt.appointment_id,
    qt.status,
    qt.created_at as token_created_at,
    qt.visit_id as current_visit_id
FROM queue_tokens qt
WHERE qt.visit_id IS NULL
  AND qt.status NOT IN ('cancelled', 'missed');

-- Report count
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count FROM orphaned_tokens;
    RAISE NOTICE 'Found % orphaned tokens (non-cancelled, non-missed)', orphan_count;
END $$;

-- ===============================================
-- STEP 2: Attempt to Link Tokens to Visits
-- ===============================================

-- Match tokens to visits by:
-- - Same patient_id
-- - Same doctor_id
-- - Created within 1 hour window
-- - Visit status is in_progress or completed
UPDATE queue_tokens qt
SET visit_id = (
    SELECT v.id
    FROM visits v
    WHERE v.patient_id = qt.patient_id
      AND v.doctor_id = qt.doctor_id
      AND v.created_at BETWEEN qt.created_at - INTERVAL '1 hour' 
                           AND qt.created_at + INTERVAL '1 hour'
      AND v.status IN ('in_progress', 'completed')
    ORDER BY ABS(EXTRACT(EPOCH FROM (v.created_at - qt.created_at))) ASC
    LIMIT 1
)
WHERE qt.visit_id IS NULL
  AND qt.status NOT IN ('cancelled', 'missed')
  AND EXISTS (
    SELECT 1
    FROM visits v
    WHERE v.patient_id = qt.patient_id
      AND v.doctor_id = qt.doctor_id
      AND v.created_at BETWEEN qt.created_at - INTERVAL '1 hour' 
                           AND qt.created_at + INTERVAL '1 hour'
      AND v.status IN ('in_progress', 'completed')
  );

-- Report linked count
DO $$
DECLARE
    linked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO linked_count
    FROM queue_tokens
    WHERE visit_id IS NOT NULL
      AND id IN (SELECT id FROM orphaned_tokens);
    RAISE NOTICE 'Successfully linked % tokens to visits', linked_count;
END $$;

-- ===============================================
-- STEP 3: Handle Remaining Orphans
-- ===============================================

-- For tokens with appointments, try to find visit via appointment
UPDATE queue_tokens qt
SET visit_id = (
    SELECT v.id
    FROM visits v
    WHERE v.appointment_id = qt.appointment_id
      AND v.patient_id = qt.patient_id
    ORDER BY v.created_at DESC
    LIMIT 1
)
WHERE qt.visit_id IS NULL
  AND qt.appointment_id IS NOT NULL
  AND qt.status NOT IN ('cancelled', 'missed');

-- For very old tokens (>30 days) without visit_id, mark as cancelled
UPDATE queue_tokens
SET status = 'cancelled',
    updated_at = NOW()
WHERE visit_id IS NULL
  AND status NOT IN ('cancelled', 'missed')
  AND created_at <= NOW() - INTERVAL '30 days';

-- Report final orphan count
DO $$
DECLARE
    final_orphan_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_orphan_count
    FROM queue_tokens
    WHERE visit_id IS NULL
      AND status NOT IN ('cancelled', 'missed');
    
    SELECT COUNT(*) INTO cancelled_count
    FROM queue_tokens
    WHERE status = 'cancelled'
      AND id IN (SELECT id FROM orphaned_tokens WHERE current_visit_id IS NULL);
    
    RAISE NOTICE 'Final orphan count (after backfill): %', final_orphan_count;
    RAISE NOTICE 'Old tokens cancelled: %', cancelled_count;
    
    IF final_orphan_count > 0 THEN
        RAISE WARNING 'WARNING: % tokens remain unlinked. Review these manually before applying constraints.', final_orphan_count;
    END IF;
END $$;

-- ===============================================
-- STEP 4: Export Unlinkable Tokens Report
-- ===============================================

-- Create report table for unlinkable tokens
CREATE TEMP TABLE IF NOT EXISTS unlinkable_tokens_report AS
SELECT 
    qt.id as token_id,
    qt.token_number,
    p.first_name || ' ' || p.last_name as patient_name,
    p.patient_number,
    u.first_name || ' ' || u.last_name as doctor_name,
    qt.status,
    qt.created_at,
    qt.appointment_id,
    CASE 
        WHEN qt.created_at <= NOW() - INTERVAL '30 days' THEN 'Old token (>30 days)'
        WHEN qt.appointment_id IS NULL THEN 'No appointment link'
        ELSE 'No matching visit found'
    END as reason
FROM queue_tokens qt
LEFT JOIN patients p ON qt.patient_id = p.id
LEFT JOIN users u ON qt.doctor_id = u.id
WHERE qt.visit_id IS NULL
  AND qt.status NOT IN ('cancelled', 'missed');

-- Report unlinkable tokens
DO $$
DECLARE
    unlinkable_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinkable_count FROM unlinkable_tokens_report;
    
    IF unlinkable_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'UNLINKABLE TOKENS REPORT';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total unlinkable tokens: %', unlinkable_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Review the unlinkable_tokens_report temp table for details.';
        RAISE NOTICE 'To export to CSV, run:';
        RAISE NOTICE '  COPY (SELECT * FROM unlinkable_tokens_report) TO ''/tmp/unlinkable_tokens.csv'' WITH CSV HEADER;';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE 'All tokens successfully linked or cancelled.';
    END IF;
END $$;

COMMIT;

-- ===============================================
-- Verification Query
-- ===============================================
-- Run this after the script to verify:
--
-- SELECT 
--     COUNT(*) as total_tokens,
--     COUNT(visit_id) as tokens_with_visit,
--     COUNT(*) - COUNT(visit_id) as tokens_without_visit
-- FROM queue_tokens
-- WHERE status NOT IN ('cancelled', 'missed')
--   AND created_at > NOW() - INTERVAL '30 days';
-- ===============================================

