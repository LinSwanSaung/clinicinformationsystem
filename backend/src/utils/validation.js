/**
 * Validation utilities for input sanitization
 */

export const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') {
    return input;
  }

  const { allowSpecialChars = false, maxLength = null, trim = true } = options;

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  sanitized = sanitized.replace(/\0/g, '');

  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[<>]/g, '');
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

export const sanitizeNumber = (input, options = {}) => {
  const { min = null, max = null, allowDecimals = true, precision = 2 } = options;

  let num = typeof input === 'string' ? parseFloat(input) : Number(input);

  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number');
  }

  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    throw new Error('Number exceeds safe integer range');
  }

  if (!allowDecimals || precision !== null) {
    num = Number(num.toFixed(precision));
  }

  if (min !== null && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  if (max !== null && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }

  return num;
};

export const validatePaymentAmount = (amount) => {
  try {
    const sanitized = sanitizeNumber(amount, {
      min: 0.01,
      max: 999999999.99,
      allowDecimals: true,
      precision: 2,
    });
    return sanitized;
  } catch (error) {
    throw new Error(`Invalid payment amount: ${error.message}`);
  }
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }

  const sanitized = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  if (sanitized.length > 255) {
    throw new Error('Email address too long');
  }

  return sanitized;
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone;
  }

  let sanitized = phone.trim();
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.substring(1).replace(/\D/g, '');
  } else {
    sanitized = sanitized.replace(/\D/g, '');
  }

  if (sanitized.length > 20) {
    throw new Error('Phone number too long');
  }

  return sanitized;
};
