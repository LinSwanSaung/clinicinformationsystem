import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const PatientSearchInterface = ({
  patients,
  onPatientSelect,
  placeholder = 'Search patients by name or ID...',
  className = '',
  minSearchLength = 2,
}) => {
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
          <h2 className="mb-2 text-xl font-bold text-gray-900">Patient EMR Search</h2>
          <p className="text-sm text-gray-600">
            Search and select a patient to view their complete electronic medical record.
          </p>
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="py-3 pl-12 text-sm"
          />
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 transform text-gray-400"
          />

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
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
                    className="cursor-pointer border-b border-gray-100 p-4 transition-colors last:border-b-0 hover:bg-gray-50"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-500">
                          {patient.patient_number && `ID: ${patient.patient_number}`}
                          {patient.patient_number && age !== 'N/A' && ' • '}
                          {age !== 'N/A' && `${age} years`}
                          {(patient.patient_number || age !== 'N/A') && patient.gender && ' • '}
                          {patient.gender && patient.gender}
                        </p>
                        {patient.phone && (
                          <p className="mt-0.5 text-xs text-gray-400">📞 {patient.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showResults && searchResults.length === 0 && searchTerm.length >= minSearchLength && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
              <p className="text-center text-sm text-gray-500">
                No patients found matching your search.
              </p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500">
          Enter at least {minSearchLength} characters to search for patients by name or ID number.
        </div>
      </div>
    </Card>
  );
};

export default PatientSearchInterface;
