import api from '@/services/api';
import logger from '@/utils/logger';

/**
 * Enhanced Diagnosis Service with caching and performance optimizations
 */
class DiagnosisService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate cache key for patient diagnoses
   */
  getCacheKey(patientId, includeResolved = false) {
    return `diagnoses_${patientId}_${includeResolved}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  /**
   * Get all diagnoses for a patient with caching
   */
  async getDiagnosesByPatient(patientId, includeResolved = false) {
    const cacheKey = this.getCacheKey(patientId, includeResolved);
    const cachedData = this.cache.get(cacheKey);

    // Return cached data if valid
    if (this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    try {
      const response = await api.get(`/patient-diagnoses/patient/${patientId}`, {
        params: { includeResolved },
      });
      const diagnoses = response.data.data || response.data;

      // Cache the results
      this.cache.set(cacheKey, {
        data: diagnoses,
        timestamp: Date.now(),
      });

      return diagnoses;
    } catch (error) {
      logger.error('Error fetching patient diagnoses:', error);
      throw error;
    }
  }

  /**
   * Get diagnoses for a visit
   */
  async getDiagnosesByVisit(visitId) {
    try {
      const response = await api.get(`/patient-diagnoses/visit/${visitId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching visit diagnoses:', error);
      throw error;
    }
  }

  /**
   * Get diagnosis by ID
   */
  async getDiagnosisById(id) {
    try {
      const response = await api.get(`/patient-diagnoses/${id}`);
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching diagnosis:', error);
      throw error;
    }
  }

  /**
   * Create new diagnosis with cache invalidation
   */
  async createDiagnosis(diagnosisData) {
    try {
      const response = await api.post('/patient-diagnoses', diagnosisData);

      // Invalidate cache for this patient
      if (diagnosisData.patient_id) {
        this.clearPatientCache(diagnosisData.patient_id);
      }

      return response.data.data;
    } catch (error) {
      logger.error('Error creating diagnosis:', error);
      throw error;
    }
  }

  /**
   * Update diagnosis with cache invalidation
   */
  async updateDiagnosis(id, diagnosisData) {
    try {
      const response = await api.put(`/patient-diagnoses/${id}`, diagnosisData);

      // Invalidate cache for this patient
      if (diagnosisData.patient_id) {
        this.clearPatientCache(diagnosisData.patient_id);
      }

      return response.data.data;
    } catch (error) {
      logger.error('Error updating diagnosis:', error);
      throw error;
    }
  }

  /**
   * Update diagnosis status with cache invalidation
   */
  async updateDiagnosisStatus(id, status, resolvedDate = null, patientId = null) {
    try {
      const response = await api.patch(`/patient-diagnoses/${id}/status`, {
        status,
        resolved_date: resolvedDate,
      });

      // Invalidate cache for this patient if provided
      if (patientId) {
        this.clearPatientCache(patientId);
      }

      return response.data.data;
    } catch (error) {
      logger.error('Error updating diagnosis status:', error);
      throw error;
    }
  }

  /**
   * Delete diagnosis with cache invalidation
   */
  async deleteDiagnosis(id, patientId = null) {
    try {
      const response = await api.delete(`/patient-diagnoses/${id}`);

      // Invalidate cache for this patient if provided
      if (patientId) {
        this.clearPatientCache(patientId);
      }

      return response.data;
    } catch (error) {
      logger.error('Error deleting diagnosis:', error);
      throw error;
    }
  }

  /**
   * Get all active diagnoses (across all patients)
   */
  async getAllActiveDiagnoses() {
    try {
      const response = await api.get('/patient-diagnoses/active/all');
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching active diagnoses:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific patient (both resolved and unresolved)
   */
  clearPatientCache(patientId) {
    const cacheKeyActive = this.getCacheKey(patientId, false);
    const cacheKeyAll = this.getCacheKey(patientId, true);
    this.cache.delete(cacheKeyActive);
    this.cache.delete(cacheKeyAll);
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.cache.clear();
  }
}

export const diagnosisService = new DiagnosisService();
