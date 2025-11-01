import PaymentTransactionModel from '../models/PaymentTransaction.model.js';
import InvoiceService from './Invoice.service.js';
import { supabase } from '../config/database.js';
import PDFDocument from 'pdfkit';

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

  /**
   * Get all payment transactions for admin with filters
   */
  async getAllTransactionsAdmin(filters) {
    try {
      const { start_date, end_date, payment_method, received_by, limit, offset } = filters;
      
      const result = await PaymentTransactionModel.getAllTransactionsAdmin({
        start_date,
        end_date,
        payment_method,
        received_by,
        limit,
        offset
      });
      
      // Fetch cashier info for each payment
      if (result.data && result.data.length > 0) {
        const cashierIds = [...new Set(result.data.map(p => p.received_by).filter(Boolean))];
        
        if (cashierIds.length > 0) {
          const { data: cashiers } = await supabase
            .from('users')
            .select('id, first_name, last_name, role')
            .in('id', cashierIds);
          
          const cashierMap = {};
          if (cashiers) {
            cashiers.forEach(c => {
              cashierMap[c.id] = c;
            });
          }
          
          // Attach cashier info to each payment
          result.data = result.data.map(payment => ({
            ...payment,
            received_by_user: payment.received_by ? cashierMap[payment.received_by] : null
          }));
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get all transactions: ${error.message}`);
    }
  }

  /**
   * Generate payment receipt PDF
   */
  async generateReceiptPDF(paymentId) {
    try {
      // Get payment details with invoice and patient info
      const { data: payment, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            total_amount,
            patient:patients(
              id,
              first_name,
              last_name,
              patient_number
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        throw new Error('Payment not found');
      }

      // Get cashier info
      if (payment.received_by) {
        const { data: cashier } = await supabase
          .from('users')
          .select('id, first_name, last_name, role')
          .eq('id', payment.received_by)
          .single();
        
        payment.received_by_user = cashier;
      }

      // Generate PDF using PDFKit
      const doc = new PDFDocument({ margin: 50 });

      // Header
      doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('================================================', { align: 'center' });
      doc.moveDown();

      // Receipt details
      doc.fontSize(12).text(`Receipt #: ${payment.payment_reference || 'N/A'}`);
      doc.fontSize(10).text(`Date: ${new Date(payment.received_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
      doc.moveDown();

      // Patient Information
      doc.fontSize(14).text('PATIENT INFORMATION', { underline: true });
      doc.fontSize(10);
      doc.text(`Name: ${payment.invoice?.patient?.first_name || ''} ${payment.invoice?.patient?.last_name || ''}`);
      doc.text(`Patient #: ${payment.invoice?.patient?.patient_number || 'N/A'}`);
      doc.moveDown();

      // Payment Details
      doc.fontSize(14).text('PAYMENT DETAILS', { underline: true });
      doc.fontSize(10);
      doc.text(`Invoice #: ${payment.invoice?.invoice_number || 'N/A'}`);
      doc.text(`Amount Paid: $${payment.amount?.toFixed(2) || '0.00'}`, { fontSize: 12, bold: true });
      doc.text(`Payment Method: ${payment.payment_method?.toUpperCase() || 'N/A'}`);
      
      if (payment.payment_notes) {
        doc.moveDown(0.5);
        doc.text(`Notes: ${payment.payment_notes}`);
      }
      doc.moveDown();

      // Received By
      doc.fontSize(14).text('RECEIVED BY', { underline: true });
      doc.fontSize(10);
      doc.text(`Cashier: ${payment.received_by_user?.first_name || ''} ${payment.received_by_user?.last_name || 'N/A'}`);
      doc.text(`Role: ${payment.received_by_user?.role || 'N/A'}`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text('================================================', { align: 'center' });
      doc.fontSize(12).text('Thank you for your payment!', { align: 'center' });
      doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      return doc;
    } catch (error) {
      throw new Error(`Failed to generate receipt PDF: ${error.message}`);
    }
  }
}

export default new PaymentService();
