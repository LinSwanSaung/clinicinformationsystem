-- Fix payment_transactions table to ensure all columns exist
DO $$ 
BEGIN
    -- Check if processed_by column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='payment_transactions' AND column_name='processed_by'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN processed_by UUID REFERENCES users(id);
        
        RAISE NOTICE 'Added processed_by column to payment_transactions';
    ELSE
        RAISE NOTICE 'processed_by column already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
ORDER BY ordinal_position;
