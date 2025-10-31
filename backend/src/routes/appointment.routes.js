import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import AppointmentService from '../services/Appointment.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';

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
    const filters = {
      date,
      patient_id,
      doctor_id
    };

    if (req.user.role === 'patient') {
      if (!req.user.patient_id) {
        throw new AppError('Patient record not linked to account', 400);
      }

      if (patient_id && patient_id !== req.user.patient_id) {
        throw new AppError('Access denied to requested appointments', 403);
      }

      filters.patient_id = req.user.patient_id;
    }

    const appointments = await appointmentService.getAllAppointments(filters);

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

    // Note: Viewing is not logged to avoid excessive audit log entries

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

    // Log appointment create
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'CREATE',
        entity: 'appointments',
        recordId: newAppointment?.id || null,
        patientId: newAppointment?.patient_id || appointmentData.patient_id || null,
        result: 'success',
        ip: req.ip
      });
    } catch (e) {}

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

    // Log appointment update
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'UPDATE',
        entity: 'appointments',
        recordId: id,
        patientId: updatedAppointment?.patient_id || null,
        result: 'success',
        meta: { changed_fields: Object.keys(updateData) },
        ip: req.ip
      });
    } catch (e) {}

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

    // Log appointment cancel/delete
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'CANCEL',
        entity: 'appointments',
        recordId: id,
        result: 'success',
        ip: req.ip
      });
    } catch (e) {}

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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(id, status);

    // Log status change
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'UPDATE',
        entity: 'appointments',
        recordId: id,
        patientId: updatedAppointment?.patient_id || null,
        result: 'success',
        meta: { status: status },
        ip: req.ip
      });
    } catch (e) {}

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
