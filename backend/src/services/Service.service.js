import ServiceModel from '../models/Service.model.js';

/**
 * Service Service - Business logic for billable services
 */
class ServiceService {
  /**
   * List services by status (admin)
   */
  async listServices({ status = 'active', category } = {}) {
    try {
      const normalized = ['active', 'inactive', 'all'].includes(status) ? status : 'active';
      return await ServiceModel.listServicesFiltered({ status: normalized, category });
    } catch (error) {
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }
  /**
   * Get all active services
   */
  async getActiveServices() {
    try {
      const services = await ServiceModel.getActiveServices();
      return services;
    } catch (error) {
      throw new Error(`Failed to get active services: ${error.message}`);
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category) {
    try {
      const validCategories = ['consultation', 'procedure', 'laboratory', 'imaging', 'pharmacy', 'other'];
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }

      const services = await ServiceModel.getServicesByCategory(category);
      return services;
    } catch (error) {
      throw new Error(`Failed to get services by category: ${error.message}`);
    }
  }

  /**
   * Search services
   */
  async searchServices(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return await this.getActiveServices();
      }

      const services = await ServiceModel.searchServices(searchTerm);
      return services;
    } catch (error) {
      throw new Error(`Failed to search services: ${error.message}`);
    }
  }

  /**
   * Advanced search including status (admin)
   */
  async searchServicesAdvanced(searchTerm, status = 'active', category) {
    try {
      const normalized = ['active', 'inactive', 'all'].includes(status) ? status : 'active';
      return await ServiceModel.searchServicesWithFilters({ q: searchTerm || '', status: normalized, category });
    } catch (error) {
      throw new Error(`Failed to search services: ${error.message}`);
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(id) {
    try {
      const service = await ServiceModel.getServiceById(id);
      if (!service) {
        throw new Error('Service not found');
      }
      return service;
    } catch (error) {
      throw new Error(`Failed to get service: ${error.message}`);
    }
  }

  /**
   * Create new service
   */
  async createService(serviceData) {
    try {
      // Validate required fields
      const { service_code, service_name, category, default_price } = serviceData;
      if (!service_code || !service_name || !category || default_price === undefined) {
        throw new Error('Missing required fields: service_code, service_name, category, default_price');
      }

      // Validate category
      const validCategories = ['consultation', 'procedure', 'laboratory', 'imaging', 'pharmacy', 'other'];
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }

      // Validate price
      if (default_price < 0) {
        throw new Error('Price must be a positive number');
      }

      const service = await ServiceModel.createService(serviceData);
      return service;
    } catch (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  /**
   * Update service
   */
  async updateService(id, updates) {
    try {
      // Validate category if provided
      if (updates.category) {
        const validCategories = ['consultation', 'procedure', 'laboratory', 'imaging', 'pharmacy', 'other'];
        if (!validCategories.includes(updates.category)) {
          throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }
      }

      // Validate price if provided
      if (updates.default_price !== undefined && updates.default_price < 0) {
        throw new Error('Price must be a positive number');
      }

      const service = await ServiceModel.updateService(id, updates);
      return service;
    } catch (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  /**
   * Delete service (soft delete)
   */
  async deleteService(id) {
    try {
      const service = await ServiceModel.deleteService(id);
      return service;
    } catch (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  }
}

export default new ServiceService();
