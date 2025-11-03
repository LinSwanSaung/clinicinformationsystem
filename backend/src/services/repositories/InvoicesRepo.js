import { z } from 'zod';
import { supabase } from '../../config/database.js';

export const InvoiceId = z.string().min(1);

export async function listInvoices(options = {}) {
  const { limit = 50, offset = 0 } = options;
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    throw error;
  }
  return data || [];
}

export async function getInvoiceById(id) {
  const iid = InvoiceId.parse(id);
  const { data, error } = await supabase.from('invoices').select('*').eq('id', iid).maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
