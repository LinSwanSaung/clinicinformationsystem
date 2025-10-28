import { BaseModel } from './BaseModel.js';

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
    const { limit = 50, offset = 0, includeInProgress = false } = options;
    
    try {
      // Build query
      let query = this.supabase
        .from(this.tableName)
        .select(`
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
        `)
        .eq('patient_id', patientId);

      // Only show completed visits by default
      if (!includeInProgress) {
        query = query.eq('status', 'completed');
      }
      // Otherwise show all visits regardless of status

      const { data: visits, error } = await query
        .order('visit_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch patient visit history: ${error.message}`);
      }

      // Enhance each visit with related data
      const enhancedVisits = await Promise.all(
        visits.map(async (visit) => {
          return await this.enhanceVisitWithRelatedData(visit);
        })
      );

      return enhancedVisits;
    } catch (error) {
      throw error;
    }
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
        this.getVisitInvoice(visit.id)
      ]);

      return {
        ...visit,
        doctor_name: visit.doctor ? `${visit.doctor.first_name} ${visit.doctor.last_name}` : 'Unknown',
        allergies,
        visit_diagnoses: diagnoses,
        prescriptions,
        vitals,
        services,
        invoice,
        // Use invoice data if available, otherwise calculate from visit data
        consultation_fee: invoice?.service_items?.find(s => s.item_name?.toLowerCase().includes('consultation'))?.total_price || this.calculateConsultationFee(visit),
        services_total: invoice?.services_total || this.calculateServicesTotal(services),
        medications_total: invoice?.medications_total || 0,
        total_cost: invoice?.total_amount || (this.calculateConsultationFee(visit) + this.calculateServicesTotal(services)),
        payment_status: invoice ? (invoice.status === 'paid' ? 'paid' : 'pending') : 'no_invoice',
        invoice_number: invoice?.invoice_number,
        invoice_status: invoice?.status || 'no_invoice',
        // Add medicine counts
        dispensed_medicine_count: invoice?.medicine_count || 0,
        prescribed_medicine_count: prescriptions?.length || 0
      };
    } catch (error) {
      console.error('Error enhancing visit data:', error);
      return {
        ...visit,
        doctor_name: visit.doctor ? `${visit.doctor.first_name} ${visit.doctor.last_name}` : 'Unknown',
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
        prescribed_medicine_count: 0
      };
    }
  }

  /**
   * Get allergies recorded during the visit
   */
  async getVisitAllergies(visitId, visitDate) {
    try {
      const { data, error } = await this.supabase
        .from('patient_allergies')
        .select(`
          id,
          allergy_name,
          allergen_type,
          severity,
          reaction,
          diagnosed_date,
          diagnosed_by,
          notes
        `)
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error fetching visit allergies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVisitAllergies:', error);
      return [];
    }
  }

  /**
   * Get diagnoses recorded during the visit
   */
  async getVisitDiagnoses(visitId, visitDate) {
    try {
      const { data, error } = await this.supabase
        .from('patient_diagnoses')
        .select(`
          id,
          diagnosis_name,
          diagnosis_code,
          diagnosis_type,
          status,
          severity,
          diagnosed_date,
          diagnosed_by
        `)
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error fetching visit diagnoses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVisitDiagnoses:', error);
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
        .select(`
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
        `)
        .eq('visit_id', visitId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error fetching visit prescriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVisitPrescriptions:', error);
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
        .select(`
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
        `)
        .eq('visit_id', visitId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching visit vitals:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getVisitVitals:', error);
      return null;
    }
  }

  /**
   * Get services provided during the visit
   * Note: This assumes you'll add a visit_services table
   */
  async getVisitServices(visitId) {
    try {
      // This is a placeholder - you may need to create this table
      // For now, we'll return basic services based on visit type
      return [
        {
          service_name: 'Consultation',
          description: 'General medical consultation',
          cost: 50.00
        }
      ];
    } catch (error) {
      console.error('Error in getVisitServices:', error);
      return [];
    }
  }

  /**
   * Calculate consultation fee based on visit type and doctor
   */
  calculateConsultationFee(visit) {
    // Base consultation fee logic
    const baseConsultationFee = 50.00;
    
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
    if (!services || services.length === 0) return 0;
    
    return services.reduce((total, service) => {
      return total + (parseFloat(service.cost) || 0);
    }, 0);
  }

  /**
   * Get visit by ID with all related data
   */
  async getVisitWithDetails(visitId) {
    try {
      const { data: visit, error } = await this.supabase
        .from(this.tableName)
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
          ),
          appointment:appointments!appointment_id (
            id,
            appointment_type,
            reason_for_visit
          )
        `)
        .eq('id', visitId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch visit details: ${error.message}`);
      }

      return await this.enhanceVisitWithRelatedData(visit);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete a visit and calculate final costs
   */
  async completeVisit(visitId, completionData = {}) {
    try {
      const visit = await this.getVisitWithDetails(visitId);
      
      const consultationFee = this.calculateConsultationFee(visit);
      const servicesTotal = this.calculateServicesTotal(visit.services);
      const totalCost = consultationFee + servicesTotal;

      const updateData = {
        status: 'completed',
        total_cost: totalCost,
        payment_status: completionData.payment_status || 'pending',
        ...completionData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', visitId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to complete visit: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find active visits for a patient within a date range
   */
  async getPatientActiveVisits(patientId, startDate, endDate) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          patient_id,
          doctor_id,
          visit_date,
          status,
          created_at
        `)
        .eq('patient_id', patientId)
        .eq('status', 'in_progress')
        .gte('visit_date', startDate.toISOString())
        .lte('visit_date', endDate.toISOString())
        .order('visit_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch active visits: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice data for a visit
   */
  async getVisitInvoice(visitId) {
    try {
      const { data: invoice, error } = await this.supabase
        .from('invoices')
        .select(`
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
        `)
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
        console.error('Error fetching invoice items:', itemsError);
      }

      // Calculate totals by item type
      const medicineItems = items?.filter(item => item.item_type === 'medicine') || [];
      const serviceItems = items?.filter(item => item.item_type === 'service') || [];
      
      const medications_total = medicineItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
      const services_total = serviceItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

      return {
        ...invoice,
        items: items || [],
        medicine_items: medicineItems,
        service_items: serviceItems,
        medications_total,
        services_total,
        medicine_count: medicineItems.length,
        service_count: serviceItems.length
      };
    } catch (error) {
      console.error('Error in getVisitInvoice:', error);
      return null;
    }
  }

  /**
   * Find the most recent active visit for a patient (without date constraints)
   * Used for getting current visit vitals
   */
  async getPatientActiveVisit(patientId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          id,
          patient_id,
          doctor_id,
          visit_date,
          status,
          created_at
        `)
        .eq('patient_id', patientId)
        .eq('status', 'in_progress')
        .order('visit_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch active visit: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      throw error;
    }
  }
}

export default VisitModel;