import { BaseModel } from './BaseModel.js';
import logger from '../config/logger.js';

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
    // First get payment transactions without user relations to avoid ambiguous relationship
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('received_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [
      ...new Set(
        data
          .map((pt) => [pt.received_by, pt.processed_by])
          .flat()
          .filter(Boolean)
      ),
    ];

    // Fetch users separately if we have any user IDs
    const userMap = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('id', userIds);

      if (usersError) {
        throw usersError;
      }
      
      // Create a map for quick lookup
      (users || []).forEach((user) => {
        userMap[user.id] = user;
      });
    }

    // Attach user info to payment transactions
    return data.map((pt) => ({
      ...pt,
      received_by_user: pt.received_by ? userMap[pt.received_by] || null : null,
      processed_by_user: pt.processed_by ? userMap[pt.processed_by] || null : null,
    }));
  }

  /**
   * Get recent payments for an invoice (within specified time window in milliseconds)
   * Used for duplicate payment detection
   */
  async getRecentPaymentsByInvoice(invoiceId, timeWindowMs = 5000) {
    const timeWindow = new Date(Date.now() - timeWindowMs);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, amount, payment_method, received_by, received_at')
      .eq('invoice_id', invoiceId)
      .gte('received_at', timeWindow.toISOString())
      .order('received_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recent payments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Atomically record payment using database function with advisory locks
   * This prevents race conditions when multiple payments are recorded simultaneously
   */
  async recordPaymentAtomic(invoiceId, amount, paymentMethod, paymentReference, paymentNotes, receivedBy) {
    try {
      const { data, error } = await this.supabase.rpc('record_payment_atomic', {
        p_invoice_id: invoiceId,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_payment_reference: paymentReference || null,
        p_payment_notes: paymentNotes || null,
        p_received_by: receivedBy,
      });

      if (error) {
        throw new Error(`Failed to record payment atomically: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from record_payment_atomic function');
      }

      const result = data[0];
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to record payment');
      }

      // Parse JSONB data back to objects
      const paymentData = result.payment_data;
      const invoiceData = result.invoice_data;
      
      return {
        success: true,
        message: result.message,
        payment: paymentData,
        invoice: invoiceData,
      };
    } catch (error) {
      logger.error('Error in recordPaymentAtomic:', error);
      throw error;
    }
  }

  async createPayment(paymentData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      throw error;
    }
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

    if (error) {
      throw error;
    }
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

    if (error) {
      throw error;
    }
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

    if (error) {
      throw error;
    }
    
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

    if (error) {
      throw error;
    }
    
    return { data, total: count };
  }
}

export default new PaymentTransactionModel();
