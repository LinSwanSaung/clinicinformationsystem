import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import serviceService from '@/services/serviceService';

export function useServices(params = {}) {
  const { q, category, status = 'active' } = params || {};
  const queryKey = ['services', { q: q || '', category: category || '', status }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (q && q.trim()) {
        const res = await serviceService.searchServices(q.trim(), {
          status,
          category: category || undefined,
        });
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      }
      const res = await serviceService.getActiveServices({
        status,
        category: category || undefined,
      });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
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

export function useServiceMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['services'] });

  const create = useMutation({
    mutationFn: (payload) => serviceService.createService(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, updates }) => serviceService.updateService(id, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id) => serviceService.deleteService(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
