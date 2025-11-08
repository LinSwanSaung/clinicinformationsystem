import api from '@/services/api';

const dispenseService = {
  async list(params) {
    return api.get('/dispenses', { params });
  },
  async exportCsv(params) {
    const blob = await api.getBlob('/dispenses/export', {
      params,
      headers: { Accept: 'text/csv' },
    });
    return blob;
  },
};

export default dispenseService;


