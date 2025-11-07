-- Migration: Add 'delayed' status to queue_tokens
-- This allows nurses to mark patients as delayed and reorder them in the queue

-- Step 1: Drop existing constraint
ALTER TABLE queue_tokens 
DROP CONSTRAINT IF EXISTS valid_token_status;

-- Step 2: Add new constraint with 'delayed' status
ALTER TABLE queue_tokens 
ADD CONSTRAINT valid_token_status 
CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'missed', 'cancelled', 'delayed'));

-- Step 3: Add delay tracking fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='queue_tokens' AND column_name='delay_reason'
    ) THEN
        ALTER TABLE queue_tokens ADD COLUMN delay_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='queue_tokens' AND column_name='delayed_at'
    ) THEN
        ALTER TABLE queue_tokens ADD COLUMN delayed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='queue_tokens' AND column_name='undelayed_at'
    ) THEN
        ALTER TABLE queue_tokens ADD COLUMN undelayed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='queue_tokens' AND column_name='previous_status'
    ) THEN
        ALTER TABLE queue_tokens ADD COLUMN previous_status VARCHAR(20);
    END IF;
END $$;

-- Add comment explaining the delayed status workflow
COMMENT ON COLUMN queue_tokens.status IS 'Token status: waiting (in queue), called (next to be served), serving (with doctor), completed (done), missed (no-show), cancelled (cancelled by staff/patient), delayed (temporarily out of queue)';
COMMENT ON COLUMN queue_tokens.delay_reason IS 'Reason why patient was marked as delayed (e.g., "Patient stepped out", "Waiting for lab results")';
COMMENT ON COLUMN queue_tokens.previous_status IS 'Status before being delayed, used when patient is undelayed to determine next action';
