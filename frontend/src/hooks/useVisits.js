import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import visitService from '@/services/visitService';

const Visit = z.object({ id: z.any() }).passthrough();
const ResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(Visit).optional(),
});

export function useVisits(params = {}) {
  const query = useQuery({
    queryKey: ['visits', params],
    queryFn: async () => {
      // visitService likely exposes getAll or per-patient; fall back to getAll
      if (params?.patientId) {
        const res = await visitService.getVisitHistory(params.patientId);
        const parsed = ResponseSchema.safeParse(res);
        return parsed.success ? parsed.data : { data: res?.data || [] };
      }
      const res = await visitService.getAllVisits?.(params);
      const parsed = ResponseSchema.safeParse(res);
      return parsed.success ? parsed.data : { data: res?.data || [] };
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

export default useVisits;
