import cron from 'node-cron';
import AppointmentModel from '../models/Appointment.model.js';
import NotificationService from '../services/Notification.service.js';
import clinicSettingsService from '../services/ClinicSettings.service.js';
import logger from '../config/logger.js';

/**
 * Sends reminders to patients:
 * - On appointment date (morning reminder): "Your appointment is today at [time]"
 * - 1 hour before appointment time: "Your appointment is in 1 hour. Please arrive early."
 *
 * Implementation notes:
 * - Runs every 5 minutes
 * - Tracks sent notifications to avoid duplicates
 * - Uses appointment date and time to determine when to send
 */
export function startAppointmentReminders() {
  // Track notifications sent to avoid duplicates
  const sentNotifications = new Map(); // key: `${appointmentId}-${reminderType}`, value: timestamp

  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const model = new AppointmentModel();
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const currentHour = now.getHours();

      // Get appointments for today
      const appointments = await model.getWithFilters({
        date: today,
        status: 'scheduled,confirmed,pending,waiting',
      });

      // Get late threshold from clinic settings for arrival time recommendation
      const lateThreshold = await clinicSettingsService.getLateThreshold();

      for (const appt of appointments) {
        if (!appt.appointment_time || !appt.appointment_date) {
          continue;
        }

        const [h, m] = appt.appointment_time.split(':').map((n) => parseInt(n, 10));
        const apptDate = new Date(today);
        apptDate.setHours(h, m, 0, 0);
        const diffMinutes = Math.round((apptDate - now) / (1000 * 60));

        // 1. Morning reminder on appointment date (send between 8 AM - 10 AM if appointment is later in the day)
        if (currentHour >= 8 && currentHour < 10 && diffMinutes > 60) {
          const morningReminderKey = `${appt.id}-morning`;
          const lastSent = sentNotifications.get(morningReminderKey);
          const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;

          // Only send if we haven't sent in the last 5 minutes
          if (!lastSent || lastSent < fiveMinutesAgo) {
            try {
              const doctorName = appt.doctor
                ? `Dr. ${appt.doctor.first_name} ${appt.doctor.last_name}`
                : 'your doctor';
              await NotificationService.notifyPatientByPatientId(appt.patient_id, {
                title: 'Appointment Today',
                message: `Reminder: Your appointment with ${doctorName} is today at ${appt.appointment_time}. Please arrive ${lateThreshold} minutes early.`,
                type: 'info',
                relatedEntityType: 'appointment',
                relatedEntityId: appt.id,
              });
              sentNotifications.set(morningReminderKey, now.getTime());
              logger.info(`[REMINDERS] Sent morning reminder for appointment ${appt.id}`);
            } catch (nerr) {
              logger.warn(
                `[REMINDERS] Failed to send morning reminder for appointment ${appt.id}:`,
                nerr.message
              );
            }
          }
        }

        // 2. 1 hour before appointment reminder (send between 55-60 minutes before)
        if (diffMinutes <= 60 && diffMinutes >= 55) {
          const oneHourReminderKey = `${appt.id}-1hour`;
          const lastSent = sentNotifications.get(oneHourReminderKey);
          const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;

          // Only send if we haven't sent in the last 5 minutes
          if (!lastSent || lastSent < fiveMinutesAgo) {
            try {
              const doctorName = appt.doctor
                ? `Dr. ${appt.doctor.first_name} ${appt.doctor.last_name}`
                : 'your doctor';
              await NotificationService.notifyPatientByPatientId(appt.patient_id, {
                title: 'Appointment in 1 Hour',
                message: `Reminder: Your appointment with ${doctorName} is in 1 hour (at ${appt.appointment_time}). Please arrive ${lateThreshold} minutes early.`,
                type: 'warning',
                relatedEntityType: 'appointment',
                relatedEntityId: appt.id,
              });
              sentNotifications.set(oneHourReminderKey, now.getTime());
              logger.info(`[REMINDERS] Sent 1-hour reminder for appointment ${appt.id}`);
            } catch (nerr) {
              logger.warn(
                `[REMINDERS] Failed to send 1-hour reminder for appointment ${appt.id}:`,
                nerr.message
              );
            }
          }
        }

        // Clean up old entries from sentNotifications map (older than 24 hours)
        const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
        for (const [key, timestamp] of sentNotifications.entries()) {
          if (timestamp < oneDayAgo) {
            sentNotifications.delete(key);
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
