import { BaseModel } from '../models/BaseModel.js';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';
import {
  deleteUploadedFile,
  getUploadedFileUrl,
  saveUploadedFile,
} from '../utils/localStorage.js';

/**
 * Document Service
 * Handles medical document operations including file storage and metadata management
 */
class DocumentService {
  constructor() {
    this.model = new BaseModel('medical_documents');
    this.tableName = 'medical_documents';
    this.storageBucket = 'medical-documents';
  }

  /**
   * Upload a medical document to storage and save metadata
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - File MIME type
   * @param {string} patientId - Patient ID
   * @param {string} documentType - Document type
   * @param {string} uploadedBy - User ID who uploaded the document
   * @returns {Promise<object>} Document data with public URL
   */
  async uploadDocument(fileBuffer, fileName, mimeType, patientId, documentType, uploadedBy) {
    try {
      const crypto = (await import('crypto')).default;
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${patientId}/${crypto.randomUUID()}.${fileExtension}`;

      const { publicUrl } = await saveUploadedFile(fileBuffer, uniqueFileName);

      // Store document metadata in database
      const documentData = {
        patient_id: patientId,
        document_type: documentType || 'other',
        document_name: fileName,
        file_path: uniqueFileName,
        file_size: fileBuffer.length,
        mime_type: mimeType,
        uploaded_by: uploadedBy,
      };

      const { data: docData, error: dbError } = await supabase
        .from(this.tableName)
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        logger.error('Database insert error:', dbError);
        // Try to delete the uploaded file
        await deleteUploadedFile(uniqueFileName);
        throw new Error(`Failed to save document metadata: ${dbError.message}`);
      }

      return {
        ...docData,
        publicUrl,
      };
    } catch (error) {
      logger.error('Error in DocumentService.uploadDocument:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<object>} Document data
   */
  async getDocumentById(documentId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id, file_path, patient_id')
        .eq('id', documentId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in DocumentService.getDocumentById:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a document
   * @param {string} filePath - File path in storage
   * @returns {string} Public URL
   */
  getDocumentPublicUrl(filePath) {
    return getUploadedFileUrl(filePath);
  }

  /**
   * Get all documents for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of document records
   */
  async getPatientDocuments(patientId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
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
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in DocumentService.getPatientDocuments:', error);
      throw error;
    }
  }

  /**
   * Delete a document (both from storage and database)
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId) {
    try {
      // Get document info first
      const { data: doc, error: fetchError } = await supabase
        .from(this.tableName)
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError || !doc) {
        throw new Error('Document not found');
      }

      await deleteUploadedFile(doc.file_path).catch((error) => {
        logger.error('Storage deletion error:', error);
      });

      // Delete from database
      const { error: dbError } = await supabase.from(this.tableName).delete().eq('id', documentId);

      if (dbError) {
        throw new Error(`Failed to delete document: ${dbError.message}`);
      }
    } catch (error) {
      logger.error('Error in DocumentService.deleteDocument:', error);
      throw error;
    }
  }
}

export default new DocumentService();
