/**
 * Shared Zod Schemas
 * Centralized validation schemas for entities across the application.
 */

import { z } from 'zod';

// Role Schema
export const roleSchema = z.enum([
  'admin',
  'receptionist',
  'doctor',
  'nurse',
  'cashier',
  'pharmacist',
]);

// Patient Schema
export const patientSchema = z.object({
  id: z.number().optional(),
  patient_id: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().or(z.date()),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Visit Schema
export const visitSchema = z.object({
  id: z.number().optional(),
  patient_id: z.number(),
  doctor_id: z.number(),
  visit_date: z.string().or(z.date()),
  visit_type: z.enum(['consultation', 'follow-up', 'emergency']),
  chief_complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Invoice Schema
export const invoiceSchema = z.object({
  id: z.number().optional(),
  invoice_number: z.string().optional(),
  patient_id: z.number(),
  visit_id: z.number().optional(),
  total_amount: z.number().positive(),
  paid_amount: z.number().min(0).default(0),
  payment_status: z.enum(['pending', 'partial', 'paid', 'cancelled']),
  payment_method: z.enum(['cash', 'card', 'insurance', 'other']).optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        total: z.number().positive(),
      })
    )
    .optional(),
  notes: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Prescription Schema
export const prescriptionSchema = z.object({
  id: z.number().optional(),
  visit_id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      instructions: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Appointment Schema
export const appointmentSchema = z.object({
  id: z.number().optional(),
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.string().or(z.date()),
  appointment_time: z.string(),
  duration: z.number().positive().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  notes: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export default {
  roleSchema,
  patientSchema,
  visitSchema,
  invoiceSchema,
  prescriptionSchema,
  appointmentSchema,
};
