-- Migration: Enhance audit_logs table with recommended columns
-- Purpose: Add actor_role, status/outcome, and reason columns for better audit trail
-- Date: 2025-11-01
-- Run this in your Supabase SQL Editor

-- Add new columns to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success',
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Step 1: Drop the old constraint (if it exists)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS valid_action;

-- Step 2: Don't add the constraint back yet - let's see what values exist
-- Run this query to check all distinct action values:
-- SELECT DISTINCT action FROM audit_logs ORDER BY action;

-- Step 3: Add constraint for status values (this is a new column with default, so it's safe)
ALTER TABLE audit_logs
ADD CONSTRAINT valid_status CHECK (
    status IN ('success', 'failed', 'denied', 'warning')
);

-- Add comments for new columns
COMMENT ON COLUMN audit_logs.actor_role IS 'Role of the user who performed the action (admin, doctor, nurse, etc.)';
COMMENT ON COLUMN audit_logs.status IS 'Outcome of the action: success, failed, denied, or warning';
COMMENT ON COLUMN audit_logs.reason IS 'Optional context or reason for the action (especially for overrides, deletions, access changes)';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON audit_logs(actor_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_status ON audit_logs(action, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);

-- Verification query
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
    AND column_name IN ('actor_role', 'status', 'reason')
ORDER BY ordinal_position;
