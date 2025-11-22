import Joi from 'joi';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Validation middleware factory
 * Creates validation middleware for different validation schemas
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new AppError(`Validation Error: ${errorMessage}`, 400);
    }
    
    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/).optional(),
  date: Joi.date().iso().required(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }
};
