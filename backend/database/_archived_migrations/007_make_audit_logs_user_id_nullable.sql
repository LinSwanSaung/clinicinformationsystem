-- ===============================================
-- Migration: Make audit_logs.user_id nullable
-- Description: Allow system events and automated processes to log audit events without a user context
-- Date: 2025-01-XX
-- ===============================================

-- Make user_id nullable to support system events
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to explain nullable user_id
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action. NULL indicates system-generated events or automated processes.';

-- Verify the change
DO $$
BEGIN
    RAISE NOTICE 'audit_logs.user_id is now nullable. System events can be logged without user context.';
END $$;
