import QueueTokenModel from '../models/QueueToken.model.js';
import AppointmentModel from '../models/Appointment.model.js';
import patientModel from '../models/Patient.model.js';
import VisitService from './Visit.service.js';
import clinicSettingsService from './ClinicSettings.service.js';
import {
  getDoctorAvailabilityForDay,
  getQueueTokensByDoctorAndDate as repoGetQueueTokensByDoctorAndDate,
  getQueueTokenById as repoGetQueueTokenById,
  updateQueueToken as repoUpdateQueueToken,
  getMaxTokenNumber,
} from './repositories/QueueRepo.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { ApplicationError } from '../errors/ApplicationError.js';
import { TransactionRunner } from './transactions/TransactionRunner.js';
import logger from '../config/logger.js';
import { executeWithRetry } from '../config/database.js';

class QueueService {
  constructor() {
    this.queueTokenModel = new QueueTokenModel();
    this.appointmentModel = new AppointmentModel();
    this.visitService = new VisitService();
    this.patientModel = patientModel; // Use the exported instance
  }

  // ===============================================
  // QUEUE TOKEN MANAGEMENT
  // ===============================================

  /**
   * Check if doctor can accept more walk-in patients
   * Validates against doctor's available time and current queue
   */
  async canAcceptWalkIn(doctorId) {
    try {
      // Get consultation duration from clinic settings
      const AVERAGE_CONSULTATION_TIME = await clinicSettingsService.getConsultationDuration();
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Get doctor's availability for today
      let availabilityData;
      try {
        availabilityData = await getDoctorAvailabilityForDay(doctorId, currentDay);
      } catch (availError) {
        logger.warn('Error fetching doctor availability:', availError);
        availabilityData = null;
      }

      if (!availabilityData || availabilityData.length === 0) {
        return {
          canAccept: false,
          reason: 'Doctor is not available today',
          currentQueue: 0,
          availableSlots: 0,
        };
      }

      // Find the availability slot that matches the current time
      // Doctor may have multiple shifts in a day
      const availability = availabilityData.find((slot) => {
        return currentTime >= slot.start_time && currentTime < slot.end_time;
      });

      if (!availability) {
        // Get all working hours for display
        const workingHours = availabilityData
          .map((slot) => `${slot.start_time} - ${slot.end_time}`)
          .join(', ');
        return {
          canAccept: false,
          reason: `Doctor's working hours today: ${workingHours}. Current time: ${currentTime}`,
          currentQueue: 0,
          availableSlots: 0,
          workingHours,
        };
      }

      // Calculate remaining time in minutes
      const endTime = new Date();
      const [endHour, endMinute] = availability.end_time.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);
      const remainingMinutes = Math.floor((endTime - now) / (1000 * 60));

      // Get current queue count for this doctor
      let currentQueue = [];
      try {
        currentQueue = await repoGetQueueTokensByDoctorAndDate(
          doctorId,
          now.toISOString().split('T')[0],
          ['waiting', 'called', 'in_consultation']
        );
      } catch (queueError) {
        logger.warn('Error fetching queue tokens:', queueError);
      }

      const queueCount = currentQueue?.length || 0;

      // Calculate total time needed for current queue + new patient
      const totalTimeNeeded = (queueCount + 1) * AVERAGE_CONSULTATION_TIME;

      // Check if there's enough time
      const canAccept = totalTimeNeeded <= remainingMinutes;

      const result = {
        canAccept,
        reason: canAccept
          ? 'Doctor can accept walk-in patient'
          : `Not enough time. Need ${totalTimeNeeded} mins, only ${remainingMinutes} mins remaining`,
        currentQueue: queueCount,
        availableSlots: Math.max(
          0,
          Math.floor(remainingMinutes / AVERAGE_CONSULTATION_TIME) - queueCount
        ),
        remainingTime: remainingMinutes,
        estimatedTimeNeeded: totalTimeNeeded,
        workingHours: `${availability.start_time} - ${availability.end_time}`,
      };

      return result;
    } catch (error) {
      logger.error('Error checking doctor capacity:', error);
      throw new Error(`Failed to check doctor capacity: ${error.message}`);
    }
  }

  /**
   * Issue a new queue token for walk-in or appointment
   *
   * Uses transaction pattern to ensure visit and token are created atomically.
   * If patient has active visit, returns 409 with ACTIVE_VISIT_EXISTS code.
   *
   * @param {Object} tokenData - Token creation data
   * @param {string} tokenData.patient_id - Patient ID
   * @param {string} tokenData.doctor_id - Doctor ID
   * @param {string} [tokenData.appointment_id] - Optional appointment ID
   * @param {number} [tokenData.priority] - Priority level (default: 1)
   * @param {Object} [currentUser] - Current user context for audit logging
   * @returns {Promise<Object>} Created token and visit
   * @throws {ApplicationError} If patient has active visit (409) or validation fails
   */
  async issueToken(tokenData, currentUser = null) {
    const { patient_id, doctor_id, appointment_id, priority = 1 } = tokenData;

    // Validate required fields
    if (!patient_id || !doctor_id) {
      throw new ApplicationError('Patient ID and Doctor ID are required', 400, 'VALIDATION_ERROR');
    }

    // Check if patient already has an active visit (in_progress)
    // Note: Visits with paid/partial_paid invoices are excluded from active visits
    // (they won't block new visits, but will show in admin pending items for manual completion)
    const activeVisit = await this.visitService.getPatientActiveVisit(patient_id);
    if (activeVisit) {
      // This is a truly active visit (no paid/partial_paid invoice) - block new visit
      throw new ApplicationError(
        `Patient already has an active visit. Please complete or cancel the current visit before creating a new one.`,
        409,
        'ACTIVE_VISIT_EXISTS',
        { activeVisitId: activeVisit.id, patientId: patient_id }
      );
    }

    // For walk-ins (no appointment_id), check if doctor can accept more patients
    if (!appointment_id) {
      const capacityCheck = await this.canAcceptWalkIn(doctor_id);
      if (!capacityCheck.canAccept) {
        throw new ApplicationError(capacityCheck.reason, 400, 'CAPACITY_EXCEEDED');
      }
    }

    // Check if patient already has an active token today (regardless of doctor)
    const existingToken = await this.queueTokenModel.getPatientCurrentToken(patient_id);
    if (existingToken) {
      throw new ApplicationError(
        `Patient already has an active token today. Please complete or cancel the current visit before queueing again. Current Token: #${existingToken.token_number}`,
        409,
        'ACTIVE_TOKEN_EXISTS',
        { tokenId: existingToken.id, tokenNumber: existingToken.token_number }
      );
    }

    // Use transaction pattern to ensure atomicity
    const transaction = new TransactionRunner();
    let visitRecord = null;
    let newToken = null;

    try {
      // Step 1: Create visit (with rollback compensation)
      const visitData = {
        patient_id: patient_id,
        doctor_id: doctor_id,
        appointment_id: appointment_id || null,
        visit_type: appointment_id ? 'appointment' : 'walk_in',
        status: 'in_progress',
      };

      visitRecord = await transaction.add(
        async () => {
          const visitResponse = await this.visitService.createVisit(visitData);
          return visitResponse.data;
        },
        async () => {
          // Compensation: delete visit if token creation fails
          if (visitRecord?.id) {
            logger.debug(`Rolling back visit creation: ${visitRecord.id}`);
            await this.visitService.updateVisit(visitRecord.id, { status: 'cancelled' });
          }
        }
      );

      // Step 2: Create token (with rollback compensation)
      newToken = await transaction.add(
        async () => {
          return this.queueTokenModel.createToken({
            patient_id,
            doctor_id,
            appointment_id,
            priority,
            status: 'waiting',
            visit_id: visitRecord.id, // REQUIRED: token must have visit_id
          });
        },
        async () => {
          // Compensation: cancel visit if token creation fails
          if (visitRecord?.id) {
            logger.debug(`Rolling back visit due to token creation failure: ${visitRecord.id}`);
            await this.visitService.updateVisit(visitRecord.id, { status: 'cancelled' });
          }
        }
      );

      // Step 3: Update appointment status if linked (non-critical, no rollback needed)
      if (appointment_id) {
        try {
          await this.appointmentModel.update(appointment_id, {
            status: 'waiting',
          });
        } catch (apptError) {
          // Don't fail the entire operation
        }
      }

      // Log visit creation for audit
      try {
        await logAuditEvent({
          userId: currentUser?.id || null,
          role: currentUser?.role || 'system',
          action: 'CREATE',
          entity: 'visits',
          recordId: visitRecord.id,
          patientId: patient_id,
          result: 'success',
          meta: {
            visit_type: visitData.visit_type,
            source: appointment_id ? 'appointment' : 'walk_in',
            doctor_id: doctor_id,
            token_id: newToken.id,
            token_number: newToken.token_number,
            created_by: currentUser
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : 'System',
          },
          note: appointment_id
            ? 'Visit created from appointment'
            : 'Walk-in visit created by receptionist',
        });
      } catch (logError) {
        logger.error('[AUDIT] Failed to log visit creation:', logError.message);
        // Don't fail the operation if audit logging fails
      }

      return {
        success: true,
        token: newToken,
        visitId: visitRecord.id,
        message: `Token #${newToken.token_number} issued successfully`,
      };
    } catch (error) {
      // Transaction runner will handle rollback automatically
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(
        `Failed to issue token: ${error.message}`,
        500,
        'TOKEN_CREATION_FAILED',
        { originalError: error.message }
      );
    }
  }

  /**
   * Call next patient and start consultation in one action
   * Priority: urgent > appointment > token number
   * Handles stuck consultations automatically
   */
  async callNextAndStart(doctorId) {
    try {
      // Check if doctor has any active consultation
      const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);
      if (activeConsultation) {
        const patientName = activeConsultation.patient
          ? `${activeConsultation.patient.first_name} ${activeConsultation.patient.last_name}`
          : 'Unknown Patient';

        return {
          success: false,
          hasActiveConsultation: true,
          activeToken: activeConsultation,
          message: `You have an active consultation with ${patientName} (Token #${activeConsultation.token_number}). Please complete it first or use "End Consultation" to close it.`,
        };
      }

      // Get next token in queue (priority order handled by getNextToken)
      const nextToken = await this.queueTokenModel.getNextToken(doctorId);

      if (!nextToken) {
        return {
          success: false,
          message: 'No patients in queue. All patients have been seen or the queue is empty.',
        };
      }

      // Update token status to 'called' first
      await this.queueTokenModel.updateStatus(nextToken.id, 'called');

      // Then immediately start consultation
      await this.queueTokenModel.updateStatus(nextToken.id, 'serving');

      // Update appointment status if linked
      if (nextToken.appointment_id) {
        await this.appointmentModel.update(nextToken.appointment_id, {
          status: 'in_progress',
        });
      }

      // Set visit_start_time if visit exists
      if (nextToken.visit_id) {
        try {
          await this.visitService.updateVisit(nextToken.visit_id, {
            visit_start_time: new Date().toISOString(),
            status: 'in_progress',
          });
        } catch (visitError) {
          logger.warn('Failed to update visit start time:', visitError);
        }
      }

      // Get updated token with patient details (use nextToken.patient which already has the data)
      const updatedToken = await this.queueTokenModel.findById(nextToken.id);

      // Get patient name from nextToken (which already includes patient data from getNextToken)
      const patientName = nextToken.patient
        ? `${nextToken.patient.first_name || ''} ${nextToken.patient.last_name || ''}`.trim() ||
          'Unknown Patient'
        : 'Unknown Patient';

      return {
        success: true,
        token: updatedToken || nextToken, // Use updatedToken if available, otherwise use nextToken
        message: `Consultation started with ${patientName} (Token #${nextToken.token_number})`,
      };
    } catch (error) {
      logger.error('[QUEUE] ❌ Error in callNextAndStart:', error);
      throw new Error(`Failed to call next patient and start consultation: ${error.message}`);
    }
  }

  /**
   * Detect and auto-fix stuck consultations
   * Finds consultations that have been serving for too long (from previous days)
   * and automatically completes them
   */
  async detectAndFixStuckConsultations(maxAgeHours = 24) {
    try {
      logger.info('[QUEUE] Starting stuck consultation detection and cleanup...');

      // Detect all stuck consultations
      const stuckTokens = await this.queueTokenModel.detectStuckConsultations(null, maxAgeHours);

      if (!stuckTokens || stuckTokens.length === 0) {
        logger.info('[QUEUE] No stuck consultations found.');
        return {
          success: true,
          fixed: 0,
          message: 'No stuck consultations found.',
        };
      }

      logger.warn(`[QUEUE] Found ${stuckTokens.length} stuck consultation(s) to fix.`);

      const fixedTokens = [];
      const errors = [];

      // Auto-fix each stuck token
      for (const token of stuckTokens) {
        try {
          const patientName = token.patient
            ? `${token.patient.first_name} ${token.patient.last_name}`
            : 'Unknown Patient';

          logger.warn(
            `[QUEUE] Auto-fixing stuck consultation: Token #${token.token_number} for ${patientName} (from ${token.issued_date})`
          );

          // Complete the token
          await this.queueTokenModel.updateStatus(token.id, 'completed');

          // Mark consultation end time if visit exists
          if (token.visit_id) {
            try {
              await this.visitService.updateVisit(token.visit_id, {
                visit_end_time: new Date().toISOString(),
              });
            } catch (visitError) {
              logger.error(
                `[QUEUE] Failed to update visit end time for visit ${token.visit_id}:`,
                visitError
              );
            }
          }

          // Complete appointment if linked
          if (token.appointment_id) {
            try {
              await this.appointmentModel.update(token.appointment_id, {
                status: 'completed',
              });
            } catch (aptError) {
              logger.error(
                `[QUEUE] Failed to update appointment ${token.appointment_id}:`,
                aptError
              );
            }
          }

          fixedTokens.push({
            tokenId: token.id,
            tokenNumber: token.token_number,
            patientName,
            issuedDate: token.issued_date,
          });
        } catch (error) {
          logger.error(`[QUEUE] Failed to fix stuck token ${token.id}:`, error);
          errors.push({
            tokenId: token.id,
            error: error.message,
          });
        }
      }

      logger.info(
        `[QUEUE] Stuck consultation cleanup completed: ${fixedTokens.length} fixed, ${errors.length} errors.`
      );

      return {
        success: true,
        fixed: fixedTokens.length,
        fixedTokens,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully fixed ${fixedTokens.length} stuck consultation(s).`,
      };
    } catch (error) {
      logger.error('[QUEUE] Error in detectAndFixStuckConsultations:', error);
      throw new Error(`Failed to detect and fix stuck consultations: ${error.message}`);
    }
  }

  /**
   * Force end any active consultation for a doctor
   * Used to fix stuck consultations
   */
  async forceEndActiveConsultation(doctorId) {
    try {
      // First check today's consultations
      let activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId, false);

      // If not found, check ALL dates for stuck tokens
      if (!activeConsultation) {
        logger.warn(
          '[QUEUE] No active consultation found for today, checking all dates for stuck tokens...',
          { doctorId }
        );
        activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId, true); // includeAllDates = true

        if (activeConsultation) {
          const tokenDate = activeConsultation.issued_date;
          const today = new Date().toISOString().split('T')[0];
          if (tokenDate !== today) {
            logger.warn('[QUEUE] Found stuck consultation from different date:', {
              tokenId: activeConsultation.id,
              tokenDate,
              today,
            });
          }
        }
      }

      if (!activeConsultation) {
        return {
          success: false,
          message: 'No active consultation found. The doctor is not currently seeing any patient.',
        };
      }

      const patientName = activeConsultation.patient
        ? `${activeConsultation.patient.first_name} ${activeConsultation.patient.last_name}`
        : 'Unknown Patient';

      logger.debug('[QUEUE] Ending consultation:', {
        tokenId: activeConsultation.id,
        tokenNumber: activeConsultation.token_number,
        patient: patientName,
        visitId: activeConsultation.visit_id,
      });

      // Complete the token

      // Force end consultation (bypass validation)
      await this.queueTokenModel.updateStatus(activeConsultation.id, 'completed', {}, true);

      // Complete visit when consultation ends (allows new visits even with outstanding balance)
      if (activeConsultation.visit_id) {
        try {
          const visitDetails = await this.visitService.getVisitDetails(activeConsultation.visit_id);
          if (visitDetails?.data?.status !== 'completed') {
            // Complete the visit with payment_status based on invoice status
            const invoice = visitDetails?.data?.invoice;
            const paymentStatus = invoice?.status === 'paid' ? 'paid' : 'pending';

            await this.visitService.completeVisit(activeConsultation.visit_id, {
              payment_status: paymentStatus,
            });
            logger.info(
              `[QUEUE] Completed visit ${activeConsultation.visit_id} after force ending consultation`
            );
          }
        } catch (visitError) {
          logger.error('Failed to complete visit:', visitError);
          // Fallback: just set end time
          try {
            await this.visitService.updateVisit(activeConsultation.visit_id, {
              visit_end_time: new Date().toISOString(),
            });
          } catch (updateError) {
            logger.error('Failed to update visit end time:', updateError);
          }
        }
      }

      // Complete appointment if linked
      if (activeConsultation.appointment_id) {
        await this.appointmentModel.update(activeConsultation.appointment_id, {
          status: 'completed',
        });
      }

      // Auto-create invoice if it doesn't exist (non-critical, no rollback needed)
      // This allows cashier to add services even if doctor forgot to add them
      if (activeConsultation.visit_id) {
        try {
          const { default: invoiceService } = await import('./Invoice.service.js');

          // Check if invoice already exists
          const existingInvoice = await invoiceService.getInvoiceByVisit(
            activeConsultation.visit_id
          );

          if (!existingInvoice) {
            // Auto-create invoice (even if $0, cashier can add services later)
            logger.debug(
              `[QUEUE] Auto-creating invoice for visit ${activeConsultation.visit_id} (force end)`
            );
            await invoiceService.createInvoice(
              activeConsultation.visit_id,
              activeConsultation.doctor_id || null
            );
            logger.info(
              `[QUEUE] ✅ Auto-created invoice for visit ${activeConsultation.visit_id} (force end)`
            );
          }
        } catch (invoiceError) {
          // Log error but don't fail consultation completion
          // Invoice can be created manually later if auto-creation fails
          logger.warn(
            `[QUEUE] ⚠️ Failed to auto-create invoice for visit ${activeConsultation.visit_id} (force end):`,
            invoiceError.message
          );
        }
      }

      return {
        success: true,
        token: activeConsultation,
        message: `Consultation with ${patientName} (Token #${activeConsultation.token_number}) has been ended successfully.`,
      };
    } catch (error) {
      logger.error('Error ending consultation:', error);
      throw new Error(`Failed to end consultation: ${error.message}`);
    }
  }

  /**
   * Call next patient in queue
   */
  async callNextPatient(doctorId) {
    // Check if doctor has any active consultation
    const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);
    if (activeConsultation) {
      throw new Error('Doctor is currently serving another patient');
    }

    // Get next token in queue
    const nextToken = await this.queueTokenModel.getNextToken(doctorId);
    if (!nextToken) {
      return {
        success: false,
        message: 'No patients in queue',
      };
    }

    // Update token status to 'called'
    const calledToken = await this.queueTokenModel.updateStatus(nextToken.id, 'called');

    // Notify the patient that they have been called
    try {
      const { default: NotificationService } = await import('./Notification.service.js');
      await NotificationService.notifyPatientByPatientId(calledToken.patient_id, {
        title: 'You are called',
        message: `Please proceed to the consultation room (Token #${calledToken.token_number}).`,
        type: 'info',
        relatedEntityType: 'queue_token',
        relatedEntityId: calledToken.id,
      });
    } catch (nerr) {
      logger.warn('[QUEUE] Failed to notify patient (called):', nerr.message);
    }

    // Update appointment status if linked
    if (nextToken.appointment_id) {
      await this.appointmentModel.update(nextToken.appointment_id, {
        status: 'ready_for_doctor',
      });
    }

    // After calling, identify who is next and notify them they are next in line
    try {
      const nextInQueue = await this.queueTokenModel.getNextToken(doctorId);
      if (nextInQueue && nextInQueue.status === 'waiting') {
        const { default: NotificationService } = await import('./Notification.service.js');
        await NotificationService.notifyPatientByPatientId(nextInQueue.patient_id, {
          title: 'You are next',
          message: 'You are next in line. Please be ready to proceed.',
          type: 'info',
          relatedEntityType: 'queue_token',
          relatedEntityId: nextInQueue.id,
        });
      }
    } catch (nerr2) {
      logger.warn('[QUEUE] Failed to notify next-in-line patient:', nerr2.message);
    }

    return {
      success: true,
      token: calledToken,
      message: `Patient ${calledToken.patient.first_name} ${calledToken.patient.last_name} (Token #${calledToken.token_number}) has been called`,
    };
  }

  /**
   * Mark patient as ready for doctor (Nurse action)
   */
  async markPatientReady(tokenId) {
    try {
      const token = await this.queueTokenModel.findById(tokenId);

      if (!token) {
        throw new Error('Token not found');
      }

      // Allow marking ready if status is 'waiting' or already 'called' (idempotent)
      if (token.status !== 'waiting' && token.status !== 'called') {
        throw new Error(`Cannot mark patient as ready. Current status: ${token.status}`);
      }

      // If already called, just return success (idempotent operation)
      if (token.status === 'called') {
        const existingToken = await this.queueTokenModel.findById(tokenId);
        return {
          success: true,
          token: existingToken,
          message: 'Patient is already marked as ready',
        };
      }

      const now = new Date();
      const updatePayload = {
        ready_at: now.toISOString(),
      };

      // Priority is now set at check-in time by receptionist based on arrival time
      // No need to boost priority here - it was already determined when token was issued

      // Update token status to called (indicating ready for doctor)
      // Note: 'called' status means the patient is ready and waiting for doctor to start consultation
      const updatedToken = await this.queueTokenModel.updateStatus(
        tokenId,
        'called',
        updatePayload
      );

      // Get the updated token with patient details using the existing method
      const tokensWithDetails = await this.queueTokenModel.getByDoctorAndDate(
        token.doctor_id,
        token.issued_date
      );
      const fullToken = tokensWithDetails.find((t) => t.id === tokenId);

      // Notify doctor that patient is ready
      try {
        const { default: NotificationService } = await import('./Notification.service.js');
        // Get patient details from the full token
        const patient = fullToken?.patient || fullToken?.patients;
        const patientName = patient
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
          : 'Patient';

        await NotificationService.notifyDoctor(token.doctor_id, {
          title: 'Patient Ready',
          message: `${patientName} (Token #${token.token_number}) is ready for consultation.`,
          type: 'info',
          relatedEntityType: 'queue_token',
          relatedEntityId: tokenId,
        });
      } catch (notifError) {
        // Log error but don't fail the operation
        logger.warn(
          '[QUEUE] Failed to notify doctor when patient marked ready:',
          notifError.message
        );
      }

      return {
        success: true,
        data: fullToken || updatedToken,
        message: `Patient (Token #${token.token_number}) is now ready for doctor`,
      };
    } catch (error) {
      logger.error('Error in markPatientReady:', error);
      throw error;
    }
  }

  /**
   * Unmark patient ready - change back to waiting (Nurse action)
   */
  async markPatientWaiting(tokenId) {
    try {
      const token = await this.queueTokenModel.findById(tokenId);

      if (!token) {
        throw new Error('Token not found');
      }

      if (token.status !== 'called') {
        throw new Error(`Cannot unmark patient ready. Current status: ${token.status}`);
      }

      // Update token status back to waiting
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'waiting');

      // Get the updated token with patient details using the existing method
      const tokensWithDetails = await this.queueTokenModel.getByDoctorAndDate(
        token.doctor_id,
        token.issued_date
      );
      const fullToken = tokensWithDetails.find((t) => t.id === tokenId);

      return {
        success: true,
        data: fullToken || updatedToken,
        message: `Patient (Token #${token.token_number}) is back to waiting`,
      };
    } catch (error) {
      logger.error('Error in markPatientWaiting:', error);
      throw error;
    }
  }

  /**
   * Start consultation with a patient
   */
  async startConsultation(tokenId) {
    try {
      // First, get the current token to check its status (with retry for network resilience)
      const currentToken = await executeWithRetry(
        async () => this.queueTokenModel.findById(tokenId),
        2,
        'Find queue token'
      );

      if (!currentToken) {
        throw new Error('Token not found');
      }

      // Quick validation before atomic operation (fast-fail optimization)
      if (currentToken.status !== 'called') {
        throw new Error(
          `Cannot start consultation. Token status is '${currentToken.status}' but should be 'called'`
        );
      }

      // Use atomic function with advisory locks to prevent race conditions
      // This function handles all checks and updates atomically, preventing race conditions
      // This ensures only one consultation can be started per doctor at a time
      let updatedToken;
      try {
        const atomicResult = await executeWithRetry(
          async () => this.queueTokenModel.startConsultationAtomic(tokenId, currentToken.doctor_id),
          2,
          'Start consultation atomically'
        );

        if (!atomicResult.success) {
          throw new Error(atomicResult.message || 'Failed to start consultation');
        }

        updatedToken = atomicResult.token;
      } catch (atomicError) {
        // If atomic function fails, check for stuck tokens from previous days
        const _errorMsg = atomicError?.message?.toLowerCase() || '';

        // Check for stuck consultations from previous days
        const existingServingToken = await executeWithRetry(
          async () => this.queueTokenModel.getActiveConsultation(currentToken.doctor_id, true), // includeAllDates = true
          1,
          'Check for stuck consultations (all dates)'
        );

        if (existingServingToken) {
          const patientInfo = existingServingToken.patient
            ? `${existingServingToken.patient.first_name} ${existingServingToken.patient.last_name} (Token #${existingServingToken.token_number})`
            : `Token #${existingServingToken.token_number}`;

          // If it's from a different date, it's a stuck token
          const tokenDate = existingServingToken.issued_date;
          const today = new Date().toISOString().split('T')[0];
          if (tokenDate !== today) {
            throw new Error(
              `Found a stuck consultation from ${tokenDate}: ${patientInfo}. Please use "End Consultation" to clear it first.`
            );
          }

          // Same day - doctor already has active consultation
          throw new Error(
            `You already have a patient in consultation: ${patientInfo}. Please complete the current consultation first.`
          );
        }

        // Re-throw the original error if no stuck token found
        throw atomicError;
      }

      // When consultation starts, notify next waiting patient that they are next
      try {
        const nextInQueue = await this.queueTokenModel.getNextToken(currentToken.doctor_id);
        if (nextInQueue && nextInQueue.status === 'waiting') {
          const { default: NotificationService } = await import('./Notification.service.js');
          await NotificationService.notifyPatientByPatientId(nextInQueue.patient_id, {
            title: 'You are next',
            message: 'You are next in line. Please be ready to proceed.',
            type: 'info',
            relatedEntityType: 'queue_token',
            relatedEntityId: nextInQueue.id,
          });
        }
      } catch (nerr) {
        logger.warn('[QUEUE] Failed to notify next-in-line on startConsultation:', nerr.message);
      }

      // Check if a visit already exists for this patient today
      // (It should exist since we create it when issuing the token)
      let visitRecord = null;
      try {
        // Try to find existing visit for this patient with this doctor today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Import VisitModel to query directly
        const { default: VisitModel } = await import('../models/Visit.model.js');
        const visitModel = new VisitModel();
        const existingVisits = await visitModel.getPatientActiveVisits(
          updatedToken.patient_id,
          todayStart,
          todayEnd
        );

        if (existingVisits && existingVisits.length > 0) {
          visitRecord = existingVisits[0];

          // Set visit_start_time when consultation begins
          try {
            await this.visitService.updateVisit(visitRecord.id, {
              visit_start_time: new Date().toISOString(),
            });

            // Log consultation start
            try {
              await logAuditEvent({
                userId: updatedToken.doctor_id,
                role: 'doctor',
                action: 'UPDATE',
                entity: 'visits',
                recordId: visitRecord.id,
                patientId: updatedToken.patient_id,
                result: 'success',
                meta: {
                  action_type: 'consultation_started',
                  token_number: updatedToken.token_number,
                },
                note: 'Doctor started consultation with patient',
              });
            } catch (logError) {
              logger.error('[AUDIT] Failed to log consultation start:', logError.message);
            }
          } catch (updateError) {
            logger.warn('[QUEUE] Failed to update visit start time:', {
              visitId: visitRecord.id,
              error: updateError?.message || String(updateError),
            });
            // Continue - visit update failure shouldn't block consultation start
          }
        } else {
          // No visit found, create one (fallback for legacy tokens)
          const visitData = {
            patient_id: updatedToken.patient_id,
            doctor_id: updatedToken.doctor_id,
            appointment_id: updatedToken.appointment_id || null,
            visit_type: updatedToken.appointment_id ? 'appointment' : 'walk_in',
            status: 'in_progress',
            visit_start_time: new Date().toISOString(),
          };

          const visitResponse = await this.visitService.createVisit(visitData);
          visitRecord = visitResponse.data;
        }
      } catch (visitError) {
        logger.warn('[QUEUE] Failed to handle visit record during consultation start:', {
          tokenId: tokenId,
          patientId: updatedToken.patient_id,
          error: visitError?.message || String(visitError),
        });
        // Don't fail the consultation start if visit handling fails
        // This ensures backward compatibility
      }

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, {
          status: 'consulting',
        });
      }

      return {
        success: true,
        token: updatedToken,
        visit: visitRecord,
        message: 'Consultation started',
      };
    } catch (error) {
      // Better error logging with full details
      logger.error('Queue Service Error in startConsultation:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
        tokenId: tokenId,
        error: error,
      });

      // Re-throw with better error message if it's missing
      if (!error.message) {
        const errMsg = String(error) || 'Unknown error occurred';
        throw new Error(`Failed to start consultation: ${errMsg}`);
      }

      throw error;
    }
  }

  /**
   * Complete consultation - marks token and appointment as completed
   * Sets visit_end_time but keeps visit status as 'in_progress' until invoice is paid
   *
   * Business rule: Visits are only completed when invoice is paid (via InvoiceService.completeInvoice)
   * This ensures proper billing workflow and prevents premature visit completion
   *
   * @param {string} tokenId - The queue token ID
   * @returns {Promise<Object>} Success response with completed token
   * @throws {ApplicationError} If token has no visit_id (ORPHAN_TOKEN)
   */
  async completeConsultation(tokenId) {
    try {
      // Get the token to find associated visit (select all fields including visit_id)
      const token = await this.queueTokenModel.findById(tokenId, '*');
      if (!token) {
        throw new ApplicationError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      // CRITICAL: Token must have visit_id - error if missing
      if (!token.visit_id) {
        throw new ApplicationError(
          `Cannot complete consultation: Token #${token.token_number} is missing visit information. ` +
            `Please contact support to resolve this data integrity issue. The consultation cannot be completed until this is fixed.`,
          400,
          'ORPHAN_TOKEN',
          {
            tokenId,
            tokenNumber: token.token_number,
            patientId: token.patient_id,
            message: 'Token missing visit association - data integrity issue',
          }
        );
      }

      // Get visit before update for audit logging
      const oldVisit = await this.visitService.getVisitDetails(token.visit_id);
      const oldTokenStatus = token.status;

      // Use transaction pattern to ensure atomicity
      const transaction = new TransactionRunner();
      let updatedToken = null;
      let _updatedVisit = null;
      let _updatedAppointment = null;

      try {
        // Step 1: Update token status (with rollback compensation)
        updatedToken = await transaction.add(
          async () => {
            return this.queueTokenModel.updateStatus(tokenId, 'completed');
          },
          async () => {
            // Compensation: revert token status if later steps fail
            await this.queueTokenModel.updateStatus(tokenId, oldTokenStatus);
          }
        );

        // Step 2: Complete visit when consultation ends (with rollback compensation)
        _updatedVisit = await transaction.add(
          async () => {
            // Business rule: Complete visit when consultation ends to allow new visits
            // Invoice can remain partial_paid, but visit should be completed
            // This allows patients to have new visits even with outstanding balance
            try {
              const visitDetails = await this.visitService.getVisitDetails(token.visit_id);
              if (visitDetails?.data?.status !== 'completed') {
                // Complete the visit with payment_status based on invoice status
                const invoice = visitDetails?.data?.invoice;
                const paymentStatus = invoice?.status === 'paid' ? 'paid' : 'pending';

                await this.visitService.completeVisit(token.visit_id, {
                  payment_status: paymentStatus,
                });
                logger.info(
                  `[QueueService] Completed visit ${token.visit_id} after consultation ended`
                );
              }
              return { id: token.visit_id, status: 'completed' };
            } catch (visitError) {
              // If visit completion fails, just set end time as fallback
              logger.warn(
                `[QueueService] Failed to complete visit ${token.visit_id}, setting end time only:`,
                visitError
              );
              return this.visitService.updateVisit(token.visit_id, {
                visit_end_time: new Date().toISOString(),
              });
            }
          },
          async () => {
            // Compensation: if visit completion fails, token status will be rolled back
            // Visit completion doesn't need explicit rollback as it's a final state
          }
        );

        // Step 3: Update appointment status if linked (with rollback compensation)
        if (token.appointment_id) {
          _updatedAppointment = await transaction.add(
            async () => {
              return this.appointmentModel.update(token.appointment_id, {
                status: 'completed',
              });
            },
            async () => {
              // Compensation: revert appointment status if needed
              // Get original status before update
              const originalAppointment = await this.appointmentModel.findById(
                token.appointment_id
              );
              if (originalAppointment) {
                await this.appointmentModel.update(token.appointment_id, {
                  status: originalAppointment.status,
                });
              }
            }
          );
        }

        // Step 4: Auto-create invoice if it doesn't exist (non-critical, no rollback needed)
        // This allows cashier to add services even if doctor forgot to add them
        try {
          const { default: invoiceService } = await import('./Invoice.service.js');

          // Check if invoice already exists
          const existingInvoice = await invoiceService.getInvoiceByVisit(token.visit_id);

          if (!existingInvoice) {
            // Auto-create invoice (even if $0, cashier can add services later)
            logger.debug(`[QUEUE] Auto-creating invoice for visit ${token.visit_id}`);
            await invoiceService.createInvoice(token.visit_id, token.doctor_id || null);
            logger.info(`[QUEUE] ✅ Auto-created invoice for visit ${token.visit_id}`);
          }
        } catch (invoiceError) {
          // Log error but don't fail consultation completion
          // Invoice can be created manually later if auto-creation fails
          logger.warn(
            `[QUEUE] ⚠️ Failed to auto-create invoice for visit ${token.visit_id}:`,
            invoiceError.message
          );
        }

        // All steps succeeded - transaction is complete
        // (TransactionRunner executes operations immediately in add(), no explicit commit needed)

        // Log visit update for audit (after successful commit)
        try {
          await logAuditEvent({
            userId: null, // System action
            role: 'system',
            action: 'UPDATE',
            entity: 'visits',
            recordId: token.visit_id,
            patientId: token.patient_id,
            old_values: { visit_end_time: oldVisit?.data?.visit_end_time || null },
            new_values: { visit_end_time: new Date().toISOString() },
            status: 'success',
            reason: 'Consultation ended - visit_end_time set',
          });
        } catch (logError) {
          logger.error('[AUDIT] Failed to log visit update:', logError.message);
        }

        // Notify cashiers that consultation is finished and patient will come for payment
        try {
          const { default: NotificationService } = await import('./Notification.service.js');
          const visitDetails = await this.visitService.getVisitDetails(token.visit_id);
          const patient = visitDetails?.data?.patient;
          const patientName = patient
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : 'Patient';

          await NotificationService.notifyCashiers({
            title: 'Consultation Completed',
            message: `${patientName} has completed their consultation and will proceed to payment. Invoice is ready for processing.`,
            type: 'info',
            relatedEntityType: 'visit',
            relatedEntityId: token.visit_id,
          });
        } catch (notifError) {
          // Log error but don't fail consultation completion
          logger.warn(
            '[QUEUE] Failed to notify cashiers after consultation completion:',
            notifError.message
          );
        }

        return {
          success: true,
          token: updatedToken,
          message: 'Consultation completed',
        };
      } catch (error) {
        // Rollback all changes if any step fails
        try {
          await transaction.rollback();
          logger.info('[QUEUE] Successfully rolled back consultation completion due to error');
        } catch (rollbackError) {
          // If rollback fails, log error but don't mask original error
          logger.error(
            '[QUEUE] ❌ CRITICAL: Rollback failed after consultation completion error:',
            rollbackError
          );
          logger.error('[QUEUE] Original error:', error);

          // Attempt recovery: Check current state and log for admin review
          try {
            const currentToken = await this.queueTokenModel.findById(tokenId, '*');
            const currentVisit = await this.visitService.getVisitDetails(token.visit_id);

            logger.error('[QUEUE] Recovery check - Current state:', {
              tokenStatus: currentToken?.status,
              visitStatus: currentVisit?.data?.status,
              visitEndTime: currentVisit?.data?.visit_end_time,
              error: error.message,
              rollbackError: rollbackError.message,
            });

            // If token is completed but visit is not updated, this is a partial state
            if (currentToken?.status === 'completed' && !currentVisit?.data?.visit_end_time) {
              logger.error(
                '[QUEUE] ⚠️ PARTIAL STATE DETECTED: Token completed but visit not updated. Manual intervention required.'
              );
            }
          } catch (recoveryError) {
            logger.error('[QUEUE] Failed to check recovery state:', recoveryError);
          }
        }
        throw error;
      }
    } catch (error) {
      logger.error('[QUEUE] ❌ Error completing consultation:', error.message);
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(
        `Failed to complete consultation: ${error.message}`,
        500,
        'CONSULTATION_COMPLETION_FAILED'
      );
    }
  }

  /**
   * Mark patient as missed/no-show
   *
   * Cancels the associated visit if it exists (status: 'cancelled', reason: 'no_show')
   *
   * @param {string} tokenId - The queue token ID
   * @returns {Promise<Object>} Updated token
   */
  async markPatientMissed(tokenId) {
    try {
      // Get token to check for visit_id
      const token = await this.queueTokenModel.findById(tokenId, '*');
      if (!token) {
        throw new ApplicationError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      // Update token status
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'missed');

      // Cancel the associated visit if it exists
      if (updatedToken.visit_id) {
        try {
          const oldVisit = await this.visitService.getVisitDetails(updatedToken.visit_id);
          await this.visitService.updateVisit(updatedToken.visit_id, {
            status: 'cancelled',
          });

          // Log visit status change for audit
          try {
            await logAuditEvent({
              userId: null, // System action
              role: 'system',
              action: 'UPDATE',
              entity: 'visits',
              recordId: updatedToken.visit_id,
              patientId: token.patient_id,
              old_values: { status: oldVisit?.data?.status || 'in_progress' },
              new_values: { status: 'cancelled', reason: 'no_show' },
              status: 'success',
              reason: 'Patient marked as missed/no-show',
            });
          } catch (logError) {
            logger.error('[AUDIT] Failed to log visit cancellation:', logError.message);
          }
        } catch (visitError) {
          logger.error(
            `[QUEUE] ⚠️ Failed to cancel visit ${updatedToken.visit_id}:`,
            visitError.message
          );
          // Don't fail the entire operation if visit cancellation fails
        }
      }

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        try {
          await this.appointmentModel.update(updatedToken.appointment_id, {
            status: 'no_show',
          });
        } catch (apptError) {
          // Ignore appointment update errors - token update is more important
        }
      }

      return {
        success: true,
        token: updatedToken,
        message: 'Patient marked as no-show',
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(
        `Failed to mark patient as missed: ${error.message}`,
        500,
        'MARK_MISSED_FAILED'
      );
    }
  }

  /**
   * Cancel queue token
   */
  async cancelToken(tokenId) {
    const token = await this.queueTokenModel.findById(tokenId);
    if (!token) {
      throw new Error('Token not found');
    }

    const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'cancelled');

    // Update appointment status if linked
    if (updatedToken.appointment_id) {
      await this.appointmentModel.update(updatedToken.appointment_id, {
        status: 'cancelled',
      });
    }

    // Cancel the associated visit if it exists
    if (updatedToken.visit_id) {
      try {
        await this.visitService.updateVisit(updatedToken.visit_id, {
          status: 'cancelled',
        });
      } catch (visitError) {
        logger.error(`⚠️ Failed to cancel visit ${updatedToken.visit_id}:`, visitError.message);
        // Don't fail the token cancellation if visit cancellation fails
      }
    }

    return {
      success: true,
      token: updatedToken,
      message: 'Token cancelled',
    };
  }

  /**
   * Delay a patient - removes them from active queue
   * Patient's token number is preserved
   */
  async delayToken(tokenId, reason = null) {
    try {
      // Get current token
      let currentToken;
      try {
        currentToken = await repoGetQueueTokenById(tokenId);
      } catch (fetchError) {
        throw new Error('Token not found');
      }

      logger.debug(`[DELAY TOKEN] Token ID: ${tokenId}, Current Status: ${currentToken.status}`);

      // Can only delay if status is waiting or called
      if (!['waiting', 'called'].includes(currentToken.status)) {
        throw new Error(
          `Cannot delay token with status "${currentToken.status}". Only waiting or called tokens can be delayed.`
        );
      }

      // Update token to delayed status
      const updatedToken = await repoUpdateQueueToken(tokenId, {
        status: 'delayed',
        previous_status: currentToken.status,
        delay_reason: reason,
        delayed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        token: updatedToken,
        message: 'Patient marked as delayed',
      };
    } catch (error) {
      logger.error('Error delaying token:', error);
      throw error;
    }
  }

  /**
   * Undelay a patient - adds them back to the END of the queue
   * Token gets the next highest token number for that doctor/date
   */
  async undelayToken(tokenId) {
    try {
      // Get current token
      let currentToken;
      try {
        currentToken = await repoGetQueueTokenById(tokenId);
      } catch (fetchError) {
        throw new Error('Token not found');
      }

      if (currentToken.status !== 'delayed') {
        throw new Error('Token is not delayed');
      }

      // Get the highest token number for this doctor/date
      const maxTokenNumber = await getMaxTokenNumber(
        currentToken.doctor_id,
        currentToken.issued_date
      );
      const newTokenNumber = maxTokenNumber + 1;

      // Update token - move to end of queue with new token number
      const updatedToken = await repoUpdateQueueToken(tokenId, {
        status: 'waiting', // Reset to waiting status
        token_number: newTokenNumber, // Assign new token number at end of queue
        undelayed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        token: updatedToken,
        message: `Patient undelayed and moved to position #${newTokenNumber} in queue`,
        newTokenNumber,
      };
    } catch (error) {
      logger.error('Error undelaying token:', error);
      throw error;
    }
  }

  // ===============================================
  // QUEUE STATUS AND REPORTING
  // ===============================================
  // ===============================================

  /**
   * Get comprehensive queue status for a doctor
   */
  async getQueueStatus(doctorId, date = null) {
    const queueDate = date || new Date().toISOString().split('T')[0];

    // Get token-based queue
    const tokens = await this.queueTokenModel.getByDoctorAndDate(doctorId, queueDate);

    // Get statistics
    const tokenStats = await this.queueTokenModel.getQueueStats(doctorId, queueDate);

    // Get current status
    const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);
    const nextToken = await this.queueTokenModel.getNextToken(doctorId, queueDate);

    return {
      doctor_id: doctorId,
      date: queueDate,
      tokens: tokens,
      appointments: [],
      statistics: {
        tokens: tokenStats,
        appointments: { total: 0, queued: 0, completed: 0 },
        combined: {
          totalPatients: tokenStats.total,
          waitingPatients: tokenStats.waiting,
          completedToday: tokenStats.completed,
        },
      },
      currentStatus: {
        activeConsultation: activeConsultation,
        nextInQueue: nextToken,
        isAvailable: !activeConsultation,
      },
    };
  }

  /**
   * Get patient's queue position and estimated wait time
   */
  async getPatientQueueInfo(patientId, doctorId) {
    const currentToken = await this.queueTokenModel.getPatientCurrentToken(patientId, doctorId);

    if (!currentToken) {
      return {
        hasToken: false,
        message: 'No active token found',
      };
    }

    // Calculate position in queue
    const queueTokens = await this.queueTokenModel.getCurrentQueueStatus(doctorId);
    const position =
      queueTokens.filter(
        (token) => token.status === 'waiting' && token.token_number < currentToken.token_number
      ).length + 1;

    // Estimate wait time using clinic settings for consultation duration
    const consultationDuration = await clinicSettingsService.getConsultationDuration();
    const estimatedWaitMinutes = (position - 1) * consultationDuration;

    return {
      hasToken: true,
      token: currentToken,
      queuePosition: position,
      estimatedWaitTime: estimatedWaitMinutes,
      status: currentToken.status,
      message: this.getPatientStatusMessage(currentToken.status, position, estimatedWaitMinutes),
    };
  }

  /**
   * Get queue display board data (for public displays)
   */
  async getQueueDisplayBoard(doctorId) {
    const currentQueue = await this.queueTokenModel.getCurrentQueueStatus(doctorId);
    const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);

    const displayData = {
      doctorInfo: currentQueue.length > 0 ? currentQueue[0].doctor : null,
      currentlyServing: activeConsultation
        ? {
            tokenNumber: activeConsultation.token_number,
            patientName: `${activeConsultation.patient.first_name} ${activeConsultation.patient.last_name.charAt(0)}.`,
          }
        : null,
      waitingQueue: currentQueue
        .filter((token) => token.status === 'waiting')
        .slice(0, 10) // Show next 10 patients
        .map((token) => ({
          tokenNumber: token.token_number,
          patientName: `${token.patient.first_name} ${token.patient.last_name.charAt(0)}.`,
          estimatedTime: token.estimated_wait_time,
        })),
      calledTokens: currentQueue
        .filter((token) => token.status === 'called')
        .map((token) => ({
          tokenNumber: token.token_number,
          patientName: `${token.patient.first_name} ${token.patient.last_name.charAt(0)}.`,
        })),
    };

    return displayData;
  }

  // ===============================================
  // APPOINTMENT INTEGRATION
  // ===============================================

  /**
   * Process scheduled appointments into queue
   */
  async processScheduledAppointments(doctorId, date = null) {
    const appointmentDate = date || new Date().toISOString().split('T')[0];

    // Get scheduled appointments for the day
    const appointments = await this.appointmentModel.getByDate(appointmentDate);
    const doctorAppointments = appointments.filter((apt) => apt.doctor_id === doctorId);

    const processedAppointments = [];

    for (const appointment of doctorAppointments) {
      // Check if appointment already has a token
      const existingToken = await this.queueTokenModel.getPatientCurrentToken(
        appointment.patient_id,
        doctorId
      );

      if (!existingToken && appointment.status === 'scheduled') {
        // Issue token for scheduled appointment
        const tokenResult = await this.issueToken({
          patient_id: appointment.patient_id,
          doctor_id: doctorId,
          appointment_id: appointment.id,
          priority: 2, // Scheduled appointments get normal priority
        });

        processedAppointments.push({
          appointment: appointment,
          token: tokenResult.token,
        });
      }
    }

    return {
      success: true,
      processed: processedAppointments.length,
      appointments: processedAppointments,
      message: `Processed ${processedAppointments.length} scheduled appointments`,
    };
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  /**
   * Generate patient status message
   */
  getPatientStatusMessage(status, position, estimatedWaitMinutes) {
    switch (status) {
      case 'waiting':
        return `You are #${position} in queue. Estimated wait time: ${estimatedWaitMinutes} minutes`;
      case 'called':
        return 'Please proceed to the consultation room';
      case 'serving':
        return 'Currently in consultation';
      case 'completed':
        return 'Consultation completed';
      case 'missed':
        return 'Marked as no-show. Please contact reception';
      case 'cancelled':
        return 'Token cancelled';
      default:
        return 'Status unknown';
    }
  }

  /**
   * Get queue analytics for reporting
   */
  async getQueueAnalytics(doctorId, startDate, endDate) {
    const tokenHistory = await this.queueTokenModel.getQueueHistory(doctorId, startDate, endDate);

    const analytics = {
      totalPatients: tokenHistory.length,
      averageTokensPerDay: tokenHistory.length / this.getDaysBetweenDates(startDate, endDate),
      statusBreakdown: {
        completed: tokenHistory.filter((t) => t.status === 'completed').length,
        missed: tokenHistory.filter((t) => t.status === 'missed').length,
        cancelled: tokenHistory.filter((t) => t.status === 'cancelled').length,
      },
      averageWaitTime: this.calculateAverageWaitTime(tokenHistory),
      peakHours: this.calculatePeakHours(tokenHistory),
      patientSatisfaction: this.calculatePatientSatisfaction(tokenHistory),
    };

    return analytics;
  }

  /**
   * Calculate average wait time from history
   */
  calculateAverageWaitTime(tokenHistory) {
    const completedTokens = tokenHistory.filter(
      (token) => token.status === 'completed' && token.served_at && token.issued_time
    );

    if (completedTokens.length === 0) {
      return 0;
    }

    const totalWaitMinutes = completedTokens.reduce((sum, token) => {
      const waitTime = new Date(token.served_at) - new Date(token.issued_time);
      return sum + waitTime / (1000 * 60);
    }, 0);

    return Math.round(totalWaitMinutes / completedTokens.length);
  }

  /**
   * Calculate peak hours
   */
  calculatePeakHours(tokenHistory) {
    const hourCounts = {};

    tokenHistory.forEach((token) => {
      const hour = new Date(token.issued_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  /**
   * Calculate patient satisfaction score
   */
  calculatePatientSatisfaction(tokenHistory) {
    const completedTokens = tokenHistory.filter((t) => t.status === 'completed');
    const missedTokens = tokenHistory.filter((t) => t.status === 'missed');

    if (completedTokens.length === 0) {
      return 0;
    }

    // Simple satisfaction based on completion rate and wait times
    const completionRate = completedTokens.length / (completedTokens.length + missedTokens.length);
    const avgWaitTime = this.calculateAverageWaitTime(tokenHistory);

    // Lower wait times and higher completion rates = higher satisfaction
    const waitTimeScore = Math.max(0, 100 - (avgWaitTime / 60) * 10); // Penalty for long waits
    const completionScore = completionRate * 100;

    return Math.round((waitTimeScore + completionScore) / 2);
  }

  /**
   * Get days between two dates
   */
  getDaysBetweenDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }

  /**
   * Get the patient currently in active consultation with the doctor
   */
  async getActiveConsultation(doctorId) {
    try {
      const activeToken = await this.queueTokenModel.getActiveConsultation(doctorId);
      return activeToken;
    } catch (error) {
      throw new Error(`Failed to get active consultation: ${error.message}`);
    }
  }

  /**
   * Force complete any active consultation for a doctor
   * Bypasses normal validation to allow admin/doctor to force end consultations
   */
  async forceCompleteActiveConsultation(doctorId) {
    try {
      // Find any token with status 'serving' for this doctor using existing method
      const activeToken = await this.queueTokenModel.getActiveConsultation(doctorId);

      if (!activeToken) {
        return {
          success: false,
          message: 'No active consultation found for this doctor',
        };
      }

      logger.debug(
        '🎯 Found active consultation token:',
        activeToken.id,
        'for patient:',
        activeToken.patient_id
      );

      // Force complete this consultation (bypass validation for force complete)
      const updatedToken = await this.queueTokenModel.updateStatus(
        activeToken.id,
        'completed',
        {},
        true
      );

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, {
          status: 'completed',
        });
      }

      return {
        success: true,
        token: updatedToken,
        message: `Force completed consultation for ${activeToken.patient?.first_name || 'patient'} (Token #${activeToken.token_number})`,
      };
    } catch (error) {
      logger.error('Error force completing consultation:', error);
      throw new Error(`Failed to force complete consultation: ${error.message}`);
    }
  }
}

export default QueueService;
