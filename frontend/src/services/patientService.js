import apiService from './api.js';

// For now, using mock data until backend is connected
// TODO: Replace with actual API calls when backend is ready

// Import mock data locally for development
import { nursePatients, patients, doctorPatients } from '../data/mockData.js';

class PatientService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  // Get all patients for nurse dashboard
  async getNursePatients() {
    if (this.isDevelopment) {
      // Return dummy data for development
      return Promise.resolve({
        success: true,
        data: nursePatients
      });
    }
    
    try {
      const response = await apiService.get('/patients/nurse');
      return response;
    } catch (error) {
      console.error('Failed to fetch nurse patients:', error);
      throw error;
    }
  }

  // Get all patients for doctor dashboard
  async getDoctorPatients() {
    if (this.isDevelopment) {
      // Return dummy data for development
      return Promise.resolve({
        success: true,
        data: doctorPatients
      });
    }
    
    try {
      const response = await apiService.get('/patients/doctor');
      return response;
    } catch (error) {
      console.error('Failed to fetch doctor patients:', error);
      throw error;
    }
  }

  // Get all patients for receptionist dashboard
  async getReceptionistPatients() {
    if (this.isDevelopment) {
      // Return dummy data for development
      return Promise.resolve({
        success: true,
        data: patients
      });
    }
    
    try {
      const response = await apiService.get('/patients/receptionist');
      return response;
    } catch (error) {
      console.error('Failed to fetch receptionist patients:', error);
      throw error;
    }
  }

  // Get all patients
  async getAllPatients() {
    if (this.isDevelopment) {
      // Return dummy data for development
      return Promise.resolve(patients);
    }
    
    try {
      const response = await apiService.get('/patients');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all patients:', error);
      throw error;
    }
  }

  // Update patient vitals
  async updatePatientVitals(patientId, vitals) {
    if (this.isDevelopment) {
      console.log('Development mode: Updated vitals for patient', patientId, vitals);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.put(`/patients/${patientId}/vitals`, vitals);
      return response;
    } catch (error) {
      console.error('Failed to update patient vitals:', error);
      throw error;
    }
  }

  // Mark patient as ready
  async markPatientReady(patientId) {
    if (this.isDevelopment) {
      console.log('Development mode: Marked patient ready', patientId);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.put(`/patients/${patientId}/status`, { status: 'ready' });
      return response;
    } catch (error) {
      console.error('Failed to mark patient ready:', error);
      throw error;
    }
  }

  // Add patient delay
  async addPatientDelay(patientId, delayReason) {
    if (this.isDevelopment) {
      console.log('Development mode: Added delay for patient', patientId, delayReason);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.put(`/patients/${patientId}/delay`, { delayReason });
      return response;
    } catch (error) {
      console.error('Failed to add patient delay:', error);
      throw error;
    }
  }

  // Remove patient delay
  async removePatientDelay(patientId) {
    if (this.isDevelopment) {
      console.log('Development mode: Removed delay for patient', patientId);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.delete(`/patients/${patientId}/delay`);
      return response;
    } catch (error) {
      console.error('Failed to remove patient delay:', error);
      throw error;
    }
  }

  // Start consultation
  async startConsultation(patientId) {
    if (this.isDevelopment) {
      console.log('Development mode: Started consultation for patient', patientId);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.put(`/patients/${patientId}/status`, { status: 'seeing_doctor' });
      return response;
    } catch (error) {
      console.error('Failed to start consultation:', error);
      throw error;
    }
  }

  // Complete visit
  async completeVisit(patientId) {
    if (this.isDevelopment) {
      console.log('Development mode: Completed visit for patient', patientId);
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await apiService.put(`/patients/${patientId}/status`, { status: 'completed' });
      return response;
    } catch (error) {
      console.error('Failed to complete visit:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const patientService = new PatientService();
export default patientService;
