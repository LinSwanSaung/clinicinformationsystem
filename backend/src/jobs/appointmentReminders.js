import cron from 'node-cron';
import AppointmentModel from '../models/Appointment.model.js';
import NotificationService from '../services/Notification.service.js';
import clinicSettingsService from '../services/ClinicSettings.service.js';
import logger from '../config/logger.js';

/**
 * Sends reminders to patients:
 * - 1 hour before appointment time on the day of the appointment
 *   Message: "Reminder: Your appointment is in 1 hour. Please arrive 15 minutes early."
 *
 * Implementation notes:
 * - Runs every 5 minutes
 * - Avoids duplicates by checking recent notifications for the same appointment is handled by client dedupe; here we lean on idempotency via interval granularity
 */
export function startAppointmentReminders() {
  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const model = new AppointmentModel();
      const today = new Date().toISOString().slice(0, 10);
      const appointments = await model.getWithFilters({
        date: today,
        status: 'scheduled,confirmed,pending,waiting',
      });

      const now = new Date();
      // Get late threshold from clinic settings for arrival time recommendation
      const lateThreshold = await clinicSettingsService.getLateThreshold();
      for (const appt of appointments) {
        if (!appt.appointment_time) {
          continue;
        }
        const [h, m] = appt.appointment_time.split(':').map((n) => parseInt(n, 10));
        const apptDate = new Date(today);
        apptDate.setHours(h, m, 0, 0);
        const diffMinutes = Math.round((apptDate - now) / (1000 * 60));
        if (diffMinutes <= 60 && diffMinutes >= 55) {
          try {
            await NotificationService.notifyPatientByPatientId(appt.patient_id, {
              title: 'Appointment Reminder',
              message: `Reminder: Your appointment is in 1 hour (at ${appt.appointment_time}). Please arrive ${lateThreshold} minutes early.`,
              type: 'info',
              relatedEntityType: 'appointment',
              relatedEntityId: appt.id,
            });
          } catch (nerr) {
            logger.warn('[REMINDERS] Failed to send reminder:', nerr.message);
          }
        }
      }
    } catch (err) {
      logger.error('[REMINDERS] Error running appointment reminders:', err);
    }
  });
  task.start();
  logger.info('⏰ Appointment reminder job scheduled (every 5 minutes)');
  return task;
}


