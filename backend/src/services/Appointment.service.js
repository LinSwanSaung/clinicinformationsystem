import AppointmentModel from '../models/Appointment.model.js';

class AppointmentService {
  constructor() {
    this.appointmentModel = new AppointmentModel();
  }

  /**
   * Get all appointments with optional filtering
   */
  async getAllAppointments(filters = {}) {
    try {
      const { date, patient_id, doctor_id, status } = filters;

      // If we have multiple filters, use the combined method
      if ((patient_id && date) || status) {
        return await this.appointmentModel.getWithFilters(filters);
      }

      if (date) {
        return await this.appointmentModel.getByDate(date);
      }

      if (patient_id) {
        return await this.appointmentModel.getByPatientId(patient_id);
      }

      if (doctor_id) {
        return await this.appointmentModel.getByDoctorId(doctor_id);
      }

      return await this.appointmentModel.getAllWithDetails();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id) {
    try {
      const appointment = await this.appointmentModel.findById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      return appointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData) {
    try {
      console.log('[AppointmentService] Creating appointment:', appointmentData);

      // Validate required fields
      const requiredFields = ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time'];
      for (const field of requiredFields) {
        if (!appointmentData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Prevent same-day appointments
      const appointmentDate = new Date(appointmentData.appointment_date);
      const today = new Date(2025, 9, 28); // October 28, 2025
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate.getTime() === today.getTime()) {
        throw new Error('Same-day appointments are not allowed. Please schedule for tomorrow or later.');
      }
      
      if (appointmentDate < today) {
        throw new Error('Cannot schedule appointments in the past.');
      }

      // Check doctor availability using DoctorAvailabilityService
      const DoctorAvailabilityService = (await import('./DoctorAvailability.service.js')).default;
      const doctorAvailabilityService = new DoctorAvailabilityService();
      
      const availability = await doctorAvailabilityService.checkTimeSlotAvailability(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time
      );

      if (!availability.isAvailable) {
        throw new Error(`Cannot book appointment: ${availability.reason}`);
      }

      console.log('[AppointmentService] Time slot is available, proceeding with creation');

      // Set default values
      const appointmentToCreate = {
        ...appointmentData,
        status: appointmentData.status || 'scheduled',
        duration_minutes: appointmentData.duration_minutes || 30,
        appointment_type: appointmentData.appointment_type || 'Regular Checkup'
      };

      const newAppointment = await this.appointmentModel.create(appointmentToCreate);
      return newAppointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(id, updateData) {
    try {
      // Check if appointment exists
      const existingAppointment = await this.appointmentModel.findById(id);
      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      // If updating time/date/doctor, check for conflicts
      if (updateData.doctor_id || updateData.appointment_date || updateData.appointment_time) {
        const doctorId = updateData.doctor_id || existingAppointment.doctor_id;
        const appointmentDate = updateData.appointment_date || existingAppointment.appointment_date;
        const appointmentTime = updateData.appointment_time || existingAppointment.appointment_time;

        const hasConflict = await this.appointmentModel.checkConflicts(
          doctorId,
          appointmentDate,
          appointmentTime,
          id // Exclude current appointment from conflict check
        );

        if (hasConflict) {
          throw new Error('Doctor already has an appointment at this time');
        }
      }

      const updatedAppointment = await this.appointmentModel.update(id, updateData);
      return updatedAppointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(id) {
    try {
      const existingAppointment = await this.appointmentModel.findById(id);
      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      await this.appointmentModel.delete(id);
      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id, status) {
    try {
      // Validate status
      const validStatuses = ['scheduled', 'waiting', 'ready_for_doctor', 'consulting', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const existingAppointment = await this.appointmentModel.findById(id);
      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      const updatedAppointment = await this.appointmentModel.updateStatus(id, status);
      
      return updatedAppointment;
    } catch (error) {
      console.error('Service Error:', error.message);
      throw error;
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId, date) {
    try {
      if (!doctorId || !date) {
        throw new Error('Doctor ID and date are required');
      }

      const availableSlots = await this.appointmentModel.getAvailableSlots(doctorId, date);
      return availableSlots;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get appointments by date range
   */
  async getAppointmentsByDateRange(startDate, endDate, doctorId = null) {
    try {
      // This would need a custom query - for now, get all and filter
      const appointments = doctorId 
        ? await this.appointmentModel.getByDoctorId(doctorId)
        : await this.appointmentModel.getAllWithDetails();

      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return aptDate >= start && aptDate <= end;
      });
    } catch (error) {
      throw error;
    }
  }

  // ===============================================
  // QUEUE INTEGRATION METHODS
  // ===============================================

  /**
   * Check in appointment (mark as waiting and ready for queue)
   */
  async checkInAppointment(appointmentId) {
    try {
      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'scheduled') {
        throw new Error('Only scheduled appointments can be checked in');
      }

      const updatedAppointment = await this.appointmentModel.update(appointmentId, {
        status: 'waiting'
      });

      return {
        success: true,
        appointment: updatedAppointment,
        message: 'Appointment checked in successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get appointments ready for queue processing
   */
  async getAppointmentsForQueue(doctorId, date = null) {
    try {
      const appointmentDate = date || new Date().toISOString().split('T')[0];
      
      const appointments = await this.appointmentModel.getByDate(appointmentDate);
      const doctorAppointments = appointments.filter(apt => 
        apt.doctor_id === doctorId && 
        ['scheduled', 'waiting'].includes(apt.status)
      );

      return doctorAppointments.sort((a, b) => 
        a.appointment_time.localeCompare(b.appointment_time)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get today's appointment statistics for a doctor
   */
  async getTodayStats(doctorId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const appointments = await this.appointmentModel.getByDate(today);
      const doctorAppointments = appointments.filter(apt => apt.doctor_id === doctorId);

      const stats = {
        total: doctorAppointments.length,
        scheduled: doctorAppointments.filter(apt => apt.status === 'scheduled').length,
        waiting: doctorAppointments.filter(apt => apt.status === 'waiting').length,
        consulting: doctorAppointments.filter(apt => apt.status === 'consulting').length,
        completed: doctorAppointments.filter(apt => apt.status === 'completed').length,
        cancelled: doctorAppointments.filter(apt => apt.status === 'cancelled').length,
        noShow: doctorAppointments.filter(apt => apt.status === 'no_show').length
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    try {
      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check for conflicts at new time
      const hasConflict = await this.appointmentModel.checkConflicts(
        appointment.doctor_id,
        newDate,
        newTime
      );

      if (hasConflict) {
        throw new Error('Doctor already has an appointment at this time');
      }

      const updatedAppointment = await this.appointmentModel.update(appointmentId, {
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'scheduled' // Reset to scheduled when rescheduled
      });

      return {
        success: true,
        appointment: updatedAppointment,
        message: 'Appointment rescheduled successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default AppointmentService;
