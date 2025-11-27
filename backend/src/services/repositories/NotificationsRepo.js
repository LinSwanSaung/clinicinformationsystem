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

/**
 * Get all cashier user IDs
 * @returns {Promise<string[]>}
 */
export async function getCashierIds() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'cashier')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data || []).map((c) => c.id);
}

/**
 * Get all nurse user IDs
 * @returns {Promise<string[]>}
 */
export async function getNurseIds() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'nurse')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data || []).map((n) => n.id);
}

/**
 * Get all admin user IDs
 * @returns {Promise<string[]>}
 */
export async function getAdminIds() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data || []).map((a) => a.id);
}

/**
 * Get doctor user ID by doctor ID (for queue tokens)
 * @param {string} doctorId - The doctor's user ID
 * @returns {Promise<string|null>}
 */
export async function getDoctorId(doctorId) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', doctorId)
    .eq('role', 'doctor')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

/**
 * Get portal user ID by patient ID (for patient notifications)
 * @param {string} patientId - The patient's ID
 * @returns {Promise<string|null>}
 */
export async function getPortalUserIdByPatientId(patientId) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

/**
 * Get user details by user ID(s) for email notifications
 * @param {string|string[]} userIds - Single user ID or array of user IDs
 * @returns {Promise<Array>}
 */
export async function getUserDetailsForEmail(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return data || [];
}
