import { seedDummyAuditLogs } from '../src/utils/auditLogger.js';

/**
 * Simple script to seed dummy audit logs for testing
 * Run: node backend/test_audit_logging.js
 */

(async () => {
  console.log('🔍 Seeding dummy audit logs...');
  try {
    await seedDummyAuditLogs();
    console.log('✅ Dummy audit logs inserted successfully!');
    console.log('📝 Check the audit_log table in your database or visit /admin/audit-logs in the app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed audit logs:', error.message || error);
    process.exit(1);
  }
})();
