import InvoiceModel from '../models/Invoice.model.js';
import InvoiceItemModel from '../models/InvoiceItem.model.js';
import PaymentTransactionModel from '../models/PaymentTransaction.model.js';
import VisitService from './Visit.service.js';
import PrescriptionService from './Prescription.service.js';
import NotificationService from './Notification.service.js';
import { ApplicationError } from '../errors/ApplicationError.js';
import { TransactionRunner } from './transactions/TransactionRunner.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import logger from '../config/logger.js';

/**
 * Invoice Service - Business logic for invoices
 */
class InvoiceService {
  constructor() {
    this.visitService = new VisitService();
    this.prescriptionService = PrescriptionService; // Use the singleton instance
  }
  /**
   * Create invoice for a visit
   */
  async createInvoice(visitId, createdBy) {
    try {
      // Get visit details
      const visitResponse = await this.visitService.getVisitDetails(visitId);
      if (!visitResponse || !visitResponse.data) {
        throw new Error('Visit not found');
      }

      const visit = visitResponse.data;

      // Check if invoice already exists for this visit
      const existingInvoice = await InvoiceModel.getInvoiceByVisit(visitId);
      if (existingInvoice) {
        return existingInvoice;
      }

      // Create invoice
      const invoiceData = {
        visit_id: visitId,
        patient_id: visit.patient_id,
        status: 'pending',
        created_by: createdBy,
        subtotal: 0.0,
        total_amount: 0.0,
        balance: 0.0,
      };

      const invoice = await InvoiceModel.createInvoice(invoiceData);

      return invoice;
    } catch (error) {
      logger.error('[InvoiceService] Error in createInvoice:', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by ID with all details
   */
  async getInvoiceById(id) {
    try {
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      return invoice;
    } catch (error) {
      throw new Error(`Failed to get invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by visit ID
   */
  async getInvoiceByVisit(visitId) {
    try {
      const invoice = await InvoiceModel.getInvoiceByVisit(visitId);
      return invoice;
    } catch (error) {
      logger.error('[InvoiceService] Error getting invoice:', error);
      throw new Error(`Failed to get invoice by visit: ${error.message}`);
    }
  }

  /**
   * Get all pending invoices
   */
  async getPendingInvoices() {
    try {
      const invoices = await InvoiceModel.getPendingInvoices();
      return invoices;
    } catch (error) {
      throw new Error(`Failed to get pending invoices: ${error.message}`);
    }
  }

  /**
   * Get completed invoices (for invoice history)
   */
  async getCompletedInvoices(options = {}) {
    try {
      const invoices = await InvoiceModel.getCompletedInvoices(options);
      return invoices;
    } catch (error) {
      throw new Error(`Failed to get completed invoices: ${error.message}`);
    }
  }

  /**
   * Get invoices by patient
   */
  async getInvoicesByPatient(patientId) {
    try {
      const invoices = await InvoiceModel.getInvoicesByPatient(patientId);
      return invoices;
    } catch (error) {
      throw new Error(`Failed to get patient invoices: ${error.message}`);
    }
  }

  /**
   * Add service item to invoice
   */
  async addServiceItem(invoiceId, serviceData, addedBy) {
    try {
      const { service_id, service_name, quantity = 1, unit_price, notes } = serviceData;

      if (!service_name || unit_price === undefined) {
        throw new Error('Missing required fields: service_name, unit_price');
      }

      const itemData = {
        invoice_id: invoiceId,
        item_type: 'service',
        item_id: service_id || null,
        item_name: service_name,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unit_price),
        total_price: parseFloat(quantity) * parseFloat(unit_price),
        added_by: addedBy,
        notes,
      };

      const item = await InvoiceItemModel.createItem(itemData);

      // Recalculate invoice totals
      await this.recalculateInvoiceTotal(invoiceId);

      return item;
    } catch (error) {
      throw new Error(`Failed to add service item: ${error.message}`);
    }
  }

  /**
   * Add medicine item to invoice
   */
  async addMedicineItem(invoiceId, medicineData, addedBy) {
    try {
      const { prescription_id, medicine_name, quantity = 1, unit_price, notes } = medicineData;

      if (!medicine_name || unit_price === undefined) {
        throw new Error('Missing required fields: medicine_name, unit_price');
      }

      const itemData = {
        invoice_id: invoiceId,
        item_type: 'medicine',
        item_id: prescription_id || null,
        item_name: medicine_name,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unit_price),
        total_price: parseFloat(quantity) * parseFloat(unit_price),
        added_by: addedBy,
        notes,
      };

      const item = await InvoiceItemModel.createItem(itemData);

      // Recalculate invoice totals
      await this.recalculateInvoiceTotal(invoiceId);

      return item;
    } catch (error) {
      throw new Error(`Failed to add medicine item: ${error.message}`);
    }
  }

  /**
   * Add prescriptions from visit to invoice
   */
  async addPrescriptionsToInvoice(invoiceId, visitId, addedBy) {
    try {
      const prescriptionResponse = await this.prescriptionService.getVisitPrescriptions(visitId);
      const prescriptions = prescriptionResponse.data || [];

      if (!prescriptions || prescriptions.length === 0) {
        return [];
      }

      const items = [];
      for (const rx of prescriptions) {
        const itemData = {
          invoice_id: invoiceId,
          item_type: 'medicine',
          item_id: rx.id,
          item_name: `${rx.medication_name} ${rx.dosage || ''}`,
          item_description: rx.instructions,
          quantity: parseFloat(rx.quantity) || 1,
          unit_price: 0.0, // Cashier will set price
          total_price: 0.0,
          added_by: addedBy,
          notes: `Prescribed: ${rx.frequency || ''} for ${rx.duration || ''}`,
        };

        const item = await InvoiceItemModel.createItem(itemData);
        items.push(item);
      }

      await this.recalculateInvoiceTotal(invoiceId);
      return items;
    } catch (error) {
      throw new Error(`Failed to add prescriptions to invoice: ${error.message}`);
    }
  }

  /**
   * Update invoice item
   */
  async updateInvoiceItem(itemId, updates) {
    try {
      // Recalculate total_price if quantity or unit_price changed
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const item = await InvoiceItemModel.getItemById(itemId);
        const quantity =
          updates.quantity !== undefined ? parseFloat(updates.quantity) : parseFloat(item.quantity);
        const unitPrice =
          updates.unit_price !== undefined
            ? parseFloat(updates.unit_price)
            : parseFloat(item.unit_price);
        updates.total_price = quantity * unitPrice;
      }

      const updatedItem = await InvoiceItemModel.updateItem(itemId, updates);

      // Recalculate invoice totals
      await this.recalculateInvoiceTotal(updatedItem.invoice_id);

      return updatedItem;
    } catch (error) {
      throw new Error(`Failed to update invoice item: ${error.message}`);
    }
  }

  /**
   * Remove invoice item
   */
  async removeInvoiceItem(itemId) {
    try {
      const item = await InvoiceItemModel.deleteItem(itemId);

      // Recalculate invoice totals
      await this.recalculateInvoiceTotal(item.invoice_id);

      return item;
    } catch (error) {
      throw new Error(`Failed to remove invoice item: ${error.message}`);
    }
  }

  /**
   * Recalculate invoice totals
   */
  async recalculateInvoiceTotal(invoiceId) {
    try {
      // Get all items for this invoice
      const items = await InvoiceItemModel.getItemsByInvoice(invoiceId);

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

      // Get current invoice to preserve discount and tax
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);

      const discountAmount = parseFloat(invoice.discount_amount || 0);
      const taxAmount = parseFloat(invoice.tax_amount || 0);
      const totalAmount = subtotal - discountAmount + taxAmount;

      // Get total paid
      const paidAmount = await PaymentTransactionModel.getTotalPaymentsByInvoice(invoiceId);
      const balance = totalAmount - paidAmount;

      // Update invoice
      await InvoiceModel.updateInvoice(invoiceId, {
        subtotal,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance,
      });

      return { subtotal, total_amount: totalAmount, paid_amount: paidAmount, balance };
    } catch (error) {
      throw new Error(`Failed to recalculate invoice total: ${error.message}`);
    }
  }

  /**
   * Update invoice discount
   */
  async updateDiscount(invoiceId, discountAmount, discountPercentage = 0) {
    try {
      await InvoiceModel.updateInvoice(invoiceId, {
        discount_amount: parseFloat(discountAmount || 0),
        discount_percentage: parseFloat(discountPercentage || 0),
      });

      await this.recalculateInvoiceTotal(invoiceId);
      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      throw new Error(`Failed to update discount: ${error.message}`);
    }
  }

  /**
   * Complete invoice (mark as paid) and complete the associated visit
   *
   * Business rule: This is the ONLY place visits should be completed.
   * Visits remain 'in_progress' after consultation ends until payment is received.
   *
   * Uses transaction pattern to ensure invoice and visit are updated atomically.
   * Idempotent: if invoice is already paid, returns existing data without error.
   *
   * @param {string} invoiceId - The invoice ID
   * @param {string} completedBy - User ID who completed the invoice
   * @returns {Promise<Object>} Completed invoice data
   * @throws {ApplicationError} If invoice not found, has no visit_id, or visit completion fails
   */
  async completeInvoice(invoiceId, completedBy) {
    try {
      // 1. Get the invoice details including visit_id
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new ApplicationError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
      }

      // 2. Idempotency check: if invoice is already paid, return existing data
      if (invoice.status === 'paid') {
        return invoice;
      }

      // 3. Validate invoice has visit_id (required for visit completion)
      if (!invoice.visit_id) {
        throw new ApplicationError(
          'Cannot complete invoice: Invoice has no associated visit. This indicates a data integrity issue.',
          400,
          'INVOICE_MISSING_VISIT',
          { invoiceId, invoiceNumber: invoice.invoice_number }
        );
      }

      // 4. Get visit details before update for audit logging
      const oldVisit = await this.visitService.getVisitDetails(invoice.visit_id);
      const oldVisitStatus = oldVisit?.data?.status || 'in_progress';

      // 5. Use transaction pattern to ensure atomicity
      const transaction = new TransactionRunner();
      let completedInvoice = null;
      let completedVisit = null;

      try {
        // Step 1: Complete the invoice (with rollback compensation)
        completedInvoice = await transaction.add(
          async () => {
            return await InvoiceModel.completeInvoice(invoiceId, completedBy);
          },
          async () => {
            // Compensation: revert invoice status if visit completion fails
            await InvoiceModel.updateById(invoiceId, {
              status: invoice.status, // Revert to previous status
              completed_by: null,
              completed_at: null,
            });
          }
        );

        // Step 2: Complete the visit (this is the ONLY place visits should be completed)
        // Business rule: Visits are completed when invoice is paid, not when consultation ends
        completedVisit = await transaction.add(
          async () => {
            // Use completeVisit() to ensure costs are calculated correctly
            // This method calculates total_cost from consultation fee + services
            const visitResult = await this.visitService.completeVisit(invoice.visit_id, {
              payment_status: 'paid',
              // Status will be set to 'completed' by completeVisit()
            });
            return visitResult;
          },
          async () => {
            // Compensation: if visit completion fails, we need to rollback invoice
            // (This is handled by the transaction runner calling all compensations)
          }
        );


        // 6. Log visit status change for audit
        try {
          await logAuditEvent({
            userId: completedBy,
            role: 'cashier', // Typically completed by cashier
            action: 'UPDATE',
            entity: 'visits',
            recordId: invoice.visit_id,
            patientId: invoice.patient_id,
            old_values: {
              status: oldVisitStatus,
              payment_status: oldVisit?.data?.payment_status || 'pending',
            },
            new_values: { status: 'completed', payment_status: 'paid' },
            status: 'success',
            reason: 'Invoice paid - visit completed',
          });
        } catch (logError) {
          console.error('[AUDIT] Failed to log visit completion:', logError.message);
          // Don't fail the operation if audit logging fails
        }

        // 7. Notify receptionists about visit completion (non-critical)
        try {
          const visitDetails = await this.visitService.getVisitDetails(invoice.visit_id);
          const patient = visitDetails?.data?.patient;
          const patientName = patient
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : 'Patient';

          await NotificationService.notifyReceptionists({
            title: 'Visit Completed',
            message: `${patientName} has completed their visit. Invoice #${invoice.invoice_number} has been paid.`,
            type: 'success',
            relatedEntityType: 'visit',
            relatedEntityId: invoice.visit_id,
          });
        } catch (notifError) {
          // Log error but don't fail the invoice completion
          logger.error('[InvoiceService] Failed to send notification:', notifError);
        }

        return completedInvoice;
      } catch (error) {
        // Transaction runner will handle rollback automatically
        if (error instanceof ApplicationError) {
          throw error;
        }
        throw new ApplicationError(
          `Failed to complete invoice: ${error.message}`,
          500,
          'INVOICE_COMPLETION_FAILED',
          { invoiceId, visitId: invoice.visit_id }
        );
      }
    } catch (error) {
      logger.error('[InvoiceService] Error completing invoice:', error);
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(
        `Failed to complete invoice: ${error.message}`,
        500,
        'INVOICE_COMPLETION_FAILED'
      );
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId, cancelledBy, reason) {
    try {
      const invoice = await InvoiceModel.cancelInvoice(invoiceId, cancelledBy, reason);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to cancel invoice: ${error.message}`);
    }
  }

  /**
   * Get patient's outstanding invoices
   */
  async getPatientOutstandingInvoices(patientId) {
    try {
      const invoices = await InvoiceModel.getPatientOutstandingInvoices(patientId);
      return invoices;
    } catch (error) {
      throw new Error(`Failed to get outstanding invoices: ${error.message}`);
    }
  }

  /**
   * Check if patient can have more invoices (max 2 outstanding)
   */
  async canPatientCreateInvoice(patientId) {
    try {
      const count = await InvoiceModel.countPatientOutstandingInvoices(patientId);
      return {
        canCreate: count < 2,
        outstandingCount: count,
        message: count >= 2 ? 'Patient has reached maximum outstanding invoices (2)' : 'OK',
      };
    } catch (error) {
      throw new Error(`Failed to check invoice limit: ${error.message}`);
    }
  }

  /**
   * Record partial payment for invoice
   */
  async recordPartialPayment(invoiceId, paymentData) {
    try {
      // Validate payment amount
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const amountPaid = parseFloat(paymentData.amount);
      const currentBalance = parseFloat(invoice.balance_due || invoice.total_amount);

      if (amountPaid <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (amountPaid > currentBalance) {
        throw new Error(`Payment amount ($${amountPaid}) exceeds balance due ($${currentBalance})`);
      }

      // Record the payment
      const result = await InvoiceModel.recordPartialPayment(invoiceId, paymentData);

      // Send notification if invoice is fully paid
      if (result.invoice.status === 'paid') {
        try {
          await NotificationService.createNotification({
            userId: result.invoice.patient_id,
            type: 'payment_completed',
            title: 'Payment Completed',
            message: `Invoice #${invoice.invoice_number} has been fully paid.`,
            priority: 'normal',
            relatedEntity: 'invoice',
            relatedEntityId: invoiceId,
          });
        } catch (notifError) {
          logger.error('[InvoiceService] Failed to send notification:', notifError);
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  }

