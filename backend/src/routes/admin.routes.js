import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import logger from '../config/logger.js';
import EmailService from '../services/Email.service.js';
import QueueService from '../services/Queue.service.js';
import VisitService from '../services/Visit.service.js';

const router = express.Router();

/**
 * @route   GET /api/admin/debug/visits
 * @desc    Debug endpoint to see all active visits
 * @access  Private (Admin only)
 */
router.get(
  '/debug/visits',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const visitService = new VisitService();
    const result = await visitService.getDebugVisits(limit);
    res.json(result);
  })
);

/**
 * @route   GET /api/admin/pending-items
 * @desc    Get all pending items across modules that need admin attention
 * @access  Private (Admin only)
 */
router.get(
  '/pending-items',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    // Get pending visits from VisitService
    const visitService = new VisitService();
    const visitPendingResult = await visitService.getPendingItems();
    const pendingItems = visitPendingResult.data || [];

    // Get pending appointments and other items
    // Access supabase through VisitService's model
    const supabase = visitService.visitModel.supabase;

    // Get pending appointments (scheduled but not completed/cancelled, older than 1 hour past scheduled time)
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(
        `
        id,
        status,
        updated_at,
        appointment_date,
        appointment_time,
        resolved_by_admin,
        resolved_reason,
        patients!inner (
          first_name,
          last_name,
          patient_number
        ),
        users (
          first_name,
          last_name
        )
      `
      )
      .eq('status', 'scheduled')
      .eq('resolved_by_admin', false) // Exclude already resolved
      .order('appointment_date', { ascending: true });

    if (!appointmentsError && appointmentsData) {
      // Filter appointments that are past their scheduled time by more than 1 hour
      const now = new Date();
      const pastAppointments = appointmentsData.filter((appointment) => {
        const appointmentDateTime = new Date(
          `${appointment.appointment_date}T${appointment.appointment_time}`
        );
        return appointmentDateTime < new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      });

      pendingItems.push(
        ...pastAppointments.map((appointment) => ({
          entityType: 'appointment',
          entityId: appointment.id,
          currentStatus: appointment.status,
          lastUpdated: appointment.updated_at,
          patientName: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
          patientNumber: appointment.patients.patient_number,
          doctorName: appointment.users
            ? `${appointment.users.first_name} ${appointment.users.last_name}`
            : null,
          resolvedByAdmin: appointment.resolved_by_admin,
          resolvedReason: appointment.resolved_reason,
        }))
      );
    }

    // Get pending queue tokens (active tokens older than 4 hours)
    // Exclude tokens already resolved by admin
    const { data: queueData, error: queueError } = await supabase
      .from('queue_tokens')
      .select(
        `
        id,
        status,
        updated_at,
        resolved_by_admin,
        resolved_reason,
        patients!inner (
          first_name,
          last_name,
          patient_number
        ),
        users (
          first_name,
          last_name
        )
      `
      )
      .in('status', ['waiting', 'called', 'serving', 'delayed'])
      .eq('resolved_by_admin', false) // Exclude already resolved
      .lt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!queueError && queueData) {
      pendingItems.push(
        ...queueData.map((token) => ({
          entityType: 'queue',
          entityId: token.id,
          currentStatus: token.status,
          lastUpdated: token.updated_at,
          patientName: `${token.patients.first_name} ${token.patients.last_name}`,
          patientNumber: token.patients.patient_number,
          doctorName: token.users ? `${token.users.first_name} ${token.users.last_name}` : null,
          resolvedByAdmin: token.resolved_by_admin,
          resolvedReason: token.resolved_reason,
        }))
      );
    }

    // Get pending invoices (unpaid invoices older than 7 days)
    // Exclude invoices already resolved by admin
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(
        `
        id,
        status,
        updated_at,
        resolved_by_admin,
        resolved_reason,
        patients!inner (
          first_name,
          last_name,
          patient_number
        )
      `
      )
      .eq('status', 'pending')
      .eq('resolved_by_admin', false) // Exclude already resolved
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!invoicesError && invoicesData) {
      pendingItems.push(
        ...invoicesData.map((invoice) => ({
          entityType: 'billing',
          entityId: invoice.id,
          currentStatus: invoice.status,
          lastUpdated: invoice.updated_at,
          patientName: `${invoice.patients.first_name} ${invoice.patients.last_name}`,
          patientNumber: invoice.patients.patient_number,
          doctorName: null,
          resolvedByAdmin: invoice.resolved_by_admin,
          resolvedReason: invoice.resolved_reason,
        }))
      );
    }

    // Remove duplicates (in case same item appears in multiple queries)
    const uniquePendingItems = [];
    const seenIds = new Set();
    for (const item of pendingItems) {
      const key = `${item.entityType}-${item.entityId}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        uniquePendingItems.push(item);
      }
    }

    res.json(uniquePendingItems);
  })
);

/**
 * @route   POST /api/admin/override
 * @desc    Admin override for resolving stuck records
 * @access  Private (Admin only)
 */
router.post(
  '/override',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { entityType, entityId, newStatus, reason } = req.body;

    // Validate required fields
    if (!entityType || !entityId || !newStatus || !reason) {
      throw new AppError('Entity type, entity ID, new status, and reason are required', 400);
    }

    if (!reason.trim()) {
      throw new AppError('Reason cannot be empty', 400);
    }

    // Access supabase through VisitService
    const visitService = new VisitService();
    const supabase = visitService.visitModel.supabase;

    let tableName, idColumn, statusColumn, oldStatus;

    // Determine table and columns based on entity type
    switch (entityType) {
      case 'visit':
        tableName = 'visits';
        idColumn = 'id';
        statusColumn = 'status';
        break;
      case 'appointment':
        tableName = 'appointments';
        idColumn = 'id';
        statusColumn = 'status';
        break;
      case 'queue':
        tableName = 'queue_tokens';
        idColumn = 'id';
        statusColumn = 'status';
        break;
      case 'billing':
        tableName = 'invoices';
        idColumn = 'id';
        statusColumn = 'status';
        break;
      default:
        throw new AppError('Invalid entity type', 400);
    }

    // Get current record to capture old status
    const { data: currentRecord, error: fetchError } = await supabase
      .from(tableName)
      .select(statusColumn)
      .eq(idColumn, entityId)
      .single();

    if (fetchError || !currentRecord) {
      logger.error('[ADMIN] Failed to fetch record:', fetchError);
      throw new AppError(`${entityType} record not found`, 404);
    }

    oldStatus = currentRecord[statusColumn];

    // Update the record
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        [statusColumn]: newStatus,
        resolved_by_admin: true,
        resolved_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq(idColumn, entityId);

    if (updateError) {
      logger.error('[ADMIN] Failed to update record:', updateError);
      throw new AppError(`Failed to update ${entityType} record: ${updateError.message}`, 500);
    }

    // CASCADE CANCELLATION: If cancelling/completing, update related records
    if (newStatus === 'cancelled' || newStatus === 'completed') {

      try {
        // Get the full record to find related IDs
        const { data: fullRecord } = await supabase
          .from(tableName)
          .select('*')
          .eq(idColumn, entityId)
          .single();

        if (fullRecord) {
          // If cancelling/completing a VISIT, also cancel/complete its queue token and appointment
          if (entityType === 'visit') {
            const now = new Date().toISOString();
            
            // Update visit with visit_end_time if completing and not already set
            if (newStatus === 'completed' && !fullRecord.visit_end_time) {
              await supabase
                .from('visits')
                .update({ visit_end_time: now })
                .eq('id', fullRecord.id);
            }
            
            // Update queue token(s) linked to this visit
            if (fullRecord.id) {
              await supabase
                .from('queue_tokens')
                .update({ 
                  status: newStatus === 'completed' ? 'completed' : newStatus,
                  updated_at: now 
                })
                .eq('visit_id', fullRecord.id);
              logger.debug(`[ADMIN] Updated queue token(s) for visit ${fullRecord.id}`);
            }

            // Update appointment if linked
            if (fullRecord.appointment_id) {
              await supabase
                .from('appointments')
                .update({
                  status: newStatus,
                  resolved_by_admin: true,
                  resolved_reason: reason,
                  updated_at: now,
                })
                .eq('id', fullRecord.appointment_id);
              logger.debug(`[ADMIN] Updated appointment ${fullRecord.appointment_id}`);
            }
          }

          // If cancelling/completing an APPOINTMENT, also cancel/complete its visit and queue token
          if (entityType === 'appointment') {
            // Find and update the visit
            const { data: relatedVisit } = await supabase
              .from('visits')
              .select('id')
              .eq('appointment_id', fullRecord.id)
              .single();

            if (relatedVisit) {
              await supabase
                .from('visits')
                .update({
                  status: newStatus,
                  resolved_by_admin: true,
                  resolved_reason: reason,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', relatedVisit.id);

              // Update queue token linked to this visit
              await supabase
                .from('queue_tokens')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('visit_id', relatedVisit.id);
            }
          }

          // If cancelling/completing a QUEUE TOKEN, also cancel/complete its visit and appointment
          if (entityType === 'queue') {
            // Update visit
            if (fullRecord.visit_id) {
              await supabase
                .from('visits')
                .update({
                  status: newStatus,
                  resolved_by_admin: true,
                  resolved_reason: reason,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', fullRecord.visit_id);
            }

            // Update appointment if linked
            if (fullRecord.appointment_id) {
              await supabase
                .from('appointments')
                .update({
                  status: newStatus,
                  resolved_by_admin: true,
                  resolved_reason: reason,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', fullRecord.appointment_id);
              logger.debug(`[ADMIN] Updated appointment ${fullRecord.appointment_id}`);
            }
          }
        }
      } catch (cascadeError) {
        logger.error('[ADMIN] Error cascading status update:', cascadeError);
        // Don't fail the main operation, just log the error
      }
    }

    // Log the audit event
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'ADMIN.OVERRIDE',
      entity_type: entityType,
      entity_id: entityId,
      old_values: { status: oldStatus },
      new_values: { status: newStatus },
      reason: reason,
      metadata: {
        admin_override: true,
        resolved_reason: reason,
      },
    });

    res.json({
      success: true,
      message: `${entityType} record successfully resolved`,
      data: {
        entityType,
        entityId,
        oldStatus,
        newStatus,
        resolvedBy: req.user.id,
        reason,
      },
    });
  })
);

/**
 * @route   GET /api/admin/debug/email
 * @desc    Verify email (SMTP) configuration and connectivity
 * @access  Private (Admin only)
 */
router.get(
  '/debug/email',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const cfg = {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      userPresent: Boolean(process.env.SMTP_USER),
      passPresent: Boolean(process.env.SMTP_PASS),
      from: process.env.EMAIL_FROM || null,
    };

    let verify = { ok: false, message: 'Transporter not initialized' };
    try {
      if (EmailService.transporter) {
        await EmailService.transporter.verify();
        verify = { ok: true, message: 'SMTP connection verified' };
      }
    } catch (e) {
      verify = { ok: false, message: e?.message || String(e) };
    }

    res.json({
      config: {
        host: cfg.host,
        port: cfg.port,
        userPresent: cfg.userPresent,
        passPresent: cfg.passPresent,
        from: cfg.from,
      },
      verify,
    });
  })
);

/**
 * @route   POST /api/admin/cleanup/stuck-consultations
 * @desc    Detect and auto-fix stuck consultations (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/cleanup/stuck-consultations',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { maxAgeHours } = req.body;
    const queueService = new QueueService();
    
    const result = await queueService.detectAndFixStuckConsultations(maxAgeHours || 24);
    
    // Log audit event
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'ADMIN.CLEANUP_STUCK_CONSULTATIONS',
      entity_type: 'queue_tokens',
      status: result.success ? 'success' : 'error',
      reason: result.message,
      new_values: { fixed: result.fixed, errors: result.errors },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        fixed: result.fixed,
        errors: result.errors,
        fixedTokens: result.fixedTokens,
      },
    });
  })
);

export default router;
