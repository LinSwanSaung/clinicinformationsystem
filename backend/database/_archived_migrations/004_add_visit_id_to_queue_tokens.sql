-- Migration: Add visit_id to queue_tokens table to link tokens with visits
-- Date: 2025-11-02
-- Description: Links queue tokens to visit records for proper EMR tracking

-- Add visit_id column to queue_tokens
ALTER TABLE queue_tokens 
ADD COLUMN IF NOT EXISTS visit_id UUID;

-- Add foreign key constraint
ALTER TABLE queue_tokens
ADD CONSTRAINT fk_queue_tokens_visit
FOREIGN KEY (visit_id) REFERENCES visits(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id 
ON queue_tokens(visit_id);

-- Add comment for documentation
COMMENT ON COLUMN queue_tokens.visit_id IS 'Links queue token to the visit record created when patient enters queue';
