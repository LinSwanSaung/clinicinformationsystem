import apiService from '@/services/api';

class AppointmentService {
  async getAllAppointments() {
    const response = await apiService.get('/appointments');
    return response;
  }

  async getAppointmentById(id) {
    const response = await apiService.get(`/appointments/${id}`);
    return response;
  }

  async createAppointment(appointmentData) {
    const response = await apiService.post('/appointments', appointmentData);
    return response;
  }

  async updateAppointment(id, appointmentData) {
    const response = await apiService.put(`/appointments/${id}`, appointmentData);
    return response;
  }

  async deleteAppointment(id) {
    const response = await apiService.delete(`/appointments/${id}`);
    return response;
  }

  async getAppointmentsByDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const response = await apiService.get(`/appointments?date=${dateStr}`);
    return response;
  }

  async updateAppointmentStatus(id, status) {
    const response = await apiService.put(`/appointments/${id}/status`, { status });
    return response;
  }

  async checkPatientActiveAppointments(patientId) {
    const today = new Date().toISOString().split('T')[0];
    // Only check for appointments that are actively in today's queue
    // 'waiting' = patient is in queue waiting to be seen
    // 'in-progress' = patient is currently being seen
    // We exclude 'scheduled' because those might be future appointments
    const response = await apiService.get(
      `/appointments?patient_id=${patientId}&date=${today}&status=waiting,in-progress`
    );
    return response;
  }
}

export default new AppointmentService();
