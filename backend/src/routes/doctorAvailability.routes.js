import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import DoctorAvailabilityService from '../services/DoctorAvailability.service.js';

const router = express.Router();
const doctorAvailabilityService = new DoctorAvailabilityService();

/**
 * @route   GET /api/doctor-availability
 * @desc    Get all doctor availability records
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.get('/',
  authenticate,
  authorize(['admin', 'receptionist', 'doctor']),
  asyncHandler(async (req, res) => {
    const { doctor_id } = req.query;
    
    const availability = await doctorAvailabilityService.getAllAvailability({
      doctorId: doctor_id
    });

    res.status(200).json({
      success: true,
      message: 'Doctor availability retrieved successfully',
      data: availability
    });
  })
);

/**
 * @route   GET /api/doctor-availability/doctor/:doctorId
 * @desc    Get availability for a specific doctor
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.get('/doctor/:doctorId',
  authenticate,
  authorize(['admin', 'receptionist', 'doctor']),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    
    const availability = await doctorAvailabilityService.getAvailabilityByDoctorId(doctorId);

    res.status(200).json({
      success: true,
      message: 'Doctor availability retrieved successfully',
      data: availability
    });
  })
);

/**
 * @route   GET /api/doctor-availability/available-doctors
 * @desc    Get doctors available at a specific day and time
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.get('/available-doctors',
  authenticate,
  authorize(['admin', 'receptionist']),
  asyncHandler(async (req, res) => {
    const { day_of_week, time } = req.query;

    if (!day_of_week || !time) {
      return res.status(400).json({
        success: false,
        message: 'day_of_week and time parameters are required'
      });
    }
    
    const availableDoctors = await doctorAvailabilityService.getAvailableDoctors(
      day_of_week,
      time
    );

    res.status(200).json({
      success: true,
      message: 'Available doctors retrieved successfully',
      data: availableDoctors
    });
  })
);

/**
 * @route   GET /api/doctor-availability/check-availability
 * @desc    Check if a doctor is available at a specific time
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.get('/check-availability',
  authenticate,
  authorize(['admin', 'receptionist']),
  asyncHandler(async (req, res) => {
    const { doctor_id, day_of_week, time } = req.query;

    if (!doctor_id || !day_of_week || !time) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id, day_of_week, and time parameters are required'
      });
    }
    
    const isAvailable = await doctorAvailabilityService.isDoctorAvailable(
      doctor_id,
      day_of_week,
      time
    );

    res.status(200).json({
      success: true,
      message: 'Doctor availability checked successfully',
      data: { isAvailable }
    });
  })
);

/**
 * @route   GET /api/doctor-availability/:doctorId/check-slot
 * @desc    Check if a specific time slot is available for booking
 * @access  Private (Receptionist, Admin)
 */
router.get('/:doctorId/check-slot',
  authenticate,
  authorize(['admin', 'receptionist']),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'date and time parameters are required'
      });
    }

    const result = await doctorAvailabilityService.checkTimeSlotAvailability(doctorId, date, time);

    res.status(200).json({
      success: true,
      message: 'Time slot availability checked successfully',
      data: result
    });
  })
);

/**
 * @route   GET /api/doctor-availability/:doctorId/available-slots
 * @desc    Get all available time slots for a doctor on a specific date
 * @access  Private (Receptionist, Admin)
 */
router.get('/:doctorId/available-slots',
  authenticate,
  authorize(['admin', 'receptionist']),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date parameter is required'
      });
    }

    const result = await doctorAvailabilityService.getAvailableTimeSlots(doctorId, date);

    res.status(200).json({
      success: true,
      message: 'Available time slots retrieved successfully',
      data: result
    });
  })
);

/**
 * @route   POST /api/doctor-availability
 * @desc    Create new doctor availability record
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.post('/',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const availability = await doctorAvailabilityService.createAvailability(req.body);

    res.status(201).json({
      success: true,
      message: 'Doctor availability created successfully',
      data: availability
    });
  })
);

/**
 * @route   PUT /api/doctor-availability/:id
 * @desc    Update doctor availability record
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.put('/:id',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const availability = await doctorAvailabilityService.updateAvailability(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Doctor availability updated successfully',
      data: availability
    });
  })
);

/**
 * @route   DELETE /api/doctor-availability/:id
 * @desc    Delete doctor availability record
 * @access  Public (for development) - TODO: Re-enable auth when ready
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await doctorAvailabilityService.deleteAvailability(id);

    res.status(200).json({
      success: true,
      message: 'Doctor availability deleted successfully'
    });
  })
);

export default router;