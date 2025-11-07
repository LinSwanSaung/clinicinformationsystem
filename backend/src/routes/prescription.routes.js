import express from 'express';
import PrescriptionService from '../services/Prescription.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import { authorize } from '../middleware/auth.js';
import { requireActiveVisit } from '../middleware/activeVisitCheck.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * @route   POST /api/prescriptions
 * @desc    Create a new prescription
 * @access  Doctor only
 * @security Requires patient to have an active visit
 */
router.post(
  '/',
  authorize('doctor'),
  requireActiveVisit,
  asyncHandler(async (req, res) => {
    const result = await PrescriptionService.createPrescription(req.body);
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'CREATE',
        entity: 'prescriptions',
        recordId: result?.id || null,
        patientId: req.body?.patient_id || null,
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {}
    res.status(201).json(result);
  })
);

/**
 * @route   GET /api/prescriptions/patient/:patientId
 * @desc    Get all prescriptions for a patient
 * @access  Doctor, Nurse, Receptionist
 */
router.get(
  '/patient/:patientId',
  authorize('doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { includeInactive } = req.query;
    const result = await PrescriptionService.getPatientPrescriptions(
      patientId,
      includeInactive === 'true'
    );
    res.json(result);
  })
);

/**
 * @route   GET /api/prescriptions/visit/:visitId
 * @desc    Get all prescriptions for a visit
 * @access  Doctor, Nurse, Receptionist
 */
router.get(
  '/visit/:visitId',
  authorize('doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    const result = await PrescriptionService.getVisitPrescriptions(visitId);
    res.json(result);
  })
);

/**
 * @route   PATCH /api/prescriptions/:prescriptionId/status
 * @desc    Update prescription status
 * @access  Doctor only
 */
router.patch(
  '/:prescriptionId/status',
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const { status } = req.body;
    const result = await PrescriptionService.updatePrescriptionStatus(prescriptionId, status);
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'UPDATE',
        entity: 'prescriptions',
        recordId: prescriptionId,
        result: 'success',
        meta: { status },
        ip: req.ip,
      });
    } catch (e) {}
    res.json(result);
  })
);

/**
 * @route   DELETE /api/prescriptions/:prescriptionId
 * @desc    Cancel a prescription
 * @access  Doctor only
 */
router.delete(
  '/:prescriptionId',
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;
    const result = await PrescriptionService.cancelPrescription(prescriptionId);
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'DELETE',
        entity: 'prescriptions',
        recordId: prescriptionId,
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {}
    res.json(result);
  })
);

export default router;
