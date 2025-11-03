import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Billing Repository
 * Centralizes Supabase access for payments/invoices related reads.
 */

export const PaymentId = z.string().min(1);

/**
 * Fetch payment with invoice and patient relations
 */
export async function getPaymentWithRelations(paymentId) {
  const id = PaymentId.parse(paymentId);
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(
      `*,
       invoice:invoices(
         id, invoice_number, total_amount,
         patient:patients(id, first_name, last_name, patient_number)
       )`
    )
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Fetch a set of users by ids (for cashier info)
 */
export async function getUsersByIds(ids = []) {
  const arr = z.array(z.string()).parse(ids);
  if (arr.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, role')
    .in('id', arr);
  if (error) {
    throw error;
  }
  return data || [];
}
