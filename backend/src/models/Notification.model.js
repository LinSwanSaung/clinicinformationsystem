import { BaseModel } from './BaseModel.js';

/**
 * Notification Model
 */
class NotificationModel extends BaseModel {
  constructor() {
    super('notifications');
  }

  /**
   * Create a notification
   */
  async createNotification(notificationData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, limit = 50) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }
    return count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw error;
    }
    return true;
  }
}

export default new NotificationModel();
