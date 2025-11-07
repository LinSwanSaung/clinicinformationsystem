-- Migration to extend audit_logs table for application-level event logging
-- This removes the action constraint and allows for more event types

-- Drop the existing constraint that limits actions to INSERT/UPDATE/DELETE
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS valid_action;

-- Add a more flexible constraint that allows common audit actions
-- Note: VIEW/READ actions are intentionally excluded to avoid excessive logging
ALTER TABLE audit_logs ADD CONSTRAINT valid_action 
  CHECK (action IN (
    'INSERT', 'UPDATE', 'DELETE',           -- Database operations
    'LOGIN', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT',  -- Authentication
    'CREATE',                               -- Creation operations
    'UPLOAD', 'DOWNLOAD',                   -- Document operations
    'ACTIVATE', 'DEACTIVATE', 'CANCEL',     -- Status changes
    'APPROVE', 'REJECT'                     -- Approval workflow
  ));

-- Add comment explaining the dual purpose
COMMENT ON TABLE audit_logs IS 'Audit log table supporting both database-level change tracking (old_values/new_values) and application-level event logging (stored in new_values JSONB)';

-- Create indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action ON audit_logs(table_name, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
