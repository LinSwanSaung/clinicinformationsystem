import Joi from 'joi';
import { validate, commonSchemas } from './base.validator.js';

/**
 * Patient creation validation schema
 */
const createPatientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  date_of_birth: commonSchemas.date,
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  id_number: Joi.string().trim().max(50).optional(),
  contact: commonSchemas.phone,
  email: Joi.string().email().optional(),
  address: Joi.string().trim().max(500).optional(),
  medical_history: Joi.array().items(Joi.string().trim()).optional(),
  allergies: Joi.array().items(Joi.string().trim()).optional(),
  medications: Joi.string().trim().max(1000).optional(),
  photo: Joi.string().uri().optional(),
  avatar_color: Joi.string().pattern(/^bg-\w+-\d{3}$/).optional()
});

/**
 * Patient update validation schema
 */
const updatePatientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  date_of_birth: Joi.date().iso().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  id_number: Joi.string().trim().max(50).optional(),
  contact: commonSchemas.phone.optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().max(500).optional(),
  medical_history: Joi.array().items(Joi.string().trim()).optional(),
  allergies: Joi.array().items(Joi.string().trim()).optional(),
  medications: Joi.string().trim().max(1000).optional(),
  photo: Joi.string().uri().optional(),
  avatar_color: Joi.string().pattern(/^bg-\w+-\d{3}$/).optional()
}).min(1); // At least one field must be provided for update

/**
 * Patient search validation schema
 */
const searchPatientSchema = Joi.object({
  term: Joi.string().trim().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// Export validation middleware
export const validatePatient = validate(createPatientSchema);
export const validatePatientUpdate = validate(updatePatientSchema);
export const validatePatientSearch = validate(searchPatientSchema, 'params');
