import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedback } from '@/contexts/FeedbackContext';
import { formatCurrencySync, getCurrencySymbol, refreshCurrencyCache } from '@/utils/currency';
import {
  Search,
  X,
  Clock,
  DollarSign,
  FileText,
  User,
  Pill,
  CreditCard,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Receipt,
  Package,
  History,
  Eye,
  Check,
  XCircle,
  Minus,
  Plus,
  Percent,
  Calculator,
  Save,
  Download,
  Tag,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import InvoiceDetails from '@/features/billing/components/InvoiceDetails.jsx';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import PageLayout from '@/components/layout/PageLayout';
import useDebounce from '@/hooks/useDebounce';
import { invoiceService } from '@/features/billing';
import { useInvoices } from '@/features/billing';
import { POLLING_INTERVALS } from '@/constants/polling';
import api from '@/services/api';
import { PaymentDetailModal } from '@/components/library';
import logger from '@/utils/logger';
import DispenseHistoryTab from '@/features/dispenses/components/DispenseHistoryTab';
import clinicSettingsService from '@/services/clinicSettingsService';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const _cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 100,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: { scale: 0.98 },
};

const _searchVariants = {
  centered: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
  },
  expanded: {
    width: '100%',
    maxWidth: '400px',
    margin: '0',
  },
  focused: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

