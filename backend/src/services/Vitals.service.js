import VitalsModel from '../models/Vitals.model.js';
import VisitModel from '../models/Visit.model.js';
import QueueTokenModel from '../models/QueueToken.model.js';

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
          
          console.log(`[VITALS] Looking for active visits for patient ${vitalsData.patient_id}:`, {
            todayStart: todayStart.toISOString(),
            todayEnd: todayEnd.toISOString(),
            foundVisits: activeVisits?.length || 0
          });
          
          if (activeVisits && activeVisits.length > 0) {
            // Use the most recent active visit
            visitId = activeVisits[0].id;
            console.log(`[VITALS] ✅ Found active visit: ${visitId}`);
          } else {
            console.log(`[VITALS] ⚠️ No active visit found - patient should be added to queue first`);
          }
        } catch (error) {
          console.warn(`[VITALS] ⚠️ Error finding active visit:`, error.message);
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

      console.log(`[VITALS] Saving vitals:`, {
        patient_id: vitalsRecord.patient_id,
        visit_id: vitalsRecord.visit_id,
        priority_level: vitalsData.priority_level,
        has_bp: !!(vitalsRecord.blood_pressure_systolic && vitalsRecord.blood_pressure_diastolic),
        has_temp: !!vitalsRecord.temperature,
        has_heart_rate: !!vitalsRecord.heart_rate
      });

      const vitals = await this.vitalsModel.create(vitalsRecord);
      
      console.log(`[VITALS] ✅ Vitals saved successfully with ID: ${vitals.id}`);
      
      // Update queue token priority if priority level is provided
      if (vitalsData.priority_level && visitId) {
        try {
          // Find the queue token for this visit (queue_tokens has visit_id column)
          const token = await this.queueTokenModel.getTokenByVisitId(visitId);
          console.log(`[VITALS] Looking for token with visit_id ${visitId}:`, token ? `Token #${token.token_number} (ID: ${token.id})` : 'not found');

          if (token && token.id) {
            // Map priority level to numeric priority (5 = highest)
            const priorityMap = {
              'urgent': 5,
              'high': 4,
              'normal': 3,
              'low': 2
            };

            const priority = priorityMap[String(vitalsData.priority_level).toLowerCase()] || 3;
            console.log(`[VITALS] Priority mapping: "${vitalsData.priority_level}" -> ${priority}`);

            if (priority >= 4) { // Only update for urgent/high priority
              const updatedToken = await this.queueTokenModel.updateTokenPriority(token.id, priority);
              console.log(`[VITALS] ⭐ Updated token #${updatedToken.token_number} priority to ${priority} (${vitalsData.priority_level})`);
            } else {
              console.log(`[VITALS] Priority level ${vitalsData.priority_level} (${priority}) is not urgent/high, skipping update`);
            }
          } else {
            console.log(`[VITALS] ⚠️ No queue token found for visit ${visitId}; skipping priority update.`);
          }
        } catch (priorityError) {
          // Don't fail the vitals creation if priority update fails
          console.warn(`[VITALS] ⚠️ Failed to update token priority:`, priorityError.message);
        }
      }
      
      return vitals;
    } catch (error) {
      console.error(`[VITALS] ❌ Failed to create vitals:`, error.message);
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
      console.log(`[VITALS] Getting current visit vitals for patient: ${patientId}`);
      
      // Find the patient's current active visit
      const activeVisit = await this.visitModel.getPatientActiveVisit(patientId);
      
      console.log(`[VITALS] Active visit found:`, activeVisit ? {
        id: activeVisit.id,
        status: activeVisit.status,
        visit_date: activeVisit.visit_date
      } : null);
      
      if (!activeVisit) {
        console.log(`[VITALS] ⚠️ No active visit found for patient ${patientId}`);
        return null; // No active visit, no current visit vitals
      }
      
      // Get vitals for this active visit
      const vitals = await this.vitalsModel.getByVisitId(activeVisit.id);
      
      console.log(`[VITALS] Vitals found for visit ${activeVisit.id}:`, vitals?.length || 0);
      
      // Return the most recent vitals for this visit, or null if none exist
      const result = vitals && vitals.length > 0 ? vitals[0] : null;
      
      if (result) {
        console.log(`[VITALS] ✅ Returning vitals ID: ${result.id}`);
      } else {
        console.log(`[VITALS] ⚠️ No vitals found for active visit`);
      }
      
      return result;
    } catch (error) {
      console.error(`[VITALS] ❌ Error in getCurrentVisitVitals:`, error.message);
      throw new Error(`Failed to fetch current visit vitals: ${error.message}`);
    }
  }
}

export default VitalsService;