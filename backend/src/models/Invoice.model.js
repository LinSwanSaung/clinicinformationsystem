import { BaseModel } from './BaseModel.js';

/**
 * Invoice Model - Main billing records
 */
class InvoiceModel extends BaseModel {
  constructor() {
    super('invoices');
  }

  /**
   * Get invoice by ID with all related data
   */
  async getInvoiceById(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        patient:patients(
          id, 
          first_name, 
          last_name, 
          patient_number,
          date_of_birth, 
          phone,
          email
        ),
        visit:visits(
          id, 
          visit_type, 
          visit_date,
          chief_complaint, 
          status,
          doctor:users!visits_doctor_id_fkey(
            id,
            first_name,
            last_name
          )
        ),
        invoice_items(*),
        payment_transactions(*),
        created_by_user:users!invoices_created_by_fkey(id, first_name, last_name, role),
        completed_by_user:users!invoices_completed_by_fkey(id, first_name, last_name, role)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get invoice by visit ID
   */
  async getInvoiceByVisit(visitId) {
    console.log('[InvoiceModel] Querying invoice for visit_id:', visitId);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        patient:patients(id, first_name, last_name, date_of_birth, phone),
        visit:visits(id, visit_type, chief_complaint, status),
        invoice_items(*),
        payment_transactions(*)
      `
      )
      .eq('visit_id', visitId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle instead of single

    console.log('[InvoiceModel] Query result - Error:', error?.message || 'none');
    console.log('[InvoiceModel] Query result - Data:', data ? `Found invoice ${data.id}` : 'null');

    if (error) {
      console.error('[InvoiceModel] Database error:', error);
      throw error;
    }

    return data; // Will be null if not found, which is fine
  }

  /**
   * Get all pending invoices (for cashier dashboard)
   */
  async getPendingInvoices() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        patient:patients(id, first_name, last_name, phone, email),
        visit:visits(id, visit_type, chief_complaint),
        invoice_items(*)
      `
      )
      .in('status', ['pending', 'partial'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get completed invoices (for invoice history)
   */
  async getCompletedInvoices(options = {}) {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        patients!invoices_patient_id_fkey(id, first_name, last_name, phone, email, patient_number),
        visits!invoices_visit_id_fkey(id, visit_type, visit_date, doctor_id),
        invoice_items(*),
        payment_transactions(*)
      `
      )
      .eq('status', 'paid')
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Manually fetch doctor and completed_by user info for each invoice
    if (data && data.length > 0) {
      const doctorIds = [...new Set(data.map((inv) => inv.visits?.doctor_id).filter(Boolean))];
      const completedByIds = [...new Set(data.map((inv) => inv.completed_by).filter(Boolean))];
      const allUserIds = [...new Set([...doctorIds, ...completedByIds])];

      const { data: users } = await this.supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('id', allUserIds);

      const userMap = {};
      users?.forEach((user) => {
        userMap[user.id] = user;
      });

      // Attach doctor and completed_by user info
      data.forEach((invoice) => {
        if (invoice.visits?.doctor_id) {
          invoice.visits.doctor = userMap[invoice.visits.doctor_id];
        }
        if (invoice.completed_by) {
          invoice.completed_by_user = userMap[invoice.completed_by];
        }
      });
    }

    return data || [];
  }

  /**
   * Get invoices by patient
   */
  async getInvoicesByPatient(patientId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        visit:visits(id, visit_type, visit_date),
        invoice_items(*),
        payment_transactions(*)
      `
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create invoice
   */
  async createInvoice(invoiceData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete invoice (mark as paid)
   */
  async completeInvoice(id, completedBy) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'paid',
        completed_by: completedBy,
        completed_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id, cancelledBy, reason) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancelled_at: new Date(),
        cancelled_reason: reason,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get patient's outstanding invoices
   */
  async getPatientOutstandingInvoices(patientId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        visit:visits(id, visit_type, visit_date),
        patient:patients(id, first_name, last_name, patient_number)
      `
      )
      .eq('patient_id', patientId)
      .gt('balance_due', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Count patient's outstanding invoices
   */
  async countPatientOutstandingInvoices(patientId) {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .gt('balance_due', 0);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Record partial payment
   */
  async recordPartialPayment(invoiceId, paymentData) {
    // 1. Get current invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const amountPaid = parseFloat(paymentData.amount);
    const newTotalPaid = parseFloat(invoice.amount_paid || 0) + amountPaid;
    const newBalance = parseFloat(invoice.total_amount) - newTotalPaid;

    // 2. Create payment transaction
    const { data: transaction, error: transactionError } = await this.supabase
      .from('payment_transactions')
      .insert({
        invoice_id: invoiceId,
        amount: amountPaid,
        payment_method: paymentData.payment_method,
        payment_notes: paymentData.notes,
        received_by: paymentData.processed_by, // Use 'received_by' to match schema column name
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // 3. Update invoice
    const updateData = {
      amount_paid: newTotalPaid,
      balance_due: newBalance,
      status: newBalance <= 0 ? 'paid' : 'partial_paid',
      on_hold: newBalance > 0,
      hold_reason: paymentData.hold_reason || 'Partial payment - balance due',
      hold_date: new Date().toISOString(),
      payment_due_date: paymentData.payment_due_date,
      updated_at: new Date().toISOString(),
    };

    // If fully paid, mark as completed
    if (newBalance <= 0) {
      updateData.on_hold = false;
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = paymentData.processed_by;
    }

    const { data: updatedInvoice, error: updateError } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      invoice: updatedInvoice,
      transaction,
    };
  }

  /**
   * Get payment history for an invoice
   */
  async getPaymentHistory(invoiceId) {
    const { data, error } = await this.supabase
      .from('payment_transactions')
      .select(
        `
        *,
        processed_by_user:users!processed_by(first_name, last_name, role)
      `
      )
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Put invoice on hold
   */
  async putOnHold(invoiceId, holdData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        on_hold: true,
        hold_reason: holdData.reason,
        hold_date: new Date().toISOString(),
        payment_due_date: holdData.payment_due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Resume invoice from hold
   */
  async resumeFromHold(invoiceId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        on_hold: false,
        hold_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new InvoiceModel();
