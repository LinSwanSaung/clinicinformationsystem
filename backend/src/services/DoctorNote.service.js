import DoctorNote from '../models/DoctorNote.model.js';

class DoctorNoteService {
  static async createNote(noteData) {
    if (!noteData.visit_id || !noteData.patient_id || !noteData.doctor_id) {
      throw new Error('visit_id, patient_id, and doctor_id are required');
    }
    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('Note content is required');
    }
    const noteToCreate = {
      ...noteData,
      note_type: noteData.note_type || 'consultation',
      is_private: noteData.is_private !== undefined ? noteData.is_private : false,
      created_at: new Date().toISOString()
    };
    return DoctorNote.create(noteToCreate);
  }

  static async getNotesByVisit(visitId) {
    if (!visitId) {
      throw new Error('Visit ID is required');
    }
    return DoctorNote.findByVisit(visitId);
  }

  static async getNotesByPatient(patientId) {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return DoctorNote.findByPatient(patientId);
  }

  static async updateNote(noteId, noteData) {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    const allowedUpdates = {
      content: noteData.content,
      note_type: noteData.note_type,
      is_private: noteData.is_private,
      updated_at: new Date().toISOString()
    };
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
    return DoctorNote.update(noteId, allowedUpdates);
  }

  static async deleteNote(noteId) {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    return DoctorNote.delete(noteId);
  }
}

export default DoctorNoteService;
