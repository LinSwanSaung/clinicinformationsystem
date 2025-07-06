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
      const { date, patient_id, doctor_id } = filters;

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
      // Validate required fields
      const requiredFields = ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time'];
      for (const field of requiredFields) {
        if (!appointmentData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Check for conflicts
      const hasConflict = await this.appointmentModel.checkConflicts(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time
      );

      if (hasConflict) {
        throw new Error('Doctor already has an appointment at this time');
      }

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
      console.log('Service: Updating appointment status:', { id, status }); // Debug log
      
      // Validate status
      const validStatuses = ['scheduled', 'waiting', 'ready_for_doctor', 'consulting', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const existingAppointment = await this.appointmentModel.findById(id);
      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      console.log('Service: Found existing appointment, updating status...'); // Debug log
      const updatedAppointment = await this.appointmentModel.updateStatus(id, status);
      console.log('Service: Status updated successfully'); // Debug log
      
      return updatedAppointment;
    } catch (error) {
      console.error('Service Error:', error.message); // Debug log
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
}

export default AppointmentService;
