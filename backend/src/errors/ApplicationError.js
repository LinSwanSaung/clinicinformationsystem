/**
 * Application Error class for structured error handling
 * Extends AppError from errorHandler with additional context
 */
export class ApplicationError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.code = code; // Error code for client handling (e.g., 'ACTIVE_VISIT_EXISTS', 'ORPHAN_TOKEN')
    this.details = details; // Additional error context
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
      timestamp: new Date().toISOString(),
    };
  }
}
