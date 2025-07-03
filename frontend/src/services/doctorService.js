/**
 * Doctor Service
 * Handles all doctor-related API calls and data management
 */

// For now, using mock data until backend is ready
import { doctors } from '../data/mockData.js';

class DoctorService {
  constructor() {
    this.doctors = [...doctors];
  }

  /**
   * Get all doctors
   * @returns {Promise<Array>} List of doctors
   */
  async getAllDoctors() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.doctors;
  }

  /**
   * Get available doctors
   * @returns {Promise<Array>} List of available doctors
   */
  async getAvailableDoctors() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.doctors.filter(doctor => doctor.availability === 'Available');
  }

  /**
   * Get doctor by ID
   * @param {string} id - Doctor ID
   * @returns {Promise<Object|null>} Doctor object or null if not found
   */
  async getDoctorById(id) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return this.doctors.find(doctor => doctor.id === id) || null;
  }

  /**
   * Get doctors by specialization
   * @param {string} specialization - Medical specialization
   * @returns {Promise<Array>} List of doctors with specified specialization
   */
  async getDoctorsBySpecialization(specialization) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.doctors.filter(doctor => 
      doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
    );
  }

  /**
   * Update doctor availability
   * @param {string} id - Doctor ID
   * @param {string} availability - New availability status
   * @returns {Promise<Object|null>} Updated doctor or null if not found
   */
  async updateDoctorAvailability(id, availability) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const doctor = this.doctors.find(d => d.id === id);
    if (!doctor) return null;
    
    doctor.availability = availability;
    return doctor;
  }

  /**
   * Get doctor schedule
   * @param {string} id - Doctor ID
   * @returns {Promise<Object|null>} Doctor schedule or null if not found
   */
  async getDoctorSchedule(id) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const doctor = this.doctors.find(d => d.id === id);
    if (!doctor) return null;
    
    return {
      doctorId: id,
      doctorName: doctor.name,
      schedule: doctor.schedule || {}
    };
  }
}

// Export singleton instance
export const doctorService = new DoctorService();
export default doctorService;
