import DoctorAvailabilityModel from '../models/DoctorAvailability.model.js';
import {
  getAppointmentsByDoctorAndDate as repoGetAppointmentsByDoctorAndDate,
} from './repositories/DoctorAvailabilityRepo.js';
import logger from '../config/logger.js';

class DoctorAvailabilityService {
  constructor() {
    this.doctorAvailabilityModel = new DoctorAvailabilityModel();
  }

  /**
   * Get all doctor availability records
   */
  async getAllAvailability(options = {}) {
    const { doctorId } = options;

    if (doctorId) {
      return this.doctorAvailabilityModel.getByDoctorId(doctorId);
    }

    const allAvailability = await this.doctorAvailabilityModel.getAllWithDoctorDetails();

    // Filter out any records with null doctor_id to prevent validation errors
    return allAvailability.filter((record) => record && record.doctor_id);
  }

  /**
   * Get availability by doctor ID
   */
  async getAvailabilityByDoctorId(doctorId) {
    return this.doctorAvailabilityModel.getByDoctorId(doctorId);
  }

  /**
   * Create new availability record
   */
  async createAvailability(availabilityData) {
    // Validate required fields
    this.validateAvailabilityData(availabilityData);

    // Process day name to ensure consistency
    const processedData = {
      ...availabilityData,
      day_of_week: this.standardizeDayName(availabilityData.day_of_week),
    };

    // Check for conflicts
    await this.checkForTimeConflicts(processedData);

    return this.doctorAvailabilityModel.create(processedData);
  }

  /**
   * Update availability record
   */
  async updateAvailability(id, availabilityData) {
    // Check if record exists
    const existingRecord = await this.doctorAvailabilityModel.findById(id);
    if (!existingRecord) {
      throw new Error('Availability record not found');
    }

    // Validate and process data
    this.validateAvailabilityData(availabilityData, true);
    const processedData = {
      ...availabilityData,
      day_of_week: this.standardizeDayName(availabilityData.day_of_week),
    };

    // Check for conflicts (excluding current record)
    await this.checkForTimeConflicts(processedData, id);

    return this.doctorAvailabilityModel.update(id, processedData);
  }

  /**
   * Delete availability record
   */
  async deleteAvailability(id) {
    const existingRecord = await this.doctorAvailabilityModel.findById(id);
    if (!existingRecord) {
      throw new Error('Availability record not found');
    }

    return this.doctorAvailabilityModel.delete(id);
  }

  /**
   * Get available doctors for a specific day and time
   */
  async getAvailableDoctors(dayOfWeek, time) {
    const dayName = this.standardizeDayName(dayOfWeek);
    return this.doctorAvailabilityModel.getAvailableDoctors(dayName, time);
  }

  /**
   * Check if a doctor is available at a specific time
   */
  async isDoctorAvailable(doctorId, dayOfWeek, time) {
    const dayName = this.standardizeDayName(dayOfWeek);
    return this.doctorAvailabilityModel.isDoctorAvailable(doctorId, dayName, time);
  }

  /**
   * Validate availability data
   */
  validateAvailabilityData(data, isUpdate = false) {
    const required = ['doctor_id', 'day_of_week', 'start_time', 'end_time'];

    for (const field of required) {
      if (!isUpdate && (data[field] === undefined || data[field] === null)) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate times if both are provided
    if (data.start_time && data.end_time) {
      if (data.start_time >= data.end_time) {
        throw new Error('start_time must be before end_time');
      }
    }
  }

  /**
   * Standardize day name (convert from various formats to consistent format)
   */
  standardizeDayName(day) {
    if (typeof day === 'number') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[day] || day;
    }

    if (typeof day === 'string') {
      // Capitalize first letter, lowercase rest
      return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    }

    return day;
  }

  /**
   * Check for time conflicts
   */
  async checkForTimeConflicts(data, excludeId = null) {
    const existingSlots = await this.doctorAvailabilityModel.getByDoctorAndDay(
      data.doctor_id,
      data.day_of_week
    );

    for (const slot of existingSlots) {
      // Skip if this is the same record we're updating
      if (excludeId && slot.id === excludeId) {
        continue;
      }

      // Check for time overlap
      const hasOverlap = data.start_time < slot.end_time && data.end_time > slot.start_time;

      if (hasOverlap) {
        throw new Error(
          `Time conflict detected with existing availability slot: ${slot.start_time} - ${slot.end_time}`
        );
      }
    }
  }

