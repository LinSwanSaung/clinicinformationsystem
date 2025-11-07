-- Migration: Add action constraint to audit_logs
-- Purpose: Add constraint for action column with all existing values
-- Date: 2025-11-01
-- Run this AFTER migration 003

-- Add the action constraint with ALL existing values from your database
ALTER TABLE audit_logs
ADD CONSTRAINT valid_action CHECK (
    action IN (
        -- Existing values from your database
        'ACTIVATE',
        'CREATE',
        'DEACTIVATE',
        'DELETE',
        'LOGIN_FAILURE',
        'LOGIN_SUCCESS',
        'LOGOUT',
        'UPDATE',
        'VIEW',
        -- Future values for new features
        'INSERT',
        'LOGIN',
        'LOGIN_FAILED',
        'EXPORT',
        'DOWNLOAD',
        'ADMIN.OVERRIDE',
        'ADMIN.RESTORE',
        'USER.CREATE',
        'USER.UPDATE',
        'USER.DELETE',
        'UPDATE_ROLE',
        'GRANT_ACCESS',
        'REVOKE_ACCESS',
        'ACCESS',
        'MODIFY',
        'READ'
    )
);

-- Verification
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_action';
