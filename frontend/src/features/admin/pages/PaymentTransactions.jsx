import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign, Eye, Filter } from 'lucide-react';
import InvoiceDetails from '@/features/billing/components/InvoiceDetails.jsx';
import api from '@/services/api';
import { DataTable, PdfDownloadButton } from '@/components/library';
import { formatCurrencySync } from '@/utils/currency';
import logger from '@/utils/logger';

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
    offset: 0,
  }); /*  */

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/payments/admin/all-transactions?${params}`);
      logger.debug('API Response:', response);
      logger.debug('Full response.data:', response.data);

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
      logger.error('Failed to fetch payments:', error);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (payment) => {
    try {
      const invoiceId =
        payment?.invoice?.id || payment?.invoice_id || payment?.invoice?.invoice_id || null;

      let invoiceDetails = null;
      if (invoiceId) {
        const response = await api.get(`/invoices/${invoiceId}`);
        invoiceDetails = response?.data?.data || response?.data || null;
      }

      setSelectedPayment({ ...payment, invoiceDetails });
      setInvoiceModalOpen(true);
    } catch (error) {
      logger.error('Failed to fetch invoice:', error);
      setSelectedPayment({ ...payment, invoiceDetails: null });
      setInvoiceModalOpen(true);
    }
  };

  // Receipt download handled by PdfDownloadButton

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  // Pagination is now handled via DataTable's onPageChange

  const getPaymentMethodBadge = (method) => {
    const colors = {
      cash: 'bg-green-100 text-green-700',
      card: 'bg-blue-100 text-blue-700',
      insurance: 'bg-purple-100 text-purple-700',
      mobile_payment: 'bg-orange-100 text-orange-700',
    };
    return colors[method] || 'bg-muted text-muted-foreground';
  };

  return (
    <PageLayout
      title="Payment Transactions"
      subtitle="View all payment transactions system-wide"
      fullWidth
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Transactions</h1>
            <p className="mt-1 text-muted-foreground">View all payment transactions system-wide</p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="mb-4 flex items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filters</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Payment Method
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
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
                onClick={() =>
                  setFilters({
                    start_date: '',
                    end_date: '',
                    payment_method: '',
                    received_by: '',
                    limit: 50,
                    offset: 0,
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Payment Transactions ({total} total)</h3>

          <DataTable
            columns={[
              {
                key: 'timestamp',
                label: 'Date & Time',
                render: (_, row) => (
                  <span className="text-gray-700">
                    {new Date(row.received_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                ),
              },
              {
                key: 'patient',
                label: 'Patient',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {row.invoice?.patient?.first_name} {row.invoice?.patient?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.invoice?.patient?.patient_number}
                    </p>
                  </div>
                ),
              },
              {
                key: 'invoice',
                label: 'Invoice #',
                render: (_, row) => (
                  <span className="font-mono text-sm text-foreground">
                    {row.invoice?.invoice_number || '—'}
                  </span>
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                render: (_, row) => (
                  <span className="font-semibold text-foreground">
                    {formatCurrencySync(parseFloat(row.amount))}
                  </span>
                ),
              },
              {
                key: 'method',
                label: 'Method',
                render: (_, row) => (
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${getPaymentMethodBadge(
                      row.payment_method
                    )}`}
                  >
                    {row.payment_method.replace('_', ' ').toUpperCase()}
                  </span>
                ),
              },
              {
                key: 'receivedBy',
                label: 'Received By',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-foreground">
                      {row.received_by_user?.first_name} {row.received_by_user?.last_name}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {row.received_by_user?.role}
                    </p>
                  </div>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                className: 'w-[160px]',
                render: (_, row) => (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewInvoice(row)}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <PdfDownloadButton
                      size="sm"
                      variant="outline"
                      endpoint={`/payments/${row.id}/receipt/pdf`}
                      fileName={`receipt_${row.payment_reference || row.id}.pdf`}
                      label="Receipt"
                    />
                  </div>
                ),
              },
            ]}
            data={payments}
            isLoading={loading}
            emptyText="No payments found."
            page={Math.floor(filters.offset / filters.limit) + 1}
            pageSize={filters.limit}
            total={total}
            onPageChange={(p) =>
              setFilters((prev) => ({
                ...prev,
                offset: (p - 1) * prev.limit,
              }))
            }
          />
        </Card>

        {/* Invoice View Modal */}
        <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Invoice #{selectedPayment?.invoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <InvoiceDetails
                invoice={selectedPayment.invoiceDetails}
                fallback={selectedPayment.invoice || selectedPayment.rawData}
                payment={{
                  amount: selectedPayment.amount,
                  payment_method: selectedPayment.payment_method,
                  payment_reference: selectedPayment.payment_reference,
                  payment_notes: selectedPayment.payment_notes,
                }}
                showPaymentSection
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default PaymentTransactions;
