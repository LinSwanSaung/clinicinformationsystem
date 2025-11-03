import { useMutation } from '@tanstack/react-query';
import appointmentService from '@/services/appointmentService';

/**
 * useCancelAppointment
 * Wraps appointmentService.updateAppointmentStatus with 'cancelled' status.
 * Contract: mutateAsync(appointmentId) -> returns API response ({ success, ... })
 */
export function useCancelAppointment(options = {}) {
  const mutation = useMutation({
    mutationKey: ['cancelAppointment'],
    mutationFn: async (appointmentId) => {
      if (!appointmentId) {
        throw new Error('appointmentId is required');
      }
      const res = await appointmentService.updateAppointmentStatus(appointmentId, 'cancelled');
      return res;
    },
    ...options,
  });
  return mutation;
}

export default useCancelAppointment;
