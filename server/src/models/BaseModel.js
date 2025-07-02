import { supabase } from '../config/database.js';

/**
 * Base Model class with common database operations
 * Provides CRUD operations and query building utilities
 */
export class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.supabase = supabase;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options = {}) {
    const { 
      select = '*', 
      filters = {}, 
      orderBy = 'created_at', 
      ascending = false,
      limit = 20,
      offset = 0 
    } = options;

    let query = this.supabase
      .from(this.tableName)
      .select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    query = query.order(orderBy, { ascending });

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { data, count };
  }

  /**
   * Find a single record by ID
   */
  async findById(id, select = '*') {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find a single record by filters
   */
  async findOne(filters = {}, select = '*') {
    let query = this.supabase
      .from(this.tableName)
      .select(select);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create a new record
   */
  async create(data) {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Update a record by ID
   */
  async updateById(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count;
  }

  /**
   * Check if record exists
   */
  async exists(filters = {}) {
    const count = await this.count(filters);
    return count > 0;
  }
}
