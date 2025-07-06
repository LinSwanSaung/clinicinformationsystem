import apiService from './api.js';

class PatientService {
  // Get all patients
  async getAllPatients() {
    try {
      const response = await apiService.get('/patients');
      return response;
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      throw error;
    }
  }

  // Get patient by ID
  async getPatientById(id) {
    try {
      const response = await apiService.get(`/patients/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch patient ${id}:`, error);
      throw error;
    }
  }

  // Create new patient
  async createPatient(patientData) {
    try {
      const response = await apiService.post('/patients', patientData);
      return response;
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }

  // Update patient
  async updatePatient(id, patientData) {
    try {
      const response = await apiService.put(`/patients/${id}`, patientData);
      return response;
    } catch (error) {
      console.error(`Failed to update patient ${id}:`, error);
      throw error;
    }
  }

  // Delete patient
  async deletePatient(id) {
    try {
      const response = await apiService.delete(`/patients/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete patient ${id}:`, error);
      throw error;
    }
  }

  // Search patients
  async searchPatients(searchTerm) {
    try {
      const response = await apiService.get(`/patients/search?q=${encodeURIComponent(searchTerm)}`);
      return response;
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw error;
    }
  }

  // Get patients by status
  async getPatientsByStatus(isActive = true) {
    try {
      const response = await apiService.get(`/patients?is_active=${isActive}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch patients by status:', error);
      throw error;
    }
  }

  // Get patient statistics
  async getPatientStats() {
    try {
      const response = await apiService.get('/patients/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch patient stats:', error);
      throw error;
    }
  }

  // Get recent patients
  async getRecentPatients(limit = 10) {
    try {
      const response = await apiService.get(`/patients/recent?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch recent patients:', error);
      throw error;
    }
  }

  // Get patients with upcoming appointments
  async getPatientsWithUpcomingAppointments() {
    try {
      const response = await apiService.get('/patients/upcoming-appointments');
      return response;
    } catch (error) {
      console.error('Failed to fetch patients with upcoming appointments:', error);
      throw error;
    }
  }

  // Toggle patient active status
  async togglePatientStatus(id, isActive) {
    try {
      const response = await apiService.patch(`/patients/${id}/status`, { is_active: isActive });
      return response;
    } catch (error) {
      console.error(`Failed to toggle patient status for ${id}:`, error);
      throw error;
    }
  }

  // Get nurse patients (patients assigned to current nurse or recent interactions)
  async getNursePatients() {
    try {
      const response = await apiService.get('/patients/nurse');
      return response;
    } catch (error) {
      console.error('Failed to fetch nurse patients:', error);
      throw error;
    }
  }

  // Get doctor patients (patients assigned to current doctor)
  async getDoctorPatients() {
    try {
      const response = await apiService.get('/patients/doctor');
      return response;
    } catch (error) {
      console.error('Failed to fetch doctor patients:', error);
      throw error;
    }
  }
}

export default new PatientService();
