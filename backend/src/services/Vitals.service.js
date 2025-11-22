import VitalsModel from '../models/Vitals.model.js';
import VisitModel from '../models/Visit.model.js';
import QueueTokenModel from '../models/QueueToken.model.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import logger from '../config/logger.js';

class VitalsService {
  constructor() {
    this.vitalsModel = new VitalsModel();
    this.visitModel = new VisitModel();
    this.queueTokenModel = new QueueTokenModel();
  }

  /**
   * Create new vitals record
   */
  async createVitals(vitalsData, recordedBy) {
    try {
      let visitId = vitalsData.visit_id || null;
      
      // If no visit_id provided, try to find an active visit for today
      if (!visitId && vitalsData.patient_id) {
        try {
          // Look for today's active visit for this patient
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);
          
          const activeVisits = await this.visitModel.getPatientActiveVisits(vitalsData.patient_id, todayStart, todayEnd);
          
          if (activeVisits && activeVisits.length > 0) {
            // Use the most recent active visit
            visitId = activeVisits[0].id;

          } else {
            // No active visit found - will create new visit
          }
        } catch (error) {
          logger.warn('Error finding active visit:', error);
        }
      }
      
      // Prepare vitals data
      const vitalsRecord = {
        patient_id: vitalsData.patient_id,
        recorded_by: recordedBy,
        temperature: vitalsData.temperature || null,
        temperature_unit: vitalsData.temperature_unit || (vitalsData.temperature > 50 ? 'F' : 'C'), // Auto-detect unit based on value
        blood_pressure_systolic: vitalsData.blood_pressure_systolic || null,
        blood_pressure_diastolic: vitalsData.blood_pressure_diastolic || null,
        heart_rate: vitalsData.heart_rate || null,
        respiratory_rate: vitalsData.respiratory_rate || null,
        oxygen_saturation: vitalsData.oxygen_saturation || null,
        weight: vitalsData.weight || null,
        weight_unit: vitalsData.weight_unit || 'kg',
        height: vitalsData.height || null,
        height_unit: vitalsData.height_unit || 'cm',
        pain_level: vitalsData.pain_level || null,
        notes: vitalsData.notes || null,
        visit_id: visitId
      };

      const vitals = await this.vitalsModel.create(vitalsRecord);
      


      // Log vitals creation
      try {
        await logAuditEvent({
          userId: recordedBy,
          role: 'nurse',
          action: 'CREATE',
          entity: 'vitals',
          recordId: vitals.id,
          patientId: vitalsData.patient_id,
          result: 'success',
          meta: {
            visit_id: visitId,
            priority_level: vitalsData.priority_level,
            has_critical_values: (vitalsRecord.blood_pressure_systolic > 180 || vitalsRecord.temperature > 39)
          },
          note: 'Nurse recorded patient vitals'
        });
      } catch (logError) {
        logger.error('[AUDIT] Failed to log vitals creation:', logError);
      }
      
      // Update queue token priority if priority level is provided
      if (vitalsData.priority_level && visitId) {
        try {
          // Find the queue token for this visit (queue_tokens has visit_id column)
          const token = await this.queueTokenModel.getTokenByVisitId(visitId);

          if (token && token.id) {
            // Map priority level to numeric priority (5 = highest)
            const priorityMap = {
              'urgent': 5,
              'high': 4,
              'normal': 3,
              'low': 2
            };

            const priority = priorityMap[String(vitalsData.priority_level).toLowerCase()] || 3;

            if (priority >= 4) { // Only update for urgent/high priority
              await this.queueTokenModel.updateTokenPriority(token.id, priority);
            }
          } else {
            // No queue token found - priority update not needed
          }
        } catch (priorityError) {
          // Don't fail the vitals creation if priority update fails
          logger.warn('Failed to update token priority:', priorityError);
        }
      }
      
      return vitals;
    } catch (error) {
      logger.error('Failed to create vitals:', error);
      throw new Error(`Failed to create vitals: ${error.message}`);
    }
  }

  /**
   * Get vitals history for a patient
   */
  async getPatientVitalsHistory(patientId, limit = null) {
    try {
      const vitals = await this.vitalsModel.getByPatientId(patientId, limit);
      return vitals;
    } catch (error) {
      throw new Error(`Failed to fetch patient vitals: ${error.message}`);
    }
  }

  /**
   * Get latest vitals for a patient
   */
  async getLatestPatientVitals(patientId) {
    try {
      const vitals = await this.vitalsModel.getLatestByPatientId(patientId);
      return vitals;
    } catch (error) {
      throw new Error(`Failed to fetch latest vitals: ${error.message}`);
    }
  }

  /**
   * Update vitals record
   */
  async updateVitals(vitalsId, vitalsData, recordedBy) {
    try {
      // Prepare update data
      const updateData = {
        temperature: vitalsData.temperature || null,
        temperature_unit: vitalsData.temperature_unit || 'C',
        blood_pressure_systolic: vitalsData.blood_pressure_systolic || null,
        blood_pressure_diastolic: vitalsData.blood_pressure_diastolic || null,
        heart_rate: vitalsData.heart_rate || null,
        respiratory_rate: vitalsData.respiratory_rate || null,
        oxygen_saturation: vitalsData.oxygen_saturation || null,
        weight: vitalsData.weight || null,
        weight_unit: vitalsData.weight_unit || 'kg',
        height: vitalsData.height || null,
        height_unit: vitalsData.height_unit || 'cm',
        pain_level: vitalsData.pain_level || null,
        notes: vitalsData.notes || null,
        recorded_by: recordedBy
      };

      const vitals = await this.vitalsModel.update(vitalsId, updateData);
      return vitals;
    } catch (error) {
      throw new Error(`Failed to update vitals: ${error.message}`);
    }
  }

  /**
   * Delete vitals record
   */
  async deleteVitals(vitalsId) {
    try {
      const result = await this.vitalsModel.delete(vitalsId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete vitals: ${error.message}`);
    }
  }

  /**
   * Get vitals for a visit
   */
  async getVisitVitals(visitId) {
    try {
      const vitals = await this.vitalsModel.getByVisitId(visitId);
      return vitals;
    } catch (error) {
      throw new Error(`Failed to fetch visit vitals: ${error.message}`);
    }
  }

  /**
   * Get vitals for patient's current active visit
   */
  async getCurrentVisitVitals(patientId) {
    try {

      
      // Find the patient's current active visit
      const activeVisit = await this.visitModel.getPatientActiveVisit(patientId);
      
      if (!activeVisit) {

        return null; // No active visit, no current visit vitals
      }
      
      // Get vitals for this active visit
      const vitals = await this.vitalsModel.getByVisitId(activeVisit.id);
      
      // Return the most recent vitals for this visit, or null if none exist
      const result = vitals && vitals.length > 0 ? vitals[0] : null;
      
      return result;
    } catch (error) {
      logger.error('Error in getCurrentVisitVitals:', error);
      throw new Error(`Failed to fetch current visit vitals: ${error.message}`);
    }
  }
}

export default VitalsService;
