import VisitModel from '../models/Visit.model.js';

/**
 * Visit Service
 * Handles visit-related business logic including comprehensive visit history
 */
class VisitService {
  constructor() {
    this.visitModel = new VisitModel();
  }

  /**
   * Get comprehensive patient visit history
   */
  async getPatientVisitHistory(patientId, options = {}) {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const visits = await this.visitModel.getPatientVisitHistory(patientId, options);
      
      return {
        success: true,
        data: visits,
        total: visits.length,
        patient_id: patientId
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single visit with all details
   */
  async getVisitDetails(visitId) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      const visit = await this.visitModel.getVisitWithDetails(visitId);
      
      return {
        success: true,
        data: visit
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get patient's active visit (in_progress status)
   */
  async getPatientActiveVisit(patientId) {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const visit = await this.visitModel.getPatientActiveVisit(patientId);
      
      return visit; // Return visit directly (can be null)
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new visit
   */
  async createVisit(visitData) {
    try {
      const requiredFields = ['patient_id', 'doctor_id'];
      const missingFields = requiredFields.filter(field => !visitData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Set default values and remove fields not in schema
      const { created_by, updated_by, ...cleanVisitData } = visitData;
      
      const visitToCreate = {
        visit_date: new Date().toISOString(),
        status: 'in_progress',
        payment_status: 'pending',
        ...cleanVisitData
      };

      const visit = await this.visitModel.create(visitToCreate);
      
      return {
        success: true,
        data: visit,
        message: 'Visit created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update visit
   */
  async updateVisit(visitId, updateData) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      // Remove fields not in schema
      const { created_by, updated_by, ...cleanUpdateData } = updateData;

      const visit = await this.visitModel.update(visitId, cleanUpdateData);
      
      return {
        success: true,
        data: visit,
        message: 'Visit updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete visit with final calculations
   */
  async completeVisit(visitId, completionData = {}) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      const completedVisit = await this.visitModel.completeVisit(visitId, completionData);
      
      return {
        success: true,
        data: completedVisit,
        message: 'Visit completed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all visits (for admin/reports)
   */
  async getAllVisits(options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        status = null, 
        doctor_id = null,
        start_date = null,
        end_date = null 
      } = options;

      let query = this.visitModel.supabase
        .from('visits')
        .select(`
          *,
          doctor:users!doctor_id (
            id,
            first_name,
            last_name,
            specialty
          ),
          patient:patients!patient_id (
            id,
            patient_number,
            first_name,
            last_name
          )
        `)
        .order('visit_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      if (start_date) {
        query = query.gte('visit_date', start_date);
      }

      if (end_date) {
        query = query.lte('visit_date', end_date);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch visits: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        total: data?.length || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get visit statistics
   */
  async getVisitStatistics(options = {}) {
    try {
      const { doctor_id = null, start_date = null, end_date = null } = options;

      let baseQuery = this.visitModel.supabase.from('visits').select('*', { count: 'exact' });

      if (doctor_id) {
        baseQuery = baseQuery.eq('doctor_id', doctor_id);
      }

      if (start_date) {
        baseQuery = baseQuery.gte('visit_date', start_date);
      }

      if (end_date) {
        baseQuery = baseQuery.lte('visit_date', end_date);
      }

      const [
        { count: totalVisits },
        { count: completedVisits },
        { count: inProgressVisits },
        { count: cancelledVisits }
      ] = await Promise.all([
        baseQuery,
        { ...baseQuery }.eq('status', 'completed'),
        { ...baseQuery }.eq('status', 'in_progress'),
        { ...baseQuery }.eq('status', 'cancelled')
      ]);

      // Calculate revenue from completed visits
      const { data: revenueData } = await this.visitModel.supabase
        .from('visits')
        .select('total_cost')
        .eq('status', 'completed')
        .not('total_cost', 'is', null);

      const totalRevenue = revenueData?.reduce((sum, visit) => sum + (visit.total_cost || 0), 0) || 0;

      return {
        success: true,
        data: {
          total_visits: totalVisits || 0,
          completed_visits: completedVisits || 0,
          in_progress_visits: inProgressVisits || 0,
          cancelled_visits: cancelledVisits || 0,
          total_revenue: totalRevenue,
          completion_rate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update visit status
   */
  async updateVisitStatus(visitId, status) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      if (!status) {
        throw new Error('Status is required');
      }

      // Validate status
      const validStatuses = ['in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Update the visit status
      const { data, error } = await this.visitModel.supabase
        .from('visits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update visit status: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: `Visit status updated to ${status}`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete visit
   */
  async deleteVisit(visitId) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      await this.visitModel.delete(visitId);
      
      return {
        success: true,
        message: 'Visit deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default VisitService;