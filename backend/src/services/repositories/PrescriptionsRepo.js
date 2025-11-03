import { z } from 'zod';
import { supabase } from '../../config/database.js';

export const PrescriptionId = z.string().min(1);

export async function listPrescriptionsByVisit(visitId, options = {}) {
  const vid = z.string().min(1).parse(visitId);
  const { limit = 100, offset = 0 } = options;
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('visit_id', vid)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    throw error;
  }
  return data || [];
}
