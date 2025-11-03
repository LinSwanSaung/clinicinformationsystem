-- Migration: Add patient portal account support
-- Purpose : Allow patients to register accounts linked to their clinical records
-- Run     : Supabase SQL editor or psql against the primary database

BEGIN;

-- Expand role whitelist to include patient accounts
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE users
  ADD CONSTRAINT valid_role CHECK (
    role IN (
      'admin',
      'doctor',
      'nurse',
      'receptionist',
      'cashier',
      'pharmacist',
      'patient'
    )
  );

-- Add link from user accounts to patient records
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

COMMENT ON COLUMN users.patient_id IS 'Links a patient portal user account to the corresponding patients.id';

-- Helpful indexes for lookups and to ensure one portal account per patient
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_patient_portal_per_patient
  ON users(patient_id)
  WHERE role = 'patient' AND patient_id IS NOT NULL;

COMMIT;

-- Rollback (manual):
-- 1) DROP INDEX IF EXISTS uniq_patient_portal_per_patient;
-- 2) DROP INDEX IF EXISTS idx_users_patient_id;
-- 3) ALTER TABLE users DROP COLUMN IF EXISTS patient_id;
-- 4) ALTER TABLE users DROP CONSTRAINT valid_role;
-- 5) ALTER TABLE users ADD CONSTRAINT valid_role CHECK (
--       role IN ('admin','doctor','nurse','receptionist','cashier','pharmacist')
--    );
