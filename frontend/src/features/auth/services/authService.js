import apiService from '@/services/api';
import logger from '@/utils/logger';

class AuthService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  // Login user
  async login(credentials) {
    try {
      // Use real API authentication (both development and production)
      const response = await apiService.post('/auth/login', credentials);

      if (response.success) {
        const { token, user } = response.data;

        // Store token and user data
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        return {
          success: true,
          data: { ...user, token },
        };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await apiService.post('/auth/logout');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      logger.error('Logout failed:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    }
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        logger.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh');
      if (response.success) {
        const { token } = response.data;
        localStorage.setItem('authToken', token);
        return { success: true };
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      logger.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Verify token by checking /auth/me endpoint
  async verifyToken() {
    try {
      const response = await apiService.get('/auth/me');
      return response.success;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return false;
    }
  }

  // Patient self-registration
  async registerPatientAccount(payload) {
    try {
      const response = await apiService.post('/auth/register-patient', payload);

      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        return {
          success: true,
          data: { ...user, token },
        };
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      logger.error('Patient registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  // Bind patient account to record
  async bindPatientAccount(patientNumber, dateOfBirth) {
    try {
      const response = await apiService.post('/auth/bind-patient', {
        patient_number: patientNumber,
        date_of_birth: dateOfBirth,
      });

      if (response.success) {
        const { token, user, patient } = response.data;

        if (token) {
          localStorage.setItem('authToken', token);
        }

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        return {
          success: true,
          data: { user, patient, token },
        };
      }

      throw new Error(response.message || 'Failed to link patient record');
    } catch (error) {
      logger.error('Bind patient error:', error);
      return {
        success: false,
        message: error.message || 'Failed to link patient record',
      };
    }
  }
}

export default new AuthService();
