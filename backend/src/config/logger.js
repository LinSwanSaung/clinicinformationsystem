/**
 * Logger Configuration
 * Centralized logging with levels and PII protection
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const levelValue = LOG_LEVELS[currentLevel.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Sanitize data to prevent PII logging
 * Removes sensitive fields from log objects
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'ssn',
    'credit_card',
  ];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Logger implementation
 * Uses console in development, can be swapped for pino/winston in production
 */
const logger = {
  error: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.ERROR) {
      const sanitized = args.map(sanitizeData);
      console.error(`[ERROR] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  warn: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.WARN) {
      const sanitized = args.map(sanitizeData);
      console.warn(`[WARN] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  info: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.INFO) {
      const sanitized = args.map(sanitizeData);
      console.log(`[INFO] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },

  debug: (message, ...args) => {
    if (levelValue >= LOG_LEVELS.DEBUG) {
      const sanitized = args.map(sanitizeData);
      console.log(`[DEBUG] ${new Date().toISOString()}`, message, ...sanitized);
    }
  },
};

export default logger;
