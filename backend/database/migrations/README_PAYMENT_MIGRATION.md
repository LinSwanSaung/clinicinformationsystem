# Payment Holds & Partial Payments Migration

This migration adds support for partial payments, payment holds, and outstanding balance tracking.

## What This Migration Does

1. **Adds new columns to `invoices` table:**
   - `amount_paid` - Track how much has been paid
   - `balance_due` - Track remaining balance
   - `on_hold` - Flag for invoices on hold
   - `hold_reason` - Reason for hold
   - `hold_date` - When invoice was put on hold
   - `payment_due_date` - When payment is expected

2. **Creates `payment_transactions` table:**
   - Track individual payment transactions
   - Support multiple payments per invoice
   - Record payment method, notes, and who processed it

3. **Updates invoice status:**
   - Adds `partial_paid` status for partially paid invoices
   - Auto-calculates `balance_due` for existing invoices

4. **Creates indexes** for better query performance

5. **Creates views** for easy querying of outstanding invoices

## How to Run Migration

### Option 1: Automatic (Using Node Script)

```bash
cd backend
node run_payment_migration.js
```

### Option 2: Manual (Through Supabase Dashboard) - **RECOMMENDED**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `backend/database/migrations/002_payment_holds.sql`
4. Copy the entire content
5. Paste into Supabase SQL Editor
6. Click **Run**

### Option 3: Using Supabase CLI

```bash
supabase db push
```

## Verification Steps

After running the migration, verify it worked:

1. **Check `invoices` table has new columns:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'invoices' 
   AND column_name IN ('amount_paid', 'balance_due', 'on_hold');
   ```

2. **Check `payment_transactions` table exists:**
   ```sql
   SELECT * FROM payment_transactions LIMIT 1;
   ```

3. **Check invoice status constraint:**
   ```sql
   SELECT constraint_name, check_clause 
   FROM information_schema.check_constraints 
   WHERE constraint_name = 'valid_invoice_status';
   ```

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Drop payment_transactions table
DROP TABLE IF EXISTS payment_transactions CASCADE;

-- Remove new columns from invoices
ALTER TABLE invoices 
  DROP COLUMN IF EXISTS amount_paid,
  DROP COLUMN IF EXISTS balance_due,
  DROP COLUMN IF EXISTS on_hold,
  DROP COLUMN IF EXISTS hold_reason,
  DROP COLUMN IF EXISTS hold_date,
  DROP COLUMN IF EXISTS payment_due_date;

-- Restore original status constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS valid_invoice_status;
ALTER TABLE invoices ADD CONSTRAINT valid_invoice_status 
  CHECK (status IN ('draft', 'pending', 'paid', 'cancelled', 'refunded'));
```

## Features Enabled After Migration

✅ **Partial Payments** - Accept partial payments, track balance  
✅ **Payment Holds** - Put invoices on hold for later payment  
✅ **Payment History** - View all payment transactions  
✅ **Outstanding Balance** - Query patient's unpaid invoices  
✅ **2 Invoice Limit** - Prevent patients from accumulating >2 unpaid invoices  
✅ **Payment Tracking** - Who processed payment, when, method used  

## Testing the Migration

After migration, test with:

```sql
-- Test: Create a test invoice
INSERT INTO invoices (patient_id, visit_id, total_amount, status, balance_due)
VALUES ('test-patient-id', 'test-visit-id', 100.00, 'pending', 100.00);

-- Test: Record a partial payment
INSERT INTO payment_transactions (invoice_id, amount, payment_method)
VALUES ('test-invoice-id', 50.00, 'cash');

-- Test: Query outstanding invoices
SELECT * FROM outstanding_invoices;

-- Clean up test data
DELETE FROM payment_transactions WHERE invoice_id = 'test-invoice-id';
DELETE FROM invoices WHERE id = 'test-invoice-id';
```

## Troubleshooting

### Error: "column already exists"
- **Solution:** Migration already ran successfully, no action needed

### Error: "relation payment_transactions does not exist"
- **Solution:** Run the migration SQL manually in Supabase SQL Editor

### Error: "permission denied"
- **Solution:** Make sure you're using SUPABASE_SERVICE_KEY, not SUPABASE_ANON_KEY

## Next Steps

After successful migration:

1. ✅ Update backend code (models, services, routes)
2. ✅ Update frontend components (cashier dashboard)
3. ✅ Test partial payment flow
4. ✅ Test payment hold flow
5. ✅ Test 2-invoice limit enforcement

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify your `.env` file has correct credentials
3. Try running SQL manually in Supabase SQL Editor
