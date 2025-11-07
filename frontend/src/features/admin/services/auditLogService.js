import api from '@/services/api';
import logger from '@/utils/logger';

/**
 * Audit Log Service
 * Handles API calls for audit log viewing
 */
class AuditLogService {
  /**
   * Get audit logs with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Result with data, total, pagination
   */
  async getAuditLogs(params = {}) {
    try {
      const response = await api.get('/audit-logs', { params });
      return response;
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get filter options (distinct actions and entities)
   * @returns {Promise<Object>} Object with { actions: [], entities: [] }
   */
  async getFilterOptions() {
    try {
      const response = await api.get('/audit-logs/filters');
      return response?.data || { actions: [], entities: [] };
    } catch (error) {
      logger.error('Error fetching filter options:', error);
      return { actions: [], entities: [] };
    }
  }
}

export default new AuditLogService();
