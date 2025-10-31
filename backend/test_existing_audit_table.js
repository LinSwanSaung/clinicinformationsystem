/**
 * Test script to verify audit logging with existing audit_logs table
 */
import { logAuditEvent } from './src/utils/auditLogger.js';
import { supabase } from './src/config/database.js';

// Get a test user ID from the database
async function getTestUserId() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'Admin')
    .limit(1)
    .single();
  
  if (error || !data) {
    console.log('⚠️  No admin user found. Testing with NULL user_id (system events).');
    return null;
  }
  
  console.log(`✅ Using test user ID: ${data.id}\n`);
  return data.id;
}

async function testAuditLogging() {
  console.log('🔍 Testing Audit Logging with existing audit_logs table...\n');
  
  // Get a test user ID
  const testUserId = await getTestUserId();

  // Test 1: Login Event
  console.log('Test 1: Logging LOGIN_SUCCESS event...');
  await logAuditEvent({
    userId: testUserId,
    role: 'doctor',
    action: 'LOGIN_SUCCESS',
    entity: 'auth',
    result: 'success',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    note: 'Test login'
  });

  // Test 2: Patient View Event
  console.log('Test 2: Logging VIEW event...');
  await logAuditEvent({
    userId: testUserId,
    role: 'nurse',
    action: 'VIEW',
    entity: 'patients',
    recordId: '00000000-0000-0000-0000-000000000002',
    patientId: '00000000-0000-0000-0000-000000000002',
    result: 'success',
    ip: '192.168.1.101'
  });

  // Test 3: Create Visit Event
  console.log('Test 3: Logging CREATE event...');
  await logAuditEvent({
    userId: testUserId,
    role: 'doctor',
    action: 'CREATE',
    entity: 'visits',
    recordId: '00000000-0000-0000-0000-000000000003',
    patientId: '00000000-0000-0000-0000-000000000002',
    result: 'success',
    meta: { visit_type: 'consultation' },
    ip: '192.168.1.100'
  });

  // Test 4: Failed Action
  console.log('Test 4: Logging failed DELETE event...');
  await logAuditEvent({
    userId: testUserId,
    role: 'admin',
    action: 'DELETE',
    entity: 'appointments',
    recordId: '00000000-0000-0000-0000-000000000004',
    result: 'error',
    note: 'Insufficient permissions',
    ip: '192.168.1.100'
  });

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify logs were inserted
  console.log('\n✅ Verifying logs were inserted...');
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching logs:', error);
  } else {
    console.log(`\n📋 Found ${data.length} recent audit log entries:`);
    data.forEach((log, idx) => {
      console.log(`\n${idx + 1}. ${log.action} on ${log.table_name}`);
      console.log(`   User ID: ${log.user_id || 'N/A'}`);
      console.log(`   Record ID: ${log.record_id}`);
      console.log(`   Result: ${log.new_values?.result || 'N/A'}`);
      console.log(`   IP: ${log.ip_address || 'N/A'}`);
      console.log(`   Time: ${log.created_at}`);
    });
  }

  console.log('\n✅ Test completed! Check the audit_logs table for entries.');
  process.exit(0);
}

testAuditLogging().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
