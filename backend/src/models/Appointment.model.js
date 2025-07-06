import { BaseModel } from './BaseModel.js';

class AppointmentModel extends BaseModel {
  constructor() {
    super('appointments');
  }

  /**
   * Get appointments by date with patient and doctor details
   */
  async getByDate(date) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          email,
          specialty
        )
      `)
      .eq('appointment_date', date)
      .order('appointment_time');

    if (error) {
      throw new Error(`Failed to fetch appointments by date: ${error.message}`);
    }

    return data;
  }

  /**
   * Get appointments by patient ID
   */
  async getByPatientId(patientId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          email,
          specialty
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch appointments by patient: ${error.message}`);
    }

    return data;
  }

  /**
   * Get appointments by doctor ID
   */
  async getByDoctorId(doctorId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch appointments by doctor: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all appointments with related data
   */
  async getAllWithDetails() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          email,
          specialty
        )
      `)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return data;
  }

  /**
   * Update appointment status
   */
  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }

    return data;
  }

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(doctorId, appointmentDate, appointmentTime, excludeId = null) {
    let query = this.supabase
      .from(this.tableName)
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .neq('status', 'cancelled');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check appointment conflicts: ${error.message}`);
    }

    return data.length > 0;
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId, date) {
    // Get existing appointments for the doctor on this date
    const { data: existingAppointments, error } = await this.supabase
      .from(this.tableName)
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (error) {
      throw new Error(`Failed to fetch existing appointments: ${error.message}`);
    }

    // Generate all possible time slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeSlot);
      }
    }

    // Filter out taken slots
    const takenSlots = existingAppointments.map(apt => apt.appointment_time);
    const availableSlots = allSlots.filter(slot => !takenSlots.includes(slot));

    return availableSlots;
  }

  /**
   * Update appointment status
   */
  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          email,
          specialty
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }

    return data;
  }
}

export default AppointmentModel;
