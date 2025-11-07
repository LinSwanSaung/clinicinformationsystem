import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import patientService from '../services/patientService';

const Patient = z.object({ id: z.any() }).passthrough();
const ResponseSchema = z.object({ success: z.boolean().optional(), data: Patient.optional() });

export function usePatient(id) {
  const query = useQuery({
    queryKey: ['patient', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await patientService.getPatientById(id);
      const parsed = ResponseSchema.safeParse(res);
      if (!parsed.success) {
        return { data: res };
      }
      return parsed.data;
    },
  });

  return {
    data: query.data?.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default usePatient;
