import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Queue Repository
 * Centralizes direct Supabase access for queue_tokens and related queue operations
 */

const DoctorId = z.string().uuid();
const TokenId = z.string().uuid();
const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Get doctor availability for a specific day
 * @param {string} doctorId
 * @param {string} dayOfWeek
 * @returns {Promise<any[]>}
 */
export async function getDoctorAvailabilityForDay(doctorId, dayOfWeek) {
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
 * Get current queue tokens for doctor on a specific date
 * @param {string} doctorId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string[]} statuses - Array of statuses to filter
 * @returns {Promise<any[]>}
 */
export async function getQueueTokensByDoctorAndDate(
  doctorId,
  date,
  statuses = ['waiting', 'called', 'in_consultation']
) {
  const did = DoctorId.parse(doctorId);
  const dateStr = DateString.parse(date);
  let query = supabase
    .from('queue_tokens')
    .select('id, status')
    .eq('doctor_id', did)
    .eq('issued_date', dateStr);

  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get queue tokens with filters
 * @param {Object} filters
 * @returns {Promise<any[]>}
 */
export async function getQueueTokens(filters = {}) {
  let query = supabase.from('queue_tokens').select('*');

  if (filters.doctor_id) {
    query = query.eq('doctor_id', filters.doctor_id);
  }
  if (filters.patient_id) {
    query = query.eq('patient_id', filters.patient_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.statuses && Array.isArray(filters.statuses)) {
    query = query.in('status', filters.statuses);
  }
  if (filters.issued_date) {
    query = query.eq('issued_date', filters.issued_date);
  }
  if (filters.date_range_start) {
    query = query.gte('issued_date', filters.date_range_start);
  }
  if (filters.date_range_end) {
    query = query.lte('issued_date', filters.date_range_end);
  }

  if (filters.orderBy) {
    query = query.order(filters.orderBy, { ascending: filters.ascending !== false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get queue token by ID
 * @param {string} tokenId
 * @returns {Promise<any>}
 */
export async function getQueueTokenById(tokenId) {
  const tid = TokenId.parse(tokenId);
  const { data, error } = await supabase.from('queue_tokens').select('*').eq('id', tid).single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get max token number for doctor/date
 * @param {string} doctorId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<number>}
 */
export async function getMaxTokenNumber(doctorId, date) {
  const did = DoctorId.parse(doctorId);
  const dateStr = DateString.parse(date);
  const { data, error } = await supabase
    .from('queue_tokens')
    .select('token_number')
    .eq('doctor_id', did)
    .eq('issued_date', dateStr)
    .order('token_number', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? data[0].token_number : 0;
}

/**
 * Create queue token
 * @param {Object} tokenData
 * @returns {Promise<any>}
 */
export async function createQueueToken(tokenData) {
  const { data, error } = await supabase.from('queue_tokens').insert(tokenData).select().single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update queue token
 * @param {string} tokenId
 * @param {Object} updateData
 * @returns {Promise<any>}
 */
export async function updateQueueToken(tokenId, updateData) {
  const tid = TokenId.parse(tokenId);
  const { data, error } = await supabase
    .from('queue_tokens')
    .update(updateData)
    .eq('id', tid)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get queue statistics for a doctor
 * @param {string} doctorId
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function getQueueStatistics(doctorId, date) {
  const did = DoctorId.parse(doctorId);
  const dateStr = DateString.parse(date);

  // Get all tokens for the day
  const { data: allTokens, error } = await supabase
    .from('queue_tokens')
    .select('status')
    .eq('doctor_id', did)
    .eq('issued_date', dateStr);

  if (error) {
    throw error;
  }

  const stats = {
    total: allTokens?.length || 0,
    waiting: allTokens?.filter((t) => t.status === 'waiting').length || 0,
    called: allTokens?.filter((t) => t.status === 'called').length || 0,
    in_consultation: allTokens?.filter((t) => t.status === 'in_consultation').length || 0,
    completed: allTokens?.filter((t) => t.status === 'completed').length || 0,
    cancelled: allTokens?.filter((t) => t.status === 'cancelled').length || 0,
  };

  return stats;
}
