import { BaseModel } from './BaseModel.js';

/**
 * Service Model - Billable services (consultations, procedures, tests, etc.)
 */
class ServiceModel extends BaseModel {
  constructor() {
    super('services');
  }

  /**
   * Get all active services
   */
  async getActiveServices() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('service_name');

    if (error) throw error;
    return data;
  }

  /**
   * Get inactive or all services (admin use)
   */
  async getServicesByActiveFlag(isActive) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', !!isActive)
      .order('category')
      .order('service_name');
    if (error) throw error;
    return data;
  }

  async getAllServices() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('category')
      .order('service_name');
    if (error) throw error;
    return data;
  }

  async listServicesFiltered({ status = 'active', category }) {
    let query = this.supabase.from(this.tableName).select('*');
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    if (category) {
      query = query.eq('category', category);
    }
    query = query.order('category').order('service_name');
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('service_name');

    if (error) throw error;
    return data;
  }

  /**
   * Search services by name or code
   */
  async searchServices(searchTerm) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`service_name.ilike.%${searchTerm}%,service_code.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('service_name');

    if (error) throw error;
    return data;
  }

  async searchServicesWithStatus(searchTerm, status = 'active') {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .or(`service_name.ilike.%${searchTerm}%,service_code.ilike.%${searchTerm}%`)
      .order('service_name');

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async searchServicesWithFilters({ q = '', status = 'active', category }) {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .or(`service_name.ilike.%${q}%,service_code.ilike.%${q}%`)
      .order('service_name');
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get service by ID
   */
  async getServiceById(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new service
   */
  async createService(serviceData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(serviceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update service
   */
  async updateService(id, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete service (soft delete by setting is_active = false)
   */
  async deleteService(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ is_active: false, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new ServiceModel();
