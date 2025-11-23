/**
 * Browser Push Notifications Utility
 * Handles browser notification permissions and displays push notifications
 */

class BrowserNotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  /**
   * Check if browser supports notifications
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Check current permission status
   */
  checkPermission() {
    if (!this.isSupported()) {
      this.permission = 'unsupported';
      return 'unsupported';
    }
    this.permission = Notification.permission;
    return this.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options (body, icon, tag, etc.)
   */
  async show(title, options = {}) {
    if (!this.isSupported()) {
      return null;
    }

    // Check permission first
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    const defaultOptions = {
      body: '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'clinic-notification',
      requireInteraction: false,
      silent: false,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);

      // Auto-close after 5 seconds (unless requireInteraction is true)
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click - focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification for queue turn
   */
  async showQueueTurn(tokenNumber, message) {
    return this.show('Your Turn in Queue', {
      body: `Token #${tokenNumber}: ${message}`,
      icon: '/favicon.ico',
      tag: `queue-${tokenNumber}`,
      requireInteraction: true, // Important notification, require user interaction
      badge: '/favicon.ico',
    });
  }

  /**
   * Show notification for appointment reminder
   */
  async showAppointmentReminder(time, message) {
    return this.show('Appointment Reminder', {
      body: message || `Your appointment is at ${time}`,
      icon: '/favicon.ico',
      tag: `appointment-${time}`,
      requireInteraction: false,
      badge: '/favicon.ico',
    });
  }

  /**
   * Show generic notification
   */
  async showNotification(title, message, type = 'info') {
    const icons = {
      info: '/favicon.ico',
      success: '/favicon.ico',
      warning: '/favicon.ico',
      error: '/favicon.ico',
    };

    return this.show(title, {
      body: message,
      icon: icons[type] || icons.info,
      tag: `notification-${Date.now()}`,
      requireInteraction: type === 'error' || type === 'warning',
    });
  }
}

// Export singleton instance
export default new BrowserNotificationService();

