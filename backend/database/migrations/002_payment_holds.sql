-- ===============================================
-- PAYMENT HOLDS & PARTIAL PAYMENTS MIGRATION
-- Add support for partial payments and payment holds
-- ===============================================

-- Step 1: Add payment tracking columns to invoices table
DO $$ 
BEGIN
    -- Add amount_paid if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='amount_paid') THEN
        ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add balance_due if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='balance_due') THEN
        ALTER TABLE invoices ADD COLUMN balance_due DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add on_hold flag if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='on_hold') THEN
        ALTER TABLE invoices ADD COLUMN on_hold BOOLEAN DEFAULT false;
    END IF;

    -- Add hold_reason if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='hold_reason') THEN
        ALTER TABLE invoices ADD COLUMN hold_reason TEXT;
    END IF;

    -- Add hold_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='hold_date') THEN
        ALTER TABLE invoices ADD COLUMN hold_date TIMESTAMPTZ;
    END IF;

    -- Add payment_due_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='invoices' AND column_name='payment_due_date') THEN
        ALTER TABLE invoices ADD COLUMN payment_due_date DATE;
    END IF;
END $$;

-- Step 2: Update existing invoices to set balance_due based on status
UPDATE invoices
SET 
    amount_paid = CASE 
        WHEN status = 'paid' THEN total_amount 
        ELSE 0 
    END,
    balance_due = CASE 
        WHEN status = 'paid' THEN 0 
        ELSE total_amount 
    END
WHERE amount_paid IS NULL OR balance_due IS NULL;

-- Step 3: Update invoice status constraint to include partial_paid
DO $$ 
BEGIN
    -- Drop existing constraint
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS valid_invoice_status;
    
    -- Add new constraint with partial_paid status
    ALTER TABLE invoices ADD CONSTRAINT valid_invoice_status 
        CHECK (status IN ('draft', 'pending', 'partial_paid', 'paid', 'cancelled', 'refunded'));
END $$;

-- Step 4: Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50),
    payment_notes TEXT,
    
    -- Tracking
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_on_hold ON invoices(on_hold) WHERE on_hold = true;
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(patient_id, balance_due) WHERE balance_due > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_payment_due ON invoices(payment_due_date) WHERE payment_due_date IS NOT NULL;

-- Step 6: Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for payment_transactions
DROP POLICY IF EXISTS "Users can view payment transactions" ON payment_transactions;
CREATE POLICY "Users can view payment transactions" ON payment_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cashiers can create payment transactions" ON payment_transactions;
CREATE POLICY "Cashiers can create payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update payment transactions" ON payment_transactions;
CREATE POLICY "Admins can update payment transactions" ON payment_transactions
    FOR UPDATE USING (true);

-- Step 8: Create function to auto-update invoice timestamps
CREATE OR REPLACE FUNCTION update_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for invoice updates
DROP TRIGGER IF EXISTS update_invoices_timestamp ON invoices;
CREATE TRIGGER update_invoices_timestamp
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_timestamp();

DROP TRIGGER IF EXISTS update_payment_transactions_timestamp ON payment_transactions;
CREATE TRIGGER update_payment_transactions_timestamp
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_timestamp();

-- Step 10: Create helper view for outstanding invoices
CREATE OR REPLACE VIEW outstanding_invoices AS
SELECT 
    i.id,
    i.invoice_number,
    i.patient_id,
    p.first_name,
    p.last_name,
    p.patient_number,
    i.visit_id,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.on_hold,
    i.hold_reason,
    i.payment_due_date,
    i.created_at,
    i.hold_date,
    COUNT(pt.id) as payment_count,
    MAX(pt.payment_date) as last_payment_date
FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
LEFT JOIN payment_transactions pt ON i.invoice_id = pt.invoice_id
WHERE i.balance_due > 0
GROUP BY i.id, p.id
ORDER BY i.created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment holds migration completed successfully!';
END $$;
