import apiService from '@/services/api';

const invoiceService = {
  // Get pending invoices (for cashier dashboard)
  getPendingInvoices: async () => {
    const response = await apiService.get('/invoices/pending');
    return response.data;
  },

  // Get completed invoices (invoice history)
  getCompletedInvoices: async (limit = 50, offset = 0) => {
    const response = await apiService.get(`/invoices/completed?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    const response = await apiService.get(`/invoices/${id}`);
    return response.data;
  },

  // Get invoice by visit ID
  getInvoiceByVisit: async (visitId) => {
    const response = await apiService.get(`/invoices/visit/${visitId}`);
    return response.data;
  },

  // Get invoices by patient
  getInvoicesByPatient: async (patientId) => {
    const response = await apiService.get(`/invoices/patient/${patientId}`);
    return response.data;
  },

  // Create invoice
  createInvoice: async (visitId) => {
    const response = await apiService.post('/invoices', { visit_id: visitId });
    return response.data;
  },

  // Add service item to invoice (with version for optimistic locking)
  addServiceItem: async (invoiceId, serviceData, version = null) => {
    const payload = version !== null ? { ...serviceData, version } : serviceData;
    const response = await apiService.post(`/invoices/${invoiceId}/items/service`, payload);
    return response.data;
  },

  // Add medicine item to invoice (with version for optimistic locking)
  addMedicineItem: async (invoiceId, medicineData, version = null) => {
    const payload = version !== null ? { ...medicineData, version } : medicineData;
    const response = await apiService.post(`/invoices/${invoiceId}/items/medicine`, payload);
    return response.data;
  },

  // Add prescriptions to invoice
  addPrescriptionsToInvoice: async (invoiceId, visitId) => {
    const response = await apiService.post(`/invoices/${invoiceId}/prescriptions`, {
      visit_id: visitId,
    });
    return response.data;
  },

  // Update invoice item (with version for optimistic locking)
  updateInvoiceItem: async (invoiceId, itemId, updates, version = null) => {
    const payload = version !== null ? { ...updates, version } : updates;
    const response = await apiService.put(`/invoices/${invoiceId}/items/${itemId}`, payload);
    return response.data;
  },

  // Remove invoice item (with version for optimistic locking)
  removeInvoiceItem: async (invoiceId, itemId, version = null) => {
    const params = version !== null ? { version } : {};
    const response = await apiService.delete(`/invoices/${invoiceId}/items/${itemId}`, { params });
    return response.data;
  },

  // Update outstanding balance flag (with version for optimistic locking)
  updateOutstandingBalanceFlag: async (invoiceId, includeOutstandingBalance, version = null) => {
    const payload = {
      include_outstanding_balance: includeOutstandingBalance,
    };
    if (version !== null) {
      payload.version = version;
    }
    const response = await apiService.put(
      `/invoices/${invoiceId}/outstanding-balance-flag`,
      payload
    );
    return response.data;
  },

  // Update discount (with version for optimistic locking)
  updateDiscount: async (invoiceId, discountAmount, discountPercentage = 0, version = null) => {
    const payload = {
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
    };
    if (version !== null) {
      payload.version = version;
    }
    const response = await apiService.put(`/invoices/${invoiceId}/discount`, payload);
    return response.data;
  },

  // Complete invoice
  completeInvoice: async (invoiceId, completedBy, expectedVersion = null) => {
    const response = await apiService.put(`/invoices/${invoiceId}/complete`, {
      completed_by: completedBy,
      version: expectedVersion,
    });
    return response.data;
  },

  // Record payment
  recordPayment: async (invoiceId, paymentData, expectedVersion = null) => {
    const payload = {
      invoice_id: invoiceId,
      amount: paymentData.amount || paymentData.amount_paid,
      payment_method: paymentData.payment_method,
      payment_notes: paymentData.payment_notes || paymentData.notes,
    };
    if (expectedVersion !== null) {
      payload.version = expectedVersion;
    }
    const response = await apiService.post('/payments', payload);
    return response.data;
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId, reason) => {
    const response = await apiService.put(`/invoices/${invoiceId}/cancel`, { reason });
    return response.data;
  },

  // Get patient's outstanding invoices
  getPatientOutstandingInvoices: async (patientId) => {
    const response = await apiService.get(`/invoices/patient/${patientId}/outstanding`);
    return response.data;
  },

  // Get patient's total outstanding balance
  getPatientOutstandingBalance: async (patientId) => {
    const response = await apiService.get(`/invoices/patient/${patientId}/outstanding-balance`);
    return response.data;
  },

  // Get patient's total remaining credit
  getPatientRemainingCredit: async (patientId) => {
    const response = await apiService.get(`/invoices/patient/${patientId}/remaining-credit`);
    return response.data;
  },

  // Check if patient can create more invoices
  canPatientCreateInvoice: async (patientId) => {
    const response = await apiService.get(`/invoices/patient/${patientId}/can-create`);
    return response.data;
  },

  // Record partial payment
  recordPartialPayment: async (invoiceId, paymentData, expectedVersion = null) => {
    const response = await apiService.post(`/invoices/${invoiceId}/partial-payment`, {
      ...paymentData,
      version: expectedVersion,
    });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (invoiceId) => {
    const response = await apiService.get(`/invoices/${invoiceId}/payment-history`);
    return response.data;
  },

  // Put invoice on hold
  putInvoiceOnHold: async (invoiceId, holdData) => {
    const response = await apiService.put(`/invoices/${invoiceId}/hold`, holdData);
    return response.data;
  },

  // Resume invoice from hold
  resumeInvoiceFromHold: async (invoiceId) => {
    const response = await apiService.put(`/invoices/${invoiceId}/resume`);
    return response.data;
  },
};

export default invoiceService;
