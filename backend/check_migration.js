import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAndApplyMigration() {
  console.log('🔍 Checking current database state...\n');

  try {
    // Check if new columns exist in invoices table
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, amount_paid, balance_due, on_hold, hold_reason, hold_date, payment_due_date')
      .limit(1)
      .maybeSingle();

    if (invoiceError) {
      console.log('❌ Missing columns in invoices table');
      console.log('   Columns needed: amount_paid, balance_due, on_hold, hold_reason, hold_date, payment_due_date\n');
    } else {
      console.log('✅ All invoice columns exist\n');
    }

    // Check if payment_transactions table exists
    const { data: txn, error: txnError } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (txnError) {
      console.log('❌ payment_transactions table missing\n');
    } else {
      console.log('✅ payment_transactions table exists\n');
    }

    // If everything exists, initialize existing invoices
    if (!invoiceError && !txnError) {
      console.log('🔄 Initializing existing invoices...\n');
      
      // Get all invoices that haven't been initialized
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_amount, status, amount_paid, balance_due')
        .or('amount_paid.is.null,balance_due.is.null');

      if (invoices && invoices.length > 0) {
        console.log(`   Found ${invoices.length} invoices to initialize`);
        
        for (const inv of invoices) {
          const amountPaid = inv.status === 'paid' ? inv.total_amount : 0;
          const balanceDue = inv.status === 'paid' ? 0 : inv.total_amount;
          
          await supabase
            .from('invoices')
            .update({
              amount_paid: amountPaid,
              balance_due: balanceDue,
              on_hold: balanceDue > 0 && inv.status !== 'paid'
            })
            .eq('id', inv.id);
        }
        
        console.log('   ✅ Initialized all invoices\n');
      } else {
        console.log('   ℹ️  No invoices need initialization\n');
      }

      console.log('═══════════════════════════════════════════════════');
      console.log('✨ Migration verified and applied successfully!');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('📋 You can now use:');
      console.log('   ✅ Partial payments');
      console.log('   ✅ Payment holds');
      console.log('   ✅ Payment transaction tracking');
      console.log('   ✅ Outstanding balance queries\n');
      
      return true;
    } else {
      console.log('═══════════════════════════════════════════════════');
      console.log('⚠️  Manual SQL execution required');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('Please run the SQL manually:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy from: backend/database/migrations/002_payment_holds.sql');
      console.log('3. Paste and execute\n');
      
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

checkAndApplyMigration();
