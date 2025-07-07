/**
 * Service for managing doctor availability
 */
import apiService from './api.js';

class DoctorAvailabilityService {
  /**
   * Get availability for all doctors
   */
  async getAllDoctorAvailability() {
    try {
      const response = await apiService.get('/doctor-availability');
      return response;
    } catch (error) {
      console.error('Error fetching all doctor availability:', error);
      throw error;
    }
  }

  /**
   * Get availability for a specific doctor
   */
  async getDoctorAvailability(doctorId) {
    try {
      const response = await apiService.get(`/doctor-availability/doctor/${doctorId}`);
      return response;
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      throw error;
    }
  }

  /**
   * Create new availability schedule for a doctor
   */
  async createAvailability(availabilityData) {
    try {
      const response = await apiService.post('/doctor-availability', availabilityData);
      return response;
    } catch (error) {
      console.error('Error creating doctor availability:', error);
      throw error;
    }
  }

  /**
   * Update existing availability schedule
   */
  async updateAvailability(availabilityId, availabilityData) {
    try {
      const response = await apiService.put(`/doctor-availability/${availabilityId}`, availabilityData);
      return response;
    } catch (error) {
      console.error('Error updating doctor availability:', error);
      throw error;
    }
  }

  /**
   * Delete availability schedule
   */
  async deleteAvailability(availabilityId) {
    try {
      const response = await apiService.delete(`/doctor-availability/${availabilityId}`);
      return response;
    } catch (error) {
      console.error('Error deleting doctor availability:', error);
      throw error;
    }
  }

  /**
   * Get available doctors for a specific day and time
   */
  async getAvailableDoctors(dayOfWeek, time) {
    try {
      const response = await apiService.get('/doctor-availability/available-doctors', {
        params: { day_of_week: dayOfWeek, time }
      });
      return response;
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      throw error;
    }
  }

  /**
   * Check if a doctor is available at a specific time
   */
  async checkDoctorAvailability(doctorId, dayOfWeek, time) {
    try {
      const response = await apiService.get('/doctor-availability/check-availability', {
        params: { doctor_id: doctorId, day_of_week: dayOfWeek, time }
      });
      return response;
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      throw error;
    }
  }
}

const doctorAvailabilityService = new DoctorAvailabilityService();
export default doctorAvailabilityService;