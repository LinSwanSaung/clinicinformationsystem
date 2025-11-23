import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrencySync, refreshCurrencyCache } from '@/utils/currency';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Pill,
  DollarSign,
  AlertTriangle,
  Activity,
  Heart,
  Download,
  FileText,
} from 'lucide-react';

/**
 * Visit History Card Component
 * Displays essential visit information: Chief Complaint, Primary Diagnosis, Vitals, Allergies, Diagnosis History, and Medications
 */
const VisitHistoryCard = ({ visit, isExpanded = false, onToggleExpand, onDownloadPDF = null }) => {
  const { t } = useTranslation();
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  // Refresh currency cache on mount
  useEffect(() => {
    refreshCurrencyCache();
  }, []);

  const handleToggle = () => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    if (onToggleExpand) {
      onToggleExpand(newExpanded);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'insurance_pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no_invoice':
        return 'bg-muted text-muted-foreground border-border';
      case 'error':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial Payment';
      case 'pending':
        return 'Payment Pending';
      case 'insurance_pending':
        return 'Insurance Pending';
      case 'no_invoice':
        return 'No Invoice Generated';
      case 'error':
        return 'Error';
      default:
        return status || 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) {
      return 'N/A';
    }
    return formatCurrencySync(amount);
  };

  return (
    <Card className="overflow-hidden border border-border transition-shadow hover:shadow-md">
      {/* Header - Always Visible */}
      <div
        className="bg-muted/50 cursor-pointer p-4 transition-colors hover:bg-accent"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {localExpanded ? (
              <ChevronDown size={20} className="flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight size={20} className="flex-shrink-0 text-muted-foreground" />
            )}
            <div className="flex items-center space-x-4">
              <Calendar size={18} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-foreground">{formatDate(visit.visit_date)}</h3>
                <p className="text-sm text-muted-foreground">
                  {visit.visit_type || t('patient.visit.generalVisit')} - Dr. {visit.doctor_name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={`px-2 py-1 text-xs ${getStatusColor(visit.status)}`}>
              {visit.status?.toUpperCase()}
            </Badge>
            {visit.total_cost && (
              <Badge className={`px-2 py-1 text-xs ${getPaymentStatusColor(visit.payment_status)}`}>
                {formatCurrency(visit.total_cost)}
              </Badge>
            )}
            {onDownloadPDF && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadPDF(visit.id);
                }}
                className="h-8 px-2 hover:bg-accent"
                title={t('patient.visit.downloadVisitSummary')}
              >
                <Download size={16} className="text-blue-600" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {localExpanded && (
        <div className="space-y-6 p-4">
          {/* Chief Complaint / Reason for Visit */}
          {visit.chief_complaint && (
            <div>
              <h4 className="mb-2 flex items-center font-medium text-foreground">
                <FileText size={16} className="mr-2 text-blue-600" />
                {t('patient.visit.chiefComplaint') || 'Reason for Visit'}
              </h4>
              <p className="rounded-md bg-blue-50 p-3 text-sm text-muted-foreground dark:bg-blue-950/30">
                {visit.chief_complaint}
              </p>
            </div>
          )}

          {/* Primary Diagnosis */}
          {visit.diagnosis && (
            <div>
              <h4 className="mb-2 flex items-center font-medium text-foreground">
                <Activity size={16} className="mr-2 text-green-600" />
                {t('patient.visit.primaryDiagnosis')}
              </h4>
              <p className="rounded-md bg-green-50 p-3 text-sm text-muted-foreground dark:bg-green-950/30">
                {visit.diagnosis}
              </p>
            </div>
          )}

          {/* Vital Signs */}
          {visit.vitals && (
            <div>
              <h4 className="mb-3 flex items-center font-medium text-foreground">
                <Heart size={16} className="mr-2 text-pink-600" />
                {t('patient.visit.vitalSigns')}
              </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {visit.vitals.blood_pressure_systolic && visit.vitals.blood_pressure_diastolic && (
                  <div className="bg-muted/50 rounded-md border border-border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('patient.vitals.bloodPressure')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {visit.vitals.blood_pressure_systolic}/{visit.vitals.blood_pressure_diastolic}
                    </p>
                    <p className="text-xs text-muted-foreground">mmHg</p>
                  </div>
                )}
                {visit.vitals.heart_rate && (
                  <div className="bg-muted/50 rounded-md border border-border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('patient.vitals.heartRate')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {visit.vitals.heart_rate}
                    </p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </div>
                )}
                {visit.vitals.temperature && (
                  <div className="bg-muted/50 rounded-md border border-border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('patient.vitals.temperature')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {visit.vitals.temperature}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      °{visit.vitals.temperature_unit || 'F'}
                    </p>
                  </div>
                )}
                {visit.vitals.weight && (
                  <div className="bg-muted/50 rounded-md border border-border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('patient.vitals.weight')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">{visit.vitals.weight}</p>
                    <p className="text-xs text-muted-foreground">
                      {visit.vitals.weight_unit || 'kg'}
                    </p>
                  </div>
                )}
                {visit.vitals.oxygen_saturation && (
                  <div className="bg-muted/50 rounded-md border border-border p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      {t('patient.vitals.oxygenSaturation')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {visit.vitals.oxygen_saturation}
                    </p>
                    <p className="text-xs text-muted-foreground">%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergies Recorded During Visit */}
          {visit.allergies && visit.allergies.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center font-medium text-foreground">
                <AlertTriangle size={16} className="mr-2 text-red-600" />
                {t('patient.visit.allergiesRecorded')}
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visit.allergies.map((allergy) => (
                  <div
                    key={allergy.id || `allergy-${allergy.allergy_name}-${allergy.severity}`}
                    className="rounded-md border border-red-200 bg-red-50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{allergy.allergy_name}</p>
                        <p className="text-sm text-red-700">
                          {allergy.allergen_type} • {allergy.severity}
                        </p>
                        {allergy.diagnosed_date && (
                          <p className="mt-1 text-xs text-red-500">
                            {t('patient.visit.recorded')}: {formatDate(allergy.diagnosed_date)}
                          </p>
                        )}
                        {allergy.reaction && (
                          <p className="mt-1 text-xs text-red-600">{allergy.reaction}</p>
                        )}
                        {allergy.notes && (
                          <p className="mt-1 text-xs text-red-600">{allergy.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnoses Recorded During Visit */}
          {visit.visit_diagnoses && visit.visit_diagnoses.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center font-medium text-foreground">
                <Activity size={16} className="mr-2 text-purple-600" />
                {t('patient.visit.diagnosesFromVisit')}
              </h4>
              <div className="space-y-3">
                {visit.visit_diagnoses.map((diagnosis) => (
                  <div
                    key={
                      diagnosis.id ||
                      `diagnosis-${diagnosis.diagnosis_name}-${diagnosis.diagnosis_code}`
                    }
                    className="rounded-md border border-purple-200 bg-purple-50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-purple-900">{diagnosis.diagnosis_name}</p>
                          {diagnosis.diagnosis_code && (
                            <Badge className="bg-purple-100 text-xs text-purple-800">
                              {diagnosis.diagnosis_code}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <span className="text-sm text-purple-700">
                            {diagnosis.diagnosis_type} • {diagnosis.status}
                          </span>
                          {diagnosis.severity && (
                            <span className="text-sm text-purple-600">
                              {t('patient.visit.severity')}: {diagnosis.severity}
                            </span>
                          )}
                        </div>
                        {diagnosis.diagnosed_date && (
                          <p className="mt-1 text-xs text-purple-500">
                            {t('patient.visit.diagnosed')}: {formatDate(diagnosis.diagnosed_date)}
                          </p>
                        )}
                        {diagnosis.clinical_notes && (
                          <p className="mt-2 text-xs text-purple-600">{diagnosis.clinical_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications Prescribed */}
          {visit.prescriptions && visit.prescriptions.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center font-medium text-foreground">
                <Pill size={16} className="mr-2 text-blue-600" />
                {t('patient.visit.medicationsPrescribed')}
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visit.prescriptions.map((prescription) => (
                  <div
                    key={
                      prescription.id ||
                      `prescription-${prescription.medication_name}-${prescription.dosage}`
                    }
                    className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-blue-900">{prescription.medication_name}</p>
                        <p className="text-sm text-blue-700">
                          {prescription.dosage} • {prescription.frequency}
                        </p>
                        {prescription.duration && (
                          <p className="text-xs text-blue-600">
                            {t('patient.visit.duration')}: {prescription.duration}
                          </p>
                        )}
                        {prescription.instructions && (
                          <p className="mt-1 text-xs text-blue-600">{prescription.instructions}</p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs ${
                          prescription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {prescription.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visit Cost Summary */}
          {(visit.consultation_fee || visit.services_total || visit.total_cost) && (
            <div>
              <h4 className="mb-3 flex items-center font-medium text-foreground">
                <DollarSign size={16} className="mr-2 text-green-600" />
                Visit Cost Summary
              </h4>
              <div className="bg-muted/50 rounded-md border border-border p-4">
                <div className="space-y-3">
                  {visit.consultation_fee && visit.consultation_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('patient.visit.consultationFee')}:
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(visit.consultation_fee)}
                      </span>
                    </div>
                  )}

                  {/* Services Detail */}
                  {visit.invoice?.service_items && visit.invoice.service_items.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-foreground">
                        {t('patient.visit.services')} ({visit.invoice.service_items.length}{' '}
                        {t('patient.visit.items')}):
                      </div>
                      {visit.invoice.service_items.map((service, idx) => (
                        <div key={idx} className="flex justify-between pl-3 text-sm">
                          <span className="text-muted-foreground">
                            • {service.item_name} {service.quantity > 1 && `(x${service.quantity})`}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(service.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medications Detail */}
                  {visit.invoice?.medicine_items && visit.invoice.medicine_items.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-foreground">
                        {t('patient.visit.medications')} ({visit.invoice.medicine_items.length}{' '}
                        {t('patient.visit.dispensed')}):
                      </div>
                      {visit.invoice.medicine_items.map((med, idx) => (
                        <div key={idx} className="flex justify-between pl-3 text-sm">
                          <span className="text-muted-foreground">
                            • {med.item_name} {med.quantity > 1 && `(x${med.quantity})`}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(med.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show prescriptions that weren't dispensed */}
                  {visit.prescriptions &&
                    visit.prescriptions.length > 0 &&
                    (!visit.invoice?.medicine_items ||
                      visit.invoice.medicine_items.length === 0) && (
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-foreground">
                          {t('patient.visit.medicationsPrescribed')} ({visit.prescriptions.length}):
                        </div>
                        {visit.prescriptions.slice(0, 3).map((rx, idx) => (
                          <div key={idx} className="flex justify-between pl-3 text-sm">
                            <span className="text-muted-foreground">• {rx.medication_name}</span>
                            <span className="text-xs italic text-muted-foreground">
                              {t('patient.visit.notYetDispensed')}
                            </span>
                          </div>
                        ))}
                        {visit.prescriptions.length > 3 && (
                          <div className="pl-3 text-xs italic text-gray-500">
                            ...{' '}
                            {t('patient.visit.andMore', { count: visit.prescriptions.length - 3 })}
                          </div>
                        )}
                      </div>
                    )}

                  {visit.total_cost && visit.total_cost > 0 && (
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="font-semibold text-foreground">
                        {t('patient.visit.totalCost')}:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(visit.total_cost)}
                        </span>
                        <Badge className={getPaymentStatusColor(visit.payment_status)}>
                          {getPaymentStatusLabel(visit.payment_status)}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {(!visit.total_cost || visit.total_cost === 0) &&
                    visit.payment_status !== 'paid' && (
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="font-semibold text-foreground">
                          {t('patient.visit.paymentStatus')}:
                        </span>
                        <Badge className={getPaymentStatusColor('pending')}>
                          No Invoice Generated
                        </Badge>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default VisitHistoryCard;
