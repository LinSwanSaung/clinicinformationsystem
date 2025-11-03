import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import config from '../config/app.config.js';
import { supabase } from '../config/database.js';
import crypto from 'crypto';
import { logAuditEvent } from '../utils/auditLogger.js';

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
      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${patient_id}/${crypto.randomUUID()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(uniqueFileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('medical-documents').getPublicUrl(uniqueFileName);

      // Store document metadata in database
      const { data: docData, error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id,
          document_type: document_type || 'other',
          document_name: file_name || file.originalname,
          file_path: uniqueFileName,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: req.user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to delete the uploaded file
        await supabase.storage.from('medical-documents').remove([uniqueFileName]);
        throw new Error(`Failed to save document metadata: ${dbError.message}`);
      }

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
      } catch (e) {}

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: docData,
      });
    } catch (error) {
      console.error('Document upload error:', error);
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

    const { data: doc, error: fetchError } = await supabase
      .from('medical_documents')
      .select('id, file_path, patient_id')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Obtain public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('medical-documents').getPublicUrl(doc.file_path);

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
    } catch (e) {}

    // Redirect to public URL
    return res.redirect(publicUrl);
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

    const { data, error } = await supabase
      .from('medical_documents')
      .select(
        `
        *,
        uploader:uploaded_by (
          first_name,
          last_name,
          role
        )
      `
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    res.status(200).json(data || []);
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

    // Get document info first
    const { data: doc, error: fetchError } = await supabase
      .from('medical_documents')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase.from('medical_documents').delete().eq('id', id);

    if (dbError) {
      throw new Error(`Failed to delete document: ${dbError.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  })
);

export default router;
