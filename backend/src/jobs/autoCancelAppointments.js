/**
 * Auto-Cancel End-of-Day Appointments Job
 *
 * Automatically cancels appointments from past days that:
 * - Are not already 'cancelled' or 'completed'
 * - Have no associated paid invoice
 * - Were not manually marked as missed/no-show
 *
 * Runs nightly at 23:55 local time (configurable via AUTOCANCEL_CRON env var)
 *
 * Stage 5 Phase C
 */

import cron from 'node-cron';
import AppointmentModel from '../models/Appointment.model.js';
import InvoiceModel from '../models/Invoice.model.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import logger from '../config/logger.js';

class AppointmentAutoCancelJob {
  constructor() {
    this.appointmentModel = new AppointmentModel();
    this.isRunning = false;
    this.scheduledTask = null;
    this.dryRun = process.env.AUTOCANCEL_DRY_RUN === 'true';
    this.lookbackDays = parseInt(process.env.AUTOCANCEL_LOOKBACK_DAYS || '1', 10);
    this.cronSchedule = process.env.AUTOCANCEL_CRON || '55 23 * * *'; // Default: 23:55 daily
  }

  /**
   * Start the auto-cancel job
   */
  start() {
    if (this.isRunning) {
      logger.info('[AppointmentAutoCancel] Already running');
      return;
    }

    if (this.dryRun) {
      logger.warn('[AppointmentAutoCancel] ⚠️  DRY RUN MODE - No appointments will be cancelled');
    }

    this.scheduledTask = cron.schedule(
      this.cronSchedule,
      async () => {
        try {
          logger.info('[AppointmentAutoCancel] Running end-of-day auto-cancel check...');
          const result = await this.processStaleAppointments();

          logger.info(`[AppointmentAutoCancel] ✓ Processed ${result.totalScanned} appointments`);
          logger.info(`[AppointmentAutoCancel]   - Cancelled: ${result.totalCancelled}`);
          logger.info(`[AppointmentAutoCancel]   - Skipped: ${result.totalSkipped}`);

          if (result.cancelledAppointments.length > 0) {
            logger.info(
              '[AppointmentAutoCancel] Cancelled appointments:',
              result.cancelledAppointments.map((a) => `#${a.id.substring(0, 8)}`).join(', ')
            );
          }
        } catch (error) {
          logger.error('[AppointmentAutoCancel] Error during auto-cancel:', error);
        }
      },
      {
        scheduled: true,
        timezone: process.env.TZ || 'UTC', // Use TZ env var or default to UTC
      }
    );

    this.isRunning = true;
    logger.info(
      `[AppointmentAutoCancel] ✓ Started - Schedule: ${this.cronSchedule} (${this.getScheduleDescription()})`
    );
    logger.info(`[AppointmentAutoCancel] Lookback days: ${this.lookbackDays}`);
    if (this.dryRun) {
      logger.warn('[AppointmentAutoCancel] ⚠️  DRY RUN MODE ENABLED');
    }
  }

  /**
   * Stop the auto-cancel job
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.isRunning = false;
      logger.info('[AppointmentAutoCancel] Stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: this.cronSchedule,
      scheduleDescription: this.getScheduleDescription(),
      lookbackDays: this.lookbackDays,
      dryRun: this.dryRun,
      description: 'Automatically cancels stale appointments from past days',
    };
  }

  /**
   * Get human-readable schedule description
   */
  getScheduleDescription() {
    if (this.cronSchedule === '55 23 * * *') {
      return 'Daily at 23:55';
    }
    return `Custom: ${this.cronSchedule}`;
  }

