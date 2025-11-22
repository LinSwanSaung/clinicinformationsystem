import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Plus, Save, CreditCard } from 'lucide-react';
import { invoiceService } from '@/features/billing';
import logger from '@/utils/logger';
import { useFeedback } from '@/contexts/FeedbackContext';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useFeedback();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Medicine item form
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    quantity: 1,
    unit_price: 0,
    notes: '',
  });

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payment, setPayment] = useState({
    payment_method: 'cash',
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getInvoiceById(id);
      logger.debug('Invoice loaded:', data);
      setInvoice(data);
      // Set payment amount to balance
      setPayment((prev) => ({ ...prev, amount: parseFloat(data.balance || 0) }));
    } catch (error) {
      logger.error('Error loading invoice:', error);
      setError('Failed to load invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.medicine_name || newMedicine.unit_price <= 0) {
      showError('Please enter medicine name and price');
      return;
    }

    try {
      setSaving(true);
      await invoiceService.addMedicineItem(invoice.id, {
        ...newMedicine,
        item_name: newMedicine.medicine_name,
      });

      // Reset form
      setNewMedicine({
        medicine_name: '',
        quantity: 1,
        unit_price: 0,
        notes: '',
      });

      // Reload invoice
      await loadInvoice();
      showSuccess('Medicine added successfully!');
    } catch (error) {
      logger.error('Error adding medicine:', error);
      showError('Failed to add medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayment = async () => {
    if (payment.amount <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    try {
      setSaving(true);
      await invoiceService.recordPayment(invoice.id, payment);
      showSuccess('Payment recorded successfully!');
      await loadInvoice();
      setShowPaymentForm(false);
    } catch (error) {
      logger.error('Error processing payment:', error);
      showError('Failed to process payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteInvoice = async () => {
    if (invoice.balance > 0) {
      if (
        !confirm(`There is a remaining balance of $${invoice.balance.toFixed(2)}. Complete anyway?`)
      ) {
        return;
      }
    }

    try {
      setSaving(true);
      await invoiceService.completeInvoice(invoice.id);
      showSuccess('Invoice completed successfully!');
      navigate('/cashier/dashboard');
    } catch (error) {
      logger.error('Error completing invoice:', error);
      showError('Failed to complete invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">{error || 'Invoice not found'}</p>
            <button
              onClick={() => navigate('/cashier/dashboard')}
              className="mt-4 font-medium text-green-600 hover:text-green-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const serviceItems = invoice.invoice_items?.filter((item) => item.item_type === 'service') || [];
  const medicineItems =
    invoice.invoice_items?.filter((item) => item.item_type === 'medicine') || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cashier/dashboard')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
              <p className="mt-1 text-gray-600">Process payment and complete invoice</p>
            </div>
            <span
              className={`rounded px-3 py-1 text-sm font-medium ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : invoice.status === 'partial'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Invoice Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Patient Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Patient Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Patient Name</p>
                    <p className="font-medium">
                      {invoice.patient?.first_name} {invoice.patient?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {invoice.visit && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">
                    Visit Type:{' '}
                    <span className="font-medium text-gray-900">{invoice.visit.visit_type}</span>
                  </p>
                  {invoice.visit.chief_complaint && (
                    <p className="mt-1 text-sm text-gray-600">
                      Chief Complaint:{' '}
                      <span className="font-medium text-gray-900">
                        {invoice.visit.chief_complaint}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Service Items */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Services</h2>
              {serviceItems.length === 0 ? (
                <p className="text-sm text-gray-500">No services added</p>
              ) : (
                <div className="space-y-2">
                  {serviceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(item.total_price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medicine Items */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Medicines</h2>

              {medicineItems.length > 0 && (
                <div className="mb-4 space-y-2">
                  {medicineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(item.total_price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Medicine Form */}
              {invoice.status !== 'paid' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Medicine</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newMedicine.medicine_name}
                      onChange={(e) =>
                        setNewMedicine({ ...newMedicine, medicine_name: e.target.value })
                      }
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      min="1"
                      value={newMedicine.quantity}
                      onChange={(e) =>
                        setNewMedicine({ ...newMedicine, quantity: parseInt(e.target.value) || 1 })
                      }
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Unit price"
                      min="0"
                      step="0.01"
                      value={newMedicine.unit_price}
                      onChange={(e) =>
                        setNewMedicine({
                          ...newMedicine,
                          unit_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={newMedicine.notes}
                      onChange={(e) => setNewMedicine({ ...newMedicine, notes: e.target.value })}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddMedicine}
                    disabled={saving}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medicine
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Summary</h2>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ${parseFloat(invoice.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -${parseFloat(invoice.discount_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">
                    ${parseFloat(invoice.tax_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">
                    ${parseFloat(invoice.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">
                    ${parseFloat(invoice.paid_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-orange-600">Balance:</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${parseFloat(invoice.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Actions */}
              {invoice.status !== 'paid' && (
                <div className="space-y-2">
                  {!showPaymentForm ? (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4" />
                      Record Payment
                    </button>
                  ) : (
                    <div className="space-y-3 rounded bg-gray-50 p-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Payment Method
                        </label>
                        <select
                          value={payment.payment_method}
                          onChange={(e) =>
                            setPayment({ ...payment, payment_method: e.target.value })
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="insurance">Insurance</option>
                          <option value="mobile_payment">Mobile Payment</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) =>
                            setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={payment.notes}
                          onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                          rows="2"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleProcessPayment}
                          disabled={saving}
                          className="flex-1 rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? 'Processing...' : 'Submit Payment'}
                        </button>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCompleteInvoice}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Complete Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Payment History */}
            {invoice.payment_transactions && invoice.payment_transactions.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Payment History</h2>
                <div className="space-y-2">
                  {invoice.payment_transactions.map((transaction) => (
                    <div key={transaction.id} className="rounded bg-gray-50 p-2 text-sm">
                      <div className="mb-1 flex justify-between">
                        <span className="font-medium">{transaction.payment_method}</span>
                        <span className="font-semibold text-green-600">
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
