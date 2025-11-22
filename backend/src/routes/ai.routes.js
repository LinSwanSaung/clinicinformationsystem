import express from 'express';
import { authenticate } from '../middleware/auth.js';
import aiService from '../services/OpenAI.service.js';
import diagnosisService from '../services/PatientDiagnosis.service.js';
import patientService from '../services/Patient.service.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /ai/models
 * List available AI models (for debugging)
 */
router.get('/models', authenticate, async (req, res) => {
  try {
    const models = await aiService.listAvailableModels();
    res.json({ success: true, models });
  } catch (error) {
    logger.error('[AI Route] Error listing models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /ai/health-advice/:patientId
 * Generate health advice based on patient's last diagnosis
 */
router.get('/health-advice/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { lang = 'en' } = req.query;

    // Get patient's latest diagnosis
    const diagnoses = await diagnosisService.getDiagnosesByPatient(patientId);

    if (!diagnoses || diagnoses.length === 0) {
      // No diagnosis - return general wellness tips
      const wellnessTips = await aiService.generateWellnessTips(lang);
      return res.json({
        success: true,
        data: {
          type: 'wellness',
          content: wellnessTips.tips,
          generatedAt: wellnessTips.generatedAt,
        },
      });
    }

    // Get the most recent diagnosis
    const latestDiagnosis = diagnoses[0];

    // Get patient info for age/gender context
    const patient = await patientService.getPatientById(patientId);

    // Calculate age from DOB
    let age = null;
    if (patient.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
    }

    // Generate health advice
    const healthAdvice = await aiService.generateHealthAdvice(
      latestDiagnosis.diagnosis_name,
      age,
      patient.gender,
      lang
    );

    res.json({
      success: true,
      data: {
        type: 'diagnosis-based',
        diagnosis: latestDiagnosis.diagnosis_name,
        diagnosedDate: latestDiagnosis.diagnosed_date,
        content: healthAdvice.advice,
        generatedAt: healthAdvice.generatedAt,
      },
    });
  } catch (error) {
    logger.error('[AI Route] Error generating health advice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate health advice',
    });
  }
});

/**
 * GET /ai/wellness-tips
 * Generate general wellness tips (no diagnosis required)
 */
router.get('/wellness-tips', authenticate, async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const wellnessTips = await aiService.generateWellnessTips(lang);

    res.json({
      success: true,
      data: {
        type: 'wellness',
        content: wellnessTips.tips,
        generatedAt: wellnessTips.generatedAt,
      },
    });
  } catch (error) {
    logger.error('[AI Route] Error generating wellness tips:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate wellness tips',
    });
  }
});

export default router;
