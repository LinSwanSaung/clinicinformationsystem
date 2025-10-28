import { useState, useEffect } from 'react';
import { Plus, X, Search, DollarSign, Package, Check, Trash2 } from 'lucide-react';
import serviceService from '../services/serviceService';
import invoiceService from '../services/invoiceService';

const ServiceSelector = ({ visitId, onServicesAdded }) => {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [addedServices, setAddedServices] = useState([]); // Services already in invoice
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

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
      console.error('Error loading services:', error);
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
        console.log('Fetching invoice by visit ID:', visitId);
        const response = await invoiceService.getInvoiceByVisit(visitId);
        console.log('Raw invoice response:', response);
        invoiceData = response;
      } catch (error) {
        console.log('No existing invoice found by visit, will create new one...', error);
      }
      
      // If we have an invoice in state but no data from API, try by ID
      if (!invoiceData && invoice && invoice.id) {
        try {
          console.log('Fetching invoice by ID:', invoice.id);
          invoiceData = await invoiceService.getInvoiceById(invoice.id);
          console.log('Invoice fetched by ID:', invoiceData);
        } catch (error) {
          console.error('Error fetching invoice by ID:', error);
        }
      }
      
      // If still no invoice exists, create one
      if (!invoiceData) {
        try {
          invoiceData = await invoiceService.createInvoice(visitId);
          console.log('Invoice created successfully:', invoiceData);
        } catch (createError) {
          console.error('Error creating invoice:', createError);
          throw new Error('Failed to create invoice. Please ensure you have an active visit.');
        }
      }
      
      setInvoice(invoiceData);
      
      console.log('Final invoice loaded:', invoiceData);
      console.log('Invoice items:', invoiceData?.invoice_items);
      console.log('Invoice items type:', Array.isArray(invoiceData?.invoice_items));
      
      // Load existing services from invoice
      if (invoiceData && invoiceData.invoice_items && Array.isArray(invoiceData.invoice_items)) {
        const existingServices = invoiceData.invoice_items
          .filter(item => {
            console.log('Processing item:', item);
            return item.item_type === 'service';
          })
          .map(item => ({
            id: item.id,
            service_id: item.item_id,
            service_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes
          }));
        console.log('Existing services found:', existingServices);
        console.log('Setting addedServices to:', existingServices.length, 'items');
        setAddedServices(existingServices);
      } else {
        console.log('No invoice items found or not an array, clearing addedServices');
        setAddedServices([]);
      }
    } catch (error) {
      console.error('Error in loadOrCreateInvoice:', error);
      setError(error.message || 'Failed to load or create invoice. Please try again.');
    }
  };

  const filteredServices = services.filter(service =>
    service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.service_code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const addService = (service) => {
    // Check if already added to invoice or selected
    const existsInInvoice = addedServices.find(s => s.service_id === service.id);
    const existsInSelected = selectedServices.find(s => s.service_id === service.id);
    if (existsInInvoice || existsInSelected) return;

    setSelectedServices([...selectedServices, {
      service_id: service.id,
      service_name: service.service_name,
      quantity: 1,
      unit_price: parseFloat(service.default_price),
      notes: ''
    }]);
  };

  const isServiceAdded = (serviceId) => {
    return addedServices.some(s => s.service_id === serviceId) || 
           selectedServices.some(s => s.service_id === serviceId);
  };

  const removeService = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const updateService = (index, field, value) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedServices(updated);
  };

  const handleSave = async () => {
    if (!invoice) {
      alert('No invoice found. Please try again.');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Please add at least one service.');
      return;
    }

    try {
      setSaving(true);
      
      // Add each service to the invoice
      console.log('Adding services to invoice:', invoice.id);
      for (const service of selectedServices) {
        console.log('Adding service:', service);
        const result = await invoiceService.addServiceItem(invoice.id, service);
        console.log('Service added, result:', result);
      }

      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload invoice to update added services
      console.log('Services saved, reloading invoice...');
      await loadOrCreateInvoice();
      console.log('Invoice reloaded, addedServices state:', addedServices);

      if (onServicesAdded) {
        onServicesAdded();
      }

      alert('Services added to invoice successfully!');
      setSelectedServices([]);
    } catch (error) {
      console.error('Error saving services:', error);
      alert('Failed to save services. Please try again.');
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
    other: 'Other'
  };

  // Check if visitId is provided
  if (!visitId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800">No active visit found. Please start a consultation first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadServices();
                loadOrCreateInvoice();
              }}
              className="ml-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Already Added Services - Always visible for pending/partial invoices */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-green-800">
            <Check className="w-4 h-4" />
            Services in Invoice ({addedServices.length})
          </h3>
          {invoice && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
              invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
              invoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {invoice.status === 'paid' ? 'Paid' :
               invoice.status === 'partial' ? 'Partial Payment' :
               invoice.status === 'cancelled' ? 'Cancelled' :
               'Pending Payment'}
            </span>
          )}
        </div>
        {addedServices.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {addedServices.map((service, index) => (
                <div key={index} className="bg-white border border-green-200 rounded p-2 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                    <div className="text-xs text-gray-600">
                      Qty: {service.quantity} × ${parseFloat(service.unit_price).toFixed(2)} = ${(service.quantity * service.unit_price).toFixed(2)}
                    </div>
                    {service.notes && (
                      <div className="text-xs text-gray-500 mt-0.5">{service.notes}</div>
                    )}
                  </div>
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-green-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="font-bold text-green-700">
                  ${addedServices.reduce((sum, s) => sum + (s.quantity * s.unit_price), 0).toFixed(2)}
                </span>
              </div>
              {invoice && invoice.status === 'pending' && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 These services will be sent to cashier for payment processing
                </p>
              )}
              {invoice && invoice.status === 'paid' && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Invoice completed and payment received
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white border border-green-200 rounded p-3 text-center">
            <p className="text-sm text-gray-500">No services added yet</p>
            <p className="text-xs text-gray-400 mt-1">Add services below to include them in the invoice</p>
          </div>
        )}
      </div>

      {/* Only show "Add Billable Services" section if invoice is not paid/cancelled */}
      {invoice && !['paid', 'cancelled'].includes(invoice.status) && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-3 mt-3">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Add Billable Services
            </h3>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

          {/* Available Services by Category */}
          {loading ? (
            <div className="text-center py-3 text-sm text-gray-500">Loading services...</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-3">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {categoryServices.map((service) => {
                      const isAdded = isServiceAdded(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => addService(service)}
                          className={`flex items-center justify-between p-1.5 text-left border rounded transition-colors text-xs ${
                            isAdded
                              ? 'border-green-300 bg-green-50 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          disabled={isAdded}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isAdded ? 'text-green-700' : 'text-gray-900'}`}>
                              {service.service_name}
                            </div>
                            <div className={isAdded ? 'text-green-600' : 'text-gray-500'}>
                              {service.service_code}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <span className={`font-semibold whitespace-nowrap ${isAdded ? 'text-green-600' : 'text-blue-600'}`}>
                              ${parseFloat(service.default_price).toFixed(2)}
                            </span>
                            {isAdded ? (
                              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
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
            <div className="bg-white rounded-lg border border-gray-200 p-3 mt-3">
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Selected Services ({selectedServices.length})
              </h3>

              <div className="space-y-2">
              {selectedServices.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded p-2 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                    </div>
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={service.quantity}
                        onChange={(e) => updateService(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.unit_price}
                        onChange={(e) => updateService(index, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={service.notes}
                      onChange={(e) => updateService(index, 'notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(parseFloat(service.quantity) * parseFloat(service.unit_price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold text-gray-900">Subtotal:</span>
                <span className="text-base font-bold text-green-600">
                  ${selectedServices.reduce((sum, s) => sum + (parseFloat(s.quantity) * parseFloat(s.unit_price)), 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-3">
          <p className="text-sm text-blue-800 font-medium">
            {invoice.status === 'paid' 
              ? '✓ Invoice has been paid and completed' 
              : '✗ Invoice has been cancelled'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            No additional services can be added to this invoice
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
