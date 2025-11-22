import { z } from 'zod';
import { supabase } from '../../config/database.js';

const SortByEnum = z.enum(['dispensedAt', 'medicineName', 'patientName', 'quantity']);
const SortDirEnum = z.enum(['asc', 'desc']);

export const DispenseFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  sortBy: SortByEnum.default('dispensedAt'),
  sortDir: SortDirEnum.default('desc'),
});

function normalizeDateRange(from, to) {
  const now = new Date();
  const start = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = to
    ? new Date(to)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchDispenses(filters = {}) {
  const { from, to, search, page, pageSize, sortBy, sortDir } =
    DispenseFiltersSchema.parse(filters);
  const { start, end } = normalizeDateRange(from, to);

  // 1) Pull paid invoices within range (minimal columns)
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('id, completed_at, completed_by, patient_id')
    .eq('status', 'paid')
    .gte('completed_at', start)
    .lte('completed_at', end)
    .order('completed_at', { ascending: false });
  if (invErr) {
    throw invErr;
  }
  if (!invoices || invoices.length === 0) {
    return { items: [], total: 0, summary: { totalItems: 0, totalUnits: 0, byMedicine: [] } };
  }

  const invoiceIds = invoices.map((i) => i.id);

  // 2) Pull medicine invoice_items for those invoices
  let itemsQuery = supabase
    .from('invoice_items')
    .select('id, invoice_id, item_name, quantity, unit_price, total_price, added_at, item_type')
    .in('invoice_id', invoiceIds)
    .eq('item_type', 'medicine');
  if (search && search.trim()) {
    itemsQuery = itemsQuery.ilike('item_name', `%${search.trim()}%`);
  }
  const { data: invoiceItems, error: itemsErr } = await itemsQuery;
  if (itemsErr) {
    throw itemsErr;
  }

  if (!invoiceItems || invoiceItems.length === 0) {
    return { items: [], total: 0, summary: { totalItems: 0, totalUnits: 0, byMedicine: [] } };
  }

  // 3) Build lookup maps for patients and users
  const patientIds = [...new Set(invoices.map((i) => i.patient_id).filter(Boolean))];
  const userIds = [...new Set(invoices.map((i) => i.completed_by).filter(Boolean))];

  const patientsMap = {};
  if (patientIds.length > 0) {
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_number')
      .in('id', patientIds);
    if (pErr) {
      throw pErr;
    }
    (patients || []).forEach((p) => {
      patientsMap[p.id] = p;
    });
  }

  const usersMap = {};
  if (userIds.length > 0) {
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .in('id', userIds);
    if (uErr) {
      throw uErr;
    }
    (users || []).forEach((u) => {
      usersMap[u.id] = u;
    });
  }

  const invoiceMap = {};
  invoices.forEach((inv) => {
    invoiceMap[inv.id] = inv;
  });

  // 4) Compose rows
  const composed = invoiceItems
    // Exclude explicit write-outs by name stereotype
    .filter((it) => !(it.item_name || '').toLowerCase().includes('write-out'))
    .map((it) => {
      const inv = invoiceMap[it.invoice_id];
      const patient = inv?.patient_id ? patientsMap[inv.patient_id] : null;
      const user = inv?.completed_by ? usersMap[inv.completed_by] : null;
      return {
        id: it.id,
        dispensedAt: inv?.completed_at || inv?.added_at || it.added_at,
        medicineName: it.item_name,
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unit_price) || 0,
        totalPrice: Number(it.total_price) || 0,
        patientId: patient?.id || null,
        patientName: patient
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
          : 'Unknown',
        patientNumber: patient?.patient_number || null,
        dispensedBy: user
          ? {
              userId: user.id,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              role: user.role,
            }
          : null,
        invoiceId: it.invoice_id,
      };
    });

  // 5) Sort
  const comparator = (a, b) => {
    let valA;
    let valB;
    switch (sortBy) {
      case 'medicineName':
        valA = a.medicineName?.toLowerCase() || '';
        valB = b.medicineName?.toLowerCase() || '';
        break;
      case 'patientName':
        valA = a.patientName?.toLowerCase() || '';
        valB = b.patientName?.toLowerCase() || '';
        break;
      case 'quantity':
        valA = a.quantity || 0;
        valB = b.quantity || 0;
        break;
      case 'dispensedAt':
      default:
        valA = a.dispensedAt ? new Date(a.dispensedAt).getTime() : 0;
        valB = b.dispensedAt ? new Date(b.dispensedAt).getTime() : 0;
        break;
    }
    if (valA < valB) {
      return sortDir === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortDir === 'asc' ? 1 : -1;
    }
    return 0;
  };
  composed.sort(comparator);

  // 6) Summary
  const total = composed.length;
  const totalUnits = composed.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const byMedicineMap = new Map();
  for (const r of composed) {
    const key = r.medicineName || 'Unknown';
    const agg = byMedicineMap.get(key) || { medicineName: key, units: 0 };
    agg.units += r.quantity || 0;
    byMedicineMap.set(key, agg);
  }
  const byMedicine = Array.from(byMedicineMap.values()).sort((a, b) =>
    sortDir === 'asc' ? a.units - b.units : b.units - a.units
  );

  // 7) Pagination
  const startIndex = (page - 1) * pageSize;
  const paged = composed.slice(startIndex, startIndex + pageSize);

  return {
    items: paged,
    total,
    summary: {
      totalItems: total,
      totalUnits,
      byMedicine,
    },
  };
}

export default {
  fetchDispenses,
};
