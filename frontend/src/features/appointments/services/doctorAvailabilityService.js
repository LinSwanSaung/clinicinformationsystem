/**
 * Service for managing doctor availability
 */
import apiService from '@/services/api';
import logger from '@/utils/logger';

class DoctorAvailabilityService {
  /**
   * Get availability for all doctors
   */
  async getAllDoctorAvailability() {
    try {
      const response = await apiService.get('/doctor-availability');
      // The API returns { success: true, data: [...] }
      // So we need to return the whole response, not just response.data
      return response;
    } catch (error) {
      // If it's an upstream service error, return empty data instead of throwing
      if (error.message && error.message.includes('Upstream service unavailable')) {
        return { data: [] };
      }
      return { data: [] };
    }
  }

  /**
   * Get availability for a specific doctor
   */
  async getDoctorAvailability(doctorId) {
    try {
      const response = await apiService.get(`/doctor-availability/doctor/${doctorId}`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if doctor is available on a specific date
   */
  isDoctorAvailableOnDate(availability, targetDate = new Date()) {
    if (!availability || availability.length === 0) {
      return false; // No availability data means not available
    }

    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = targetDate.toTimeString().slice(0, 5); // HH:MM format
    
    // Find ALL availability slots for the target day - using is_active instead of is_available
    const dayAvailabilitySlots = availability.filter(slot => 
      slot.day_of_week === dayOfWeek && slot.is_active
    );

    if (dayAvailabilitySlots.length === 0) {
      return false; // Not available on this day
    }

    // Check if current time is within ANY of the available time slots
    for (const slot of dayAvailabilitySlots) {
      const startTime = slot.start_time.slice(0, 5); // Ensure HH:MM format
      const endTime = slot.end_time.slice(0, 5); // Ensure HH:MM format
      
      const isWithinHours = currentTime >= startTime && currentTime <= endTime;
      
      if (isWithinHours) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get doctor status based on availability and queue
   */
  getDoctorStatus(doctor, availability, queueStats) {
    const isAvailableToday = this.isDoctorAvailableOnDate(availability);
    
    if (!isAvailableToday) {
      return {
        status: 'unavailable',
        text: 'Not Available Today',
        color: 'bg-gray-100 text-gray-500',
        canAcceptPatients: false,
        description: 'Doctor is not scheduled for today'
      };
    }

    const activeConsultation = queueStats?.currentStatus?.activeConsultation;
    const waitingPatients = queueStats?.statistics?.combined?.waitingPatients || 0;
    const maxPatientsPerDay = 20; // This could come from doctor settings

    if (activeConsultation) {
      return {
        status: 'consulting',
        text: 'In Consultation',
        color: 'bg-blue-100 text-blue-800',
        canAcceptPatients: waitingPatients < maxPatientsPerDay,
        description: `Currently with ${activeConsultation.patient?.first_name} ${activeConsultation.patient?.last_name}`
      };
    }

    if (waitingPatients >= maxPatientsPerDay) {
      return {
        status: 'full',
        text: 'Queue Full',
        color: 'bg-red-100 text-red-800',
        canAcceptPatients: false,
        description: `Queue is full (${waitingPatients}/${maxPatientsPerDay} patients)`
      };
    }

    if (waitingPatients > 0) {
      return {
        status: 'busy',
        text: 'Available',
        color: 'bg-yellow-100 text-yellow-800',
        canAcceptPatients: true,
        description: `${waitingPatients} patient(s) waiting`
      };
    }

    return {
      status: 'available',
      text: 'Available',
      color: 'bg-green-100 text-green-800',
      canAcceptPatients: true,
      description: 'Ready to see patients'
    };
  }

  /**
   * Create new availability schedule for a doctor
   */
  async createAvailability(availabilityData) {
    try {
      const response = await apiService.post('/doctor-availability', availabilityData);
      return response;
    } catch (error) {
      if (error.message && error.message.includes('Upstream service unavailable')) {
        throw new Error('Database service is currently unavailable. Please try again later.');
      }
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
      if (error.message && error.message.includes('Upstream service unavailable')) {
        throw new Error('Database service is currently unavailable. Please try again later.');
      }
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
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available for booking
   */
  async checkTimeSlotAvailability(doctorId, date, time) {
    try {
      const response = await apiService.get(
        `/doctor-availability/${doctorId}/check-slot`,
        { params: { date, time } }
      );
      return response.data;
    } catch (error) {
      logger.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  /**
   * Get all available time slots for a doctor on a specific date
   */
  async getAvailableTimeSlots(doctorId, date) {
    try {
      const response = await apiService.get(
        `/doctor-availability/${doctorId}/available-slots`,
        { params: { date } }
      );
      return response.data;
    } catch (error) {
      logger.error('Error getting available time slots:', error);
      throw error;
    }
  }
}

const doctorAvailabilityService = new DoctorAvailabilityService();
export default doctorAvailabilityService;