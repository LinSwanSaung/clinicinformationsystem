import Joi from 'joi';
import { validate } from './base.validator.js';

// ===============================================
// QUEUE TOKEN VALIDATION SCHEMAS
// ===============================================

const queueTokenSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  doctor_id: Joi.string().uuid().required(),
  appointment_id: Joi.string().uuid().optional(),
  priority: Joi.number().integer().min(1).max(5).optional().default(1),
  estimated_wait_time: Joi.number().integer().min(0).max(480).optional().default(7),
});

const queueActionSchema = Joi.object({
  tokenId: Joi.string().uuid().required(),
});

const doctorIdSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
});

const patientIdSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
});

// ===============================================
// QUEUE STATUS VALIDATION SCHEMAS
// ===============================================

const queueStatusQuerySchema = Joi.object({
  date: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const patientQueueInfoQuerySchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
});

// ===============================================
// ANALYTICS VALIDATION SCHEMAS
// ===============================================

const queueAnalyticsQuerySchema = Joi.object({
  startDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  endDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      const startDate = helpers.state.ancestors[0].startDate;
      if (startDate && new Date(value) < new Date(startDate)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'End date validation'),
});

// ===============================================
// BULK OPERATIONS VALIDATION SCHEMAS
// ===============================================

const bulkTokensSchema = Joi.object({
  tokens: Joi.array()
    .items(
      Joi.object({
        patient_id: Joi.string().uuid().required(),
        doctor_id: Joi.string().uuid().required(),
        appointment_id: Joi.string().uuid().optional(),
        priority: Joi.number().integer().min(1).max(5).optional().default(1),
      })
    )
    .min(1)
    .max(50)
    .required(),
});

const bulkStatusUpdateSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        tokenId: Joi.string().uuid().required(),
        status: Joi.string().valid('serving', 'completed', 'missed', 'cancelled').required(),
      })
    )
    .min(1)
    .max(50)
    .required(),
});

// ===============================================
// APPOINTMENT PROCESSING VALIDATION SCHEMAS
// ===============================================

const processAppointmentsSchema = Joi.object({
  date: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ===============================================
// QUEUE REORDER VALIDATION SCHEMAS
// ===============================================

const queueReorderSchema = Joi.object({
  queueUpdates: Joi.array()
    .items(
      Joi.object({
        tokenId: Joi.string().uuid().required(),
        newPosition: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

// ===============================================
// EMERGENCY QUEUE VALIDATION SCHEMAS
// ===============================================

const emergencyTokenSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  doctor_id: Joi.string().uuid().required(),
  emergency_reason: Joi.string().min(10).max(500).required(),
  severity_level: Joi.string().valid('critical', 'urgent', 'semi-urgent').required(),
});

// ===============================================
// WAIT TIME VALIDATION SCHEMAS
// ===============================================

const waitTimeUpdateSchema = Joi.object({
  averageConsultationMinutes: Joi.number().integer().min(5).max(120).optional(),
  breakTimeMinutes: Joi.number().integer().min(0).max(60).optional(),
});

// ===============================================
// NOTIFICATION VALIDATION SCHEMAS
// ===============================================

const queueNotificationSchema = Joi.object({
  tokenId: Joi.string().uuid().required(),
  notificationType: Joi.string().valid('sms', 'email', 'push', 'all').required(),
  message: Joi.string().min(10).max(160).optional(),
});

// ===============================================
// EXPORT VALIDATION SCHEMAS
// ===============================================

const queueExportQuerySchema = Joi.object({
  startDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  endDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  format: Joi.string().valid('json', 'csv', 'pdf').optional().default('json'),
  includePatientDetails: Joi.boolean().optional().default(false),
});

// ===============================================
// VALIDATION MIDDLEWARE EXPORTS
// ===============================================

export const validateQueueToken = validate(queueTokenSchema);
export const validateQueueAction = validate(queueActionSchema, 'params');
export const validateDoctorId = validate(doctorIdSchema, 'params');
export const validatePatientId = validate(patientIdSchema, 'params');
export const validateQueueStatus = validate(queueStatusQuerySchema, 'query');
export const validatePatientQueueInfo = validate(patientQueueInfoQuerySchema, 'query');
export const validateQueueAnalytics = validate(queueAnalyticsQuerySchema, 'query');
export const validateBulkTokens = validate(bulkTokensSchema);
export const validateBulkStatusUpdate = validate(bulkStatusUpdateSchema);
export const validateProcessAppointments = validate(processAppointmentsSchema);
export const validateQueueReorder = validate(queueReorderSchema);
export const validateEmergencyToken = validate(emergencyTokenSchema);
export const validateWaitTimeUpdate = validate(waitTimeUpdateSchema);
export const validateQueueNotification = validate(queueNotificationSchema);
export const validateQueueExport = validate(queueExportQuerySchema, 'query');
