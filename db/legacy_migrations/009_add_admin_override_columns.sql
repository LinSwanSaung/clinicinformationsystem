-- Migration: Add admin override tracking columns
-- Purpose: Track when records are resolved by admin override
-- Date: 2025-11-01

-- Add columns to visits table
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add columns to queue_tokens table
ALTER TABLE queue_tokens
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add comments
COMMENT ON COLUMN visits.resolved_by_admin IS 'Indicates if this visit was resolved by admin override';
COMMENT ON COLUMN visits.resolved_reason IS 'Reason provided when admin resolved this visit';

COMMENT ON COLUMN appointments.resolved_by_admin IS 'Indicates if this appointment was resolved by admin override';
COMMENT ON COLUMN appointments.resolved_reason IS 'Reason provided when admin resolved this appointment';

COMMENT ON COLUMN queue_tokens.resolved_by_admin IS 'Indicates if this queue token was resolved by admin override';
COMMENT ON COLUMN queue_tokens.resolved_reason IS 'Reason provided when admin resolved this queue token';

COMMENT ON COLUMN invoices.resolved_by_admin IS 'Indicates if this invoice was resolved by admin override';
COMMENT ON COLUMN invoices.resolved_reason IS 'Reason provided when admin resolved this invoice';