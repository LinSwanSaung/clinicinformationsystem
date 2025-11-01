import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { DollarSign, Download, Eye, Filter } from 'lucide-react';
import api from '../../services/api';

const PaymentTransactions = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    payment_method: '',
    received_by: '',
    limit: 50,
    offset: 0
  });/*  */

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/payments/admin/all-transactions?${params}`);
      console.log('API Response:', response);
      console.log('Full response.data:', response.data);
      
      // Handle response structure - check if data is wrapped or direct
      if (Array.isArray(response.data)) {
        // Response is direct array
        setPayments(response.data);
        setTotal(response.data.length);
      } else if (response.data.data) {
        // Response has { data: [], total: 0 } structure
        setPayments(response.data.data || []);
        setTotal(response.data.total || 0);
      } else {
        setPayments([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (payment) => {
    try {
      const response = await api.get(`/invoices/${payment.invoice.id}`);
      setSelectedPayment({ ...payment, invoiceDetails: response.data.data });
      setInvoiceModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login first');
        return;
      }
      
      // Use direct fetch with proper auth header format
      const response = await fetch(
        `http://localhost:3001/api/payments/${payment.id}/receipt/pdf`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error('Failed to download receipt');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${payment.payment_reference || payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePrevPage = () => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  const handleNextPage = () => {
    if (filters.offset + filters.limit < total) {
      setFilters(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const getPaymentMethodBadge = (method) => {
    const colors = {
      cash: 'bg-green-100 text-green-700',
      card: 'bg-blue-100 text-blue-700',
      insurance: 'bg-purple-100 text-purple-700',
      mobile_payment: 'bg-orange-100 text-orange-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  };

  return (
    <PageLayout
      title="Payment Transactions"
      subtitle="View all payment transactions system-wide"
      fullWidth
    >
      <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
          <p className="text-gray-500 mt-1">View all payment transactions system-wide</p>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
              <option value="mobile_payment">Mobile Payment</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters({
                start_date: '',
                end_date: '',
                payment_method: '',
                received_by: '',
                limit: 50,
                offset: 0
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Payment Transactions ({total} total)
        </h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No payments found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Date & Time</th>
                    <th className="text-left p-3 font-semibold">Patient</th>
                    <th className="text-left p-3 font-semibold">Invoice #</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Method</th>
                    <th className="text-left p-3 font-semibold">Received By</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-700">
                        {new Date(payment.received_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.invoice?.patient?.first_name} {payment.invoice?.patient?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.invoice?.patient?.patient_number}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-sm text-gray-700">
                        {payment.invoice?.invoice_number || '—'}
                      </td>
                      <td className="p-3 font-semibold text-gray-900">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentMethodBadge(payment.payment_method)}`}>
                          {payment.payment_method.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.received_by_user?.first_name} {payment.received_by_user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {payment.received_by_user?.role}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(payment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, total)} of {total}
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={filters.offset + filters.limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Invoice View Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedPayment?.invoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {selectedPayment.invoice?.patient?.first_name} {selectedPayment.invoice?.patient?.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Patient #:</span>
                    <span className="ml-2 font-medium">
                      {selectedPayment.invoice?.patient?.patient_number}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">
                      ${parseFloat(selectedPayment.invoiceDetails?.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium text-green-600">
                      ${parseFloat(selectedPayment.invoiceDetails?.paid_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium text-red-600">
                      ${parseFloat(selectedPayment.invoiceDetails?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* This Payment */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">This Payment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-700">
                      ${parseFloat(selectedPayment.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium capitalize">
                      {selectedPayment.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium">
                      {selectedPayment.payment_reference || '—'}
                    </span>
                  </div>
                  {selectedPayment.payment_notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="mt-1 text-gray-700">{selectedPayment.payment_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageLayout>
  );
};

export default PaymentTransactions;
