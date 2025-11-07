import apiService from '@/services/api';

const paymentService = {
  // Record payment
  recordPayment: async (invoiceId, paymentData) => {
    const response = await apiService.post('/payments', {
      invoice_id: invoiceId,
      ...paymentData
    });
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await apiService.get(`/payments/${id}`);
    return response.data;
  },

  // Get payments by invoice
  getPaymentsByInvoice: async (invoiceId) => {
    const response = await apiService.get(`/payments/invoice/${invoiceId}`);
    return response.data;
  },

  // Get payment report
  getPaymentReport: async (startDate, endDate) => {
    const response = await apiService.get('/payments/report', {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  },
};

export default paymentService;
