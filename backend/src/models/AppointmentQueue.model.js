import { BaseModel } from './BaseModel.js';

class AppointmentQueueModel extends BaseModel {
  constructor() {
    super('appointment_queue');
  }

  /**
   * Get appointment queue for a doctor on a specific date
   */
  async getByDoctorAndDate(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        id,
        appointment_id,
        doctor_id,
        patient_id,
        queue_position,
        estimated_start_time,
        actual_start_time,
        actual_end_time,
        status,
        priority,
        notes,
        delay_reason,
        delayed_at,
        undelayed_at,
        previous_queue_position,
        created_at,
        updated_at,
        appointment:appointments!appointment_id (
          id,
          appointment_date,
          appointment_time,
          appointment_type,
          reason_for_visit,
          duration_minutes
        ),
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone,
          email
        ),
        doctor:users!doctor_id (
          id,
          first_name,
          last_name,
          specialty
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment.appointment_date', queueDate)
      .in('status', ['queued', 'in_progress', 'delayed']) // Only show active appointments
      .order('queue_position');

    if (error) {
      throw new Error(`Failed to fetch appointment queue: ${error.message}`);
    }

    return data;
  }

  /**
   * Add appointment to queue
   */
  async addToQueue(appointmentId, doctorId, patientId, priority = 1) {
    // Calculate next queue position
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingQueue, error: countError } = await this.supabase
      .from(this.tableName)
      .select('queue_position')
      .eq('doctor_id', doctorId)
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59')
      .order('queue_position', { ascending: false })
      .limit(1);

    if (countError) {
      throw new Error(`Failed to calculate queue position: ${countError.message}`);
    }

    const nextPosition = existingQueue.length > 0 ? existingQueue[0].queue_position + 1 : 1;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        appointment_id: appointmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        queue_position: nextPosition,
        priority: priority,
        status: 'queued'
      })
      .select(`
        *,
        appointment:appointments!appointment_id (
          id,
          appointment_time,
          appointment_type,
          reason_for_visit
        ),
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add appointment to queue: ${error.message}`);
    }

    return data;
  }

  /**
   * Update queue status
   */
  async updateQueueStatus(queueId, status, additionalData = {}) {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    // Add timestamps based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'in_progress':
        updateData.actual_start_time = now;
        break;
      case 'completed':
        updateData.actual_end_time = now;
        break;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', queueId)
      .select(`
        *,
        appointment:appointments!appointment_id (
          id,
          appointment_time,
          appointment_type
        ),
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update queue status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get next appointment in queue
   */
  async getNextAppointment(doctorId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        appointment:appointments!appointment_id (
          id,
          appointment_time,
          appointment_type,
          reason_for_visit,
          duration_minutes
        ),
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('queue_position')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch next appointment: ${error.message}`);
    }

    return data;
  }

  /**
   * Reorder queue positions
   */
  async reorderQueue(doctorId, queueUpdates) {
    const { error } = await this.supabase.rpc('reorder_appointment_queue', {
      doctor_id: doctorId,
      queue_updates: queueUpdates
    });

    if (error) {
      throw new Error(`Failed to reorder queue: ${error.message}`);
    }

    // Return updated queue
    return await this.getByDoctorAndDate(doctorId);
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        status,
        priority,
        actual_start_time,
        actual_end_time,
        estimated_start_time,
        created_at
      `)
      .eq('doctor_id', doctorId)
      .gte('created_at', queueDate + 'T00:00:00')
      .lt('created_at', queueDate + 'T23:59:59');

    if (error) {
      throw new Error(`Failed to fetch queue statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      queued: data.filter(q => q.status === 'queued').length,
      inProgress: data.filter(q => q.status === 'in_progress').length,
      completed: data.filter(q => q.status === 'completed').length,
      skipped: data.filter(q => q.status === 'skipped').length,
      cancelled: data.filter(q => q.status === 'cancelled').length,
      averageWaitTime: this.calculateAverageWaitTime(data),
      totalWaitTime: this.calculateTotalWaitTime(data),
      highPriority: data.filter(q => q.priority > 3).length
    };

    return stats;
  }

  /**
   * Calculate average wait time
   */
  calculateAverageWaitTime(queueData) {
    const completedAppointments = queueData.filter(q => 
      q.status === 'completed' && q.actual_start_time && q.created_at
    );

    if (completedAppointments.length === 0) return 0;

    const totalWaitMinutes = completedAppointments.reduce((sum, appointment) => {
      const waitTime = new Date(appointment.actual_start_time) - new Date(appointment.created_at);
      return sum + (waitTime / (1000 * 60)); // Convert to minutes
    }, 0);

    return Math.round(totalWaitMinutes / completedAppointments.length);
  }

  /**
   * Calculate total wait time for all patients
   */
  calculateTotalWaitTime(queueData) {
    const totalMinutes = queueData.reduce((sum, appointment) => {
      if (appointment.actual_start_time && appointment.created_at) {
        const waitTime = new Date(appointment.actual_start_time) - new Date(appointment.created_at);
        return sum + (waitTime / (1000 * 60));
      }
      return sum;
    }, 0);

    return Math.round(totalMinutes);
  }

  /**
   * Get current appointment being served
   */
  async getCurrentAppointment(doctorId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        appointment:appointments!appointment_id (
          id,
          appointment_time,
          appointment_type,
          reason_for_visit,
          duration_minutes
        ),
        patient:patients!patient_id (
          id,
          patient_number,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'in_progress')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current appointment: ${error.message}`);
    }

    return data;
  }

  /**
   * Estimate wait times for all queued appointments
   */
  async updateEstimatedTimes(doctorId) {
    const queuedAppointments = await this.getByDoctorAndDate(doctorId);
    const currentTime = new Date();
    const avgConsultationTime = 15; // minutes - could be fetched from settings

    let estimatedTime = new Date(currentTime);
    
    for (const appointment of queuedAppointments) {
      if (appointment.status === 'queued') {
        await this.supabase
          .from(this.tableName)
          .update({
            estimated_start_time: estimatedTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', appointment.id);

        // Add consultation time for next appointment
        estimatedTime = new Date(estimatedTime.getTime() + avgConsultationTime * 60000);
      }
    }

    return true;
  }
}

export default AppointmentQueueModel;