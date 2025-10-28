import NotificationModel from '../models/Notification.model.js';
import { supabase } from '../config/database.js';

/**
 * Notification Service
 */
class NotificationService {
  /**
   * Create notification for user(s)
   */
  async createNotification({ userId, userIds, title, message, type = 'info', relatedEntityType, relatedEntityId }) {
    try {
      const notifications = [];
      const targetUsers = userIds || [userId];

      for (const uid of targetUsers) {
        const notificationData = {
          user_id: uid,
          title,
          message,
          type,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId
        };

        const notification = await NotificationModel.createNotification(notificationData);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Notify all receptionists
   */
  async notifyReceptionists({ title, message, type = 'info', relatedEntityType, relatedEntityId }) {
    try {
      // Get all receptionist users
      const { data: receptionists, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'receptionist')
        .eq('is_active', true);

      if (error) throw error;

      if (!receptionists || receptionists.length === 0) {
        return [];
      }

      const receptionistIds = receptionists.map(r => r.id);
      
      return await this.createNotification({
        userIds: receptionistIds,
        title,
        message,
        type,
        relatedEntityType,
        relatedEntityId
      });
    } catch (error) {
      console.error('[NotificationService] Error notifying receptionists:', error);
      throw new Error(`Failed to notify receptionists: ${error.message}`);
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
