import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireActiveVisit } from '../middleware/activeVisitCheck.js';
import patientAllergyService from '../services/PatientAllergy.service.js';

const router = express.Router();

/**
 * @route   GET /api/patient-allergies/patient/:patientId
 * @desc    Get all allergies for a patient
 * @access  Private (Doctor, Nurse, Receptionist, Patient)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist', 'patient'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const allergies = await patientAllergyService.getAllergiesByPatient(patientId);

      res.json({
        success: true,
        data: allergies,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/patient-allergies/:id
 * @desc    Get allergy by ID
 * @access  Private (Doctor, Nurse, Receptionist, Patient)
 */
router.get(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist', 'patient'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const allergy = await patientAllergyService.getAllergyById(id);

      if (!allergy) {
        return res.status(404).json({
          success: false,
          message: 'Allergy not found',
        });
      }

      res.json({
        success: true,
        data: allergy,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/patient-allergies
 * @desc    Create new allergy
 * @access  Private (Doctor, Nurse)
 * @security Requires patient to have an active visit
 */
router.post(
  '/',
  authenticate,
  authorize('doctor', 'nurse'),
  requireActiveVisit,
  async (req, res) => {
    try {
      const allergyData = {
        ...req.body,
        diagnosed_by: req.body.diagnosed_by || req.user.id,
      };

      const allergy = await patientAllergyService.createAllergy(allergyData);

      res.status(201).json({
        success: true,
        data: allergy,
        message: 'Allergy created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/patient-allergies/:id
 * @desc    Update allergy
 * @access  Private (Doctor, Nurse)
 * @security Requires patient to have an active visit
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse'),
  requireActiveVisit,
  async (req, res) => {
    try {
      const { id } = req.params;
      const allergy = await patientAllergyService.updateAllergy(id, req.body);

      res.json({
        success: true,
        data: allergy,
        message: 'Allergy updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/patient-allergies/:id
 * @desc    Delete allergy (soft delete)
 * @access  Private (Doctor, Nurse)
 */
router.delete('/:id', authenticate, authorize('doctor', 'nurse'), async (req, res) => {
  try {
    const { id } = req.params;
    await patientAllergyService.deleteAllergy(id);

    res.json({
      success: true,
      message: 'Allergy deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/patient-allergies/active/all
 * @desc    Get all active allergies
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/active/all',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const allergies = await patientAllergyService.getAllActiveAllergies();

      res.json({
        success: true,
        data: allergies,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
