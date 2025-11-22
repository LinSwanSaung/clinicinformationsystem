/**
 * Validation utilities for input sanitization and validation
 */

/**
 * Sanitize string input to prevent XSS and SQL injection
 * Removes or escapes dangerous characters
 */
export const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') {
    return input;
  }

  const {
    allowSpecialChars = false,
    maxLength = null,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove or escape special characters based on options
  if (!allowSpecialChars) {
    // Remove potentially dangerous characters but keep common punctuation
    sanitized = sanitized.replace(/[<>]/g, ''); // Remove < and > to prevent HTML injection
  }

  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Validate and sanitize number input
 * Prevents overflow and invalid values
 */
export const sanitizeNumber = (input, options = {}) => {
  const {
    min = null,
    max = null,
    allowDecimals = true,
    precision = 2,
  } = options;

  // Convert to number
  let num = typeof input === 'string' ? parseFloat(input) : Number(input);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number');
  }

  // Check for overflow (JavaScript safe integer range)
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    throw new Error('Number exceeds safe integer range');
  }

  // Round to precision if decimals not allowed or precision specified
  if (!allowDecimals || precision !== null) {
    num = Number(num.toFixed(precision));
  }

  // Check min/max bounds
  if (min !== null && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  if (max !== null && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }

  return num;
};

/**
 * Validate payment amount
 * Prevents overflow and ensures valid payment values
 */
export const validatePaymentAmount = (amount) => {
  try {
    const sanitized = sanitizeNumber(amount, {
      min: 0.01, // Minimum payment amount
      max: 999999999.99, // Maximum payment amount (reasonable limit)
      allowDecimals: true,
      precision: 2,
    });
    return sanitized;
  } catch (error) {
    throw new Error(`Invalid payment amount: ${error.message}`);
  }
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }

  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  // Limit length
  if (sanitized.length > 255) {
    throw new Error('Email address too long');
  }

  return sanitized;
};

/**
 * Validate and sanitize phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone;
  }

  // Remove all non-digit characters except + at the start
  let sanitized = phone.trim();
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.substring(1).replace(/\D/g, '');
  } else {
    sanitized = sanitized.replace(/\D/g, '');
  }

  // Limit length (reasonable phone number length)
  if (sanitized.length > 20) {
    throw new Error('Phone number too long');
  }

  return sanitized;
};

