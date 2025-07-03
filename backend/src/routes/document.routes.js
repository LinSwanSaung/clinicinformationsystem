import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import config from '../config/app.config.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: config.upload.maxSize // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

/**
 * @route   POST /api/documents/upload
 * @desc    Upload patient document
 * @access  Private (All roles)
 */
router.post('/upload',
  authenticate,
  uploadRateLimiter,
  upload.single('document'),
  asyncHandler(async (req, res) => {
    // TODO: Implement file upload to Supabase storage
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully'
    });
  })
);

/**
 * @route   GET /api/documents/patient/:patientId
 * @desc    Get patient documents
 * @access  Private (All roles)
 */
router.get('/patient/:patientId',
  authenticate,
  asyncHandler(async (req, res) => {
    // TODO: Implement document listing
    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: []
    });
  })
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private (Admin, Doctor)
 */
router.delete('/:id',
  authenticate,
  authorize('admin', 'doctor'),
  asyncHandler(async (req, res) => {
    // TODO: Implement document deletion
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  })
);

export default router;
