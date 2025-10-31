import api from './api';

/**
 * Visit Service for comprehensive visit history management
 */
class VisitService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate cache key for patient visit history
   */
  getCacheKey(patientId, options = {}) {
    const { includeCompleted = true, limit = 50, offset = 0 } = options;
    return `visit_history_${patientId}_${includeCompleted}_${limit}_${offset}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Get comprehensive patient visit history with caching
   */
  async getPatientVisitHistory(patientId, options = {}) {
    const cacheKey = this.getCacheKey(patientId, options);
    const cachedData = this.cache.get(cacheKey);

    // Return cached data if valid
    if (this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    try {
      const { 
        limit = 50, 
        offset = 0, 
        includeCompleted = true,
        includeInProgress = false
      } = options;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        includeCompleted: includeCompleted.toString(),
        includeInProgress: includeInProgress.toString()
      });

      const url = `/visits/patient/${patientId}/history?${params}`;
      const response = await api.get(url);
      
      // Handle different response structures
      let visitHistory;
      if (response.data && response.data.data) {
        // Standard API response format: {success: true, data: [...]}
        visitHistory = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        visitHistory = response.data;
      } else if (response.data && Array.isArray(response.data.visits)) {
        // Response with visits field
        visitHistory = response.data.visits;
      } else {
        // Fallback to empty array
        visitHistory = [];
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: visitHistory,
        timestamp: Date.now()
      });

      return visitHistory;
    } catch (error) {
      console.error('Error fetching patient visit history:', error);
      throw error;
    }
  }

  /**
   * Get single visit details
   */
  async getVisitDetails(visitId) {
    try {
      const response = await api.get(`/visits/${visitId}/details`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching visit details:', error);
      throw error;
    }
  }

  /**
   * Create new visit
   */
  async createVisit(visitData) {
    try {
      const response = await api.post('/visits', visitData);
      
      // Invalidate cache for this patient
      if (visitData.patient_id) {
        this.clearPatientCache(visitData.patient_id);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
  }

  /**
   * Update visit
   */
  async updateVisit(visitId, updateData) {
    try {
      const response = await api.put(`/visits/${visitId}`, updateData);
      
      // Invalidate cache for this patient
      if (updateData.patient_id) {
        this.clearPatientCache(updateData.patient_id);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  }

  /**
   * Complete visit with final calculations
   */
  async completeVisit(visitId, completionData = {}) {
    try {
      const response = await api.post(`/visits/${visitId}/complete`, completionData);
      
      // Invalidate cache if patient ID is available
      if (completionData.patient_id) {
        this.clearPatientCache(completionData.patient_id);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error completing visit:', error);
      throw error;
    }
  }

  /**
   * Get all visits with filtering (admin/doctor view)
   */
  async getAllVisits(options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        status, 
        doctor_id, 
        start_date, 
        end_date 
      } = options;

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (status) params.append('status', status);
      if (doctor_id) params.append('doctor_id', doctor_id);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);

      const response = await api.get(`/visits?${params}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all visits:', error);
      throw error;
    }
  }

  /**
   * Get visit statistics
   */
  async getVisitStatistics(options = {}) {
    try {
      const { doctor_id, start_date, end_date } = options;

      const params = new URLSearchParams();
      if (doctor_id) params.append('doctor_id', doctor_id);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);

      const response = await api.get(`/visits/statistics?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching visit statistics:', error);
      throw error;
    }
  }

  /**
   * Delete visit
   */
  async deleteVisit(visitId, patientId = null) {
    try {
      const response = await api.delete(`/visits/${visitId}`);
      
      // Invalidate cache for this patient if provided
      if (patientId) {
        this.clearPatientCache(patientId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }

  /**
   * Helper method to format visit data for display
   */
  formatVisitForDisplay(visit) {
    return {
      ...visit,
      formatted_date: this.formatDate(visit.visit_date),
      formatted_cost: this.formatCurrency(visit.total_cost),
      status_color: this.getStatusColor(visit.status),
      payment_status_color: this.getPaymentStatusColor(visit.payment_status)
    };
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get status color for badges
   */
  getStatusColor(status) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get payment status color for badges
   */
  getPaymentStatusColor(status) {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'insurance_pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Clear cache for specific patient
   */
  clearPatientCache(patientId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`visit_history_${patientId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.cache.clear();
  }
}

export const visitService = new VisitService();