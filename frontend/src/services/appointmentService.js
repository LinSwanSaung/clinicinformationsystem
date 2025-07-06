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
}

export default new AppointmentService();
