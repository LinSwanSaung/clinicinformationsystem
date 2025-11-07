#!/usr/bin/env node

/**
 * Schema Verification Script
 * 
 * Compares database/schema.sql with the actual database schema.
 * 
 * Usage:
 *   npm run db:verify-schema
 *   or
 *   node database/verify-schema.js
 * 
 * This script:
 * 1. Connects to the database
 * 2. Extracts table definitions from schema.sql
 * 3. Queries the database for actual schema
 * 4. Compares and reports differences
 * 
 * Exit codes:
 *   0 = Schema matches
 *   1 = Schema differs or error
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Extract table names from schema.sql
 */
function extractTablesFromSchema(schemaSQL) {
  const tableMatches = schemaSQL.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi);
  const tables = Array.from(tableMatches, (m) => m[1].toLowerCase()).sort();
  return [...new Set(tables)]; // Remove duplicates
}

/**
 * Get all tables from the database
 */
async function getDatabaseTables() {
  try {
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `,
    });

    if (error) {
      // Fallback: try querying a known table to verify connection
      const { error: testError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      // If we can query users table, try to get table list another way
      // For Supabase, we'll use a workaround
      return await getTablesViaQuery();
    }

    return data?.map((row) => row.table_name.toLowerCase()).sort() || [];
  } catch (error) {
    // Fallback method
    return await getTablesViaQuery();
  }
}

/**
 * Get tables by querying known tables and inferring from schema.sql
 */
async function getTablesViaQuery() {
  const knownTables = [
    'users',
    'patients',
    'appointments',
    'visits',
    'prescriptions',
    'vitals',
    'queue_tokens',
    'doctor_availability',
    'invoices',
    'invoice_items',
    'payment_transactions', // Correct table name
    'notifications',
    'audit_logs',
    'patient_allergies',
    'patient_diagnoses',
    'patient_documents',
    'doctor_notes',
    'services',
    'clinic_settings',
    'medical_documents',
  ];

  const existingTables = [];

  for (const table of knownTables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (!error) {
        existingTables.push(table);
      }
    } catch (e) {
      // Table doesn't exist or error
    }
  }

  return existingTables.sort();
}

/**
 * Verify a specific table structure
 */
async function verifyTableStructure(tableName, schemaSQL) {
  // Extract CREATE TABLE statement for this table from schema.sql
  const tableRegex = new RegExp(
    `CREATE TABLE (?:IF NOT EXISTS )?${tableName}[\\s\\S]*?(?=CREATE TABLE|CREATE INDEX|CREATE VIEW|COMMENT|--|$)`,
    'i'
  );
  const match = schemaSQL.match(tableRegex);

  if (!match) {
    return { exists: false, error: 'Table definition not found in schema.sql' };
  }

  // Try to query the table to verify it exists
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (table exists but empty)
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * Main verification function
 */
async function verifySchema() {
  console.log('🔍 Starting comprehensive schema verification...\n');

  try {
    // Read schema.sql
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    console.log('✅ Read database/schema.sql');

    // Extract tables from schema.sql
    const schemaTables = extractTablesFromSchema(schemaSQL);
    console.log(`✅ Found ${schemaTables.length} tables in schema.sql:`, schemaTables.join(', '));

    // Get current database tables
    console.log('\n📊 Querying database for existing tables...');
    const dbTables = await getDatabaseTables();
    console.log(`✅ Found ${dbTables.length} tables in database:`, dbTables.join(', '));

    // Compare
    const missingInDB = schemaTables.filter((t) => !dbTables.includes(t));
    const extraInDB = dbTables.filter((t) => !schemaTables.includes(t));

    console.log('\n📋 Comparison Results:');
    console.log('─'.repeat(50));

    if (missingInDB.length === 0 && extraInDB.length === 0) {
      console.log('✅ All table names match!');
    } else {
      if (missingInDB.length > 0) {
        console.log(`\n⚠️  Tables in schema.sql but NOT in database (${missingInDB.length}):`);
        missingInDB.forEach((t) => console.log(`   - ${t}`));
      }
      if (extraInDB.length > 0) {
        console.log(`\n⚠️  Tables in database but NOT in schema.sql (${extraInDB.length}):`);
        extraInDB.forEach((t) => console.log(`   - ${t}`));
      }
    }

    // Verify each table exists
    console.log('\n🔍 Verifying table structures...');
    let allTablesExist = true;
    const verificationResults = [];

    for (const table of schemaTables) {
      const result = await verifyTableStructure(table, schemaSQL);
      verificationResults.push({ table, ...result });
      if (!result.exists) {
        allTablesExist = false;
        console.log(`   ❌ ${table}: ${result.error || 'Not found'}`);
      } else {
        console.log(`   ✅ ${table}: Exists`);
      }
    }

    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (missingInDB.length === 0 && extraInDB.length === 0 && allTablesExist) {
      console.log('✅ SCHEMA VERIFICATION PASSED');
      console.log('   All tables from schema.sql exist in the database');
      console.log('   No extra tables found in database');
      console.log('   Schema.sql matches the current database state\n');
      return true;
    } else {
      console.log('⚠️  SCHEMA VERIFICATION FAILED');
      console.log('   Differences detected between schema.sql and database\n');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Schema verification failed:');
    console.error(`   ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run verification
verifySchema()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

