import apiService from './api.js';

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
      console.error('Error fetching notifications:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await apiService.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error.response?.data || error;
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
      console.error('Error marking notification as read:', error);
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
      console.error('Error marking all as read:', error);
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
      console.error('Error deleting notification:', error);
      throw error.response?.data || error;
    }
  }
};

export default notificationService;
