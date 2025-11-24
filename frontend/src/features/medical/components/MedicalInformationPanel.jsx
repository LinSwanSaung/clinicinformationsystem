import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, AlertCircle, ClipboardList, Pill } from 'lucide-react';

const MedicalInformationPanel = ({
  patient,
  onAddAllergy,
  onAddDiagnosis,
  className = '',
  showActionButtons = true,
}) => {
  const { t } = useTranslation();
  const [selectedAllergy, setSelectedAllergy] = useState(null);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);

  // Handle allergy badge click
  const handleAllergyClick = (allergy) => {
    // If allergy is a string (just name), create a minimal object
    // If it's an object, use it directly
    const allergyObj = typeof allergy === 'string' ? { allergy_name: allergy } : allergy;
    setSelectedAllergy(allergyObj);
    setIsAllergyModalOpen(true);
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
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-base">{diagnosis.condition}</span>
                    <span className="text-sm text-muted-foreground">{diagnosis.date}</span>
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
                Allergy Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Allergy Name</label>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {selectedAllergy.allergy_name || 'Unknown'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAllergy.severity && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Severity</label>
                    <div className="mt-1">
                      <Badge
                        variant="destructive"
                        className={
                          selectedAllergy.severity === 'life-threatening'
                            ? 'bg-red-600'
                            : selectedAllergy.severity === 'severe'
                              ? 'bg-red-500'
                              : selectedAllergy.severity === 'moderate'
                                ? 'bg-orange-500'
                                : 'bg-red-400'
                        }
                      >
                        {selectedAllergy.severity}
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedAllergy.allergen_type && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Allergen Type
                    </label>
                    <p className="mt-1 capitalize text-foreground">
                      {selectedAllergy.allergen_type}
                    </p>
                  </div>
                )}
              </div>

              {selectedAllergy.reaction && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Reaction Description
                  </label>
                  <p className="bg-muted/50 mt-1 rounded-md border border-border p-3 text-foreground">
                    {selectedAllergy.reaction}
                  </p>
                </div>
              )}

              {selectedAllergy.diagnosed_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Diagnosed Date
                  </label>
                  <p className="mt-1 text-foreground">
                    {new Date(selectedAllergy.diagnosed_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default MedicalInformationPanel;
