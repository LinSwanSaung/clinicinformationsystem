/**
 * Employee Service
 * Handles all employee-related API calls and data management
 */

// For now, using mock data until backend is ready
import { employees, roles } from '../data/mockData.js';

class EmployeeService {
  constructor() {
    this.employees = [...employees];
    this.roles = [...roles];
  }

  /**
   * Get all employees
   * @returns {Promise<Array>} List of employees
   */
  async getAllEmployees() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.employees;
  }

  /**
   * Get employee by ID
   * @param {string} id - Employee ID
   * @returns {Promise<Object|null>} Employee object or null if not found
   */
  async getEmployeeById(id) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.employees.find(emp => emp.id === id) || null;
  }

  /**
   * Add new employee
   * @param {Object} employeeData - Employee data
   * @returns {Promise<Object>} Created employee
   */
  async addEmployee(employeeData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newEmployee = {
      id: `EMP${String(this.employees.length + 1).padStart(3, '0')}`,
      ...employeeData,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    
    this.employees.push(newEmployee);
    return newEmployee;
  }

  /**
   * Update employee
   * @param {string} id - Employee ID
   * @param {Object} updates - Employee updates
   * @returns {Promise<Object|null>} Updated employee or null if not found
   */
  async updateEmployee(id, updates) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;
    
    this.employees[index] = { ...this.employees[index], ...updates };
    return this.employees[index];
  }

  /**
   * Delete employee
   * @param {string} id - Employee ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEmployee(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;
    
    this.employees.splice(index, 1);
    return true;
  }

  /**
   * Get all available roles
   * @returns {Promise<Array>} List of roles
   */
  async getRoles() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.roles;
  }

  /**
   * Get employees by role
   * @param {string} role - Role name
   * @returns {Promise<Array>} List of employees with specified role
   */
  async getEmployeesByRole(role) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.employees.filter(emp => emp.role === role);
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();
export default employeeService;
