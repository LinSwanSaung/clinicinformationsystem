import { useMutation } from '@tanstack/react-query';
import appointmentService from '../services/appointmentService';

/**
 * useUpdateAppointmentStatus
 * Wraps appointmentService.updateAppointmentStatus with React Query mutation.
 * Contract: mutateAsync({ appointmentId, status }) -> returns API response (expects { success, ... })
 */
export function useUpdateAppointmentStatus(options = {}) {
  const mutation = useMutation({
    mutationKey: ['updateAppointmentStatus'],
    mutationFn: async ({ appointmentId, status }) => {
      if (!appointmentId || !status) {
        throw new Error('appointmentId and status are required');
      }
      const res = await appointmentService.updateAppointmentStatus(appointmentId, status);
      return res;
    },
    ...options,
  });

  return mutation;
}

export default useUpdateAppointmentStatus;
