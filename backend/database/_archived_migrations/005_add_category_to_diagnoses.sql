-- Migration: Add category column to patient_diagnoses table
-- This allows categorizing diagnoses as primary, secondary, working, etc.

-- Add category column to patient_diagnoses
ALTER TABLE patient_diagnoses
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'primary';

-- Add comment
COMMENT ON COLUMN patient_diagnoses.category IS 'Category of diagnosis: primary, secondary, comorbidity, rule-out, working, differential';
