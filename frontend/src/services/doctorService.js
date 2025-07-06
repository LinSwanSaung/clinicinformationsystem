/**
 * Doctor Service
 * Handles all doctor-related API calls and data management
 */

import apiService from './api.js';

class DoctorService {
  /**
   * Get all doctors
   * @returns {Promise<Array>} List of doctors
   */
  async getAllDoctors() {
    try {
      const response = await apiService.get('/users?role=doctor');
      return response;
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      throw error;
    }
  }

  /**
   * Get available doctors
   * @returns {Promise<Array>} List of available doctors
   */
  async getAvailableDoctors() {
    try {
      const response = await apiService.get('/users?role=doctor&is_active=true');
      return response;
    } catch (error) {
      console.error('Failed to fetch available doctors:', error);
      throw error;
    }
  }

  /**
   * Get doctor by ID
   * @param {string} id - Doctor ID
   * @returns {Promise<Object|null>} Doctor object or null if not found
   */
  async getDoctorById(id) {
    try {
      const response = await apiService.get(`/users/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
      return null;
    }
  }

  /**
   * Get doctors by specialization
   * @param {string} specialization - Medical specialization
   * @returns {Promise<Array>} List of doctors with specified specialization
   */
  async getDoctorsBySpecialization(specialization) {
    try {
      const response = await apiService.get(`/users?role=doctor&specialty=${encodeURIComponent(specialization)}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch doctors by specialization:', error);
      throw error;
    }
  }

  /**
   * Update doctor availability
   * @param {string} id - Doctor ID
   * @param {boolean} isActive - New availability status
   * @returns {Promise<Object|null>} Updated doctor or null if not found
   */
  async updateDoctorAvailability(id, isActive) {
    try {
      const response = await apiService.put(`/users/${id}`, { is_active: isActive });
      return response;
    } catch (error) {
      console.error('Failed to update doctor availability:', error);
      return null;
    }
  }

  /**
   * Get doctor schedule
   * @param {string} id - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format (optional)
   * @returns {Promise<Object|null>} Doctor schedule or null if not found
   */
  async getDoctorSchedule(id, date = null) {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await apiService.get(`/appointments/doctor/${id}${queryParams}`);
      return {
        doctorId: id,
        appointments: response
      };
    } catch (error) {
      console.error('Failed to fetch doctor schedule:', error);
      return null;
    }
  }

  /**
   * Get doctor's appointments
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters (date, status, etc.)
   * @returns {Promise<Array>} Doctor's appointments
   */
  async getDoctorAppointments(doctorId, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        doctor_id: doctorId,
        ...filters
      });
      const response = await apiService.get(`/appointments?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch doctor appointments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const doctorService = new DoctorService();
export default doctorService;
