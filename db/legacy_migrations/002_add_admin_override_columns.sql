-- Migration: Add admin override tracking columns
-- Purpose: Track when records are resolved by admin override
-- Date: 2025-11-01
-- Run this in your Supabase SQL Editor

-- Add columns to visits table
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS resolved_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_reason TEXT;

-- Add columns to queue_tokens table (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='queue_tokens' AND column_name='resolved_by_admin'
    ) THEN
        ALTER TABLE queue_tokens
        ADD COLUMN resolved_by_admin BOOLEAN DEFAULT false,
        ADD COLUMN resolved_reason TEXT;
    END IF;
END $$;

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

-- Verification
SELECT 
    'visits' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='resolved_by_admin') as has_column
UNION ALL
SELECT 
    'appointments',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='resolved_by_admin')
UNION ALL
SELECT 
    'queue_tokens',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='queue_tokens' AND column_name='resolved_by_admin')
UNION ALL
SELECT 
    'invoices',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='resolved_by_admin');
