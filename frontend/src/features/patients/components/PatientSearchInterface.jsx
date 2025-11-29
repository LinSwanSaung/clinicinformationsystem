import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const PatientSearchInterface = ({
  patients,
  onPatientSelect,
  placeholder,
  className = '',
  minSearchLength = 2,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query) => {
    setSearchTerm(query);
    if (query.length >= minSearchLength) {
      const queryLower = query.toLowerCase();
      const results = patients.filter((patient) => {
        const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
        const patientNumber = (patient.patient_number || '').toLowerCase();
        const patientId = (patient.id || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();

        return (
          fullName.includes(queryLower) ||
          patientNumber.includes(queryLower) ||
          patientId.includes(queryLower) ||
          email.includes(queryLower) ||
          phone.includes(queryLower)
        );
      });
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const selectPatient = (patient) => {
    onPatientSelect(patient);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('nurse.patientSearch.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('nurse.patientSearch.subtitle')}
          </p>
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder || t('nurse.patientSearch.placeholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="py-3 pl-12 text-sm"
          />
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 transform text-muted-foreground"
          />

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {searchResults.map((patient) => {
                const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                const initials =
                  `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
                const age = patient.date_of_birth
                  ? Math.floor(
                      (new Date() - new Date(patient.date_of_birth)) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )
                  : 'N/A';

                return (
                  <div
                    key={patient.id}
                    className="cursor-pointer border-b border-border p-4 transition-colors last:border-b-0 hover:bg-accent"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-popover-foreground">{fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.patient_number && `ID: ${patient.patient_number}`}
                          {patient.patient_number && age !== 'N/A' && ' • '}
                          {age !== 'N/A' && `${age} ${t('nurse.patientSearch.years')}`}
                          {(patient.patient_number || age !== 'N/A') && patient.gender && ' • '}
                          {patient.gender && patient.gender}
                        </p>
                        {patient.phone && (
                          <p className="mt-0.5 text-xs text-muted-foreground">📞 {patient.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showResults && searchResults.length === 0 && searchTerm.length >= minSearchLength && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-border bg-popover p-3 shadow-lg">
              <p className="text-center text-sm text-popover-foreground">
                {t('nurse.patientSearch.noResults')}
              </p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('nurse.patientSearch.hint', { count: minSearchLength })}
        </div>
      </div>
    </Card>
  );
};

export default PatientSearchInterface;
