import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import invoiceService from '@/services/invoiceService';

const Invoice = z.object({ id: z.any() }).passthrough();
const ArrayResponse = z.object({
  success: z.boolean().optional(),
  data: z.array(Invoice).optional(),
});

export function useInvoices(params = { type: 'pending', limit: 50, offset: 0 }) {
  const { type = 'pending', limit = 50, offset = 0 } = params || {};

  const query = useQuery({
    queryKey: ['invoices', { type, limit, offset }],
    queryFn: async () => {
      let res;
      if (type === 'pending') {
        res = await invoiceService.getPendingInvoices();
      } else if (type === 'completed') {
        res = await invoiceService.getCompletedInvoices(limit, offset);
      } else {
        // default to pending
        res = await invoiceService.getPendingInvoices();
      }

      const parsed = ArrayResponse.safeParse(res);
      if (!parsed.success) {
        if (Array.isArray(res)) {
          return { data: res };
        }
        if (res && Array.isArray(res.data)) {
          return { data: res.data };
        }
      }
      return parsed.data;
    },
    staleTime: 30_000,
  });

  return {
    data: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useInvoices;
