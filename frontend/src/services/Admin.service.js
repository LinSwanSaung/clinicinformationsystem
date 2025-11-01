import api from './api';

class AdminService {
  /**
   * Get all pending items across modules that need admin attention
   * @returns {Promise<Array>} Array of pending items
   */
  async getPendingItems() {
    const response = await api.get('/admin/pending-items');
    // Backend returns array directly, not nested in data property
    return Array.isArray(response) ? response : (response.data || []);
  }

  /**
   * Override/resolve a pending record with admin authority
   * @param {Object} overrideData - Override data
   * @param {string} overrideData.entityType - Type of entity (visit, appointment, queue, billing)
   * @param {string} overrideData.entityId - ID of the entity to override
   * @param {string} overrideData.newStatus - New status to set
   * @param {string} overrideData.reason - Reason for the override
   * @returns {Promise<Object>} Override result
   */
  async overrideRecord({ entityType, entityId, newStatus, reason }) {
    const response = await api.post('/admin/override', {
      entityType,
      entityId,
      newStatus,
      reason
    });
    return response.data;
  }
}

const adminService = new AdminService();
export default adminService;