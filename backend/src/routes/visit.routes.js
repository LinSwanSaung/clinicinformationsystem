import express from 'express';
import VisitService from '../services/Visit.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const visitService = new VisitService();

/**
 * @route   GET /api/visits/patient/:patientId/history
 * @desc    Get comprehensive visit history for a patient
 * @access  Private (All healthcare staff)
 */
router.get('/patient/:patientId/history',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { 
      limit = 50, 
      offset = 0, 
      includeCompleted = 'true' 
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeCompleted: includeCompleted === 'true'
    };

    const result = await visitService.getPatientVisitHistory(patientId, options);

    res.status(200).json({
      success: true,
      message: 'Patient visit history retrieved successfully',
      data: result.data,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.total
      }
    });
  })
);

/**
 * @route   GET /api/visits/:id/details
 * @desc    Get single visit with all details
 * @access  Private (All healthcare staff)
 */
router.get('/:id/details',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await visitService.getVisitDetails(id);

    res.status(200).json({
      success: true,
      message: 'Visit details retrieved successfully',
      data: result.data
    });
  })
);

/**
 * @route   GET /api/visits
 * @desc    Get all visits with filtering
 * @access  Private (Admin, Doctor)
 */
router.get('/',
  authenticate,
  authorize('admin', 'doctor'),
  asyncHandler(async (req, res) => {
    const { 
      limit = 50, 
      offset = 0, 
      status,
      doctor_id,
      start_date,
      end_date
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      doctor_id,
      start_date,
      end_date
    };

    const result = await visitService.getAllVisits(options);

    res.status(200).json({
      success: true,
      message: 'Visits retrieved successfully',
      data: result.data,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.total
      }
    });
  })
);

/**
 * @route   POST /api/visits
 * @desc    Create new visit
 * @access  Private (Doctor, Nurse, Admin)
 */
router.post('/',
  authenticate,
  authorize('admin', 'doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const visitData = {
      ...req.body,
      created_by: req.user.id
    };

    const result = await visitService.createVisit(visitData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  })
);

/**
 * @route   PUT /api/visits/:id
 * @desc    Update visit
 * @access  Private (Doctor, Admin)
 */
router.put('/:id',
  authenticate,
  authorize('admin', 'doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const result = await visitService.updateVisit(id, updateData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  })
);

/**
 * @route   POST /api/visits/:id/complete
 * @desc    Complete visit with final calculations
 * @access  Private (Doctor, Admin)
 */
router.post('/:id/complete',
  authenticate,
  authorize('admin', 'doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const completionData = {
      ...req.body,
      completed_by: req.user.id
    };

    const result = await visitService.completeVisit(id, completionData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  })
);

/**
 * @route   GET /api/visits/statistics
 * @desc    Get visit statistics
 * @access  Private (Admin, Doctor)
 */
router.get('/statistics',
  authenticate,
  authorize('admin', 'doctor'),
  asyncHandler(async (req, res) => {
    const { doctor_id, start_date, end_date } = req.query;

    const options = {
      doctor_id,
      start_date,
      end_date
    };

    const result = await visitService.getVisitStatistics(options);

    res.status(200).json({
      success: true,
      message: 'Visit statistics retrieved successfully',
      data: result.data
    });
  })
);

/**
 * @route   DELETE /api/visits/:id
 * @desc    Delete visit
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await visitService.deleteVisit(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  })
);

export default router;