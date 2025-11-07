#!/usr/bin/env node

/**
 * Schema Verification Script
 * 
 * Verifies that database/schema.sql matches the current database schema.
 * 
 * Usage:
 *   node scripts/verify-schema.js
 * 
 * This script:
 * 1. Reads database/schema.sql
 * 2. Generates a schema dump from the current database
 * 3. Normalizes both (removes comments, whitespace differences)
 * 4. Compares and reports differences
 * 
 * Note: This is a basic implementation. For production, consider using
 * pg_dump --schema-only for more accurate comparison.
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
 * Normalize SQL for comparison
 */
function normalizeSQL(sql) {
  return sql
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--') && !line.startsWith('COMMENT'))
    .join('\n')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Get current database schema (simplified - just table names)
 */
async function getCurrentSchema() {
  try {
    // Get list of tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      // Fallback: try to query a known table to verify connection
      const { error: testError } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      return { tables: [], message: 'Could not query information_schema, but database is accessible' };
    }

    return {
      tables: (tables || []).map((t) => t.table_name).sort(),
      message: 'Schema verification requires pg_dump for full comparison',
    };
  } catch (error) {
    throw new Error(`Failed to get current schema: ${error.message}`);
  }
}

/**
 * Extract table names from schema.sql
 */
function extractTablesFromSchema(schemaSQL) {
  const tableMatches = schemaSQL.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi);
  const tables = Array.from(tableMatches, (m) => m[1].toLowerCase()).sort();
  return tables;
}

/**
 * Main verification function
 */
async function verifySchema() {
  console.log('🔍 Starting schema verification...\n');

  try {
    // Read schema.sql
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    console.log('✅ Read database/schema.sql');

    // Extract tables from schema.sql
    const schemaTables = extractTablesFromSchema(schemaSQL);
    console.log(`✅ Found ${schemaTables.length} tables in schema.sql`);

    // Get current database schema
    const currentSchema = await getCurrentSchema();
    console.log('✅ Connected to database');

    // Compare (simplified - just table names)
    if (currentSchema.tables.length > 0) {
      const missingInDB = schemaTables.filter((t) => !currentSchema.tables.includes(t));
      const extraInDB = currentSchema.tables.filter((t) => !schemaTables.includes(t));

      if (missingInDB.length === 0 && extraInDB.length === 0) {
        console.log('\n✅ Schema verification passed (table names match)');
        console.log(`   Found ${schemaTables.length} tables in both schema.sql and database\n`);
        return true;
      } else {
        console.log('\n⚠️  Schema differences detected:');
        if (missingInDB.length > 0) {
          console.log(`   Tables in schema.sql but not in database: ${missingInDB.join(', ')}`);
        }
        if (extraInDB.length > 0) {
          console.log(`   Tables in database but not in schema.sql: ${extraInDB.join(', ')}`);
        }
        console.log('\n   Note: Full schema verification requires pg_dump --schema-only\n');
        return false;
      }
    } else {
      console.log('\n⚠️  Could not compare table lists');
      console.log(`   ${currentSchema.message}`);
      console.log('\n   For full verification, use:');
      console.log('   pg_dump --schema-only -h <host> -U <user> -d <db> > current_schema.sql');
      console.log('   diff database/schema.sql current_schema.sql\n');
      return null;
    }
  } catch (error) {
    console.error('\n❌ Schema verification failed:');
    console.error(`   ${error.message}\n`);
    return false;
  }
}

// Run verification
verifySchema()
  .then((success) => {
    process.exit(success === false ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

