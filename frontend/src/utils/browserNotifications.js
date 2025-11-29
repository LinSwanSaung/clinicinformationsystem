/**
 * Browser Push Notifications Utility
 */

class BrowserNotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  isSupported() {
    return 'Notification' in window;
  }

  checkPermission() {
    if (!this.isSupported()) {
      this.permission = 'unsupported';
      return 'unsupported';
    }
    this.permission = Notification.permission;
    return this.permission;
  }

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

  async show(title, options = {}) {
    if (!this.isSupported()) {
      return null;
    }

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

      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

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

  async showQueueTurn(tokenNumber, message) {
    return this.show('Your Turn in Queue', {
      body: `Token #${tokenNumber}: ${message}`,
      icon: '/favicon.ico',
      tag: `queue-${tokenNumber}`,
      requireInteraction: true,
      badge: '/favicon.ico',
    });
  }

  async showAppointmentReminder(time, message) {
    return this.show('Appointment Reminder', {
      body: message || `Your appointment is at ${time}`,
      icon: '/favicon.ico',
      tag: `appointment-${time}`,
      requireInteraction: false,
      badge: '/favicon.ico',
    });
  }

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

export default new BrowserNotificationService();
