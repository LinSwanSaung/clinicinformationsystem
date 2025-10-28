import InvoiceModel from '../models/Invoice.model.js';
import InvoiceItemModel from '../models/InvoiceItem.model.js';
import PaymentTransactionModel from '../models/PaymentTransaction.model.js';
import VisitService from './Visit.service.js';
import PrescriptionService from './Prescription.service.js';
import NotificationService from './Notification.service.js';

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
      console.log('[InvoiceService] Attempting to create invoice for visit:', visitId);
      
      // Get visit details
      const visitResponse = await this.visitService.getVisitDetails(visitId);
      if (!visitResponse || !visitResponse.data) {
        throw new Error('Visit not found');
      }

      const visit = visitResponse.data;
      console.log('[InvoiceService] Visit found:', visit.id, 'Patient:', visit.patient_id);

      // Check if invoice already exists for this visit
      const existingInvoice = await InvoiceModel.getInvoiceByVisit(visitId);
      if (existingInvoice) {
        console.log('[InvoiceService] Invoice already exists:', existingInvoice.id);
        return existingInvoice;
      }

      console.log('[InvoiceService] No existing invoice found, creating new one');

      // Create invoice
      const invoiceData = {
        visit_id: visitId,
        patient_id: visit.patient_id,
        status: 'pending',
        created_by: createdBy,
        subtotal: 0.00,
        total_amount: 0.00,
        balance: 0.00
      };

      console.log('[InvoiceService] Creating invoice with data:', invoiceData);
      const invoice = await InvoiceModel.createInvoice(invoiceData);
      console.log('[InvoiceService] Invoice created successfully:', invoice.id);
      
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Error in createInvoice:', error);
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
      console.log('[InvoiceService] Getting invoice for visit:', visitId);
      const invoice = await InvoiceModel.getInvoiceByVisit(visitId);
      console.log('[InvoiceService] Invoice found:', invoice ? `Yes (${invoice.id})` : 'No');
      if (invoice) {
        console.log('[InvoiceService] Invoice items count:', invoice.invoice_items?.length || 0);
      }
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice:', error.message);
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
        notes
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
        notes
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
          unit_price: 0.00, // Cashier will set price
          total_price: 0.00,
          added_by: addedBy,
          notes: `Prescribed: ${rx.frequency || ''} for ${rx.duration || ''}`
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
        const quantity = updates.quantity !== undefined ? parseFloat(updates.quantity) : parseFloat(item.quantity);
        const unitPrice = updates.unit_price !== undefined ? parseFloat(updates.unit_price) : parseFloat(item.unit_price);
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
        balance
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
        discount_percentage: parseFloat(discountPercentage || 0)
      });

      await this.recalculateInvoiceTotal(invoiceId);
      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      throw new Error(`Failed to update discount: ${error.message}`);
    }
  }

  /**
   * Complete invoice (mark as paid)
   */
  async completeInvoice(invoiceId, completedBy) {
    try {
      // 1. Get the invoice details including visit_id
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // 2. Complete the invoice
      const completedInvoice = await InvoiceModel.completeInvoice(invoiceId, completedBy);
      
      // 3. Mark the visit as completed
      if (invoice.visit_id) {
        await this.visitService.updateVisitStatus(invoice.visit_id, 'completed');
        
        // 4. Notify receptionists about visit completion
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
            relatedEntityId: invoice.visit_id
          });
        } catch (notifError) {
          // Log error but don't fail the invoice completion
          console.error('[InvoiceService] Failed to send notification:', notifError);
        }
      }

      return completedInvoice;
    } catch (error) {
      console.error('[InvoiceService] Error completing invoice:', error);
      throw new Error(`Failed to complete invoice: ${error.message}`);
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
        message: count >= 2 ? 'Patient has reached maximum outstanding invoices (2)' : 'OK'
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

      console.log(`[InvoiceService] Partial payment recorded: $${amountPaid} for invoice ${invoiceId}, new balance: $${result.invoice.balance_due}`);

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
            relatedEntityId: invoiceId
          });
        } catch (notifError) {
          console.error('[InvoiceService] Failed to send notification:', notifError);
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
      console.log(`[InvoiceService] Invoice ${invoiceId} put on hold: ${holdData.reason}`);
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
      console.log(`[InvoiceService] Invoice ${invoiceId} resumed from hold`);
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
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: inv.total_amount,
          amount_paid: inv.amount_paid,
          balance_due: inv.balance_due,
          on_hold: inv.on_hold,
          created_at: inv.created_at
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get outstanding balance: ${error.message}`);
    }
  }
}

export default new InvoiceService();
