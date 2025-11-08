import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { invoiceService } from '@/features/billing';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Pill,
  DollarSign,
  Minus,
  Plus,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Receipt,
  Package,
  ShoppingCart,
  Percent,
  Calculator,
  Save,
  Printer,
  Download,
  CheckCircle,
  XCircle,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormModal } from '@/components/library';
import PageLayout from '@/components/layout/PageLayout';
import logger from '@/utils/logger';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const InvoiceManagement = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get invoice data from navigation state or fetch from API
  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [medications, setMedications] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load invoice from backend if not passed via navigation
  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoice && invoiceId) {
        try {
          setLoading(true);
          setError(null);
          const data = await invoiceService.getInvoiceById(invoiceId);
          logger.debug('Invoice loaded:', data);
          
          // Transform backend data to match UI expectations
          const transformedInvoice = {
            ...data,
            patientName: `${data.patient?.first_name || ''} ${data.patient?.last_name || ''}`.trim(),
            patientPhone: data.patient?.phone || 'N/A',
            patientEmail: data.patient?.email || 'N/A',
            doctorName: 'Dr. ' + (data.visit?.doctor_name || 'Unknown'),
            date: new Date(data.created_at).toLocaleDateString(),
            time: new Date(data.created_at).toLocaleTimeString(),
            services: (data.invoice_items || []).filter(item => item.item_type === 'service').map(item => ({
              id: item.id,
              name: item.item_name,
              price: parseFloat(item.unit_price),
              type: 'service',
              description: item.notes || ''
            })),
            medications: (data.invoice_items || []).filter(item => item.item_type === 'medicine').map(item => ({
              id: item.id,
              name: item.item_name,
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              status: data.status,
              dosage: item.notes || '',
              instructions: item.notes || '',
              inStock: 100 // Mock value - would come from inventory system
            })),
            totalAmount: parseFloat(data.total_amount || 0),
            status: data.status,
            priority: 'normal', // Mock value
            waitingTime: 0 // Mock value
          };
          
          setInvoice(transformedInvoice);
        } catch (error) {
          logger.error('Error loading invoice:', error);
          setError('Failed to load invoice details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadInvoice();
  }, [invoiceId]);

  useEffect(() => {
    if (invoice) {
      // Initialize medications with quantities
      setMedications((invoice.medications || []).map(med => ({
        ...med,
        dispensedQuantity: 0,
        action: 'pending' // pending, dispense, write-out
      })));
    }
  }, [invoice]);

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

  const calculateTotals = () => {
    const servicesTotal = (invoice?.services || []).reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
    const medicationsTotal = medications
      .filter(med => med.action === 'dispense')
      .reduce((sum, med) => {
        const quantity = med.dispensedQuantity || 0;
        const price = parseFloat(med.price) || 0;
        const totalQuantity = med.quantity || 1;
        return sum + (price * quantity / totalQuantity);
      }, 0);
    
    const subtotal = servicesTotal + medicationsTotal;
    const discountAmountCalc = discountPercent > 0 
      ? (subtotal * discountPercent / 100) 
      : discountAmount;
    const total = subtotal - discountAmountCalc;

    return {
      servicesTotal,
      medicationsTotal,
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

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const totals = calculateTotals();
      const amountToRecord = paymentAmount ? parseFloat(paymentAmount) : totals.total;
      
      // Validate payment amount
      if (amountToRecord <= 0) {
        setError('Payment amount must be greater than 0');
        setIsProcessing(false);
        return;
      }
      
      if (amountToRecord > totals.total) {
        setError('Payment amount cannot exceed total amount');
        setIsProcessing(false);
        return;
      }
      
      // Record payment in backend
      // Use partial-payment endpoint for all payments (handles both full and partial)
      if (amountToRecord >= totals.total) {
        // Full payment - complete the invoice (which also records payment)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await invoiceService.completeInvoice(invoice.id, user.id);
        setInvoice(prev => ({ ...prev, status: 'paid' }));
      } else {
        // Partial payment - use partial-payment endpoint
        await invoiceService.recordPartialPayment(invoice.id, {
          amount: amountToRecord,
          payment_method: paymentMethod,
          notes: notes
        });
        setInvoice(prev => ({ ...prev, status: 'partial' }));
      }
      
      logger.debug('Payment processed successfully');
      setShowPaymentDialog(false);
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/cashier', { 
          state: { 
            message: `Payment of $${amountToRecord.toFixed(2)} for ${invoice.invoice_number || invoice.id} processed successfully` 
          }
        });
      }, 1000);
      
    } catch (error) {
      logger.error('Payment processing error:', error);
      setError('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const totals = invoice ? calculateTotals() : { servicesTotal: 0, medicationsTotal: 0, subtotal: 0, discountAmount: 0, total: 0 };

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {loading ? 'Loading invoice...' : 'Invoice not found'}
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
          {!loading && !invoice && (
            <Button onClick={() => navigate('/cashier')} className="mt-4">
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <PageLayout
        title={`Invoice ${invoice.id}`}
        subtitle="Process payment and manage medications"
        fullWidth
      >
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cashier')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Invoice {invoice.id}</h1>
              <p className="text-muted-foreground">Process payment and pharmacy dispensing</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Information */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
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
                        <p className="text-lg">{invoice.patientName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Doctor</Label>
                        <p className="text-lg">{invoice.doctorName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date & Time</Label>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {invoice.date} at {invoice.time}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge 
                          className={
                            invoice.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : invoice.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Services and Medications Tabs */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="services">Services</TabsTrigger>
                        <TabsTrigger value="medications">Medications</TabsTrigger>
                      </TabsList>
                    </CardHeader>
                    
                    <CardContent>
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Services Summary */}
                          <div>
                            <h4 className="font-medium mb-3">Services</h4>
                            <div className="space-y-2">
                              {invoice.services.map(service => (
                                <div key={service.id} className="flex justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-sm text-muted-foreground">{service.description}</p>
                                  </div>
                                  <p className="font-medium">${service.price.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Medications Summary */}
                          <div>
                            <h4 className="font-medium mb-3">Medications</h4>
                            <div className="space-y-2">
                              {medications.map(med => (
                                <div key={med.id} className="flex justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">{med.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {med.action === 'dispense' 
                                        ? `Dispensing: ${med.dispensedQuantity}/${med.quantity}`
                                        : med.action === 'write-out' 
                                        ? 'Write-out prescription'
                                        : 'Pending action'
                                      }
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      ${med.action === 'dispense' 
                                        ? (med.price * med.dispensedQuantity / med.quantity).toFixed(2)
                                        : '0.00'
                                      }
                                    </p>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        med.action === 'dispense' 
                                          ? 'border-green-200 text-green-800'
                                          : med.action === 'write-out'
                                          ? 'border-blue-200 text-blue-800'
                                          : 'border-gray-200 text-gray-800'
                                      }
                                    >
                                      {med.action}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="services" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Service Items</h4>
                          {invoice.services.map(service => (
                            <motion.div
                              key={service.id}
                              variants={itemVariants}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{service.name}</h5>
                                  <p className="text-sm text-muted-foreground">{service.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">${service.price.toFixed(2)}</p>
                                  <Badge variant="outline" className="border-green-200 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="medications" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Prescribed Medications</h4>
                          {medications.map(med => (
                            <motion.div
                              key={med.id}
                              variants={itemVariants}
                              className="p-4 border rounded-lg space-y-4"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h5 className="font-medium">{med.name}</h5>
                                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                                  <p className="text-sm text-muted-foreground">{med.instructions}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Prescribed: {med.quantity} | In Stock: {med.inStock}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${med.price.toFixed(2)}</p>
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
                                  className="flex items-center gap-4 p-3 bg-green-50 rounded-lg"
                                >
                                  <Label className="text-sm font-medium">Dispense Quantity:</Label>
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
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    of {med.quantity} prescribed
                                  </span>
                                  <div className="ml-auto">
                                    <span className="text-sm font-medium">
                                      Amount: ${(med.price * med.dispensedQuantity / med.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </motion.div>
                              )}

                              {/* Write-out confirmation */}
                              {med.action === 'write-out' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="p-3 bg-blue-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">
                                      Prescription will be written out - No charge
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </motion.div>
            </div>

            {/* Billing Summary Sidebar */}
            <div className="space-y-6">
              {/* Billing Summary */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
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

                    {/* Payment Amount */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Payment Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totals.total}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={`Enter amount (Max: $${totals.total.toFixed(2)})`}
                          className="pl-7"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to pay full amount. Enter partial amount for partial payment.
                      </p>
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

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4">
                      <Button
                        onClick={() => {
                          logger.debug('Process Payment button clicked', { totals, invoice: invoice?.id, servicesCount: invoice?.services?.length, medicationsCount: medications?.length });
                          setShowPaymentDialog(true);
                        }}
                        className="w-full gap-2"
                        disabled={totals.total <= 0 || isProcessing}
                      >
                        <CreditCard className="h-4 w-4" />
                        {isProcessing ? 'Processing...' : 'Process Payment'}
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <Save className="h-4 w-4" />
                        Save Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Tag className="h-4 w-4" />
                      Apply Senior Discount (10%)
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Tag className="h-4 w-4" />
                      Apply Staff Discount (20%)
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Generate Insurance Form
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Dialog via FormModal */}
        <FormModal
          isOpen={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          title="Confirm Payment"
          onSubmit={handleProcessPayment}
          submitText="Confirm Payment"
          cancelText="Cancel"
          isLoading={isProcessing}
          confirmLoadingText="Processing..."
        >
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="font-medium">{invoice.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice ID:</span>
                <span className="font-medium">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold">${totals.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>Payment Amount:</span>
                <span>${paymentAmount ? parseFloat(paymentAmount).toFixed(2) : totals.total.toFixed(2)}</span>
              </div>
              {paymentAmount && parseFloat(paymentAmount) < totals.total && (
                <div className="flex justify-between text-amber-600">
                  <span>Remaining Balance:</span>
                  <span>${(totals.total - parseFloat(paymentAmount)).toFixed(2)}</span>
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
        </FormModal>
      </PageLayout>
    </motion.div>
  );
};

export default InvoiceManagement;