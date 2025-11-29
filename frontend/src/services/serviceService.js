import apiService from './api.js';

const serviceService = {
  getActiveServices: async (options = {}) => {
    const { status, category } = options;
    const params = {};
    if (status) {
      params.status = status;
    }
    if (category) {
      params.category = category;
    }
    const response = await apiService.get('/services', {
      params: Object.keys(params).length ? params : undefined,
    });
    return response.data;
  },

  getServicesByCategory: async (category) => {
    const response = await apiService.get(`/services/category/${category}`);
    return response.data;
  },

  searchServices: async (searchTerm, options = {}) => {
    const { status, category } = options;
    const params = { q: searchTerm };
    if (status) {
      params.status = status;
    }
    if (category) {
      params.category = category;
    }
    const response = await apiService.get('/services/search', {
      params,
    });
    return response.data;
  },

  getServiceById: async (id) => {
    const response = await apiService.get(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData) => {
    const response = await apiService.post('/services', serviceData);
    return response.data;
  },

  updateService: async (id, updates) => {
    const response = await apiService.put(`/services/${id}`, updates);
    return response.data;
  },

  deleteService: async (id) => {
    const response = await apiService.delete(`/services/${id}`);
    return response.data;
  },
};

export default serviceService;
