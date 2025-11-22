import { useState, useEffect } from 'react';
import { Plus, X, Search, DollarSign, Package, Check, Trash2 } from 'lucide-react';
import serviceService from '@/services/serviceService';
import invoiceService from '@/features/billing/services/invoiceService';
import logger from '@/utils/logger';
import { useFeedback } from '@/contexts/FeedbackContext';
import { formatCurrencySync, refreshCurrencyCache, getCurrencySymbol } from '@/utils/currency';

const ServiceSelector = ({ visitId, onServicesAdded }) => {
  const { showSuccess, showError, showWarning } = useFeedback();
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [addedServices, setAddedServices] = useState([]); // Services already in invoice
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Refresh currency cache on mount
    refreshCurrencyCache();
  }, []);

  useEffect(() => {
    if (visitId) {
      loadServices();
      loadOrCreateInvoice();
    }
  }, [visitId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceService.getActiveServices();
      const data = response.data || response || [];
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error loading services:', error);
      setError('Failed to load services. Please check your connection and try refreshing.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateInvoice = async () => {
    try {
      setError(null);
      let invoiceData = null;

      // Always try to get by visit ID first (most reliable)
      try {
        logger.debug('Fetching invoice by visit ID:', visitId);
        const response = await invoiceService.getInvoiceByVisit(visitId);
        logger.debug('Raw invoice response:', response);
        invoiceData = response;
      } catch (error) {
        logger.debug('No existing invoice found by visit, will create new one...', error);
      }

      // If we have an invoice in state but no data from API, try by ID
      if (!invoiceData && invoice && invoice.id) {
        try {
          logger.debug('Fetching invoice by ID:', invoice.id);
          invoiceData = await invoiceService.getInvoiceById(invoice.id);
          logger.debug('Invoice fetched by ID:', invoiceData);
        } catch (error) {
          logger.error('Error fetching invoice by ID:', error);
        }
      }

      // If still no invoice exists, create one
      if (!invoiceData) {
        try {
          invoiceData = await invoiceService.createInvoice(visitId);
          logger.debug('Invoice created successfully:', invoiceData);
        } catch (createError) {
          // Handle race condition: if invoice was created by another request, fetch it
          const errorMsg = createError?.message?.toLowerCase() || '';
          if (
            errorMsg.includes('already exists') ||
            errorMsg.includes('duplicate') ||
            errorMsg.includes('unique')
          ) {
            logger.debug('Invoice already exists (race condition), fetching existing invoice...');
            try {
              invoiceData = await invoiceService.getInvoiceByVisit(visitId);
              logger.debug('Fetched existing invoice after race condition:', invoiceData);
            } catch (fetchError) {
              logger.error('Error fetching invoice after race condition:', fetchError);
              throw new Error('Failed to create or fetch invoice. Please try again.');
            }
          } else {
            logger.error('Error creating invoice:', createError);
            throw new Error('Failed to create invoice. Please ensure you have an active visit.');
          }
        }
      }

      setInvoice(invoiceData);

      logger.debug('Final invoice loaded:', invoiceData);
      logger.debug('Invoice items:', invoiceData?.invoice_items);
      logger.debug('Invoice items type:', Array.isArray(invoiceData?.invoice_items));

      // Load existing services from invoice
      if (invoiceData && invoiceData.invoice_items && Array.isArray(invoiceData.invoice_items)) {
        const existingServices = invoiceData.invoice_items
          .filter((item) => {
            logger.debug('Processing item:', item);
            return item.item_type === 'service';
          })
          .map((item) => ({
            id: item.id, // Invoice item ID (needed for removal)
            service_id: item.item_id,
            service_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes,
          }));
        logger.debug('Existing services found:', existingServices);
        logger.debug('Setting addedServices to:', existingServices.length, 'items');
        setAddedServices(existingServices);
      } else {
        logger.debug('No invoice items found or not an array, clearing addedServices');
        setAddedServices([]);
      }
    } catch (error) {
      logger.error('Error in loadOrCreateInvoice:', error);
      setError(error.message || 'Failed to load or create invoice. Please try again.');
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const addService = (service) => {
    // Check if already added to invoice or selected
    const existsInInvoice = addedServices.find((s) => s.service_id === service.id);
    const existsInSelected = selectedServices.find((s) => s.service_id === service.id);
    if (existsInInvoice || existsInSelected) {
      return;
    }

    setSelectedServices([
      ...selectedServices,
      {
        service_id: service.id,
        service_name: service.service_name,
        quantity: 1,
        unit_price: parseFloat(service.default_price),
        notes: '',
      },
    ]);
  };

  const isServiceAdded = (serviceId) => {
    return (
      addedServices.some((s) => s.service_id === serviceId) ||
      selectedServices.some((s) => s.service_id === serviceId)
    );
  };

  const removeService = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const removeAddedService = async (itemId) => {
    if (!invoice) {
      showError('No invoice found. Please try again.');
      return;
    }

    // Only allow removal if invoice is pending (during consultation)
    if (invoice.status !== 'pending' && invoice.status !== 'draft') {
      showError('Cannot remove services from a paid or completed invoice.');
      return;
    }

    try {
      setSaving(true);
      await invoiceService.removeInvoiceItem(invoice.id, itemId);

      // Reload invoice to update added services
      await loadOrCreateInvoice();

      if (onServicesAdded) {
        onServicesAdded();
      }

      showSuccess('Service removed from invoice successfully!');
    } catch (error) {
      logger.error('Error removing service:', error);
      showError('Failed to remove service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateService = (index, field, value) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedServices(updated);
  };

  const handleSave = async () => {
    if (!invoice) {
      showError('No invoice found. Please try again.');
      return;
    }

    if (selectedServices.length === 0) {
      showWarning('Please add at least one service.');
      return;
    }

    try {
      setSaving(true);

      // Add each service to the invoice
      logger.debug('Adding services to invoice:', invoice.id);
      for (const service of selectedServices) {
        logger.debug('Adding service:', service);
        const result = await invoiceService.addServiceItem(invoice.id, service);
        logger.debug('Service added, result:', result);
      }

      // Small delay to ensure database is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload invoice to update added services
      logger.debug('Services saved, reloading invoice...');
      await loadOrCreateInvoice();
      logger.debug('Invoice reloaded, addedServices state:', addedServices);

      if (onServicesAdded) {
        onServicesAdded();
      }

      showSuccess('Services added to invoice successfully!');
      setSelectedServices([]);
    } catch (error) {
      logger.error('Error saving services:', error);
      showError('Failed to save services. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Group services by category
  const groupedServices = filteredServices.reduce((groups, service) => {
    const category = service.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {});

  const categoryLabels = {
    consultation: 'Consultation',
    procedure: 'Procedures',
    laboratory: 'Laboratory',
    imaging: 'Imaging',
    pharmacy: 'Pharmacy',
    other: 'Other',
  };

  // Check if visitId is provided
  if (!visitId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="text-yellow-800">No active visit found. Please start a consultation first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start justify-between">
            <p className="flex-1 text-sm text-red-800">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadServices();
                loadOrCreateInvoice();
              }}
              className="ml-2 text-xs text-red-600 underline hover:text-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Already Added Services - Always visible for pending/partial invoices */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <Check className="h-4 w-4" />
            Services in Invoice ({addedServices.length})
          </h3>
          {invoice && (
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : invoice.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-700'
                    : invoice.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
              }`}
            >
              {invoice.status === 'paid'
                ? 'Paid'
                : invoice.status === 'partial'
                  ? 'Partial Payment'
                  : invoice.status === 'cancelled'
                    ? 'Cancelled'
                    : 'Pending Payment'}
            </span>
          )}
        </div>
        {addedServices.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {addedServices.map((service, index) => (
                <div
                  key={service.id || index}
                  className="flex items-center justify-between rounded border border-green-200 bg-white p-2"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                    <div className="text-xs text-gray-600">
                      Qty: {service.quantity} × {formatCurrencySync(parseFloat(service.unit_price))}{' '}
                      = {formatCurrencySync(service.quantity * service.unit_price)}
                    </div>
                    {service.notes && (
                      <div className="mt-0.5 text-xs text-gray-500">{service.notes}</div>
                    )}
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    {invoice && (invoice.status === 'pending' || invoice.status === 'draft') ? (
                      <button
                        type="button"
                        onClick={() => removeAddedService(service.id)}
                        disabled={saving}
                        className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove service from invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-green-200 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="font-bold text-green-700">
                  {formatCurrencySync(
                    addedServices.reduce((sum, s) => sum + s.quantity * s.unit_price, 0)
                  )}
                </span>
              </div>
              {invoice && invoice.status === 'pending' && (
                <p className="mt-1 text-xs text-gray-500">
                  💡 These services will be sent to cashier for payment processing
                </p>
              )}
              {invoice && invoice.status === 'paid' && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Invoice completed and payment received
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="rounded border border-green-200 bg-white p-3 text-center">
            <p className="text-sm text-gray-500">No services added yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Add services below to include them in the invoice
            </p>
          </div>
        )}
      </div>

      {/* Only show "Add Billable Services" section if invoice is not paid/cancelled */}
      {invoice && !['paid', 'cancelled'].includes(invoice.status) && (
        <>
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Package className="h-4 w-4 text-blue-600" />
              Add Billable Services
            </h3>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Available Services by Category */}
            {loading ? (
              <div className="py-3 text-center text-sm text-gray-500">Loading services...</div>
            ) : (
              <div className="max-h-48 space-y-3 overflow-y-auto">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h4 className="mb-1.5 text-xs font-semibold text-gray-700">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                      {categoryServices.map((service) => {
                        const isAdded = isServiceAdded(service.id);
                        return (
                          <button
                            key={service.id}
                            onClick={() => addService(service)}
                            className={`flex items-center justify-between rounded border p-1.5 text-left text-xs transition-colors ${
                              isAdded
                                ? 'cursor-not-allowed border-green-300 bg-green-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            disabled={isAdded}
                          >
                            <div className="min-w-0 flex-1">
                              <div
                                className={`truncate font-medium ${isAdded ? 'text-green-700' : 'text-gray-900'}`}
                              >
                                {service.service_name}
                              </div>
                              <div className={isAdded ? 'text-green-600' : 'text-gray-500'}>
                                {service.service_code}
                              </div>
                            </div>
                            <div className="ml-2 flex items-center gap-1.5">
                              <span
                                className={`whitespace-nowrap font-semibold ${isAdded ? 'text-green-600' : 'text-blue-600'}`}
                              >
                                {formatCurrencySync(parseFloat(service.default_price))}
                              </span>
                              {isAdded ? (
                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Services */}
          {selectedServices.length > 0 && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-4 w-4 text-green-600" />
                Selected Services ({selectedServices.length})
              </h3>

              <div className="space-y-2">
                {selectedServices.map((service, index) => (
                  <div key={index} className="space-y-2 rounded border border-gray-200 p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {service.service_name}
                        </div>
                      </div>
                      <button
                        onClick={() => removeService(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-700">
                          Price ({getCurrencySymbol()})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={service.unit_price}
                          onChange={(e) => updateService(index, 'unit_price', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-transparent focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-700">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={service.notes}
                        onChange={(e) => updateService(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-transparent focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                      <span className="text-xs text-gray-500">Total:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrencySync(
                          parseFloat(service.quantity) * parseFloat(service.unit_price)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-base font-bold text-green-600">
                    {formatCurrencySync(
                      selectedServices.reduce(
                        (sum, s) => sum + parseFloat(s.quantity) * parseFloat(s.unit_price),
                        0
                      )
                    )}
                  </span>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Services to Invoice'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Show message if invoice is completed */}
      {invoice && ['paid', 'cancelled'].includes(invoice.status) && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-sm font-medium text-blue-800">
            {invoice.status === 'paid'
              ? '✓ Invoice has been paid and completed'
              : '✗ Invoice has been cancelled'}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            No additional services can be added to this invoice
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