  /**
   * Check if a specific time slot is available for booking
   */
  async checkTimeSlotAvailability(doctorId, date, time) {
    try {
      // 1. Get day of week from date (handle timezone correctly)
      const [year, month, day] = date.split('-').map(Number);
      const appointmentDate = new Date(year, month - 1, day); // Create date in local timezone
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // 2. Get doctor's availability for that day
      const availability = await this.getAvailabilityByDoctorId(doctorId);
      const daySchedule = availability.find((a) => a.day_of_week === dayOfWeek && a.is_active);

      if (!daySchedule) {
        return {
          isAvailable: false,
          reason: `Doctor is not available on ${dayOfWeek}s`,
        };
      }

      // 3. Check if time is within working hours
      const requestedTime = time.substring(0, 5); // Ensure HH:MM format
      const startTime = daySchedule.start_time.substring(0, 5); // Convert to HH:MM
      const endTime = daySchedule.end_time.substring(0, 5); // Convert to HH:MM

      if (requestedTime < startTime || requestedTime >= endTime) {
        return {
          isAvailable: false,
          reason: `Time slot is outside working hours (${daySchedule.start_time} - ${daySchedule.end_time})`,
        };
      }

      // 4. Check if time slot is already booked
      const existingAppointments = await repoGetAppointmentsByDoctorAndDate(doctorId, date);
      // Filter by status (repository returns all, we filter here for business logic)
      const activeAppointments = existingAppointments.filter((apt) =>
        ['scheduled', 'waiting', 'ready_for_doctor', 'consulting'].includes(apt.status)
      );

      // Check for time conflicts (default 30 min duration if not specified)
      const requestedMinutes = this.timeToMinutes(requestedTime);
      const requestedDuration = 30; // Default duration

      for (const apt of activeAppointments) {
        const aptMinutes = this.timeToMinutes(apt.appointment_time);
        const aptDuration = apt.duration_minutes || 30;

        // Check if slots overlap
        if (
          (requestedMinutes >= aptMinutes && requestedMinutes < aptMinutes + aptDuration) ||
          (requestedMinutes + requestedDuration > aptMinutes && requestedMinutes < aptMinutes)
        ) {
          return {
            isAvailable: false,
            reason: 'Time slot is already booked',
            conflictingAppointment: apt.id,
          };
        }
      }

      return {
        isAvailable: true,
        daySchedule,
        bookedSlots: (existingAppointments || []).map((a) => a.appointment_time),
      };
    } catch (error) {
      logger.error('[DoctorAvailabilityService] Error checking time slot:', error);
      throw new Error(`Failed to check time slot availability: ${error.message}`);
    }
  }

  /**
   * Get all available time slots for a doctor on a specific date
   */
  async getAvailableTimeSlots(doctorId, date) {
    try {
      logger.debug('[DoctorAvailabilityService] Getting available time slots:', { doctorId, date });

      // 1. Get day of week (handle timezone correctly)
      const [year, month, day] = date.split('-').map(Number);
      const appointmentDate = new Date(year, month - 1, day); // Create date in local timezone
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // 2. Get doctor's availability
      const availability = await this.getAvailabilityByDoctorId(doctorId);
      logger.debug('[DoctorAvailabilityService] Doctor availability:', availability);
      logger.debug('[DoctorAvailabilityService] Looking for dayOfWeek:', dayOfWeek);

      const daySchedule = availability.find((a) => a.day_of_week === dayOfWeek && a.is_active);
      logger.debug('[DoctorAvailabilityService] Found day schedule:', daySchedule);

      if (!daySchedule) {
        return {
          slots: [],
          message: `Doctor is not available on ${dayOfWeek}s`,
        };
      }

      // 3. Get existing appointments
      const allAppointments = await repoGetAppointmentsByDoctorAndDate(doctorId, date);
      const existingAppointments = allAppointments.filter((apt) =>
        ['scheduled', 'waiting', 'ready_for_doctor', 'consulting'].includes(apt.status)
      );

      // 4. Generate all possible time slots (30-minute intervals)
      const allSlots = this.generateTimeSlots(daySchedule.start_time, daySchedule.end_time, 30);
      logger.debug(
        '[DoctorAvailabilityService] Generated slots from',
        daySchedule.start_time,
        'to',
        daySchedule.end_time,
        ':',
        allSlots.length,
        'slots'
      );
      logger.debug('[DoctorAvailabilityService] First 5 slots:', allSlots.slice(0, 5));

      // 5. Filter out booked slots
      const bookedSlots = (existingAppointments || []).map((a) =>
        a.appointment_time.substring(0, 5)
      );
      const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

      return {
        slots: availableSlots,
        workingHours: {
          start: daySchedule.start_time,
          end: daySchedule.end_time,
        },
        bookedSlots,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length,
      };
    } catch (error) {
      logger.error('[DoctorAvailabilityService] Error getting available slots:', error);
      throw new Error(`Failed to get available time slots: ${error.message}`);
    }
  }

  /**
   * Helper: Convert time string (HH:MM) to minutes since midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Generate time slots in range with specified interval
   */
  generateTimeSlots(startTime, endTime, intervalMinutes) {
    const slots = [];
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    return slots;
  }

