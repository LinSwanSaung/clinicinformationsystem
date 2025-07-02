import Joi from 'joi';
import { validate, commonSchemas } from './base.validator.js';

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required()
});

/**
 * Register validation schema
 */
const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  first_name: Joi.string().trim().min(1).max(50).required(),
  last_name: Joi.string().trim().min(1).max(50).required(),
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'receptionist').required(),
  phone: commonSchemas.phone,
  specialty: Joi.string().trim().max(100).when('role', {
    is: 'doctor',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: commonSchemas.password,
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      'any.only': 'Confirm password must match new password'
    })
});

// Export validation middleware
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validateChangePassword = validate(changePasswordSchema);
