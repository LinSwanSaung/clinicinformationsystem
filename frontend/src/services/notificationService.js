import apiService from './api.js';
import logger from '@/utils/logger';

const notificationService = {
  /**
   * Get user notifications
   */
  async getNotifications(limit = 50) {
    try {
      const response = await apiService.get('/notifications', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await apiService.get('/notifications/unread-count');
      // Backend returns: { success: true, data: { count: number } }
      // Return the nested data object with count for easier access
      return response.data?.data || response.data || { count: 0 };
    } catch (error) {
      logger.error('Error fetching unread count:', error);
      // Return default structure on error
      return { count: 0 };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await apiService.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      logger.error('Error marking all as read:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error.response?.data || error;
    }
  }
};

export default notificationService;
