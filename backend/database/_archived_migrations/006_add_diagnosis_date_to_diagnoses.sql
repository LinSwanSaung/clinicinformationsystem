-- Migration: Add diagnosis_date column to patient_diagnoses table
-- This tracks when the diagnosis was made

-- Add diagnosis_date column to patient_diagnoses
ALTER TABLE patient_diagnoses
ADD COLUMN IF NOT EXISTS diagnosis_date TIMESTAMPTZ DEFAULT NOW();

-- Add comment
COMMENT ON COLUMN patient_diagnoses.diagnosis_date IS 'Date when the diagnosis was made';
