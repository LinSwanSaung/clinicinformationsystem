import { BaseModel } from './BaseModel.js';
import logger from '../config/logger.js';

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
   * Looks for tokens that are waiting, ready, or called (not yet being served)
   * Orders by token_number first (ascending) to ensure patients are called in token order
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
      .in('status', ['waiting', 'ready', 'called']) // Include all statuses that mean "ready to be seen"
      .order('token_number', { ascending: true }) // Primary sort: token number order
      .order('priority', { ascending: false }) // Secondary sort: priority (fallback)
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
  /**
   * Atomically start consultation using database function with advisory locks
   * This prevents race conditions when multiple requests try to start consultations
   * for the same doctor simultaneously
   */
  async startConsultationAtomic(tokenId, doctorId) {
    try {
      const { data, error } = await this.supabase.rpc('start_consultation_atomic', {
        p_token_id: tokenId,
        p_doctor_id: doctorId,
      });

      if (error) {
        throw new Error(`Failed to start consultation atomically: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from start_consultation_atomic function');
      }

      const result = data[0];
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to start consultation');
      }

      // Parse token_data JSONB back to object
      const tokenData = result.token_data;
      
      return {
        success: true,
        message: result.message,
        token: tokenData,
      };
    } catch (error) {
      logger.error('Error in startConsultationAtomic:', error);
      throw error;
    }
  }

  /**
   * Validate status transition
   * @param {string} currentStatus - Current token status
   * @param {string} newStatus - Desired new status
   * @param {boolean} bypassValidation - If true, skip validation (for admin overrides)
   * @returns {boolean} True if transition is valid
   */
  validateStatusTransition(currentStatus, newStatus, bypassValidation = false) {
    if (bypassValidation) {
      return true; // Admin can bypass validation
    }

    // Define valid status transitions (must match database constraint)
    // Valid statuses: 'waiting', 'called', 'serving', 'completed', 'missed', 'cancelled', 'delayed'
    const validTransitions = {
      'waiting': ['called', 'delayed', 'missed', 'cancelled'],
      'delayed': ['waiting', 'called', 'missed', 'cancelled'],
      'called': ['serving', 'waiting', 'delayed', 'missed', 'cancelled'],
      'serving': ['completed', 'cancelled'],
      'completed': [], // Cannot transition from completed
      'missed': ['cancelled'], // Can only be cancelled
      'cancelled': [], // Cannot transition from cancelled
    };

    const allowedStatuses = validTransitions[currentStatus] || [];
    
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot change from '${currentStatus}' to '${newStatus}'. ` +
        `Valid transitions from '${currentStatus}': ${allowedStatuses.join(', ') || 'none'}`
      );
    }

    return true;
  }

  async updateStatus(id, status, additionalData = {}, bypassValidation = false) {
    // Get current status to validate transition
    const currentToken = await this.findById(id);
    if (!currentToken) {
      throw new Error(`Token with id ${id} not found`);
    }

    const currentStatus = currentToken.status;

    // Validate status transition (unless it's the same status or bypass is requested)
    if (currentStatus !== status && !bypassValidation) {
      this.validateStatusTransition(currentStatus, status, bypassValidation);
    }

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
   * Get all tokens for a patient today (optionally filter by doctor)
   */
  async getPatientTokensToday(patientId, doctorId = null, statuses = ['waiting', 'called', 'serving']) {
    const today = new Date().toISOString().split('T')[0];

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .eq('issued_date', today);

    if (Array.isArray(statuses) && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch patient tokens: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if doctor has any active consultation TODAY
   */
  async getActiveConsultation(doctorId, includeAllDates = false) {
    let query = this.supabase
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
      .eq('status', 'serving');
    
    // Only filter by today's date if not including all dates (for cleanup/debugging)
    if (!includeAllDates) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('issued_date', today);
    }
    
    // Order by most recent first, then get first result
    query = query.order('served_at', { ascending: false, nullsFirst: false })
                 .limit(1);
    
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch active consultation: ${error.message}`);
    }

    // Return first result or null
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Detect stuck consultations (serving tokens from previous days)
   * Returns list of stuck tokens that should be auto-completed
   */
  async detectStuckConsultations(doctorId = null, maxAgeHours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    const today = new Date().toISOString().split('T')[0];
    
    let query = this.supabase
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
      .eq('status', 'serving')
      .neq('issued_date', today) // Only tokens from previous days
      .lt('served_at', cutoffTime.toISOString()); // Older than maxAgeHours
    
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }
    
    query = query.order('served_at', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to detect stuck consultations: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Find ALL serving tokens for a doctor (for debugging/cleanup)
   * This bypasses date filtering to find stuck tokens
   */
  async getAllServingTokens(doctorId) {
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
      .eq('status', 'serving')
      .order('served_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch serving tokens: ${error.message}`);
    }

    return data || [];
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
      logger.error('Error finding serving token by doctor:', error);
      throw new Error(`Failed to find serving token: ${error.message}`);
    }
  }

}

export default QueueTokenModel;