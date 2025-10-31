-- Migration: Add delayed status to appointment_queue
-- Description: Adds 'delayed' status and delay tracking fields to appointment_queue table

-- Drop the existing constraint
ALTER TABLE appointment_queue
DROP CONSTRAINT IF EXISTS valid_queue_status;

-- Add the constraint with 'delayed' status included
ALTER TABLE appointment_queue
ADD CONSTRAINT valid_queue_status 
CHECK (status IN ('queued', 'in_progress', 'completed', 'skipped', 'cancelled', 'delayed'));

-- Add delay tracking columns
ALTER TABLE appointment_queue
ADD COLUMN IF NOT EXISTS delay_reason TEXT,
ADD COLUMN IF NOT EXISTS delayed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS undelayed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_queue_position INTEGER;

-- Create index for delayed status queries
CREATE INDEX IF NOT EXISTS idx_appointment_queue_delayed 
ON appointment_queue(status) 
WHERE status = 'delayed';

-- Create index for active queue queries (excludes delayed, completed, cancelled, skipped)
CREATE INDEX IF NOT EXISTS idx_appointment_queue_active 
ON appointment_queue(doctor_id, status) 
WHERE status IN ('queued', 'in_progress');

-- Comment on new columns
COMMENT ON COLUMN appointment_queue.delay_reason IS 'Reason why the patient was marked as delayed';
COMMENT ON COLUMN appointment_queue.delayed_at IS 'Timestamp when the patient was marked as delayed';
COMMENT ON COLUMN appointment_queue.undelayed_at IS 'Timestamp when the patient was removed from delayed status';
COMMENT ON COLUMN appointment_queue.previous_queue_position IS 'Queue position before being delayed';
