import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import config from '../config/app.config.js';
import documentService from '../services/Document.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import logger from '../config/logger.js';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSize, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

/**
 * @route   POST /api/documents/upload
 * @desc    Upload patient document
 * @access  Private (All roles)
 */
router.post(
  '/upload',
  authenticate,
  uploadRateLimiter,
  upload.single('document'),
  asyncHandler(async (req, res) => {
    const { patient_id, document_type, file_name } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        debug: {
          hasBody: !!req.body,
          bodyKeys: Object.keys(req.body || {}),
          hasFiles: !!req.files,
          hasFile: !!req.file,
        },
      });
    }

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    try {
      const docData = await documentService.uploadDocument(
        file.buffer,
        file_name || file.originalname,
        file.mimetype,
        patient_id,
        document_type,
        req.user.id
      );

      // Log upload
      try {
        logAuditEvent({
          userId: req.user?.id || null,
          role: req.user?.role || null,
          action: 'UPLOAD',
          entity: 'medical_documents',
          recordId: docData?.id || null,
          patientId: patient_id,
          result: 'success',
          meta: { file_name: docData?.document_name },
          ip: req.ip,
        });
      } catch (e) {
        // Ignore audit log errors - don't fail the request if logging fails
      }

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: docData,
      });
    } catch (error) {
      logger.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document',
      });
    }
  })
);

/**
 * @route GET /api/documents/:id/download
 * @desc  Download document (redirect to public URL)
 * @access Private
 */
router.get(
  '/:id/download',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const doc = await documentService.getDocumentById(id);

      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      // Obtain public URL
      const publicUrl = documentService.getDocumentPublicUrl(doc.file_path);

      // Log download
      try {
        logAuditEvent({
          userId: req.user?.id || null,
          role: req.user?.role || null,
          action: 'DOWNLOAD',
          entity: 'medical_documents',
          recordId: id,
          patientId: doc.patient_id || null,
          result: 'success',
          ip: req.ip,
        });
      } catch (e) {
        // Ignore audit log errors - don't fail the request if logging fails
      }

      // Redirect to public URL
      return res.redirect(publicUrl);
    } catch (error) {
      logger.error('Error downloading document:', error);
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
  })
);

/**
 * @route   GET /api/documents/patient/:patientId
 * @desc    Get patient documents
 * @access  Private (All roles)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    try {
      const documents = await documentService.getPatientDocuments(patientId);
      res.status(200).json(documents);
    } catch (error) {
      logger.error('Error fetching patient documents:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch documents',
      });
    }
  })
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private (Admin, Doctor)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      await documentService.deleteDocument(id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting document:', error);
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document',
      });
    }
  })
);

export default router;
