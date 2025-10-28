import PaymentTransactionModel from '../models/PaymentTransaction.model.js';
import InvoiceService from './Invoice.service.js';

/**
 * Payment Service - Business logic for payments
 */
class PaymentService {
  /**
   * Record a payment
   */
  async recordPayment(invoiceId, paymentData, receivedBy) {
    try {
      const { amount, payment_method, payment_reference, payment_notes } = paymentData;

      // Validate required fields
      if (!amount || !payment_method) {
        throw new Error('Missing required fields: amount, payment_method');
      }

      // Validate payment method
      const validMethods = ['cash', 'card', 'insurance', 'mobile_payment'];
      if (!validMethods.includes(payment_method)) {
        throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
      }

      // Validate amount
      if (parseFloat(amount) <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Create payment transaction
      const paymentTransaction = {
        invoice_id: invoiceId,
        amount: parseFloat(amount),
        payment_method,
        payment_reference,
        payment_notes,
        received_by: receivedBy
      };

      const payment = await PaymentTransactionModel.createPayment(paymentTransaction);

      // Recalculate invoice totals
      await InvoiceService.recalculateInvoiceTotal(invoiceId);

      // Check if invoice is fully paid
      const invoice = await InvoiceService.getInvoiceById(invoiceId);
      if (parseFloat(invoice.balance) <= 0) {
        await InvoiceService.completeInvoice(invoiceId, receivedBy);
      } else if (parseFloat(invoice.paid_amount) > 0) {
        // Partial payment
        const InvoiceModel = (await import('../models/Invoice.model.js')).default;
        await InvoiceModel.updateInvoice(invoiceId, { status: 'partial' });
      }

      return payment;
    } catch (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  }

  /**
   * Get payments by invoice
   */
  async getPaymentsByInvoice(invoiceId) {
    try {
      const payments = await PaymentTransactionModel.getPaymentsByInvoice(invoiceId);
      return payments;
    } catch (error) {
      throw new Error(`Failed to get payments: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id) {
    try {
      const payment = await PaymentTransactionModel.getPaymentById(id);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      throw new Error(`Failed to get payment: ${error.message}`);
    }
  }

  /**
   * Get payment report by date range
   */
  async getPaymentReport(startDate, endDate) {
    try {
      const payments = await PaymentTransactionModel.getPaymentReport(startDate, endDate);
      
      // Calculate summary
      const summary = {
        total_payments: payments.length,
        total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        by_method: {}
      };

      // Group by payment method
      payments.forEach(payment => {
        const method = payment.payment_method;
        if (!summary.by_method[method]) {
          summary.by_method[method] = { count: 0, amount: 0 };
        }
        summary.by_method[method].count += 1;
        summary.by_method[method].amount += parseFloat(payment.amount);
      });

      return { payments, summary };
    } catch (error) {
      throw new Error(`Failed to get payment report: ${error.message}`);
    }
  }
}

export default new PaymentService();
