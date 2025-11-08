import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Billing Repository
 * Centralizes Supabase access for payments/invoices related reads.
 */

export const PaymentId = z.string().min(1);

/**
 * Fetch payment with invoice and patient relations (comprehensive)
 */
export async function getPaymentWithRelations(paymentId) {
  const id = PaymentId.parse(paymentId);
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(
      `*,
       invoice:invoices(
         id, 
         invoice_number, 
         total_amount,
         amount_paid,
         balance_due,
         discount_amount,
         status,
         created_at,
         completed_at,
         patient:patients(
           id, 
           first_name, 
           last_name, 
           patient_number,
           phone,
           email,
           date_of_birth
         ),
         visit:visits(
           id,
           visit_type,
           visit_date,
           doctor:users!visits_doctor_id_fkey(
             id,
             first_name,
             last_name
           )
         ),
         invoice_items(
           id,
           item_type,
           item_name,
           item_description,
           quantity,
           unit_price,
           total_price,
           notes
         ),
         created_by_user:users!invoices_created_by_fkey(
           id, 
           first_name, 
           last_name, 
           role
         ),
         completed_by_user:users!invoices_completed_by_fkey(
           id, 
           first_name, 
           last_name, 
           role
         )
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

/**
 * Get patient's total remaining credit (sum of negative balance_due from all invoices)
 */
export async function getPatientRemainingCredit(patientId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, balance_due')
    .eq('patient_id', patientId)
    .lt('balance_due', 0); // Only invoices with negative balance (credit)

  if (error) {
    throw error;
  }

  // Sum all negative balances (credits)
  const totalCredit = (data || []).reduce((sum, inv) => {
    const credit = parseFloat(inv.balance_due || 0);
    return sum + Math.abs(credit); // balance_due is negative, so we take absolute value
  }, 0);

  return totalCredit;
}
