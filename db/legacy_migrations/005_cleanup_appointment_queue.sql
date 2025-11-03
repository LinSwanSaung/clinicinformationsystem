-- Migration: Remove unused appointment_queue table and add visit_id to queue_tokens
-- Date: 2025-11-02
-- Description: Removes the legacy appointment_queue table that's not being used in production
--              and adds visit_id link to queue_tokens for proper EMR integration

-- Step 1: Add visit_id to queue_tokens (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='queue_tokens' AND column_name='visit_id'
    ) THEN
        ALTER TABLE queue_tokens ADD COLUMN visit_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE queue_tokens
        ADD CONSTRAINT fk_queue_tokens_visit
        FOREIGN KEY (visit_id) REFERENCES visits(id)
        ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX idx_queue_tokens_visit_id ON queue_tokens(visit_id);
        
        -- Add comment
        COMMENT ON COLUMN queue_tokens.visit_id IS 'Links queue token to the visit record created when patient enters queue';
        
        RAISE NOTICE 'Added visit_id column to queue_tokens table';
    ELSE
        RAISE NOTICE 'visit_id column already exists in queue_tokens table';
    END IF;
END $$;

-- Step 2: Drop appointment_queue table and all related objects
DO $$
BEGIN
    -- Drop triggers first
    DROP TRIGGER IF EXISTS update_appointment_queue_updated_at ON appointment_queue;
    DROP TRIGGER IF EXISTS auto_calculate_queue_position ON appointment_queue;
    
    -- Drop RLS policies
    DROP POLICY IF EXISTS "Healthcare staff can access all data" ON appointment_queue;
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_appointment_queue_appointment_id;
    DROP INDEX IF EXISTS idx_appointment_queue_doctor_id;
    DROP INDEX IF EXISTS idx_appointment_queue_patient_id;
    DROP INDEX IF EXISTS idx_appointment_queue_status;
    DROP INDEX IF EXISTS idx_appointment_queue_position;
    DROP INDEX IF EXISTS idx_appointment_queue_created_date;
    
    -- Drop the table
    DROP TABLE IF EXISTS appointment_queue CASCADE;
    
    RAISE NOTICE 'Successfully removed appointment_queue table and all related objects';
END $$;
