import PaymentTransactionModel from '../models/PaymentTransaction.model.js';
import InvoiceService from './Invoice.service.js';
import { getUsersByIds, getPaymentWithRelations, getPatientRemainingCredit } from './repositories/BillingRepo.js';
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
        received_by: receivedBy,
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
        by_method: {},
      };

      // Group by payment method
      payments.forEach((payment) => {
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
        offset,
      });

      // Fetch cashier info for each payment
      if (result.data && result.data.length > 0) {
        const cashierIds = [...new Set(result.data.map((p) => p.received_by).filter(Boolean))];
        if (cashierIds.length > 0) {
          const cashiers = await getUsersByIds(cashierIds);
          const cashierMap = {};
          (cashiers || []).forEach((c) => {
            cashierMap[c.id] = c;
          });
          result.data = result.data.map((payment) => ({
            ...payment,
            received_by_user: payment.received_by ? cashierMap[payment.received_by] : null,
          }));
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get all transactions: ${error.message}`);
    }
  }

  /**
   * Generate payment receipt PDF - Professional invoice-style design
   */
  async generateReceiptPDF(paymentId) {
    try {
      // Get payment details with comprehensive invoice and patient info
      const payment = await getPaymentWithRelations(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const invoice = payment.invoice;
      if (!invoice) {
        throw new Error('Invoice not found for this payment');
      }

      // Get patient's total remaining credit across all invoices
      const patientRemainingCredit = await getPatientRemainingCredit(invoice.patient.id);

      // Fetch payment transactions separately to avoid nested query issues
      const paymentTransactions = await PaymentTransactionModel.getPaymentsByInvoice(invoice.id);
      
      // Get cashier info for all payments
      const allCashierIds = [
        ...(paymentTransactions || [])
          .map((pt) => pt.received_by || pt.processed_by)
          .filter(Boolean),
        payment.received_by,
      ].filter(Boolean);
      
      if (allCashierIds.length > 0) {
        const cashiers = await getUsersByIds([...new Set(allCashierIds)]);
        const cashierMap = {};
        (cashiers || []).forEach((c) => {
          cashierMap[c.id] = c;
        });
        
        // Attach cashier info to payment
        if (payment.received_by) {
          payment.received_by_user = cashierMap[payment.received_by] || null;
        }
        
        // Attach cashier info to payment transactions
        invoice.payment_transactions = (paymentTransactions || []).map((pt) => ({
          ...pt,
          received_by_user: pt.received_by ? cashierMap[pt.received_by] : null,
          processed_by_user: pt.processed_by ? cashierMap[pt.processed_by] : null,
        }));
      } else {
        invoice.payment_transactions = paymentTransactions || [];
      }

      // Generate PDF using PDFKit with professional design
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        bufferPages: true 
      });

      // Helper function to draw a box
      const drawBox = (x, y, width, height, fillColor = '#f8fafc', strokeColor = '#e2e8f0') => {
        doc.rect(x, y, width, height).fillAndStroke(fillColor, strokeColor).fillColor('#000000');
      };

      // Professional Header with colored background
      const headerHeight = 120;
      doc.rect(0, 0, doc.page.width, headerHeight).fillAndStroke('#1e40af', '#1e40af');
      
      doc
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('RealCIS', 50, 30)
        .fontSize(12)
        .font('Helvetica')
        .text('Healthcare System', 50, 62);

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE RECEIPT', doc.page.width - 250, 85, { align: 'right' });

      // Reset position after header
      doc.fillColor('#000000');
      let yPos = 140;

      // Invoice & Date Info Box
      drawBox(50, yPos, doc.page.width - 100, 60, '#f0f9ff', '#bfdbfe');
      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Invoice Information', 60, yPos + 10);
      
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${invoice.invoice_number || 'N/A'}`, 60, yPos + 30)
        .text(
          `Date: ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          }) : 'N/A'}`,
          60,
          yPos + 45
        )
        .text(
          `Time: ${invoice.created_at ? new Date(invoice.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
          minute: '2-digit',
            hour12: true,
          }) : 'N/A'}`,
          doc.page.width - 150,
          yPos + 30
        );

      yPos += 80;

      // Patient Information Box
      drawBox(50, yPos, doc.page.width - 100, 100, '#f0f9ff', '#bfdbfe');
      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Patient Information', 60, yPos + 10);
      
      const patient = invoice.patient || {};
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${patient.first_name || ''} ${patient.last_name || ''}`, 60, yPos + 30)
        .text(`Patient #: ${patient.patient_number || 'N/A'}`, 60, yPos + 45)
        .text(`Phone: ${patient.phone || 'N/A'}`, 60, yPos + 60)
        .text(`Email: ${patient.email || 'N/A'}`, doc.page.width - 250, yPos + 30, { align: 'right' });

      const visit = invoice.visit || {};
      const doctor = visit.doctor || {};
      const doctorName = 
        `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'N/A';
      
      doc
        .text(`Doctor: ${doctorName}`, doc.page.width - 250, yPos + 45, { align: 'right' })
        .text(`Visit Type: ${visit.visit_type ? visit.visit_type.charAt(0).toUpperCase() + visit.visit_type.slice(1) : 'N/A'}`, doc.page.width - 250, yPos + 60, { align: 'right' });

      yPos += 120;

      // Services & Items Section
      const invoiceItems = invoice.invoice_items || [];
      const services = invoiceItems.filter((item) => item.item_type === 'service');
      const medications = invoiceItems.filter((item) => item.item_type === 'medicine');

      if (services.length > 0 || medications.length > 0) {
        drawBox(50, yPos, doc.page.width - 100, 40, '#f0f9ff', '#bfdbfe');
        doc
          .fillColor('#1e40af')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Services & Items', 60, yPos + 12);
        yPos += 50;

        // Services
        if (services.length > 0) {
          doc
            .fillColor('#059669')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Services', 60, yPos);
          yPos += 20;

          // Table header
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Item', 60, yPos)
            .text('Quantity', 200, yPos)
            .text('Unit Price', 280, yPos)
            .text('Total', doc.page.width - 150, yPos, { align: 'right' });
          
          yPos += 15;
          doc.moveTo(60, yPos).lineTo(doc.page.width - 50, yPos).stroke('#e5e7eb');
          yPos += 10;

          services.forEach((service) => {
            if (yPos > doc.page.height - 100) {
              doc.addPage();
              yPos = 50;
            }

            const quantity = parseFloat(service.quantity || 1);
            const unitPrice = parseFloat(service.unit_price || 0);
            const total = quantity * unitPrice;

            doc
              .fillColor('#374151')
              .fontSize(9)
              .font('Helvetica')
              .text(service.item_name || 'Service', 60, yPos, { width: 130 })
              .text(quantity.toString(), 200, yPos)
              .text(`$${unitPrice.toFixed(2)}`, 280, yPos)
              .text(`$${total.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });

            if (service.notes || service.item_description) {
              doc
                .fillColor('#6b7280')
                .fontSize(8)
                .text(`  ${service.notes || service.item_description || ''}`, 60, yPos + 12, { width: 400 });
              yPos += 15;
            }
            yPos += 15;
          });
          yPos += 10;
        }

        // Medications
        if (medications.length > 0) {
          if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
          }

          doc
            .fillColor('#2563eb')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Medications', 60, yPos);
          yPos += 20;

          // Table header
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Medication', 60, yPos)
            .text('Quantity', 200, yPos)
            .text('Unit Price', 280, yPos)
            .text('Total', doc.page.width - 150, yPos, { align: 'right' });
          
          yPos += 15;
          doc.moveTo(60, yPos).lineTo(doc.page.width - 50, yPos).stroke('#e5e7eb');
          yPos += 10;

          medications.forEach((med) => {
            if (yPos > doc.page.height - 100) {
              doc.addPage();
              yPos = 50;
            }

            const quantity = parseFloat(med.quantity || 1);
            const unitPrice = parseFloat(med.unit_price || 0);
            const total = quantity * unitPrice;

            doc
              .fillColor('#374151')
              .fontSize(9)
              .font('Helvetica')
              .text(med.item_name || 'Medication', 60, yPos, { width: 130 })
              .text(quantity.toString(), 200, yPos)
              .text(`$${unitPrice.toFixed(2)}`, 280, yPos)
              .text(`$${total.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });

            if (med.notes || med.item_description) {
              doc
                .fillColor('#6b7280')
                .fontSize(8)
                .text(`  ${med.notes || med.item_description || ''}`, 60, yPos + 12, { width: 400 });
              yPos += 15;
            }
            yPos += 15;
          });
          yPos += 10;
        }
      }

      // Invoice Summary
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
      }

      // Get invoice totals first
      const subtotal = parseFloat(invoice.total_amount || 0);
      
      // Calculate paid amount from payment transactions (matches frontend logic)
      // Use invoice.payment_transactions (already fetched above)
      const calculatedPaid = (invoice.payment_transactions || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const paid = parseFloat(invoice.amount_paid || calculatedPaid || 0);
      
      // Calculate balance manually (matches frontend: total - paid)
      const balance = subtotal - paid;
      
      // Calculate credit amount from payment transactions (matches frontend exactly)
      // Credit can come from:
      // 1. Payments that paid off previous invoices (notes mention "paid with current visit" or "previous invoice")
      // 2. Overpayment (when paid amount > total amount, creating a credit balance)
      let creditFromPrevious = 0;
      
      if (invoice.payment_transactions && invoice.payment_transactions.length > 0) {
        // Calculate credit from payments that paid off previous invoices
        creditFromPrevious = invoice.payment_transactions
          .filter((pt) => {
            const notes = (pt.payment_notes || pt.notes || '').toLowerCase();
            return (
              notes.includes('paid with current visit') ||
              notes.includes('previous invoice') ||
              notes.includes('outstanding balance') ||
              notes.includes('from previous invoices')
            );
          })
          .reduce((sum, pt) => sum + parseFloat(pt.amount || 0), 0);
      }
      
      // Calculate credit from overpayment (when paid > total, negative balance)
      // This matches frontend: balance < 0 ? Math.abs(balance) : 0
      const creditFromOverpayment = balance < 0 ? Math.abs(balance) : 0;
      
      // Total credit amount (matches frontend: creditFromPrevious + creditFromOverpayment)
      const creditAmount = creditFromPrevious + creditFromOverpayment;

      drawBox(50, yPos, doc.page.width - 100, creditAmount > 0 ? 140 : 120, '#f9fafb', '#e5e7eb');
      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Invoice Summary', 60, yPos + 10);

      yPos += 30;
      const discount = parseFloat(invoice.discount_amount || 0);
      const total = subtotal;

      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 60, yPos)
        .text(`$${subtotal.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });

      if (discount > 0) {
        yPos += 15;
        doc
          .fillColor('#059669')
          .text('Discount:', 60, yPos)
          .text(`-$${discount.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });
      }

      yPos += 20;
      doc.moveTo(60, yPos).lineTo(doc.page.width - 50, yPos).stroke('#d1d5db');
      yPos += 15;

      // Total Amount
      doc
        .fillColor('#000000')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Amount:', 60, yPos)
        .text(`$${total.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });

      // Credit Amount (from previous invoices or overpayment)
      // Show credit if there's any credit amount (matches frontend: totalCredit > 0)
      if (creditAmount > 0) {
        yPos += 20;
        doc
          .fillColor('#2563eb')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Credit from Previous Invoices:', 60, yPos)
          .text(`$${creditAmount.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });
      }

      // Paid Amount
      yPos += 20;
      doc
        .fillColor('#059669')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Paid Amount:', 60, yPos)
        .text(`$${paid.toFixed(2)}`, doc.page.width - 150, yPos, { align: 'right' });

      // Balance Due (if positive)
      if (balance > 0) {
        yPos += 20;
        doc
          .fillColor('#dc2626')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Balance Due:', 60, yPos)
          .text(
            `$${balance.toFixed(2)}`,
            doc.page.width - 150,
            yPos,
            { align: 'right' }
          );
      }

      // Show patient's total remaining credit if there's any credit
      if (patientRemainingCredit > 0) {
        yPos += 20;
        doc
          .fillColor('#2563eb')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Credit Remaining:', 60, yPos)
          .text(`$${patientRemainingCredit.toFixed(2)} (Credit)`, doc.page.width - 150, yPos, { align: 'right' });
      }

      yPos += 40;

      // Payment History
      if (invoice.payment_transactions && invoice.payment_transactions.length > 0) {
        if (yPos > doc.page.height - 150) {
          doc.addPage();
          yPos = 50;
        }

        drawBox(50, yPos, doc.page.width - 100, 40, '#f0f9ff', '#bfdbfe');
        doc
          .fillColor('#1e40af')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Payment History', 60, yPos + 12);
        yPos += 50;

        invoice.payment_transactions.forEach((pt) => {
          if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
          }

          const ptDate = pt.received_at || pt.created_at;
          const paymentDate = ptDate
            ? new Date(ptDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'N/A';
          const paymentTime = ptDate
            ? new Date(ptDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : 'N/A';

          const isCredit = 
            parseFloat(pt.amount || 0) < 0 ||
            pt.payment_notes?.toLowerCase().includes('credit') ||
            pt.payment_notes?.toLowerCase().includes('due credit');

          const boxColor = isCredit ? '#dbeafe' : '#d1fae5';
          const borderColor = isCredit ? '#93c5fd' : '#a7f3d0';
          drawBox(50, yPos, doc.page.width - 100, 50, boxColor, borderColor);

          const cashierName = pt.received_by_user
            ? `${pt.received_by_user.first_name || ''} ${pt.received_by_user.last_name || ''}`.trim() || 'Unknown'
            : pt.processed_by_user
              ? `${pt.processed_by_user.first_name || ''} ${pt.processed_by_user.last_name || ''}`.trim() || 'Unknown'
              : 'Unknown';

          doc
            .fillColor(isCredit ? '#1e40af' : '#059669')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`$${Math.abs(parseFloat(pt.amount || 0)).toFixed(2)}`, 60, yPos + 8)
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text(
              `${pt.payment_method ? pt.payment_method.toUpperCase() : 'N/A'}`,
              60,
              yPos + 22
            );

          if (isCredit) {
            doc
              .fillColor('#1e40af')
              .fontSize(8)
              .font('Helvetica-Bold')
              .text('Credit Payment', 60, yPos + 35);
          }

          if (pt.payment_notes) {
            doc
              .fillColor('#6b7280')
              .fontSize(8)
              .text(pt.payment_notes, 150, yPos + 22, { width: 200 });
          }

          doc
            .fillColor('#374151')
            .fontSize(9)
            .font('Helvetica')
            .text(paymentDate, doc.page.width - 150, yPos + 8, { align: 'right' })
            .text(paymentTime, doc.page.width - 150, yPos + 22, { align: 'right' })
            .text(cashierName, doc.page.width - 150, yPos + 35, { align: 'right' });

          yPos += 60;
        });
      }

      // Footer
      if (yPos > doc.page.height - 80) {
        doc.addPage();
        yPos = doc.page.height - 100;
      } else {
        yPos = doc.page.height - 80;
      }

      doc
        .fillColor('#6b7280')
        .fontSize(9)
        .font('Helvetica')
        .moveTo(50, yPos)
        .lineTo(doc.page.width - 50, yPos)
        .stroke('#e5e7eb')
        .text('Thank you for your payment!', doc.page.width / 2, yPos + 10, { align: 'center' })
        .fontSize(8)
        .text(
          `Generated on: ${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          doc.page.width / 2,
          yPos + 25,
          { align: 'center' }
        );

      return doc;
    } catch (error) {
      throw new Error(`Failed to generate receipt PDF: ${error.message}`);
    }
  }
}

export default new PaymentService();
