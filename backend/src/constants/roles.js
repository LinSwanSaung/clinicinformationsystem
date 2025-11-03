/**
 * Role Constants (Backend)
 * Centralized role definitions to ensure consistency across the application.
 * Use these constants instead of hardcoded strings.
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  RECEPTION: 'reception', // Legacy alias for receptionist - kept for backward compatibility
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
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Get all roles as an array
 * @returns {string[]} - Array of all role values
 */
const getAllRoles = () => {
  return Object.values(ROLES);
};

module.exports = {
  ROLES,
  isValidRole,
  getAllRoles,
};
