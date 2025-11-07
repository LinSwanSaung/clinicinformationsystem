import express from 'express';
import clinicSettingsService from '../services/ClinicSettings.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// Get clinic settings
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await clinicSettingsService.getSettings();
    res.status(200).json({
      success: true,
      message: 'Clinic settings retrieved successfully',
      data: settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching clinic settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clinic settings',
      timestamp: new Date().toISOString(),
    });
  }
});

// Update clinic settings (admin only)
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { late_threshold_minutes, consult_expected_minutes } = req.body;

    // Validate input
    if (
      late_threshold_minutes !== undefined &&
      (isNaN(late_threshold_minutes) || late_threshold_minutes < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Late threshold must be a positive number',
        timestamp: new Date().toISOString(),
      });
    }

    if (
      consult_expected_minutes !== undefined &&
      (isNaN(consult_expected_minutes) || consult_expected_minutes < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Consultation duration must be a positive number',
        timestamp: new Date().toISOString(),
      });
    }

    const settingsData = {};
    if (late_threshold_minutes !== undefined) {
      settingsData.late_threshold_minutes = parseInt(late_threshold_minutes);
    }
    if (consult_expected_minutes !== undefined) {
      settingsData.consult_expected_minutes = parseInt(consult_expected_minutes);
    }

    const updatedSettings = await clinicSettingsService.updateSettings(settingsData);
    res.status(200).json({
      success: true,
      message: 'Clinic settings updated successfully',
      data: updatedSettings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating clinic settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clinic settings',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get specific consultation duration
router.get('/consultation-duration', authenticate, async (req, res) => {
  try {
    const duration = await clinicSettingsService.getConsultationDuration();
    res.status(200).json({
      success: true,
      message: 'Consultation duration retrieved successfully',
      data: { consult_expected_minutes: duration },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching consultation duration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation duration',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get specific late threshold
router.get('/late-threshold', authenticate, async (req, res) => {
  try {
    const threshold = await clinicSettingsService.getLateThreshold();
    res.status(200).json({
      success: true,
      message: 'Late threshold retrieved successfully',
      data: { late_threshold_minutes: threshold },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching late threshold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch late threshold',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
