import { BaseModel } from './BaseModel.js';

/**
 * Prescription Model
 * Handles database operations for prescriptions
 */
class PrescriptionModel extends BaseModel {
  constructor() {
    super('prescriptions');
  }

  /**
   * Create a new prescription
   */
  async create(prescriptionData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(prescriptionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create prescription: ${error.message}`);
    }

    return data;
  }

  /**
   * Get prescriptions by patient ID
   */
  async getByPatientId(patientId, includeInactive = false) {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        doctor:users!doctor_id (
          id,
          first_name,
          last_name
        ),
        visit:visits!visit_id (
          id,
          visit_date,
          status
        )
      `)
      .eq('patient_id', patientId)
      .order('prescribed_date', { ascending: false });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch prescriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get prescriptions by visit ID
   */
  async getByVisitId(visitId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        doctor:users!doctor_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('visit_id', visitId)
      .order('prescribed_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch prescriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update prescription status
   */
  async updateStatus(prescriptionId, status) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', prescriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update prescription status: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete prescription (soft delete by setting status to cancelled)
   */
  async delete(prescriptionId) {
    return this.updateStatus(prescriptionId, 'cancelled');
  }
}

export default PrescriptionModel;
