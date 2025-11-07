import {
  getDiagnosesByPatient as repoGetDiagnosesByPatient,
  getDiagnosesByVisit as repoGetDiagnosesByVisit,
  getDiagnosisById as repoGetDiagnosisById,
  createDiagnosis as repoCreateDiagnosis,
  updateDiagnosis as repoUpdateDiagnosis,
  updateDiagnosisStatus as repoUpdateDiagnosisStatus,
  softDeleteDiagnosis as repoSoftDeleteDiagnosis,
  getActiveDiagnoses as repoGetActiveDiagnoses,
  getFirstDoctorId,
} from './repositories/PatientDiagnosisRepo.js';

class PatientDiagnosisService {
  /**
   * Get all diagnoses for a patient
   */
  async getDiagnosesByPatient(patientId, includeResolved = false) {
    try {
      return await repoGetDiagnosesByPatient(patientId, includeResolved);
    } catch (error) {
      throw new Error(`Failed to fetch diagnoses: ${error.message}`);
    }
  }

  /**
   * Get diagnoses for a visit
   */
  async getDiagnosesByVisit(visitId) {
    try {
      return await repoGetDiagnosesByVisit(visitId);
    } catch (error) {
      throw new Error(`Failed to fetch visit diagnoses: ${error.message}`);
    }
  }

  /**
   * Get diagnosis by ID
   */
  async getDiagnosisById(id) {
    try {
      return await repoGetDiagnosisById(id);
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
        const doctorId = await getFirstDoctorId();
        if (!doctorId) {
          throw new Error('No doctor available to assign diagnosis');
        }
        diagnosisData.diagnosed_by = doctorId;
      }

      return await repoCreateDiagnosis(diagnosisData);
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
      const existingDiagnosis = await repoGetDiagnosisById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await repoUpdateDiagnosis(id, diagnosisData);
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
      const existingDiagnosis = await repoGetDiagnosisById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await repoUpdateDiagnosisStatus(id, status, resolvedDate);
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
      const existingDiagnosis = await repoGetDiagnosisById(id);
      if (!existingDiagnosis) {
        throw new Error('Diagnosis not found');
      }

      return await repoSoftDeleteDiagnosis(id);
    } catch (error) {
      throw new Error(`Failed to delete diagnosis: ${error.message}`);
    }
  }

  /**
   * Get all active diagnoses
   */
  async getAllActiveDiagnoses() {
    try {
      return await repoGetActiveDiagnoses();
    } catch (error) {
      throw new Error(`Failed to fetch active diagnoses: ${error.message}`);
    }
  }
}

export default new PatientDiagnosisService();
