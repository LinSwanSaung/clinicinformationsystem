-- Migration: Add visit_start_time and visit_end_time to visits table
-- Purpose: Track when consultations actually start and end for accurate timing
-- Date: 2025-10-15

-- Add visit_start_time and visit_end_time columns
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS visit_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS visit_end_time TIMESTAMPTZ;

-- Add comments explaining the columns
COMMENT ON COLUMN visits.visit_start_time IS 'When the doctor started consulting with the patient (status changed to serving)';
COMMENT ON COLUMN visits.visit_end_time IS 'When the consultation was completed (status changed to completed)';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_start_time ON visits(visit_start_time);
CREATE INDEX IF NOT EXISTS idx_visits_end_time ON visits(visit_end_time);
