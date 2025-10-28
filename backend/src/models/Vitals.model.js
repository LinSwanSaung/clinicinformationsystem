import { BaseModel } from './BaseModel.js';

class VitalsModel extends BaseModel {
  constructor() {
    super('vitals');
  }

  /**
   * Create new vitals record
   */
  async create(vitalsData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(vitalsData)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        recorded_by_user:users!recorded_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create vitals: ${error.message}`);
    }

    return data;
  }

  /**
   * Get vitals by patient ID
   */
  async getByPatientId(patientId, limit = null) {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        recorded_by_user:users!recorded_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch patient vitals: ${error.message}`);
    }

    return data;
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestByPatientId(patientId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        recorded_by_user:users!recorded_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch latest vitals: ${error.message}`);
    }

    return data;
  }

  /**
   * Update vitals record
   */
  async update(id, vitalsData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(vitalsData)
      .eq('id', id)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        recorded_by_user:users!recorded_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update vitals: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete vitals record
   */
  async delete(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete vitals: ${error.message}`);
    }

    return data;
  }

  /**
   * Get vitals by visit ID
   */
  async getByVisitId(visitId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        ),
        recorded_by_user:users!recorded_by (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('visit_id', visitId)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch visit vitals: ${error.message}`);
    }

    return data;
  }
}

export default VitalsModel;