import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import patientDiagnosisService from '../services/PatientDiagnosis.service.js';

const router = express.Router();

/**
 * @route   GET /api/patient-diagnoses/patient/:patientId
 * @desc    Get all diagnoses for a patient
 * @access  Private (Doctor, Nurse, Receptionist)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { includeResolved } = req.query;
      
      const diagnoses = await patientDiagnosisService.getDiagnosesByPatient(
        patientId, 
        includeResolved === 'true'
      );
      
      res.json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/patient-diagnoses/visit/:visitId
 * @desc    Get diagnoses for a visit
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/visit/:visitId',
  authenticate,
  authorize('doctor', 'nurse'),
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const diagnoses = await patientDiagnosisService.getDiagnosesByVisit(visitId);
      
      res.json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/patient-diagnoses/:id
 * @desc    Get diagnosis by ID
 * @access  Private (Doctor, Nurse, Receptionist)
 */
router.get(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const diagnosis = await patientDiagnosisService.getDiagnosisById(id);
      
      if (!diagnosis) {
        return res.status(404).json({
          success: false,
          message: 'Diagnosis not found'
        });
      }
      
      res.json({
        success: true,
        data: diagnosis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/patient-diagnoses
 * @desc    Create new diagnosis
 * @access  Private (Doctor only)
 */
router.post(
  '/',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const diagnosisData = {
        ...req.body,
        diagnosed_by: req.body.diagnosed_by || req.user.id
      };
      
      const diagnosis = await patientDiagnosisService.createDiagnosis(diagnosisData);
      
      res.status(201).json({
        success: true,
        data: diagnosis,
        message: 'Diagnosis created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/patient-diagnoses/:id
 * @desc    Update diagnosis
 * @access  Private (Doctor only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const diagnosis = await patientDiagnosisService.updateDiagnosis(id, req.body);
      
      res.json({
        success: true,
        data: diagnosis,
        message: 'Diagnosis updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   PATCH /api/patient-diagnoses/:id/status
 * @desc    Update diagnosis status
 * @access  Private (Doctor only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, resolved_date } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }
      
      const diagnosis = await patientDiagnosisService.updateDiagnosisStatus(
        id, 
        status, 
        resolved_date
      );
      
      res.json({
        success: true,
        data: diagnosis,
        message: 'Diagnosis status updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/patient-diagnoses/:id
 * @desc    Delete diagnosis (soft delete)
 * @access  Private (Doctor only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { id } = req.params;
      await patientDiagnosisService.deleteDiagnosis(id);
      
      res.json({
        success: true,
        message: 'Diagnosis deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/patient-diagnoses/active/all
 * @desc    Get all active diagnoses
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/active/all',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const diagnoses = await patientDiagnosisService.getAllActiveDiagnoses();
      
      res.json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
