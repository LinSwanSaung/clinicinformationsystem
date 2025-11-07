/**
 * Test creating a visit and check if audit logging works
 */
import { logAuditEvent } from './src/utils/auditLogger.js';

async function testVisitLogging() {
  console.log('🔍 Testing visit audit logging...\n');
  
  // Simulate a visit creation with real structure
  const visitId = '12345678-1234-1234-1234-123456789abc';
  const patientId = '87654321-4321-4321-4321-cba987654321';
  const userId = '9f9a0e4f-b33b-4b41-ae13-3dce86c72f5a'; // Admin user from logs
  
  console.log('Logging CREATE visit event...');
  await logAuditEvent({
    userId: userId,
    role: 'doctor',
    action: 'CREATE',
    entity: 'visits',
    recordId: visitId,
    patientId: patientId,
    result: 'success',
    ip: '127.0.0.1',
    meta: { test: true }
  });
  
  console.log('✅ Logging call completed (check for errors above)');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n✅ Test completed!');
  process.exit(0);
}

testVisitLogging().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
