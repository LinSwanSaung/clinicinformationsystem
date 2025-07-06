import Joi from 'joi';
import { validate, commonSchemas } from './base.validator.js';

/**
 * Patient creation validation schema
 */
const createPatientSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(100).required(),
  last_name: Joi.string().trim().min(2).max(100).required(),
  date_of_birth: commonSchemas.date,
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  phone: commonSchemas.phone.optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().max(500).optional(),
  emergency_contact_name: Joi.string().trim().max(200).optional(),
  emergency_contact_phone: commonSchemas.phone.optional(),
  emergency_contact_relationship: Joi.string().trim().max(100).optional(),
  blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.string().trim().max(1000).optional(),
  medical_conditions: Joi.string().trim().max(1000).optional(),
  current_medications: Joi.string().trim().max(1000).optional(),
  insurance_provider: Joi.string().trim().max(200).optional(),
  insurance_number: Joi.string().trim().max(100).optional()
});

/**
 * Patient update validation schema
 */
const updatePatientSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(100).optional(),
  last_name: Joi.string().trim().min(2).max(100).optional(),
  date_of_birth: Joi.date().iso().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  phone: commonSchemas.phone.optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().max(500).optional(),
  emergency_contact_name: Joi.string().trim().max(200).optional(),
  emergency_contact_phone: commonSchemas.phone.optional(),
  emergency_contact_relationship: Joi.string().trim().max(100).optional(),
  blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.string().trim().max(1000).optional(),
  medical_conditions: Joi.string().trim().max(1000).optional(),
  current_medications: Joi.string().trim().max(1000).optional(),
  insurance_provider: Joi.string().trim().max(200).optional(),
  insurance_number: Joi.string().trim().max(100).optional()
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