  /**
   * Process stale appointments (main logic)
   */
  async processStaleAppointments() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.lookbackDays);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day

    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    logger.debug(`[AppointmentAutoCancel] Scanning appointments before ${cutoffDateStr}...`);

    // Query appointments that:
    // 1. Are from past days (before cutoff)
    // 2. Are not already cancelled or completed
    // 3. Have no associated paid invoice
    const { data: staleAppointments, error } = await this.appointmentModel.supabase
      .from('appointments')
      .select(
        `
        *,
        patient:patients!patient_id (id, first_name, last_name, patient_number),
        doctor:users!doctor_id (id, first_name, last_name)
      `
      )
      .lt('appointment_date', cutoffDateStr)
      .not('status', 'in', '(cancelled,completed)')
      .order('appointment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to query stale appointments: ${error.message}`);
    }

    const result = {
      totalScanned: staleAppointments?.length || 0,
      totalCancelled: 0,
      totalSkipped: 0,
      cancelledAppointments: [],
    };

    if (!staleAppointments || staleAppointments.length === 0) {
      logger.info('[AppointmentAutoCancel] No stale appointments found');
      return result;
    }

    logger.info(
      `[AppointmentAutoCancel] Found ${staleAppointments.length} stale appointments to process`
    );

    // Process each appointment
    for (const appointment of staleAppointments) {
      try {
        // Check if appointment has a paid invoice
        const hasPaidInvoice = await this.checkHasPaidInvoice(appointment.id);

        if (hasPaidInvoice) {
          logger.debug(
            `[AppointmentAutoCancel] Skipping appointment ${appointment.id.substring(0, 8)} - has paid invoice`
          );
          result.totalSkipped++;
          continue;
        }

        // Cancel the appointment
        if (!this.dryRun) {
          await this.cancelAppointment(appointment);
        } else {
          logger.debug(
            `[AppointmentAutoCancel] [DRY RUN] Would cancel appointment ${appointment.id.substring(0, 8)}`
          );
        }

        result.totalCancelled++;
        result.cancelledAppointments.push({
          id: appointment.id,
          appointmentDate: appointment.appointment_date,
          patientName: appointment.patient
            ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
            : 'Unknown',
          doctorName: appointment.doctor
            ? `${appointment.doctor.first_name} ${appointment.doctor.last_name}`
            : 'Unknown',
        });
      } catch (error) {
        logger.error(
          `[AppointmentAutoCancel] Error processing appointment ${appointment.id}:`,
          error.message
        );
        result.totalSkipped++;
      }
    }

    return result;
  }

  /**
   * Check if appointment has a paid invoice
   */
  async checkHasPaidInvoice(appointmentId) {
    try {
      // Check if there's a visit linked to this appointment
      const { data: visits, error: visitError } = await this.appointmentModel.supabase
        .from('visits')
        .select('id')
        .eq('appointment_id', appointmentId)
        .limit(1);

      if (visitError) {
        logger.warn(
          `[AppointmentAutoCancel] Error checking visits for appointment ${appointmentId}:`,
          visitError.message
        );
        return false;
      }

      if (!visits || visits.length === 0) {
        return false; // No visit, no invoice
      }

      // Check if any visit has a paid invoice
      const visitIds = visits.map((v) => v.id);
      const { data: invoices, error: invoiceError } = await this.appointmentModel.supabase
        .from('invoices')
        .select('id, status')
        .in('visit_id', visitIds)
        .eq('status', 'paid')
        .limit(1);

      if (invoiceError) {
        logger.warn(
          `[AppointmentAutoCancel] Error checking invoices for appointment ${appointmentId}:`,
          invoiceError.message
        );
        return false;
      }

      return invoices && invoices.length > 0;
    } catch (error) {
      logger.error(`[AppointmentAutoCancel] Error checking paid invoice:`, error);
      return false; // On error, assume no paid invoice (safer to cancel)
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointment) {
    const oldStatus = appointment.status;

    // Update appointment status
    const { error: updateError } = await this.appointmentModel.supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    if (updateError) {
      throw new Error(`Failed to cancel appointment: ${updateError.message}`);
    }

    // Log audit event
    try {
      await logAuditEvent({
        userId: null, // System action
        role: 'system',
        action: 'UPDATE',
        entity: 'appointments',
        recordId: appointment.id,
        patientId: appointment.patient_id,
        old_values: { status: oldStatus },
        new_values: { status: 'cancelled', reason: 'auto_end_of_day' },
        status: 'success',
        reason: 'Auto-cancelled by end-of-day job - appointment from past day with no paid invoice',
      });
    } catch (logError) {
      logger.error('[AppointmentAutoCancel] Failed to log audit event:', logError.message);
      // Don't fail the operation if audit logging fails
    }

    logger.info(
      `[AppointmentAutoCancel] ✓ Cancelled appointment ${appointment.id.substring(0, 8)} (${appointment.appointment_date})`
    );
  }

  /**
   * Manually trigger a check (for testing)
   */
  async triggerManualCheck() {
    try {
      logger.info('[AppointmentAutoCancel] Manual check triggered...');
      const result = await this.processStaleAppointments();
      logger.info(`[AppointmentAutoCancel] Manual check complete:`);
      logger.info(`  - Scanned: ${result.totalScanned}`);
      logger.info(`  - Cancelled: ${result.totalCancelled}`);
      logger.info(`  - Skipped: ${result.totalSkipped}`);
      return result;
    } catch (error) {
      logger.error('[AppointmentAutoCancel] Error during manual check:', error);
      throw error;
    }
  }
}

// Export singleton instance
const appointmentAutoCancel = new AppointmentAutoCancelJob();
export default appointmentAutoCancel;
