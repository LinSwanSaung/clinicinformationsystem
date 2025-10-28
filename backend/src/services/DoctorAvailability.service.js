import DoctorAvailabilityModel from '../models/DoctorAvailability.model.js';

class DoctorAvailabilityService {
  constructor() {
    this.doctorAvailabilityModel = new DoctorAvailabilityModel();
  }

  /**
   * Get all doctor availability records
   */
  async getAllAvailability(options = {}) {
    try {
      const { doctorId } = options;

      if (doctorId) {
        return await this.doctorAvailabilityModel.getByDoctorId(doctorId);
      }

      return await this.doctorAvailabilityModel.getAllWithDoctorDetails();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get availability by doctor ID
   */
  async getAvailabilityByDoctorId(doctorId) {
    try {
      return await this.doctorAvailabilityModel.getByDoctorId(doctorId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new availability record
   */
  async createAvailability(availabilityData) {
    try {
      // Validate required fields
      this.validateAvailabilityData(availabilityData);

      // Process day name to ensure consistency
      const processedData = {
        ...availabilityData,
        day_of_week: this.standardizeDayName(availabilityData.day_of_week)
      };

      // Check for conflicts
      await this.checkForTimeConflicts(processedData);

      return await this.doctorAvailabilityModel.create(processedData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update availability record
   */
  async updateAvailability(id, availabilityData) {
    try {
      // Check if record exists
      const existingRecord = await this.doctorAvailabilityModel.findById(id);
      if (!existingRecord) {
        throw new Error('Availability record not found');
      }

      // Validate and process data
      this.validateAvailabilityData(availabilityData, true);
      const processedData = {
        ...availabilityData,
        day_of_week: this.standardizeDayName(availabilityData.day_of_week)
      };

      // Check for conflicts (excluding current record)
      await this.checkForTimeConflicts(processedData, id);

      return await this.doctorAvailabilityModel.update(id, processedData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete availability record
   */
  async deleteAvailability(id) {
    try {
      const existingRecord = await this.doctorAvailabilityModel.findById(id);
      if (!existingRecord) {
        throw new Error('Availability record not found');
      }

      return await this.doctorAvailabilityModel.delete(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available doctors for a specific day and time
   */
  async getAvailableDoctors(dayOfWeek, time) {
    try {
      const dayName = this.standardizeDayName(dayOfWeek);
      return await this.doctorAvailabilityModel.getAvailableDoctors(dayName, time);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a doctor is available at a specific time
   */
  async isDoctorAvailable(doctorId, dayOfWeek, time) {
    try {
      const dayName = this.standardizeDayName(dayOfWeek);
      return await this.doctorAvailabilityModel.isDoctorAvailable(doctorId, dayName, time);
    } catch (error) {
      throw error;
    }
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
    try {
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
        const hasOverlap = (
          (data.start_time < slot.end_time && data.end_time > slot.start_time)
        );

        if (hasOverlap) {
          throw new Error(
            `Time conflict detected with existing availability slot: ${slot.start_time} - ${slot.end_time}`
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available for booking
   */
  async checkTimeSlotAvailability(doctorId, date, time) {
    try {
      console.log('[DoctorAvailabilityService] Checking time slot:', { doctorId, date, time });

      // 1. Get day of week from date (handle timezone correctly)
      const [year, month, day] = date.split('-').map(Number);
      const appointmentDate = new Date(year, month - 1, day); // Create date in local timezone
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log('[DoctorAvailabilityService] Date parsing:', { 
        inputDate: date, 
        parsedDate: appointmentDate.toISOString(), 
        dayOfWeek 
      });

      // 2. Get doctor's availability for that day
      const availability = await this.getAvailabilityByDoctorId(doctorId);
      const daySchedule = availability.find(a => a.day_of_week === dayOfWeek && a.is_active);

      if (!daySchedule) {
        return {
          isAvailable: false,
          reason: `Doctor is not available on ${dayOfWeek}s`
        };
      }

      // 3. Check if time is within working hours
      const requestedTime = time.substring(0, 5); // Ensure HH:MM format
      if (requestedTime < daySchedule.start_time || requestedTime >= daySchedule.end_time) {
        return {
          isAvailable: false,
          reason: `Time slot is outside working hours (${daySchedule.start_time} - ${daySchedule.end_time})`
        };
      }

      // 4. Check if time slot is already booked
      const { data: existingAppointments, error } = await this.doctorAvailabilityModel.supabase
        .from('appointments')
        .select('id, appointment_time, duration_minutes, status')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'waiting', 'ready_for_doctor', 'consulting']);

      if (error) throw error;

      // Check for time conflicts (default 30 min duration if not specified)
      const requestedMinutes = this.timeToMinutes(requestedTime);
      const requestedDuration = 30; // Default duration

      for (const apt of existingAppointments || []) {
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
            conflictingAppointment: apt.id
          };
        }
      }

      return {
        isAvailable: true,
        daySchedule,
        bookedSlots: (existingAppointments || []).map(a => a.appointment_time)
      };
    } catch (error) {
      console.error('[DoctorAvailabilityService] Error checking time slot:', error);
      throw new Error(`Failed to check time slot availability: ${error.message}`);
    }
  }

  /**
   * Get all available time slots for a doctor on a specific date
   */
  async getAvailableTimeSlots(doctorId, date) {
    try {
      console.log('[DoctorAvailabilityService] Getting available time slots:', { doctorId, date });

      // 1. Get day of week (handle timezone correctly)
      const [year, month, day] = date.split('-').map(Number);
      const appointmentDate = new Date(year, month - 1, day); // Create date in local timezone
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log('[DoctorAvailabilityService] Date parsing for slots:', { 
        inputDate: date, 
        parsedDate: appointmentDate.toISOString(), 
        dayOfWeek 
      });

      // 2. Get doctor's availability
      const availability = await this.getAvailabilityByDoctorId(doctorId);
      const daySchedule = availability.find(a => a.day_of_week === dayOfWeek && a.is_active);

      if (!daySchedule) {
        return {
          slots: [],
          message: `Doctor is not available on ${dayOfWeek}s`
        };
      }

      // 3. Get existing appointments
      const { data: existingAppointments, error } = await this.doctorAvailabilityModel.supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'waiting', 'ready_for_doctor', 'consulting']);

      if (error) throw error;

      // 4. Generate all possible time slots (30-minute intervals)
      const allSlots = this.generateTimeSlots(
        daySchedule.start_time,
        daySchedule.end_time,
        30
      );

      // 5. Filter out booked slots
      const bookedSlots = (existingAppointments || []).map(a => a.appointment_time.substring(0, 5));
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      return {
        slots: availableSlots,
        workingHours: {
          start: daySchedule.start_time,
          end: daySchedule.end_time
        },
        bookedSlots,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length
      };
    } catch (error) {
      console.error('[DoctorAvailabilityService] Error getting available slots:', error);
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
}

export default DoctorAvailabilityService;