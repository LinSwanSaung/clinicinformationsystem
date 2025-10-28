import PatientModel from '../models/Patient.model.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Patient Service
 * Handles all patient-related business logic
 */
class PatientService {
  /**
   * Get all patients
   */
  async getAllPatients(options = {}) {
    const defaultOptions = {
      orderBy: 'created_at',
      ascending: false,
      ...options
    };
    
    try {
      const { data } = await PatientModel.findAll(defaultOptions);
      return data || [];
    } catch (error) {
      throw new AppError('Failed to fetch patients', 500);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId) {
    const patient = await PatientModel.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return patient;
  }

  /**
   * Create new patient
   */
  async createPatient(patientData, createdBy) {
    // Check if patient with same phone number already exists (optional check)
    if (patientData.phone) {
      const existingPatient = await PatientModel.findOne({ phone: patientData.phone });
      
      if (existingPatient) {
        console.warn('Patient with this phone number already exists:', patientData.phone);
        // Don't throw error, allow duplicate phone numbers for now
      }
    }

    // Create patient (don't include created_by since it's not in the schema)
    const patient = await PatientModel.create(patientData);

    return patient;
  }

  /**
   * Update patient
   */
  async updatePatient(patientId, updateData, updatedBy) {
    // Check if patient exists
    const existingPatient = await PatientModel.findById(patientId);
    
    if (!existingPatient) {
      throw new AppError('Patient not found', 404);
    }

    // If updating ID number, check for duplicates
    if (updateData.id_number && updateData.id_number !== existingPatient.id_number) {
      const patientWithSameId = await PatientModel.findByIdNumber(updateData.id_number);
      
      if (patientWithSameId && patientWithSameId.id !== patientId) {
        throw new AppError('Patient with this ID number already exists', 409);
      }
    }

    // Update patient
    const updatedPatient = await PatientModel.updateById(patientId, {
      ...updateData,
      updated_by: updatedBy
    });

    return updatedPatient;
  }

  /**
   * Delete patient
   */
  async deletePatient(patientId) {
    // Check if patient exists
    const patient = await PatientModel.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Note: In a real system, you might want to soft delete or check for dependencies
    await PatientModel.deleteById(patientId);

    return true;
  }

  /**
   * Search patients
   */
  async searchPatients(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError('Search term must be at least 2 characters', 400);
    }

    const patients = await PatientModel.search(searchTerm.trim(), options);
    return patients;
  }

  /**
   * Get patient's medical history
   */
  async getPatientMedicalHistory(patientId) {
    // Verify patient exists
    const patient = await PatientModel.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // This would typically join with visit_history, doctor_notes, etc.
    // For now, returning basic patient info with medical history
    return {
      patient_info: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender
      },
      medical_history: patient.medical_history || [],
      allergies: patient.allergies || [],
      current_medications: patient.medications || ''
    };
  }

  /**
   * Get recent patients
   */
  async getRecentPatients(days = 30, options = {}) {
    return await PatientModel.getRecentPatients(days, options);
  }

  /**
   * Get patient statistics
   */
  async getPatientStatistics() {
    const totalPatients = await PatientModel.count();
    const recentPatients = await PatientModel.getRecentPatients(7);
    
    // Age group statistics
    const children = await PatientModel.getByAgeGroup(0, 17);
    const adults = await PatientModel.getByAgeGroup(18, 64);
    const seniors = await PatientModel.getByAgeGroup(65, 120);

    // Gender statistics
    const malePatients = await PatientModel.getByGender('Male');
    const femalePatients = await PatientModel.getByGender('Female');

    return {
      total: totalPatients,
      recent_visits: recentPatients.length,
      age_groups: {
        children: children.length,
        adults: adults.length,
        seniors: seniors.length
      },
      gender: {
        male: malePatients.data?.length || 0,
        female: femalePatients.data?.length || 0
      }
    };
  }

  /**
   * Update last visit
   */
  async updateLastVisit(patientId, visitDate) {
    const patient = await PatientModel.findById(patientId);
    
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await PatientModel.updateLastVisit(patientId, visitDate);
    
    return true;
  }

  /**
   * Get patients assigned to a specific doctor
   */
  async getDoctorPatients(doctorId, options = {}) {
    try {
      // For now, return all patients since we don't have doctor assignment in schema
      // In a real system, you'd filter by assigned doctor
      const defaultOptions = {
        orderBy: 'created_at',
        ascending: false,
        ...options
      };
      
      const { data } = await PatientModel.findAll(defaultOptions);
      return data || [];
    } catch (error) {
      throw new AppError('Failed to fetch doctor patients', 500);
    }
  }
}

export default new PatientService();
