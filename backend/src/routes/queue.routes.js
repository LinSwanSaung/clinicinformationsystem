import express from 'express';
import QueueService from '../services/Queue.service.js';
import { authenticate } from '../middleware/auth.js';
import { validateQueueToken, validateQueueAction } from '../validators/queue.validator.js';

const router = express.Router();
const queueService = new QueueService();

// ===============================================
// QUEUE TOKEN ROUTES
// ===============================================

/**
 * @route   GET /api/queue/doctor/:doctorId/capacity
 * @desc    Check if doctor can accept more walk-in patients
 * @access  Private (Receptionist, Admin)
 */
router.get('/doctor/:doctorId/capacity', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const capacity = await queueService.canAcceptWalkIn(doctorId);
    
    res.status(200).json({
      success: true,
      data: capacity
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/queue/token
 * @desc    Issue a new queue token
 * @access  Private (Receptionist, Admin)
 */
router.post('/token', authenticate, validateQueueToken, async (req, res) => {
  try {
    // Pass the current user info to the service for audit logging
    const result = await queueService.issueToken(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/queue/doctor/:doctorId/status
 * @desc    Get comprehensive queue status for a doctor
 * @access  Private
 */
router.get('/doctor/:doctorId/status', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    const status = await queueService.getQueueStatus(doctorId, date);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting doctor queue status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/queue/doctor/:doctorId/display-board
 * @desc    Get queue display board data (for public displays)
 * @access  Public
 */
router.get('/doctor/:doctorId/display-board', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const displayData = await queueService.getQueueDisplayBoard(doctorId);
    res.json({
      success: true,
      data: displayData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/queue/call-next/:doctorId
 * @desc    Call next patient in queue
 * @access  Private (Doctor, Nurse, Admin)
 */
router.post('/call-next/:doctorId', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const result = await queueService.callNextPatient(doctorId);
    res.json({
      success: result.success,
      data: result.token || null,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/mark-ready
 * @desc    Mark patient as ready for doctor (Nurse action)
 * @access  Private (Nurse, Admin)
 */
router.put('/token/:tokenId/mark-ready', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.markPatientReady(tokenId);
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Mark ready error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/mark-waiting
 * @desc    Unmark patient ready - change back to waiting (Nurse action)
 * @access  Private (Nurse, Admin)
 */
router.put('/token/:tokenId/mark-waiting', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.markPatientWaiting(tokenId);
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Mark waiting error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/queue/test
 * @desc    Test endpoint to verify routing
 * @access  Private
 */
router.get('/test', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Queue routes are working',
    user: req.user
  });
});

/**
 * @route   PUT /api/queue/token/:tokenId/start-consultation
 * @desc    Start consultation with a patient
 * @access  Private (Doctor, Admin)
 */
router.put('/token/:tokenId/start-consultation', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.startConsultation(tokenId);
    
    res.json({
      success: true,
      data: result.token,
      message: result.message
    });
  } catch (error) {
    console.error('Failed to start consultation:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/complete-consultation
 * @desc    Complete consultation with a patient
 * @access  Private (Doctor, Admin)
 */
router.put('/token/:tokenId/complete-consultation', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.completeConsultation(tokenId);
    res.json({
      success: true,
      data: result.token,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/mark-missed
 * @desc    Mark patient as missed/no-show
 * @access  Private (Doctor, Nurse, Receptionist, Admin)
 */
router.put('/token/:tokenId/mark-missed', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.markPatientMissed(tokenId);
    res.json({
      success: true,
      data: result.token,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/cancel
 * @desc    Cancel queue token
 * @access  Private (Receptionist, Admin)
 */
router.put('/token/:tokenId/cancel', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.cancelToken(tokenId);
    res.json({
      success: true,
      data: result.token,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/delay
 * @desc    Mark patient as delayed (removes from active queue)
 * @access  Private (Nurse, Receptionist, Admin)
 */
router.put('/token/:tokenId/delay', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { reason } = req.body;
    
    const result = await queueService.delayToken(tokenId, reason);
    res.json({
      success: true,
      data: result.token,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/token/:tokenId/undelay
 * @desc    Undelay patient (adds them back to end of queue)
 * @access  Private (Nurse, Receptionist, Admin)
 */
router.put('/token/:tokenId/undelay', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const result = await queueService.undelayToken(tokenId);
    res.json({
      success: true,
      data: result.token,
      message: result.message,
      newTokenNumber: result.newTokenNumber
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/appointment/:appointmentQueueId/delay
 * @desc    Mark appointment queue patient as delayed (removes from active queue)
 * @access  Private (Nurse, Receptionist, Admin)
 */
router.put('/appointment/:appointmentQueueId/delay', authenticate, async (req, res) => {
  try {
    const { appointmentQueueId } = req.params;
    const { reason } = req.body;
    
    const result = await queueService.delayAppointmentQueue(appointmentQueueId, reason);
    res.json({
      success: true,
      data: result.appointmentQueue,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/appointment/:appointmentQueueId/undelay
 * @desc    Undelay appointment queue patient (adds them back to end of queue)
 * @access  Private (Nurse, Receptionist, Admin)
 */
router.put('/appointment/:appointmentQueueId/undelay', authenticate, async (req, res) => {
  try {
    const { appointmentQueueId } = req.params;
    
    const result = await queueService.undelayAppointmentQueue(appointmentQueueId);
    res.json({
      success: true,
      data: result.appointmentQueue,
      message: result.message,
      newQueuePosition: result.newQueuePosition
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ===============================================
// PATIENT QUEUE INFORMATION
// ===============================================

/**
 * @route   GET /api/queue/patient/:patientId/info
 * @desc    Get patient's queue position and wait time
 * @access  Private
 */
router.get('/patient/:patientId/info', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorId } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }
    
    const info = await queueService.getPatientQueueInfo(patientId, doctorId);
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===============================================
// APPOINTMENT INTEGRATION
// ===============================================

/**
 * @route   POST /api/queue/doctor/:doctorId/process-appointments
 * @desc    Process scheduled appointments into queue
 * @access  Private (Receptionist, Admin)
 */
router.post('/doctor/:doctorId/process-appointments', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.body;
    
    const result = await queueService.processScheduledAppointments(doctorId, date);
    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ===============================================
// ANALYTICS AND REPORTING
// ===============================================

/**
 * @route   GET /api/queue/doctor/:doctorId/analytics
 * @desc    Get queue analytics for reporting
 * @access  Private (Admin, Doctor)
 */
router.get('/doctor/:doctorId/analytics', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const analytics = await queueService.getQueueAnalytics(doctorId, startDate, endDate);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===============================================
// BULK OPERATIONS
// ===============================================

/**
 * @route   POST /api/queue/bulk/issue-tokens
 * @desc    Issue multiple tokens at once
 * @access  Private (Receptionist, Admin)
 */
router.post('/bulk/issue-tokens', authenticate, async (req, res) => {
  try {
    const { tokens } = req.body;
    
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tokens array is required and cannot be empty'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const tokenData of tokens) {
      try {
        const result = await queueService.issueToken(tokenData);
        results.push(result);
      } catch (error) {
        errors.push({
          tokenData,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: tokens.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/bulk/update-status
 * @desc    Update status for multiple tokens
 * @access  Private (Doctor, Admin)
 */
router.put('/bulk/update-status', authenticate, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { tokenId, status }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and cannot be empty'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        let result;
        switch (update.status) {
          case 'called':
            // This would need the doctor ID - skip for bulk operations
            break;
          case 'serving':
            result = await queueService.startConsultation(update.tokenId);
            break;
          case 'completed':
            result = await queueService.completeConsultation(update.tokenId);
            break;
          case 'missed':
            result = await queueService.markPatientMissed(update.tokenId);
            break;
          case 'cancelled':
            result = await queueService.cancelToken(update.tokenId);
            break;
          default:
            throw new Error(`Invalid status: ${update.status}`);
        }
        
        if (result) {
          results.push(result);
        }
      } catch (error) {
        errors.push({
          tokenId: update.tokenId,
          status: update.status,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: updates.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/queue/doctor/:doctorId/active-consultation
 * @desc    Get the patient currently in consultation with the doctor
 * @access  Private (Doctor, Admin)
 */
router.get('/doctor/:doctorId/active-consultation', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const activeConsultation = await queueService.getActiveConsultation(doctorId);
    res.json({
      success: true,
      data: activeConsultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/queue/doctor/:doctorId/force-complete-consultation
 * @desc    Force complete any active consultation for the doctor (admin only)
 * @access  Private (Admin)
 */
router.put('/doctor/:doctorId/force-complete-consultation', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const result = await queueService.forceCompleteActiveConsultation(doctorId);
    res.json({
      success: true,
      data: result,
      message: 'Active consultation force completed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/queue/doctor/:doctorId/force-complete-active
 * @desc    Force complete any active consultation for a doctor
 * @access  Private (Doctor, Admin)
 */
router.post('/doctor/:doctorId/force-complete-active', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const result = await queueService.forceCompleteActiveConsultation(doctorId);
    res.json({
      success: true,
      data: result.token || null,
      message: result.message
    });
  } catch (error) {
    console.error('Force complete error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;