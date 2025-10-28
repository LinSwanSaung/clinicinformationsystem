-- Quick Migration: Add missing columns to invoices table
-- Run this in Supabase SQL Editor

-- Add payment tracking columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_hold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hold_reason TEXT,
ADD COLUMN IF NOT EXISTS hold_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_due_date DATE;

-- Initialize existing invoices
UPDATE invoices
SET 
    amount_paid = CASE WHEN status = 'paid' THEN total_amount ELSE 0 END,
    balance_due = CASE WHEN status = 'paid' THEN 0 ELSE total_amount END,
    on_hold = CASE WHEN status != 'paid' THEN true ELSE false END
WHERE amount_paid IS NULL;

-- Update status constraint to include partial_paid
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS valid_invoice_status;
ALTER TABLE invoices ADD CONSTRAINT valid_invoice_status 
    CHECK (status IN ('draft', 'pending', 'partial_paid', 'paid', 'cancelled', 'refunded'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_on_hold ON invoices(on_hold) WHERE on_hold = true;
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(patient_id, balance_due) WHERE balance_due > 0;

-- Done!
SELECT 'Migration complete! ✅' as status;
