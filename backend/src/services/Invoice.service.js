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

      // Check if invoice already exists for this visit (with retry for race conditions)
      const existingInvoice = await InvoiceModel.getInvoiceByVisit(visitId);
      if (existingInvoice) {
        logger.debug('[InvoiceService] Invoice already exists for visit:', visitId);
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

      try {
        const invoice = await InvoiceModel.createInvoice(invoiceData);
        return invoice;
      } catch (createError) {
        // Handle race condition: if another request created invoice between check and create
        // Check for unique constraint violation or duplicate key error
        const errorMsg = createError?.message?.toLowerCase() || '';
        const _errorCode = createError?.code?.toLowerCase() || '';

        // Check for visit_id duplicate (another invoice for same visit)
        if (
          errorMsg.includes('uq_invoices_one_per_visit') ||
          (errorMsg.includes('visit_id') &&
            (errorMsg.includes('duplicate') || errorMsg.includes('unique')))
        ) {
          // Invoice was created by another request for same visit, fetch and return it
          logger.warn(
            '[InvoiceService] Race condition detected - invoice created by another request for same visit, fetching existing invoice'
          );
          const existingInvoice = await InvoiceModel.getInvoiceByVisit(visitId);
          if (existingInvoice) {
            return existingInvoice;
          }
        }

        // Check for invoice_number duplicate (shouldn't happen with atomic function, but handle it)
        if (
          (errorMsg.includes('invoice_number') &&
            (errorMsg.includes('duplicate') || errorMsg.includes('unique'))) ||
          errorMsg.includes('invoices_invoice_number_key')
        ) {
          // Invoice number collision - retry once (trigger will generate new number)
          logger.warn('[InvoiceService] Invoice number collision detected, retrying...');
          try {
            // Small delay to let other transaction complete
            await new Promise((resolve) => setTimeout(resolve, 100));
            const invoice = await InvoiceModel.createInvoice(invoiceData);
            return invoice;
          } catch (retryError) {
            // If retry also fails, check if invoice exists by visit_id
            const existingInvoice = await InvoiceModel.getInvoiceByVisit(visitId);
            if (existingInvoice) {
              return existingInvoice;
            }
            throw retryError;
          }
        }

        // Re-throw if it's not a duplicate error
        throw createError;
      }
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
   * Add service item to invoice with version checking (optimistic locking)
   * @param {string} invoiceId - Invoice ID
   * @param {Object} serviceData - Service data
   * @param {string} addedBy - User ID who added the item
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Created item
   */
  async addServiceItem(invoiceId, serviceData, addedBy, expectedVersion = null) {
    try {
      // Validate invoice exists and is editable
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // If version is provided, check it matches
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }
      }

      // Allow adding services to pending, draft, or partial_paid invoices
      // Cashiers can add services even if doctor forgot to add them
      const editableStatuses = ['pending', 'draft', 'partial_paid'];
      if (!editableStatuses.includes(invoice.status)) {
        throw new Error(
          `Cannot add services to invoice with status '${invoice.status}'. Only allowed for pending, draft, or partial_paid invoices.`
        );
      }

      const { service_id, service_name, quantity = 1, unit_price, notes } = serviceData;

      if (!service_name || unit_price === undefined) {
        throw new Error('Missing required fields: service_name, unit_price');
      }

      // Version checking is done above, now just add the item normally
      // (Application-level version checking is sufficient - no need for atomic RPC functions)
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

      // Recalculate invoice totals (this will increment version via trigger)
      await this.recalculateInvoiceTotal(invoiceId);

      return item;
    } catch (error) {
      // Re-throw version mismatch errors as-is
      if (error.code === 'VERSION_MISMATCH') {
        throw error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to add service. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

      throw new Error(`Failed to add service item: ${error.message}`);
    }
  }

  /**
   * Add medicine item to invoice with version checking (optimistic locking)
   * @param {string} invoiceId - Invoice ID
   * @param {Object} medicineData - Medicine data
   * @param {string} addedBy - User ID who added the item
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Created item
   */
  async addMedicineItem(invoiceId, medicineData, addedBy, expectedVersion = null) {
    try {
      // Get invoice to check version if provided
      if (expectedVersion !== null && expectedVersion !== undefined) {
        const invoice = await InvoiceModel.getInvoiceById(invoiceId);
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        if (invoice.version !== expectedVersion) {
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }
      }

      const { prescription_id, medicine_name, quantity = 1, unit_price, notes } = medicineData;

      if (!medicine_name || unit_price === undefined) {
        throw new Error('Missing required fields: medicine_name, unit_price');
      }

      // Version checking is done above, now just add the item normally
      // (Application-level version checking is sufficient - no need for atomic RPC functions)
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

      // Recalculate invoice totals (this will increment version via trigger)
      await this.recalculateInvoiceTotal(invoiceId);

      return item;
    } catch (error) {
      // Re-throw version mismatch errors as-is
      if (error.code === 'VERSION_MISMATCH') {
        throw error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to add medicine. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

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
   * Update invoice item with version checking (optimistic locking)
   * @param {string} itemId - Invoice item ID
   * @param {Object} updates - Fields to update
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Updated item
   */
  async updateInvoiceItem(itemId, updates, expectedVersion = null) {
    try {
      // Get item to find invoice
      const item = await InvoiceItemModel.getItemById(itemId);
      if (!item) {
        throw new Error('Invoice item not found');
      }

      // If version is provided, check it matches
      if (expectedVersion !== null && expectedVersion !== undefined) {
        const invoice = await InvoiceModel.getInvoiceById(item.invoice_id);
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        if (invoice.version !== expectedVersion) {
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }
      }

      // Recalculate total_price if quantity or unit_price changed
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
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
      // Re-throw version mismatch errors as-is
      if (error.code === 'VERSION_MISMATCH') {
        throw error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes('not found') || error.message?.includes('deleted')) {
        throw new Error(
          'This item was deleted by another user. Please refresh the page to see the latest changes.'
        );
      }

      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'This item may have been deleted or modified. Please refresh the page and try again.'
        );
      }

      throw new Error(`Failed to update invoice item: ${error.message}`);
    }
  }

  /**
   * Remove invoice item with version checking (optimistic locking)
   * @param {string} itemId - Invoice item ID
   * @param {Object} currentUser - Current user making the request (for role validation)
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Deleted item
   */
  async removeInvoiceItem(itemId, currentUser = null, expectedVersion = null) {
    try {
      // First, get the item to check invoice and visit status
      const item = await InvoiceItemModel.getItemById(itemId);
      if (!item) {
        throw new Error('Invoice item not found');
      }

      // Get the invoice to check status and visit
      const invoice = await InvoiceModel.getInvoiceById(item.invoice_id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // If version is provided, check it matches
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }
      }

      // If user is a doctor, validate that consultation is still active
      if (currentUser && currentUser.role === 'doctor') {
        // Get the visit to check if it's still in progress
        const visit = await this.visitService.getVisitDetails(invoice.visit_id);
        if (!visit || !visit.data) {
          throw new Error('Visit not found');
        }

        // Check if visit is still in progress
        if (visit.data.status !== 'in_progress') {
          throw new Error(
            'Cannot remove services after consultation is completed. Only allowed during active consultation.'
          );
        }

        // Check if invoice is still editable (pending or draft status)
        if (!['pending', 'draft'].includes(invoice.status)) {
          throw new Error(
            'Cannot remove services from a paid or completed invoice. Only allowed during active consultation.'
          );
        }
      }

      // Delete the item
      const deletedItem = await InvoiceItemModel.deleteItem(itemId);

      // Recalculate invoice totals
      await this.recalculateInvoiceTotal(item.invoice_id);

      return deletedItem;
    } catch (error) {
      // Re-throw version mismatch errors as-is
      if (error.code === 'VERSION_MISMATCH') {
        throw error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes('not found') || error.message?.includes('deleted')) {
        throw new Error(
          'This item was deleted by another user. Please refresh the page to see the latest changes.'
        );
      }

      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'This item may have been deleted or modified. Please refresh the page and try again.'
        );
      }

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
   * Update invoice outstanding balance inclusion flag with version checking (optimistic locking)
   * @param {string} invoiceId - Invoice ID
   * @param {boolean} includeOutstandingBalance - Whether to include outstanding balance
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Updated invoice
   */
  async updateOutstandingBalanceFlag(invoiceId, includeOutstandingBalance, expectedVersion = null) {
    try {
      // Get current invoice to check version
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // If version is provided, check it matches
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          throw new ApplicationError(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`,
            409,
            'VERSION_MISMATCH',
            {
              invoiceId,
              currentVersion: invoice.version,
              expectedVersion,
            }
          );
        }
      }

      // Update outstanding balance flag (version already checked if provided)
      await InvoiceModel.updateInvoice(invoiceId, {
        include_outstanding_balance: Boolean(includeOutstandingBalance),
      });

      // Return updated invoice
      const updatedInvoice = await InvoiceModel.getInvoiceById(invoiceId);
      return updatedInvoice;
    } catch (error) {
      // Re-throw ApplicationError as-is
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new Error(`Failed to update outstanding balance flag: ${error.message}`);
    }
  }

  /**
   * Update invoice discount with version checking (optimistic locking)
   * @param {string} invoiceId - Invoice ID
   * @param {number} discountAmount - Discount amount
   * @param {number} discountPercentage - Discount percentage
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Updated invoice
   */
  async updateDiscount(invoiceId, discountAmount, discountPercentage = 0, expectedVersion = null) {
    try {
      // Get current invoice to check version
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // If version is provided, check it matches
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }

        // Version already checked above, use regular update
        // (We don't use atomic RPC function due to Supabase JSONB parsing issues)
      }

      // Update discount (version already checked if provided)
      await InvoiceModel.updateInvoice(invoiceId, {
        discount_amount: parseFloat(discountAmount || 0),
        discount_percentage: parseFloat(discountPercentage || 0),
      });

      await this.recalculateInvoiceTotal(invoiceId);
      return this.getInvoiceById(invoiceId);
    } catch (error) {
      // Re-throw version mismatch errors as ApplicationError
      if (error.code === 'VERSION_MISMATCH') {
        throw new ApplicationError(
          error.message || 'Invoice was modified by another user. Please refresh and try again.',
          409,
          'VERSION_MISMATCH',
          {
            invoiceId,
            currentVersion: error.currentVersion,
            expectedVersion: error.expectedVersion,
          }
        );
      }

      // Re-throw ApplicationError as-is
      if (error instanceof ApplicationError) {
        throw error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to update discount. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

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
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Completed invoice data
   * @throws {ApplicationError} If invoice not found, has no visit_id, or visit completion fails
   */
  async completeInvoice(invoiceId, completedBy, expectedVersion = null) {
    try {
      // 1. Get the invoice details including visit_id
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new ApplicationError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
      }

      // 1.5. Version check (if provided) - but allow if invoice is already paid (idempotent)
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          // If invoice is already paid, this is idempotent - complete visit and return
          if (invoice.status === 'paid') {
            // Version mismatch but invoice is paid - complete visit if needed and return (idempotent)
            if (invoice.visit_id) {
              try {
                const visitDetails = await this.visitService.getVisitDetails(invoice.visit_id);
                if (visitDetails?.data?.status !== 'completed') {
                  await this.visitService.completeVisit(invoice.visit_id, {
                    payment_status: 'paid',
                    completed_by: completedBy,
                  });
                  logger.info(
                    `[InvoiceService] Auto-completed visit ${invoice.visit_id} for already-paid invoice ${invoiceId} (version mismatch handled)`
                  );
                }
              } catch (visitError) {
                logger.error(
                  `[InvoiceService] Failed to complete visit ${invoice.visit_id} for already-paid invoice:`,
                  visitError
                );
                // Don't throw - invoice is already paid, just log the error
              }
            }
            return invoice; // Return already-paid invoice (idempotent)
          }

          // Invoice is not paid and version mismatch - throw error
          const error = new ApplicationError(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`,
            409,
            'VERSION_MISMATCH',
            {
              invoiceId,
              currentVersion: invoice.version,
              expectedVersion,
              message: 'Invoice version mismatch - concurrent payment detected',
            }
          );
          error.code = 'VERSION_MISMATCH';
          throw error;
        }
      }

      // 2. Idempotency check: if invoice is already paid, ensure visit is also completed
      if (invoice.status === 'paid') {
        // Check if visit is completed - if not, complete it now (data integrity fix)
        if (invoice.visit_id) {
          try {
            const visitDetails = await this.visitService.getVisitDetails(invoice.visit_id);
            if (visitDetails?.data?.status !== 'completed') {
              // Visit should be completed but isn't - complete it now
              await this.visitService.completeVisit(invoice.visit_id, {
                payment_status: 'paid',
                completed_by: completedBy,
              });
              logger.info(
                `[InvoiceService] Auto-completed visit ${invoice.visit_id} for already-paid invoice ${invoiceId}`
              );
            }
          } catch (visitError) {
            logger.error(
              `[InvoiceService] Failed to complete visit ${invoice.visit_id} for already-paid invoice:`,
              visitError
            );
            // Don't throw - invoice is already paid, just log the error
          }
        }
        return invoice;
      }

      // 3. Validate invoice has visit_id (required for visit completion)
      if (!invoice.visit_id) {
        throw new ApplicationError(
          `Cannot complete invoice ${invoice.invoice_number || invoiceId}: Invoice is missing visit information. ` +
            `Please contact support to resolve this data integrity issue. The invoice cannot be completed until this is fixed.`,
          400,
          'INVOICE_MISSING_VISIT',
          {
            invoiceId,
            invoiceNumber: invoice.invoice_number,
            message: 'Invoice missing visit association - data integrity issue',
          }
        );
      }

      // 4. Get visit details before update for audit logging
      const oldVisit = await this.visitService.getVisitDetails(invoice.visit_id);
      const oldVisitStatus = oldVisit?.data?.status || 'in_progress';

      // 5. Use transaction pattern to ensure atomicity
      const transaction = new TransactionRunner();
      let completedInvoice = null;
      const _completedVisit = null;

      try {
        // Step 1: Complete the invoice (with rollback compensation)
        completedInvoice = await transaction.add(
          async () => {
            return InvoiceModel.completeInvoice(invoiceId, completedBy);
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
        const _completedVisit = await transaction.add(
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
          logger.error('[AUDIT] Failed to log visit completion:', logError.message);
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

      // Re-throw version mismatch errors as ApplicationError
      if (error.code === 'VERSION_MISMATCH') {
        throw new ApplicationError(
          error.message || 'Invoice was modified by another user. Please refresh and try again.',
          409,
          'VERSION_MISMATCH',
          {
            invoiceId,
            currentVersion: error.currentVersion,
            expectedVersion: error.expectedVersion,
          }
        );
      }

      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new ApplicationError(
          'Unable to complete invoice. The invoice may have been modified. Please refresh the page and try again.',
          500,
          'INVOICE_COMPLETION_FAILED'
        );
      }

      if (error.message?.includes('not found')) {
        throw new ApplicationError(
          'Invoice or visit not found. They may have been deleted.',
          404,
          'INVOICE_NOT_FOUND'
        );
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
      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to cancel invoice. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

      if (error.message?.includes('not found')) {
        throw new Error('Invoice not found. It may have been deleted.');
      }

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
   * Record partial payment for invoice with version checking (optimistic locking)
   * @param {string} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment data
   * @param {number} [expectedVersion] - Expected invoice version (for optimistic locking)
   * @returns {Promise<Object>} Updated invoice and payment transaction
   */
  async recordPartialPayment(invoiceId, paymentData, expectedVersion = null) {
    try {
      // Validate payment amount
      const invoice = await InvoiceModel.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Version check (if provided) - but allow if invoice is already paid (idempotent)
      if (expectedVersion !== null && expectedVersion !== undefined) {
        if (invoice.version !== expectedVersion) {
          // If invoice is already paid, this is idempotent - ensure visit is completed and return
          if (invoice.status === 'paid') {
            // Version mismatch but invoice is paid - ensure visit is completed and return
            if (invoice.visit_id) {
              try {
                const visitDetails = await this.visitService.getVisitDetails(invoice.visit_id);
                if (visitDetails?.data?.status !== 'completed') {
                  await this.visitService.completeVisit(invoice.visit_id, {
                    payment_status: 'paid',
                    completed_by: paymentData.processed_by,
                  });
                  logger.info(
                    `[InvoiceService] Auto-completed visit ${invoice.visit_id} for already-paid invoice ${invoiceId} (version mismatch in partial payment)`
                  );
                }
              } catch (visitError) {
                logger.error(
                  `[InvoiceService] Failed to complete visit ${invoice.visit_id} for already-paid invoice:`,
                  visitError
                );
              }
            }
            // Return the already-paid invoice (idempotent)
            return {
              invoice,
              transaction: null, // No new transaction since invoice is already paid
            };
          }

          // Invoice is not paid and version mismatch - throw error
          const error = new Error(
            `Invoice was modified by another user. Current version: ${invoice.version}, Expected: ${expectedVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = invoice.version;
          error.expectedVersion = expectedVersion;
          error.currentInvoice = invoice;
          throw error;
        }
      }

      // Check if invoice is already fully paid (idempotent - return invoice if already paid)
      // Only check for 'paid' status, not 'partial_paid' (partial_paid invoices can still accept more payments)
      if (invoice.status === 'paid') {
        // Check if there's actually a balance due (double-check to avoid false positives)
        const currentBalance = parseFloat(invoice.balance_due || 0);
        if (currentBalance <= 0) {
          // Invoice is already fully paid - ensure visit is completed and return idempotently
          if (invoice.visit_id) {
            try {
              const visitDetails = await this.visitService.getVisitDetails(invoice.visit_id);
              if (visitDetails?.data?.status !== 'completed') {
                await this.visitService.completeVisit(invoice.visit_id, {
                  payment_status: 'paid',
                  completed_by: paymentData.processed_by,
                });
                logger.info(
                  `[InvoiceService] Auto-completed visit ${invoice.visit_id} for already-paid invoice ${invoiceId} (partial payment attempt)`
                );
              }
            } catch (visitError) {
              logger.error(
                `[InvoiceService] Failed to complete visit ${invoice.visit_id} for already-paid invoice:`,
                visitError
              );
            }
          }
          // Return the already-paid invoice (idempotent) - no error, just return existing state
          return {
            invoice,
            transaction: null, // No new transaction since invoice is already paid
          };
        }
        // Invoice status is 'paid' but balance_due > 0 - this is a data integrity issue
        // Allow the payment to proceed (it will update the invoice status correctly)
      }

      // Policy: Maximum 2 partial payments per invoice
      const existingPayments = await PaymentTransactionModel.getPaymentsByInvoice(invoiceId);
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const partialPaymentCount = existingPayments.filter((p) => {
        const paymentAmount = parseFloat(p.amount || 0);
        // Count as partial if payment is less than total amount
        return paymentAmount < totalAmount;
      }).length;

      if (partialPaymentCount >= 2) {
        throw new Error(
          'Maximum 2 partial payments allowed per invoice. Please pay the remaining balance in full.'
        );
      }

      const amountPaid = parseFloat(paymentData.amount);
      const currentBalance = parseFloat(invoice.balance_due || invoice.total_amount);

      if (amountPaid <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Policy: Payment cannot exceed balance due (no overpayment allowed)
      if (amountPaid > currentBalance) {
        throw new Error(`Payment amount ($${amountPaid}) exceeds balance due ($${currentBalance})`);
      }

      // Use atomic payment function directly (replaces deprecated InvoiceModel.recordPartialPayment)
      // PaymentTransactionModel is exported as a singleton instance, so use it directly
      const atomicResult = await PaymentTransactionModel.recordPaymentAtomic(
        invoiceId,
        amountPaid,
        paymentData.payment_method || 'cash',
        paymentData.payment_reference || null,
        paymentData.notes || paymentData.hold_reason || null,
        paymentData.processed_by
      );

      if (!atomicResult.success) {
        throw new Error(atomicResult.message || 'Failed to record payment');
      }

      const updatedInvoice = atomicResult.invoice;

      // CRITICAL: Complete the visit when any payment is made (partial or full)
      // This allows patients to have new visits even if invoice is not fully paid
      // Business rule: Visit completion is separate from invoice payment status
      let visitCompleted = false;
      if (updatedInvoice.visit_id) {
        try {
          // Check if visit is already completed to avoid unnecessary updates
          const visitDetails = await this.visitService.getVisitDetails(updatedInvoice.visit_id);
          const visitStatus = visitDetails?.data?.status || visitDetails?.status;

          if (visitStatus !== 'completed') {
            // Determine payment status based on invoice status
            const paymentStatus = updatedInvoice.status === 'paid' ? 'paid' : 'partial';

            // Complete the visit automatically when payment is made (allows new visits)
            const completionResult = await this.visitService.completeVisit(
              updatedInvoice.visit_id,
              {
                payment_status: paymentStatus,
                completed_by: paymentData.processed_by,
              }
            );

            // Verify visit was actually completed
            if (completionResult?.success && completionResult?.data) {
              visitCompleted = true;
              logger.info(
                `[InvoiceService] Auto-completed visit ${updatedInvoice.visit_id} after payment (status: ${updatedInvoice.status})`
              );
            } else {
              throw new Error('Visit completion returned unsuccessful result');
            }
          } else {
            visitCompleted = true; // Visit was already completed
          }
        } catch (visitError) {
          // Log error but don't fail payment - visit can be completed manually later
          // However, this is a critical error - visit should be completed when payment is made
          logger.error(
            `[InvoiceService] CRITICAL: Failed to auto-complete visit ${updatedInvoice.visit_id} after payment:`,
            visitError
          );
          logger.error(
            `[InvoiceService] Visit ${updatedInvoice.visit_id} will remain in_progress even though invoice ${updatedInvoice.id} is ${updatedInvoice.status}. This may prevent patient from starting new visits.`
          );
          // Don't throw - payment was successful, but visit completion failed
          // NOTE: Visit completion must be done manually by admin via Pending Items page
          // Business rule: Active visits block new visits regardless of invoice status
        }
      }

      // Notify receptionists when payment is made (partial or full) - treat as completed invoice since visit is complete
      if (visitCompleted) {
        try {
          const visitDetails = await this.visitService.getVisitDetails(updatedInvoice.visit_id);
          const patient = visitDetails?.data?.patient;
          const patientName = patient
            ? `${patient.first_name} ${patient.last_name}`.trim()
            : 'Patient';

          const paymentStatusText =
            updatedInvoice.status === 'paid' ? 'fully paid' : 'partially paid';

          await NotificationService.notifyReceptionists({
            title: 'Visit Completed',
            message: `${patientName} has completed their visit. Invoice #${updatedInvoice.invoice_number || updatedInvoice.id} has been ${paymentStatusText}.`,
            type: 'success',
            relatedEntityType: 'visit',
            relatedEntityId: updatedInvoice.visit_id,
          });
        } catch (notifError) {
          // Log error but don't fail payment
          logger.error(
            '[InvoiceService] Failed to send reception notification after payment:',
            notifError
          );
        }
      }

      // If this is a partial payment, update hold fields
      if (parseFloat(updatedInvoice.balance_due || 0) > 0) {
        // Use InvoiceModel method instead of direct database access
        try {
          const invoiceWithHold = await InvoiceModel.updateInvoice(invoiceId, {
            on_hold: true,
            hold_reason: paymentData.hold_reason || 'Partial payment - balance due',
            hold_date: new Date().toISOString(),
            payment_due_date: paymentData.payment_due_date || null,
          });

          // Send notification if invoice is fully paid
          if (invoiceWithHold.status === 'paid') {
            try {
              await NotificationService.createNotification({
                userId: invoiceWithHold.patient_id,
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

          return {
            invoice: invoiceWithHold,
            transaction: atomicResult.payment,
          };
        } catch (holdError) {
          logger.warn(
            '[InvoiceService] Failed to update hold fields for partial payment:',
            holdError
          );
          // Don't throw - payment was successful, just hold fields failed
          // Return the updated invoice without hold fields
        }
      }

      // Send notification if invoice is fully paid
      if (updatedInvoice.status === 'paid') {
        try {
          await NotificationService.createNotification({
            userId: updatedInvoice.patient_id,
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

      return {
        invoice: updatedInvoice,
        transaction: atomicResult.payment,
      };
    } catch (error) {
      // Re-throw version mismatch errors as ApplicationError
      if (error.code === 'VERSION_MISMATCH') {
        throw new ApplicationError(
          error.message || 'Invoice was modified by another user. Please refresh and try again.',
          409,
          'VERSION_MISMATCH',
          {
            invoiceId,
            currentVersion: error.currentVersion,
            expectedVersion: error.expectedVersion,
          }
        );
      }

      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to process payment. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

      if (error.message?.includes('not found')) {
        throw new Error('Invoice not found. It may have been deleted.');
      }

      // Re-throw ApplicationError as-is (already user-friendly)
      if (error instanceof ApplicationError) {
        throw error;
      }

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
      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to put invoice on hold. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

      if (error.message?.includes('not found')) {
        throw new Error('Invoice not found. It may have been deleted.');
      }

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
      // Provide user-friendly error messages
      if (error.message?.includes('coerce') || error.message?.includes('JSON')) {
        throw new Error(
          'Unable to resume invoice. The invoice may have been modified. Please refresh the page and try again.'
        );
      }

      if (error.message?.includes('not found')) {
        throw new Error('Invoice not found. It may have been deleted.');
      }

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

  /**
   * Get patient's total remaining credit (sum of negative balance_due from all invoices)
   */
  async getPatientRemainingCredit(patientId) {
    try {
      const { getPatientRemainingCredit: getCredit } = await import(
        './repositories/BillingRepo.js'
      );
      const totalCredit = await getCredit(patientId);
      return {
        totalCredit,
        patientId,
      };
    } catch (error) {
      throw new Error(`Failed to get patient remaining credit: ${error.message}`);
    }
  }
}

export default new InvoiceService();
