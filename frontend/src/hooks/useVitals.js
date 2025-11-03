import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import vitalsService from '@/services/vitalsService';

const Vitals = z.object({ id: z.any() }).passthrough();
const ArrayResponse = z.object({
  success: z.boolean().optional(),
  data: z.array(Vitals).optional(),
});
const ObjectResponse = z.object({ success: z.boolean().optional(), data: Vitals.optional() });

export function useVitals(patientId, options = { latest: false }) {
  const { latest = false } = options || {};

  const query = useQuery({
    queryKey: ['vitals', { patientId, latest }],
    enabled: !!patientId,
    queryFn: async () => {
      const res = latest
        ? await vitalsService.getLatestVitals(patientId)
        : await vitalsService.getPatientVitals(patientId);

      if (latest) {
        const parsed = ObjectResponse.safeParse(res);
        if (!parsed.success) {
          if (res && res.data) {
            return { data: res.data };
          }
          return { data: res };
        }
        return parsed.data;
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
    data: query.data?.data || (latest ? null : []),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useVitals;
