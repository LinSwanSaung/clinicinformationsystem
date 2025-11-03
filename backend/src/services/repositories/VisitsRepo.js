import { z } from 'zod';
import { supabase } from '../../config/database.js';

/**
 * Visits Repository
 * Pulls all Supabase access for visits into one place.
 */

export const VisitId = z.string().min(1);

const Filters = z
  .object({
    status: z.string().optional(),
    doctor_id: z.string().nullable().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.number().int().positive().max(200).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .partial()
  .default({});

/**
 * List all visits with patient/doctor relation (for admin/reports)
 */
export async function listVisitsWithRelations(options = {}) {
  const opts = Filters.parse(options);
  let query = supabase
    .from('visits')
    .select(
      `*,
       doctor:users!doctor_id (id, first_name, last_name, specialty),
       patient:patients!patient_id (id, patient_number, first_name, last_name)`
    )
    .order('visit_date', { ascending: false })
    .range(opts.offset || 0, (opts.offset || 0) + (opts.limit || 50) - 1);

  if (opts.status) {
    query = query.eq('status', opts.status);
  }
  if (opts.doctor_id) {
    query = query.eq('doctor_id', opts.doctor_id);
  }
  if (opts.start_date) {
    query = query.gte('visit_date', opts.start_date);
  }
  if (opts.end_date) {
    query = query.lte('visit_date', opts.end_date);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data || [];
}

// (reserved) count helper if needed in future

/**
 * Get aggregated visit statistics
 */
export async function getVisitStatistics(filters = {}) {
  const { doctor_id, start_date, end_date } = Filters.parse(filters);

  const apply = (q) => {
    if (doctor_id) {
      q = q.eq('doctor_id', doctor_id);
    }
    if (start_date) {
      q = q.gte('visit_date', start_date);
    }
    if (end_date) {
      q = q.lte('visit_date', end_date);
    }
    return q;
  };

  const totalQ = apply(supabase.from('visits').select('id', { count: 'exact', head: true }));
  const completedQ = apply(
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'completed')
  );
  const inProgressQ = apply(
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
  );
  const cancelledQ = apply(
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'cancelled')
  );

  const [{ count: total }, { count: completed }, { count: in_progress }, { count: cancelled }] =
    await Promise.all([totalQ, completedQ, inProgressQ, cancelledQ]);

  // revenue from completed
  let revenueQuery = supabase
    .from('visits')
    .select('total_cost')
    .eq('status', 'completed')
    .not('total_cost', 'is', null);
  revenueQuery = apply(revenueQuery);
  const { data: revenueRows, error: revenueError } = await revenueQuery;
  if (revenueError) {
    throw revenueError;
  }
  const total_revenue = (revenueRows || []).reduce((sum, v) => sum + (v.total_cost || 0), 0);

  return {
    total_visits: total || 0,
    completed_visits: completed || 0,
    in_progress_visits: in_progress || 0,
    cancelled_visits: cancelled || 0,
    total_revenue,
    completion_rate: (total || 0) > 0 ? ((completed / total) * 100).toFixed(2) : 0,
  };
}

/**
 * Update a visit status
 */
export async function updateVisitStatus(visitId, status) {
  const vid = VisitId.parse(visitId);
  const Status = z.enum(['in_progress', 'completed', 'cancelled']);
  const s = Status.parse(status);

  const { data, error } = await supabase
    .from('visits')
    .update({ status: s, updated_at: new Date().toISOString() })
    .eq('id', vid)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}
