import { useQuery } from '@tanstack/react-query';
import patientService from '../services/patientService';

/**
 * usePatients - fetches patients list via API service
 * Returns the data array that the page expects
 */
export function usePatients(options = {}) {
  const queryKey = ['patients', options];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await patientService.getAllPatients();

      // Handle different response formats
      // API returns { success: true, data: [...] }
      if (res && res.data && Array.isArray(res.data)) {
        return res.data;
      }

      // If API returns raw array
      if (Array.isArray(res)) {
        return res;
      }

      // Fallback
      return [];
    },
    staleTime: 30_000,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default usePatients;
