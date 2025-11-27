import PrescriptionModel from '../models/Prescription.model.js';

/**
 * Prescription Service
 * Handles prescription business logic
 */
class PrescriptionService {
  constructor() {
    this.prescriptionModel = new PrescriptionModel();
  }

  /**
   * Create a new prescription
   */
  async createPrescription(prescriptionData) {
    // Validate required fields
    const requiredFields = ['patient_id', 'doctor_id', 'medication_name', 'dosage', 'frequency'];
    const missingFields = requiredFields.filter((field) => !prescriptionData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Set defaults
    const dataToInsert = {
      ...prescriptionData,
      status: prescriptionData.status || 'active',
      prescribed_date: prescriptionData.prescribed_date || new Date().toISOString(),
      refills: prescriptionData.refills || 0,
    };

    const prescription = await this.prescriptionModel.create(dataToInsert);

    return {
      success: true,
      data: prescription,
      message: 'Prescription created successfully',
    };
  }

  /**
   * Get prescriptions for a patient
   */
  async getPatientPrescriptions(patientId, includeInactive = false) {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }

    const prescriptions = await this.prescriptionModel.getByPatientId(patientId, includeInactive);

    return {
      success: true,
      data: prescriptions,
      total: prescriptions.length,
    };
  }

  /**
   * Get prescriptions for a visit
   */
  async getVisitPrescriptions(visitId) {
    if (!visitId) {
      throw new Error('Visit ID is required');
    }

    const prescriptions = await this.prescriptionModel.getByVisitId(visitId);

    return {
      success: true,
      data: prescriptions,
      total: prescriptions.length,
    };
  }

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(prescriptionId, status) {
    if (!prescriptionId || !status) {
      throw new Error('Prescription ID and status are required');
    }

    const validStatuses = ['active', 'completed', 'cancelled', 'expired'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const prescription = await this.prescriptionModel.updateStatus(prescriptionId, status);

    return {
      success: true,
      data: prescription,
      message: `Prescription status updated to ${status}`,
    };
  }

  /**
   * Cancel a prescription
   */
  async cancelPrescription(prescriptionId) {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    const prescription = await this.prescriptionModel.delete(prescriptionId);

    return {
      success: true,
      data: prescription,
      message: 'Prescription cancelled successfully',
    };
  }

  /**
   * Get prescriptions by doctor note ID
   */
  async getPrescriptionsByDoctorNoteId(doctorNoteId) {
    if (!doctorNoteId) {
      throw new Error('Doctor note ID is required');
    }

    const prescriptions = await this.prescriptionModel.getByDoctorNoteId(doctorNoteId);

    return {
      success: true,
      data: prescriptions,
      total: prescriptions.length,
    };
  }
}

export default new PrescriptionService();
