-- Migration: Add Cashier and Pharmacist roles
-- Date: 2025-10-16
-- Description: Adds cashier and pharmacist roles to the users table role constraint

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role;

-- Add the new constraint with additional roles
ALTER TABLE users ADD CONSTRAINT valid_role 
  CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'));

-- Update the comment on the role column
COMMENT ON COLUMN users.role IS 'User role: admin, doctor, nurse, receptionist, cashier, or pharmacist';
