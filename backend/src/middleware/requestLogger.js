/**
 * Request logging middleware
 * Logs incoming requests with relevant information
 */

import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request details (debug level - only in development)
  logger.debug(`Request: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;

    // Only log slow requests or errors in production
    if (res.statusCode >= 400 || duration > 1000) {
      logger.warn(`Response: ${req.method} ${req.url} - ${res.statusCode}`, {
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    } else {
      logger.debug(`Response: ${req.method} ${req.url} - ${res.statusCode}`, {
        duration: `${duration}ms`,
      });
    }

    originalEnd.apply(this, args);
  };

  next();
};
