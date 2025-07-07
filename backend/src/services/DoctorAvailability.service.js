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
}

export default DoctorAvailabilityService;