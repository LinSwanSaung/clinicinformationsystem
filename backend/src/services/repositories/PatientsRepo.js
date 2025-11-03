import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Patients Repository
 * Centralizes all direct Supabase access for the patients entity.
 * Validates inputs/outputs with zod and exposes small, composable functions.
 */

// Schemas
export const PatientId = z.string().min(1, 'patient id required');

// We allow passthrough to avoid breaking changes while still asserting key fields
export const PatientRecord = z
  .object({
    id: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    patient_number: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const ListOptions = z
  .object({
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0),
    orderBy: z.string().default('created_at'),
    ascending: z.boolean().default(false),
    filters: z.record(z.any()).optional(),
  })
  .partial()
  .default({});

/**
 * List patients
 * @param {Object} options
 * @returns {Promise<{data: any[], count?: number}>}
 */
export async function listPatients(options = {}) {
  const opts = ListOptions.parse(options);
  let query = supabase.from('patients').select('*');

  // filters
  if (opts.filters) {
    Object.entries(opts.filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        query = query.eq(k, v);
      }
    });
  }

  query = query.order(opts.orderBy, { ascending: !!opts.ascending });
  if (opts.limit !== undefined) {
    query = query.range(opts.offset || 0, (opts.offset || 0) + (opts.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return { data: (data || []).map((r) => PatientRecord.parse(r)) };
}

/**
 * Get a patient by id
 */
export async function getPatientById(id) {
  const pid = PatientId.parse(id);
  const { data, error } = await supabase.from('patients').select('*').eq('id', pid).maybeSingle();
  if (error) {
    throw error;
  }
  return data ? PatientRecord.parse(data) : null;
}

/**
 * Search patients by text
 */
export async function searchPatients(term, options = {}) {
  const t = z.string().min(2).parse(term);
  const opts = ListOptions.parse(options);
  let query = supabase
    .from('patients')
    .select('*')
    .or(
      `first_name.ilike.%${t}%,last_name.ilike.%${t}%,patient_number.ilike.%${t}%,phone.ilike.%${t}%`
    )
    .order('first_name', { ascending: true });

  if (opts.limit !== undefined) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data || []).map((r) => PatientRecord.parse(r));
}

/**
 * Create patient
 */
export async function createPatient(input) {
  const Input = PatientRecord.omit({ id: true, created_at: true, updated_at: true }).passthrough();
  const payload = Input.parse(input);

  const { data, error } = await supabase
    .from('patients')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? PatientRecord.parse(data) : null;
}

/**
 * Update patient
 */
export async function updatePatient(id, input) {
  const pid = PatientId.parse(id);
  const Input = PatientRecord.omit({ id: true, created_at: true }).partial().passthrough();
  const payload = Input.parse(input);

  const { data, error } = await supabase
    .from('patients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', pid)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? PatientRecord.parse(data) : null;
}

/**
 * Delete patient
 */
export async function deletePatient(id) {
  const pid = PatientId.parse(id);
  const { error } = await supabase.from('patients').delete().eq('id', pid);
  if (error) {
    throw error;
  }
  return true;
}
