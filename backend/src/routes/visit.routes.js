import express from 'express';
import VisitService from '../services/Visit.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();
const visitService = new VisitService();

/**
 * @route   GET /api/visits/patient/:patientId/history
 * @desc    Get comprehensive visit history for a patient
 * @access  Private (All healthcare staff)
 */
router.get(
  '/patient/:patientId/history',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const {
      limit = 50,
      offset = 0,
      includeCompleted = 'true',
      includeInProgress = 'false',
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeCompleted: includeCompleted === 'true',
      includeInProgress: includeInProgress === 'true',
    };

    const result = await visitService.getPatientVisitHistory(patientId, options);

    res.status(200).json({
      success: true,
      message: 'Patient visit history retrieved successfully',
      data: result.data,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.total,
      },
    });
  })
);

/**
 * @route   GET /api/visits/:id/details
 * @desc    Get single visit with all details
 * @access  Private (All healthcare staff)
 */
router.get(
  '/:id/details',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await visitService.getVisitDetails(id);

    // Note: Viewing is not logged to avoid excessive audit log entries

    res.status(200).json({
      success: true,
      message: 'Visit details retrieved successfully',
      data: result.data,
    });
  })
);

/**
 * @route   GET /api/visits
 * @desc    Get all visits with filtering
 * @access  Private (Admin, Doctor)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, status, doctor_id, start_date, end_date } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      doctor_id,
      start_date,
      end_date,
    };

    const result = await visitService.getAllVisits(options);

    res.status(200).json({
      success: true,
      message: 'Visits retrieved successfully',
      data: result.data,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.total,
      },
    });
  })
);

/**
 * @route   POST /api/visits
 * @desc    Create new visit
 * @access  Private (Doctor, Nurse, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'nurse'),
  asyncHandler(async (req, res) => {
    const visitData = {
      ...req.body,
      created_by: req.user.id,
    };

    const result = await visitService.createVisit(visitData);

    // Log create visit
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'CREATE',
        entity: 'visits',
        recordId: result?.data?.id || null,
        patientId: result?.data?.patient_id || visitData.patient_id || null,
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {
      // Ignore audit log errors - don't fail the request if logging fails
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  })
);

/**
 * @route   PUT /api/visits/:id
 * @desc    Update visit
 * @access  Private (Doctor, Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id,
    };

    const result = await visitService.updateVisit(id, updateData);

    // Log update visit
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'UPDATE',
        entity: 'visits',
        recordId: id,
        patientId: result?.data?.patient_id || null,
        result: 'success',
        meta: { changed_fields: Object.keys(updateData) },
        ip: req.ip,
      });
    } catch (e) {
      // Ignore audit log errors - don't fail the request if logging fails
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  })
);

/**
 * @route   POST /api/visits/:id/complete
 * @desc    Complete visit with final calculations
 * @access  Private (Doctor, Admin)
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const completionData = {
      ...req.body,
      completed_by: req.user.id,
    };

    const result = await visitService.completeVisit(id, completionData);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  })
);

/**
 * @route   GET /api/visits/statistics
 * @desc    Get visit statistics
 * @access  Private (Admin, Doctor)
 */
router.get(
  '/statistics',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const { doctor_id, start_date, end_date } = req.query;

    const options = {
      doctor_id,
      start_date,
      end_date,
    };

    const result = await visitService.getVisitStatistics(options);

    res.status(200).json({
      success: true,
      message: 'Visit statistics retrieved successfully',
      data: result.data,
    });
  })
);

/**
 * @route   DELETE /api/visits/:id
 * @desc    Delete visit
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await visitService.deleteVisit(id);

    // Log delete visit
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'DELETE',
        entity: 'visits',
        recordId: id,
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {
      // Ignore audit log errors - don't fail the request if logging fails
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * @route   GET /api/visits/:visitId/export/pdf
 * @desc    Export single visit summary as PDF
 * @access  Private (Patient themselves or healthcare staff)
 */
router.get(
  '/:visitId/export/pdf',
  authenticate,
  asyncHandler(async (req, res) => {
    const { visitId } = req.params;

    const result = await visitService.exportSingleVisitPDF(visitId, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.pdf);
  })
);

/**
 * @route   GET /api/visits/patient/:patientId/export/csv
 * @desc    Export patient visit history as CSV
 * @access  Private (Patient themselves or healthcare staff)
 */
router.get(
  '/patient/:patientId/export/csv',
  authenticate,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check authorization: patient can only access their own data
    if (req.user.role === 'patient' && req.user.patient_id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only export your own visit history',
      });
    }

    const result = await visitService.exportVisitHistoryCSV(patientId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="visit-history-${patientId}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(result.csv);
  })
);

/**
 * @route   GET /api/visits/patient/:patientId/export/pdf
 * @desc    Export patient visit history as PDF
 * @access  Private (Patient themselves or healthcare staff)
 */
router.get(
  '/patient/:patientId/export/pdf',
  authenticate,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check authorization: patient can only access their own data
    if (req.user.role === 'patient' && req.user.patient_id !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only export your own visit history',
      });
    }

    const result = await visitService.exportVisitHistoryPDF(patientId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="visit-history-${patientId}-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.status(200).send(result.pdf);
  })
);

export default router;
