/**
 * Logger Utility
 * Centralized logging with levels and production-safe behavior
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const isDevelopment = import.meta.env.DEV;
const logLevel = import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'error');
const levelValue = LOG_LEVELS[logLevel.toUpperCase()] ?? LOG_LEVELS.ERROR;

/**
 * Sanitize data to prevent PII logging
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'authToken',
    'ssn',
    'credit_card',
  ];

  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

const logger = {
  error: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.ERROR) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.error(`[ERROR] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  warn: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.WARN) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.warn(`[WARN] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  info: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.INFO) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.log(`[INFO] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  debug: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.DEBUG && isDevelopment) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.log(`[DEBUG] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },
};

export default logger;

