import apiService from '@/services/api';

class PatientService {
  async getAllPatients() {
    const response = await apiService.get('/patients');
    return response;
  }

  async getPatientById(id) {
    const response = await apiService.get(`/patients/${id}`);
    return response;
  }

  async createPatient(patientData) {
    const response = await apiService.post('/patients', patientData);
    return response;
  }

  async updatePatient(id, patientData) {
    const response = await apiService.put(`/patients/${id}`, patientData);
    return response;
  }

  async deletePatient(id) {
    const response = await apiService.delete(`/patients/${id}`);
    return response;
  }

  async searchPatients(searchTerm) {
    const response = await apiService.get(`/patients/search?q=${encodeURIComponent(searchTerm)}`);
    return response;
  }

  // Get patients by status
  async getPatientsByStatus(isActive = true) {
    const response = await apiService.get(`/patients?is_active=${isActive}`);
    return response;
  }

  // Get patient statistics
  async getPatientStats() {
    const response = await apiService.get('/patients/stats');
    return response;
  }

  // Get recent patients
  async getRecentPatients(limit = 10) {
    const response = await apiService.get(`/patients/recent?limit=${limit}`);
    return response;
  }

  // Get patients with upcoming appointments
  async getPatientsWithUpcomingAppointments() {
    const response = await apiService.get('/patients/upcoming-appointments');
    return response;
  }

  // Toggle patient active status
  async togglePatientStatus(id, isActive) {
    const response = await apiService.patch(`/patients/${id}/status`, { is_active: isActive });
    return response;
  }

  // Get nurse patients (patients assigned to current nurse or recent interactions)
  async getNursePatients() {
    const response = await apiService.get('/patients/nurse');
    return response;
  }

  // Get doctor patients (patients assigned to current doctor)
  async getDoctorPatients() {
    const response = await apiService.get('/patients/doctor');
    return response;
  }
}

// Export singleton instance
const patientService = new PatientService();
export { patientService };
export default patientService;
