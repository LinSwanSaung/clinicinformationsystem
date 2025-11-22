import api from '@/services/api';
import logger from '@/utils/logger';

const doctorNotesService = {
  /**
   * Create a new doctor note
   */
  async createNote(noteData) {
    try {
      const response = await api.post('/doctor-notes', noteData);
      return response.data;
    } catch (error) {
      logger.error('Error creating doctor note:', error);
      throw error;
    }
  },

  /**
   * Get notes for a specific visit
   */
  async getNotesByVisit(visitId) {
    try {
      const response = await api.get(`/doctor-notes/visit/${visitId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching notes by visit:', error);
      throw error;
    }
  },

  /**
   * Get all notes for a patient
   */
  async getNotesByPatient(patientId) {
    try {
      const response = await api.get(`/doctor-notes/patient/${patientId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching notes by patient:', error);
      throw error;
    }
  },

  /**
   * Update a doctor note
   */
  async updateNote(noteId, noteData) {
    try {
      const response = await api.put(`/doctor-notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      logger.error('Error updating doctor note:', error);
      throw error;
    }
  },

  /**
   * Delete a doctor note
   */
  async deleteNote(noteId) {
    try {
      const response = await api.delete(`/doctor-notes/${noteId}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting doctor note:', error);
      throw error;
    }
  },
};

export default doctorNotesService;
