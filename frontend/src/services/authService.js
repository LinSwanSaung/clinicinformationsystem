import apiService from './api.js';

class AuthService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  // Login user
  async login(credentials) {
    if (this.isDevelopment) {
      // Dummy authentication for development
      const { email, password } = credentials;
      
      // Simple dummy validation
      if (email === 'admin@clinic.com' && password === 'admin123') {
        const userData = {
          id: 1,
          email: 'admin@clinic.com',
          name: 'Administrator',
          role: 'admin',
          token: 'dummy-admin-token'
        };
        
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return Promise.resolve({
          success: true,
          data: userData
        });
      }
      
      if (email === 'nurse@clinic.com' && password === 'nurse123') {
        const userData = {
          id: 2,
          email: 'nurse@clinic.com',
          name: 'Nurse Johnson',
          role: 'nurse',
          token: 'dummy-nurse-token'
        };
        
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return Promise.resolve({
          success: true,
          data: userData
        });
      }
      
      if (email === 'doctor@clinic.com' && password === 'doctor123') {
        const userData = {
          id: 3,
          email: 'doctor@clinic.com',
          name: 'Dr. Smith',
          role: 'doctor',
          token: 'dummy-doctor-token'
        };
        
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return Promise.resolve({
          success: true,
          data: userData
        });
      }
      
      if (email === 'receptionist@clinic.com' && password === 'receptionist123') {
        const userData = {
          id: 4,
          email: 'receptionist@clinic.com',
          name: 'Receptionist Mary',
          role: 'receptionist',
          token: 'dummy-receptionist-token'
        };
        
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return Promise.resolve({
          success: true,
          data: userData
        });
      }
      
      return Promise.reject(new Error('Invalid credentials'));
    }
    
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    if (this.isDevelopment) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return Promise.resolve({ success: true });
    }
    
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
      throw error;
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
    if (this.isDevelopment) {
      console.log('Development mode: Password change requested');
      return Promise.resolve({ success: true });
    }
    
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
}

export default new AuthService();
