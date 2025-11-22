/**
 * Polling interval constants for React Query refetchInterval
 * All values in milliseconds
 */
export const POLLING_INTERVALS = {
  // Notifications: check every 30 seconds
  NOTIFICATIONS: 30000,

  // Queue management: refresh every 10-15 seconds
  QUEUE: 10000,
  NURSE_QUEUE: 15000,

  // Dashboard data: refresh every 60 seconds
  DASHBOARD: 60000,
};
