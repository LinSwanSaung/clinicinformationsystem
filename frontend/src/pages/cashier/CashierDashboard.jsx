import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Filter,
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
  ChevronDown,
  Receipt,
  Package,
  Users,
  History,
  Eye,
  Check,
  XCircle,
  Minus,
  Plus,
  Percent,
  Calculator,
  Save,
  Printer,
  Download,
  Tag,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PageLayout from '@/components/PageLayout';
import useDebounce from '@/utils/useDebounce';
import invoiceService from '../../services/invoiceService';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      type: "spring",
      stiffness: 100
    }
  },
  hover: { 
    y: -4,
    scale: 1.02,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: { scale: 0.98 }
};

const searchVariants = {
  centered: { 
    width: "100%", 
    maxWidth: "500px",
    margin: "0 auto"
  },
  expanded: { 
    width: "100%", 
    maxWidth: "400px",
    margin: "0"
  },
  focused: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const CashierDashboard = () => {
  const navigate = useNavigate();
  
  // State for invoices from backend
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Load pending invoices from backend
  useEffect(() => {
    loadPendingInvoices();
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getPendingInvoices();
      
      // Use backend data directly without transformation
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading pending invoices:', error);
      setError('Failed to load pending invoices');
    } finally {
      setLoading(false);
    }
  };
  
  // Invoice history state
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  
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
  
  // Partial payment state
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  
  // Outstanding balance state
  const [outstandingBalance, setOutstandingBalance] = useState(null);
  const [showOutstandingAlert, setShowOutstandingAlert] = useState(false);
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

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(() => {
      handleAutoRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load invoice history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && invoiceHistory.length === 0 && !historyLoading) {
      loadInvoiceHistory();
    }
  }, [activeTab]);

  // Load invoice history when history tab is activated
  useEffect(() => {
    if (activeTab === 'history') {
      loadInvoiceHistory();
    }
  }, [activeTab]);

  // Initialize medications and services when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      // Get medications from invoice_items
      const meds = (selectedInvoice.invoice_items || [])
        .filter(item => item.item_type === 'medicine')
        .map(item => ({
          id: item.id,
          name: item.item_name,
          quantity: item.quantity,
          price: parseFloat(item.unit_price || 0),
          dosage: item.notes || '',
          instructions: item.notes || '',
          inStock: 100, // Mock value
          dispensedQuantity: 0,
          action: 'pending' // pending, dispense, write-out
        }));
      setMedications(meds);
      
      // Get services from invoice_items
      const servs = (selectedInvoice.invoice_items || [])
        .filter(item => item.item_type === 'service')
        .map(item => ({
          id: item.id,
          name: item.item_name,
          price: parseFloat(item.unit_price || 0),
          description: item.notes || '',
          quantity: item.quantity || 1
        }));
      setServices(servs);
    }
  }, [selectedInvoice]);

  // Load invoice history
  const loadInvoiceHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const response = await invoiceService.getCompletedInvoices(50, 0);
      
      // Transform the data to match the UI format
      const formattedHistory = response.map(invoice => ({
        id: invoice.invoice_number,
        patientName: invoice.patients?.full_name || 
                     `${invoice.patients?.first_name || ''} ${invoice.patients?.last_name || ''}`.trim() || 
                     'Unknown Patient',
        doctorName: invoice.visits?.doctor?.full_name || 
                   `${invoice.visits?.doctor?.first_name || ''} ${invoice.visits?.doctor?.last_name || ''}`.trim() || 
                   'Unknown Doctor',
        date: invoice.completed_at ? new Date(invoice.completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A',
        time: invoice.completed_at ? new Date(invoice.completed_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'N/A',
        totalAmount: parseFloat(invoice.total_amount || 0),
        status: invoice.status,
        paymentMethod: invoice.payment_transactions?.[0]?.payment_method || 'N/A',
        processedBy: invoice.completed_by_user?.full_name || 
                    `${invoice.completed_by_user?.first_name || ''} ${invoice.completed_by_user?.last_name || ''}`.trim() || 
                    'Unknown',
        rawData: invoice // Keep original data for details
      }));
      
      setInvoiceHistory(formattedHistory);
    } catch (error) {
      console.error('Failed to load invoice history:', error);
      setHistoryError('Failed to load invoice history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // View invoice details from payment history
  const handleViewHistoryInvoice = async (historyItem) => {
    try {
      const response = await invoiceService.getInvoiceById(historyItem.rawData.id);
      setSelectedPayment({ 
        ...historyItem.rawData,
        invoice: historyItem.rawData,
        invoiceDetails: response 
      });
      setInvoiceModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('Failed to load invoice details');
    }
  };

  // Download receipt for invoice
  const handleDownloadReceipt = async (historyItem) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login first');
        return;
      }

      // Get the first payment transaction for this invoice
      const paymentId = historyItem.rawData.payment_transactions?.[0]?.id;
      
      if (!paymentId) {
        alert('No payment found for this invoice');
        return;
      }
      
      // Use direct fetch with proper auth header format
      const response = await fetch(
        `http://localhost:3001/api/payments/${paymentId}/receipt/pdf`,
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
      link.download = `receipt_${historyItem.rawData.invoice_number || historyItem.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const handleAutoRefresh = async () => {
    try {
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Auto-refresh error:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Manual refresh error:', error);
      setError('Failed to refresh invoice data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = invoices?.filter(inv => inv.status === 'pending').length || 0;
    
    // Count today's completed invoices and revenue
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const todayInvoices = (invoiceHistory || []).filter(inv => inv.date === today);
    const todayCompleted = todayInvoices.length || 0;
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0) || 0;

    return {
      totalInvoices: invoices?.length || 0,
      pendingInvoices: pending,
      todayCompleted,
      todayRevenue
    };
  }, [invoices, invoiceHistory]);

  // Advanced filtering
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(invoice => {
        return invoice.id.toLowerCase().includes(searchLower) ||
               invoice.patientName.toLowerCase().includes(searchLower) ||
               invoice.doctorName.toLowerCase().includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return a.waitingTime - b.waitingTime;
    });
  }, [invoices, debouncedSearchTerm, statusFilter, priorityFilter]);

  const clearSearch = () => {
    setSearchTerm('');
    setShowFilters(false);
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setShowFilters(false);
  };

  const handleViewInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setPaymentMethod('cash');
    setNotes('');
    
    // Check for outstanding balance and invoice limit
    if (invoice.patient_id) {
      try {
        const balanceData = await invoiceService.getPatientOutstandingBalance(invoice.patient_id);
        
        // Filter out the current invoice from outstanding invoices
        const otherOutstandingInvoices = balanceData.invoices.filter(inv => inv.id !== invoice.id);
        
        if (otherOutstandingInvoices.length > 0) {
          const otherBalance = otherOutstandingInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0);
          
          setOutstandingBalance({
            ...balanceData,
            totalBalance: otherBalance,
            invoiceCount: otherOutstandingInvoices.length,
            invoices: otherOutstandingInvoices
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
        console.error('Error fetching outstanding balance:', error);
        setOutstandingBalance(null);
        setInvoiceLimitReached(false);
      }
    }
  };

  const handleCloseInvoiceDetail = () => {
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
  };

  const handleMedicationAction = (medicationId, action) => {
    setMedications(prev => prev.map(med => 
      med.id === medicationId 
        ? { ...med, action }
        : med
    ));
  };

  const handleQuantityChange = (medicationId, quantity) => {
    setMedications(prev => prev.map(med => 
      med.id === medicationId 
        ? { ...med, dispensedQuantity: Math.max(0, Math.min(quantity, med.quantity)) }
        : med
    ));
  };

  const handlePriceChange = (medicationId, price) => {
    setMedications(prev => prev.map(med => 
      med.id === medicationId 
        ? { ...med, price: Math.max(0, parseFloat(price) || 0) }
        : med
    ));
  };

  // Service management handlers
  const handleServicePriceChange = (serviceId, price) => {
    setServices(prev => prev.map(serv => 
      serv.id === serviceId 
        ? { ...serv, price: Math.max(0, parseFloat(price) || 0) }
        : serv
    ));
  };

  const handleServiceNameChange = (serviceId, name) => {
    setServices(prev => prev.map(serv => 
      serv.id === serviceId 
        ? { ...serv, name }
        : serv
    ));
  };

  const handleServiceDescriptionChange = (serviceId, description) => {
    setServices(prev => prev.map(serv => 
      serv.id === serviceId 
        ? { ...serv, description }
        : serv
    ));
  };

  const handleRemoveService = async (serviceId) => {
    if (!selectedInvoice) return;
    
    try {
      setIsProcessing(true);
      await invoiceService.removeInvoiceItem(selectedInvoice.id, serviceId);
      
      // Remove from local state
      setServices(prev => prev.filter(serv => serv.id !== serviceId));
      
      // Update selected invoice
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);
      
    } catch (error) {
      console.error('Error removing service:', error);
      setError('Failed to remove service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddService = async () => {
    if (!selectedInvoice || !newService.name || !newService.price) {
      setError('Service name and price are required');
      return;
    }
    
    try {
      setIsProcessing(true);
      await invoiceService.addServiceItem(selectedInvoice.id, {
        service_name: newService.name,
        unit_price: parseFloat(newService.price),
        quantity: 1,
        notes: newService.description
      });
      
      // Reload invoice to get updated items
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);
      
      // Reset form
      setNewService({ name: '', price: '', description: '' });
      setShowAddServiceDialog(false);
      
    } catch (error) {
      console.error('Error adding service:', error);
      setError('Failed to add service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateService = async (serviceId) => {
    if (!selectedInvoice) return;
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    try {
      setIsProcessing(true);
      await invoiceService.updateInvoiceItem(selectedInvoice.id, serviceId, {
        item_name: service.name,
        unit_price: service.price,
        quantity: 1,
        total_price: service.price,
        notes: service.description
      });
      
      setIsEditingService(null);
      
      // Reload invoice
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);
      
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotals = () => {
    if (!selectedInvoice) return { 
      servicesTotal: 0, 
      medicationsTotal: 0, 
      outstandingBalance: 0,
      subtotal: 0, 
      discountAmount: 0, 
      total: 0 
    };
    
    // Calculate services total from state array (for real-time updates during editing)
    const servicesTotal = services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    
    // Only include dispensed medications in total
    const medicationsTotal = medications
      .filter(med => med.action === 'dispense' && med.dispensedQuantity > 0)
      .reduce((sum, med) => {
        // Calculate based on dispensed quantity
        const unitPrice = med.price / med.quantity; // Price per unit
        const itemTotal = unitPrice * med.dispensedQuantity;
        return sum + itemTotal;
      }, 0);
    
    // Add outstanding balance if checkbox is checked
    const outstandingBalanceAmount = (addOutstandingToInvoice && outstandingBalance) 
      ? outstandingBalance.totalBalance 
      : 0;
    
    const subtotal = servicesTotal + medicationsTotal + outstandingBalanceAmount;
    const discountAmountCalc = discountPercent > 0 
      ? (subtotal * discountPercent / 100) 
      : discountAmount;
    const total = subtotal - discountAmountCalc;

    return {
      servicesTotal,
      medicationsTotal,
      outstandingBalance: outstandingBalanceAmount,
      subtotal,
      discountAmount: discountAmountCalc,
      total: Math.max(0, total)
    };
  };

  const handleDiscountPercentChange = (percent) => {
    setDiscountPercent(percent);
    setDiscountAmount(0);
  };

  const handleDiscountAmountChange = (amount) => {
    setDiscountAmount(amount);
    setDiscountPercent(0);
  };

  const handleApproveInvoice = async () => {
    // If partial payment is selected, check the 2-invoice limit
    if (isPartialPayment && partialAmount && parseFloat(partialAmount) < totals.total) {
      try {
        // Check if patient can have more outstanding invoices
        const limitCheck = await invoiceService.canPatientCreateInvoice(selectedInvoice.patient_id);
        
        if (!limitCheck.canCreate) {
          setError(`Cannot process partial payment: ${limitCheck.message}. Patient must pay outstanding invoices first.`);
          return;
        }
      } catch (error) {
        console.error('Error checking invoice limit:', error);
        setError('Failed to verify patient invoice limit');
        return;
      }
    }
    
    setShowPaymentDialog(true);
  };

  const handleDeclineInvoice = () => {
    handleCloseInvoiceDetail();
  };

  const handleLoadPrescriptions = async () => {
    if (!selectedInvoice) return;
    
    try {
      setIsProcessing(true);
      
      // Add prescriptions to invoice
      await invoiceService.addPrescriptionsToInvoice(selectedInvoice.id, selectedInvoice.visit_id);
      
      // Reload the invoice to get updated items
      const updatedInvoice = await invoiceService.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(updatedInvoice);
      
      // Reload the invoice list
      await loadPendingInvoices();
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Failed to load prescriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const totals = calculateTotals();
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Step 1: Update medication items in the invoice
      for (const med of medications) {
        if (med.action === 'dispense' && med.dispensedQuantity > 0) {
          const unitPrice = med.price / med.quantity;
          
          // Update the invoice item with quantity and price
          await invoiceService.updateInvoiceItem(selectedInvoice.id, med.id, {
            quantity: med.dispensedQuantity,
            unit_price: unitPrice,
            total_price: unitPrice * med.dispensedQuantity
          });
          
          // If partially dispensed, add a write-out item for remaining quantity
          if (med.dispensedQuantity < med.quantity) {
            await invoiceService.addMedicineItem(selectedInvoice.id, {
              medicine_name: `${med.name} (Write-out)`,
              quantity: med.quantity - med.dispensedQuantity,
              unit_price: 0,
              notes: `Written prescription - ${med.quantity - med.dispensedQuantity} units not dispensed`
            });
          }
        } else if (med.action === 'write-out') {
          // Update item to write-out with $0
          await invoiceService.updateInvoiceItem(selectedInvoice.id, med.id, {
            quantity: med.quantity,
            unit_price: 0,
            total_price: 0,
            notes: 'Written out - not dispensed'
          });
        }
      }
      
      // Step 2: If outstanding balance is added, pay off those invoices first
      if (addOutstandingToInvoice && outstandingBalance && outstandingBalance.totalBalance > 0) {
        // Pay off outstanding invoices in order (oldest first)
        for (const oldInvoice of outstandingBalance.invoices) {
          const balanceDue = parseFloat(oldInvoice.balance_due);
          
          // Record payment for old invoice
          await invoiceService.recordPartialPayment(oldInvoice.id, {
            amount: balanceDue,
            payment_method: paymentMethod,
            notes: `Paid with current visit invoice #${selectedInvoice.invoice_number || selectedInvoice.id}`,
            processed_by: currentUser?.id
          });
        }
      }
      
      // Step 3: Record payment for current invoice (full or partial)
      if (isPartialPayment && partialAmount && parseFloat(partialAmount) < totals.total) {
        // Process partial payment
        const paymentAmount = parseFloat(partialAmount);
        await invoiceService.recordPartialPayment(selectedInvoice.id, {
          amount: paymentAmount,
          payment_method: paymentMethod,
          notes: notes || 'Partial payment processed',
          hold_reason: holdReason,
          payment_due_date: paymentDueDate || null
        });
        
        const balanceDue = totals.total - paymentAmount;
        
        let successMsg = `Partial payment of $${paymentAmount.toFixed(2)} recorded. Balance due: $${balanceDue.toFixed(2)}`;
        if (addOutstandingToInvoice && outstandingBalance) {
          successMsg += ` (including $${outstandingBalance.totalBalance.toFixed(2)} from previous invoices)`;
        }
        setSuccessMessage(successMsg);
      } else {
        // Process full payment
        await invoiceService.recordPayment(selectedInvoice.id, {
          payment_method: paymentMethod,
          amount_paid: totals.total,
          notes: notes || 'Payment processed'
        });
        
        // Complete the invoice (this will also complete the visit)
        await invoiceService.completeInvoice(selectedInvoice.id, currentUser?.id);
        
        let successMsg = `Invoice ${selectedInvoice.invoice_number || selectedInvoice.id} completed successfully! Visit has been marked as completed.`;
        if (addOutstandingToInvoice && outstandingBalance) {
          successMsg += ` Also paid off ${outstandingBalance.invoiceCount} previous invoice(s) totaling $${outstandingBalance.totalBalance.toFixed(2)}.`;
        }
        setSuccessMessage(successMsg);
      }
      
      setShowPaymentDialog(false);
      handleCloseInvoiceDetail();
      
      // Reload pending invoices
      await loadPendingInvoices();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Clear error
      setError(null);
      
      // Reset partial payment state
      setIsPartialPayment(false);
      setPartialAmount('');
      setHoldReason('');
      setPaymentDueDate('');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setError('Failed to process payment: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totals = calculateTotals();

  // Skeleton loader component
  const SkeletonCard = () => (
    <Card className="border-l-4 border-l-gray-200">
      <div className="p-4 space-y-4">
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
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <PageLayout 
        title="Cashier Dashboard" 
        subtitle="Manage pending invoices and process payments"
        fullWidth
      >
        <div className="space-y-6 p-4 md:p-6">
          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Statistics Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Pending', value: stats?.pendingInvoices || 0, color: 'yellow', icon: Clock },
              { label: 'Today Completed', value: stats?.todayCompleted || 0, color: 'green', icon: CheckCircle },
              { label: 'Today Revenue', value: `$${(stats?.todayRevenue || 0).toFixed(2)}`, color: 'blue', icon: DollarSign },
              { label: 'Total Invoices', value: stats?.totalInvoices || 0, color: 'gray', icon: Receipt }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                      <div>
                        <p className={`text-lg font-bold text-${stat.color}-600`}>
                          {stat.value}
                        </p>
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
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Invoices ({stats.pendingInvoices})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Invoice History
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
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground mt-2">Loading invoices...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground mb-2">No invoices found</p>
                      <p className="text-sm text-muted-foreground mb-4">
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Visit Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
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
                                      <div className="text-xs text-muted-foreground">{invoice.patient?.phone}</div>
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
                                    <div>{invoice.invoice_items?.filter(i => i.item_type === 'service').length || 0} services</div>
                                    <div className="text-xs text-muted-foreground">
                                      {invoice.invoice_items?.filter(i => i.item_type === 'medicine').length || 0} medications
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                  ${parseFloat(invoice.total_amount || 0).toFixed(2)}
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
                                      handleViewInvoice(invoice);
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
                        <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">{invoice.id}</p>
                                <p className="text-sm text-muted-foreground">{invoice.patientName}</p>
                              </div>
                              <div>
                                <p className="text-sm">{invoice.doctorName}</p>
                                <p className="text-sm text-muted-foreground">{invoice.date} at {invoice.time}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">${invoice.totalAmount.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground capitalize">{invoice.paymentMethod}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistoryInvoice(invoice)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReceipt(invoice)}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Receipt
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Invoice Detail Modal */}
        <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Invoice - {selectedInvoice?.id}</DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Patient Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Patient Name</Label>
                          <p className="text-lg">
                            {selectedInvoice.patient?.first_name} {selectedInvoice.patient?.last_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Visit Type</Label>
                          <p className="text-lg">{selectedInvoice.visit?.visit_type || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Date & Time</Label>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(selectedInvoice.created_at).toLocaleDateString()} at {new Date(selectedInvoice.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Contact</Label>
                          <p className="text-sm">{selectedInvoice.patient?.phone || 'N/A'}</p>
                          <p className="text-sm">{selectedInvoice.patient?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Outstanding Balance Alert */}
                  {outstandingBalance && outstandingBalance.totalBalance > 0 && (
                    <Card className={invoiceLimitReached ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900'}`}>
                          <AlertCircle className="h-5 w-5" />
                          {invoiceLimitReached ? '⚠️ Invoice Limit Reached' : 'Outstanding Balance'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className={`text-sm ${invoiceLimitReached ? 'text-red-800' : 'text-amber-800'}`}>
                              This patient has {outstandingBalance.invoiceCount} unpaid invoice{outstandingBalance.invoiceCount > 1 ? 's' : ''} with a total balance of:
                            </p>
                            <p className={`text-3xl font-bold ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900'}`}>
                              ${outstandingBalance.totalBalance.toFixed(2)}
                            </p>
                            
                            {/* 2-Invoice Limit Warning */}
                            {invoiceLimitReached && (
                              <div className="p-3 bg-red-100 border-2 border-red-400 rounded-lg mt-3">
                                <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                                  <XCircle className="h-5 w-5" />
                                  MAXIMUM OUTSTANDING INVOICES REACHED (2/2)
                                </p>
                                <p className="text-xs text-red-800 mt-1">
                                  Patient cannot leave with another unpaid invoice. They must either:
                                </p>
                                <ul className="text-xs text-red-800 mt-1 ml-4 list-disc space-y-1">
                                  <li>Pay the full amount including previous balance</li>
                                  <li>Pay off at least one previous invoice to reduce outstanding count</li>
                                </ul>
                              </div>
                            )}
                            
                            {/* List of outstanding invoices */}
                            <div className="space-y-1 mt-3">
                              {outstandingBalance.invoices.map(inv => (
                                <div key={inv.id} className={`text-xs flex items-center gap-2 ${invoiceLimitReached ? 'text-red-700' : 'text-amber-700'}`}>
                                  <Receipt className="h-3 w-3" />
                                  Invoice #{inv.invoice_number || inv.id.slice(0, 8)} - ${parseFloat(inv.balance_due).toFixed(2)} due
                                  {inv.payment_due_date && (
                                    <span className={invoiceLimitReached ? 'text-red-600' : 'text-amber-600'}>
                                      (Due: {new Date(inv.payment_due_date).toLocaleDateString()})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action: Add to current invoice */}
                        <div className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${invoiceLimitReached ? 'border-red-300' : 'border-amber-200'}`}>
                          <input
                            type="checkbox"
                            id="addOutstanding"
                            checked={addOutstandingToInvoice}
                            onChange={(e) => setAddOutstandingToInvoice(e.target.checked)}
                            className={`h-4 w-4 focus:ring-2 border rounded ${invoiceLimitReached ? 'text-red-600 focus:ring-red-500 border-red-400' : 'text-amber-600 focus:ring-amber-500 border-amber-300'}`}
                          />
                          <label htmlFor="addOutstanding" className={`flex-1 text-sm font-medium cursor-pointer ${invoiceLimitReached ? 'text-red-900' : 'text-amber-900'}`}>
                            {invoiceLimitReached 
                              ? `⚠️ Must add outstanding balance (${outstandingBalance.totalBalance.toFixed(2)}) - cannot create another unpaid invoice`
                              : `Add outstanding balance ($${outstandingBalance.totalBalance.toFixed(2)}) to current invoice`
                            }
                          </label>
                        </div>

                        {addOutstandingToInvoice && !invoiceLimitReached && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Outstanding balance will be added to the total. Patient can pay full amount or make partial payment.
                            </p>
                          </div>
                        )}
                        
                        {addOutstandingToInvoice && invoiceLimitReached && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Good! Outstanding balance added. Patient must pay full amount to proceed.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Services and Medications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Services */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base">Services Provided</CardTitle>
                        <Button
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
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No services added yet</p>
                            <p className="text-sm mt-1">Click "Add Service" to add a service</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {services.map(service => (
                              <div key={service.id} className="p-3 bg-green-50 rounded-lg space-y-3">
                                {isEditingService === service.id ? (
                                  // Edit Mode
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">Service Name</Label>
                                      <Input
                                        value={service.name}
                                        onChange={(e) => handleServiceNameChange(service.id, e.target.value)}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Price ($)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={service.price}
                                        onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Description</Label>
                                      <textarea
                                        value={service.description || ''}
                                        onChange={(e) => handleServiceDescriptionChange(service.id, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border rounded-md resize-none"
                                        rows={2}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateService(service.id)}
                                        disabled={isProcessing}
                                        className="flex-1"
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
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
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium">{service.name}</p>
                                        <p className="text-sm text-muted-foreground">{service.description || 'No description'}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">${parseFloat(service.price || 0).toFixed(2)}</p>
                                        <Badge variant="outline" className="border-green-200 text-green-800">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Completed
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsEditingService(service.id)}
                                        disabled={isProcessing}
                                        className="flex-1 text-xs"
                                      >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          if (window.confirm(`Remove "${service.name}" from invoice?`)) {
                                            handleRemoveService(service.id);
                                          }
                                        }}
                                        disabled={isProcessing}
                                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
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
                            size="sm"
                            variant="outline"
                            onClick={handleLoadPrescriptions}
                            disabled={isProcessing || medications.length > 0}
                            className="gap-2"
                          >
                            <Pill className="h-4 w-4" />
                            Load Prescriptions
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {medications.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No medications added yet</p>
                            <p className="text-sm mt-1">Click "Load Prescriptions" to add prescribed medications</p>
                          </div>
                        ) : (
                        <div className="space-y-4">
                          {medications.map(med => (
                            <div key={med.id} className="p-3 border rounded-lg space-y-3">
                              <div className="flex justify-between items-start">
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
                                      ? 'bg-green-100 text-green-800'
                                      : med.action === 'write-out'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {med.action}
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={med.action === 'dispense' ? 'default' : 'outline'}
                                  onClick={() => handleMedicationAction(med.id, 'dispense')}
                                  className="gap-2"
                                >
                                  <Package className="h-4 w-4" />
                                  Dispense
                                </Button>
                                <Button
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
                                  className="space-y-3 p-3 bg-green-50 rounded-lg"
                                >
                                  {/* Price Input */}
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium w-24">Unit Price:</Label>
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                      <Input
                                        type="number"
                                        value={(med.price / med.quantity).toFixed(2)}
                                        onChange={(e) => handlePriceChange(med.id, parseFloat(e.target.value || 0) * med.quantity)}
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
                                      <Label className="text-sm font-medium">Dispense Quantity:</Label>
                                      <span className="text-xs text-muted-foreground">Max: {med.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleQuantityChange(med.id, med.dispensedQuantity - 1)}
                                        disabled={med.dispensedQuantity <= 0}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                        type="number"
                                        value={med.dispensedQuantity}
                                        onChange={(e) => handleQuantityChange(med.id, parseInt(e.target.value) || 0)}
                                        className="w-20 text-center"
                                        min="0"
                                        max={med.quantity}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleQuantityChange(med.id, med.dispensedQuantity + 1)}
                                        disabled={med.dispensedQuantity >= med.quantity}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                      <div className="ml-auto text-right">
                                        <div className="text-sm font-medium">
                                          ${((med.price / med.quantity) * med.dispensedQuantity).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Charge</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Auto Write-out Warning */}
                                  {med.dispensedQuantity < med.quantity && med.dispensedQuantity > 0 && (
                                    <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-blue-900">
                                          {med.quantity - med.dispensedQuantity} units will be written out
                                        </p>
                                        <p className="text-blue-700">
                                          Remaining quantity not dispensed will be marked as write-out (not charged)
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
                  <Card className="sticky top-4">
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
                          <span>${totals.servicesTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medications</span>
                          <span>${totals.medicationsTotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Outstanding Balance Line Item */}
                        {totals.outstandingBalance > 0 && (
                          <div className="flex justify-between text-amber-700 font-medium">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Previous Balance
                            </span>
                            <span>${totals.outstandingBalance.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Subtotal</span>
                          <span>${totals.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Discount Section */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Apply Discount</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Percentage</Label>
                              <div className="flex">
                                <Input
                                  type="number"
                                  value={discountPercent}
                                  onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="rounded-r-none"
                                  min="0"
                                  max="100"
                                />
                                <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-md flex items-center">
                                  <Percent className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Amount</Label>
                              <div className="flex">
                                <div className="px-3 py-2 bg-muted border border-r-0 rounded-l-md flex items-center">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <Input
                                  type="number"
                                  value={discountAmount}
                                  onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="rounded-l-none"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span>-${totals.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${totals.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Credit/Debit Card</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
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

                      {/* Quick Discounts */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quick Discounts</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDiscountPercentChange(10)}>
                            <Tag className="h-4 w-4 mr-1" />
                            10% Senior
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDiscountPercentChange(20)}>
                            <Tag className="h-4 w-4 mr-1" />
                            20% Staff
                          </Button>
                        </div>
                      </div>

                      {/* Partial Payment Toggle */}
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Partial Payment</Label>
                          <Button
                            variant={isPartialPayment ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setIsPartialPayment(!isPartialPayment);
                              if (!isPartialPayment) {
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
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Partial payment disabled: Patient has reached maximum outstanding invoices (2). Must pay full amount or add previous balance.
                          </div>
                        )}

                        {isPartialPayment && (
                          <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            {invoiceLimitReached && addOutstandingToInvoice && (
                              <div className="p-2 bg-red-100 border border-red-300 rounded text-xs text-red-900 mb-2">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                <strong>Warning:</strong> Patient already has 2 unpaid invoices. Cannot create another partial payment unless previous invoices are paid.
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-sm">Amount to Pay Now</Label>
                              <div className="flex">
                                <div className="px-3 py-2 bg-white border border-r-0 rounded-l-md flex items-center">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <Input
                                  type="number"
                                  value={partialAmount}
                                  onChange={(e) => setPartialAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="rounded-l-none bg-white"
                                  min="0"
                                  max={totals.total}
                                  step="0.01"
                                />
                              </div>
                              {partialAmount && parseFloat(partialAmount) < totals.total && (
                                <p className="text-xs text-amber-700">
                                  Balance Due: ${(totals.total - parseFloat(partialAmount || 0)).toFixed(2)}
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
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Payment Due Date (Optional)</Label>
                              <Input
                                type="date"
                                value={paymentDueDate}
                                onChange={(e) => setPaymentDueDate(e.target.value)}
                                className="bg-white"
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
                          <div className="p-3 bg-red-100 border-2 border-red-400 rounded-lg mb-2">
                            <p className="text-xs font-bold text-red-900 flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Cannot process partial payment
                            </p>
                            <p className="text-xs text-red-800 mt-1">
                              Patient has 2 outstanding invoices. Must pay full amount.
                            </p>
                          </div>
                        )}
                        
                        <Button
                          onClick={handleApproveInvoice}
                          className="w-full gap-2"
                          disabled={
                            totals.total <= 0 || 
                            (isPartialPayment && (!partialAmount || parseFloat(partialAmount) <= 0 || !holdReason)) ||
                            (invoiceLimitReached && isPartialPayment) // Disable partial payment when limit reached
                          }
                        >
                          <Check className="h-4 w-4" />
                          {isPartialPayment ? 'Process Partial Payment' : 'Approve & Process Full Payment'}
                        </Button>
                        <Button 
                          onClick={handleDeclineInvoice}
                          variant="outline" 
                          className="w-full gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Decline Invoice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
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
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <Separator />
                
                {/* Payment Type */}
                {isPartialPayment ? (
                  <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Partial Payment
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Invoice Amount:</span>
                      <span className="font-medium">${totals.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-700">
                      <span>Paying Now:</span>
                      <span>${parseFloat(partialAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-700">
                      <span>Balance Due:</span>
                      <span className="font-medium">${(totals.total - parseFloat(partialAmount || 0)).toFixed(2)}</span>
                    </div>
                    {holdReason && (
                      <div className="pt-2 border-t border-amber-200">
                        <span className="text-xs text-amber-700">Hold Reason:</span>
                        <p className="text-sm text-amber-900 mt-1">{holdReason}</p>
                      </div>
                    )}
                    {paymentDueDate && (
                      <div className="text-xs text-amber-700">
                        Due Date: {new Date(paymentDueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {notes && (
                <div>
                  <Label className="text-sm font-medium">Notes:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{notes}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                <Label htmlFor="serviceName">Service Name <span className="text-red-500">*</span></Label>
                <Input
                  id="serviceName"
                  placeholder="e.g., Consultation, X-Ray, Blood Test"
                  value={newService.name || ''}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="servicePrice">Price ($) <span className="text-red-500">*</span></Label>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Invoice #{selectedPayment?.invoice?.invoice_number || selectedPayment?.invoiceDetails?.invoice_number}
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

                {/* Payment Transactions */}
                {selectedPayment.invoiceDetails?.payment_transactions?.length > 0 && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Payment History</h4>
                    <div className="space-y-2">
                      {selectedPayment.invoiceDetails.payment_transactions.map((payment, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-green-50 p-3 rounded">
                          <div>
                            <p className="font-medium">${parseFloat(payment.amount).toFixed(2)}</p>
                            <p className="text-gray-600 text-xs capitalize">{payment.payment_method}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.received_by_user ? 
                                `${payment.received_by_user.first_name} ${payment.received_by_user.last_name}` : 
                                'Unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReceipt({ rawData: selectedPayment.invoice })}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setInvoiceModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageLayout>
    </motion.div>
  );
};

export default CashierDashboard;