import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import PatientService from '../services/Patient.service.js';
import logger from '../config/logger.js';
import { validatePatient, validatePatientUpdate } from '../validators/patient.validator.js';

const router = express.Router();

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Private (All roles)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, 'doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, search } = req.query;

    const options = {
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: 'created_at',
      ascending: false, // Show newest patients first
    };

    let result;

    try {
      if (search) {
        result = await PatientService.searchPatients(search, options);
      } else {
        result = await PatientService.getAllPatients(options);
      }

      // Ensure result is always an array
      const patients = Array.isArray(result) ? result : [];

      res.status(200).json({
        success: true,
        data: patients,
        total: patients.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: patients.length,
        },
      });
    } catch (error) {
      logger.error('Error in GET /patients:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch patients',
      });
    }
  })
);

/**
 * @route   GET /api/patients/doctor
 * @desc    Get patients assigned to the current doctor
 * @access  Private (Doctor only)
 */
router.get(
  '/doctor',
  authenticate,
  authorize(ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const doctorId = req.user.id;
    const { page = 1, limit = 100 } = req.query;

    const options = {
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: 'created_at',
      ascending: false,
    };

    try {
      // Get patients assigned to this doctor
      const patients = await PatientService.getDoctorPatients(doctorId, options);

      res.status(200).json({
        success: true,
        data: Array.isArray(patients) ? patients : [],
        total: Array.isArray(patients) ? patients.length : 0,
      });
    } catch (error) {
      logger.error('Error in GET /patients/doctor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor patients',
        error: error.message,
      });
    }
  })
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.getPatientById(req.params.id);

    // Note: Viewing is not logged to avoid excessive audit log entries

    res.status(200).json({
      success: true,
      data: patient,
    });
  })
);

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 * @access  Private (Receptionist, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validatePatient,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.createPatient(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient,
    });
  })
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private (Receptionist, Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validatePatientUpdate,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.updatePatient(req.params.id, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient,
    });
  })
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete patient
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await PatientService.deletePatient(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  })
);

/**
 * @route   GET /api/patients/search/:term
 * @desc    Search patients
 * @access  Private (All roles)
 */
router.get(
  '/search/:term',
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const patients = await PatientService.searchPatients(req.params.term, {
      limit: Math.min(parseInt(limit), 50),
    });

    res.status(200).json({
      success: true,
      data: patients,
    });
  })
);

/**
 * @route   GET /api/patients/:id/medical-history
 * @desc    Get patient's medical history
 * @access  Private (Doctor, Nurse, Admin)
 */
router.get(
  '/:id/medical-history',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  asyncHandler(async (req, res) => {
    const history = await PatientService.getPatientMedicalHistory(req.params.id);

    res.status(200).json({
      success: true,
      data: history,
    });
  })
);

export default router;
