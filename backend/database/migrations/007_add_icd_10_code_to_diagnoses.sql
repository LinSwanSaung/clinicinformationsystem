-- Migration: Add icd_10_code column to patient_diagnoses table
-- This stores the ICD-10 diagnostic code

-- Add icd_10_code column to patient_diagnoses
ALTER TABLE patient_diagnoses
ADD COLUMN IF NOT EXISTS icd_10_code VARCHAR(20);

-- Add comment
COMMENT ON COLUMN patient_diagnoses.icd_10_code IS 'ICD-10 diagnostic code';
