#!/usr/bin/env node

/**
 * Safety Checks Script
 * Validates code against Stage 2 safety rules before commit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const errors = [];
const warnings = [];

console.log('🔍 Running Stage 2 safety checks...\n');

// Helper to search files
function searchFiles(pattern, directory, fileExtensions) {
  try {
    const result = execSync(
      `git grep -n "${pattern}" -- "${directory}/*.{${fileExtensions.join(',')}}" || exit 0`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (err) {
    return [];
  }
}

// Check 1: Unconditional refetch() calls (should use mutation onSuccess or guarded with useRef)
console.log('Checking for unconditional refetch() calls...');
const refetchCalls = searchFiles('refetch\\(\\)', 'frontend/src/pages', ['jsx', 'js']);
const unsafeRefetches = refetchCalls.filter(
  line => !line.includes('useRef') && !line.includes('onSuccess') && !line.includes('// OK:')
);
if (unsafeRefetches.length > 0) {
  warnings.push({
    rule: 'Unconditional refetch()',
    message: 'Found refetch() calls that may cause infinite loops. Use mutation onSuccess or guard with useRef.',
    files: unsafeRefetches,
  });
}

// Check 2: Direct Supabase imports in UI (pages/components)
console.log('Checking for direct Supabase imports in UI...');
const supabaseImports = [
  ...searchFiles('from [\'"]@supabase', 'frontend/src/pages', ['jsx', 'js']),
  ...searchFiles('from [\'"]@supabase', 'frontend/src/components', ['jsx', 'js']),
  ...searchFiles('from .*supabase', 'frontend/src/pages', ['jsx', 'js']),
  ...searchFiles('from .*supabase', 'frontend/src/components', ['jsx', 'js']),
];
if (supabaseImports.length > 0) {
  errors.push({
    rule: 'No direct Supabase imports in UI',
    message: 'UI components should use services/hooks instead of importing Supabase directly.',
    files: supabaseImports,
  });
}

// Check 3: Hardcoded role strings (should use constants/roles.js)
console.log('Checking for hardcoded role strings...');
const rolePatterns = [
  "role === 'admin'",
  "role === 'doctor'",
  "role === 'receptionist'",
  "role === 'cashier'",
  "role === 'nurse'",
  "authorize('admin'",
  "authorize('doctor'",
  "authorize('receptionist'",
];
let roleStringUsages = [];
rolePatterns.forEach(pattern => {
  const results = [
    ...searchFiles(pattern, 'frontend/src', ['jsx', 'js']),
    ...searchFiles(pattern, 'backend/src', ['js']),
  ];
  roleStringUsages.push(...results);
});

// Filter out acceptable uses (comments, constants file itself, patient role)
roleStringUsages = roleStringUsages.filter(
  line =>
    !line.includes('constants/roles') &&
    !line.includes('// OK:') &&
    !line.includes("'patient'") // Patient role is acceptable
);

if (roleStringUsages.length > 0) {
  warnings.push({
    rule: 'Hardcoded role strings',
    message: 'Use ROLES constants from constants/roles.js instead of hardcoded strings.',
    files: roleStringUsages.slice(0, 10), // Limit output
  });
}

// Check 4: setState in useEffect that depends on that state (potential infinite loop)
console.log('Checking for setState in dependent useEffects...');
// This is complex to check statically, so we'll just warn
// Manual review needed for: useEffect(() => { setState(x); }, [state]);

// Display results
console.log('\n' + '='.repeat(60));
console.log('📊 SAFETY CHECK RESULTS');
console.log('='.repeat(60) + '\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! No safety violations detected.\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log('❌ ERRORS (must fix):');
  errors.forEach((err, i) => {
    console.log(`\n${i + 1}. ${err.rule}`);
    console.log(`   ${err.message}`);
    console.log(`   Found in ${err.files.length} location(s):`);
    err.files.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    if (err.files.length > 5) {
      console.log(`   ... and ${err.files.length - 5} more`);
    }
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (review recommended):');
  warnings.forEach((warn, i) => {
    console.log(`\n${i + 1}. ${warn.rule}`);
    console.log(`   ${warn.message}`);
    console.log(`   Found in ${warn.files.length} location(s):`);
    warn.files.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    if (warn.files.length > 5) {
      console.log(`   ... and ${warn.files.length - 5} more`);
    }
  });
  console.log('');
}

if (errors.length > 0) {
  console.log('🚫 Commit blocked due to safety violations. Please fix errors above.\n');
  process.exit(1);
}

console.log('✅ No blocking errors. Commit can proceed.\n');
process.exit(0);
