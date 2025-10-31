import jwt from 'jsonwebtoken';
import config from '../config/app.config.js';
import UserModel from '../models/User.model.js';
import PatientModel from '../models/Patient.model.js';
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
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      if (user.patient_id) {
        tokenPayload.patientId = user.patient_id;
      }

      const token = jwt.sign(
        tokenPayload,
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

    // Create user (created_by field removed from schema, track via audit later if needed)
    const newUser = await UserModel.create(userData);

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  /**
   * Public patient registration
   */
  async registerPatient(userData) {
    const { email, password, first_name, last_name } = userData;

    const existingUser = await UserModel.findByEmail(email);
    
    if (existingUser) {
      throw new AppError('Account with this email already exists', 409);
    }

    const newUser = await UserModel.create({
      email,
      password,
      first_name,
      last_name,
      role: 'patient',
      is_active: true
    });

    const token = this.generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    const { password_hash, ...userWithoutPassword } = newUser;

    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Get patient portal accounts (admin)
   */
  async getPatientAccounts(options = {}) {
    return UserModel.getPatientAccounts(options);
  }

  /**
   * Bind a patient portal account to a patient record
   */
  async bindPatientAccount(userId, patientNumber, dateOfBirth) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'patient') {
      throw new AppError('Only patient accounts can be linked to patient records', 403);
    }

    if (user.patient_id) {
      throw new AppError('Account is already linked to a patient record', 400);
    }

    const patient = await PatientModel.findByPatientNumber(patientNumber);

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const providedDob = new Date(dateOfBirth);
    const patientDob = patient.date_of_birth ? new Date(patient.date_of_birth) : null;

    if (!patientDob || patientDob.toISOString().split('T')[0] !== providedDob.toISOString().split('T')[0]) {
      throw new AppError('Patient verification failed. Please check the details and try again.', 400);
    }

    const existingPortalUser = await UserModel.findByPatientId(patient.id);
    if (existingPortalUser && existingPortalUser.id !== user.id) {
      throw new AppError('This patient record is already linked to another account', 409);
    }

    const updatedUser = await UserModel.linkPatientAccount(user.id, patient.id);

    const { password_hash, ...userWithoutPassword } = updatedUser;

    const token = this.generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      patientId: updatedUser.patient_id
    });

    return {
      token,
      user: userWithoutPassword,
      patient: {
        id: patient.id,
        patient_number: patient.patient_number,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth
      }
    };
  }

  /**
   * Admin binding of patient account by direct patient ID
   */
  async adminBindPatientAccount(userId, patientId) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'patient') {
      throw new AppError('Only patient accounts can be linked to patient records', 403);
    }

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const existingPortalUser = await UserModel.findByPatientId(patient.id);
    if (existingPortalUser && existingPortalUser.id !== user.id) {
      throw new AppError('This patient record is already linked to another account', 409);
    }

    await UserModel.linkPatientAccount(user.id, patient.id);

    return UserModel.getPatientAccountById(user.id);
  }

  /**
   * Admin unbind patient account
   */
  async adminUnbindPatientAccount(userId) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'patient') {
      throw new AppError('Only patient accounts can be unlinked via this endpoint', 403);
    }

    await UserModel.unlinkPatientAccount(user.id);
    return UserModel.getPatientAccountById(user.id);
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
