import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import patientService from '../services/patientService';

// Minimal response schema to keep behavior unchanged while asserting structure
const Patient = z
  .object({
    id: z.any(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    patient_number: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  })
  .passthrough();

const ResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(Patient).optional(),
});

/**
 * usePatients - fetches patients list via API service
 * No behavioral change: returns the same shape the page expects (data array)
 */
export function usePatients(options = {}) {
  const queryKey = ['patients', options];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await patientService.getAllPatients();
      const parsed = ResponseSchema.safeParse(res);
      if (!parsed.success) {
        // If API returns raw array, normalize to { data }
        if (Array.isArray(res)) {
          return { data: res };
        }
      }
      return parsed.success ? parsed.data : { data: [] };
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

export default usePatients;
