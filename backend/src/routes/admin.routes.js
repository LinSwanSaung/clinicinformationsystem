import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { supabase } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/admin/debug/visits
 * @desc    Debug endpoint to see all active visits
 * @access  Private (Admin only)
 */
router.get('/debug/visits',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('visits')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        patients (first_name, last_name, patient_number),
        users (first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ data, error, count: data?.length });
  })
);

/**
 * @route   GET /api/admin/pending-items
 * @desc    Get all pending items across modules that need admin attention
 * @access  Private (Admin only)
 */
router.get('/pending-items',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const pendingItems = [];

    console.log('[ADMIN] Fetching pending items...');

    // Debug: Get ALL visits to see what we have
    const { data: allVisits, error: allVisitsError } = await supabase
      .from('visits')
      .select('id, status, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('[ADMIN] All visits (last 5):', allVisits);

    // Get pending visits (in_progress or active visits older than 5 minutes - for testing)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    console.log('[ADMIN] Checking for visits updated before:', fiveMinutesAgo);

    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select(`
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
      `)
      .in('status', ['in_progress', 'active', 'consulting'])
      .lt('updated_at', fiveMinutesAgo)
      .order('updated_at', { ascending: true });

    console.log('[ADMIN] Visits query result:', { count: visitsData?.length, error: visitsError });

    if (visitsError) {
      console.error('[ADMIN] Visits query error:', visitsError);
    }

    if (visitsData && visitsData.length > 0) {
      console.log('[ADMIN] Found visits:', visitsData.map(v => ({ id: v.id, status: v.status, updated: v.updated_at })));
    }

    if (!visitsError && visitsData) {
      pendingItems.push(...visitsData.map(visit => ({
        entityType: 'visit',
        entityId: visit.id,
        currentStatus: visit.status,
        lastUpdated: visit.updated_at,
        patientName: `${visit.patients.first_name} ${visit.patients.last_name}`,
        patientNumber: visit.patients.patient_number,
        doctorName: visit.users ? `${visit.users.first_name} ${visit.users.last_name}` : null,
        resolvedByAdmin: visit.resolved_by_admin,
        resolvedReason: visit.resolved_reason
      })));
    }

    // Get pending appointments (scheduled but not completed/cancelled, older than 1 hour past scheduled time)
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
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
      `)
      .eq('status', 'scheduled')
      .order('appointment_date', { ascending: true });

    if (!appointmentsError && appointmentsData) {
      // Filter appointments that are past their scheduled time by more than 1 hour
      const now = new Date();
      const pastAppointments = appointmentsData.filter(appointment => {
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        return appointmentDateTime < new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      });

      pendingItems.push(...pastAppointments.map(appointment => ({
        entityType: 'appointment',
        entityId: appointment.id,
        currentStatus: appointment.status,
        lastUpdated: appointment.updated_at,
        patientName: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
        patientNumber: appointment.patients.patient_number,
        doctorName: appointment.users ? `${appointment.users.first_name} ${appointment.users.last_name}` : null,
        resolvedByAdmin: appointment.resolved_by_admin,
        resolvedReason: appointment.resolved_reason
      })));
    }

    // Get pending queue tokens (active tokens older than 4 hours)
    const { data: queueData, error: queueError } = await supabase
      .from('queue_tokens')
      .select(`
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
      `)
      .in('status', ['waiting', 'called', 'serving', 'delayed'])
      .lt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!queueError && queueData) {
      pendingItems.push(...queueData.map(token => ({
        entityType: 'queue',
        entityId: token.id,
        currentStatus: token.status,
        lastUpdated: token.updated_at,
        patientName: `${token.patients.first_name} ${token.patients.last_name}`,
        patientNumber: token.patients.patient_number,
        doctorName: token.users ? `${token.users.first_name} ${token.users.last_name}` : null,
        resolvedByAdmin: token.resolved_by_admin,
        resolvedReason: token.resolved_reason
      })));
    }

    // Get pending invoices (unpaid invoices older than 7 days)
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
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
      `)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!invoicesError && invoicesData) {
      pendingItems.push(...invoicesData.map(invoice => ({
        entityType: 'billing',
        entityId: invoice.id,
        currentStatus: invoice.status,
        lastUpdated: invoice.updated_at,
        patientName: `${invoice.patients.first_name} ${invoice.patients.last_name}`,
        patientNumber: invoice.patients.patient_number,
        doctorName: null,
        resolvedByAdmin: invoice.resolved_by_admin,
        resolvedReason: invoice.resolved_reason
      })));
    }

    console.log('[ADMIN] Total pending items found:', pendingItems.length);

    res.json(pendingItems);
  })
);

/**
 * @route   POST /api/admin/override
 * @desc    Admin override for resolving stuck records
 * @access  Private (Admin only)
 */
router.post('/override',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { entityType, entityId, newStatus, reason } = req.body;

    // Validate required fields
    if (!entityType || !entityId || !newStatus || !reason) {
      throw new AppError('Entity type, entity ID, new status, and reason are required', 400);
    }

    if (!reason.trim()) {
      throw new AppError('Reason cannot be empty', 400);
    }

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
      console.error('[ADMIN] Failed to fetch record:', fetchError);
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
        updated_at: new Date().toISOString()
      })
      .eq(idColumn, entityId);

    if (updateError) {
      console.error('[ADMIN] Failed to update record:', updateError);
      throw new AppError(`Failed to update ${entityType} record: ${updateError.message}`, 500);
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
        resolved_reason: reason
      }
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
        reason
      }
    });
  })
);

export default router;