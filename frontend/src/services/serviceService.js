import apiService from './api.js';

const serviceService = {
  // Get all active services
  getActiveServices: async () => {
    const response = await apiService.get('/services');
    return response.data;
  },

  // Get services by category
  getServicesByCategory: async (category) => {
    const response = await apiService.get(`/services/category/${category}`);
    return response.data;
  },

  // Search services
  searchServices: async (searchTerm) => {
    const response = await apiService.get('/services/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },

  // Get service by ID
  getServiceById: async (id) => {
    const response = await apiService.get(`/services/${id}`);
    return response.data;
  },

  // Create service (Admin only)
  createService: async (serviceData) => {
    const response = await apiService.post('/services', serviceData);
    return response.data;
  },

  // Update service (Admin only)
  updateService: async (id, updates) => {
    const response = await apiService.put(`/services/${id}`, updates);
    return response.data;
  },

  // Delete service (Admin only)
  deleteService: async (id) => {
    const response = await apiService.delete(`/services/${id}`);
    return response.data;
  },
};

export default serviceService;
