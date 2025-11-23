import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import PaymentService from '../services/Payment.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * @route   POST /api/payments
 * @desc    Record a payment
 * @access  Private (Cashier, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { invoice_id, amount, payment_method, payment_reference, payment_notes, version } =
      req.body;

    if (!invoice_id) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id is required',
      });
    }

    const paymentData = {
      amount,
      payment_method,
      payment_reference,
      payment_notes,
    };

    const payment = await PaymentService.recordPayment(
      invoice_id,
      paymentData,
      req.user.id,
      version
    );

    // Audit log - Track payment transaction
    await logAuditEvent({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'PAYMENT.RECORD',
      entity_type: 'payment_transactions',
      entity_id: payment.id,
      status: 'success',
      reason: `Payment recorded: ${amount} via ${payment_method}`,
      new_values: { amount, payment_method, payment_reference, invoice_id },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  })
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (All roles)
 */
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'pharmacist', 'doctor', ROLES.RECEPTIONIST),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await PaymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      data: payment,
    });
  })
);

/**
 * @route   GET /api/payments/invoice/:invoiceId
 * @desc    Get all payments for an invoice
 * @access  Private (All roles)
 */
router.get(
  '/invoice/:invoiceId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, 'pharmacist', 'doctor', ROLES.RECEPTIONIST),
  asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const payments = await PaymentService.getPaymentsByInvoice(invoiceId);

    res.status(200).json({
      success: true,
      data: payments,
    });
  })
);

/**
 * @route   GET /api/payments/report
 * @desc    Get payment report by date range
 * @access  Private (Admin, Cashier)
 */
router.get(
  '/report',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required',
      });
    }

    const report = await PaymentService.getPaymentReport(start_date, end_date);

    res.status(200).json({
      success: true,
      data: report,
    });
  })
);

/**
 * @route   GET /api/payments/admin/all-transactions
 * @desc    Get all payment transactions for admin with filters
 * @access  Private (Admin only)
 */
router.get(
  '/admin/all-transactions',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { start_date, end_date, payment_method, received_by, limit = 50, offset = 0 } = req.query;

    const payments = await PaymentService.getAllTransactionsAdmin({
      start_date,
      end_date,
      payment_method,
      received_by,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: payments.data,
      total: payments.total,
    });
  })
);

/**
 * @route   GET /api/payments/:id/receipt/pdf
 * @desc    Generate and download payment receipt as PDF
 * @access  Private (Admin, Cashier)
 */
router.get(
  '/:id/receipt/pdf',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pdf = await PaymentService.generateReceiptPDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.pdf`);
    pdf.pipe(res);
    pdf.end();
  })
);

export default router;
