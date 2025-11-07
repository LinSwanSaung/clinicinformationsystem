import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Audit Log Repository
 * Centralizes all direct Supabase access for audit_logs entity
 */

const ListOptions = z
  .object({
    limit: z.number().int().positive().max(200).default(50),
    offset: z.number().int().min(0).default(0),
    userId: z.string().uuid().nullable().optional(),
    action: z.string().nullable().optional(),
    entity: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  })
  .partial()
  .default({});

/**
 * Get audit logs with optional filters
 * @param {Object} options
 * @returns {Promise<{data: any[], total: number, limit: number, offset: number}>}
 */
export async function getAuditLogs(options = {}) {
  const opts = ListOptions.parse(options);
  let query = supabase
    .from('audit_logs')
    .select('*, user:user_id(first_name, last_name, email, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.userId) {
    query = query.eq('user_id', opts.userId);
  }
  if (opts.action) {
    query = query.eq('action', opts.action);
  }
  if (opts.entity) {
    query = query.eq('table_name', opts.entity);
  }
  if (opts.startDate) {
    query = query.gte('created_at', opts.startDate);
  }
  if (opts.endDate) {
    query = query.lte('created_at', opts.endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    limit: opts.limit,
    offset: opts.offset,
  };
}

/**
 * Get distinct actions from audit log
 * @returns {Promise<string[]>}
 */
export async function getDistinctActions() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action')
    .order('action', { ascending: true });

  if (error) {
    throw error;
  }

  const unique = [...new Set((data || []).map((r) => r.action))];
  return unique;
}

/**
 * Get distinct entities from audit log
 * @returns {Promise<string[]>}
 */
export async function getDistinctEntities() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('table_name')
    .order('table_name', { ascending: true });

  if (error) {
    throw error;
  }

  const unique = [...new Set((data || []).map((r) => r.table_name).filter(Boolean))];
  return unique;
}
