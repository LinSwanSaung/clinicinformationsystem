import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import appointmentService from '../services/appointmentService';

const Appointment = z.object({ id: z.any() }).passthrough();
const ResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(Appointment).optional(),
});

export function useAppointments(params = {}) {
  const { refetchInterval } = params || {};

  const query = useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      // Support optional date-based filtering via service API if provided
      if (params?.date instanceof Date) {
        const res = await appointmentService.getAppointmentsByDate(params.date);
        const parsed = ResponseSchema.safeParse(res);
        if (!parsed.success) {
          // If API returns raw array or {data}, normalize
          if (Array.isArray(res)) {
            return { data: res };
          }
          if (res && Array.isArray(res.data)) {
            return { data: res.data };
          }
        }
        return parsed.data;
      }

      const res = await appointmentService.getAllAppointments?.(params);
      const parsed = ResponseSchema.safeParse(res);
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
    staleTime: 30_000, // 30 seconds - data is fresh for 30 seconds
    refetchInterval: refetchInterval !== undefined ? refetchInterval : false, // No auto-refresh by default
    refetchIntervalInBackground: false, // Don't poll in background tabs
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
  });

  return {
    data: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useAppointments;
