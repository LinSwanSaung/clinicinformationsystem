import { BaseModel } from './BaseModel.js';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * Handles user-related database operations
 */
export class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  /**
   * Create a new user with hashed password
   */
  async create(userData) {
    const { password, ...otherData } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    const newUser = {
      ...otherData,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return super.create(newUser);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.updateById(userId, { password_hash: passwordHash });
  }

  /**
   * Get users by role
   */
  async findByRole(role, options = {}) {
    return this.findAll({
      ...options,
      filters: { ...options.filters, role }
    });
  }

  /**
   * Get active users
   */
  async findActive(options = {}) {
    return this.findAll({
      ...options,
      filters: { ...options.filters, is_active: true }
    });
  }

  /**
   * Activate/Deactivate user
   */
  async toggleActive(userId, isActive) {
    return this.updateById(userId, { is_active: isActive });
  }

  /**
   * Get user profile (without sensitive data)
   */
  async getProfile(userId) {
    return this.findById(userId, 'id, email, first_name, last_name, role, phone, specialty, is_active, created_at');
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm, options = {}) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, email, first_name, last_name, role, phone, specialty, is_active')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('first_name')
      .limit(options.limit || 20);

    if (error) {
      throw error;
    }

    return data;
  }
}

export default new UserModel();
