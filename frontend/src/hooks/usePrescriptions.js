import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import prescriptionService from '@/services/prescriptionService';

const Prescription = z.object({ id: z.any() }).passthrough();
const ArrayResponse = z.object({
  success: z.boolean().optional(),
  data: z.array(Prescription).optional(),
});

export function usePrescriptionsByPatient(patientId, options = { includeInactive: false }) {
  const { includeInactive = false } = options || {};
  const query = useQuery({
    queryKey: ['prescriptions', { patientId, includeInactive }],
    enabled: !!patientId,
    queryFn: async () => {
      const res = await prescriptionService.getPrescriptionsByPatient(patientId, includeInactive);
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

export function usePrescriptionsByVisit(visitId) {
  const query = useQuery({
    queryKey: ['prescriptionsByVisit', visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const res = await prescriptionService.getPrescriptionsByVisit(visitId);
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

export default {
  usePrescriptionsByPatient,
  usePrescriptionsByVisit,
};
