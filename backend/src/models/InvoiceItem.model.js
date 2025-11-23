import { BaseModel } from './BaseModel.js';

/**
 * InvoiceItem Model - Line items on invoices
 */
class InvoiceItemModel extends BaseModel {
  constructor() {
    super('invoice_items');
  }

  /**
   * Get items by invoice ID
   */
  async getItemsByInvoice(invoiceId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('added_at', { ascending: true });

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get item by ID
   */
  async getItemById(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle to handle missing items gracefully

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invoice item not found');
    }

    return data;
  }

  /**
   * Create invoice item
   */
  async createItem(itemData) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(itemData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Update invoice item
   */
  async updateItem(id, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle(); // Use maybeSingle to handle deleted items gracefully

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invoice item not found. It may have been deleted by another user.');
    }

    return data;
  }

  /**
   * Delete invoice item
   */
  async deleteItem(id) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle(); // Use maybeSingle to handle already-deleted items gracefully

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Invoice item not found. It may have already been deleted.');
    }

    return data;
  }

  /**
   * Bulk create invoice items
   */
  async createItems(items) {
    const { data, error } = await this.supabase.from(this.tableName).insert(items).select();

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Delete all items for an invoice
   */
  async deleteItemsByInvoice(invoiceId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('invoice_id', invoiceId)
      .select();

    if (error) {
      throw error;
    }
    return data;
  }
}

export default new InvoiceItemModel();
