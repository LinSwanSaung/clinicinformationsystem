import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import InvoiceService from '../services/Invoice.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * @route   GET /api/invoices/pending
 * @desc    Get all pending invoices (for cashier dashboard)
 * @access  Private (Cashier, Pharmacist, Admin)
 */
router.get(
  '/pending',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'pharmacist'),
  asyncHandler(async (req, res) => {
    const invoices = await InvoiceService.getPendingInvoices();

    res.status(200).json({
      success: true,
      data: invoices,
    });
  })
);

/**
 * @route   GET /api/invoices/completed
 * @desc    Get completed invoices (invoice history)
 * @access  Private (Cashier, Pharmacist, Admin)
 */
router.get(
  '/completed',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    const invoices = await InvoiceService.getCompletedInvoices({
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  })
);

/**
 * @route   GET /api/invoices/visit/:visitId
 * @desc    Get invoice by visit ID
 * @access  Private (All roles)
 */
router.get(
  '/visit/:visitId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier', 'pharmacist', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    const invoice = await InvoiceService.getInvoiceByVisit(visitId);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  })
);

/**
 * @route   GET /api/invoices/patient/:patientId
 * @desc    Get all invoices for a patient
 * @access  Private (All roles)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier', 'pharmacist', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const invoices = await InvoiceService.getInvoicesByPatient(patientId);

    res.status(200).json({
      success: true,
      data: invoices,
    });
  })
);

/**
 * @route   POST /api/invoices
 * @desc    Create invoice for a visit
 * @access  Private (Doctor, Cashier, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier'),
  asyncHandler(async (req, res) => {
    const { visit_id } = req.body;

    if (!visit_id) {
      return res.status(400).json({
        success: false,
        message: 'visit_id is required',
      });
    }

    const invoice = await InvoiceService.createInvoice(visit_id, req.user.id);

    // Audit log
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'INVOICE.CREATE',
      entity_type: 'invoices',
      entity_id: invoice.id,
      status: 'success',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  })
);

/**
 * @route   POST /api/invoices/:id/items/service
 * @desc    Add service item to invoice
 * @access  Private (Doctor, Cashier, Admin)
 */
router.post(
  '/:id/items/service',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await InvoiceService.addServiceItem(id, req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Service item added successfully',
      data: item,
    });
  })
);

/**
 * @route   POST /api/invoices/:id/items/medicine
 * @desc    Add medicine item to invoice
 * @access  Private (Doctor, Cashier, Pharmacist, Admin)
 */
router.post(
  '/:id/items/medicine',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await InvoiceService.addMedicineItem(id, req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Medicine item added successfully',
      data: item,
    });
  })
);

/**
 * @route   POST /api/invoices/:id/prescriptions
 * @desc    Add all prescriptions from visit to invoice
 * @access  Private (Doctor, Cashier, Pharmacist, Admin)
 */
router.post(
  '/:id/prescriptions',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { visit_id } = req.body;

    if (!visit_id) {
      return res.status(400).json({
        success: false,
        message: 'visit_id is required',
      });
    }

    const items = await InvoiceService.addPrescriptionsToInvoice(id, visit_id, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Prescriptions added to invoice successfully',
      data: items,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/items/:itemId
 * @desc    Update invoice item
 * @access  Private (Cashier, Pharmacist, Admin)
 */
router.put(
  '/:id/items/:itemId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const item = await InvoiceService.updateInvoiceItem(itemId, req.body);

    res.status(200).json({
      success: true,
      message: 'Invoice item updated successfully',
      data: item,
    });
  })
);

/**
 * @route   DELETE /api/invoices/:id/items/:itemId
 * @desc    Remove invoice item
 * @access  Private (Doctor during active consultation, Cashier, Pharmacist, Admin)
 */
