import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireActiveVisit } from '../middleware/activeVisitCheck.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import VitalsService from '../services/Vitals.service.js';

const router = express.Router();
const vitalsService = new VitalsService();

/**
 * @route   POST /api/vitals
 * @desc    Record patient vitals
 * @access  Private (Nurse, Doctor)
 * @security Requires patient to have an active visit
 */
router.post(
  '/',
  authenticate,
  authorize('nurse', 'doctor'),
  requireActiveVisit,
  asyncHandler(async (req, res) => {
    const vitalsData = req.body;
    const recordedBy = req.user.id;

    const vitals = await vitalsService.createVitals(vitalsData, recordedBy);

    res.status(201).json({
      success: true,
      message: 'Vitals recorded successfully',
      data: vitals,
    });
  })
);

/**
 * @route   GET /api/vitals/patient/:patientId
 * @desc    Get patient vitals history
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { limit } = req.query;

    const vitals = await vitalsService.getPatientVitalsHistory(
      patientId,
      limit ? parseInt(limit) : null
    );

    res.status(200).json({
      success: true,
      message: 'Vitals history retrieved successfully',
      data: vitals,
    });
  })
);

/**
 * @route   GET /api/vitals/patient/:patientId/latest
 * @desc    Get latest vitals for a patient
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/patient/:patientId/latest',
  authenticate,
  authorize('doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    const vitals = await vitalsService.getLatestPatientVitals(patientId);

    res.status(200).json({
      success: true,
      message: 'Latest vitals retrieved successfully',
      data: vitals,
    });
  })
);

/**
 * @route   GET /api/vitals/visit/:visitId
 * @desc    Get vitals for a specific visit
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/visit/:visitId',
  authenticate,
  authorize('doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { visitId } = req.params;

    const vitals = await vitalsService.getVisitVitals(visitId);

    res.status(200).json({
      success: true,
      message: 'Visit vitals retrieved successfully',
      data: vitals,
    });
  })
);

/**
 * @route   GET /api/vitals/patient/:patientId/current-visit
 * @desc    Get vitals for patient's current active visit
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/patient/:patientId/current-visit',
  authenticate,
  authorize('doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    const vitals = await vitalsService.getCurrentVisitVitals(patientId);

    res.status(200).json({
      success: true,
      message: vitals
        ? 'Current visit vitals retrieved successfully'
        : 'No vitals found for current visit',
      data: vitals,
    });
  })
);

/**
 * @route   PUT /api/vitals/:id
 * @desc    Update vitals record
 * @access  Private (Nurse, Doctor)
 */
router.put(
  '/:id',
  authenticate,
  authorize('nurse', 'doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vitalsData = req.body;
    const recordedBy = req.user.id;

    const vitals = await vitalsService.updateVitals(id, vitalsData, recordedBy);

    res.status(200).json({
      success: true,
      message: 'Vitals updated successfully',
      data: vitals,
    });
  })
);

export default router;
