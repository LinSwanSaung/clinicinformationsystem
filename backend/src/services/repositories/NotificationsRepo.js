import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Notifications Repository
 * Centralizes all direct Supabase access for notifications entity
 */

const NotificationId = z.string().uuid();

/**
 * Get user notifications
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<any[]>}
 */
export async function getUserNotifications(userId, limit = 50) {
  const uid = z.string().uuid().parse(userId);
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get unread notification count for user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnreadCount(userId) {
  const uid = z.string().uuid().parse(userId);
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Create notification
 * @param {Object} notificationData
 * @returns {Promise<any>}
 */
export async function createNotification(notificationData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Mark notification as read
 * @param {string} notificationId
 * @returns {Promise<any>}
 */
export async function markAsRead(notificationId) {
  const id = NotificationId.parse(notificationId);
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Mark all notifications as read for user
 * @param {string} userId
 * @returns {Promise<any>}
 */
export async function markAllAsRead(userId) {
  const uid = z.string().uuid().parse(userId);
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', uid)
    .eq('is_read', false)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Delete notification
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export async function deleteNotification(notificationId) {
  const id = NotificationId.parse(notificationId);
  const { error } = await supabase.from('notifications').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Get all receptionist user IDs
 * @returns {Promise<string[]>}
 */
export async function getReceptionistIds() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'receptionist')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data || []).map((r) => r.id);
}
