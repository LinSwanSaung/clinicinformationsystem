import apiService from './api.js';

class AppointmentService {
  async getAllAppointments() {
    try {
      const response = await apiService.get('/appointments');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAppointmentById(id) {
    try {
      const response = await apiService.get(`/appointments/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createAppointment(appointmentData) {
    try {
      const response = await apiService.post('/appointments', appointmentData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateAppointment(id, appointmentData) {
    try {
      const response = await apiService.put(`/appointments/${id}`, appointmentData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteAppointment(id) {
    try {
      const response = await apiService.delete(`/appointments/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAppointmentsByDate(date) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await apiService.get(`/appointments?date=${dateStr}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateAppointmentStatus(id, status) {
    try {
      const response = await apiService.put(`/appointments/${id}/status`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async checkPatientActiveAppointments(patientId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Only check for appointments that are actively in today's queue
      // 'waiting' = patient is in queue waiting to be seen
      // 'in-progress' = patient is currently being seen
      // We exclude 'scheduled' because those might be future appointments
      const response = await apiService.get(`/appointments?patient_id=${patientId}&date=${today}&status=waiting,in-progress`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new AppointmentService();
