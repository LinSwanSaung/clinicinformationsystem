import { z } from 'zod';
import { supabase } from '../../config/database.js';

export const VitalId = z.string().min(1);

export async function listVitalsByPatient(patientId, options = {}) {
  const pid = z.string().min(1).parse(patientId);
  const { limit = 50, offset = 0 } = options;
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', pid)
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    throw error;
  }
  return data || [];
}
