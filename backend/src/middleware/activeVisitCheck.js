import VisitModel from '../models/Visit.model.js';
import logger from '../config/logger.js';

/**
 * Middleware to check if a patient has an active visit before allowing data modifications
 * This ensures data integrity and security by preventing unauthorized data entry
 *
 * Usage: Apply this middleware to routes that create/update patient medical data
 */

const visitModel = new VisitModel();

/**
 * Check if patient has an ACTIVE visit (in_progress status only)
 * Doctors can only add/edit data during active consultations
 * Looks for patient_id in request body or params
 */
export const requireActiveVisit = async (req, res, next) => {
  try {
    // Extract patient_id from request body or params
    const patientId = req.body.patient_id || req.params.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
        code: 'PATIENT_ID_REQUIRED',
      });
    }

    // Check for ACTIVE visit (in_progress status only)
    const activeVisit = await visitModel.getPatientActiveVisit(patientId);

    if (!activeVisit) {
      return res.status(403).json({
        success: false,
        message:
          'Cannot add or modify patient data without an active visit. Please ensure the patient has an active consultation.',
        code: 'NO_ACTIVE_VISIT',
        patientId: patientId,
      });
    }

    // Attach active visit to request for use in route handlers
    req.activeVisit = activeVisit;
    req.activeVisitId = activeVisit.id;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    logger.error('Error checking active visit:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify active visit status',
      error: error.message,
    });
  }
};

/**
 * Optional: Check active visit but don't block if missing
 * Just attaches visit info if available
 */
export const checkActiveVisit = async (req, res, next) => {
  try {
    const patientId = req.body.patient_id || req.params.patientId;

    if (patientId) {
      const activeVisit = await visitModel.getPatientActiveVisit(patientId);
      if (activeVisit) {
        req.activeVisit = activeVisit;
        req.activeVisitId = activeVisit.id;
      }
    }

    next();
  } catch (error) {
    logger.error('Error checking active visit (non-blocking):', error);
    // Don't block request on error, just continue
    next();
  }
};

export default {
  requireActiveVisit,
  checkActiveVisit,
};
