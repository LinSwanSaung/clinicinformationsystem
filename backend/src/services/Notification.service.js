import NotificationModel from '../models/Notification.model.js';
import {
  createNotification as repoCreateNotification,
  getReceptionistIds,
  getCashierIds,
  getDoctorId,
  getPortalUserIdByPatientId as repoGetPortalUserIdByPatientId,
  getUserDetailsForEmail,
} from './repositories/NotificationsRepo.js';
import logger from '../config/logger.js';
import EmailService from './Email.service.js';
import { renderNotificationEmail } from '../utils/emailTemplates.js';

/**
 * Notification Service
 */
class NotificationService {
  /**
   * Resolve portal user ID from a patient ID, if linked.
   */
  async getPortalUserIdByPatientId(patientId) {
    try {
      return await repoGetPortalUserIdByPatientId(patientId);
    } catch (err) {
      logger.warn('[NotificationService] Failed to resolve user by patient_id:', err.message);
      return null;
    }
  }

  /**
   * Convenience: notify a patient portal user by patientId (no-op if no account).
   */
  async notifyPatientByPatientId(
    patientId,
    { title, message, type = 'info', relatedEntityType, relatedEntityId }
  ) {
    const userId = await this.getPortalUserIdByPatientId(patientId);
    if (!userId) {
      return null;
    }
    return this.createNotification({
      userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
    });
  }
  /**
   * Create notification for user(s)
   */
  async createNotification({
    userId,
    userIds,
    title,
    message,
    type = 'info',
    relatedEntityType,
    relatedEntityId,
  }) {
    try {
      const notifications = [];
      const targetUsers = userIds || [userId];

      // Prepare batch email lookup if multiple recipients
      let emailLookup = null;
      const targetIds = (targetUsers || []).filter(Boolean);
      if (targetIds.length > 1) {
        try {
          const users = await getUserDetailsForEmail(targetIds);
          emailLookup = new Map(users.map((u) => [u.id, u]));
        } catch (e) {
          logger.warn('[NotificationService] Failed batch user email lookup:', e.message);
        }
      }

      for (const uid of targetUsers) {
        const notificationData = {
          user_id: uid,
          title,
          message,
          type,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
        };

        const notification = await repoCreateNotification(notificationData);
        notifications.push(notification);

        // Also email the user if SMTP configured
        try {
          let user = emailLookup ? emailLookup.get(uid) : null;
          if (!user) {
            const users = await getUserDetailsForEmail(uid);
            user = users[0] || null;
          }
          if (user?.email) {
            const subject = title || 'Notification';
            const textBody =
              `${message}\n\n` +
              (relatedEntityType && relatedEntityId
                ? `Ref: ${relatedEntityType} #${relatedEntityId}`
                : '');
            const { html } = renderNotificationEmail({ title: subject, message });
            await EmailService.send({ to: user.email, subject, text: textBody, html });
          }
        } catch (e) {
          logger.warn('[NotificationService] Failed to send email notification:', e.message);
        }
      }

      return notifications;
    } catch (error) {
      logger.error('[NotificationService] Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Notify all receptionists
   */
  async notifyReceptionists({ title, message, type = 'info', relatedEntityType, relatedEntityId }) {
    try {
      const receptionistIds = await getReceptionistIds();

      if (receptionistIds.length === 0) {
        return [];
      }

      return await this.createNotification({
        userIds: receptionistIds,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
      });
    } catch (error) {
      logger.error('[NotificationService] Error notifying receptionists:', error);
      throw new Error(`Failed to notify receptionists: ${error.message}`);
    }
  }

  /**
   * Notify all cashiers
   */
  async notifyCashiers({ title, message, type = 'info', relatedEntityType, relatedEntityId }) {
    try {
      const cashierIds = await getCashierIds();

      if (cashierIds.length === 0) {
        return [];
      }

      return await this.createNotification({
        userIds: cashierIds,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
      });
    } catch (error) {
      logger.error('[NotificationService] Error notifying cashiers:', error);
      throw new Error(`Failed to notify cashiers: ${error.message}`);
    }
  }

  /**
   * Notify a specific doctor
   */
  async notifyDoctor(
    doctorId,
    { title, message, type = 'info', relatedEntityType, relatedEntityId }
  ) {
    try {
      const doctorUserId = await getDoctorId(doctorId);

      if (!doctorUserId) {
        logger.warn(`[NotificationService] Doctor ${doctorId} not found or inactive`);
        return null;
      }

      return await this.createNotification({
        userId: doctorUserId,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
      });
    } catch (error) {
      logger.error('[NotificationService] Error notifying doctor:', error);
      throw new Error(`Failed to notify doctor: ${error.message}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 50) {
    try {
      return await NotificationModel.getUserNotifications(userId, limit);
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      return await NotificationModel.getUnreadCount(userId);
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Mark as read
   */
  async markAsRead(notificationId) {
    try {
      return await NotificationModel.markAsRead(notificationId);
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    try {
      return await NotificationModel.markAllAsRead(userId);
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      return await NotificationModel.deleteNotification(notificationId);
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
}

export default new NotificationService();
