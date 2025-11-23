import api from '@/services/api';

class AnalyticsService {
  /**
   * Get revenue trends for a date range
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getRevenueTrends(params) {
    const response = await api.get('/analytics/revenue-trends', { params });
    return response.data;
  }

  /**
   * Get visit status breakdown
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getVisitStatusBreakdown(params) {
    const response = await api.get('/analytics/visit-status', { params });
    return response.data;
  }

  /**
   * Get top doctors by visits and revenue
   * @param {Object} params - { limit, startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getTopDoctors(params) {
    const response = await api.get('/analytics/top-doctors', { params });
    return response.data;
  }

  /**
   * Get payment methods breakdown
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getPaymentMethodsBreakdown(params) {
    const response = await api.get('/analytics/payment-methods', { params });
    return response.data;
  }

  /**
   * Export DHIS2 CSV data for a month
   * @param {Object} params - { year, month }
   * @returns {Promise<Object>}
   */
  async exportDHIS2CSV(params) {
    const response = await api.get('/analytics/dhis2-export', { params });
    return response.data;
  }
}

export default new AnalyticsService();
