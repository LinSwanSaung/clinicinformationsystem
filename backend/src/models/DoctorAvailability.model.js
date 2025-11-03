import { BaseModel } from './BaseModel.js';

/**
 * DoctorAvailability Model
 * Handles database operations for doctor availability
 */
class DoctorAvailabilityModel extends BaseModel {
  constructor() {
    super('doctor_availability');
  }

  /**
   * Get all availability records with doctor details
   */
  async getAllWithDoctorDetails() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        users!doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .not('doctor_id', 'is', null)
      .order('day_of_week, start_time');

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get availability by doctor ID
   */
  async getByDoctorId(doctorId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        users!doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('doctor_id', doctorId)
      .order('day_of_week, start_time');

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get availability by doctor ID and day of week
   */
  async getByDoctorAndDay(doctorId, dayOfWeek) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .order('start_time');

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create new availability record
   */
  async create(availabilityData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(availabilityData)
      .select(
        `
        *,
        users!doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update availability record
   */
  async update(id, availabilityData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(availabilityData)
      .eq('id', id)
      .select(
        `
        *,
        users!doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete availability record
   */
  async delete(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete all availability records for a doctor on a specific day
   */
  async deleteByDoctorAndDay(doctorId, dayOfWeek) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get doctors who are available on a specific day and time
   */
  async getAvailableDoctors(dayOfWeek, time) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        users!doctor_id (
          id,
          first_name,
          last_name,
          email,
          specialization
        )
      `
      )
      .eq('day_of_week', dayOfWeek)
      .lte('start_time', time)
      .gte('end_time', time)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Check if doctor is available at specific day and time
   */
  async isDoctorAvailable(doctorId, dayOfWeek, time) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .lte('start_time', time)
      .gte('end_time', time)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  }

  /**
   * Get availability with 12-hour format using database function
   */
  async getAllWith12HourFormat() {
    const { data, error } = await this.supabase.rpc('get_doctor_availability_12hr');

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get availability for a specific doctor with 12-hour format
   */
  async getDoctorAvailabilityWith12HourFormat(doctorId) {
    const { data, error } = await this.supabase
      .rpc('get_doctor_availability_12hr')
      .eq('doctor_id', doctorId);

    if (error) {
      throw error;
    }

    return data;
  }
}

export default DoctorAvailabilityModel;
