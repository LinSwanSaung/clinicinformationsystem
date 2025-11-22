/**
 * Global error handler middleware
 * Centralizes error handling across the application
 */

import logger from '../config/logger.js';

export const errorHandler = (error, req, res, _next) => {
  // Suppress logging for 401 errors when there's no Authorization header
  // This happens when components make requests after user logs out
  const hasAuthHeader = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
  const isUnauthorizedNoToken = error.statusCode === 401 && 
                                 (error.message === 'Access token required' || error.message === 'Invalid token') &&
                                 !hasAuthHeader;
  
  if (isUnauthorizedNoToken) {
    // User is already logged out, component is probably unmounting
    // Log at debug level instead of error to avoid noise
    logger.debug('Request without auth token (user logged out):', {
      url: req.url,
      method: req.method,
    });
  } else {
    // Log error for debugging
    logger.error('Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle ApplicationError (structured errors from our services)
  if (error.name === 'ApplicationError' || error.code) {
    const statusCode = error.statusCode || 500;
    const response = {
      success: false,
      message: error.message,
      ...(error.code && { code: error.code }),
      ...(error.details && { details: error.details }),
      timestamp: new Date().toISOString(),
    };

    // Include stack in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
  }

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Unauthorized access';
  }

  // Handle CORS errors
  if (error.message.includes('CORS') || error.message.includes('Not allowed by CORS')) {
    statusCode = 403;
    message = 'CORS policy: Origin not allowed';
  }

  // Handle rate limit errors
  if (error.statusCode === 429 || error.message.includes('Too many requests')) {
    statusCode = 429;
    message = error.message || 'Too many requests, please try again later';
  }

  if (error.message.includes('not found') || error.message.includes('does not exist')) {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Supabase specific errors
  if (error.code === 'PGRST301') {
    statusCode = 404;
    message = 'Resource not found';
  }
  // Network/Fetch failures (e.g., database host unreachable)
  if (
    message?.toLowerCase().includes('fetch failed') ||
    message?.toLowerCase().includes('getaddrinfo') ||
    message?.toLowerCase().includes('econnrefused') ||
    message?.toLowerCase().includes('etimedout')
  ) {
    statusCode = 503; // Service Unavailable
    message = 'Upstream service unavailable';
  }

  if (error.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
