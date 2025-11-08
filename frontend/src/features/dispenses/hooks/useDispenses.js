import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import dispenseService from '../services/dispenseService';

const DispenseItem = z
  .object({
    id: z.any(),
    dispensedAt: z.string().optional(),
    medicineName: z.string().optional(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    totalPrice: z.number().optional(),
    patientId: z.any().optional(),
    patientName: z.string().optional(),
    patientNumber: z.string().optional().nullable(),
    dispensedBy: z
      .object({
        userId: z.any(),
        name: z.string().optional(),
        role: z.string().optional(),
      })
      .optional()
      .nullable(),
    invoiceId: z.any().optional(),
  })
  .passthrough();

const ResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      items: z.array(DispenseItem).default([]),
      total: z.number().default(0),
      summary: z
        .object({
          totalItems: z.number().default(0),
          totalUnits: z.number().default(0),
          byMedicine: z.array(z.object({ medicineName: z.string(), units: z.number() })).default([]),
        })
        .default({ totalItems: 0, totalUnits: 0, byMedicine: [] }),
      page: z.number().optional(),
      pageSize: z.number().optional(),
    })
    .optional(),
});

export function useDispenses(params) {
  const queryKey = ['dispenses', params];
  const { from, to } = params || {};
  const enabled = Boolean(from && to);

  const query = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const res = await dispenseService.list(params);
      const parsed = ResponseSchema.safeParse(res);
      if (parsed.success && parsed.data) {
        return parsed.data.data;
      }
      // Normalize if API responded raw
      if (Array.isArray(res)) {
        return { items: res, total: res.length, summary: { totalItems: res.length, totalUnits: 0, byMedicine: [] } };
      }
      return { items: [], total: 0, summary: { totalItems: 0, totalUnits: 0, byMedicine: [] } };
    },
    staleTime: 30_000,
  });

  return {
    data: query.data || { items: [], total: 0, summary: { totalItems: 0, totalUnits: 0, byMedicine: [] } },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useDispenses;


