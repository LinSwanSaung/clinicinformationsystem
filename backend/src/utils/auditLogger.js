import { supabase } from '../config/database.js';

/**
 * Log an audit event. This function is non-blocking and failure-safe.
 * Maps application events to the existing audit_logs table structure.
 * 
 * Note: The existing audit_logs table is designed for INSERT/UPDATE/DELETE actions
 * with old_values/new_values. We map application actions (LOGIN, CREATE, UPDATE, etc.)
 * by storing extra context in new_values field.
 * 
 * VIEW actions are intentionally NOT logged to avoid excessive audit log entries.
 */
export async function logAuditEvent({
  userId = null,
  role = null,
  action,
  entity = null,
  recordId = null,
  patientId = null,
  result = null,
  meta = null,
  ip = null,
  note = null,
  userAgent = null
}) {
  try {
    // Map to existing audit_logs table structure
    // We'll use new_values to store our event context
    const insert = {
      table_name: entity || 'system',
      record_id: recordId || '00000000-0000-0000-0000-000000000000', // Required field
      action: action, // Can be extended beyond INSERT/UPDATE/DELETE
      old_values: null, // Not applicable for events like LOGIN, VIEW
      new_values: {
        role,
        result,
        patient_id: patientId,
        meta,
        note,
        event_type: action // Store original action
      },
      user_id: userId,
      ip_address: ip || null,
      user_agent: userAgent || null
    };

    // Insert asynchronously but don't await at call sites if you want fire-and-forget.
    const { error } = await supabase.from('audit_logs').insert(insert);
    if (error) {
      console.error('[AUDIT] Failed to insert audit log:', error.message || error);
    }
  } catch (err) {
    // Fail silently
    console.error('[AUDIT] Logging error:', err?.message || err);
  }
}

/**
 * Helper to seed dummy audit logs for testing
 */
export async function seedDummyAuditLogs() {
  const samples = [
    { action: 'LOGIN_SUCCESS', role: 'doctor', note: 'seeded' },
    { action: 'VIEW', entity: 'patients', role: 'nurse', note: 'seeded' },
    { action: 'CREATE', entity: 'visits', role: 'doctor', note: 'seeded' }
  ];
  for (const s of samples) {
    try { await logAuditEvent(s); } catch (e) { /* ignore */ }
  }
}

export default { logAuditEvent, seedDummyAuditLogs };
