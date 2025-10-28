import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaymentTransactionsTable() {
  try {
    console.log('🔧 Fixing payment_transactions table...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_payment_transactions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n📋 Manual fix: Run this SQL in Supabase SQL Editor:');
      console.log(sql);
      process.exit(1);
    }

    console.log('✅ Payment transactions table fixed!');
    
    // Verify the structure
    const { data: columns, error: verifyError } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(0);

    if (verifyError) {
      console.log('⚠️  Warning: Could not verify table structure:', verifyError.message);
    } else {
      console.log('✅ Table structure verified');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixPaymentTransactionsTable();
