/**
 * Polling interval constants for React Query refetchInterval
 * All values in milliseconds
 *
 * IMPORTANT: These intervals affect database load. Keep them reasonable:
 * - Too frequent (10-15s) = excessive API calls and database load
 * - Too slow (5+ min) = stale data
 * - Recommended: 30-60 seconds for active queues, 60+ seconds for dashboards
 *
 * OPTIMIZATION: Increased intervals slightly to reduce database load while maintaining real-time feel
 */
export const POLLING_INTERVALS = {
  // Notifications: check every 30 seconds (reasonable for real-time alerts)
  NOTIFICATIONS: 30000,

  // Queue management: refresh every 30 seconds (optimized for real-time monitoring)
  QUEUE: 30000,
  NURSE_QUEUE: 30000,

  // Dashboard data: refresh every 90 seconds (increased from 60s - less critical, can be slower)
  DASHBOARD: 90000,
};