// Memoized Invoice History Item Component
const InvoiceHistoryItem = memo(({ invoice, onView, onDownload }) => {
  return (
    <div
      key={invoice.id}
      className={`hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors ${
        invoice.hasCreditPayment
          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'
          : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{invoice.id}</p>
              {invoice.hasCreditPayment && (
                <Badge
                  variant="outline"
                  className="border-blue-300 bg-blue-100 text-xs text-blue-800"
                >
                  Credit Payment
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{invoice.patientName}</p>
            {invoice.creditAmount && (
              <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                Includes {formatCurrencySync(invoice.creditAmount)} credit from previous invoices
              </p>
            )}
          </div>
          <div>
            <p className="text-sm">{invoice.doctorName}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.date} at {invoice.time}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{formatCurrencySync(invoice.totalAmount)}</p>
          {invoice.amountPaid > 0 && (
            <p className="text-xs text-muted-foreground">
              Paid: {formatCurrencySync(invoice.amountPaid)}
              {invoice.status === 'partial_paid' && invoice.balanceDue > 0 && (
                <span className="ml-1 text-amber-700 dark:text-amber-300">(partial)</span>
              )}
            </p>
          )}
          {invoice.outstandingBalancePaidFromLater > 0 && (
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Outstanding paid: {formatCurrencySync(invoice.outstandingBalancePaidFromLater)} (from
              later visit)
            </p>
          )}
          {invoice.balanceDue > 0 && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Balance: {formatCurrencySync(invoice.balanceDue)}
            </p>
          )}
          <p className="mt-1 text-sm capitalize text-muted-foreground">{invoice.paymentMethod}</p>
        </div>
        <Badge
          className={
            invoice.status === 'partial_paid'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-green-100 text-green-800'
          }
        >
          {invoice.status === 'partial_paid' ? 'Partial Paid' : 'Completed'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(invoice)} className="gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownload(invoice)} className="gap-2">
            <Download className="h-4 w-4" />
            Receipt
          </Button>
        </div>
      </div>
    </div>
  );
});

InvoiceHistoryItem.displayName = 'InvoiceHistoryItem';

const CashierDashboard = () => {
  // Use feedback system instead of inline state
  const { showSuccess, showError, showWarning } = useFeedback();

  // Invoices via React Query hooks with auto-refresh
  const {
    data: pendingInvoicesData,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useInvoices({ type: 'pending', refetchInterval: POLLING_INTERVALS.QUEUE }); // 30 seconds (reduced from 10s)
  const {
    data: completedInvoicesData,
    isLoading: _isCompletedLoading,
    refetch: refetchCompleted,
  } = useInvoices({
    type: 'completed',
    limit: 50,
    offset: 0,
    refetchInterval: POLLING_INTERVALS.DASHBOARD,
  }); // 60 seconds (completed invoices change less frequently)

  // Invoice history state
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [_showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Invoice detail modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [medications, setMedications] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrScannedConfirmed, setQrScannedConfirmed] = useState(false);
  const [clinicSettings, setClinicSettings] = useState(null);

  // Partial payment state
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');

  // Outstanding balance state
  const [outstandingBalance, setOutstandingBalance] = useState(null);
  const [_showOutstandingAlert, setShowOutstandingAlert] = useState(false);
  const [addOutstandingToInvoice, setAddOutstandingToInvoice] = useState(false);
  const [invoiceLimitReached, setInvoiceLimitReached] = useState(false);

  // Services management state
  const [services, setServices] = useState([]);
  const [isEditingService, setIsEditingService] = useState(null);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', description: '' });

  // Payment history invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [_patientRemainingCredit, setPatientRemainingCredit] = useState(0);

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Auto-refresh is now handled by React Query refetchInterval in useInvoices hooks
  // No need for manual interval

  // Load clinic settings and refresh currency cache on mount
  useEffect(() => {
    const loadClinicSettings = async () => {
      try {
        // Refresh currency cache first
        await refreshCurrencyCache();

        const result = await clinicSettingsService.getSettings();
        if (result.success && result.data) {
          const data = result.data.data || result.data;
          setClinicSettings(data);
        }
      } catch (error) {
        logger.error('Failed to load clinic settings:', error);
      }
    };
    loadClinicSettings();
  }, []);

  // Load invoice history when switching to history tab or when completed invoices data changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadInvoiceHistory();
    }
  }, [activeTab, completedInvoicesData]);

  // Initialize medications and services when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      // Get medications from invoice_items
      const meds = (selectedInvoice.invoice_items || [])
        .filter((item) => item.item_type === 'medicine')
        .map((item) => ({
          id: item.id,
          name: item.item_name,
          quantity: item.quantity,
          price: parseFloat(item.unit_price || 0),
          dosage: item.notes || '',
          instructions: item.notes || '',
          inStock: 100, // Mock value
          dispensedQuantity: 0,
          action: 'pending', // pending, dispense, write-out
        }));
      setMedications(meds);

      // Get services from invoice_items
      const servs = (selectedInvoice.invoice_items || [])
        .filter((item) => item.item_type === 'service')
        .map((item) => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price || 0),
          description: item.notes || '',
          quantity: item.quantity || 1,
        }));
      setServices(servs);
    }
  }, [selectedInvoice]);

  // Load invoice history using hook data
  const loadInvoiceHistory = async (forceRefresh = false) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      // If force refresh, refetch from API first
      if (forceRefresh) {
        await refetchCompleted();
      }

      const response = Array.isArray(completedInvoicesData) ? completedInvoicesData : [];

      // Show each invoice separately - each invoice is tied to its visit
      // Don't consolidate invoices - each visit should have its own invoice entry
      const invoiceHistory = [];

      response.forEach((invoice) => {
        // Calculate total paid amount for THIS invoice only
        // Only count payments that were made directly to this invoice
        const totalPaid =
          invoice.payment_transactions?.reduce((sum, payment) => {
            // Only count payments made to this invoice (not payments that went to other invoices)
            // Payments to other invoices have notes like "Paid with current visit invoice #..."
            const paymentNotes = (payment.payment_notes || '').toLowerCase();
            const isPaymentToOtherInvoice =
              paymentNotes.includes('paid with current visit') ||
              paymentNotes.includes('previous invoice');

            // If this payment was made to another invoice, don't count it here
            if (isPaymentToOtherInvoice) {
              return sum;
            }

            return sum + parseFloat(payment.amount || 0);
          }, 0) || 0;

        // Calculate balance due for this invoice
        const balanceDue = parseFloat(invoice.balance_due || 0);

        // Check if this invoice has payments that mention paying off previous invoices
        // This happens when outstanding balance is paid from a later visit
        const _hasOutstandingBalancePayment =
          invoice.payment_transactions?.some((payment) => {
            const notes = (payment.payment_notes || '').toLowerCase();
            return notes.includes('paid with current visit') || notes.includes('previous invoice');
          }) || false;

        // Find payments on OTHER invoices that mention this invoice's number
        // This happens when this invoice's outstanding balance was paid from a later visit
        // The payment note will say "Paid with current visit invoice #THIS_INVOICE_NUMBER"
        let outstandingBalancePaidFromLater = 0;
        const thisInvoiceNumber = invoice.invoice_number || invoice.id;
        response.forEach((otherInvoice) => {
          if (otherInvoice.id !== invoice.id && otherInvoice.payment_transactions) {
            otherInvoice.payment_transactions.forEach((payment) => {
              const notes = (payment.payment_notes || '').toLowerCase();
              // Check if payment note mentions this invoice number
              if (
                notes.includes(`invoice #${thisInvoiceNumber.toLowerCase()}`) ||
                notes.includes(`invoice ${thisInvoiceNumber.toLowerCase()}`) ||
                notes.includes(`invoice#${thisInvoiceNumber.toLowerCase()}`)
              ) {
                outstandingBalancePaidFromLater += parseFloat(payment.amount || 0);
              }
            });
          }
        });

        invoiceHistory.push({
          id: invoice.invoice_number || invoice.id,
          invoiceId: invoice.id,
          visitId: invoice.visit_id,
          patientName:
            invoice.patients?.full_name ||
            `${invoice.patients?.first_name || ''} ${invoice.patients?.last_name || ''}`.trim() ||
            'Unknown Patient',
          doctorName:
            invoice.visits?.doctor?.full_name ||
            `${invoice.visits?.doctor?.first_name || ''} ${invoice.visits?.doctor?.last_name || ''}`.trim() ||
            'Unknown Doctor',
          date: invoice.completed_at
            ? new Date(invoice.completed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : invoice.visits?.visit_date
              ? new Date(invoice.visits.visit_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : invoice.created_at
                ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'N/A',
          time: invoice.completed_at
            ? new Date(invoice.completed_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : invoice.created_at
              ? new Date(invoice.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'N/A',
          totalAmount: parseFloat(invoice.total_amount || 0),
          amountPaid: totalPaid,
          balanceDue: balanceDue > 0 ? balanceDue : 0,
          status: invoice.status,
          paymentMethod:
            invoice.payment_transactions?.find((p) => {
              const notes = (p.payment_notes || '').toLowerCase();
              return (
                !notes.includes('paid with current visit') && !notes.includes('previous invoice')
              );
            })?.payment_method ||
            invoice.payment_transactions?.[0]?.payment_method ||
            'N/A',
          processedBy:
            invoice.completed_by_user?.full_name ||
            `${invoice.completed_by_user?.first_name || ''} ${invoice.completed_by_user?.last_name || ''}`.trim() ||
            'Unknown',
          outstandingBalancePaidFromLater:
            outstandingBalancePaidFromLater > 0 ? outstandingBalancePaidFromLater : null,
          rawData: invoice,
        });
      });

      const consolidatedInvoices = invoiceHistory;

      // Sort by date (newest first)
      consolidatedInvoices.sort((a, b) => {
        const dateA = new Date(a.rawData?.completed_at || a.rawData?.created_at || 0);
        const dateB = new Date(b.rawData?.completed_at || b.rawData?.created_at || 0);
        return dateB - dateA;
      });

      setInvoiceHistory(consolidatedInvoices);
    } catch (error) {
      logger.error('Failed to load invoice history:', error);
      setHistoryError('Failed to load invoice history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // View invoice details from payment history
  const handleViewHistoryInvoice = useCallback(
    async (historyItem) => {
      try {
        const response = await invoiceService.getInvoiceById(historyItem.rawData.id);
        setSelectedPayment({
          ...historyItem.rawData,
          invoice: historyItem.rawData,
          invoiceDetails: response,
        });
        setInvoiceModalOpen(true);

        // Fetch patient's total remaining credit
        const patientId = response.patient?.id || historyItem.rawData.patient_id;
        if (patientId) {
          try {
            const creditData = await invoiceService.getPatientRemainingCredit(patientId);
            setPatientRemainingCredit(creditData?.totalCredit || 0);
          } catch (creditError) {
            logger.error('Failed to fetch patient remaining credit:', creditError);
            setPatientRemainingCredit(0);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch invoice:', error);
        showError('Failed to load invoice details');
      }
    },
    [showError]
  );

  // Download receipt for invoice
  const handleDownloadReceipt = useCallback(
    async (historyItem) => {
      try {
        // Get the first payment transaction for this invoice
        const paymentId = historyItem.rawData.payment_transactions?.[0]?.id;

        if (!paymentId) {
          showWarning('No payment found for this invoice');
          return;
        }

        const blob = await api.getBlob(`/payments/${paymentId}/receipt/pdf`, {
          headers: { Accept: 'application/pdf' },
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${historyItem.rawData.invoice_number || historyItem.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Failed to download receipt:', error);
        showError('Failed to download receipt. Please try again.');
      }
    },
    [showWarning, showError]
  );

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Refetch both pending and completed invoices
      await Promise.all([refetchPending(), refetchCompleted()]);
      setLastRefreshTime(new Date());
      showSuccess('Invoice data refreshed');
    } catch (error) {
      logger.error('Manual refresh error:', error);
      showError('Failed to refresh invoice data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics - use hook data directly
  const stats = useMemo(() => {
    const pending = (pendingInvoicesData || []).filter((inv) => inv.status === 'pending').length;

    // Count today's completed invoices and revenue
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const todayInvoices = (invoiceHistory || []).filter((inv) => inv.date === today);
    const todayCompleted = todayInvoices.length;
    const todayRevenue = todayInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.totalAmount) || 0),
      0
    );

    return {
      totalInvoices: (pendingInvoicesData || []).length,
      pendingInvoices: pending,
      todayCompleted,
      todayRevenue,
    };
  }, [pendingInvoicesData, invoiceHistory]);

  // Advanced filtering - use hook data directly
  const filteredInvoices = useMemo(() => {
    let filtered = pendingInvoicesData || [];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((invoice) => {
        return (
          invoice.id.toLowerCase().includes(searchLower) ||
          invoice.patientName.toLowerCase().includes(searchLower) ||
          invoice.doctorName.toLowerCase().includes(searchLower)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') {
        return -1;
      }
      if (b.priority === 'high' && a.priority !== 'high') {
        return 1;
      }
      return a.waitingTime - b.waitingTime;
    });
  }, [pendingInvoicesData, debouncedSearchTerm, statusFilter, priorityFilter]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowFilters(false);
    setStatusFilter('all');
    setPriorityFilter('all');
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setShowFilters(false);
  }, []);

  const handleViewInvoice = async (invoice) => {
    // Always fetch fresh invoice to get latest version
    try {
      const freshInvoice = await invoiceService.getInvoiceById(invoice.id);
      setSelectedInvoice(freshInvoice);
      setShowInvoiceDetail(true);
      // Load discount values from invoice (if already set)
      setDiscountPercent(freshInvoice.discount_percentage || 0);
      setDiscountAmount(freshInvoice.discount_amount || 0);
      // Load outstanding balance flag from invoice (persisted state)
      setAddOutstandingToInvoice(freshInvoice.include_outstanding_balance || false);
      setPaymentMethod('cash');
      setNotes('');
      // Reset partial payment state when opening invoice
      setIsPartialPayment(false);
      setPartialAmount('');
      setHoldReason('');
      setPaymentDueDate('');
      setShowQRCode(false);
      setQrScannedConfirmed(false);
    } catch (error) {
      logger.error('Error loading invoice:', error);
      showError('Failed to load invoice details');
    }

    // Check for outstanding balance and invoice limit
    if (invoice.patient_id) {
      try {
        // Fetch patient's total remaining credit
        try {
          const creditData = await invoiceService.getPatientRemainingCredit(invoice.patient_id);
          setPatientRemainingCredit(creditData?.totalCredit || 0);
        } catch (creditError) {
          logger.error('Failed to fetch patient remaining credit:', creditError);
          setPatientRemainingCredit(0);
        }

        const balanceData = await invoiceService.getPatientOutstandingBalance(invoice.patient_id);

        // Filter out the current invoice from outstanding invoices
        const otherOutstandingInvoices = balanceData.invoices.filter(
          (inv) => inv.id !== invoice.id
        );

        if (otherOutstandingInvoices.length > 0) {
          const otherBalance = otherOutstandingInvoices.reduce(
            (sum, inv) => sum + parseFloat(inv.balance_due || 0),
            0
          );

          setOutstandingBalance({
            ...balanceData,
            totalBalance: otherBalance,
            invoiceCount: otherOutstandingInvoices.length,
            invoices: otherOutstandingInvoices,
          });
          setShowOutstandingAlert(true);

          // Check if limit is reached (2 or more outstanding invoices)
          setInvoiceLimitReached(otherOutstandingInvoices.length >= 2);
        } else {
          setOutstandingBalance(null);
          setShowOutstandingAlert(false);
          setInvoiceLimitReached(false);
        }
      } catch (error) {
        logger.error('Error fetching outstanding balance:', error);
        setOutstandingBalance(null);
        setInvoiceLimitReached(false);
      }
    }
  };

  const handleCloseInvoiceDetail = useCallback(() => {
    setSelectedInvoice(null);
    setShowInvoiceDetail(false);
    setMedications([]);
    setServices([]);
    setOutstandingBalance(null);
    setShowOutstandingAlert(false);
    setAddOutstandingToInvoice(false);
    setInvoiceLimitReached(false);
    setIsEditingService(null);
    setShowAddServiceDialog(false);
    setNewService({ name: '', price: '', description: '' });
    // Reset payment-related state
    setPaymentMethod('cash');
    setShowQRCode(false);
    setQrScannedConfirmed(false);
    setIsPartialPayment(false);
    setPartialAmount('');
    setHoldReason('');
    setPaymentDueDate('');
    setNotes('');
    setDiscountPercent(0);
    setDiscountAmount(0);
  }, []);

  const handleMedicationAction = useCallback((medicationId, action) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === medicationId ? { ...med, action } : med))
    );
  }, []);

  const handleQuantityChange = useCallback((medicationId, quantity) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === medicationId
          ? { ...med, dispensedQuantity: Math.max(0, Math.min(quantity, med.quantity)) }
          : med
      )
    );
  }, []);

  const handlePriceChange = useCallback((medicationId, price) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === medicationId ? { ...med, price: Math.max(0, parseFloat(price) || 0) } : med
      )
    );
  }, []);

  // Service management handlers
  const handleServicePriceChange = useCallback((serviceId, price) => {
    setServices((prev) =>
      prev.map((serv) =>
        serv.id === serviceId ? { ...serv, price: Math.max(0, parseFloat(price) || 0) } : serv
      )
    );
  }, []);

  const handleServiceNameChange = useCallback((serviceId, name) => {
    setServices((prev) => prev.map((serv) => (serv.id === serviceId ? { ...serv, name } : serv)));
  }, []);

  const handleServiceDescriptionChange = useCallback((serviceId, description) => {
    setServices((prev) =>
      prev.map((serv) => (serv.id === serviceId ? { ...serv, description } : serv))
    );
  }, []);

  const handleRemoveService = async (serviceId) => {
    if (!selectedInvoice) {
      return;
    }

    try {
      setIsProcessing(true);
      const version = selectedInvoice.version || null;
      await invoiceService.removeInvoiceItem(selectedInvoice.id, serviceId, version);

      // Remove from local state
      setServices((prev) => prev.filter((serv) => serv.id !== serviceId));

      // Update selected invoice (refresh to get new version)
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);

      // Refresh pending invoices list to update the "No Services" badge
      await refetchPending();
    } catch (error) {
      logger.error('Error removing service:', error);
      if (error.response?.data?.code === 'VERSION_MISMATCH' || error.code === 'VERSION_MISMATCH') {
        showError(
          'Invoice was modified by another user. Please refresh and try again.',
          'Version Conflict'
        );
        // Refresh invoice
        const freshInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
        setSelectedInvoice(freshInvoice);
      } else {
        showError('Failed to remove service');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedInvoice || !newService.name || !newService.price) {
      showError('Service name and price are required');
      return;
    }

    try {
      setIsProcessing(true);
      const version = selectedInvoice.version || null;
      await invoiceService.addServiceItem(
        selectedInvoice.id,
        {
          service_name: newService.name,
          unit_price: parseFloat(newService.price),
          quantity: 1,
          notes: newService.description,
        },
        version
      );

      // Reload invoice to get updated items and new version
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);

      // Refresh pending invoices list to update the "No Services" badge
      await refetchPending();

      // Refresh pending invoices list to update the "No Services" badge
      await refetchPending();

      // Reset form
      setNewService({ name: '', price: '', description: '' });
      setShowAddServiceDialog(false);
    } catch (error) {
      logger.error('Error adding service:', error);
      if (error.response?.data?.code === 'VERSION_MISMATCH' || error.code === 'VERSION_MISMATCH') {
        showError(
          'Invoice was modified by another user. Please refresh and try again.',
          'Version Conflict'
        );
        // Refresh invoice
        const freshInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
        setSelectedInvoice(freshInvoice);
      } else {
        showError('Failed to add service');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateService = async (serviceId) => {
    if (!selectedInvoice) {
      return;
    }

    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      return;
    }

    try {
      setIsProcessing(true);
      const version = selectedInvoice.version || null;
      await invoiceService.updateInvoiceItem(
        selectedInvoice.id,
        serviceId,
        {
          item_name: service.name,
          unit_price: service.price,
          quantity: 1,
          total_price: service.price,
          notes: service.description,
        },
        version
      );

      setIsEditingService(null);

      // Reload invoice (refresh to get new version)
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);

      // Refresh pending invoices list to update the "No Services" badge
      await refetchPending();
    } catch (error) {
      logger.error('Error updating service:', error);
      if (error.response?.data?.code === 'VERSION_MISMATCH' || error.code === 'VERSION_MISMATCH') {
        showError(
          'Invoice was modified by another user. Please refresh and try again.',
          'Version Conflict'
        );
        // Refresh invoice
        const freshInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
        setSelectedInvoice(freshInvoice);
        setIsEditingService(null);
      } else {
        showError('Failed to update service');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoized totals calculation - only recalculates when dependencies change
  const totals = useMemo(() => {
    if (!selectedInvoice) {
      return {
        servicesTotal: 0,
        medicationsTotal: 0,
        outstandingBalance: 0,
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      };
    }

    // Calculate services total from state array (for real-time updates during editing)
    const servicesTotal = services.reduce(
      (sum, service) => sum + parseFloat(service.price || 0),
      0
    );

    // Only include dispensed medications in total
    const medicationsTotal = medications
      .filter((med) => med.action === 'dispense' && med.dispensedQuantity > 0)
      .reduce((sum, med) => {
        // Calculate based on dispensed quantity
        const unitPrice = med.price / med.quantity; // Price per unit
        const itemTotal = unitPrice * med.dispensedQuantity;
        return sum + itemTotal;
      }, 0);

    // Add outstanding balance if checkbox is checked
    const outstandingBalanceAmount =
      addOutstandingToInvoice && outstandingBalance ? outstandingBalance.totalBalance : 0;

    const subtotal = servicesTotal + medicationsTotal + outstandingBalanceAmount;
    const discountAmountCalc =
      discountPercent > 0 ? (subtotal * discountPercent) / 100 : discountAmount;
    const total = subtotal - discountAmountCalc;

    return {
      servicesTotal,
      medicationsTotal,
      outstandingBalance: outstandingBalanceAmount,
      subtotal,
      discountAmount: discountAmountCalc,
      total: Math.max(0, total),
    };
  }, [
    selectedInvoice,
    services,
    medications,
    discountPercent,
    discountAmount,
    outstandingBalance,
    addOutstandingToInvoice,
  ]);

  const handleDiscountPercentChange = useCallback((percent) => {
    setDiscountPercent(percent);
    setDiscountAmount(0);
  }, []);

  const handleDiscountAmountChange = useCallback((amount) => {
    setDiscountAmount(amount);
    setDiscountPercent(0);
  }, []);

  const handleApplyDiscount = useCallback(async () => {
    if (!selectedInvoice) {
      return;
    }

    // Check if outstanding balance is selected - discount should account for it
    const outstandingBalanceAmount =
      addOutstandingToInvoice && outstandingBalance ? outstandingBalance.totalBalance : 0;

    // Calculate discount values
    const discountPercentage = discountPercent > 0 ? discountPercent : 0;
    const discountAmountValue = discountPercent > 0 ? 0 : discountAmount;

    // If no discount is set, clear it
    if (discountPercentage === 0 && discountAmountValue === 0) {
      try {
        setIsProcessing(true);
        const version = selectedInvoice.version || null;
        await invoiceService.updateDiscount(selectedInvoice.id, 0, 0, version);

        // Refresh invoice to get new version
        const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
        setSelectedInvoice(refreshedInvoice);
        // Clear discount fields
        setDiscountPercent(0);
        setDiscountAmount(0);
        showSuccess('Discount cleared');
      } catch (error) {
        logger.error('Error clearing discount:', error);
        if (
          error.response?.data?.code === 'VERSION_MISMATCH' ||
          error.code === 'VERSION_MISMATCH'
        ) {
          showError(
            'Invoice was modified by another user. Please refresh and try again.',
            'Version Conflict'
          );
          // Refresh invoice
          const freshInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
          setSelectedInvoice(freshInvoice);
          setDiscountPercent(freshInvoice.discount_percentage || 0);
          setDiscountAmount(freshInvoice.discount_amount || 0);
        } else {
          showError('Failed to clear discount');
        }
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      setIsProcessing(true);
      const version = selectedInvoice.version || null;

      await invoiceService.updateDiscount(
        selectedInvoice.id,
        discountAmountValue,
        discountPercentage,
        version
      );

      // Refresh invoice to get new version after discount update
      const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(refreshedInvoice);
      // Update discount fields to match what's saved
      setDiscountPercent(refreshedInvoice.discount_percentage || 0);
      setDiscountAmount(refreshedInvoice.discount_amount || 0);

      // Show success message with outstanding balance info if applicable
      let successMsg = 'Discount applied successfully';
      if (outstandingBalanceAmount > 0) {
        successMsg += `. Discount calculated on subtotal including outstanding balance of ${formatCurrencySync(outstandingBalanceAmount)}`;
      }
      showSuccess(successMsg);
    } catch (error) {
      logger.error('Error applying discount:', error);
      if (error.response?.data?.code === 'VERSION_MISMATCH' || error.code === 'VERSION_MISMATCH') {
        showError(
          'Invoice was modified by another user (discount may have been changed). The invoice has been refreshed with the latest changes.',
          'Version Conflict'
        );
        // Refresh invoice to get latest version and actual discount values
        if (selectedInvoice?.id) {
          try {
            const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
            setSelectedInvoice(refreshedInvoice);
            // Update discount fields to match what's in the database
            setDiscountPercent(refreshedInvoice.discount_percentage || 0);
            setDiscountAmount(refreshedInvoice.discount_amount || 0);
          } catch (refreshError) {
            logger.error('Error refreshing invoice:', refreshError);
            showError('Failed to refresh invoice. Please close and reopen the invoice.');
          }
        }
      } else {
        showError('Failed to apply discount: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedInvoice,
    discountPercent,
    discountAmount,
    totals,
    outstandingBalance,
    addOutstandingToInvoice,
    showError,
    showSuccess,
  ]);

  const handleApproveInvoice = useCallback(async () => {
    // If partial payment is selected, check the 2-invoice limit
    if (isPartialPayment && partialAmount && parseFloat(partialAmount) < totals.total) {
      try {
        // Check if patient can have more outstanding invoices
        const limitCheck = await invoiceService.canPatientCreateInvoice(selectedInvoice.patient_id);

        if (!limitCheck.canCreate) {
          showError(
            `Cannot process partial payment: ${limitCheck.message}. Patient must pay outstanding invoices first.`
          );
          return;
        }
      } catch (error) {
        logger.error('Error checking invoice limit:', error);
        showError('Failed to verify patient invoice limit');
        return;
      }
    }

    setShowPaymentDialog(true);
  }, [isPartialPayment, partialAmount, totals.total, selectedInvoice, showError]);

  const handleLoadPrescriptions = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      setIsProcessing(true);

      // Add prescriptions to invoice (this will add new ones, not duplicate existing)
      await invoiceService.addPrescriptionsToInvoice(selectedInvoice.id, selectedInvoice.visit_id);

      // Reload the invoice to get updated items
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);

      // Extract medications from updated invoice
      const meds = (updatedInvoice.invoice_items || [])
        .filter((item) => item.item_type === 'medicine')
        .map((item) => ({
          id: item.id,
          name: item.item_name,
          quantity: item.quantity || 1,
          price: parseFloat(item.unit_price || 0),
          status: updatedInvoice.status,
          dosage: item.notes || '',
          instructions: item.notes || '',
          inStock: 100, // Mock value - would come from inventory system
          dispensedQuantity: 0,
          action: 'pending', // pending, dispense, write-out
        }));
      setMedications(meds);

      // Reload the invoice list
      await refetchPending();
    } catch (error) {
      logger.error('Error loading prescriptions:', error);
      showError('Failed to load prescriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  // Browser refresh handling for payment processing
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingPayment = sessionStorage.getItem('pendingPayment');
      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment);
          const { invoiceId, timestamp } = paymentData;

          // Check if payment is still pending (within last 5 minutes)
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (timestamp > fiveMinutesAgo) {
            // Verify payment status from server
            try {
              const invoice = await invoiceService.getInvoiceById(invoiceId);
              if (invoice && invoice.status === 'paid') {
                // Payment was successful, clear pending state
                sessionStorage.removeItem('pendingPayment');
                showSuccess('Payment was completed successfully before page refresh.');
                await refetchPending();
                await refetchCompleted();
              } else {
                // Payment might have failed, show warning
                showError(
                  'Payment processing was interrupted. Please verify payment status and retry if needed.'
                );
                sessionStorage.removeItem('pendingPayment');
              }
            } catch (error) {
              logger.error('Error checking pending payment status:', error);
              // Check if invoice was not found (might have been deleted or completed)
              if (error.response?.status === 404) {
                showError(
                  'Invoice not found. It may have been completed or deleted by another user.',
                  'Invoice Not Found'
                );
                sessionStorage.removeItem('pendingPayment');
              } else {
                // Keep pending state, user can manually check
                showError(
                  'Unable to verify payment status. Please check the invoice manually.',
                  'Verification Failed'
                );
              }
            }
          } else {
            // Too old, clear it
            sessionStorage.removeItem('pendingPayment');
          }
        } catch (error) {
          logger.error('Error parsing pending payment data:', error);
          sessionStorage.removeItem('pendingPayment');
        }
      }
    };

    checkPendingPayment();
  }, []);

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Save payment state to sessionStorage for browser refresh recovery
    // (only if we successfully start processing, not if version mismatch occurs immediately)
    const paymentState = {
      invoiceId: selectedInvoice?.id,
      timestamp: Date.now(),
      amount: isPartialPayment ? partialAmount : totals.total,
      paymentMethod,
    };

    try {
      // Use memoized totals

      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Get current invoice version for optimistic locking
      // CRITICAL: Store the original version from when payment process started
      // This is the version we'll check against to detect if another user modified the invoice
      const originalVersion = selectedInvoice?.version || null;
      let currentVersion = originalVersion;

      // Step 1: Update medication items in the invoice
      for (const med of medications) {
        if (med.action === 'dispense' && med.dispensedQuantity > 0) {
          const unitPrice = med.price / med.quantity;

          // Update the invoice item with quantity and price (with version)
          await invoiceService.updateInvoiceItem(
            selectedInvoice.id,
            med.id,
            {
              quantity: med.dispensedQuantity,
              unit_price: unitPrice,
              total_price: unitPrice * med.dispensedQuantity,
            },
            currentVersion
          );

          // Refresh invoice to get new version after update
          const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
          currentVersion = refreshedInvoice?.version || null;
          setSelectedInvoice(refreshedInvoice);

          // If partially dispensed, add a write-out item for remaining quantity
          if (med.dispensedQuantity < med.quantity) {
            await invoiceService.addMedicineItem(
              selectedInvoice.id,
              {
                medicine_name: `${med.name} (Write-out)`,
                quantity: med.quantity - med.dispensedQuantity,
                unit_price: 0,
                notes: `Written prescription - ${med.quantity - med.dispensedQuantity} units not dispensed`,
              },
              currentVersion
            );

            // Refresh invoice again
            const refreshedInvoice2 = await invoiceService.getInvoiceById(selectedInvoice.id);
            currentVersion = refreshedInvoice2?.version || null;
            setSelectedInvoice(refreshedInvoice2);
          }
        } else if (med.action === 'write-out') {
          // Update item to write-out with $0 (with version)
          await invoiceService.updateInvoiceItem(
            selectedInvoice.id,
            med.id,
            {
              quantity: med.quantity,
              unit_price: 0,
              total_price: 0,
              notes: 'Written out - not dispensed',
            },
            currentVersion
          );

          // Refresh invoice to get new version
          const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
          currentVersion = refreshedInvoice?.version || null;
          setSelectedInvoice(refreshedInvoice);
        }
      }

      // Note: Discount should already be applied via handleApplyDiscount button
      // CRITICAL: Final version check before any payment operations
      // Refresh invoice to get latest version and verify it hasn't changed
      const refreshedInvoiceBeforePayment = await invoiceService.getInvoiceById(selectedInvoice.id);
      const latestVersion = refreshedInvoiceBeforePayment?.version || null;

      // CRITICAL: Check against ORIGINAL version to detect if another user modified invoice before we started
      // This catches cases where another user edited a service/item before we started processing payment
      if (originalVersion !== null && latestVersion !== null && latestVersion !== originalVersion) {
        const error = new Error(
          `Invoice was modified by another user (service/item may have been edited). Current version: ${latestVersion}, Expected: ${originalVersion}. Please refresh the invoice and try again.`
        );
        error.code = 'VERSION_MISMATCH';
        error.currentVersion = latestVersion;
        error.expectedVersion = originalVersion;
        throw error;
      }

      // Also check if version changed during our medication updates
      if (currentVersion !== null && latestVersion !== null && latestVersion !== currentVersion) {
        const error = new Error(
          `Invoice was modified by another user during processing. Current version: ${latestVersion}, Expected: ${currentVersion}. Please refresh and try again.`
        );
        error.code = 'VERSION_MISMATCH';
        error.currentVersion = latestVersion;
        error.expectedVersion = currentVersion;
        throw error;
      }

      // Update to latest version for subsequent operations
      currentVersion = latestVersion;
      setSelectedInvoice(refreshedInvoiceBeforePayment);

      // CRITICAL: Check if outstanding balance flag in invoice matches local state
      // This ensures version consistency - if another user changed the flag, we detect it
      const invoiceOutstandingFlag =
        refreshedInvoiceBeforePayment.include_outstanding_balance || false;
      if (addOutstandingToInvoice !== invoiceOutstandingFlag) {
        const error = new Error(
          `Outstanding balance flag was changed by another user. Please refresh and try again.`
        );
        error.code = 'VERSION_MISMATCH';
        error.currentVersion = latestVersion;
        error.expectedVersion = currentVersion;
        throw error;
      }

      // CRITICAL: If outstanding balance is selected, verify outstanding invoices haven't been paid/modified
      if (
        addOutstandingToInvoice &&
        outstandingBalance &&
        outstandingBalance.invoices?.length > 0
      ) {
        try {
          // Refresh outstanding balance to check if any invoices were paid or modified
          const freshBalanceData = await invoiceService.getPatientOutstandingBalance(
            selectedInvoice.patient_id
          );
          const otherOutstandingInvoices = freshBalanceData.invoices.filter(
            (inv) => inv.id !== selectedInvoice.id
          );

          // Check each outstanding invoice
          for (const oldInvoice of outstandingBalance.invoices) {
            const freshInvoice = otherOutstandingInvoices.find((inv) => inv.id === oldInvoice.id);

            if (!freshInvoice) {
              // Invoice was paid or deleted by another user
              const error = new Error(
                `Outstanding invoice ${oldInvoice.invoice_number || oldInvoice.id} has been paid or modified by another user. Please refresh the invoice and try again.`
              );
              error.code = 'OUTSTANDING_INVOICE_PAID';
              throw error;
            }

            // Check version mismatch
            if (freshInvoice.version !== oldInvoice.version) {
              const error = new Error(
                `Outstanding invoice ${freshInvoice.invoice_number || freshInvoice.id} was modified by another user. Please refresh and try again.`
              );
              error.code = 'OUTSTANDING_INVOICE_VERSION_MISMATCH';
              throw error;
            }

            // Check if balance due changed (invoice was partially paid)
            if (
              parseFloat(freshInvoice.balance_due || 0) !== parseFloat(oldInvoice.balance_due || 0)
            ) {
              const error = new Error(
                `Outstanding invoice ${freshInvoice.invoice_number || freshInvoice.id} balance has changed (may have been partially paid). Please refresh and try again.`
              );
              error.code = 'OUTSTANDING_INVOICE_BALANCE_CHANGED';
              throw error;
            }

            // Check if invoice status changed to paid
            if (freshInvoice.status === 'paid' && oldInvoice.status !== 'paid') {
              const error = new Error(
                `Outstanding invoice ${freshInvoice.invoice_number || freshInvoice.id} has been paid by another user. Please refresh and try again.`
              );
              error.code = 'OUTSTANDING_INVOICE_PAID';
              throw error;
            }
          }

          // Update outstanding balance with fresh data if all checks passed
          const updatedBalance = otherOutstandingInvoices.reduce(
            (sum, inv) => sum + parseFloat(inv.balance_due || 0),
            0
          );
          setOutstandingBalance({
            ...freshBalanceData,
            totalBalance: updatedBalance,
            invoiceCount: otherOutstandingInvoices.length,
            invoices: otherOutstandingInvoices,
          });
        } catch (error) {
          // Re-throw if it's our custom error
          if (
            error.code === 'OUTSTANDING_INVOICE_PAID' ||
            error.code === 'OUTSTANDING_INVOICE_VERSION_MISMATCH' ||
            error.code === 'OUTSTANDING_INVOICE_BALANCE_CHANGED'
          ) {
            throw error;
          }
          logger.error('Error checking outstanding balance versions:', error);
          throw new Error('Failed to verify outstanding balance. Please refresh and try again.');
        }
      }

      // Save payment state AFTER we've verified the invoice version is current
      // This prevents showing generic error on refresh if version mismatch occurs
      sessionStorage.setItem('pendingPayment', JSON.stringify(paymentState));

      // Step 2: If outstanding balance is added, pay off those invoices first
      if (addOutstandingToInvoice && outstandingBalance && outstandingBalance.totalBalance > 0) {
        // Pay off outstanding invoices in order (oldest first)
        for (const oldInvoice of outstandingBalance.invoices) {
          const balanceDue = parseFloat(oldInvoice.balance_due);

          // Skip if balance is 0 or negative
          if (balanceDue <= 0) {
            continue;
          }

          try {
            // Record payment for old invoice (with version)
            await invoiceService.recordPartialPayment(
              oldInvoice.id,
              {
                amount: balanceDue,
                payment_method: paymentMethod,
                notes: `Paid with current visit invoice #${selectedInvoice.invoice_number || selectedInvoice.id}`,
                processed_by: currentUser?.id,
              },
              oldInvoice.version
            );
          } catch (outstandingError) {
            // Re-throw with context about which invoice failed
            if (
              outstandingError.response?.data?.code === 'VERSION_MISMATCH' ||
              outstandingError.code === 'VERSION_MISMATCH'
            ) {
              const error = new Error(
                `Outstanding invoice ${oldInvoice.invoice_number || oldInvoice.id} was modified by another user. ` +
                  `Please refresh the invoice and try again.`
              );
              error.code = 'OUTSTANDING_INVOICE_VERSION_MISMATCH';
              throw error;
            }
            if (outstandingError.message?.includes('already fully paid')) {
              // This is fine - invoice was already paid, continue
              continue;
            }
            // Re-throw other errors
            throw outstandingError;
          }
        }
      }

      // Step 3: Record payment for current invoice (full or partial)
      // Skip payment recording if invoice total is $0 (outstanding balance is already handled in Step 2)
      if (totals.total === 0) {
        // For $0 invoices, just complete the invoice without recording payment
        // Outstanding balance payments were already processed in Step 2
        await invoiceService.completeInvoice(selectedInvoice.id, currentUser?.id, currentVersion);

        let successMsg = `Visit completed successfully (no charge). Invoice ${selectedInvoice.invoice_number || selectedInvoice.id} has been marked as paid.`;
        if (addOutstandingToInvoice && outstandingBalance) {
          successMsg += ` Also paid off ${outstandingBalance.invoiceCount} previous invoice(s) totaling ${formatCurrencySync(outstandingBalance.totalBalance)}.`;
        }
        showSuccess(successMsg);
      } else if (isPartialPayment && partialAmount && parseFloat(partialAmount) < totals.total) {
        // Process partial payment for non-zero invoices
        const paymentAmount = parseFloat(partialAmount);
        await invoiceService.recordPartialPayment(
          selectedInvoice.id,
          {
            amount: paymentAmount,
            payment_method: paymentMethod,
            notes: notes || 'Partial payment processed',
            hold_reason: holdReason,
            payment_due_date: paymentDueDate || null,
          },
          currentVersion
        );

        const balanceDue = totals.total - paymentAmount;

        let successMsg = `Partial payment of ${formatCurrencySync(paymentAmount)} recorded. Balance due: ${formatCurrencySync(balanceDue)}`;
        if (addOutstandingToInvoice && outstandingBalance) {
          successMsg += ` (including ${formatCurrencySync(outstandingBalance.totalBalance)} from previous invoices)`;
        }
        showSuccess(successMsg);
      } else {
        // Process full payment for non-zero invoices
        // NOTE: recordPayment already calls completeInvoice internally when invoice is fully paid
        // So we don't need to call completeInvoice again - it's redundant

        // CRITICAL: Final version check before payment - refresh invoice to get absolute latest version
        // This ensures we detect if another user edited services/items while we were processing
        const finalInvoiceCheck = await invoiceService.getInvoiceById(selectedInvoice.id);
        const finalVersion = finalInvoiceCheck?.version || null;

        // Check against the ORIGINAL version from when payment process started
        // This detects if another user modified the invoice (e.g., edited a service) before we started processing
        if (originalVersion !== null && finalVersion !== null && finalVersion !== originalVersion) {
          const error = new Error(
            `Invoice was modified by another user (service/item may have been edited). Current version: ${finalVersion}, Expected: ${originalVersion}. Please refresh the invoice and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = finalVersion;
          error.expectedVersion = originalVersion;
          throw error;
        }

        // Also check if version changed during our processing (medication updates, etc.)
        if (currentVersion !== null && finalVersion !== null && finalVersion !== currentVersion) {
          const error = new Error(
            `Invoice was modified by another user during processing. Current version: ${finalVersion}, Expected: ${currentVersion}. Please refresh and try again.`
          );
          error.code = 'VERSION_MISMATCH';
          error.currentVersion = finalVersion;
          error.expectedVersion = currentVersion;
          throw error;
        }

        // Use the final version for payment
        const paymentVersion = finalVersion || currentVersion;

        try {
          await invoiceService.recordPayment(
            selectedInvoice.id,
            {
              payment_method: paymentMethod,
              amount_paid: totals.total,
              notes: notes || 'Payment processed',
            },
            paymentVersion
          );

          // Refresh invoice after payment to verify it's completed and visit is completed
          const refreshedAfterPayment = await invoiceService.getInvoiceById(selectedInvoice.id);
          setSelectedInvoice(refreshedAfterPayment);

          // Verify invoice is paid (recordPayment should have completed it)
          if (refreshedAfterPayment?.status !== 'paid') {
            // If invoice is not paid, complete it manually (shouldn't happen, but safety check)
            await invoiceService.completeInvoice(
              selectedInvoice.id,
              currentUser?.id,
              refreshedAfterPayment?.version
            );
            // Refresh again after manual completion
            const finalInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
            setSelectedInvoice(finalInvoice);
          }
          // If invoice is already paid, recordPayment should have completed the visit automatically
        } catch (paymentError) {
          // If recordPayment fails with version mismatch, re-throw to be caught by outer catch
          if (
            paymentError.response?.data?.code === 'VERSION_MISMATCH' ||
            paymentError.code === 'VERSION_MISMATCH'
          ) {
            throw paymentError; // Re-throw to be handled by outer catch block
          }
          throw paymentError; // Re-throw other errors
        }

        let successMsg = `Invoice ${selectedInvoice.invoice_number || selectedInvoice.id} completed successfully! Visit has been marked as completed.`;
        if (addOutstandingToInvoice && outstandingBalance) {
          successMsg += ` Also paid off ${outstandingBalance.invoiceCount} previous invoice(s) totaling ${formatCurrencySync(outstandingBalance.totalBalance)}.`;
        }
        showSuccess(successMsg);
      }

      setShowPaymentDialog(false);
      handleCloseInvoiceDetail();

      // Reload pending invoices
      await refetchPending();

      // Reload completed invoices (invoice history) - always refresh when invoice is completed
      await refetchCompleted();
      // Update invoice history if currently viewing history tab
      // Use setTimeout to ensure refetchCompleted has updated completedInvoicesData
      if (activeTab === 'history') {
        setTimeout(async () => {
          await loadInvoiceHistory(true);
        }, 100);
      }

      // Clear pending payment state on success
      sessionStorage.removeItem('pendingPayment');

      // Reset partial payment state
      setIsPartialPayment(false);
      setPartialAmount('');
      setHoldReason('');
      setPaymentDueDate('');
    } catch (error) {
      logger.error('Payment processing error:', error);

      // Close payment dialog on any error
      setShowPaymentDialog(false);

      // Clear pending payment state if version mismatch or outstanding invoice issues (prevents generic error on refresh)
      if (
        error.response?.data?.code === 'VERSION_MISMATCH' ||
        error.code === 'VERSION_MISMATCH' ||
        error.response?.data?.code === 'OUTSTANDING_INVOICE_PAID' ||
        error.code === 'OUTSTANDING_INVOICE_PAID' ||
        error.response?.data?.code === 'OUTSTANDING_INVOICE_VERSION_MISMATCH' ||
        error.code === 'OUTSTANDING_INVOICE_VERSION_MISMATCH' ||
        error.response?.data?.code === 'OUTSTANDING_INVOICE_BALANCE_CHANGED' ||
        error.code === 'OUTSTANDING_INVOICE_BALANCE_CHANGED'
      ) {
        sessionStorage.removeItem('pendingPayment');
      }

      // Handle outstanding invoice errors
      if (
        error.response?.data?.code === 'OUTSTANDING_INVOICE_PAID' ||
        error.code === 'OUTSTANDING_INVOICE_PAID' ||
        error.response?.data?.code === 'OUTSTANDING_INVOICE_VERSION_MISMATCH' ||
        error.code === 'OUTSTANDING_INVOICE_VERSION_MISMATCH' ||
        error.response?.data?.code === 'OUTSTANDING_INVOICE_BALANCE_CHANGED' ||
        error.code === 'OUTSTANDING_INVOICE_BALANCE_CHANGED'
      ) {
        showError(
          error.message ||
            'One or more outstanding invoices have been paid or modified by another user. Please refresh the invoice and try again.',
          'Outstanding Balance Changed'
        );
        // Refresh outstanding balance
        if (selectedInvoice?.patient_id) {
          try {
            const updatedBalanceData = await invoiceService.getPatientOutstandingBalance(
              selectedInvoice.patient_id
            );
            const updatedOtherInvoices = updatedBalanceData.invoices.filter(
              (inv) => inv.id !== selectedInvoice.id
            );
            const updatedBalance = updatedOtherInvoices.reduce(
              (sum, inv) => sum + parseFloat(inv.balance_due || 0),
              0
            );
            setOutstandingBalance({
              ...updatedBalanceData,
              totalBalance: updatedBalance,
              invoiceCount: updatedOtherInvoices.length,
              invoices: updatedOtherInvoices,
            });
            // Update outstanding balance flag if no invoices remain (user can still manually uncheck)
            // Note: Flag is persisted in database, so we don't auto-uncheck it
          } catch (refreshError) {
            logger.error('Error refreshing outstanding balance:', refreshError);
          }
        }
        setIsProcessing(false);
        return;
      }

      // Handle "already fully paid" error - refresh invoice and show info message
      if (
        error.message?.includes('already fully paid') ||
        error.response?.data?.message?.includes('already fully paid')
      ) {
        // Invoice was paid by another user - refresh and show success message
        if (selectedInvoice?.id) {
          try {
            const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
            setSelectedInvoice(refreshedInvoice);

            // If invoice is now paid, show success and close detail
            if (refreshedInvoice.status === 'paid') {
              showSuccess(
                `Invoice ${refreshedInvoice.invoice_number || refreshedInvoice.id} has already been paid by another user.`
              );
              handleCloseInvoiceDetail();
              await refetchPending();
              await refetchCompleted();
              setIsProcessing(false);
              return;
            }
          } catch (refreshError) {
            logger.error('Error refreshing invoice after "already paid" error:', refreshError);
          }
        }
        showError(
          'This invoice has already been fully paid by another user. The invoice has been refreshed.',
          'Invoice Already Paid'
        );
        setIsProcessing(false);
        return;
      }

      // Handle version mismatch errors
      if (error.response?.data?.code === 'VERSION_MISMATCH' || error.code === 'VERSION_MISMATCH') {
        showError(
          'Invoice was modified by another user (may have been paid or discount changed). The invoice has been refreshed with the latest changes. Please try processing payment again.',
          'Version Conflict'
        );
        // Refresh invoice to get latest version and actual values
        if (selectedInvoice?.id) {
          try {
            const refreshedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
            setSelectedInvoice(refreshedInvoice);
            // Update discount fields to match what's in the database
            setDiscountPercent(refreshedInvoice.discount_percentage || 0);
            setDiscountAmount(refreshedInvoice.discount_amount || 0);

            // Check if invoice was already paid by another user
            if (refreshedInvoice.status === 'paid' || refreshedInvoice.status === 'partial_paid') {
              const statusText =
                refreshedInvoice.status === 'paid' ? 'fully paid' : 'partially paid';
              showError(
                `This invoice has already been ${statusText} by another user. The visit should be completed automatically. The invoice will be closed.`,
                'Invoice Already Paid'
              );
              // Close invoice detail after a delay
              setTimeout(() => {
                handleCloseInvoiceDetail();
                refetchPending();
                refetchCompleted();
              }, 2000);
            }
            // DON'T close invoice detail if not paid - let user retry with updated version
          } catch (refreshError) {
            logger.error('Error refreshing invoice:', refreshError);
            // Check if invoice was deleted or not found
            if (refreshError.response?.status === 404) {
              showError(
                'Invoice not found. It may have been deleted or completed by another user.'
              );
              handleCloseInvoiceDetail();
            } else {
              showError('Failed to refresh invoice. Please close and reopen the invoice.');
            }
          }
        }
      } else {
        showError('Failed to process payment: ' + (error.response?.data?.message || error.message));
        // Keep pending payment state on other errors so user can retry
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const _getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Skeleton loader component (reserved for future use)
  const _SkeletonCard = () => (
    <Card className="border-l-4 border-l-gray-200">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      <PageLayout
        title="Cashier Dashboard"
        subtitle="Manage pending invoices and process payments"
        fullWidth
      >
        <div className="space-y-6 p-4 md:p-6">
          {/* Success and error messages now handled by Toast system (top-right corner) */}

          {/* Statistics Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              {
                label: 'Pending',
                value: stats?.pendingInvoices || 0,
                color: 'yellow',
                icon: Clock,
              },
              {
                label: 'Today Completed',
                value: stats?.todayCompleted || 0,
                color: 'green',
                icon: CheckCircle,
              },
              {
                label: 'Today Revenue',
                value: formatCurrencySync(stats?.todayRevenue || 0),
                color: 'blue',
                icon: DollarSign,
              },
              {
                label: 'Total Invoices',
                value: stats?.totalInvoices || 0,
                color: 'gray',
                icon: Receipt,
              },
            ].map((stat, _index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6 flex items-center justify-between">
              <TabsList className="grid w-auto grid-cols-3">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Invoices ({stats.pendingInvoices})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Invoice History
                </TabsTrigger>
                <TabsTrigger value="dispenses" className="gap-2">
                  <Package className="h-4 w-4" />
                  Dispense History
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Pending Invoices Tab */}
            <TabsContent value="pending" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search invoices by patient name, invoice ID, or doctor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                        <Button onClick={clearSearch} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Table */}
              <Card>
                <CardContent className="p-0">
                  {isPendingLoading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <p className="mt-2 text-muted-foreground">Loading invoices...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center">
                      <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-2 text-lg text-muted-foreground">No invoices found</p>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria'
                          : 'No pending invoices at the moment'}
                      </p>
                      {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                        <Button onClick={clearFilters} variant="outline" className="gap-2">
                          <X className="h-4 w-4" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Invoice #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Patient
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Visit Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Items
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Total
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <AnimatePresence>
                            {filteredInvoices.map((invoice, index) => (
                              <motion.tr
                                key={invoice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.03 }}
                                className="hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <td className="px-4 py-3 text-sm font-medium">
                                  {invoice.invoice_number || invoice.id}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">
                                        {invoice.patient?.first_name} {invoice.patient?.last_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {invoice.patient?.phone}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {invoice.visit?.visit_type || 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(invoice.created_at).toLocaleTimeString()}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="space-y-1">
                                    <div>
                                      {invoice.invoice_items?.filter(
                                        (i) => i.item_type === 'service'
                                      ).length || 0}{' '}
                                      services
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {invoice.invoice_items?.filter(
                                        (i) => i.item_type === 'medicine'
                                      ).length || 0}{' '}
                                      medications
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                  <div className="flex items-center gap-2">
                                    {formatCurrencySync(parseFloat(invoice.total_amount || 0))}
                                    {parseFloat(invoice.total_amount || 0) === 0 && (
                                      <Badge
                                        variant="outline"
                                        className="border-amber-300 bg-amber-50 text-xs text-amber-800"
                                      >
                                        No Services
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={getStatusColor(invoice.status)}>
                                    {invoice.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      try {
                                        handleViewInvoice(invoice);
                                      } catch (error) {
                                        logger.error('Error opening invoice detail:', error);
                                        showError('Failed to open invoice details');
                                      }
                                    }}
                                    size="sm"
                                    className="gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Process
                                  </Button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoice History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Invoice History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading invoice history...</p>
                      </div>
                    </div>
                  ) : historyError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center text-destructive">
                        <p>{historyError}</p>
                        <Button
                          onClick={loadInvoiceHistory}
                          variant="outline"
                          size="sm"
                          className="mt-4"
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : invoiceHistory.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No completed invoices found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoiceHistory.map((invoice) => (
                        <InvoiceHistoryItem
                          key={invoice.id}
                          invoice={invoice}
                          onView={handleViewHistoryInvoice}
                          onDownload={handleDownloadReceipt}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dispense History Tab */}
            <TabsContent value="dispenses" className="space-y-6">
              <DispenseHistoryTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Invoice Detail Modal */}
        <PaymentDetailModal
          open={showInvoiceDetail}
          onOpenChange={(open) => {
            setShowInvoiceDetail(open);
            if (!open) {
              // Reset all state when modal is closed
              handleCloseInvoiceDetail();
            }
          }}
          invoice={selectedInvoice}
          onPay={() => {
            // Open confirmation dialog instead of processing directly
            setShowPaymentDialog(true);
          }}
          isProcessing={isProcessing}
        >
          {selectedInvoice && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Patient Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          Patient Name
                        </Label>
                        <p className="mt-0.5 text-sm font-medium">
                          {selectedInvoice.patient?.first_name} {selectedInvoice.patient?.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          Visit Type
                        </Label>
                        <p className="mt-0.5 text-sm">
                          {selectedInvoice.visit?.visit_type || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          Date & Time
                        </Label>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(selectedInvoice.created_at).toLocaleDateString()} at{' '}
                          {new Date(selectedInvoice.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Contact</Label>
                        <p className="mt-0.5 text-xs">{selectedInvoice.patient?.phone || 'N/A'}</p>
                        <p className="mt-0.5 text-xs">{selectedInvoice.patient?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Outstanding Balance Alert */}
                {outstandingBalance && outstandingBalance.totalBalance > 0 && (
                  <Card
                    className={
                      invoiceLimitReached
                        ? 'border-red-300 bg-red-50'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-800'
                    }
                  >
                    <CardHeader>
                      <CardTitle
                        className={`flex items-center gap-2 ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900 dark:text-amber-200'}`}
                      >
                        <AlertCircle className="h-5 w-5" />
                        {invoiceLimitReached ? '⚠️ Invoice Limit Reached' : 'Outstanding Balance'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p
                            className={`text-sm ${invoiceLimitReached ? 'text-red-800' : 'text-amber-800'}`}
                          >
                            This patient has {outstandingBalance.invoiceCount} unpaid invoice
                            {outstandingBalance.invoiceCount > 1 ? 's' : ''} with a total balance
                            of:
                          </p>
                          <p
                            className={`text-3xl font-bold ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900 dark:text-amber-200'}`}
                          >
                            {formatCurrencySync(outstandingBalance.totalBalance)}
                          </p>

                          {/* 2-Invoice Limit Warning */}
                          {invoiceLimitReached && (
                            <div className="mt-3 rounded-lg border-2 border-red-400 bg-red-100 p-3">
                              <p className="flex items-center gap-2 text-sm font-bold text-red-900">
                                <XCircle className="h-5 w-5" />
                                MAXIMUM OUTSTANDING INVOICES REACHED (2/2)
                              </p>
                              <p className="mt-1 text-xs text-red-800">
                                Patient cannot leave with another unpaid invoice. They must either:
                              </p>
                              <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-red-800">
                                <li>Pay the full amount including previous balance</li>
                                <li>
                                  Pay off at least one previous invoice to reduce outstanding count
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* List of outstanding invoices */}
                          <div className="mt-3 space-y-1">
                            {outstandingBalance.invoices.map((inv) => (
                              <div
                                key={inv.id}
                                className={`flex items-center gap-2 text-xs ${invoiceLimitReached ? 'text-red-700' : 'text-amber-700 dark:text-amber-300'}`}
                              >
                                <Receipt className="h-3 w-3" />
                                Invoice #{inv.invoice_number || inv.id.slice(0, 8)} -{' '}
                                {formatCurrencySync(parseFloat(inv.balance_due))} due
                                {inv.payment_due_date && (
                                  <span
                                    className={
                                      invoiceLimitReached ? 'text-red-600' : 'text-amber-600'
                                    }
                                  >
                                    (Due: {new Date(inv.payment_due_date).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action: Add to current invoice */}
                      <div
                        className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${invoiceLimitReached ? 'border-destructive/50' : 'border-amber-200 dark:border-amber-800'}`}
                      >
                        <input
                          type="checkbox"
                          id="addOutstanding"
                          checked={addOutstandingToInvoice}
                          onChange={async (e) => {
                            const newValue = e.target.checked;
                            setAddOutstandingToInvoice(newValue);
                            // Save to database immediately (with version checking)
                            if (selectedInvoice) {
                              try {
                                await invoiceService.updateOutstandingBalanceFlag(
                                  selectedInvoice.id,
                                  newValue,
                                  selectedInvoice.version
                                );
                                // Refresh invoice to get updated version
                                const refreshedInvoice = await invoiceService.getInvoiceById(
                                  selectedInvoice.id
                                );
                                setSelectedInvoice(refreshedInvoice);
                              } catch (error) {
                                logger.error('Error updating outstanding balance flag:', error);
                                // Revert checkbox state on error
                                setAddOutstandingToInvoice(!newValue);
                                if (
                                  error.response?.data?.code === 'VERSION_MISMATCH' ||
                                  error.code === 'VERSION_MISMATCH'
                                ) {
                                  showError(
                                    'Invoice was modified by another user. The invoice has been refreshed with the latest changes.',
                                    'Version Conflict'
                                  );
                                  // Refresh invoice
                                  if (selectedInvoice?.id) {
                                    try {
                                      const refreshedInvoice = await invoiceService.getInvoiceById(
                                        selectedInvoice.id
                                      );
                                      setSelectedInvoice(refreshedInvoice);
                                      setAddOutstandingToInvoice(
                                        refreshedInvoice.include_outstanding_balance || false
                                      );
                                    } catch (refreshError) {
                                      logger.error('Error refreshing invoice:', refreshError);
                                    }
                                  }
                                } else {
                                  showError(
                                    'Failed to update outstanding balance flag. Please try again.'
                                  );
                                }
                              }
                            }
                          }}
                          className={`h-4 w-4 rounded border focus:ring-2 ${invoiceLimitReached ? 'border-red-400 text-red-600 focus:ring-red-500' : 'border-amber-300 text-amber-600 focus:ring-amber-500'}`}
                        />
                        <label
                          htmlFor="addOutstanding"
                          className={`flex-1 cursor-pointer text-sm font-medium ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900 dark:text-amber-200'}`}
                        >
                          {invoiceLimitReached
                            ? `⚠️ Must add outstanding balance (${formatCurrencySync(outstandingBalance.totalBalance)}) - cannot create another unpaid invoice`
                            : `Add outstanding balance (${formatCurrencySync(outstandingBalance.totalBalance)}) to current invoice`}
                        </label>
                      </div>

                      {addOutstandingToInvoice && !invoiceLimitReached && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            Outstanding balance will be added to the total. Patient can pay full
                            amount or make partial payment.
                          </p>
                        </div>
                      )}

                      {addOutstandingToInvoice && invoiceLimitReached && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            Good! Outstanding balance added. Patient must pay full amount to
                            proceed.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Services and Medications */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Services */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base">Services Provided</CardTitle>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddServiceDialog(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Service
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {services.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                          <p>No services added yet</p>
                          <p className="mt-1 text-sm">
                            Click &quot;Add Service&quot; to add a service
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {services.map((service) => (
                            <div key={service.id} className="space-y-3 rounded-lg bg-green-50 p-3">
                              {isEditingService === service.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Service Name</Label>
                                    <Input
                                      value={service.name}
                                      onChange={(e) =>
                                        handleServiceNameChange(service.id, e.target.value)
                                      }
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Price ({getCurrencySymbol()})</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={service.price}
                                      onChange={(e) =>
                                        handleServicePriceChange(service.id, e.target.value)
                                      }
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Description</Label>
                                    <textarea
                                      value={service.description || ''}
                                      onChange={(e) =>
                                        handleServiceDescriptionChange(service.id, e.target.value)
                                      }
                                      className="w-full resize-none rounded-md border px-3 py-2 text-sm"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleUpdateService(service.id)}
                                      disabled={isProcessing}
                                      className="flex-1"
                                    >
                                      <Save className="mr-1 h-3 w-3" />
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsEditingService(null)}
                                      disabled={isProcessing}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">{service.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {service.description || 'No description'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">
                                        {formatCurrencySync(parseFloat(service.price || 0))}
                                      </p>
                                      <Badge
                                        variant="outline"
                                        className="border-green-200 text-green-800"
                                      >
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Completed
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 border-t pt-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setIsEditingService(service.id)}
                                      disabled={isProcessing}
                                      className="flex-1 text-xs"
                                    >
                                      <Edit2 className="mr-1 h-3 w-3" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        if (
                                          window.confirm(`Remove "${service.name}" from invoice?`)
                                        ) {
                                          handleRemoveService(service.id);
                                        }
                                      }}
                                      disabled={isProcessing}
                                      className="flex-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="mr-1 h-3 w-3" />
                                      Remove
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Medications */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Prescribed Medications</CardTitle>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleLoadPrescriptions}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          <Pill className="h-4 w-4" />
                          {medications.length > 0 ? 'Refresh Prescriptions' : 'Load Prescriptions'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {medications.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <Pill className="mx-auto mb-2 h-12 w-12 opacity-50" />
                          <p>No medications added yet</p>
                          <p className="mt-1 text-sm">
                            Click &quot;Load Prescriptions&quot; to add prescribed medications
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {medications.map((med) => (
                            <div key={med.id} className="space-y-3 rounded-lg border p-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h5 className="font-medium">{med.name}</h5>
                                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Quantity: {med.quantity}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    med.action === 'dispense'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : med.action === 'write-out'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-muted text-muted-foreground'
                                  }
                                >
                                  {med.action}
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={med.action === 'dispense' ? 'default' : 'outline'}
                                  onClick={() => handleMedicationAction(med.id, 'dispense')}
                                  className="gap-2"
                                >
                                  <Package className="h-4 w-4" />
                                  Dispense
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={med.action === 'write-out' ? 'default' : 'outline'}
                                  onClick={() => handleMedicationAction(med.id, 'write-out')}
                                  className="gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Write Out
                                </Button>
                              </div>

                              {/* Quantity Controls for Dispensing */}
                              {med.action === 'dispense' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-3 rounded-lg bg-green-50 p-3"
                                >
                                  {/* Price Input */}
                                  <div className="flex items-center gap-2">
                                    <Label className="w-24 text-sm font-medium">Unit Price:</Label>
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {getCurrencySymbol()}
                                      </span>
                                      <Input
                                        type="number"
                                        value={med.price / med.quantity}
                                        onChange={(e) =>
                                          handlePriceChange(
                                            med.id,
                                            parseFloat(e.target.value || 0) * med.quantity
                                          )
                                        }
                                        className="pl-7"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">per unit</span>
                                  </div>

                                  {/* Quantity Selector */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm font-medium">
                                        Dispense Quantity:
                                      </Label>
                                      <span className="text-xs text-muted-foreground">
                                        Max: {med.quantity}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleQuantityChange(med.id, med.dispensedQuantity - 1)
                                        }
                                        disabled={med.dispensedQuantity <= 0}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={med.dispensedQuantity}
                                        onChange={(e) =>
                                          handleQuantityChange(
                                            med.id,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-20 text-center"
                                        min="0"
                                        max={med.quantity}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleQuantityChange(med.id, med.dispensedQuantity + 1)
                                        }
                                        disabled={med.dispensedQuantity >= med.quantity}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                      <div className="ml-auto text-right">
                                        <div className="text-sm font-medium">
                                          {formatCurrencySync(
                                            (med.price / med.quantity) * med.dispensedQuantity
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Charge</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Auto Write-out Warning */}
                                  {med.dispensedQuantity < med.quantity &&
                                    med.dispensedQuantity > 0 && (
                                      <div className="flex items-start gap-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs dark:border-blue-800 dark:bg-blue-950/30">
                                        <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                          <p className="font-medium text-blue-900 dark:text-blue-200">
                                            {med.quantity - med.dispensedQuantity} units will be
                                            written out
                                          </p>
                                          <p className="text-blue-700 dark:text-blue-300">
                                            Remaining quantity not dispensed will be marked as
                                            write-out (not charged)
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Billing Summary Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Billing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Services</span>
                        <span>{formatCurrencySync(totals.servicesTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medications</span>
                        <span>{formatCurrencySync(totals.medicationsTotal)}</span>
                      </div>

                      {/* Outstanding Balance Line Item */}
                      {totals.outstandingBalance > 0 && (
                        <div className="flex justify-between font-medium text-amber-700 dark:text-amber-300">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Previous Balance
                          </span>
                          <span>{formatCurrencySync(totals.outstandingBalance)}</span>
                        </div>
                      )}

                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>{formatCurrencySync(totals.subtotal)}</span>
                      </div>

                      {/* Discount Section */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Apply Discount</Label>

                        {/* Quick Discounts */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Quick Discounts</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDiscountPercentChange(10);
                              }}
                              disabled={isProcessing}
                            >
                              <Tag className="mr-1 h-4 w-4" />
                              10% Senior
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDiscountPercentChange(20);
                              }}
                              disabled={isProcessing}
                            >
                              <Tag className="mr-1 h-4 w-4" />
                              20% Staff
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Percentage</Label>
                            <div className="flex">
                              <Input
                                type="number"
                                value={discountPercent}
                                onChange={(e) =>
                                  handleDiscountPercentChange(parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="rounded-r-none"
                                min="0"
                                max="100"
                                disabled={isProcessing}
                              />
                              <div className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 py-2">
                                <Percent className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Amount</Label>
                            <div className="flex">
                              <div className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 py-2">
                                <DollarSign className="h-4 w-4" />
                              </div>
                              <Input
                                type="number"
                                value={discountAmount}
                                onChange={(e) =>
                                  handleDiscountAmountChange(parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                                className="rounded-l-none"
                                min="0"
                                step="0.01"
                                disabled={isProcessing}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleApplyDiscount}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          {isProcessing ? (
                            <>
                              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
                              Applying...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Apply Discount
                            </>
                          )}
                        </Button>

                        {/* Outstanding Balance Warning */}
                        {addOutstandingToInvoice &&
                          outstandingBalance &&
                          outstandingBalance.totalBalance > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800">
                              <p className="flex items-center gap-1 text-amber-800">
                                <AlertCircle className="h-3 w-3" />
                                Discount will be calculated on subtotal including outstanding
                                balance of {formatCurrencySync(outstandingBalance.totalBalance)}
                              </p>
                            </div>
                          )}
                      </div>

                      {totals.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount</span>
                          <span>-{formatCurrencySync(totals.discountAmount)}</span>
                        </div>
                      )}

                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrencySync(totals.total)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value) => {
                          setPaymentMethod(value);
                          // Reset QR code state when payment method changes
                          if (value !== 'online_payment') {
                            setShowQRCode(false);
                            setQrScannedConfirmed(false);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online_payment">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentMethod === 'online_payment' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (!clinicSettings?.payment_qr_code_url) {
                              showError('QR code is not configured. Please contact admin.');
                              return;
                            }
                            setShowQRCode(true);
                          }}
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          Show QR Code
                        </Button>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Notes (Optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this transaction..."
                        rows={3}
                      />
                    </div>

                    {/* Partial Payment Toggle */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Partial Payment</Label>
                        <Button
                          type="button"
                          variant={isPartialPayment ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newPartialPaymentState = !isPartialPayment;
                            setIsPartialPayment(newPartialPaymentState);
                            if (newPartialPaymentState) {
                              // Pre-fill with total amount when enabling partial payment
                              setPartialAmount(totals.total.toFixed(2));
                              setHoldReason('');
                            } else {
                              setPartialAmount('');
                              setHoldReason('');
                            }
                          }}
                          disabled={invoiceLimitReached && !addOutstandingToInvoice}
                        >
                          {isPartialPayment ? 'Enabled' : 'Enable'}
                        </Button>
                      </div>

                      {/* Warning when limit reached */}
                      {invoiceLimitReached && !addOutstandingToInvoice && (
                        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                          <AlertCircle className="mr-1 inline h-4 w-4" />
                          Partial payment disabled: Patient has reached maximum outstanding invoices
                          (2). Must pay full amount or add previous balance.
                        </div>
                      )}

                      {isPartialPayment && (
                        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800">
                          {invoiceLimitReached && addOutstandingToInvoice && (
                            <div className="mb-2 rounded border border-red-300 bg-red-100 p-2 text-xs text-red-900">
                              <AlertCircle className="mr-1 inline h-4 w-4" />
                              <strong>Warning:</strong> Patient already has 2 unpaid invoices.
                              Cannot create another partial payment unless previous invoices are
                              paid.
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label className="text-sm">Amount to Pay Now</Label>
                            <div className="flex">
                              <div className="flex items-center rounded-l-md border border-r-0 bg-card px-3 py-2">
                                <DollarSign className="h-4 w-4" />
                              </div>
                              <Input
                                type="number"
                                value={partialAmount}
                                onChange={(e) => setPartialAmount(e.target.value)}
                                placeholder="0.00"
                                className="rounded-l-none bg-card"
                                min="0"
                                max={totals.total}
                                step="0.01"
                              />
                            </div>
                            {partialAmount && parseFloat(partialAmount) < totals.total && (
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Balance Due:{' '}
                                {formatCurrencySync(totals.total - parseFloat(partialAmount || 0))}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Hold Reason</Label>
                            <Textarea
                              value={holdReason}
                              onChange={(e) => setHoldReason(e.target.value)}
                              placeholder="Why is this payment being held? (e.g., Patient will pay remaining balance next visit)"
                              rows={2}
                              className="bg-card"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Payment Due Date (Optional)</Label>
                            <Input
                              type="date"
                              value={paymentDueDate}
                              onChange={(e) => setPaymentDueDate(e.target.value)}
                              className="bg-card"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4">
                      {/* Warning when trying to create partial payment at limit */}
                      {invoiceLimitReached && isPartialPayment && (
                        <div className="mb-2 rounded-lg border-2 border-red-400 bg-red-100 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold text-red-900">
                            <XCircle className="h-4 w-4" />
                            Cannot process partial payment
                          </p>
                          <p className="mt-1 text-xs text-red-800">
                            Patient has 2 outstanding invoices. Must pay full amount.
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleApproveInvoice}
                        className="w-full gap-2"
                        disabled={
                          totals.total < 0 || // Only disable if negative (invalid state)
                          (isPartialPayment &&
                            (!partialAmount || parseFloat(partialAmount) <= 0 || !holdReason)) ||
                          (invoiceLimitReached && isPartialPayment) // Disable partial payment when limit reached
                        }
                      >
                        <Check className="h-4 w-4" />
                        {totals.total === 0
                          ? 'Complete Visit (No Charge)'
                          : isPartialPayment
                            ? 'Process Partial Payment'
                            : 'Approve & Process Full Payment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </PaymentDetailModal>

        {/* QR Code Display Dialog */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment QR Code</DialogTitle>
              <DialogDescription>Please scan the QR code to complete the payment</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {clinicSettings?.payment_qr_code_url ? (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-lg border-2 border-border bg-card p-4">
                      <img
                        src={clinicSettings.payment_qr_code_url}
                        alt="Payment QR Code"
                        className="h-64 w-64 object-contain"
                        onError={() => {
                          showError('Failed to load QR code image');
                          setShowQRCode(false);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="qrScanned"
                      checked={qrScannedConfirmed}
                      onChange={(e) => setQrScannedConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="qrScanned" className="cursor-pointer text-sm font-normal">
                      I have scanned and paid
                    </Label>
                  </div>
                </>
              ) : (
                <div className="text-center text-red-600">
                  QR code is not configured. Please contact admin.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQRCode(false);
                  setQrScannedConfirmed(false);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span>Patient:</span>
                  <span className="font-medium">{selectedInvoice?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice ID:</span>
                  <span className="font-medium">{selectedInvoice?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">
                    {paymentMethod === 'online_payment' ? 'Online Payment' : paymentMethod}
                  </span>
                </div>
                <Separator />

                {/* Payment Type */}
                {isPartialPayment ? (
                  <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800">
                    <div className="flex items-center gap-2 font-medium text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      Partial Payment
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Invoice Amount:</span>
                      <span className="font-medium">{formatCurrencySync(totals.total)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-700">
                      <span>Paying Now:</span>
                      <span>{formatCurrencySync(parseFloat(partialAmount || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-700">
                      <span>Balance Due:</span>
                      <span className="font-medium">
                        {formatCurrencySync(totals.total - parseFloat(partialAmount || 0))}
                      </span>
                    </div>
                    {holdReason && (
                      <div className="border-t border-amber-200 pt-2 dark:border-amber-800">
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          Hold Reason:
                        </span>
                        <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                          {holdReason}
                        </p>
                      </div>
                    )}
                    {paymentDueDate && (
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        Due Date: {new Date(paymentDueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrencySync(totals.total)}</span>
                  </div>
                )}
              </div>

              {notes && (
                <div>
                  <Label className="text-sm font-medium">Notes:</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Service Dialog */}
        <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service to Invoice</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceName">
                  Service Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="serviceName"
                  placeholder="e.g., Consultation, X-Ray, Blood Test"
                  value={newService.name || ''}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="servicePrice">
                  Price ({getCurrencySymbol()}) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="servicePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newService.price || ''}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea
                  id="serviceDescription"
                  placeholder="Optional description or notes"
                  value={newService.description || ''}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddServiceDialog(false);
                  setNewService({});
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddService}
                disabled={isProcessing || !newService.name || !newService.price}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Service
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Details Modal for Payment History */}
        <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Invoice Receipt</DialogTitle>
              <DialogDescription className="text-base">
                Invoice #
                {selectedPayment?.invoice?.invoice_number ||
                  selectedPayment?.invoiceDetails?.invoice_number ||
                  selectedPayment?.rawData?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <>
                <InvoiceDetails
                  invoice={selectedPayment.invoiceDetails}
                  fallback={selectedPayment.rawData || selectedPayment.invoice}
                  payment={{
                    // Prefer an explicit payment row if present; otherwise use latest transaction on the invoice
                    amount:
                      selectedPayment.amount ??
                      (selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        [])[0]?.amount,
                    payment_method:
                      selectedPayment.payment_method ??
                      (selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        [])[0]?.payment_method,
                    payment_reference:
                      selectedPayment.payment_reference ??
                      (selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        [])[0]?.payment_reference,
                    payment_notes:
                      selectedPayment.payment_notes ??
                      (selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        [])[0]?.payment_notes ??
                      (selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        [])[0]?.notes,
                  }}
                  showPaymentSection
                />
                {/* Payment History */}
                {selectedPayment.invoiceDetails?.payment_transactions?.length > 0 ||
                selectedPayment.rawData?.payment_transactions?.length > 0 ? (
                  <div className="border-b pb-4">
                    <h4 className="mb-3 flex items-center gap-2 text-base font-semibold">
                      <CreditCard className="h-4 w-4" />
                      Payment History
                    </h4>
                    <div className="space-y-2">
                      {(
                        selectedPayment.invoiceDetails?.payment_transactions ||
                        selectedPayment.rawData?.payment_transactions ||
                        []
                      ).map((payment, idx) => {
                        // Try multiple date fields with fallbacks
                        const paymentDate =
                          payment.payment_date ||
                          payment.created_at ||
                          payment.received_at ||
                          payment.paymentDate ||
                          null;

                        // Validate date
                        let formattedDate = 'N/A';
                        let formattedTime = 'N/A';
                        if (paymentDate) {
                          try {
                            const dateObj = new Date(paymentDate);
                            if (!isNaN(dateObj.getTime())) {
                              formattedDate = dateObj.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              });
                              formattedTime = dateObj.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              });
                            }
                          } catch (e) {
                            // Ignore date parsing errors
                          }
                        }

                        const isCreditPayment =
                          payment.payment_notes?.toLowerCase().includes('credit') ||
                          payment.notes?.toLowerCase().includes('credit') ||
                          payment.payment_notes?.toLowerCase().includes('due credit') ||
                          payment.notes?.toLowerCase().includes('due credit') ||
                          parseFloat(payment.amount || 0) < 0;

                        // Get payment notes from either field
                        const paymentNotes = payment.payment_notes || payment.notes || '';

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between rounded p-3 text-sm ${
                              isCreditPayment
                                ? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
                                : 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {formatCurrencySync(Math.abs(parseFloat(payment.amount || 0)))}
                                </p>
                                {isCreditPayment && (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-300 bg-blue-100 text-blue-800"
                                  >
                                    Credit Payment
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs capitalize text-muted-foreground">
                                {payment.payment_method || 'N/A'}
                              </p>
                              {paymentNotes && (
                                <p className="mt-1 text-xs text-muted-foreground">{paymentNotes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{formattedDate}</p>
                              <p className="text-xs text-muted-foreground">{formattedTime}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {payment.received_by_user
                                  ? `${payment.received_by_user.first_name || ''} ${payment.received_by_user.last_name || ''}`.trim() ||
                                    payment.received_by_user.full_name ||
                                    'Unknown'
                                  : payment.processed_by_user
                                    ? `${payment.processed_by_user.first_name || ''} ${payment.processed_by_user.last_name || ''}`.trim() ||
                                      payment.processed_by_user.full_name ||
                                      'Unknown'
                                    : payment.received_by
                                      ? 'Processed'
                                      : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDownloadReceipt({
                        rawData: selectedPayment.invoice || selectedPayment.rawData,
                      })
                    }
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>
                  <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </PageLayout>
    </motion.div>
  );
};

export default CashierDashboard;
