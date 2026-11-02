import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

const PatientCardGrid = ({ patients, onPatientSelect, className = '' }) => {
  const { t } = useTranslation();
  const sortedPatients = [...patients].sort((a, b) =>
    (a.patient_number || '').localeCompare(b.patient_number || '')
  );

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t('nurse.patientSearch.allPatients', { count: sortedPatients.length })}
        </h3>
        <p className="text-sm text-muted-foreground">{t('nurse.patientSearch.allPatientsHint')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedPatients.map((patient) => {
          const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
          const initials =
            `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
          const age = patient.date_of_birth
            ? Math.floor(
                (new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
              )
            : null;
          const details = [
            patient.patient_number && `ID: ${patient.patient_number}`,
            age !== null && `${age} ${t('nurse.patientSearch.years')}`,
            patient.gender,
          ].filter(Boolean);
          const hasConditions =
            patient.medical_conditions && patient.medical_conditions.toLowerCase() !== 'none';

          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => onPatientSelect(patient)}
              className="flex items-start space-x-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground">{details.join(' • ')}</p>
                {patient.phone && (
                  <p className="mt-0.5 text-xs text-muted-foreground">📞 {patient.phone}</p>
                )}
                {hasConditions && (
                  <span className="mt-2 inline-block max-w-full truncate rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {patient.medical_conditions}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default PatientCardGrid;
