import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, ClipboardList, Pill } from 'lucide-react';

const MedicalInformationPanel = ({
  patient,
  onAddAllergy,
  onAddDiagnosis,
  className = '',
  showActionButtons = true,
}) => {
  const { t } = useTranslation();

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
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="destructive"
                    className="border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm text-red-800 dark:text-red-200"
                  >
                    {allergy}
                  </Badge>
                ))}
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
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
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
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <div className="space-y-2">
                {patient.currentMedications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-medium">{medication.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">({medication.dosage})</span>
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
    </Card>
  );
};

export default MedicalInformationPanel;
