import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CreditCard
} from 'lucide-react';
import { invoiceService } from '@/features/billing';
import logger from '@/utils/logger';
import { useFeedback } from '@/contexts/FeedbackContext';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useFeedback();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Medicine item form
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  });
  
  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payment, setPayment] = useState({
    payment_method: 'cash',
    amount: 0,
    notes: ''
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
      setPayment(prev => ({ ...prev, amount: parseFloat(data.balance || 0) }));
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
        item_name: newMedicine.medicine_name
      });
      
      // Reset form
      setNewMedicine({
        medicine_name: '',
        quantity: 1,
        unit_price: 0,
        notes: ''
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
      if (!confirm(`There is a remaining balance of $${invoice.balance.toFixed(2)}. Complete anyway?`)) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || 'Invoice not found'}</p>
            <button
              onClick={() => navigate('/cashier/dashboard')}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const serviceItems = invoice.invoice_items?.filter(item => item.item_type === 'service') || [];
  const medicineItems = invoice.invoice_items?.filter(item => item.item_type === 'medicine') || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cashier/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 mt-1">Process payment and complete invoice</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              invoice.status === 'partial' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Patient Name</p>
                    <p className="font-medium">
                      {invoice.patient?.first_name} {invoice.patient?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {invoice.visit && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Visit Type: <span className="font-medium text-gray-900">{invoice.visit.visit_type}</span></p>
                  {invoice.visit.chief_complaint && (
                    <p className="text-sm text-gray-600 mt-1">Chief Complaint: <span className="font-medium text-gray-900">{invoice.visit.chief_complaint}</span></p>
                  )}
                </div>
              )}
            </div>

            {/* Service Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Services</h2>
              {serviceItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No services added</p>
              ) : (
                <div className="space-y-2">
                  {serviceItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Medicines</h2>
              
              {medicineItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {medicineItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Medicine</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newMedicine.medicine_name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, medicine_name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      min="1"
                      value={newMedicine.quantity}
                      onChange={(e) => setNewMedicine({ ...newMedicine, quantity: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Unit price"
                      min="0"
                      step="0.01"
                      value={newMedicine.unit_price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, unit_price: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={newMedicine.notes}
                      onChange={(e) => setNewMedicine({ ...newMedicine, notes: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddMedicine}
                    disabled={saving}
                    className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Medicine
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${parseFloat(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-${parseFloat(invoice.discount_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${parseFloat(invoice.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${parseFloat(invoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">${parseFloat(invoice.paid_amount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-orange-600">Balance:</span>
                  <span className="font-bold text-lg text-orange-600">${parseFloat(invoice.balance || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Actions */}
              {invoice.status !== 'paid' && (
                <div className="space-y-2">
                  {!showPaymentForm ? (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Record Payment
                    </button>
                  ) : (
                    <div className="space-y-3 p-3 bg-gray-50 rounded">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                          value={payment.payment_method}
                          onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="insurance">Insurance</option>
                          <option value="mobile_payment">Mobile Payment</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                          value={payment.notes}
                          onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleProcessPayment}
                          disabled={saving}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {saving ? 'Processing...' : 'Submit Payment'}
                        </button>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleCompleteInvoice}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Complete Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Payment History */}
            {invoice.payment_transactions && invoice.payment_transactions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h2>
                <div className="space-y-2">
                  {invoice.payment_transactions.map((transaction) => (
                    <div key={transaction.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between mb-1">
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