  /**
   * Get payment history for invoice
   */
  async getPaymentHistory(invoiceId) {
    try {
      const history = await InvoiceModel.getPaymentHistory(invoiceId);
      return history;
    } catch (error) {
      throw new Error(`Failed to get payment history: ${error.message}`);
    }
  }

  /**
   * Put invoice on hold
   */
  async putInvoiceOnHold(invoiceId, holdData) {
    try {
      const invoice = await InvoiceModel.putOnHold(invoiceId, holdData);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to put invoice on hold: ${error.message}`);
    }
  }

  /**
   * Resume invoice from hold
   */
  async resumeInvoiceFromHold(invoiceId) {
    try {
      const invoice = await InvoiceModel.resumeFromHold(invoiceId);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to resume invoice: ${error.message}`);
    }
  }

  /**
   * Get total outstanding balance for patient
   */
  async getPatientOutstandingBalance(patientId) {
    try {
      const invoices = await InvoiceModel.getPatientOutstandingInvoices(patientId);
      const totalBalance = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0);
      return {
        totalBalance,
        invoiceCount: invoices.length,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: inv.total_amount,
          amount_paid: inv.amount_paid,
          balance_due: inv.balance_due,
          on_hold: inv.on_hold,
          created_at: inv.created_at,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get outstanding balance: ${error.message}`);
    }
  }
}

export default new InvoiceService();
