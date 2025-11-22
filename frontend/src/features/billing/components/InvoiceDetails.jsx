import { User, FileText, Pill } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import clinicSettingsService from '@/services/clinicSettingsService';
import { APP_CONFIG } from '@/constants/app';
import { formatCurrencySync, refreshCurrencyCache } from '@/utils/currency';

function get(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export default function InvoiceDetails({ invoice, fallback, payment, showPaymentSection = true }) {
  const [clinicSettings, setClinicSettings] = useState({
    clinic_name: null,
    clinic_logo_url: null,
    clinic_phone: null,
    clinic_email: null,
    clinic_address: null,
  });

  useEffect(() => {
    const loadClinicSettings = async () => {
      try {
        // Refresh currency cache to ensure latest settings are used
        await refreshCurrencyCache();
        
        const result = await clinicSettingsService.getSettings();
        if (result.success && result.data) {
          const data = result.data.data || result.data;
          setClinicSettings({
            clinic_name: data.clinic_name || null,
            clinic_logo_url: data.clinic_logo_url || null,
            clinic_phone: data.clinic_phone || null,
            clinic_email: data.clinic_email || null,
            clinic_address: data.clinic_address || null,
          });
        }
      } catch (error) {
        // Use defaults if error
      }
    };

    loadClinicSettings();
  }, []);

  const inv = invoice || fallback || {};
  const patient =
    inv.patient ||
    inv.patients ||
    get(inv, 'invoice', 'patient') ||
    get(inv, 'rawData', 'patients') ||
    {};
  const visit = inv.visit || inv.visits || {};
  const items = inv.invoice_items || [];

  const createdAt = inv.created_at;
  const invoiceNumber = inv.invoice_number;

  const totalAmount = Number(
    get(inv, 'total_amount', 'subtotal', 'total') || 0
  );
  const paidAmount = Number(
    get(inv, 'amount_paid', 'paid_amount') || 0
  );
  const balanceAmount = Number(
    get(inv, 'balance_due', 'balance') || 0
  );
  const discountAmount = Number(inv.discount_amount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {clinicSettings.clinic_logo_url && (
                <img
                  src={clinicSettings.clinic_logo_url}
                  alt="Clinic Logo"
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {clinicSettings.clinic_name || APP_CONFIG.SYSTEM_NAME}
                </h3>
                <p className="text-sm text-muted-foreground">Medical Invoice</p>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {clinicSettings.clinic_address && (
                <p className="text-xs text-muted-foreground">{clinicSettings.clinic_address}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {clinicSettings.clinic_phone && (
                  <p className="text-xs text-muted-foreground">Phone: {clinicSettings.clinic_phone}</p>
                )}
                {clinicSettings.clinic_email && (
                  <p className="text-xs text-muted-foreground">Email: {clinicSettings.clinic_email}</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date:</p>
            <p className="font-medium">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Time:</p>
            <p className="font-medium">
              {createdAt
                ? new Date(createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="border-b pb-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <User className="h-4 w-4" />
          Patient Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>
            <p className="mt-0.5 font-medium">
              {(patient.first_name || '') + ' ' + (patient.last_name || '')}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Patient #:</span>
            <p className="mt-0.5 font-medium">{patient.patient_number || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="mt-0.5 font-medium">{patient.phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>
            <p className="mt-0.5 font-medium">{patient.email || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Doctor:</span>
            <p className="mt-0.5 font-medium">
              {visit.doctor_name ||
                (visit.doctor
                  ? `${visit.doctor.first_name || ''} ${visit.doctor.last_name || ''}`.trim()
                  : 'N/A')}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Visit Type:</span>
            <p className="mt-0.5 font-medium capitalize">{visit.visit_type || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Services & Items */}
      <div className="border-b pb-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4 w-4" />
          Services & Items
        </h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found</p>
        ) : (
          <div className="space-y-2">
            {items
              .filter((i) => i.item_type === 'service')
              .map((item, idx) => (
                <div
                  key={`svc-${idx}`}
                  className="flex items-start justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    {item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(Number(item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">${Number(item.unit_price || 0).toFixed(2)} each</p>
                  </div>
                </div>
              ))}

            {items
              .filter((i) => i.item_type === 'medicine')
              .map((item, idx) => (
                <div
                  key={`med-${idx}`}
                  className="flex items-start justify-between rounded-lg border border-blue-100 bg-blue-50 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      <p className="font-medium">{item.item_name}</p>
                    </div>
                    {item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrencySync((Number(item.unit_price || 0) * (item.quantity || 1)))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrencySync(Number(item.unit_price || 0))} each</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Invoice Summary */}
      <div className="border-b pb-4">
        <h4 className="mb-3 text-base font-semibold">Invoice Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrencySync(totalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-medium">-{formatCurrencySync(discountAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid Amount:</span>
            <span className="font-medium text-green-600">{formatCurrencySync(paidAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-medium text-red-600">{formatCurrencySync(balanceAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total Amount:</span>
            <span>{formatCurrencySync(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* This Payment */}
      {showPaymentSection && payment && (
        <div className="rounded-lg bg-green-50 p-4">
          <h4 className="mb-2 font-semibold">This Payment</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-green-700">{formatCurrencySync(Number(payment.amount || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium capitalize">
                {String(payment.payment_method || '').replace('online_payment', 'Online Payment').replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-medium">{payment.payment_reference || '—'}</span>
            </div>
            {payment.payment_notes && (
              <div>
                <span className="text-gray-600">Notes:</span>
                <p className="mt-1 text-gray-700">{payment.payment_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - System Attribution */}
      <div className="mt-8 border-t-2 pt-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            This invoice was generated by {APP_CONFIG.SYSTEM_NAME} {APP_CONFIG.SYSTEM_DESCRIPTION}
          </p>
          {clinicSettings.clinic_name && (
            <p className="text-xs text-muted-foreground">
              For {clinicSettings.clinic_name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Invoice #: {invoiceNumber || 'N/A'} | Generated on{' '}
            {createdAt
              ? new Date(createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}


