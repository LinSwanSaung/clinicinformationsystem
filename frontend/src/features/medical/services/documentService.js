import api from '@/services/api';

/**
 * Document Service
 * Handles patient document uploads, retrieval, and management
 */
class DocumentService {
  /**
   * Upload patient document
   * @param {FormData} formData - Form data containing file and metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(formData) {
    try {
      // Don't set Content-Type header - browser will set it automatically with boundary
      const response = await api.post('/documents/upload', formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Upload multiple documents for a patient
   * @param {string} patientId - Patient ID
   * @param {File[]} files - Array of files to upload
   * @param {string} documentType - Type of document (e.g., 'lab_result', 'x_ray', 'prescription')
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleDocuments(patientId, files, documentType = 'other') {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('patient_id', patientId);
        formData.append('document_type', documentType);
        formData.append('file_name', file.name);
        
        return this.uploadDocument(formData);
      });

      const results = await Promise.all(uploadPromises);
      return {
        success: true,
        message: `Successfully uploaded ${results.length} document(s)`,
        data: results
      };
    } catch (error) {
      console.error('Error uploading multiple documents:', error);
      throw error;
    }
  }

  /**
   * Get documents for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of patient documents
   */
  async getPatientDocuments(patientId) {
    try {
      const response = await api.get(`/documents/patient/${patientId}`);
      // Backend returns the array directly, not wrapped in { data: [...] }
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Download a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Blob>} Document file
   */
  async downloadDocument(documentId) {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDocument(documentId) {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get document URL
   * @param {string} documentId - Document ID
   * @returns {string} Document URL
   */
  getDocumentUrl(documentId) {
    return `${api.defaults.baseURL}/documents/${documentId}/view`;
  }
}

const documentService = new DocumentService();
export default documentService;
