-- Migration: Add doctor_note_id to prescriptions table
-- This links prescriptions to their source doctor note for better tracking and editing

-- Add the doctor_note_id column
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS doctor_note_id UUID REFERENCES doctor_notes(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_note_id ON prescriptions(doctor_note_id);

-- Add comment explaining the column
COMMENT ON COLUMN prescriptions.doctor_note_id IS 'Links prescription to the doctor note that created it. Enables proper editing of prescriptions when notes are updated.';
