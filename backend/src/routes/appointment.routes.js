import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import AppointmentService from '../services/Appointment.service.js';

const router = express.Router();
const appointmentService = new AppointmentService();

/**
 * @route   GET /api/appointments
 * @desc    Get appointments with optional filtering
 * @access  Private (All roles)
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { date, patient_id, doctor_id } = req.query;
    
    const appointments = await appointmentService.getAllAppointments({
      date,
      patient_id,
      doctor_id
    });

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments
    });
  })
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private (All roles)
 */
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const appointment = await appointmentService.getAppointmentById(id);

    res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment
    });
  })
);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private (Receptionist, Admin)
 */
router.post('/',
  authenticate,
  authorize('receptionist', 'admin'),
  asyncHandler(async (req, res) => {
    const appointmentData = {
      ...req.body,
      created_by: req.user.id
    };

    const newAppointment = await appointmentService.createAppointment(appointmentData);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment
    });
  })
);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private (Receptionist, Admin)
 */
router.put('/:id',
  authenticate,
  authorize('receptionist', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedAppointment = await appointmentService.updateAppointment(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  })
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment
 * @access  Private (Receptionist, Admin)
 */
router.delete('/:id',
  authenticate,
  authorize('receptionist', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await appointmentService.deleteAppointment(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  })
);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Doctor, Nurse, Receptionist)
 */
router.put('/:id/status',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Status update request received:', { id, status }); // Debug log

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updatedAppointment
    });
  })
);

/**
 * @route   GET /api/appointments/doctor/:doctorId/slots
 * @desc    Get available time slots for a doctor on a specific date
 * @access  Private (Receptionist, Admin)
 */
router.get('/doctor/:doctorId/slots',
  authenticate,
  authorize('receptionist', 'admin'),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const availableSlots = await appointmentService.getAvailableSlots(doctorId, date);

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: availableSlots
    });
  })
);

export default router;
