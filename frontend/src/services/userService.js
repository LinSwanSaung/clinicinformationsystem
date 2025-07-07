import apiService from './api.js';

class UserService {
  async getAllUsers() {
    try {
      const response = await apiService.get('/users');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const response = await apiService.get(`/users/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await apiService.post('/users', userData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await apiService.put(`/users/${id}`, userData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const response = await apiService.delete(`/users/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async toggleUserStatus(id, isActive) {
    try {
      const response = await apiService.patch(`/users/${id}/status`, { is_active: isActive });
      return response;
    } catch (error) {
      console.error(`Failed to toggle user status for ${id}:`, error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await apiService.get(`/users?role=${role}`);
      
      // Ensure we return a consistent structure
      if (response?.success && response?.data) {
        return {
          success: true,
          data: Array.isArray(response.data) ? response.data : []
        };
      }
      
      // Fallback for different response structures
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error(`Failed to fetch users with role ${role}:`, error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  async resetUserPassword(id, newPassword) {
    try {
      const response = await apiService.post(`/users/${id}/reset-password`, { 
        new_password: newPassword 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUserStats() {
    try {
      const response = await apiService.get('/users/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
