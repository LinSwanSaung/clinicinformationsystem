import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import notificationService from '@/services/notificationService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const previousCountRef = useRef(0);

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    previousCountRef.current = 0;

    return () => {
      previousCountRef.current = 0;
    };
  }, []);

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthed(),
    refetchInterval: POLLING_INTERVALS.NOTIFICATIONS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  useEffect(() => {
    const c = unreadQuery.data?.data?.count ?? unreadQuery.data?.count;

    if (typeof c === 'number') {
      const previousCount = previousCountRef.current;

      if (c !== unreadCount) {
        setUnreadCount(c);
      }

      if (c > previousCount && previousCount > 0) {
        const newCount = c - previousCount;
        browserNotifications.showNotification(
          `${newCount} New Notification${newCount > 1 ? 's' : ''}`,
          `You have ${newCount} new notification${newCount > 1 ? 's' : ''}`,
          'info'
        );
      }

      previousCountRef.current = c;
    } else if (unreadQuery.data && !unreadQuery.isError) {
      if (unreadCount !== 0) {
        setUnreadCount(0);
      }
      previousCountRef.current = 0;
    }
  }, [unreadQuery.data, unreadQuery.isError]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(10);
      const newNotifications = response?.data || (Array.isArray(response) ? response : []);

      setNotifications((prevNotifications) => {
        if (prevNotifications.length > 0) {
          const previousIds = new Set(prevNotifications.map((n) => n.id));
          const newOnes = newNotifications.filter((n) => !previousIds.has(n.id));

          newOnes.forEach((notification) => {
            if (
              notification.type === 'warning' ||
              notification.related_entity_type === 'queue_token'
            ) {
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
              browserNotifications.showAppointmentReminder('', notification.message);
            }
          });
        }

        return newNotifications;
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });

      if (isOpen) {
        await fetchNotifications();
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      if (isOpen) {
        await fetchNotifications();
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });

      if (isOpen) {
        await fetchNotifications();
      }
    } catch (error) {
      logger.error('Error marking all as read:', error);
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      if (isOpen) {
        await fetchNotifications();
      }
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

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
                className="bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors"
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
                              className="bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors"
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
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
