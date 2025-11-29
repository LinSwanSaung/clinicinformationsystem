import PatientModel from '../models/Patient.model.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

class PatientService {
  async getAllPatients(options = {}) {
    const defaultOptions = {
      orderBy: 'created_at',
      ascending: false,
      ...options,
    };

    try {
      const { data } = await PatientModel.findAll(defaultOptions);
      return data || [];
    } catch (error) {
      throw new AppError('Failed to fetch patients', 500);
    }
  }

  async getPatientById(patientId) {
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return patient;
  }

  async createPatient(patientData, _createdBy) {
    if (patientData.phone) {
      const existingPatient = await PatientModel.findOne({ phone: patientData.phone });

      if (existingPatient) {
        logger.warn('Patient with this phone number already exists:', patientData.phone);
      }
    }

    const patient = await PatientModel.create(patientData);

    return patient;
  }

  async updatePatient(patientId, updateData, _updatedBy) {
    const existingPatient = await PatientModel.findById(patientId);

    if (!existingPatient) {
      throw new AppError('Patient not found', 404);
    }

    if (updateData.id_number && updateData.id_number !== existingPatient.id_number) {
      const patientWithSameId = await PatientModel.findByIdNumber(updateData.id_number);

      if (patientWithSameId && patientWithSameId.id !== patientId) {
        throw new AppError('Patient with this ID number already exists', 409);
      }
    }

    const updatedPatient = await PatientModel.updateById(patientId, updateData);

    return updatedPatient;
  }

  async deletePatient(patientId) {
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const VisitModel = (await import('../models/Visit.model.js')).default;
    const visitModel = new VisitModel();
    const activeVisit = await visitModel.getPatientActiveVisit(patientId);

    if (activeVisit) {
      throw new AppError(
        `Cannot delete patient. Patient has an active visit (Visit ID: ${activeVisit.id}). Please complete or cancel the visit first.`,
        409
      );
    }

    // Check for pending appointments
    const AppointmentModel = (await import('../models/Appointment.model.js')).default;
    const appointmentModel = new AppointmentModel();
    const pendingAppointments = await appointmentModel.getPatientPendingAppointments(patientId);

    if (pendingAppointments && pendingAppointments.length > 0) {
      throw new AppError(
        `Cannot delete patient. Patient has ${pendingAppointments.length} pending appointment(s). Please cancel or complete them first.`,
        409
      );
    }

    await PatientModel.deleteById(patientId);

    return true;
  }

  async searchPatients(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError('Search term must be at least 2 characters', 400);
    }

    const patients = await PatientModel.search(searchTerm.trim(), options);
    return patients;
  }

  async getPatientMedicalHistory(patientId) {
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return {
      patient_info: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
      },
      medical_history: patient.medical_history || [],
      allergies: patient.allergies || [],
      current_medications: patient.medications || '',
    };
  }

  async getRecentPatients(days = 30, options = {}) {
    return PatientModel.getRecentPatients(days, options);
  }

  async getPatientStatistics() {
    const totalPatients = await PatientModel.count();
    const recentPatients = await PatientModel.getRecentPatients(7);

    const children = await PatientModel.getByAgeGroup(0, 17);
    const adults = await PatientModel.getByAgeGroup(18, 64);
    const seniors = await PatientModel.getByAgeGroup(65, 120);

    const malePatients = await PatientModel.getByGender('Male');
    const femalePatients = await PatientModel.getByGender('Female');

    return {
      total: totalPatients,
      recent_visits: recentPatients.length,
      age_groups: {
        children: children.length,
        adults: adults.length,
        seniors: seniors.length,
      },
      gender: {
        male: malePatients.data?.length || 0,
        female: femalePatients.data?.length || 0,
      },
    };
  }

  async updateLastVisit(patientId, visitDate) {
    const patient = await PatientModel.findById(patientId);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await PatientModel.updateLastVisit(patientId, visitDate);

    return true;
  }

  async getDoctorPatients(doctorId, options = {}) {
    try {
      const defaultOptions = {
        orderBy: 'created_at',
        ascending: false,
        ...options,
      };

      const { data } = await PatientModel.findAll(defaultOptions);
      return data || [];
    } catch (error) {
      throw new AppError('Failed to fetch doctor patients', 500);
    }
  }
}

export default new PatientService();
