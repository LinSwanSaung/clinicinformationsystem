/**
 * Role Constants
 * Centralized role definitions to ensure consistency across the application.
 * Use these constants instead of hardcoded strings.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  CASHIER: 'cashier',
  PHARMACIST: 'pharmacist',
});

/**
 * Helper function to check if a role is valid
 * @param {string} role - The role to check
 * @returns {boolean} - True if role is valid
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Get all roles as an array
 * @returns {string[]} - Array of all role values
 */
export const getAllRoles = () => {
  return Object.values(ROLES);
};

export default ROLES;
