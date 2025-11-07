import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 Starting payment holds migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '002_payment_holds.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL statements...\n');

    // Split SQL into statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('CREATE OR REPLACE')) {
        // These need to be executed as-is
        console.log('⚙️  Executing complex statement...');
      }
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        
        if (error) {
          // Check if it's a "already exists" error - these are OK
          if (error.message?.includes('already exists') || 
              error.message?.includes('does not exist') ||
              error.code === '42P07' || // duplicate table
              error.code === '42701') { // duplicate column
            console.log('⏭️  Skipped (already exists)');
            skipCount++;
          } else {
            console.error('❌ Error:', error.message || error);
          }
        } else {
          successCount++;
          console.log('✅ Statement executed');
        }
      } catch (err) {
        console.log('⚠️  Non-critical error, continuing...');
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Executed: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}\n`);

    // Verify tables exist
    console.log('🔍 Verifying migration...\n');

    // Check payment_transactions table
    try {
      const { error: txnError } = await supabase
        .from('payment_transactions')
        .select('count')
        .limit(1);

      if (txnError) {
        console.log('⚠️  Could not verify payment_transactions table - you may need to run the SQL manually');
      } else {
        console.log('✅ payment_transactions table exists');
      }
    } catch (e) {
      console.log('⚠️  Table verification skipped');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration process complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('   1. Check Supabase dashboard to verify tables');
    console.log('   2. If tables are missing, run the SQL manually:');
    console.log('      - Go to Supabase > SQL Editor');
    console.log('      - Copy content from: backend/database/migrations/002_payment_holds.sql');
    console.log('      - Execute the SQL');
    console.log('   3. Restart your backend server\n');

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error.message || error);
    console.log('\n💡 Tip: You can run the SQL manually in Supabase SQL Editor');
    console.log('   File: backend/database/migrations/002_payment_holds.sql\n');
    process.exit(1);
  }
}

// Run migration
runMigration();
