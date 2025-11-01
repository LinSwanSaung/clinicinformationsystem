import { BaseModel } from './BaseModel.js';

/**
 * PaymentTransaction Model - Payment records
 */
class PaymentTransactionModel extends BaseModel {
  constructor() {
    super('payment_transactions');
  }

  /**
   * Get payments by invoice ID
   */
  async getPaymentsByInvoice(invoiceId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        received_by_user:users(id, full_name, role)
      `)
      .eq('invoice_id', invoiceId)
      .order('received_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create payment transaction
   */
  async createPayment(paymentData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        invoice:invoices(id, invoice_number, patient_id),
        received_by_user:users(id, full_name, role)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get payment reports by date range
   */
  async getPaymentReport(startDate, endDate) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        invoice:invoices(id, invoice_number, patient_id),
        received_by_user:users(id, full_name, role)
      `)
      .gte('received_at', startDate)
      .lte('received_at', endDate)
      .order('received_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get total payments for an invoice
   */
  async getTotalPaymentsByInvoice(invoiceId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('amount')
      .eq('invoice_id', invoiceId);

    if (error) throw error;
    
    const total = data.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return total;
  }

  /**
   * Get all payment transactions for admin with filters and pagination
   */
  async getAllTransactionsAdmin(filters) {
    const { start_date, end_date, payment_method, received_by, limit, offset } = filters;
    
    let query = this.supabase
      .from(this.tableName)
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
      `, { count: 'exact' });

    // Apply filters
    if (start_date) {
      query = query.gte('received_at', start_date);
    }
    if (end_date) {
      query = query.lte('received_at', end_date);
    }
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }
    if (received_by) {
      query = query.eq('received_by', received_by);
    }

    // Pagination
    query = query
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    
    return { data, total: count };
  }
}

export default new PaymentTransactionModel();
