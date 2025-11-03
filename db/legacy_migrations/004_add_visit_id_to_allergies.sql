-- Migration: Add visit_id column to patient_allergies table
-- This links allergies to specific visits for proper medical record tracking

-- Add visit_id column to patient_allergies
ALTER TABLE patient_allergies
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_allergies_visit_id ON patient_allergies(visit_id);

-- Add comment
COMMENT ON COLUMN patient_allergies.visit_id IS 'Links the allergy to the specific visit when it was recorded';
