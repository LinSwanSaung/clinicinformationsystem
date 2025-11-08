import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Log an audit event with enhanced tracking
 * Supports the full audit trail recommended for healthcare compliance
 */
export async function logAuditEvent({
  userId = null,
  actor_id = null,
  role = null,
  actor_role = null,
  action,
  entity = null,
  entity_type = null,
  recordId = null,
  entity_id = null,
  old_values = null,
  new_values = null,
  status = 'success',
  reason = null,
  ip = null,
  userAgent = null,
  // Legacy parameters for backward compatibility
  patientId = null,
  result = null,
  meta = null,
  note = null
}) {
  try {
    const insert = {
      table_name: entity_type || entity || 'system',
      record_id: entity_id || recordId || '00000000-0000-0000-0000-000000000000',
      action: action,
      old_values: old_values,
      new_values: new_values || {
        // For backward compatibility, wrap legacy fields
        ...(result && { result }),
        ...(patientId && { patient_id: patientId }),
        ...(meta && { meta }),
        ...(note && { note })
      },
      user_id: actor_id || userId,
      actor_role: actor_role || role,
      status: status,
      reason: reason || note,
      ip_address: ip || null,
      user_agent: userAgent || null
    };

    const { error } = await supabase.from('audit_logs').insert(insert);
    if (error) {
      logger.error('[AUDIT] Failed to insert audit log:', error.message || error);
    }
  } catch (err) {
    logger.error('[AUDIT] Logging error:', err?.message || err);
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
