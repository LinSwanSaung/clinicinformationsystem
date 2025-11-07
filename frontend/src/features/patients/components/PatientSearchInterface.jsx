import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const PatientSearchInterface = ({ 
  patients, 
  onPatientSelect, 
  placeholder = "Search patients by name or ID...",
  className = "",
  minSearchLength = 2
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query) => {
    setSearchTerm(query);
    if (query.length >= minSearchLength) {
      const queryLower = query.toLowerCase();
      const results = patients.filter(patient => {
        const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
        const patientNumber = (patient.patient_number || '').toLowerCase();
        const patientId = (patient.id || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        
        return fullName.includes(queryLower) ||
               patientNumber.includes(queryLower) ||
               patientId.includes(queryLower) ||
               email.includes(queryLower) ||
               phone.includes(queryLower);
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Patient EMR Search</h2>
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
            className="pl-12 text-sm py-3"
          />
          <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-96 overflow-y-auto">
              {searchResults.map((patient) => {
                const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
                const age = patient.date_of_birth 
                  ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                  : 'N/A';
                
                return (
                  <div
                    key={patient.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-blue-500`}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{fullName}</p>
                        <p className="text-xs text-gray-500">
                          {patient.patient_number && `ID: ${patient.patient_number}`}
                          {patient.patient_number && age !== 'N/A' && ' • '}
                          {age !== 'N/A' && `${age} years`}
                          {(patient.patient_number || age !== 'N/A') && patient.gender && ' • '}
                          {patient.gender && patient.gender}
                        </p>
                        {patient.phone && (
                          <p className="text-xs text-gray-400 mt-0.5">📞 {patient.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {showResults && searchResults.length === 0 && searchTerm.length >= minSearchLength && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 p-3">
              <p className="text-gray-500 text-center text-sm">No patients found matching your search.</p>
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
