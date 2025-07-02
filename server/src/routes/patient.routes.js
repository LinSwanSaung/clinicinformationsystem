import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import PatientService from '../services/Patient.service.js';
import { validatePatient, validatePatientUpdate } from '../validators/patient.validator.js';

const router = express.Router();

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Private (All roles)
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, role } = req.query;
    
    const options = {
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    let patients;
    
    if (search) {
      patients = await PatientService.searchPatients(search, options);
    } else {
      patients = await PatientService.getAllPatients(options);
    }
    
    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: patients.length
      }
    });
  })
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private (All roles)
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.getPatientById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: patient
    });
  })
);

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 * @access  Private (Receptionist, Admin)
 */
router.post('/',
  authenticate,
  authorize('receptionist', 'admin'),
  validatePatient,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.createPatient(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  })
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private (Receptionist, Admin)
 */
router.put('/:id',
  authenticate,
  authorize('receptionist', 'admin'),
  validatePatientUpdate,
  asyncHandler(async (req, res) => {
    const patient = await PatientService.updatePatient(req.params.id, req.body, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  })
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete patient
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    await PatientService.deletePatient(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  })
);

/**
 * @route   GET /api/patients/search/:term
 * @desc    Search patients
 * @access  Private (All roles)
 */
router.get('/search/:term',
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const patients = await PatientService.searchPatients(req.params.term, {
      limit: Math.min(parseInt(limit), 50)
    });
    
    res.status(200).json({
      success: true,
      data: patients
    });
  })
);

/**
 * @route   GET /api/patients/:id/medical-history
 * @desc    Get patient's medical history
 * @access  Private (Doctor, Nurse, Admin)
 */
router.get('/:id/medical-history',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  asyncHandler(async (req, res) => {
    const history = await PatientService.getPatientMedicalHistory(req.params.id);
    
    res.status(200).json({
      success: true,
      data: history
    });
  })
);

export default router;
