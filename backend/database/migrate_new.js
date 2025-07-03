import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Database configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Test database connection
 */
async function testConnection() {
  console.log('🔗 Testing database connection...\n');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

/**
 * Run database schema
 */
async function runMigrations() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    console.log('📋 Please run the schema manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of backend/database/schema.sql');
    console.log('4. Click "Run"');
    console.log('\nOr copy the individual migration files from backend/database/migrations/\n');
    
    // List available migration files
    try {
      const migrationsDir = join(__dirname, 'migrations');
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();
      
      console.log('📋 Available migration files:');
      migrationFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
      console.log('\n📋 Available seed files:');
      const seedsDir = join(__dirname, 'seeds');
      const seedFiles = await fs.readdir(seedsDir);
      const sqlSeedFiles = seedFiles.filter(file => file.endsWith('.sql')).sort();
      
      sqlSeedFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
    } catch (err) {
      console.log('No migration files found in migrations directory');
    }
    
    console.log('\n✅ Migration setup completed!');
    console.log('💡 After running the SQL in Supabase, you can test with: npm run db:test');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🏥 RealCIS Database Migration Tool\n');
  console.log('=====================================\n');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  switch (command) {
    case 'migrate':
      await runMigrations();
      break;
    case 'test':
      await testConnection();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run db:migrate  - Show migration instructions');
      console.log('  npm run db:test     - Test database connection');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runMigrations, testConnection };
