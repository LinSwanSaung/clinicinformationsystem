#!/usr/bin/env node

/**
 * Compare db/schema.sql and backend/database/schema.sql
 * to determine which one matches the current database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple .env locations
dotenv.config({ path: join(__dirname, '../../.env') });
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: join(__dirname, '../.env') });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function extractTables(schemaSQL) {
  const tableMatches = schemaSQL.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi);
  return Array.from(tableMatches, (m) => m[1].toLowerCase())
    .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
    .sort();
}

async function getDatabaseTables() {
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
    'payment_transactions',
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
      // Table doesn't exist
    }
  }

  return existingTables.sort();
}

async function compareSchemas() {
  console.log('🔍 Comparing schema files...\n');

  // Read both schema files
  const dbSchemaPath = join(__dirname, '../../db/schema.sql');
  const backendSchemaPath = join(__dirname, '../database/schema.sql');

  const dbSchema = readFileSync(dbSchemaPath, 'utf-8');
  const backendSchema = readFileSync(backendSchemaPath, 'utf-8');

  const dbTables = extractTables(dbSchema);
  const backendTables = extractTables(backendSchema);

  console.log(`📁 db/schema.sql:`);
  console.log(`   Tables: ${dbTables.length}`);
  console.log(`   Lines: ${dbSchema.split('\n').length}`);
  console.log(`   Size: ${(dbSchema.length / 1024).toFixed(2)} KB\n`);

  console.log(`📁 backend/database/schema.sql:`);
  console.log(`   Tables: ${backendTables.length}`);
  console.log(`   Lines: ${backendSchema.split('\n').length}`);
  console.log(`   Size: ${(backendSchema.length / 1024).toFixed(2)} KB\n`);

  // Get actual database tables
  console.log('📊 Querying database...');
  const dbActualTables = await getDatabaseTables();
  console.log(`   Database has ${dbActualTables.length} tables\n`);

  // Compare
  console.log('📋 Comparison Results:');
  console.log('─'.repeat(50));

  const dbMatch = dbTables.filter((t) => dbActualTables.includes(t));
  const backendMatch = backendTables.filter((t) => dbActualTables.includes(t));

  console.log(`\n✅ db/schema.sql matches: ${dbMatch.length}/${dbActualTables.length} tables`);
  console.log(`✅ backend/database/schema.sql matches: ${backendMatch.length}/${dbActualTables.length} tables`);

  const dbMissing = dbTables.filter((t) => !dbActualTables.includes(t));
  const backendMissing = backendTables.filter((t) => !dbActualTables.includes(t));
  const dbExtra = dbActualTables.filter((t) => !dbTables.includes(t));
  const backendExtra = dbActualTables.filter((t) => !backendTables.includes(t));

  if (dbMissing.length > 0) {
    console.log(`\n⚠️  db/schema.sql has tables not in database: ${dbMissing.join(', ')}`);
  }
  if (backendMissing.length > 0) {
    console.log(`\n⚠️  backend/database/schema.sql has tables not in database: ${backendMissing.join(', ')}`);
  }
  if (dbExtra.length > 0) {
    console.log(`\n⚠️  Database has tables not in db/schema.sql: ${dbExtra.join(', ')}`);
  }
  if (backendExtra.length > 0) {
    console.log(`\n⚠️  Database has tables not in backend/database/schema.sql: ${backendExtra.join(', ')}`);
  }

  // Recommendation
  console.log('\n' + '='.repeat(50));
  if (dbMatch.length === dbActualTables.length && backendMatch.length === dbActualTables.length) {
    console.log('✅ Both schemas match the database!');
    console.log('\n💡 Recommendation:');
    console.log('   - Use backend/database/schema.sql (closer to backend code)');
    console.log('   - Remove db/ folder or move it to docs/archive/');
  } else if (backendMatch.length > dbMatch.length) {
    console.log('✅ backend/database/schema.sql matches better!');
    console.log('\n💡 Recommendation: Use backend/database/schema.sql');
  } else if (dbMatch.length > backendMatch.length) {
    console.log('✅ db/schema.sql matches better!');
    console.log('\n💡 Recommendation: Move db/schema.sql to backend/database/');
  } else {
    console.log('⚠️  Both schemas have differences');
    console.log('\n💡 Recommendation: Compare manually and consolidate');
  }
}

compareSchemas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

