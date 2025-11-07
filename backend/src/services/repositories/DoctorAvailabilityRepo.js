import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Doctor Availability Repository
 * Centralizes direct Supabase access for doctor_availability entity
 */

const DoctorId = z.string().uuid();
const AvailabilityId = z.string().uuid();

/**
 * Get availability by doctor ID
 * @param {string} doctorId
 * @returns {Promise<any[]>}
 */
export async function getAvailabilityByDoctorId(doctorId) {
  const did = DoctorId.parse(doctorId);
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', did)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get availability by doctor ID and day of week
 * @param {string} doctorId
 * @param {string} dayOfWeek
 * @returns {Promise<any[]>}
 */
export async function getAvailabilityByDoctorAndDay(doctorId, dayOfWeek) {
  const did = DoctorId.parse(doctorId);
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', did)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get all availability with doctor details
 * @returns {Promise<any[]>}
 */
export async function getAllAvailabilityWithDoctorDetails() {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*, doctor:doctor_id(id, first_name, last_name, specialty)')
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create availability record
 * @param {Object} availabilityData
 * @returns {Promise<any>}
 */
export async function createAvailability(availabilityData) {
  const { data, error } = await supabase
    .from('doctor_availability')
    .insert(availabilityData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update availability record
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<any>}
 */
export async function updateAvailability(id, updateData) {
  const aid = AvailabilityId.parse(id);
  const { data, error } = await supabase
    .from('doctor_availability')
    .update(updateData)
    .eq('id', aid)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete availability record (soft delete)
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAvailability(id) {
  const aid = AvailabilityId.parse(id);
  const { error } = await supabase
    .from('doctor_availability')
    .update({ is_active: false })
    .eq('id', aid);

  if (error) {
    throw error;
  }
}

/**
 * Get appointments for doctor on a specific date
 * Used for conflict checking
 * @param {string} doctorId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<any[]>}
 */
export async function getAppointmentsByDoctorAndDate(doctorId, date) {
  const did = DoctorId.parse(doctorId);
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', did)
    .eq('appointment_date', date);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get queue tokens for doctor on a specific date
 * Used for capacity checking
 * @param {string} doctorId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<any[]>}
 */
export async function getQueueTokensByDoctorAndDate(doctorId, date) {
  const did = DoctorId.parse(doctorId);
  const { data, error } = await supabase
    .from('queue_tokens')
    .select('*')
    .eq('doctor_id', did)
    .eq('issued_date', date);

  if (error) {
    throw error;
  }

  return data || [];
}
