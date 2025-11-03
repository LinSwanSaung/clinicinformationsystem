import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import PatientPortalService from '../services/PatientPortal.service.js';

const router = express.Router();

router.use(authenticate, authorize('patient'));

/**
 * @route   GET /api/me/profile
 * @desc    Get linked patient + account profile
 * @access  Private (Patient)
 */
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const data = await PatientPortalService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  })
);

/**
 * @route   GET /api/me/queue
 * @desc    Get patient's current queue status
 * @access  Private (Patient)
 */
router.get(
  '/queue',
  asyncHandler(async (req, res) => {
    const data = await PatientPortalService.getQueueStatus(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  })
);

/**
 * @route   GET /api/me/visits
 * @desc    Get patient's visit history
 * @access  Private (Patient)
 */
router.get(
  '/visits',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;

    const visits = await PatientPortalService.getVisitHistory(req.user.id, { limit, offset });

    res.status(200).json({
      success: true,
      data: visits,
    });
  })
);

/**
 * @route   GET /api/me/vitals/latest
 * @desc    Get latest vitals record
 * @access  Private (Patient)
 */
router.get(
  '/vitals/latest',
  asyncHandler(async (req, res) => {
    const vitals = await PatientPortalService.getLatestVitals(req.user.id);
    res.status(200).json({
      success: true,
      data: vitals,
    });
  })
);

/**
 * @route   GET /api/me/prescriptions
 * @desc    Get patient prescriptions
 * @access  Private (Patient)
 */
router.get(
  '/prescriptions',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const prescriptions = await PatientPortalService.getPrescriptions(req.user.id, includeInactive);
    res.status(200).json({
      success: true,
      data: prescriptions,
    });
  })
);

/**
 * @route   GET /api/me/appointments/upcoming
 * @desc    Get upcoming appointments for patient
 * @access  Private (Patient)
 */
router.get(
  '/appointments/upcoming',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    const appointments = await PatientPortalService.getUpcomingAppointments(req.user.id, { limit });
    res.status(200).json({
      success: true,
      data: appointments,
    });
  })
);

export default router;
