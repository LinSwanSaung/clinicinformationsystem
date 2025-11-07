import apiService from '@/services/api';
import logger from '@/utils/logger';

class UserService {
  // Get all users, optionally with query params (e.g., { params: { is_active: true, role: 'doctor' } })
  async getAllUsers(options = {}) {
    const response = await apiService.get('/users', options);
    return response;
  }

  async getUserById(id) {
    const response = await apiService.get(`/users/${id}`);
    return response;
  }

  async createUser(userData) {
    const response = await apiService.post('/users', userData);
    return response;
  }

  async updateUser(id, userData) {
    const response = await apiService.put(`/users/${id}`, userData);
    return response;
  }

  async deleteUser(id) {
    const response = await apiService.delete(`/users/${id}`);
    // apiService returns {} for 204; normalize to a success flag
    return { success: true, ...response };
  }

  async toggleUserStatus(id, isActive) {
    try {
      const response = await apiService.patch(`/users/${id}/status`, { is_active: isActive });
      return response;
    } catch (error) {
      logger.error(`Failed to toggle user status for ${id}:`, error);
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
          data: Array.isArray(response.data) ? response.data : [],
        };
      }

      // Fallback for different response structures
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      logger.error(`Failed to fetch users with role ${role}:`, error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  async resetUserPassword(id, newPassword) {
    const response = await apiService.post(`/users/${id}/reset-password`, {
      new_password: newPassword,
    });
    return response;
  }

  async getUserStats() {
    const response = await apiService.get('/users/stats');
    return response;
  }
}

export default new UserService();
