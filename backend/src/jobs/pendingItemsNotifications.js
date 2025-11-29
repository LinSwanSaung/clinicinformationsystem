import cron from 'node-cron';
import VisitService from '../services/Visit.service.js';
import NotificationService from '../services/Notification.service.js';
import logger from '../config/logger.js';

/**
 * Notifies admins about pending items that need their attention
 * - Runs every 15 minutes
 * - Checks for new pending items
 * - Notifies admins if there are pending items (throttled to once per hour to avoid spam)
 */
export function startPendingItemsNotifications() {
  let lastNotificationTime = 0;
  const NOTIFICATION_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

  const task = cron.schedule('*/15 * * * *', async () => {
    try {
      const visitService = new VisitService();
      const visitPendingResult = await visitService.getPendingItems();
      const pendingItems = visitPendingResult.data || [];

      // Get pending appointments and other items (same logic as admin route)
      const supabase = visitService.visitModel.supabase;

      // Get pending appointments (scheduled but not completed/cancelled, older than 1 hour past scheduled time)
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          status,
          updated_at,
          appointment_date,
          appointment_time,
          resolved_by_admin,
          resolved_reason,
          patients!inner (
            first_name,
            last_name,
            patient_number
          ),
          users (
            first_name,
            last_name
          )
        `
        )
        .eq('status', 'scheduled')
        .eq('resolved_by_admin', false)
        .order('appointment_date', { ascending: true });

      if (!appointmentsError && appointmentsData) {
        const now = new Date();
        const pastAppointments = appointmentsData.filter((appointment) => {
          const appointmentDateTime = new Date(
            `${appointment.appointment_date}T${appointment.appointment_time}`
          );
          return appointmentDateTime < new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        });

        pendingItems.push(
          ...pastAppointments.map((appointment) => ({
            entityType: 'appointment',
            entityId: appointment.id,
            currentStatus: appointment.status,
            lastUpdated: appointment.updated_at,
            patientName: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
            patientNumber: appointment.patients.patient_number,
            doctorName: appointment.users
              ? `${appointment.users.first_name} ${appointment.users.last_name}`
              : null,
            resolvedByAdmin: appointment.resolved_by_admin,
            resolvedReason: appointment.resolved_reason,
          }))
        );
      }

      // Get pending queue tokens (active tokens older than 4 hours)
      const { data: queueData, error: queueError } = await supabase
        .from('queue_tokens')
        .select(
          `
          id,
          status,
          updated_at,
          resolved_by_admin,
          resolved_reason,
          patients!inner (
            first_name,
            last_name,
            patient_number
          ),
          users (
            first_name,
            last_name
          )
        `
        )
        .in('status', ['waiting', 'called', 'serving', 'delayed'])
        .eq('resolved_by_admin', false)
        .lt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!queueError && queueData) {
        pendingItems.push(
          ...queueData.map((token) => ({
            entityType: 'queue',
            entityId: token.id,
            currentStatus: token.status,
            lastUpdated: token.updated_at,
            patientName: `${token.patients.first_name} ${token.patients.last_name}`,
            patientNumber: token.patients.patient_number,
            doctorName: token.users ? `${token.users.first_name} ${token.users.last_name}` : null,
            resolvedByAdmin: token.resolved_by_admin,
            resolvedReason: token.resolved_reason,
          }))
        );
      }

      // Get pending invoices (unpaid invoices older than 7 days)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(
          `
          id,
          status,
          updated_at,
          resolved_by_admin,
          resolved_reason,
          patients!inner (
            first_name,
            last_name,
            patient_number
          )
        `
        )
        .eq('status', 'pending')
        .eq('resolved_by_admin', false)
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!invoicesError && invoicesData) {
        pendingItems.push(
          ...invoicesData.map((invoice) => ({
            entityType: 'billing',
            entityId: invoice.id,
            currentStatus: invoice.status,
            lastUpdated: invoice.updated_at,
            patientName: `${invoice.patients.first_name} ${invoice.patients.last_name}`,
            patientNumber: invoice.patients.patient_number,
            doctorName: null,
            resolvedByAdmin: invoice.resolved_by_admin,
            resolvedReason: invoice.resolved_reason,
          }))
        );
      }

      // Remove duplicates
      const uniquePendingItems = [];
      const seenIds = new Set();
      for (const item of pendingItems) {
        const key = `${item.entityType}-${item.entityId}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          uniquePendingItems.push(item);
        }
      }

      // Check notification throttle to avoid spam
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      const shouldNotify = timeSinceLastNotification >= NOTIFICATION_THROTTLE_MS;

      if (uniquePendingItems.length > 0 && shouldNotify) {
        // Count items by type for better notification message
        const visitItems = uniquePendingItems.filter((item) => item.entityType === 'visit').length;
        const appointmentItems = uniquePendingItems.filter(
          (item) => item.entityType === 'appointment'
        ).length;
        const queueItems = uniquePendingItems.filter((item) => item.entityType === 'queue').length;
        const billingItems = uniquePendingItems.filter(
          (item) => item.entityType === 'billing'
        ).length;

        const itemTypes = [];
        if (visitItems > 0) {
          itemTypes.push(`${visitItems} visit${visitItems > 1 ? 's' : ''}`);
        }
        if (appointmentItems > 0) {
          itemTypes.push(`${appointmentItems} appointment${appointmentItems > 1 ? 's' : ''}`);
        }
        if (queueItems > 0) {
          itemTypes.push(`${queueItems} queue token${queueItems > 1 ? 's' : ''}`);
        }
        if (billingItems > 0) {
          itemTypes.push(`${billingItems} invoice${billingItems > 1 ? 's' : ''}`);
        }

        const itemSummary = itemTypes.join(', ');

        await NotificationService.notifyAdmins({
          title: 'Pending Items Require Attention',
          message: `There ${uniquePendingItems.length === 1 ? 'is' : 'are'} ${uniquePendingItems.length} pending item${uniquePendingItems.length > 1 ? 's' : ''} requiring admin attention: ${itemSummary}. Please review and resolve them.`,
          type: 'warning',
          relatedEntityType: 'pending_items',
          relatedEntityId: null,
        });

        lastNotificationTime = now;
        logger.info(
          `[PENDING ITEMS NOTIFICATIONS] Notified admins about ${uniquePendingItems.length} pending item(s)`
        );
      } else if (uniquePendingItems.length > 0 && !shouldNotify) {
        logger.debug(
          `[PENDING ITEMS NOTIFICATIONS] ${uniquePendingItems.length} pending item(s) found, but notification throttled (last notification ${Math.round(timeSinceLastNotification / 1000 / 60)} minutes ago)`
        );
      }
    } catch (error) {
      logger.error('[PENDING ITEMS NOTIFICATIONS] Error checking pending items:', error);
    }
  });

  logger.info('[PENDING ITEMS NOTIFICATIONS] Cron job started - checking every 15 minutes');
  return task;
}
