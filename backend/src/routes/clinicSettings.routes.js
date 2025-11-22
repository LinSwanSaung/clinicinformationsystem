import express from 'express';
import multer from 'multer';
import clinicSettingsService from '../services/ClinicSettings.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = express.Router();

// Configure multer for logo uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for logos
  },
  fileFilter: (req, file, cb) => {
    // Only allow image types for logos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
    }
  },
});

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
router.put('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const {
    late_threshold_minutes,
    consult_expected_minutes,
    clinic_name,
    clinic_logo_url,
    clinic_phone,
    clinic_email,
    clinic_address,
    currency_code,
    currency_symbol,
    payment_qr_code_url,
  } = req.body;

  // Validate operational settings
  if (
    late_threshold_minutes !== undefined &&
    (isNaN(late_threshold_minutes) || late_threshold_minutes < 1 || late_threshold_minutes > 30)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Late threshold must be between 1 and 30 minutes',
      timestamp: new Date().toISOString(),
    });
  }

  if (
    consult_expected_minutes !== undefined &&
    (isNaN(consult_expected_minutes) || consult_expected_minutes < 5 || consult_expected_minutes > 60)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Consultation duration must be between 5 and 60 minutes',
      timestamp: new Date().toISOString(),
    });
  }

  // Validate clinic name
  if (clinic_name !== undefined && clinic_name !== null && clinic_name.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Clinic name must be 200 characters or less',
      timestamp: new Date().toISOString(),
    });
  }

  // Validate email format if provided
  if (clinic_email !== undefined && clinic_email !== null && clinic_email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clinic_email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Build settings data object
  const settingsData = {};
  if (late_threshold_minutes !== undefined) {
    settingsData.late_threshold_minutes = parseInt(late_threshold_minutes);
  }
  if (consult_expected_minutes !== undefined) {
    settingsData.consult_expected_minutes = parseInt(consult_expected_minutes);
  }
  if (clinic_name !== undefined) {
    settingsData.clinic_name = clinic_name || null;
  }
  if (clinic_logo_url !== undefined) {
    settingsData.clinic_logo_url = clinic_logo_url || null;
  }
  if (clinic_phone !== undefined) {
    settingsData.clinic_phone = clinic_phone || null;
  }
  if (clinic_email !== undefined) {
    settingsData.clinic_email = clinic_email || null;
  }
  if (clinic_address !== undefined) {
    settingsData.clinic_address = clinic_address || null;
  }
  if (currency_code !== undefined) {
    settingsData.currency_code = currency_code || 'USD';
  }
  if (currency_symbol !== undefined) {
    settingsData.currency_symbol = currency_symbol || '$';
  }
  if (payment_qr_code_url !== undefined) {
    settingsData.payment_qr_code_url = payment_qr_code_url || null;
  }

  const updatedSettings = await clinicSettingsService.updateSettings(settingsData);
  res.status(200).json({
    success: true,
    message: 'Clinic settings updated successfully',
    data: updatedSettings,
    timestamp: new Date().toISOString(),
  });
}));

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
    logger.error('Error fetching consultation duration:', error);
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
    logger.error('Error fetching late threshold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch late threshold',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   POST /api/clinic-settings/upload-logo
 * @desc    Upload clinic logo to Supabase Storage
 * @access  Private (Admin only)
 */
router.post(
  '/upload-logo',
  authenticate,
  authorize('admin'),
  uploadRateLimiter,
  upload.single('logo'),
  asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const uploadResult = await clinicSettingsService.uploadLogo(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: uploadResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error uploading logo:', error);
      throw error;
    }
  })
);

/**
 * @route   POST /api/clinic-settings/upload-qr-code
 * @desc    Upload payment QR code image to Supabase Storage
 * @access  Private (Admin only)
 */
router.post(
  '/upload-qr-code',
  authenticate,
  authorize('admin'),
  uploadRateLimiter,
  upload.single('qr_code'),
  asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const uploadResult = await clinicSettingsService.uploadQRCode(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.status(200).json({
        success: true,
        message: 'QR code uploaded successfully',
        data: uploadResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error uploading QR code:', error);
      throw error;
    }
  })
);

export default router;
