import { AppError } from '../middleware/errorHandler.js';
import UserModel from '../models/User.model.js';
import PatientModel from '../models/Patient.model.js';
import QueueTokenModel from '../models/QueueToken.model.js';
import VisitModel from '../models/Visit.model.js';
import VitalsModel from '../models/Vitals.model.js';
import PrescriptionModel from '../models/Prescription.model.js';
import AppointmentModel from '../models/Appointment.model.js';
import logger from '../config/logger.js';

class PatientPortalService {
  constructor() {
    this.queueTokenModel = new QueueTokenModel();
    this.visitModel = new VisitModel();
    this.vitalsModel = new VitalsModel();
    this.prescriptionModel = new PrescriptionModel();
    this.appointmentModel = new AppointmentModel();
  }

  async getLinkedPatient(userId) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'patient') {
      throw new AppError('Only patient accounts can access this resource', 403);
    }

    if (!user.patient_id) {
      throw new AppError('Patient record not linked. Please link your account first.', 400);
    }

    const patient = await PatientModel.findById(user.patient_id);

    if (!patient) {
      throw new AppError('Linked patient record not found', 404);
    }

    return { user, patient };
  }

  async getProfile(userId) {
    const { user, patient } = await this.getLinkedPatient(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        patient_id: user.patient_id,
        role: user.role,
        last_login: user.last_login
      },
      patient
    };
  }

  async getQueueStatus(userId) {
    const { patient } = await this.getLinkedPatient(userId);

    const token = await this.queueTokenModel.getPatientCurrentToken(patient.id);

    if (!token) {
      return { token: null, position: null, estimated_wait_minutes: null };
    }

    let position = null;
    let estimatedWait = null;

    if (token.doctor_id) {
      try {
        const queueDate = token.issued_date || new Date().toISOString().split('T')[0];
        const doctorQueue = await this.queueTokenModel.getByDoctorAndDate(token.doctor_id, queueDate);

        const activeStatuses = ['waiting', 'called', 'serving'];
        const sortedQueue = doctorQueue.filter(t => activeStatuses.includes(t.status));

        const index = sortedQueue.findIndex(t => t.id === token.id);
        if (index !== -1) {
          position = index + 1;

          const ahead = Math.max(index, 0);
          const consultMinutes = token.consult_expected_minutes || 15;
          estimatedWait = token.status === 'serving' ? 0 : ahead * consultMinutes;
        }
      } catch (error) {
        logger.warn('[PatientPortal] Failed to compute queue position:', error.message);
      }
    }

    return {
      token,
      position,
      estimated_wait_minutes: estimatedWait
    };
  }

  async getVisitHistory(userId, options = {}) {
    const { patient } = await this.getLinkedPatient(userId);

    const { limit = 10, offset = 0 } = options;

    const visits = await this.visitModel.getPatientVisitHistory(patient.id, {
      limit,
      offset,
      includeInProgress: true
    });

    return visits;
  }

  async getLatestVitals(userId) {
    const { patient } = await this.getLinkedPatient(userId);
    return this.vitalsModel.getLatestByPatientId(patient.id);
  }

  async getPrescriptions(userId, includeInactive = false) {
    const { patient } = await this.getLinkedPatient(userId);
    return this.prescriptionModel.getByPatientId(patient.id, includeInactive);
  }

  async getUpcomingAppointments(userId, options = {}) {
    const { patient } = await this.getLinkedPatient(userId);
    return this.appointmentModel.getUpcomingByPatientId(patient.id, options);
  }
}

export default new PatientPortalService();
