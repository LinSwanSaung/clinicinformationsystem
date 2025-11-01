/**
 * Employee Service
 * Handles all employee-related API calls and data management
 * Now using real backend API through userService
 */
import userService from './userService.js';

class EmployeeService {
  constructor() {
    // Define available roles
    this.availableRoles = [
      { value: 'admin', label: 'Administrator' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'nurse', label: 'Nurse' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'cashier', label: 'Cashier' },
      { value: 'pharmacist', label: 'Pharmacist' }
    ];
  }

  /**
   * Get all employees (users)
   * @returns {Promise<Array>} List of employees
   */
  async getAllEmployees(options = {}) {
    try {
      const response = await userService.getAllUsers(options);
      
      if (response.success) {
        // Filter out patients - only return staff roles
        const staffRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'];
        const data = response.data;
        if (Array.isArray(data)) {
          const employeesOnly = data.filter(user => staffRoles.includes(user.role));
          return employeesOnly;
        } else {
          console.warn('Expected array but got:', typeof data, data);
          return [];
        }
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   * @param {string} id - Employee ID
   * @returns {Promise<Object|null>} Employee object or null if not found
   */
  async getEmployeeById(id) {
    try {
      const response = await userService.getUserById(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Employee not found');
      }
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add new employee
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Object>} Created employee
   */
  async addEmployee(employeeData) {
    try {
      const response = await userService.createUser(employeeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  }

  /**
   * Update employee
   * @param {string} id - Employee ID
   * @param {Object} updates - Updated employee data
   * @returns {Promise<Object>} Updated employee
   */
  async updateEmployee(id, updates) {
    try {
      const response = await userService.updateUser(id, updates);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete employee
   * @param {string} id - Employee ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEmployee(id) {
    try {
      const response = await userService.deleteUser(id);
      // Backend returns 204 No Content; apiService maps non-JSON to { message }
      // Treat any 2xx as success here
      if (response?.success === true || response?.status === 204 || response?.message) {
        return true;
      }
      // Fallback
      return true;
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available roles
   * @returns {Promise<Array>} List of roles
   */
  async getRoles() {
    // Return locally defined roles
    return this.availableRoles;
  }

  /**
   * Get employees by role
   * @param {string} role - Role to filter by
   * @returns {Promise<Array>} Filtered employees
   */
  async getEmployeesByRole(role) {
    try {
      const response = await userService.getUsersByRole(role);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch employees by role');
      }
    } catch (error) {
      console.error(`Failed to fetch employees with role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Toggle employee active status
   * @param {string} id - Employee ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} Updated employee
   */
  async toggleEmployeeStatus(id, isActive) {
    try {
      const response = await userService.toggleUserStatus(id, isActive);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update employee status');
      }
    } catch (error) {
      console.error(`Failed to toggle status for employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reset employee password (admin only)
   * @param {string} id - Employee ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetEmployeePassword(id, newPassword) {
    try {
      const response = await userService.resetUserPassword(id, newPassword);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error(`Failed to reset password for employee ${id}:`, error);
      throw error;
    }
  }
}

export default new EmployeeService();
