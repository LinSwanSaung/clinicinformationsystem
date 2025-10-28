import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Search
} from 'lucide-react';
import invoiceService from '../services/invoiceService';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPendingInvoices();
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getPendingInvoices();
      console.log('Pending invoices:', data);
      setPendingInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading pending invoices:', error);
      setError('Failed to load pending invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = pendingInvoices.filter(invoice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = `${invoice.patient?.first_name} ${invoice.patient?.last_name}`.toLowerCase();
    const invoiceNumber = invoice.invoice_number?.toLowerCase() || '';
    return patientName.includes(search) || invoiceNumber.includes(search);
  });

  const stats = {
    pending: pendingInvoices.filter(i => i.status === 'pending').length,
    partial: pendingInvoices.filter(i => i.status === 'partial').length,
    totalAmount: pendingInvoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0),
    totalBalance: pendingInvoices.reduce((sum, i) => sum + parseFloat(i.balance || 0), 0)
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      partial: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Cashier Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Process payments and manage invoices</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.partial}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-orange-600">${stats.totalBalance.toFixed(2)}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={loadPendingInvoices}
              className="text-xs text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Invoices</h2>
            <p className="text-sm text-gray-600 mt-1">Click on an invoice to process payment</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-600 mt-2">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                {searchTerm ? 'No invoices match your search' : 'No pending invoices'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Visit Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/cashier/invoice/${invoice.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.patient?.first_name} {invoice.patient?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{invoice.patient?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {invoice.visit?.visit_type || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${parseFloat(invoice.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        ${parseFloat(invoice.paid_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-orange-600">
                        ${parseFloat(invoice.balance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cashier/invoice/${invoice.id}`);
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Process →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
