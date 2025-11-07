import { useMutation } from '@tanstack/react-query';
import appointmentService from '../services/appointmentService';

/**
 * useCreateAppointment
 * Wraps appointmentService.createAppointment with React Query mutation.
 * Contract: mutateAsync(appointmentData) -> returns API response ({ success, data, ... })
 */
export function useCreateAppointment(options = {}) {
  const mutation = useMutation({
    mutationKey: ['createAppointment'],
    mutationFn: async (appointmentData) => {
      if (!appointmentData) {
        throw new Error('appointmentData is required');
      }
      const res = await appointmentService.createAppointment(appointmentData);
      return res;
    },
    ...options,
  });
  return mutation;
}

export default useCreateAppointment;