  // ===============================================
  // DOCTOR UNAVAILABILITY MANAGEMENT
  // ===============================================

  /**
   * Check and mark tokens as missed for all doctors during unavailable times
   * This should be called periodically (e.g., every 5-10 minutes)
   */
  async checkAndMarkMissedTokens() {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'mark_tokens_missed_during_unavailability'
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        missedTokens: data || [],
        count: data?.length || 0,
        message: `Processed ${data?.length || 0} tokens during doctor unavailability check`,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error checking missed tokens:', error);
      throw error;
    }
  }

  /**
   * Check and mark tokens as missed for a specific doctor
   */
  async checkDoctorMissedTokens(doctorId) {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'mark_tokens_missed_during_unavailability',
        { p_doctor_id: doctorId }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        missedTokens: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error checking doctor missed tokens:', error);
      throw error;
    }
  }

  /**
   * Cancel all remaining tokens for a doctor (when doctor leaves for the day)
   */
  async cancelDoctorRemainingTokens(doctorId, reason, performedBy) {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'cancel_doctor_remaining_tokens',
        {
          p_doctor_id: doctorId,
          p_reason: reason || 'Doctor unavailable for the rest of the day',
          p_performed_by: performedBy,
        }
      );

      if (error) {
        throw error;
      }
      return {
        success: true,
        cancelledTokens: data || [],
        count: data?.length || 0,
        message: `Cancelled ${data?.length || 0} waiting tokens for doctor`,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error cancelling doctor tokens:', error);
      throw error;
    }
  }

  /**
   * Check if doctor is currently available
   */
  async isDoctorCurrentlyAvailable(doctorId) {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'is_doctor_currently_available',
        { p_doctor_id: doctorId }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        isAvailable: data || false,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error checking doctor availability:', error);
      throw error;
    }
  }

  /**
   * Check if doctor has remaining availability today
   */
  async doctorHasRemainingAvailability(doctorId) {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'doctor_has_remaining_availability_today',
        { p_doctor_id: doctorId }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        hasAvailability: data || false,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error checking remaining availability:', error);
      throw error;
    }
  }

  /**
   * Get doctor's next available time slot today
   */
  async getDoctorNextAvailableTime(doctorId) {
    try {
      const { data, error } = await this.doctorAvailabilityModel.supabase.rpc(
        'get_doctor_next_available_time',
        { p_doctor_id: doctorId }
      );

      if (error) {
        throw error;
      }

      return {
        success: true,
        nextAvailableTime: data,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error getting next available time:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive doctor availability status
   */
  async getDoctorAvailabilityStatus(doctorId) {
    try {
      const [currentAvailability, remainingAvailability, nextTime] = await Promise.all([
        this.isDoctorCurrentlyAvailable(doctorId),
        this.doctorHasRemainingAvailability(doctorId),
        this.getDoctorNextAvailableTime(doctorId),
      ]);

      // Get active tokens count
      const { data: tokens, error: tokenError } = await this.doctorAvailabilityModel.supabase
        .from('queue_tokens')
        .select('id, status')
        .eq('doctor_id', doctorId)
        .eq('issued_date', new Date().toISOString().split('T')[0])
        .in('status', ['waiting', 'called', 'delayed', 'serving']);

      if (tokenError) {
        throw tokenError;
      }

      const status = {
        isCurrentlyAvailable: currentAvailability.isAvailable,
        hasRemainingAvailability: remainingAvailability.hasAvailability,
        nextAvailableTime: nextTime.nextAvailableTime,
        activeTokensCount: tokens?.length || 0,
        status: currentAvailability.isAvailable
          ? 'available'
          : remainingAvailability.hasAvailability
            ? 'on_break'
            : 'finished',
      };

      return {
        success: true,
        ...status,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error getting availability status:', error);
      throw error;
    }
  }

  /**
   * Get all doctors with their current availability status
   */
  async getAllDoctorsAvailabilityStatus() {
    try {
      // Get all active doctors
      const { data: doctors, error: doctorError } = await this.doctorAvailabilityModel.supabase
        .from('users')
        .select('id, first_name, last_name, email, specialty')
        .eq('role', 'doctor')
        .eq('is_active', true);

      if (doctorError) {
        throw doctorError;
      }

      // Get status for each doctor
      const doctorStatuses = await Promise.all(
        doctors.map(async (doctor) => {
          const status = await this.getDoctorAvailabilityStatus(doctor.id);
          return {
            ...doctor,
            availabilityStatus: status,
          };
        })
      );

      return {
        success: true,
        doctors: doctorStatuses,
      };
    } catch (error) {
      logger.error('[DoctorAvailability] Error getting all doctors status:', error);
      throw error;
    }
  }
}

export default DoctorAvailabilityService;

