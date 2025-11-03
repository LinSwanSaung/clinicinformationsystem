import { BaseModel } from './BaseModel.js';

class QueueTokenModel extends BaseModel {
  constructor() {
    super('queue_tokens');
  }

  /**
   * Get queue tokens for a specific doctor on a date with patient details
   */
  async getByDoctorAndDate(doctorId, date) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        visit_id,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          specialty
        ),
        appointment:appointments!appointment_id (
          id,
          appointment_time,
          appointment_type,
          reason_for_visit
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('issued_date', date)
      .order('priority', { ascending: false })
      .order('token_number');

    if (error) {
      throw new Error(`Failed to fetch queue tokens: ${error.message}`);
    }

    return data;
  }

  /**
   * Get current queue status for a doctor (today's active tokens)
   */
  async getCurrentQueueStatus(doctorId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        visit_id,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('issued_date', today)
      .in('status', ['waiting', 'called', 'serving'])
      .order('priority', { ascending: false })
      .order('token_number');

    if (error) {
      throw new Error(`Failed to fetch current queue status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get next token in queue for a doctor
   */
  async getNextToken(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        visit_id,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('issued_date', queueDate)
      .eq('status', 'waiting')
      .order('priority', { ascending: false })
      .order('token_number')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw new Error(`Failed to fetch next token: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a queue token (auto-generates token number)
   */
  async createToken(tokenData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...tokenData,
        issued_date: tokenData.issued_date || new Date().toISOString().split('T')[0],
        status: tokenData.status || 'waiting',
        priority: tokenData.priority || 1,
        estimated_wait_time: tokenData.estimated_wait_time || 7
      })
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          specialty
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create queue token: ${error.message}`);
    }

    return data;
  }

  /**
   * Update token status with timestamp
   */
  async updateStatus(id, status, additionalData = {}) {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    // Add appropriate timestamp based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'called':
        updateData.called_at = now;
        break;
      case 'serving':
        updateData.served_at = now;
        updateData.in_consult_at = now;
        break;
      case 'completed':
        updateData.done_at = now;
        break;
      case 'missed':
        updateData.late_at = now;
        break;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update token status: ${error.message}`);
    }

    return data;
  }

  /**
   * Update token priority (for urgent/priority patients)
   */
  async updateTokenPriority(tokenId, priority) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        priority: priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update token priority: ${error.message}`);
    }

    return data;
  }

  /**
   * Get queue statistics for a doctor and date
   */
  async getQueueStats(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error} = await this.supabase
      .from(this.tableName)
      .select('status, priority, estimated_wait_time')
      .eq('doctor_id', doctorId)
      .eq('issued_date', queueDate);

    if (error) {
      throw new Error(`Failed to fetch queue statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      waiting: data.filter(t => t.status === 'waiting').length,
      called: data.filter(t => t.status === 'called').length,
      serving: data.filter(t => t.status === 'serving').length,
      completed: data.filter(t => t.status === 'completed').length,
      missed: data.filter(t => t.status === 'missed').length,
      cancelled: data.filter(t => t.status === 'cancelled').length,
      averageWaitTime: data.length > 0 
        ? Math.round(data.reduce((sum, t) => sum + t.estimated_wait_time, 0) / data.length)
        : 0,
      highPriority: data.filter(t => t.priority > 3).length
    };

    return stats;
  }

  /**
   * Get token by visit ID
   */
  async getTokenByVisitId(visitId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          gender,
          phone
        )
      `)
      .eq('visit_id', visitId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw new Error(`Failed to fetch token by visit ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Get patient's current token for today
   */
  async getPatientCurrentToken(patientId, doctorId = null) {
    const today = new Date().toISOString().split('T')[0];
    
    let query = this.supabase
      .from(this.tableName)
      .select('*')  // Simplified query without joins for now
      .eq('patient_id', patientId)
      .eq('issued_date', today)
      .in('status', ['waiting', 'called', 'serving']);

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch patient current token: ${error.message}`);
    }

    return data.length > 0 ? data[0] : null;
  }

  /**
   * Check if doctor has any active consultation TODAY
   */
  async getActiveConsultation(doctorId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        visit_id,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('issued_date', today)  // Only check today's tokens
      .eq('status', 'serving')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch active consultation: ${error.message}`);
    }

    return data;
  }

  /**
   * Get queue history for reporting
   */
  async getQueueHistory(doctorId, startDate, endDate) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name
        )
      `)
      .eq('doctor_id', doctorId)
      .gte('issued_date', startDate)
      .lte('issued_date', endDate)
      .order('issued_date', { ascending: false })
      .order('token_number');

    if (error) {
      throw new Error(`Failed to fetch queue history: ${error.message}`);
    }

    return data;
  }
  /**
   * Find serving token by doctor
   */
  async findServingTokenByDoctor(doctorId) {
    try {
      const { data, error } = await this.supabase
        .from('queue_tokens')
        .select(`
          *,
          visit_id,
          patient:patients!patient_id (
            id,
            first_name,
            last_name,
            phone,
            gender,
            date_of_birth
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'serving')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding serving token by doctor:', error);
      throw new Error(`Failed to find serving token: ${error.message}`);
    }
  }

}

export default QueueTokenModel;