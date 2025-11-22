import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

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
      offset = 0,
    } = options;

    let query = this.supabase.from(this.tableName).select(select);

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
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data; // Will be null if no record is found
  }

  /**
   * Find a single record by filters
   */
  async findOne(filters = {}, select = '*') {
    let query = this.supabase.from(this.tableName).select(select);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Use maybeSingle() instead of single() to avoid errors when no rows are found
    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return data; // Will be null if no record is found
  }

  /**
   * Create a new record
   */
  async create(data) {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .maybeSingle();

      if (error) {
        logger.error(`Error creating ${this.tableName}:`, error);
        throw error;
      }

      return result;
    } catch (error) {
      logger.error(`Exception creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async updateById(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) {
        logger.error(`Error updating ${this.tableName}:`, error);
        throw error;
      }

      // If no rows match the ID, result will be null
      if (!result) {
        return null;
      }

      return result;
    } catch (error) {
      logger.error(`Exception updating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id) {
    const { error } = await this.supabase.from(this.tableName).delete().eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });

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
