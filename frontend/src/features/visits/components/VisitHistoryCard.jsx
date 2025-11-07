import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Pill, 
  DollarSign,
  FileText,
  AlertTriangle,
  Activity,
  Heart,
  Download
} from 'lucide-react';

/**
 * Visit History Card Component
 * Displays essential visit information: Chief Complaint, Primary Diagnosis, Vitals, Allergies, Diagnosis History, and Medications
 */
const VisitHistoryCard = ({ 
  visit, 
  isExpanded = false, 
  onToggleExpand,
  showDetailsButton = true,
  onDownloadPDF = null 
}) => {
  const { t } = useTranslation();
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

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
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial Payment';
      case 'pending': return 'Payment Pending';
      case 'insurance_pending': return 'Insurance Pending';
      case 'no_invoice': return 'No Invoice Generated';
      case 'error': return 'Error';
      default: return status || 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header - Always Visible */}
      <div 
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {localExpanded ? 
              <ChevronDown size={20} className="text-gray-500 flex-shrink-0" /> : 
              <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
            }
            <div className="flex items-center space-x-4">
              <Calendar size={18} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {formatDate(visit.visit_date)}
                </h3>
                <p className="text-sm text-gray-600">
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
                className="h-8 px-2 hover:bg-blue-50"
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
        <div className="p-4 space-y-6">
          
          {/* Primary Diagnosis */}
          {visit.diagnosis && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <Activity size={16} className="mr-2 text-green-600" />
                {t('patient.visit.primaryDiagnosis')}
              </h4>
              <p className="text-gray-600 text-sm bg-green-50 p-3 rounded-md">
                {visit.diagnosis}
              </p>
            </div>
          )}

          {/* Vital Signs */}
          {visit.vitals && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Heart size={16} className="mr-2 text-pink-600" />
                {t('patient.visit.vitalSigns')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {visit.vitals.blood_pressure_systolic && visit.vitals.blood_pressure_diastolic && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('patient.vitals.bloodPressure')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {visit.vitals.blood_pressure_systolic}/{visit.vitals.blood_pressure_diastolic}
                    </p>
                    <p className="text-xs text-gray-500">mmHg</p>
                  </div>
                )}
                {visit.vitals.heart_rate && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('patient.vitals.heartRate')}</p>
                    <p className="text-lg font-semibold text-gray-900">{visit.vitals.heart_rate}</p>
                    <p className="text-xs text-gray-500">bpm</p>
                  </div>
                )}
                {visit.vitals.temperature && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('patient.vitals.temperature')}</p>
                    <p className="text-lg font-semibold text-gray-900">{visit.vitals.temperature}</p>
                    <p className="text-xs text-gray-500">°{visit.vitals.temperature_unit || 'F'}</p>
                  </div>
                )}
                {visit.vitals.weight && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('patient.vitals.weight')}</p>
                    <p className="text-lg font-semibold text-gray-900">{visit.vitals.weight}</p>
                    <p className="text-xs text-gray-500">{visit.vitals.weight_unit || 'kg'}</p>
                  </div>
                )}
                {visit.vitals.oxygen_saturation && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t('patient.vitals.oxygenSaturation')}</p>
                    <p className="text-lg font-semibold text-gray-900">{visit.vitals.oxygen_saturation}</p>
                    <p className="text-xs text-gray-500">%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergies Recorded During Visit */}
          {visit.allergies && visit.allergies.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-red-600" />
                {t('patient.visit.allergiesRecorded')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visit.allergies.map((allergy) => (
                  <div key={allergy.id || `allergy-${allergy.allergy_name}-${allergy.severity}`} className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{allergy.allergy_name}</p>
                        <p className="text-sm text-red-700">
                          {allergy.allergen_type} • {allergy.severity}
                        </p>
                        {allergy.diagnosed_date && (
                          <p className="text-xs text-red-500 mt-1">
                            {t('patient.visit.recorded')}: {formatDate(allergy.diagnosed_date)}
                          </p>
                        )}
                        {allergy.reaction && (
                          <p className="text-xs text-red-600 mt-1">{allergy.reaction}</p>
                        )}
                        {allergy.notes && (
                          <p className="text-xs text-red-600 mt-1">{allergy.notes}</p>
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
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Activity size={16} className="mr-2 text-purple-600" />
                {t('patient.visit.diagnosesFromVisit')}
              </h4>
              <div className="space-y-3">
                {visit.visit_diagnoses.map((diagnosis) => (
                  <div key={diagnosis.id || `diagnosis-${diagnosis.diagnosis_name}-${diagnosis.diagnosis_code}`} className="bg-purple-50 border border-purple-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-purple-900">{diagnosis.diagnosis_name}</p>
                          {diagnosis.diagnosis_code && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              {diagnosis.diagnosis_code}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
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
                          <p className="text-xs text-purple-500 mt-1">
                            {t('patient.visit.diagnosed')}: {formatDate(diagnosis.diagnosed_date)}
                          </p>
                        )}
                        {diagnosis.clinical_notes && (
                          <p className="text-xs text-purple-600 mt-2">{diagnosis.clinical_notes}</p>
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
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Pill size={16} className="mr-2 text-blue-600" />
                {t('patient.visit.medicationsPrescribed')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visit.prescriptions.map((prescription) => (
                  <div key={prescription.id || `prescription-${prescription.medication_name}-${prescription.dosage}`} className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-blue-900">{prescription.medication_name}</p>
                        <p className="text-sm text-blue-700">
                          {prescription.dosage} • {prescription.frequency}
                        </p>
                        {prescription.duration && (
                          <p className="text-xs text-blue-600">{t('patient.visit.duration')}: {prescription.duration}</p>
                        )}
                        {prescription.instructions && (
                          <p className="text-xs text-blue-600 mt-1">{prescription.instructions}</p>
                        )}
                      </div>
                      <Badge className={`text-xs ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
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
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <DollarSign size={16} className="mr-2 text-green-600" />
                Visit Cost Summary
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="space-y-3">
                  {visit.consultation_fee && visit.consultation_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('patient.visit.consultationFee')}:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(visit.consultation_fee)}</span>
                    </div>
                  )}
                  
                  {/* Services Detail */}
                  {visit.invoice?.service_items && visit.invoice.service_items.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-gray-700">{t('patient.visit.services')} ({visit.invoice.service_items.length} {t('patient.visit.items')}):</div>
                      {visit.invoice.service_items.map((service, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-3">
                          <span className="text-gray-600">
                            • {service.item_name} {service.quantity > 1 && `(x${service.quantity})`}
                          </span>
                          <span className="font-medium text-gray-900">{formatCurrency(service.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medications Detail */}
                  {visit.invoice?.medicine_items && visit.invoice.medicine_items.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-gray-700">
                        {t('patient.visit.medications')} ({visit.invoice.medicine_items.length} {t('patient.visit.dispensed')}):
                      </div>
                      {visit.invoice.medicine_items.map((med, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-3">
                          <span className="text-gray-600">
                            • {med.item_name} {med.quantity > 1 && `(x${med.quantity})`}
                          </span>
                          <span className="font-medium text-gray-900">{formatCurrency(med.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show prescriptions that weren't dispensed */}
                  {visit.prescriptions && visit.prescriptions.length > 0 && 
                   (!visit.invoice?.medicine_items || visit.invoice.medicine_items.length === 0) && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-gray-700">
                        {t('patient.visit.medicationsPrescribed')} ({visit.prescriptions.length}):
                      </div>
                      {visit.prescriptions.slice(0, 3).map((rx, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-3">
                          <span className="text-gray-600">• {rx.medication_name}</span>
                          <span className="text-xs text-gray-500 italic">{t('patient.visit.notYetDispensed')}</span>
                        </div>
                      ))}
                      {visit.prescriptions.length > 3 && (
                        <div className="text-xs text-gray-500 italic pl-3">
                          ... {t('patient.visit.andMore', { count: visit.prescriptions.length - 3 })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {visit.total_cost && visit.total_cost > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                      <span className="font-semibold text-gray-700">{t('patient.visit.totalCost')}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(visit.total_cost)}</span>
                        <Badge className={getPaymentStatusColor(visit.payment_status)}>
                          {getPaymentStatusLabel(visit.payment_status)}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {(!visit.total_cost || visit.total_cost === 0) && visit.payment_status !== 'paid' && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="font-semibold text-gray-700">{t('patient.visit.paymentStatus')}:</span>
                      <Badge className={getPaymentStatusColor('pending')}>
                        No Invoice Generated
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Actions */}
          {showDetailsButton && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  <FileText size={16} className="mr-2" />
                  View Full Record
                </Button>
                <Button variant="outline" size="sm">
                  <Pill size={16} className="mr-2" />
                  View Prescriptions
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default VisitHistoryCard;