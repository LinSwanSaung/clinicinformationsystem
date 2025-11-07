-- Migration: Add invoice-specific action types
-- Purpose: Add INVOICE.CREATE, INVOICE.COMPLETE, INVOICE.CANCEL, INVOICE.PAYMENT actions
-- Date: 2025-11-01

-- Drop and recreate the constraint with invoice actions
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS valid_action;

ALTER TABLE audit_logs
ADD CONSTRAINT valid_action CHECK (
    action IN (
        -- Existing values from database
        'ACTIVATE', 'CREATE', 'DEACTIVATE', 'DELETE', 
        'LOGIN_FAILURE', 'LOGIN_SUCCESS', 'LOGOUT', 'UPDATE', 'VIEW',
        -- General actions
        'INSERT', 'LOGIN', 'LOGIN_FAILED', 'EXPORT', 'DOWNLOAD',
        'ACCESS', 'MODIFY', 'READ',
        -- Admin actions
        'ADMIN.OVERRIDE', 'ADMIN.RESTORE',
        -- User management
        'USER.CREATE', 'USER.UPDATE', 'USER.DELETE',
        'UPDATE_ROLE', 'GRANT_ACCESS', 'REVOKE_ACCESS',
        -- Invoice-specific actions
        'INVOICE.CREATE', 'INVOICE.COMPLETE', 'INVOICE.CANCEL', 'INVOICE.PAYMENT'
    )
);

-- Verification
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_action';
