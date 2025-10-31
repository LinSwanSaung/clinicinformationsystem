/**
 * Quick script to check all audit logs and see what's being logged
 */
import { supabase } from './src/config/database.js';

async function checkLogs() {
  console.log('🔍 Checking audit_logs table...\n');
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log(`Found ${data.length} audit log entries:\n`);
  
  // Group by action
  const byAction = {};
  data.forEach(log => {
    const action = log.action || 'unknown';
    if (!byAction[action]) byAction[action] = 0;
    byAction[action]++;
  });
  
  console.log('📊 Summary by Action:');
  Object.entries(byAction).forEach(([action, count]) => {
    console.log(`   ${action}: ${count}`);
  });
  
  console.log('\n📋 Recent 10 entries:');
  data.slice(0, 10).forEach((log, idx) => {
    console.log(`\n${idx + 1}. ${log.action} on ${log.table_name}`);
    console.log(`   User ID: ${log.user_id || 'SYSTEM'}`);
    console.log(`   Record ID: ${log.record_id}`);
    console.log(`   Created: ${log.created_at}`);
    if (log.new_values) {
      console.log(`   Meta: ${JSON.stringify(log.new_values, null, 2)}`);
    }
  });
  
  process.exit(0);
}

checkLogs();
