/**
 * Service for managing patient vitals
 */
import apiService from './api.js';

class VitalsService {
  /**
   * Save patient vitals
   */
  async saveVitals(patientId, vitalsData) {
    try {
      const payload = {
        ...vitalsData,
        patient_id: patientId  // Ensure patient_id is set correctly
      };
      
      const response = await apiService.post('/vitals', payload);
      return response;
    } catch (error) {
      console.error('VitalsService - Error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to save vitals');
    }
  }

  /**
   * Update patient vitals
   */
  async updateVitals(vitalsId, vitalsData) {
    try {
      const response = await apiService.put(`/vitals/${vitalsId}`, vitalsData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update vitals');
    }
  }

  /**
   * Get patient vitals history
   */
  async getPatientVitals(patientId) {
    try {
      const response = await apiService.get(`/vitals/patient/${patientId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch patient vitals');
    }
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestVitals(patientId) {
    try {
      const response = await apiService.get(`/vitals/patient/${patientId}/latest`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch latest vitals');
    }
  }

  /**
   * Get vitals for a specific visit
   */
  async getVisitVitals(visitId) {
    try {
      const response = await apiService.get(`/vitals/visit/${visitId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch visit vitals');
    }
  }

  /**
   * Get vitals for patient's current active visit
   */
  async getCurrentVisitVitals(patientId) {
    try {
      const response = await apiService.get(`/vitals/patient/${patientId}/current-visit`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch current visit vitals');
    }
  }
}

const vitalsService = new VitalsService();
export default vitalsService;