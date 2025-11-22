import { supabaseAdmin as supabase } from '../config/database.js';
import { BaseModel } from './BaseModel.js';

class PatientAllergyModel extends BaseModel {
  constructor() {
    super('patient_allergies');
    this.table = 'patient_allergies'; // Add this for compatibility
  }

  /**
   * Get all allergies for a patient
   */
  async getByPatientId(patientId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Create new allergy
   */
  async create(allergyData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(allergyData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Update allergy
   */
  async update(id, allergyData) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ ...allergyData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Soft delete allergy (mark as inactive)
   */
  async softDelete(id) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        is_active: false, 
        deleted_at: new Date(),
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get active allergies with patient info
   */
  async getActiveAllergies() {
    const { data, error } = await supabase
      .from('active_patient_allergies')
      .select('*');

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Find allergy by ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }
    return data;
  }
}

export default new PatientAllergyModel();
