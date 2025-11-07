import api from '@/services/api';

/**
 * Enhanced Allergy Service with caching and performance optimizations
 */
class AllergyService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate cache key for patient allergies
   */
  getCacheKey(patientId) {
    return `allergies_${patientId}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  /**
   * Get all allergies for a patient with caching
   */
  async getAllergiesByPatient(patientId) {
    const cacheKey = this.getCacheKey(patientId);
    const cachedData = this.cache.get(cacheKey);

    // Return cached data if valid
    if (this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    try {
      const response = await api.get(`/patient-allergies/patient/${patientId}`);
      const allergies = response.data.data || response.data;

      // Cache the results
      this.cache.set(cacheKey, {
        data: allergies,
        timestamp: Date.now()
      });

      return allergies;
    } catch (error) {
      console.error('Error fetching patient allergies:', error);
      throw error;
    }
  }

  /**
   * Get allergy by ID
   */
  async getAllergyById(id) {
    try {
      const response = await api.get(`/patient-allergies/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching allergy:', error);
      throw error;
    }
  }

  /**
   * Create new allergy with cache invalidation
   */
  async createAllergy(allergyData) {
    try {
      const response = await api.post('/patient-allergies', allergyData);
      
      // Invalidate cache for this patient
      if (allergyData.patient_id) {
        this.clearPatientCache(allergyData.patient_id);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating allergy:', error);
      throw error;
    }
  }

  /**
   * Update allergy with cache invalidation
   */
  async updateAllergy(id, allergyData) {
    try {
      const response = await api.put(`/patient-allergies/${id}`, allergyData);
      
      // Invalidate cache for this patient
      if (allergyData.patient_id) {
        this.clearPatientCache(allergyData.patient_id);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating allergy:', error);
      throw error;
    }
  }

  /**
   * Delete allergy with cache invalidation
   */
  async deleteAllergy(id, patientId = null) {
    try {
      const response = await api.delete(`/patient-allergies/${id}`);
      
      // Invalidate cache for this patient if provided
      if (patientId) {
        this.clearPatientCache(patientId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting allergy:', error);
      throw error;
    }
  }

  /**
   * Get all active allergies (across all patients)
   */
  async getAllActiveAllergies() {
    try {
      const response = await api.get('/patient-allergies/active/all');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching active allergies:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific patient
   */
  clearPatientCache(patientId) {
    const cacheKey = this.getCacheKey(patientId);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.cache.clear();
  }
}

export const allergyService = new AllergyService();
