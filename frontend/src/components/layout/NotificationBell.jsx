import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import notificationService from '@/services/notificationService';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticated as isAuthed } from '@/features/auth';
import { POLLING_INTERVALS } from '@/constants/polling';
import { EmptyState } from '@/components/library';
import logger from '@/utils/logger';
import browserNotifications from '@/utils/browserNotifications';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // React Query: unread count polling with auth guard
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthed(),
    refetchInterval: POLLING_INTERVALS.NOTIFICATIONS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Backend returns: { success: true, data: { count: number } }
    // apiService.get() returns the full response, so we need to access data.data.count
    const c = unreadQuery.data?.data?.count ?? unreadQuery.data?.count;
    const previousCount = unreadCount;

    if (typeof c === 'number') {
      setUnreadCount(c);

      // Show browser notification when new notifications arrive
      if (c > previousCount && previousCount > 0) {
        const newCount = c - previousCount;
        browserNotifications.showNotification(
          `${newCount} New Notification${newCount > 1 ? 's' : ''}`,
          `You have ${newCount} new notification${newCount > 1 ? 's' : ''}`,
          'info'
        );
      }
    } else if (unreadQuery.data && !unreadQuery.isError) {
      // If we got a response but no count, reset to 0
      setUnreadCount(0);
    }
  }, [unreadQuery.data, unreadQuery.isError]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(10);
      // Backend returns: { success: true, data: [...] }
      // notificationService.getNotifications() returns response.data which is { success: true, data: [...] }
      const newNotifications = response?.data || (Array.isArray(response) ? response : []);

      // Check for new notifications and show browser alerts
      setNotifications((prevNotifications) => {
        if (prevNotifications.length > 0) {
          const previousIds = new Set(prevNotifications.map((n) => n.id));
          const newOnes = newNotifications.filter((n) => !previousIds.has(n.id));

          newOnes.forEach((notification) => {
            // Show browser notification for important types
            if (
              notification.type === 'warning' ||
              notification.related_entity_type === 'queue_token'
            ) {
              // Queue turn notification
              if (
                notification.title.includes('Turn') ||
                notification.title.includes('called') ||
                notification.title.includes('You are')
              ) {
                const tokenMatch = notification.message.match(/Token #(\d+)/);
                const tokenNumber = tokenMatch ? tokenMatch[1] : '';
                browserNotifications.showQueueTurn(tokenNumber, notification.message);
              } else {
                browserNotifications.showNotification(
                  notification.title,
                  notification.message,
                  notification.type
                );
              }
            } else if (notification.related_entity_type === 'appointment') {
              // Appointment reminder
              browserNotifications.showAppointmentReminder('', notification.message);
            }
          });
        }

        return newNotifications;
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      setNotifications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );

      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));

      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking all as read:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Remove manual polling; handled by React Query above

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    }
    return date.toLocaleDateString();
  };

  // Get notification icon color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative rounded-lg bg-transparent p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-border bg-popover shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-lg font-semibold text-popover-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="hover:text-primary/80 text-sm font-medium text-primary"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No notifications"
                  description="You're all caught up. New alerts will appear here."
                  className="p-6"
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-accent ${
                      !notification.is_read ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                        <Bell className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-popover-foreground">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="hover:text-primary/80 flex-shrink-0 text-xs text-primary"
                            >
                              Mark read
                            </button>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border p-3 text-center">
              <button className="hover:text-primary/80 text-sm font-medium text-primary">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
