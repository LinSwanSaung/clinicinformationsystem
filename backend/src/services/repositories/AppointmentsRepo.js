import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Appointments Repository
 * Centralizes Supabase access for appointment entities.
 */

export const AppointmentId = z.string().min(1);

const Paging = z.object({
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export async function listAppointments(options = {}) {
  const { limit, offset } = Paging.parse(options);
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    throw error;
  }
  return data || [];
}

export async function getAppointmentById(id) {
  const aid = AppointmentId.parse(id);
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', aid)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function createAppointment(payload) {
  const NewAppointment = z
    .object({ patient_id: z.string().min(1), doctor_id: z.string().min(1) })
    .passthrough();
  const insert = NewAppointment.parse(payload);
  const { data, error } = await supabase
    .from('appointments')
    .insert(insert)
    .select('*')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateAppointment(id, patch) {
  const aid = AppointmentId.parse(id);
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', aid)
    .select('*')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
