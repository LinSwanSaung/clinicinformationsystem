import apiService from './api.js';

class AuthService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  // Login user
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          success: true,
          data: { ...user, token }
        };
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
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
      console.error('Logout failed:', error);
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
        console.error('Failed to parse user data:', error);
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
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Password change failed:', error);
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
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const response = await apiService.get('/auth/verify');
      return response.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
}

export default new AuthService();
