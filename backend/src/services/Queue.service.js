import QueueTokenModel from '../models/QueueToken.model.js';
import AppointmentQueueModel from '../models/AppointmentQueue.model.js';
import AppointmentModel from '../models/Appointment.model.js';
import patientModel from '../models/Patient.model.js';
import VisitService from './Visit.service.js';
import { supabase } from '../config/database.js';
import { logAuditEvent } from '../utils/auditLogger.js';

class QueueService {
  constructor() {
    this.queueTokenModel = new QueueTokenModel();
    this.appointmentQueueModel = new AppointmentQueueModel();
    this.appointmentModel = new AppointmentModel();
    this.visitService = new VisitService();
    this.supabase = supabase;
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
      const AVERAGE_CONSULTATION_TIME = 15; // minutes per patient
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Get doctor's availability for today
      const { data: availabilityData, error: availError } = await this.supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', currentDay)
        .eq('is_active', true);

      if (availError || !availabilityData || availabilityData.length === 0) {
        return {
          canAccept: false,
          reason: 'Doctor is not available today',
          currentQueue: 0,
          availableSlots: 0
        };
      }

      // Find the availability slot that matches the current time
      // Doctor may have multiple shifts in a day
      const availability = availabilityData.find(slot => {
        return currentTime >= slot.start_time && currentTime < slot.end_time;
      });

      if (!availability) {
        // Get all working hours for display
        const workingHours = availabilityData
          .map(slot => `${slot.start_time} - ${slot.end_time}`)
          .join(', ');
        return {
          canAccept: false,
          reason: `Doctor's working hours today: ${workingHours}. Current time: ${currentTime}`,
          currentQueue: 0,
          availableSlots: 0,
          workingHours
        };
      }

      // Calculate remaining time in minutes
      const endTime = new Date();
      const [endHour, endMinute] = availability.end_time.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);
      const remainingMinutes = Math.floor((endTime - now) / (1000 * 60));

