import {
  getAuditLogs as repoGetAuditLogs,
  getDistinctActions as repoGetDistinctActions,
  getDistinctEntities as repoGetDistinctEntities,
} from './repositories/AuditLogRepo.js';
import logger from '../config/logger.js';

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
    try {
      return await repoGetAuditLogs(options);
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  /**
   * Get distinct actions from audit log (for filter dropdown)
   */
  async getDistinctActions() {
    try {
      return await repoGetDistinctActions();
    } catch (error) {
      logger.error('Error fetching distinct actions:', error);
      return [];
    }
  }

  /**
   * Get distinct entities from audit log (for filter dropdown)
   */
  async getDistinctEntities() {
    try {
      return await repoGetDistinctEntities();
    } catch (error) {
      logger.error('Error fetching distinct entities:', error);
      return [];
    }
  }
}

export default new AuditLogService();
