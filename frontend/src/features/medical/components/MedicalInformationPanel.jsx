import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  AlertCircle,
  ClipboardList,
  Pill,
  Info,
  Stethoscope,
  CalendarDays,
  Calendar,
} from 'lucide-react';

const MedicalInformationPanel = ({
  patient,
  onAddAllergy,
  onAddDiagnosis,
  className = '',
  showActionButtons = true,
  fullDiagnoses = [], // Full diagnosis objects for detailed modal view
}) => {
  const { t } = useTranslation();
  const [selectedAllergy, setSelectedAllergy] = useState(null);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  // Handle allergy badge click
  const handleAllergyClick = (allergy) => {
    // If allergy is a string (just name), create a minimal object
    // If it's an object, use it directly
    const allergyObj = typeof allergy === 'string' ? { allergy_name: allergy } : allergy;
    setSelectedAllergy(allergyObj);
    setIsAllergyModalOpen(true);
  };

  // Handle diagnosis click
  const handleDiagnosisClick = (diagnosis, index) => {
    // Try to find full diagnosis data
    const fullDiagnosis = fullDiagnoses[index] || diagnosis;
    setSelectedDiagnosis(fullDiagnosis);
    setIsDiagnosisModalOpen(true);
  };

  return (
    <Card className={`p-6 lg:col-span-2 ${className}`}>
      <div className="mb-6 flex items-center space-x-3">
        <FileText size={24} className="text-blue-600" />
        <h3 className="text-lg font-bold">{t('patient.medicalRecords.medicalInformation')}</h3>
      </div>

      <div className="space-y-6">
        {/* Known Allergies */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center text-sm font-bold text-foreground">
              <AlertCircle size={18} className="mr-2 text-amber-500" />
              {t('patient.medicalRecords.knownAllergies')}
            </h4>
            {showActionButtons && onAddAllergy && (
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1 text-xs"
                onClick={onAddAllergy}
              >
                + {t('patient.medicalRecords.addAllergy')}
              </Button>
            )}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => {
                  const allergyName =
                    typeof allergy === 'string' ? allergy : allergy?.allergy_name || 'Unknown';
                  const severity = typeof allergy === 'object' ? allergy?.severity : null;

                  // Determine badge styling based on severity
                  let badgeClasses =
                    'cursor-pointer px-3 py-1 text-sm font-medium transition-colors hover:opacity-90 ';

                  if (severity === 'life-threatening') {
                    badgeClasses +=
                      'border-2 border-red-700 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-700 dark:text-white';
                  } else if (severity === 'severe') {
                    badgeClasses +=
                      'border-2 border-red-600 bg-red-500 text-white hover:bg-red-600 dark:border-red-500 dark:bg-red-600 dark:text-white';
                  } else if (severity === 'moderate') {
                    badgeClasses +=
                      'border-2 border-orange-600 bg-orange-500 text-white hover:bg-orange-600 dark:border-orange-500 dark:bg-orange-600 dark:text-white';
                  } else {
                    // Mild or no severity - use lighter red with dark text for contrast
                    badgeClasses +=
                      'border-2 border-red-400 bg-red-200 text-red-900 hover:bg-red-300 dark:border-red-600 dark:bg-red-800 dark:text-red-100';
                  }

                  return (
                    <Badge
                      key={index}
                      variant="destructive"
                      className={badgeClasses}
                      onClick={() => handleAllergyClick(allergy)}
                    >
                      {allergyName}
                      {severity && ` (${severity})`}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-base text-amber-700 dark:text-amber-300">
                {t('patient.medicalRecords.noKnownAllergies')}
              </p>
            )}
          </div>
        </div>

        {/* Diagnosis History */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center text-sm font-bold text-foreground">
              <ClipboardList size={18} className="mr-2 text-blue-500" />
              {t('patient.medicalRecords.diagnosisHistory')}
            </h4>
            {showActionButtons && onAddDiagnosis && (
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1 text-xs"
                onClick={onAddDiagnosis}
              >
                + {t('patient.medicalRecords.addDiagnosis')}
              </Button>
            )}
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            {patient.diagnosisHistory && patient.diagnosisHistory.length > 0 ? (
              <div className="space-y-2">
                {patient.diagnosisHistory.map((diagnosis, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    onClick={() => handleDiagnosisClick(diagnosis, index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDiagnosisClick(diagnosis, index);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{diagnosis.condition}</span>
                      {fullDiagnoses[index]?.icd_10_code && (
                        <Badge variant="outline" className="text-xs">
                          {fullDiagnoses[index].icd_10_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{diagnosis.date}</span>
                      <Info className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-blue-700 dark:text-blue-300">
                {t('patient.medicalRecords.noDiagnosisHistory')}
              </p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center text-sm font-bold text-foreground">
              <Pill size={18} className="mr-2 text-green-500" />
              {t('patient.medicalRecords.currentMedications')}
            </h4>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <div className="space-y-2">
                {patient.currentMedications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-medium">{medication.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({medication.dosage})
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{medication.frequency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-green-700 dark:text-green-300">
                {t('patient.medicalRecords.noCurrentMedications')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Allergy Details Modal */}
      {selectedAllergy && (
        <Dialog open={isAllergyModalOpen} onOpenChange={setIsAllergyModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                {t('patient.medicalRecords.allergyDetails', 'Allergy Details')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Allergy Name & Severity */}
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAllergy.allergy_name || 'Unknown'}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAllergy.severity && (
                    <Badge
                      variant="destructive"
                      className={
                        selectedAllergy.severity === 'life-threatening'
                          ? 'bg-red-700'
                          : selectedAllergy.severity === 'severe'
                            ? 'bg-red-600'
                            : selectedAllergy.severity === 'moderate'
                              ? 'bg-orange-500'
                              : 'bg-yellow-500 text-black'
                      }
                    >
                      {selectedAllergy.severity}
                    </Badge>
                  )}
                  {selectedAllergy.allergen_type && (
                    <Badge variant="outline" className="capitalize">
                      {selectedAllergy.allergen_type}
                    </Badge>
                  )}
                  {selectedAllergy.is_active !== undefined && (
                    <Badge
                      variant="outline"
                      className={
                        selectedAllergy.is_active
                          ? 'border-green-600 text-green-600'
                          : 'border-gray-600 text-gray-600'
                      }
                    >
                      {selectedAllergy.is_active
                        ? t('common.active', 'Active')
                        : t('common.inactive', 'Inactive')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Reaction Description */}
              {selectedAllergy.reaction && (
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <Label>
                      {t('patient.medicalRecords.reactionDescription', 'Reaction Description')}
                    </Label>
                  </div>
                  <p className="rounded bg-muted p-3 text-sm">{selectedAllergy.reaction}</p>
                </div>
              )}

              {/* Clinical Notes */}
              {selectedAllergy.notes && (
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <Label>{t('receptionist.appointments.notes', 'Notes')}</Label>
                  </div>
                  <p className="rounded bg-muted p-3 text-sm">{selectedAllergy.notes}</p>
                </div>
              )}

              {/* Dates */}
              {(selectedAllergy.diagnosed_date || selectedAllergy.verified_date) && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {t('receptionist.patients.dates', 'Important Dates')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedAllergy.diagnosed_date && (
                      <div>
                        <span className="text-muted-foreground">
                          {t('receptionist.patients.diagnosedOn', 'Diagnosed On')}:
                        </span>
                        <p className="font-medium">
                          {new Date(selectedAllergy.diagnosed_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                    {selectedAllergy.verified_date && (
                      <div>
                        <span className="text-muted-foreground">
                          {t('patient.medicalRecords.verifiedOn', 'Verified On')}:
                        </span>
                        <p className="font-medium">
                          {new Date(selectedAllergy.verified_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setIsAllergyModalOpen(false)}>
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diagnosis Details Modal */}
      {selectedDiagnosis && (
        <Dialog open={isDiagnosisModalOpen} onOpenChange={setIsDiagnosisModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                {t('receptionist.patients.diagnosisDetails', 'Diagnosis Details')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Diagnosis Name & Code */}
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedDiagnosis.diagnosis_name || selectedDiagnosis.condition}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedDiagnosis.icd_10_code || selectedDiagnosis.diagnosis_code) && (
                    <Badge className="bg-blue-600">
                      ICD-10: {selectedDiagnosis.icd_10_code || selectedDiagnosis.diagnosis_code}
                    </Badge>
                  )}
                  {selectedDiagnosis.status && (
                    <Badge
                      variant="outline"
                      className={
                        selectedDiagnosis.status === 'active'
                          ? 'border-green-600 text-green-600'
                          : selectedDiagnosis.status === 'resolved'
                            ? 'border-blue-600 text-blue-600'
                            : selectedDiagnosis.status === 'chronic'
                              ? 'border-purple-600 text-purple-600'
                              : 'border-gray-600 text-gray-600'
                      }
                    >
                      {selectedDiagnosis.status}
                    </Badge>
                  )}
                  {selectedDiagnosis.severity && (
                    <Badge
                      variant="outline"
                      className={
                        selectedDiagnosis.severity === 'critical'
                          ? 'border-red-600 text-red-600'
                          : selectedDiagnosis.severity === 'severe'
                            ? 'border-orange-600 text-orange-600'
                            : selectedDiagnosis.severity === 'moderate'
                              ? 'border-yellow-600 text-yellow-600'
                              : 'border-green-600 text-green-600'
                      }
                    >
                      {selectedDiagnosis.severity}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Classification */}
              {(selectedDiagnosis.diagnosis_type || selectedDiagnosis.category) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedDiagnosis.diagnosis_type && (
                    <div>
                      <Label className="text-muted-foreground">
                        {t('receptionist.patients.diagnosisType', 'Diagnosis Type')}
                      </Label>
                      <p className="mt-1 font-medium capitalize">
                        {selectedDiagnosis.diagnosis_type}
                      </p>
                    </div>
                  )}
                  {selectedDiagnosis.category && (
                    <div>
                      <Label className="text-muted-foreground">
                        {t('receptionist.patients.category', 'Category')}
                      </Label>
                      <p className="mt-1 font-medium capitalize">{selectedDiagnosis.category}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              {(selectedDiagnosis.diagnosed_date ||
                selectedDiagnosis.onset_date ||
                selectedDiagnosis.resolved_date) && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {t('receptionist.patients.dates', 'Important Dates')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedDiagnosis.diagnosed_date && (
                      <div>
                        <span className="text-muted-foreground">
                          {t('receptionist.patients.diagnosedOn')}:
                        </span>
                        <p className="font-medium">
                          {new Date(selectedDiagnosis.diagnosed_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedDiagnosis.onset_date && (
                      <div>
                        <span className="text-muted-foreground">
                          {t('receptionist.patients.onsetDate', 'Onset Date')}:
                        </span>
                        <p className="font-medium">
                          {new Date(selectedDiagnosis.onset_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedDiagnosis.resolved_date && (
                      <div>
                        <span className="text-muted-foreground">
                          {t('receptionist.patients.resolvedDate', 'Resolved Date')}:
                        </span>
                        <p className="font-medium">
                          {new Date(selectedDiagnosis.resolved_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              {(selectedDiagnosis.notes ||
                selectedDiagnosis.symptoms ||
                selectedDiagnosis.treatment_plan) && (
                <div className="space-y-3">
                  {selectedDiagnosis.symptoms && (
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <Label>{t('receptionist.patients.symptoms', 'Symptoms')}</Label>
                      </div>
                      <p className="rounded bg-muted p-2 text-sm">{selectedDiagnosis.symptoms}</p>
                    </div>
                  )}
                  {selectedDiagnosis.notes && (
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <Label>{t('receptionist.appointments.notes', 'Notes')}</Label>
                      </div>
                      <p className="rounded bg-muted p-2 text-sm">{selectedDiagnosis.notes}</p>
                    </div>
                  )}
                  {selectedDiagnosis.treatment_plan && (
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-green-500" />
                        <Label>{t('receptionist.patients.treatmentPlan', 'Treatment Plan')}</Label>
                      </div>
                      <p className="rounded bg-muted p-2 text-sm">
                        {selectedDiagnosis.treatment_plan}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up */}
              {selectedDiagnosis.follow_up_required && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      {t('receptionist.patients.followUpRequired', 'Follow-up Required')}
                    </span>
                  </div>
                  {selectedDiagnosis.follow_up_date && (
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      {t('receptionist.patients.scheduledFor', 'Scheduled for')}:{' '}
                      {new Date(selectedDiagnosis.follow_up_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setIsDiagnosisModalOpen(false)}>
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default MedicalInformationPanel;