router.delete(
  '/:id/items/:itemId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.CASHIER, 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const item = await InvoiceService.removeInvoiceItem(itemId, req.user);

    res.status(200).json({
      success: true,
      message: 'Invoice item removed successfully',
      data: item,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/discount
 * @desc    Update invoice discount
 * @access  Private (Cashier, Admin)
 */
router.put(
  '/:id/discount',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { discount_amount, discount_percentage } = req.body;

    const invoice = await InvoiceService.updateDiscount(id, discount_amount, discount_percentage);

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: invoice,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/complete
 * @desc    Complete invoice (mark as paid) and complete the visit
 * @access  Private (Cashier, Admin)
 */
router.put(
  '/:id/complete',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { completed_by } = req.body;
    const userId = completed_by || req.user.id;

    const invoice = await InvoiceService.completeInvoice(id, userId);

    // Audit log - CRITICAL: Track who completed the invoice
    await logAuditEvent({
      actor_id: userId,
      actor_role: req.user.role,
      action: 'INVOICE.COMPLETE',
      entity_type: 'invoices',
      entity_id: id,
      status: 'success',
      reason: 'Invoice completed and marked as paid',
      old_values: { status: 'pending' },
      new_values: { status: 'paid', completed_by: userId, completed_at: new Date() },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Invoice completed successfully. Visit has been marked as completed.',
      data: invoice,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/cancel
 * @desc    Cancel invoice
 * @access  Private (Cashier, Admin)
 */
router.put(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await InvoiceService.cancelInvoice(id, req.user.id, reason);

    // Audit log - Track invoice cancellation with reason
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'INVOICE.CANCEL',
      entity_type: 'invoices',
      entity_id: id,
      status: 'success',
      reason: `Invoice cancelled: ${reason || 'No reason provided'}`,
      old_values: { status: 'pending' },
      new_values: { status: 'cancelled', cancelled_by: req.user.id, cancelled_reason: reason },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Invoice cancelled successfully',
      data: invoice,
    });
  })
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, 'cashier', 'pharmacist', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await InvoiceService.getInvoiceById(id);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  })
);

/**
 * @route   GET /api/invoices/patient/:patientId/outstanding
 * @desc    Get patient's outstanding invoices
 * @access  Private (Cashier, Admin)
 */
router.get(
  '/patient/:patientId/outstanding',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const invoices = await InvoiceService.getPatientOutstandingInvoices(patientId);

    res.status(200).json({
      success: true,
      data: invoices,
    });
  })
);

/**
 * @route   GET /api/invoices/patient/:patientId/outstanding-balance
 * @desc    Get patient's total outstanding balance
 * @access  Private (Cashier, Admin)
 */
router.get(
  '/patient/:patientId/outstanding-balance',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const balance = await InvoiceService.getPatientOutstandingBalance(patientId);

    res.status(200).json({
      success: true,
      data: balance,
    });
  })
);

/**
 * @route   GET /api/invoices/patient/:patientId/remaining-credit
 * @desc    Get patient's total remaining credit
 * @access  Private (Cashier, Admin)
 */
router.get(
  '/patient/:patientId/remaining-credit',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const credit = await InvoiceService.getPatientRemainingCredit(patientId);

    res.status(200).json({
      success: true,
      data: credit,
    });
  })
);

/**
 * @route   GET /api/invoices/patient/:patientId/can-create
 * @desc    Check if patient can create more invoices (max 2 outstanding)
 * @access  Private (Cashier, Doctor, Admin)
 */
router.get(
  '/patient/:patientId/can-create',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'doctor', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const result = await InvoiceService.canPatientCreateInvoice(patientId);

    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route   POST /api/invoices/:id/partial-payment
 * @desc    Record partial payment for invoice
 * @access  Private (Cashier, Admin)
 */
router.post(
  '/:id/partial-payment',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, notes, hold_reason, payment_due_date } = req.body;

    if (!amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'amount and payment_method are required',
      });
    }

    const paymentData = {
      amount,
      payment_method,
      notes,
      hold_reason,
      payment_due_date,
      processed_by: req.user.id,
    };

    const result = await InvoiceService.recordPartialPayment(id, paymentData);

    // Audit log - Track partial payments
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'INVOICE.PAYMENT',
      entity_type: 'invoices',
      entity_id: id,
      status: 'success',
      reason: `Partial payment recorded: ${amount} via ${payment_method}`,
      new_values: { amount, payment_method, notes, processed_by: req.user.id },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result,
    });
  })
);

/**
 * @route   GET /api/invoices/:id/payment-history
 * @desc    Get payment history for invoice
 * @access  Private (Cashier, Admin)
 */
router.get(
  '/:id/payment-history',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const history = await InvoiceService.getPaymentHistory(id);

    res.status(200).json({
      success: true,
      data: history,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/hold
 * @desc    Put invoice on hold
 * @access  Private (Cashier, Admin)
 */
router.put(
  '/:id/hold',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, payment_due_date } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'reason is required',
      });
    }

    const holdData = { reason, payment_due_date };
    const invoice = await InvoiceService.putInvoiceOnHold(id, holdData);

    res.status(200).json({
      success: true,
      message: 'Invoice put on hold',
      data: invoice,
    });
  })
);

/**
 * @route   PUT /api/invoices/:id/resume
 * @desc    Resume invoice from hold
 * @access  Private (Cashier, Admin)
 */
router.put(
  '/:id/resume',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await InvoiceService.resumeInvoiceFromHold(id);

    res.status(200).json({
      success: true,
      message: 'Invoice resumed from hold',
      data: invoice,
    });
  })
);

export default router;
