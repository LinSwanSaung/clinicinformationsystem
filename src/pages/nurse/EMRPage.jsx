import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Search, 
  ArrowLeft,
  FileText,
  User,
  Activity,
  Heart,
  ThermometerSnowflake,
  Scale,
  ClipboardList,
  AlertCircle,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { nursePatientsData } from '../../data/dummyNurseData';

const EMRPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get patient from navigation state or start with empty search
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Handle patient search
  const handleSearch = (query) => {
    setSearchTerm(query);
    if (query.length >= 2) {
      const results = nursePatientsData.filter(patient =>
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.id.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <PageLayout
      title="Electronic Medical Records"
      subtitle="Search and view complete patient medical records"
      fullWidth
    >
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/nurse/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Electronic Medical Records</h1>
              <p className="text-gray-600">Search and view complete patient medical records</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        {!selectedPatient && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search size={20} className="text-gray-500" />
                <h2 className="text-lg font-semibold">Search Patient Records</h2>
              </div>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Search Results */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {searchResults.map(patient => (
                      <button
                        key={patient.id}
                        onClick={() => selectPatient(patient)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-500">ID: {patient.id}</p>
                        </div>
                        <Badge className={
                          patient.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                          patient.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                          patient.status === 'seeing_doctor' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {patient.status === 'waiting' ? 'Waiting' :
                           patient.status === 'ready' ? 'Ready' :
                           patient.status === 'seeing_doctor' ? 'With Doctor' : 'Delayed'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                
                {showResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 p-4">
                    <p className="text-gray-500 text-center">No patients found matching your search.</p>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                Enter at least 2 characters to search for patients by name or ID number.
              </div>
            </div>
          </Card>
        )}

        {/* Patient EMR Display */}
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Header */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                    <p className="text-gray-600">Patient ID: {selectedPatient.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={
                    selectedPatient.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                    selectedPatient.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                    selectedPatient.status === 'seeing_doctor' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {selectedPatient.status === 'waiting' ? 'Waiting for Nurse' :
                     selectedPatient.status === 'ready' ? 'Ready for Doctor' :
                     selectedPatient.status === 'seeing_doctor' ? 'With Doctor' : 'Delayed'}
                  </Badge>
                  <Button variant="outline" onClick={clearSelection}>
                    Search Another Patient
                  </Button>
                </div>
              </div>
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedPatient.age && (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Age:</span>
                    <span className="font-medium">{selectedPatient.age} years</span>
                  </div>
                )}
                {selectedPatient.gender && (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Gender:</span>
                    <span className="font-medium">{selectedPatient.gender}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Appointment:</span>
                  <span className="font-medium">{selectedPatient.appointmentTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClipboardList size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Urgency:</span>
                  <Badge variant={selectedPatient.urgency === 'High' ? 'destructive' : 'secondary'}>
                    {selectedPatient.urgency || 'Normal'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Main EMR Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Vitals */}
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity size={20} className="text-emerald-600" />
                  <h3 className="text-lg font-semibold">Current Vitals</h3>
                </div>
                
                {selectedPatient.vitals ? (
                  <div className="space-y-4">
                    {selectedPatient.vitals.bp && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Heart size={16} className="text-red-500" />
                          <span className="text-sm font-medium">Blood Pressure</span>
                        </div>
                        <span className="font-semibold">{selectedPatient.vitals.bp}</span>
                      </div>
                    )}
                    {selectedPatient.vitals.heartRate && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Activity size={16} className="text-green-500" />
                          <span className="text-sm font-medium">Heart Rate</span>
                        </div>
                        <span className="font-semibold">{selectedPatient.vitals.heartRate} bpm</span>
                      </div>
                    )}
                    {selectedPatient.vitals.temp && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <ThermometerSnowflake size={16} className="text-blue-500" />
                          <span className="text-sm font-medium">Temperature</span>
                        </div>
                        <span className="font-semibold">{selectedPatient.vitals.temp}°F</span>
                      </div>
                    )}
                    {selectedPatient.vitals.weight && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Scale size={16} className="text-purple-500" />
                          <span className="text-sm font-medium">Weight</span>
                        </div>
                        <span className="font-semibold">{selectedPatient.vitals.weight} kg</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No vitals recorded yet</p>
                )}
              </Card>

              {/* Medical Information */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="text-lg font-semibold">Medical Information</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Current Notes */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Current Visit Notes</h4>
                    {selectedPatient.notes ? (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">{selectedPatient.notes}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No notes for current visit</p>
                    )}
                  </div>

                  {/* Delay Information */}
                  {selectedPatient.delayReason && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Delay Information</h4>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start space-x-2">
                          <AlertCircle size={16} className="text-red-500 mt-0.5" />
                          <p className="text-sm text-red-800">{selectedPatient.delayReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medical History Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Medical History</h4>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.medicalHistory || "No significant medical history on file"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Known Allergies</h4>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.allergies || "No known allergies"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Current Medications</h4>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.medications || "No current medications"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Additional Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardList size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold">Additional Information</h3>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-blue-800">Last Visit:</strong>
                    <span className="text-blue-700 ml-2">June 15, 2025</span>
                  </div>
                  <div>
                    <strong className="text-blue-800">Insurance Status:</strong>
                    <span className="text-blue-700 ml-2">Active - BlueCross BlueShield</span>
                  </div>
                  <div>
                    <strong className="text-blue-800">Emergency Contact:</strong>
                    <span className="text-blue-700 ml-2">Available in main system</span>
                  </div>
                  <div>
                    <strong className="text-blue-800">Primary Physician:</strong>
                    <span className="text-blue-700 ml-2">Dr. Johnson, Internal Medicine</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline">
                <FileText size={16} className="mr-2" />
                Print EMR
              </Button>
              <Button variant="outline">
                <Mail size={16} className="mr-2" />
                Send to Doctor
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <ClipboardList size={16} className="mr-2" />
                Update Records
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedPatient && !showResults && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Patient Selected</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Use the search bar above to find a patient and view their complete electronic medical record.
              </p>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default EMRPage;
