import { z } from 'zod';
import { supabaseAdmin } from '../../config/database.js';

/**
 * Patient Diagnosis Repository
 * Centralizes all direct Supabase access for patient_diagnoses entity
 */

const DiagnosisId = z.string().uuid();
const PatientId = z.string().uuid();
const VisitId = z.string().uuid();

/**
 * Get diagnoses by patient ID
 * @param {string} patientId
 * @param {boolean} includeResolved
 * @returns {Promise<any[]>}
 */
export async function getDiagnosesByPatient(patientId, includeResolved = false) {
  const pid = PatientId.parse(patientId);
  let query = supabaseAdmin
    .from('patient_diagnoses')
    .select('*')
    .eq('patient_id', pid)
    .order('diagnosed_date', { ascending: false });

  if (!includeResolved) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get diagnoses by visit ID
 * @param {string} visitId
 * @returns {Promise<any[]>}
 */
export async function getDiagnosesByVisit(visitId) {
  const vid = VisitId.parse(visitId);
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .select('*')
    .eq('visit_id', vid)
    .order('diagnosed_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get diagnosis by ID
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function getDiagnosisById(id) {
  const did = DiagnosisId.parse(id);
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .select('*')
    .eq('id', did)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Create diagnosis
 * @param {Object} diagnosisData
 * @returns {Promise<any>}
 */
export async function createDiagnosis(diagnosisData) {
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .insert(diagnosisData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update diagnosis
 * @param {string} id
 * @param {Object} diagnosisData
 * @returns {Promise<any>}
 */
export async function updateDiagnosis(id, diagnosisData) {
  const did = DiagnosisId.parse(id);
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .update(diagnosisData)
    .eq('id', did)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update diagnosis status
 * @param {string} id
 * @param {string} status
 * @param {string|null} resolvedDate
 * @returns {Promise<any>}
 */
export async function updateDiagnosisStatus(id, status, resolvedDate = null) {
  const did = DiagnosisId.parse(id);
  const updateData = { status };
  if (resolvedDate) {
    updateData.resolved_date = resolvedDate;
  }

  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .update(updateData)
    .eq('id', did)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Soft delete diagnosis
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function softDeleteDiagnosis(id) {
  const did = DiagnosisId.parse(id);
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', did)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all active diagnoses
 * @returns {Promise<any[]>}
 */
export async function getActiveDiagnoses() {
  const { data, error } = await supabaseAdmin
    .from('patient_diagnoses')
    .select('*')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('diagnosed_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get first doctor ID (for default assignment)
 * @returns {Promise<string|null>}
 */
export async function getFirstDoctorId() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'doctor')
    .limit(1);

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? data[0].id : null;
}
