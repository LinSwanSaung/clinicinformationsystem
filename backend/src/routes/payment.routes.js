import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import PaymentService from '../services/Payment.service.js';

const router = express.Router();

/**
 * @route   POST /api/payments
 * @desc    Record a payment
 * @access  Private (Cashier, Admin)
 */
router.post('/',
  authenticate,
  authorize('admin', 'cashier'),
  asyncHandler(async (req, res) => {
    const { invoice_id, amount, payment_method, payment_reference, payment_notes } = req.body;
    
    if (!invoice_id) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id is required'
      });
    }

    const paymentData = {
      amount,
      payment_method,
      payment_reference,
      payment_notes
    };

    const payment = await PaymentService.recordPayment(invoice_id, paymentData, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  })
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private (All roles)
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'cashier', 'pharmacist', 'doctor', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await PaymentService.getPaymentById(id);
    
    res.status(200).json({
      success: true,
      data: payment
    });
  })
);

/**
 * @route   GET /api/payments/invoice/:invoiceId
 * @desc    Get all payments for an invoice
 * @access  Private (All roles)
 */
router.get('/invoice/:invoiceId',
  authenticate,
  authorize('admin', 'cashier', 'pharmacist', 'doctor', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const payments = await PaymentService.getPaymentsByInvoice(invoiceId);
    
    res.status(200).json({
      success: true,
      data: payments
    });
  })
);

/**
 * @route   GET /api/payments/report
 * @desc    Get payment report by date range
 * @access  Private (Admin, Cashier)
 */
router.get('/report',
  authenticate,
  authorize('admin', 'cashier'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const report = await PaymentService.getPaymentReport(start_date, end_date);
    
    res.status(200).json({
      success: true,
      data: report
    });
  })
);

export default router;
