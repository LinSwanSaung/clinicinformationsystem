-- Migration: Add visit_id to queue_tokens table
-- Purpose: Link each queue token to its specific visit for proper vitals tracking
-- Date: 2025-10-15

-- Add visit_id column to queue_tokens
ALTER TABLE queue_tokens
ADD COLUMN visit_id UUID REFERENCES visits(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id ON queue_tokens(visit_id);

-- Add comment explaining the column
COMMENT ON COLUMN queue_tokens.visit_id IS 'Links this token to the specific visit created when token was issued';
