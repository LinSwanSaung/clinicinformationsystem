import { BaseModel } from './BaseModel.js';
import logger from '../config/logger.js';

/**
 * Visit Model with comprehensive data relationships
 */
class VisitModel extends BaseModel {
  constructor() {
    super('visits');
  }

  /**
   * Get comprehensive visit history for a patient
   * Includes all related data: allergies, diagnoses, prescriptions, vitals, services
   */
  async getPatientVisitHistory(patientId, options = {}) {
    const { limit = 50, offset = 0, includeCompleted = true, includeInProgress = false } = options;

    // Build query
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
          *,
          doctor:users!doctor_id (
            id,
            first_name,
            last_name,
            specialty
          ),
          appointment:appointments!appointment_id (
            id,
            appointment_type,
            reason_for_visit
          )
        `
      )
      .eq('patient_id', patientId);

    // Filter by status based on options
    // If includeInProgress is true, show all visits (no status filter)
    // Otherwise, show only completed or in_progress based on includeCompleted flag
    if (!includeInProgress) {
      if (includeCompleted) {
        // Show only completed visits
        query = query.eq('status', 'completed');
      } else {
        // Show only in_progress visits
        query = query.eq('status', 'in_progress');
      }
    }

    const { data: visits, error } = await query
      .order('visit_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error(`[VISIT MODEL] ❌ Error fetching visits:`, error);
      throw new Error(`Failed to fetch patient visit history: ${error.message}`);
    }

    // Enhance each visit with related data
    const enhancedVisits = await Promise.all(
      (visits || []).map(async (visit) => {
        return this.enhanceVisitWithRelatedData(visit);
      })
    );

    return enhancedVisits;
  }

  /**
   * Enhance visit with all related medical data
   */
  async enhanceVisitWithRelatedData(visit) {
    try {
      const [allergies, diagnoses, prescriptions, vitals, services, invoice] = await Promise.all([
        this.getVisitAllergies(visit.id, visit.visit_date),
        this.getVisitDiagnoses(visit.id, visit.visit_date),
        this.getVisitPrescriptions(visit.id),
        this.getVisitVitals(visit.id),
        this.getVisitServices(visit.id),
        this.getVisitInvoice(visit.id),
      ]);

      return {
        ...visit,
        doctor_name: visit.doctor
          ? `${visit.doctor.first_name} ${visit.doctor.last_name}`
          : 'Unknown',
        allergies,
        visit_diagnoses: diagnoses,
        prescriptions,
        vitals,
        services,
        invoice,
        // Only show consultation fee and costs when an invoice exists (actual charges)
        // Don't show placeholder/estimated costs - only real charges from invoices
        consultation_fee:
          invoice?.service_items?.find((s) => s.item_name?.toLowerCase().includes('consultation'))
            ?.total_price || null,
        services_total: invoice?.services_total || null,
        medications_total: invoice?.medications_total || null,
        // Only show total_cost if invoice exists (actual charge)
        total_cost: invoice?.total_amount || null,
        payment_status: invoice ? (invoice.status === 'paid' ? 'paid' : 'pending') : 'no_invoice',
        invoice_number: invoice?.invoice_number,
        invoice_status: invoice?.status || 'no_invoice',
        // Add medicine counts
        dispensed_medicine_count: invoice?.medicine_count || 0,
        prescribed_medicine_count: prescriptions?.length || 0,
      };
    } catch (error) {
      logger.error('Error enhancing visit data:', error);
      return {
        ...visit,
        doctor_name: visit.doctor
          ? `${visit.doctor.first_name} ${visit.doctor.last_name}`
          : 'Unknown',
        allergies: [],
        visit_diagnoses: [],
        prescriptions: [],
        vitals: null,
        services: [],
        invoice: null,
        consultation_fee: 0,
        services_total: 0,
        medications_total: 0,
        total_cost: 0,
        payment_status: 'error',
        invoice_number: null,
        invoice_status: 'error',
        dispensed_medicine_count: 0,
        prescribed_medicine_count: 0,
      };
    }
  }

  /**
   * Get allergies recorded during the visit
   */
  async getVisitAllergies(visitId, _visitDate) {
    try {
      const { data, error } = await this.supabase
        .from('patient_allergies')
        .select(
          `
          id,
          allergy_name,
          allergen_type,
          severity,
          reaction,
          diagnosed_date,
          diagnosed_by,
          notes
        `
        )
        .eq('visit_id', visitId);

      if (error) {
        logger.error('Error fetching visit allergies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getVisitAllergies:', error);
      return [];
    }
  }

  /**
   * Get diagnoses recorded during the visit
   */
  async getVisitDiagnoses(visitId, _visitDate) {
    try {
      const { data, error } = await this.supabase
        .from('patient_diagnoses')
        .select(
          `
          id,
          diagnosis_name,
          diagnosis_code,
          diagnosis_type,
          category,
          status,
          severity,
          diagnosed_date,
          diagnosed_by,
          notes,
          symptoms,
          treatment_plan
        `
        )
        .eq('visit_id', visitId);

      if (error) {
        logger.error('Error fetching visit diagnoses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getVisitDiagnoses:', error);
      return [];
    }
  }

  /**
   * Get prescriptions for the visit
   */
  async getVisitPrescriptions(visitId) {
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select(
          `
          id,
          medication_name,
          dosage,
          frequency,
          duration,
          quantity,
          refills,
          instructions,
          status,
          prescribed_date,
          start_date,
          end_date
        `
        )
        .eq('visit_id', visitId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        logger.error('Error fetching visit prescriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getVisitPrescriptions:', error);
      return [];
    }
  }

  /**
   * Get vitals recorded for the visit
   */
  async getVisitVitals(visitId) {
    try {
      const { data, error } = await this.supabase
        .from('vitals')
        .select(
          `
          id,
          temperature,
          temperature_unit,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          heart_rate,
          respiratory_rate,
          oxygen_saturation,
          weight,
          weight_unit,
          height,
          height_unit,
          bmi,
          pain_level,
          recorded_at
        `
        )
        .eq('visit_id', visitId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        logger.error('Error fetching visit vitals:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getVisitVitals:', error);
      return null;
    }
  }

  async getVisitServices(_visitId) {
    return [
      {
        service_name: 'Consultation',
        description: 'General medical consultation',
        cost: 50.0,
      },
    ];
  }

  /**
   * Calculate consultation fee based on visit type and doctor
   */
  calculateConsultationFee(visit) {
    // Base consultation fee logic
    const baseConsultationFee = 50.0;

    if (visit.visit_type?.toLowerCase().includes('specialist')) {
      return baseConsultationFee * 1.5;
    }

    if (visit.visit_type?.toLowerCase().includes('emergency')) {
      return baseConsultationFee * 2;
    }

    return baseConsultationFee;
  }

  /**
   * Calculate total cost of services
   */
  calculateServicesTotal(services) {
    if (!services || services.length === 0) {
      return 0;
    }

    return services.reduce((total, service) => {
      return total + (parseFloat(service.cost) || 0);
    }, 0);
  }

  /**
   * Get visit by ID with all related data
   */
  async getVisitWithDetails(visitId) {
    const { data: visit, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
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
          ),
          appointment:appointments!appointment_id (
            id,
            appointment_type,
            reason_for_visit
          )
        `
      )
      .eq('id', visitId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch visit details: ${error.message}`);
    }

    return this.enhanceVisitWithRelatedData(visit);
  }

  /**
   * Complete a visit and calculate final costs
   *
   * Idempotent: If visit is already completed, returns existing data.
   * Only 'in_progress' visits can be completed.
   *
   * @param {string} visitId - The visit ID
   * @param {Object} completionData - Additional completion data (payment_status, etc.)
   * @returns {Promise<Object>} Completed visit data
   */
  async completeVisit(visitId, completionData = {}) {
    const visit = await this.getVisitWithDetails(visitId);

    // Idempotency check: if visit is already completed, return it
    if (visit.status === 'completed') {
      logger.debug(`[VISIT MODEL] Visit ${visitId} is already completed, returning existing data`);
      return visit;
    }

    // Only allow completing visits that are in_progress
    if (visit.status !== 'in_progress') {
      throw new Error(
        `Cannot complete visit with status '${visit.status}'. Only 'in_progress' visits can be completed.`
      );
    }

    const consultationFee = this.calculateConsultationFee(visit);
    const servicesTotal = this.calculateServicesTotal(visit.services);
    const totalCost = consultationFee + servicesTotal;

    // Filter out fields that don't exist on visits table (like completed_by which is only on invoices)
    const { completed_by: _completed_by, ...validCompletionData } = completionData;

    const updateData = {
      status: 'completed',
      total_cost: totalCost,
      payment_status: completionData.payment_status || visit.payment_status || 'pending',
      ...validCompletionData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', visitId)
      .select()
      .single();

    if (error) {
      // Supabase errors might not have a message property, so handle both cases
      const errorMessage =
        error.message ||
        error.details ||
        error.hint ||
        JSON.stringify(error) ||
        'Unknown database error';
      const errorCode = error.code || 'UNKNOWN';
      logger.error(
        `[VISIT MODEL] Failed to complete visit ${visitId}. Error code: ${errorCode}, Message: ${errorMessage}`
      );
      throw new Error(`Failed to complete visit: ${errorMessage} (code: ${errorCode})`);
    }

    if (!data) {
      throw new Error(`Visit ${visitId} update returned no data`);
    }

    return data;
  }

  /**
   * Find active visits for a patient within a date range
   */
  async getPatientActiveVisits(patientId, startDate, endDate) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
          id,
          patient_id,
          doctor_id,
          visit_date,
          status,
          created_at
        `
      )
      .eq('patient_id', patientId)
      .eq('status', 'in_progress')
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString())
      .order('visit_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active visits: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get invoice data for a visit
   */
  async getVisitInvoice(visitId) {
    try {
      const { data: invoice, error } = await this.supabase
        .from('invoices')
        .select(
          `
          id,
          invoice_number,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          paid_amount,
          balance,
          status,
          payment_method,
          payment_notes,
          completed_at,
          created_at
        `
        )
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch visit invoice: ${error.message}`);
      }

      if (!invoice) {
        return null;
      }

      // Fetch invoice items to get detailed breakdown
      const { data: items, error: itemsError } = await this.supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) {
        logger.error('Error fetching invoice items:', itemsError);
      }

      // Calculate totals by item type
      const medicineItems = items?.filter((item) => item.item_type === 'medicine') || [];
      const serviceItems = items?.filter((item) => item.item_type === 'service') || [];

      const medications_total = medicineItems.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
      );
      const services_total = serviceItems.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
      );

      return {
        ...invoice,
        items: items || [],
        medicine_items: medicineItems,
        service_items: serviceItems,
        medications_total,
        services_total,
        medicine_count: medicineItems.length,
        service_count: serviceItems.length,
      };
    } catch (error) {
      logger.error('Error in getVisitInvoice:', error);
      return null;
    }
  }

  /**
   * Find the most recent active visit for a patient (without date constraints)
   * Used for getting current visit vitals
   */
  async getPatientActiveVisit(patientId) {
    // Get visits with in_progress status
    const { data: visits, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
          id,
          patient_id,
          doctor_id,
          visit_date,
          status,
          created_at
        `
      )
      .eq('patient_id', patientId)
      .eq('status', 'in_progress')
      .order('visit_date', { ascending: false });

    if (error) {
      logger.error(`[VISIT MODEL] Error fetching active visits for patient ${patientId}:`, error);
      throw new Error(`Failed to fetch active visit: ${error.message}`);
    }

    if (!visits || visits.length === 0) {
      logger.debug(`[VISIT MODEL] No active visits found for patient ${patientId}`);
      return null;
    }

    // Return the most recent in_progress visit
    const activeVisit = visits[0];
    logger.warn(
      `[VISIT MODEL] Patient ${patientId} has active visit ${activeVisit.id} (status: ${activeVisit.status}, created: ${activeVisit.created_at}) - blocking new visits`
    );
    return activeVisit;
  }

  /**
   * Check if a doctor has any active visits
   * Used to prevent doctor deletion when they have active consultations
   */
  async getDoctorActiveVisits(doctorId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, patient_id, visit_date, status')
      .eq('doctor_id', doctorId)
      .eq('status', 'in_progress')
      .order('visit_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch doctor active visits: ${error.message}`);
    }

    return data || [];
  }
}

export default VisitModel;
