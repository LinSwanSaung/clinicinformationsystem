import jwt from 'jsonwebtoken';
import config from '../config/app.config.js';
import UserModel from '../models/User.model.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
class AuthService {
  /**
   * User login
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Update last login timestamp
      await UserModel.updateLastLogin(user.id);

      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword
      };
    } catch (err) {
      // Surface connectivity issues distinctly
      if (typeof err.message === 'string' && err.message.toLowerCase().includes('fetch failed')) {
        throw new AppError('Authentication service unavailable', 503);
      }
      throw err;
    }
  }

  /**
   * User registration
   */
  async register(userData, createdBy) {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create user
    const newUser = await UserModel.create({
      ...userData,
      created_by: createdBy
    });

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
    const user = await UserModel.getProfile(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await UserModel.verifyPassword(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    await UserModel.updatePassword(userId, newPassword);

    return true;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }
}

export default new AuthService();
