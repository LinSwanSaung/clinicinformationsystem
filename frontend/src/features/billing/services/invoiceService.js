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

  // Add service item to invoice
  addServiceItem: async (invoiceId, serviceData) => {
    const response = await apiService.post(`/invoices/${invoiceId}/items/service`, serviceData);
    return response.data;
  },

  // Add medicine item to invoice
  addMedicineItem: async (invoiceId, medicineData) => {
    const response = await apiService.post(`/invoices/${invoiceId}/items/medicine`, medicineData);
    return response.data;
  },

  // Add prescriptions to invoice
  addPrescriptionsToInvoice: async (invoiceId, visitId) => {
    const response = await apiService.post(`/invoices/${invoiceId}/prescriptions`, { visit_id: visitId });
    return response.data;
  },

  // Update invoice item
  updateInvoiceItem: async (invoiceId, itemId, updates) => {
    const response = await apiService.put(`/invoices/${invoiceId}/items/${itemId}`, updates);
    return response.data;
  },

  // Remove invoice item
  removeInvoiceItem: async (invoiceId, itemId) => {
    const response = await apiService.delete(`/invoices/${invoiceId}/items/${itemId}`);
    return response.data;
  },

  // Update discount
  updateDiscount: async (invoiceId, discountAmount, discountPercentage = 0) => {
    const response = await apiService.put(`/invoices/${invoiceId}/discount`, {
      discount_amount: discountAmount,
      discount_percentage: discountPercentage
    });
    return response.data;
  },

  // Complete invoice
  completeInvoice: async (invoiceId, completedBy) => {
    const response = await apiService.put(`/invoices/${invoiceId}/complete`, { completed_by: completedBy });
    return response.data;
  },

  // Record payment
  recordPayment: async (invoiceId, paymentData) => {
    const response = await apiService.post('/payments', {
      invoice_id: invoiceId,
      amount: paymentData.amount || paymentData.amount_paid,
      payment_method: paymentData.payment_method,
      payment_notes: paymentData.payment_notes || paymentData.notes
    });
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
  recordPartialPayment: async (invoiceId, paymentData) => {
    const response = await apiService.post(`/invoices/${invoiceId}/partial-payment`, paymentData);
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
