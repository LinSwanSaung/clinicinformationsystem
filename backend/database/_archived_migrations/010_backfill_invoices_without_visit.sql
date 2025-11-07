-- ===============================================
-- Stage 5 Phase B: Backfill Invoices Without Visit
-- Script: 010_backfill_invoices_without_visit.sql
-- ===============================================
-- 
-- Purpose: Link orphaned invoices to visits by matching:
--   - patient_id
--   - created_at (within 1 day window)
--
-- This script attempts to link invoices to visits, and exports
-- unlinkable invoices to a CSV report.
--
-- Run this BEFORE 010_lifecycle_integrity.sql
--
-- Note: Invoices should already have visit_id (NOT NULL constraint),
-- but this script handles edge cases where visit_id might be NULL
-- due to data inconsistencies.
--
-- Created: 2025-01-XX
-- ===============================================

BEGIN;

-- ===============================================
-- STEP 1: Identify Orphaned Invoices
-- ===============================================

CREATE TEMP TABLE IF NOT EXISTS orphaned_invoices AS
SELECT 
    i.id,
    i.invoice_number,
    i.patient_id,
    i.status,
    i.created_at as invoice_created_at,
    i.visit_id as current_visit_id
FROM invoices i
WHERE i.visit_id IS NULL;

-- Report count
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count FROM orphaned_invoices;
    
    IF orphan_count = 0 THEN
        RAISE NOTICE 'No orphaned invoices found. All invoices have visit_id.';
    ELSE
        RAISE WARNING 'Found % orphaned invoices (without visit_id)', orphan_count;
    END IF;
END $$;

-- ===============================================
-- STEP 2: Attempt to Link Invoices to Visits
-- ===============================================

-- Match invoices to visits by:
-- - Same patient_id
-- - Created within 1 day window
-- - Visit status is completed or in_progress
UPDATE invoices i
SET visit_id = (
    SELECT v.id
    FROM visits v
    WHERE v.patient_id = i.patient_id
      AND v.created_at BETWEEN i.created_at - INTERVAL '1 day' 
                           AND i.created_at + INTERVAL '1 day'
      AND v.status IN ('in_progress', 'completed')
    ORDER BY ABS(EXTRACT(EPOCH FROM (v.created_at - i.created_at))) ASC
    LIMIT 1
)
WHERE i.visit_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM visits v
    WHERE v.patient_id = i.patient_id
      AND v.created_at BETWEEN i.created_at - INTERVAL '1 day' 
                           AND i.created_at + INTERVAL '1 day'
      AND v.status IN ('in_progress', 'completed')
  );

-- Report linked count
DO $$
DECLARE
    linked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO linked_count
    FROM invoices
    WHERE visit_id IS NOT NULL
      AND id IN (SELECT id FROM orphaned_invoices);
    RAISE NOTICE 'Successfully linked % invoices to visits', linked_count;
END $$;

-- ===============================================
-- STEP 3: Handle Remaining Orphans
-- ===============================================

-- For paid invoices without visit, try broader search (7 days)
UPDATE invoices i
SET visit_id = (
    SELECT v.id
    FROM visits v
    WHERE v.patient_id = i.patient_id
      AND v.created_at BETWEEN i.created_at - INTERVAL '7 days' 
                           AND i.created_at + INTERVAL '7 days'
      AND v.status = 'completed'
    ORDER BY ABS(EXTRACT(EPOCH FROM (v.created_at - i.created_at))) ASC
    LIMIT 1
)
WHERE i.visit_id IS NULL
  AND i.status = 'paid'
  AND EXISTS (
    SELECT 1
    FROM visits v
    WHERE v.patient_id = i.patient_id
      AND v.created_at BETWEEN i.created_at - INTERVAL '7 days' 
                           AND i.created_at + INTERVAL '7 days'
      AND v.status = 'completed'
  );

-- Report final orphan count
DO $$
DECLARE
    final_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_orphan_count
    FROM invoices
    WHERE visit_id IS NULL;
    
    IF final_orphan_count > 0 THEN
        RAISE WARNING 'WARNING: % invoices remain unlinked. These must be fixed manually before applying constraints.', final_orphan_count;
    ELSE
        RAISE NOTICE 'All invoices successfully linked to visits.';
    END IF;
END $$;

-- ===============================================
-- STEP 4: Export Unlinkable Invoices Report
-- ===============================================

-- Create report table for unlinkable invoices
CREATE TEMP TABLE IF NOT EXISTS unlinkable_invoices_report AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    p.first_name || ' ' || p.last_name as patient_name,
    p.patient_number,
    i.status,
    i.total_amount,
    i.created_at,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM visits v 
            WHERE v.patient_id = i.patient_id 
              AND v.created_at BETWEEN i.created_at - INTERVAL '7 days' 
                                   AND i.created_at + INTERVAL '7 days'
        ) THEN 'No matching visit found (7 day window)'
        ELSE 'Visit exists but status mismatch'
    END as reason
FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
WHERE i.visit_id IS NULL;

-- Report unlinkable invoices
DO $$
DECLARE
    unlinkable_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinkable_count FROM unlinkable_invoices_report;
    
    IF unlinkable_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'UNLINKABLE INVOICES REPORT';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total unlinkable invoices: %', unlinkable_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Review the unlinkable_invoices_report temp table for details.';
        RAISE NOTICE 'To export to CSV, run:';
        RAISE NOTICE '  COPY (SELECT * FROM unlinkable_invoices_report) TO ''/tmp/unlinkable_invoices.csv'' WITH CSV HEADER;';
        RAISE NOTICE '========================================';
        RAISE WARNING 'CRITICAL: Do not proceed with migration until all invoices are linked!';
    ELSE
        RAISE NOTICE 'All invoices successfully linked to visits.';
    END IF;
END $$;

COMMIT;

-- ===============================================
-- Verification Query
-- ===============================================
-- Run this after the script to verify:
--
-- SELECT 
--     COUNT(*) as total_invoices,
--     COUNT(visit_id) as invoices_with_visit,
--     COUNT(*) - COUNT(visit_id) as invoices_without_visit
-- FROM invoices;
-- ===============================================