      // Get current queue count for this doctor
      const { data: currentQueue, error: queueError } = await this.supabase
        .from('queue_tokens')
        .select('id, status')
        .eq('doctor_id', doctorId)
        .in('status', ['waiting', 'called', 'in_consultation'])
        .eq('issued_date', now.toISOString().split('T')[0]);

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
        availableSlots: Math.max(0, Math.floor(remainingMinutes / AVERAGE_CONSULTATION_TIME) - queueCount),
        remainingTime: remainingMinutes,
        estimatedTimeNeeded: totalTimeNeeded,
        workingHours: `${availability.start_time} - ${availability.end_time}`
      };

      return result;
    } catch (error) {
      console.error('Error checking doctor capacity:', error);
      throw new Error(`Failed to check doctor capacity: ${error.message}`);
    }
  }

  /**
   * Issue a new queue token for walk-in or appointment
   */
  async issueToken(tokenData, currentUser = null) {
    try {
      const { patient_id, doctor_id, appointment_id, priority = 1 } = tokenData;

      // Validate required fields
      if (!patient_id || !doctor_id) {
        throw new Error('Patient ID and Doctor ID are required');
      }

      // For walk-ins (no appointment_id), check if doctor can accept more patients
      if (!appointment_id) {
        const capacityCheck = await this.canAcceptWalkIn(doctor_id);
        if (!capacityCheck.canAccept) {
          throw new Error(capacityCheck.reason);
        }
      }

      // Check if patient already has an active token today
      const existingToken = await this.queueTokenModel.getPatientCurrentToken(patient_id, doctor_id);
      if (existingToken) {
        throw new Error(`Patient already has an active token for this doctor today. Token: ${JSON.stringify(existingToken)}`);
      }

      // Create a visit record for this new consultation
      let visitRecord = null;
      try {
        const visitData = {
          patient_id: patient_id,
          doctor_id: doctor_id,
          appointment_id: appointment_id || null,
          visit_type: appointment_id ? 'appointment' : 'walk_in',
          status: 'in_progress'
        };

        console.log(`[QUEUE] Creating visit record for patient ${patient_id}`);
        const visitResponse = await this.visitService.createVisit(visitData);
        visitRecord = visitResponse.data;
        console.log(`[QUEUE] ✅ Visit record created: ${visitRecord.id}`);

        // Log visit creation (walk-in registration)
        try {
          await logAuditEvent({
            userId: currentUser?.id || null, // Receptionist who created the walk-in
            role: currentUser?.role || 'system',
            action: 'CREATE',
            entity: 'visits',
            recordId: visitRecord.id,
            patientId: patient_id,
            result: 'success',
            meta: { 
              visit_type: visitData.visit_type,
              source: 'walk_in_registration',
              doctor_id: doctor_id, // Store doctor info in meta
              created_by: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'System'
            },
            note: appointment_id ? 'Visit created from appointment' : 'Walk-in visit created by receptionist'
          });
        } catch (logError) {
          console.error('[AUDIT] Failed to log visit creation:', logError.message);
        }

      } catch (visitError) {
        console.error(`[QUEUE] ⚠️ Failed to create visit record:`, visitError.message);
        // Don't fail the token creation if visit creation fails
        // This ensures the queue can still work even if there are visit issues
      }

      // Create the token
      const newToken = await this.queueTokenModel.createToken({
        patient_id,
        doctor_id,
        appointment_id,
        priority,
        status: 'waiting',
        visit_id: visitRecord?.id || null  // Link token to its specific visit
      });

      // If this is linked to an appointment, update appointment status
      if (appointment_id) {
        await this.appointmentModel.update(appointment_id, { 
          status: 'waiting' 
        });

        // Add to appointment queue as well
        await this.appointmentQueueModel.addToQueue(appointment_id, doctor_id, patient_id, priority);
      }

      return {
        success: true,
        token: newToken,
        visitId: visitRecord?.id || null,
        message: `Token #${newToken.token_number} issued successfully`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Call next patient in queue
   */
  async callNextPatient(doctorId) {
    try {
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
          message: 'No patients in queue'
        };
      }

      // Update token status to 'called'
      const calledToken = await this.queueTokenModel.updateStatus(nextToken.id, 'called');

      // Update appointment status if linked
      if (nextToken.appointment_id) {
        await this.appointmentModel.update(nextToken.appointment_id, { 
          status: 'ready_for_doctor' 
        });
      }

      return {
        success: true,
        token: calledToken,
        message: `Patient ${calledToken.patient.first_name} ${calledToken.patient.last_name} (Token #${calledToken.token_number}) has been called`
      };
    } catch (error) {
      throw error;
    }
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

      if (token.status !== 'waiting') {
        throw new Error(`Cannot mark patient as ready. Current status: ${token.status}`);
      }

      const now = new Date();
      const updatePayload = {
        ready_at: now.toISOString()
      };
      let priorityBoosted = false;

      // Boost priority for scheduled patients who arrived after their appointment time
      if (token.appointment_id) {
        try {
          const appointment = await this.appointmentModel.findById(token.appointment_id);

          if (appointment?.appointment_date && appointment?.appointment_time) {
            const timePart = appointment.appointment_time.length === 5
              ? `${appointment.appointment_time}:00`
              : appointment.appointment_time;
            const scheduledDateTime = new Date(`${appointment.appointment_date}T${timePart}`);

            if (!Number.isNaN(scheduledDateTime.getTime())) {
              const diffMinutes = (now.getTime() - scheduledDateTime.getTime()) / 60000;

              if (diffMinutes >= 10) {
                const targetPriority = 4; // Below emergency (5) but ahead of standard queue
                const currentPriority = token.priority ?? 1;

                if (currentPriority < targetPriority) {
                  updatePayload.priority = targetPriority;
                  priorityBoosted = true;
                }
              }
            } else {
              console.warn(`[QUEUE] Unable to parse scheduled datetime for appointment ${appointment.id}`);
            }
          }
        } catch (appointmentError) {
          console.warn(`[QUEUE] Failed to evaluate appointment timing for token ${tokenId}:`, appointmentError.message);
        }
      }

      // Update token status to called (indicating ready for doctor)
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'called', updatePayload);

      // Keep appointment queue priority aligned if boosted
      if (priorityBoosted && token.appointment_id) {
        try {
          await this.supabase
            .from('appointment_queue')
            .update({
              priority: updatePayload.priority,
              updated_at: now.toISOString()
            })
            .eq('appointment_id', token.appointment_id)
            .eq('patient_id', token.patient_id);
        } catch (queueUpdateError) {
          console.warn(`[QUEUE] Failed to sync appointment queue priority for token ${tokenId}:`, queueUpdateError.message);
        }
      }
      
      // Get the updated token with patient details using the existing method
      const tokensWithDetails = await this.queueTokenModel.getByDoctorAndDate(token.doctor_id, token.issued_date);
      const fullToken = tokensWithDetails.find(t => t.id === tokenId);

      return {
        success: true,
        data: fullToken || updatedToken,
        message: priorityBoosted
          ? `Patient (Token #${token.token_number}) is now ready and prioritized for their scheduled slot`
          : `Patient (Token #${token.token_number}) is now ready for doctor`
      };
    } catch (error) {
      console.error('Error in markPatientReady:', error);
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
      const tokensWithDetails = await this.queueTokenModel.getByDoctorAndDate(token.doctor_id, token.issued_date);
      const fullToken = tokensWithDetails.find(t => t.id === tokenId);
      
      console.log('Full token with details:', fullToken);

      return {
        success: true,
        data: fullToken || updatedToken,
        message: `Patient (Token #${token.token_number}) is back to waiting`
      };
    } catch (error) {
      console.error('Error in markPatientWaiting:', error);
      throw error;
    }
  }

  /**
   * Start consultation with a patient
   */
  async startConsultation(tokenId) {
    try {
      // First, get the current token to check its status
      const currentToken = await this.queueTokenModel.findById(tokenId);
      
      if (!currentToken) {
        throw new Error('Token not found');
      }
      
      if (currentToken.status !== 'called') {
        throw new Error(`Cannot start consultation. Token status is '${currentToken.status}' but should be 'called'`);
      }
      
      // Check if doctor already has a patient in consultation
      const existingServingToken = await this.queueTokenModel.getActiveConsultation(currentToken.doctor_id);
      if (existingServingToken) {
        // Get patient details for the existing serving token
        const patientInfo = existingServingToken.patient 
          ? `${existingServingToken.patient.first_name} ${existingServingToken.patient.last_name} (Token #${existingServingToken.token_number})`
          : `Token #${existingServingToken.token_number}`;
        throw new Error(`You already have a patient in consultation: ${patientInfo}. Please complete the current consultation first.`);
      }
      
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'serving');
      console.log('✅ Token status updated to serving:', updatedToken);

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
          console.log(`✅ Using existing visit record: ${visitRecord.id}`);
          
          // Set visit_start_time when consultation begins
          try {
            await this.visitService.updateVisit(visitRecord.id, {
              visit_start_time: new Date().toISOString()
            });
            console.log(`✅ Set visit_start_time for visit: ${visitRecord.id}`);

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
                  token_number: updatedToken.token_number
                },
                note: 'Doctor started consultation with patient'
              });
            } catch (logError) {
              console.error('[AUDIT] Failed to log consultation start:', logError.message);
            }

          } catch (updateError) {
            console.warn('⚠️ Failed to set visit_start_time:', updateError.message);
          }
        } else {
          // No visit found, create one (fallback for legacy tokens)
          const visitData = {
            patient_id: updatedToken.patient_id,
            doctor_id: updatedToken.doctor_id,
            appointment_id: updatedToken.appointment_id || null,
            visit_type: updatedToken.appointment_id ? 'appointment' : 'walk_in',
            status: 'in_progress',
            visit_start_time: new Date().toISOString()
          };

          const visitResponse = await this.visitService.createVisit(visitData);
          visitRecord = visitResponse.data;
          console.log('✅ Visit record created (fallback) with start time:', visitRecord.id);
        }

      } catch (visitError) {
        console.warn('⚠️ Failed to handle visit record:', visitError.message);
        // Don't fail the consultation start if visit handling fails
        // This ensures backward compatibility
      }

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        console.log('📅 Updating appointment status for:', updatedToken.appointment_id);
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'consulting' 
        });
      }

      return {
        success: true,
        token: updatedToken,
        visit: visitRecord,
        message: 'Consultation started'
      };
    } catch (error) {
      console.error('❌ Queue Service Error:', error);
      throw error;
    }
  }

  /**
   * Complete consultation
   */
  async completeConsultation(tokenId) {
    try {
      // Get the token to find associated visit (select all fields including visit_id)
      const token = await this.queueTokenModel.findById(tokenId, '*');
      if (!token) {
        throw new Error('Token not found');
      }

      console.log('[QUEUE] Completing consultation for token:', tokenId, 'visit_id:', token.visit_id);

      // Update token status
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'completed');

      // Complete the visit using the visit_id from the token
      if (token.visit_id) {
        try {
          console.log('[QUEUE] Completing visit:', token.visit_id);
          await this.visitService.completeVisit(token.visit_id, {
            status: 'completed',
            visit_end_time: new Date().toISOString()
          });
          console.log('[QUEUE] ✅ Visit completed successfully');
        } catch (visitError) {
          console.error('[QUEUE] ❌ Failed to complete visit:', visitError.message);
          // Don't fail the entire operation if visit completion fails
        }
      } else {
        console.warn('[QUEUE] ⚠️ Token has no visit_id, skipping visit completion');
      }

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'completed' 
        });
      }

      return {
        success: true,
        token: updatedToken,
        message: 'Consultation completed'
      };
    } catch (error) {
      console.error('[QUEUE] ❌ Error completing consultation:', error.message);
      throw error;
    }
  }

  /**
   * Mark patient as missed/no-show
   */
  async markPatientMissed(tokenId) {
    try {
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'missed');

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'no_show' 
        });
      }

      return {
        success: true,
        token: updatedToken,
        message: 'Patient marked as no-show'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel queue token
   */
  async cancelToken(tokenId) {
    try {
      const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'cancelled');

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'cancelled' 
        });
      }

      return {
        success: true,
        token: updatedToken,
        message: 'Token cancelled'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delay a patient - removes them from active queue
   * Patient's token number is preserved
   */
  async delayToken(tokenId, reason = null) {
    try {
      // Get current token
      const { data: currentToken, error: fetchError } = await this.supabase
        .from('queue_tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (fetchError || !currentToken) {
        throw new Error('Token not found');
      }

      console.log(`[DELAY TOKEN] Token ID: ${tokenId}, Current Status: ${currentToken.status}`);
      
      // Can only delay if status is waiting or called
      if (!['waiting', 'called'].includes(currentToken.status)) {
        throw new Error(`Cannot delay token with status "${currentToken.status}". Only waiting or called tokens can be delayed.`);
      }

      // Update token to delayed status
      const { data: updatedToken, error: updateError } = await this.supabase
        .from('queue_tokens')
        .update({
          status: 'delayed',
          previous_status: currentToken.status,
          delay_reason: reason,
          delayed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        token: updatedToken,
        message: 'Patient marked as delayed'
      };
    } catch (error) {
      console.error('Error delaying token:', error);
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
      const { data: currentToken, error: fetchError } = await this.supabase
        .from('queue_tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (fetchError || !currentToken) {
        throw new Error('Token not found');
      }

      if (currentToken.status !== 'delayed') {
        throw new Error('Token is not delayed');
      }

      // Get the highest token number for this doctor/date
      const { data: maxTokenData, error: maxError } = await this.supabase
        .from('queue_tokens')
        .select('token_number')
        .eq('doctor_id', currentToken.doctor_id)
        .eq('issued_date', currentToken.issued_date)
        .order('token_number', { ascending: false })
        .limit(1);

      const newTokenNumber = (maxTokenData?.[0]?.token_number || 0) + 1;

      // Update token - move to end of queue with new token number
      const { data: updatedToken, error: updateError } = await this.supabase
        .from('queue_tokens')
        .update({
          status: 'waiting', // Reset to waiting status
          token_number: newTokenNumber, // Assign new token number at end of queue
          undelayed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        token: updatedToken,
        message: `Patient undelayed and moved to position #${newTokenNumber} in queue`,
        newTokenNumber
      };
    } catch (error) {
      console.error('Error undelaying token:', error);
      throw error;
    }
  }

  /**
   * Mark an appointment queue entry as delayed
   * Removes patient from active queue by setting status to 'delayed'
   */
  async delayAppointmentQueue(appointmentQueueId, reason = null) {
    try {
      // Get current appointment queue entry
      const { data: currentEntry, error: fetchError } = await this.supabase
        .from('appointment_queue')
        .select('*')
        .eq('id', appointmentQueueId)
        .single();

      if (fetchError || !currentEntry) {
        throw new Error('Appointment queue entry not found');
      }

      if (currentEntry.status === 'delayed') {
        throw new Error('Patient is already marked as delayed');
      }

      if (['completed', 'cancelled', 'skipped'].includes(currentEntry.status)) {
        throw new Error(`Cannot delay patient with status: ${currentEntry.status}`);
      }

      // Update appointment queue entry
      const { data: updatedEntry, error: updateError } = await this.supabase
        .from('appointment_queue')
        .update({
          status: 'delayed',
          delay_reason: reason,
          delayed_at: new Date().toISOString(),
          previous_queue_position: currentEntry.queue_position,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentQueueId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        appointmentQueue: updatedEntry,
        message: 'Patient marked as delayed and removed from active queue'
      };
    } catch (error) {
      console.error('Error delaying appointment queue entry:', error);
      throw error;
    }
  }

  /**
   * Undelay an appointment queue entry
   * Moves patient to the end of the queue with new position
   */
  async undelayAppointmentQueue(appointmentQueueId) {
    try {
      // Get current appointment queue entry
      const { data: currentEntry, error: fetchError } = await this.supabase
        .from('appointment_queue')
        .select(`
          *,
          appointment:appointments!appointment_id (
            appointment_date
          )
        `)
        .eq('id', appointmentQueueId)
        .single();

      if (fetchError || !currentEntry) {
        throw new Error('Appointment queue entry not found');
      }

      if (currentEntry.status !== 'delayed') {
        throw new Error('Patient is not delayed');
      }

      // Get the highest queue position for this doctor/date
      const appointmentDate = currentEntry.appointment?.appointment_date || new Date().toISOString().split('T')[0];
      
      const { data: maxPositionData, error: maxError } = await this.supabase
        .from('appointment_queue')
        .select('queue_position, appointment:appointments!appointment_id(appointment_date)')
        .eq('doctor_id', currentEntry.doctor_id)
        .neq('status', 'delayed') // Exclude delayed patients from position calculation
        .order('queue_position', { ascending: false })
        .limit(100); // Get enough to filter by date

      if (maxError) throw maxError;

      // Filter by appointment date and find max position
      const sameDate = maxPositionData.filter(entry => 
        entry.appointment?.appointment_date === appointmentDate
      );
      const newQueuePosition = (sameDate[0]?.queue_position || 0) + 1;

      // Update appointment queue - move to end of queue with new position
      const { data: updatedEntry, error: updateError } = await this.supabase
        .from('appointment_queue')
        .update({
          status: 'queued', // Reset to queued status
          queue_position: newQueuePosition, // Assign new position at end of queue
          undelayed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentQueueId)
        .select(`
          *,
          patient:patients!patient_id (
            id,
            first_name,
            last_name,
            patient_number
          )
        `)
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        appointmentQueue: updatedEntry,
        message: `Patient undelayed and moved to position #${newQueuePosition} in queue`,
        newQueuePosition
      };
    } catch (error) {
      console.error('Error undelaying appointment queue entry:', error);
      throw error;
    }
  }

  // ===============================================
  // QUEUE STATUS AND MONITORING
  // ===============================================

  /**
   * Get comprehensive queue status for a doctor
   */
  async getQueueStatus(doctorId, date = null) {
    try {
      const queueDate = date || new Date().toISOString().split('T')[0];

      console.log(`[QUEUE STATUS] Fetching for doctor ${doctorId}, date: ${queueDate}`);

      // Get token-based queue
      const tokens = await this.queueTokenModel.getByDoctorAndDate(doctorId, queueDate);
      console.log(`[QUEUE STATUS] Found ${tokens.length} tokens`);
      
      // Get appointment-based queue
      const appointments = await this.appointmentQueueModel.getByDoctorAndDate(doctorId, queueDate);
      console.log(`[QUEUE STATUS] Found ${appointments.length} appointments`);
      
      if (appointments.length > 0) {
        console.log('[QUEUE STATUS] First appointment sample:', JSON.stringify(appointments[0], null, 2));
      }
      
      // Get statistics
      const tokenStats = await this.queueTokenModel.getQueueStats(doctorId, queueDate);
      const appointmentStats = await this.appointmentQueueModel.getQueueStatistics(doctorId, queueDate);

      // Get current status
      const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);
      const nextToken = await this.queueTokenModel.getNextToken(doctorId, queueDate);

      return {
        doctor_id: doctorId,
        date: queueDate,
        tokens: tokens,
        appointments: appointments,
        statistics: {
          tokens: tokenStats,
          appointments: appointmentStats,
          combined: {
            totalPatients: tokenStats.total + appointmentStats.total,
            waitingPatients: tokenStats.waiting + appointmentStats.queued,
            completedToday: tokenStats.completed + appointmentStats.completed
          }
        },
        currentStatus: {
          activeConsultation: activeConsultation,
          nextInQueue: nextToken,
          isAvailable: !activeConsultation
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get patient's queue position and estimated wait time
   */
  async getPatientQueueInfo(patientId, doctorId) {
    try {
      const currentToken = await this.queueTokenModel.getPatientCurrentToken(patientId, doctorId);
      
      if (!currentToken) {
        return {
          hasToken: false,
          message: 'No active token found'
        };
      }

      // Calculate position in queue
      const queueTokens = await this.queueTokenModel.getCurrentQueueStatus(doctorId);
      const position = queueTokens
        .filter(token => token.status === 'waiting' && token.token_number < currentToken.token_number)
        .length + 1;

      // Estimate wait time (average 15 minutes per consultation)
      const estimatedWaitMinutes = (position - 1) * 15;

      return {
        hasToken: true,
        token: currentToken,
        queuePosition: position,
        estimatedWaitTime: estimatedWaitMinutes,
        status: currentToken.status,
        message: this.getPatientStatusMessage(currentToken.status, position, estimatedWaitMinutes)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get queue display board data (for public displays)
   */
  async getQueueDisplayBoard(doctorId) {
    try {
      const currentQueue = await this.queueTokenModel.getCurrentQueueStatus(doctorId);
      const activeConsultation = await this.queueTokenModel.getActiveConsultation(doctorId);

      const displayData = {
        doctorInfo: currentQueue.length > 0 ? currentQueue[0].doctor : null,
        currentlyServing: activeConsultation ? {
          tokenNumber: activeConsultation.token_number,
          patientName: `${activeConsultation.patient.first_name} ${activeConsultation.patient.last_name.charAt(0)}.`
        } : null,
        waitingQueue: currentQueue
          .filter(token => token.status === 'waiting')
          .slice(0, 10) // Show next 10 patients
          .map(token => ({
            tokenNumber: token.token_number,
            patientName: `${token.patient.first_name} ${token.patient.last_name.charAt(0)}.`,
            estimatedTime: token.estimated_wait_time
          })),
        calledTokens: currentQueue
          .filter(token => token.status === 'called')
          .map(token => ({
            tokenNumber: token.token_number,
            patientName: `${token.patient.first_name} ${token.patient.last_name.charAt(0)}.`
          }))
      };

      return displayData;
    } catch (error) {
      throw error;
    }
  }

  // ===============================================
  // APPOINTMENT INTEGRATION
  // ===============================================

  /**
   * Process scheduled appointments into queue
   */
  async processScheduledAppointments(doctorId, date = null) {
    try {
      const appointmentDate = date || new Date().toISOString().split('T')[0];
      
      // Get scheduled appointments for the day
      const appointments = await this.appointmentModel.getByDate(appointmentDate);
      const doctorAppointments = appointments.filter(apt => apt.doctor_id === doctorId);

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
            priority: 2 // Scheduled appointments get normal priority
          });

          processedAppointments.push({
            appointment: appointment,
            token: tokenResult.token
          });
        }
      }

      return {
        success: true,
        processed: processedAppointments.length,
        appointments: processedAppointments,
        message: `Processed ${processedAppointments.length} scheduled appointments`
      };
    } catch (error) {
      throw error;
    }
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
    try {
      const tokenHistory = await this.queueTokenModel.getQueueHistory(doctorId, startDate, endDate);
      
      const analytics = {
        totalPatients: tokenHistory.length,
        averageTokensPerDay: tokenHistory.length / this.getDaysBetweenDates(startDate, endDate),
        statusBreakdown: {
          completed: tokenHistory.filter(t => t.status === 'completed').length,
          missed: tokenHistory.filter(t => t.status === 'missed').length,
          cancelled: tokenHistory.filter(t => t.status === 'cancelled').length
        },
        averageWaitTime: this.calculateAverageWaitTime(tokenHistory),
        peakHours: this.calculatePeakHours(tokenHistory),
        patientSatisfaction: this.calculatePatientSatisfaction(tokenHistory)
      };

      return analytics;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate average wait time from history
   */
  calculateAverageWaitTime(tokenHistory) {
    const completedTokens = tokenHistory.filter(token => 
      token.status === 'completed' && token.served_at && token.issued_time
    );

    if (completedTokens.length === 0) return 0;

    const totalWaitMinutes = completedTokens.reduce((sum, token) => {
      const waitTime = new Date(token.served_at) - new Date(token.issued_time);
      return sum + (waitTime / (1000 * 60));
    }, 0);

    return Math.round(totalWaitMinutes / completedTokens.length);
  }

  /**
   * Calculate peak hours
   */
  calculatePeakHours(tokenHistory) {
    const hourCounts = {};
    
    tokenHistory.forEach(token => {
      const hour = new Date(token.issued_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  /**
   * Calculate patient satisfaction score
   */
  calculatePatientSatisfaction(tokenHistory) {
    const completedTokens = tokenHistory.filter(t => t.status === 'completed');
    const missedTokens = tokenHistory.filter(t => t.status === 'missed');
    
    if (completedTokens.length === 0) return 0;
    
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
   * Force complete any active consultation for the doctor
   */
  async forceCompleteActiveConsultation(doctorId) {
    try {
      const activeToken = await this.queueTokenModel.getActiveConsultation(doctorId);
      
      if (!activeToken) {
        return {
          success: false,
          message: 'No active consultation found'
        };
      }

      // Complete the consultation
      const updatedToken = await this.queueTokenModel.updateStatus(activeToken.id, 'completed');

      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'completed' 
        });
      }

      return {
        success: true,
        completedToken: updatedToken,
        message: `Consultation with ${activeToken.patient?.first_name} ${activeToken.patient?.last_name} has been force completed`
      };
    } catch (error) {
      throw new Error(`Failed to force complete consultation: ${error.message}`);
    }
  }
  /**
   * Force complete any active consultation for a doctor
   */
  async forceCompleteActiveConsultation(doctorId) {
    try {
      console.log('🔍 Looking for active consultation for doctor:', doctorId);
      
      // Find any token with status 'serving' for this doctor using existing method
      const activeToken = await this.queueTokenModel.getActiveConsultation(doctorId);
      
      if (!activeToken) {
        return {
          success: false,
          message: 'No active consultation found for this doctor'
        };
      }
      
      console.log('🎯 Found active consultation token:', activeToken.id, 'for patient:', activeToken.patient_id);
      
      // Force complete this consultation
      const updatedToken = await this.queueTokenModel.updateStatus(activeToken.id, 'completed');
      
      // Update appointment status if linked
      if (updatedToken.appointment_id) {
        await this.appointmentModel.update(updatedToken.appointment_id, { 
          status: 'completed' 
        });
      }
      
      console.log('✅ Force completed consultation for token:', updatedToken.id);
      
      return {
        success: true,
        token: updatedToken,
        message: `Force completed consultation for ${activeToken.patient?.first_name || 'patient'} (Token #${activeToken.token_number})`
      };
    } catch (error) {
      console.error('❌ Error force completing consultation:', error);
      throw new Error(`Failed to force complete consultation: ${error.message}`);
    }
  }

}

export default QueueService;
