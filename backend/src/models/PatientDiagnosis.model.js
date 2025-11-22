import { supabaseAdmin as supabase } from '../config/database.js';
import { BaseModel } from './BaseModel.js';

class PatientDiagnosisModel extends BaseModel {
  constructor() {
    super('patient_diagnoses');
    this.table = 'patient_diagnoses'; // Add this for compatibility
  }

  /**
   * Get all diagnoses for a patient
   */
  async getByPatientId(patientId, includeResolved = false) {
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('diagnosed_date', { ascending: false });

    if (!includeResolved) {
      query = query.in('status', ['active', 'chronic', 'in_remission', 'recurring']);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get diagnoses for a specific visit
   */
  async getByVisitId(visitId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('visit_id', visitId)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Create new diagnosis
   */
  async create(diagnosisData) {
    const { data, error } = await supabase.from(this.table).insert(diagnosisData).select().single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Update diagnosis
   */
  async update(id, diagnosisData) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ ...diagnosisData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Update diagnosis status
   */
  async updateStatus(id, status, resolvedDate = null) {
    const updateData = {
      status,
      updated_at: new Date(),
    };

    if (status === 'resolved' && resolvedDate) {
      updateData.resolved_date = resolvedDate;
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get active diagnoses
   */
  async getActiveDiagnoses() {
    const { data, error } = await supabase.from('active_patient_diagnoses').select('*');

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Find diagnosis by ID
   */
  async findById(id) {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Soft delete diagnosis
   */
  async softDelete(id) {
    const { data, error } = await supabase
      .from(this.table)
      .update({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }
}

export default new PatientDiagnosisModel();
