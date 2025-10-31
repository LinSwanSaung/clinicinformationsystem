import { supabase } from '../config/database.js';

/**
 * Audit Log Service
 * Provides methods to query audit logs for admin viewing
 */
class AuditLogService {
  /**
   * Get recent audit logs with optional filters
   * @param {Object} options - Filter options
   * @param {number} options.limit - Max rows to return (default 50)
   * @param {number} options.offset - Skip first N rows (default 0)
   * @param {string} options.userId - Filter by user ID
   * @param {string} options.action - Filter by action
   * @param {string} options.entity - Filter by entity
   * @param {string} options.startDate - Filter by start date ISO string
   * @param {string} options.endDate - Filter by end date ISO string
   * @returns {Promise<Object>} Result with { data, total, limit, offset }
   */
  async getAuditLogs(options = {}) {
    const {
      limit = 50,
      offset = 0,
      userId = null,
      action = null,
      entity = null,
      startDate = null,
      endDate = null
    } = options;

    let query = supabase
      .from('audit_logs')
      .select('*, user:user_id(first_name, last_name, email, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (entity) {
      query = query.eq('table_name', entity);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      limit,
      offset
    };
  }

  /**
   * Get distinct actions from audit log (for filter dropdown)
   */
  async getDistinctActions() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action')
      .order('action', { ascending: true });

    if (error) {
      console.error('Error fetching distinct actions:', error);
      return [];
    }

    // Extract unique actions
    const unique = [...new Set((data || []).map(r => r.action))];
    return unique;
  }

  /**
   * Get distinct entities from audit log (for filter dropdown)
   */
  async getDistinctEntities() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('table_name')
      .order('table_name', { ascending: true });

    if (error) {
      console.error('Error fetching distinct entities:', error);
      return [];
    }

    const unique = [...new Set((data || []).map(r => r.table_name).filter(Boolean))];
    return unique;
  }
}

export default new AuditLogService();
