import PatientDiagnosisModel from '../models/PatientDiagnosis.model.js';
import { supabaseAdmin } from '../config/database.js';

class PatientDiagnosisService {
  /**
   * Get all diagnoses for a patient
   */
  async getDiagnosesByPatient(patientId, includeResolved = false) {
    try {
      return await PatientDiagnosisModel.getByPatientId(patientId, includeResolved);
    } catch (error) {
      throw new Error(`Failed to fetch diagnoses: ${error.message}`);
    }
  }

  /**
   * Get diagnoses for a visit
   */
  async getDiagnosesByVisit(visitId) {
    try {
      return await PatientDiagnosisModel.getByVisitId(visitId);
    } catch (error) {
      throw new Error(`Failed to fetch visit diagnoses: ${error.message}`);
    }
  }

  /**
   * Get diagnosis by ID
   */
  async getDiagnosisById(id) {
    try {
      return await PatientDiagnosisModel.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch diagnosis: ${error.message}`);
    }
  }

  /**
   * Create new diagnosis
   */
  async createDiagnosis(diagnosisData) {
    try {
      // Validate required fields
      if (!diagnosisData.patient_id || !diagnosisData.diagnosis_name) {
        throw new Error('patient_id and diagnosis_name are required');
      }

      // Set diagnosed_date to today if not provided
      if (!diagnosisData.diagnosed_date) {
        diagnosisData.diagnosed_date = new Date().toISOString().split('T')[0];
      }

      // If diagnosed_by is not provided, use the first doctor in the system (dev mode)
      if (!diagnosisData.diagnosed_by) {
        // In a real app, this would come from the authenticated user
        // For now, we'll use a default doctor ID - you may need to adjust this
        const { data: doctors } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'doctor')
          .limit(1);
        
        if (doctors && doctors.length > 0) {
          diagnosisData.diagnosed_by = doctors[0].id;
        } else {
          throw new Error('No doctor available to assign diagnosis');
        }
      }

      return await PatientDiagnosisModel.create(diagnosisData);
    } catch (error) {
      throw new Error(`Failed to create diagnosis: ${error.message}`);
    }
  }

  /**
   * Update diagnosis
   */
  async updateDiagnosis(id, diagnosisData) {
    try {
      // Check if diagnosis exists
      const existingDiagnosis = await PatientDiagnosisModel.findById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await PatientDiagnosisModel.update(id, diagnosisData);
    } catch (error) {
      throw new Error(`Failed to update diagnosis: ${error.message}`);
    }
  }

  /**
   * Update diagnosis status
   */
  async updateDiagnosisStatus(id, status, resolvedDate = null) {
    try {
      // Check if diagnosis exists
      const existingDiagnosis = await PatientDiagnosisModel.findById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await PatientDiagnosisModel.updateStatus(id, status, resolvedDate);
    } catch (error) {
      throw new Error(`Failed to update diagnosis status: ${error.message}`);
    }
  }

  /**
   * Delete diagnosis (soft delete)
   */
  async deleteDiagnosis(id) {
    try {
      // Check if diagnosis exists
      const existingDiagnosis = await PatientDiagnosisModel.findById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await PatientDiagnosisModel.softDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete diagnosis: ${error.message}`);
    }
  }

  /**
   * Get all active diagnoses
   */
  async getAllActiveDiagnoses() {
    try {
      return await PatientDiagnosisModel.getActiveDiagnoses();
    } catch (error) {
      throw new Error(`Failed to fetch active diagnoses: ${error.message}`);
    }
  }
}

export default new PatientDiagnosisService();
