import express from 'express';
import DoctorNoteService from '../services/DoctorNote.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/doctor-notes
 * @desc    Create a new doctor note
 * @access  Doctor only
 */
router.post(
  '/',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const note = await DoctorNoteService.createNote(req.body);
    res
      .status(201)
      .json({ success: true, data: note, message: 'Doctor note created successfully' });
  })
);

/**
 * @route   GET /api/doctor-notes/visit/:visitId
 * @desc    Get all notes for a specific visit
 * @access  Doctor, Nurse, Receptionist
 */
router.get(
  '/visit/:visitId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const notes = await DoctorNoteService.getNotesByVisit(req.params.visitId);
    res.json({ success: true, data: notes, message: 'Notes retrieved successfully' });
  })
);

/**
 * @route   GET /api/doctor-notes/patient/:patientId
 * @desc    Get all notes for a patient
 * @access  Doctor, Nurse, Receptionist
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  asyncHandler(async (req, res) => {
    const notes = await DoctorNoteService.getNotesByPatient(req.params.patientId);
    res.json({ success: true, data: notes, message: 'Patient notes retrieved successfully' });
  })
);

/**
 * @route   PUT /api/doctor-notes/:noteId
 * @desc    Update a doctor note
 * @access  Doctor only
 */
router.put(
  '/:noteId',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const updatedNote = await DoctorNoteService.updateNote(req.params.noteId, req.body);
    res.json({ success: true, data: updatedNote, message: 'Doctor note updated successfully' });
  })
);

/**
 * @route   DELETE /api/doctor-notes/:noteId
 * @desc    Delete a doctor note
 * @access  Doctor only
 */
router.delete(
  '/:noteId',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    await DoctorNoteService.deleteNote(req.params.noteId);
    res.json({ success: true, data: null, message: 'Doctor note deleted successfully' });
  })
);

export default router;
