/**
 * Global error handler middleware
 * Centralizes error handling across the application
 */

export const errorHandler = (error, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

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
