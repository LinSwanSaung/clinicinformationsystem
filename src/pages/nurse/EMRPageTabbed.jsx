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
  Mail,
  Upload,
  Download,
  Eye,
  ChevronDown
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
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);

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

  // Select patient from search results
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Clear patient selection
  const clearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setShowResults(false);
  };

  // Doctor notes dummy data
  const doctorNotes = [
    {
      date: "2024-01-15",
      note: "Patient presents with mild symptoms of seasonal allergies. No significant changes since last visit. Vital signs stable and within normal range. Continue current medication regimen. Patient reports good adherence to treatment plan.",
      prescribedMedications: [
        { name: "Loratadine", dosage: "10mg", reason: "Seasonal allergies" },
        { name: "Nasal spray", dosage: "2 sprays daily", reason: "Congestion relief" }
      ]
    },
    {
      date: "2023-12-10",
      note: "Routine follow-up visit. Patient feeling well overall. Blood pressure slightly elevated, will monitor closely. Recommended lifestyle modifications including diet and exercise.",
      prescribedMedications: [
        { name: "Lisinopril", dosage: "5mg", reason: "Blood pressure management" }
      ]
    }
  ];

  // Patient files dummy data
  const patientFiles = [
    {
      name: "Blood Test Results - Jan 2024",
      type: "PDF",
      size: "2.1 MB"
    },
    {
      name: "Chest X-Ray - Dec 2023",
      type: "DICOM",
      size: "15.8 MB"
    },
    {
      name: "Vaccination Record",
      type: "PDF",
      size: "1.2 MB"
    },
    {
      name: "Insurance Information",
      type: "PDF",
      size: "4.1 MB"
    }
  ];

  return (
    <PageLayout
      title="Patient Data View"
      subtitle="Complete patient medical records and documentation"
      fullWidth
    >
      <div className="space-y-10 p-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/nurse/dashboard')}
            className="flex items-center text-blue-600 text-xl py-3 px-6"
          >
            <ArrowLeft size={24} className="mr-3" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-6 text-xl text-gray-600">
            <span>nurse.jane (nurse)</span>
            <Button variant="destructive" size="lg" className="text-xl py-3 px-6">Sign Out</Button>
          </div>
        </div>

        {/* Search Section */}
        {!selectedPatient && (
          <Card className="p-10">
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <Search size={32} className="text-gray-500" />
                <h2 className="text-4xl font-bold">Search Patient Records</h2>
              </div>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-16 text-xl py-4 text-lg"
                />
                <Search size={24} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectPatient(patient)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${patient.avatarColor || 'bg-blue-500'}`}>
                            {patient.initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-2xl">{patient.name}</p>
                            <p className="text-xl text-gray-500">ID: {patient.id} • {patient.age} years • {patient.gender}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 p-4">
                    <p className="text-gray-500 text-center text-xl">No patients found matching your search.</p>
                  </div>
                )}
              </div>
              
              <div className="text-xl text-gray-500">
                Enter at least 2 characters to search for patients by name or ID number.
              </div>
            </div>
          </Card>
        )}

        {/* Patient EMR Display */}
        {selectedPatient && (
          <div className="space-y-10">
            {/* Patient Header */}
            <Card className="p-10">
              <div className="flex items-center space-x-8">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${selectedPatient.avatarColor || 'bg-blue-500'}`}>
                  {selectedPatient.initials}
                </div>
                <div>
                  <h2 className="text-5xl font-bold text-gray-900">Patient: {selectedPatient.name} ({selectedPatient.id})</h2>
                  <p className="text-2xl text-gray-600 mt-2">Age: {selectedPatient.age} | Gender: {selectedPatient.gender} | Contact: 555-123-4567</p>
                </div>
              </div>
            </Card>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-6 px-4 border-b-2 font-semibold text-3xl transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('visit-history')}
                  className={`py-6 px-4 border-b-2 font-semibold text-3xl transition-colors ${
                    activeTab === 'visit-history'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Visit History
                </button>
                <button
                  onClick={() => setActiveTab('doctors-notes')}
                  className={`py-6 px-4 border-b-2 font-semibold text-3xl transition-colors ${
                    activeTab === 'doctors-notes'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Doctor's Notes
                </button>
                <button
                  onClick={() => setActiveTab('files-images')}
                  className={`py-6 px-4 border-b-2 font-semibold text-3xl transition-colors ${
                    activeTab === 'files-images'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Files & Images
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Current Vitals */}
                  <Card className="p-10">
                    <div className="flex items-center space-x-4 mb-8">
                      <Activity size={36} className="text-emerald-600" />
                      <h3 className="text-4xl font-bold">Current Vitals</h3>
                    </div>
                    
                    {selectedPatient.vitals ? (
                      <div className="space-y-8">
                        {selectedPatient.vitals.bp && (
                          <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Heart size={32} className="text-red-500" />
                              <span className="text-2xl font-medium">Blood Pressure</span>
                            </div>
                            <span className="font-bold text-3xl">{selectedPatient.vitals.bp}</span>
                          </div>
                        )}
                        {selectedPatient.vitals.heartRate && (
                          <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Activity size={32} className="text-green-500" />
                              <span className="text-2xl font-medium">Heart Rate</span>
                            </div>
                            <span className="font-bold text-3xl">{selectedPatient.vitals.heartRate} bpm</span>
                          </div>
                        )}
                        {selectedPatient.vitals.temp && (
                          <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <ThermometerSnowflake size={32} className="text-blue-500" />
                              <span className="text-2xl font-medium">Temperature</span>
                            </div>
                            <span className="font-bold text-3xl">{selectedPatient.vitals.temp}°F</span>
                          </div>
                        )}
                        {selectedPatient.vitals.weight && (
                          <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Scale size={32} className="text-purple-500" />
                              <span className="text-2xl font-medium">Weight</span>
                            </div>
                            <span className="font-bold text-3xl">{selectedPatient.vitals.weight} kg</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-xl">No vitals recorded yet</p>
                    )}
                  </Card>

                  {/* Medical Information */}
                  <Card className="p-10 lg:col-span-2">
                    <div className="flex items-center space-x-4 mb-8">
                      <FileText size={36} className="text-blue-600" />
                      <h3 className="text-4xl font-bold">Medical Information</h3>
                    </div>
                    
                    <div className="space-y-10">
                      {/* Known Allergies */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-gray-800 flex items-center text-2xl">
                            <AlertCircle size={28} className="mr-4 text-amber-500" />
                            Known Allergies
                          </h4>
                          <Button variant="outline" size="lg" className="text-xl px-6 py-3">
                            + Add Allergy
                          </Button>
                        </div>
                        <div className="bg-amber-50 p-8 rounded-lg border border-amber-200">
                          {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                              {selectedPatient.allergies.map((allergy, index) => (
                                <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 border-red-300 text-xl px-6 py-3">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-amber-700 text-2xl">No known allergies</p>
                          )}
                        </div>
                      </div>

                      {/* Diagnosis History */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-gray-800 flex items-center text-2xl">
                            <ClipboardList size={28} className="mr-4 text-blue-500" />
                            Diagnosis History
                          </h4>
                          <Button variant="outline" size="lg" className="text-xl px-6 py-3">
                            + Add Diagnosis
                          </Button>
                        </div>
                        <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
                          {selectedPatient.diagnosisHistory && selectedPatient.diagnosisHistory.length > 0 ? (
                            <div className="space-y-6">
                              {selectedPatient.diagnosisHistory.map((diagnosis, index) => (
                                <div key={index} className="flex justify-between items-center py-4 border-b border-blue-100 last:border-b-0">
                                  <span className="text-2xl text-blue-900 font-bold">{diagnosis.date}:</span>
                                  <span className="text-2xl text-blue-700">{diagnosis.diagnosis}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-blue-700 text-2xl">No diagnosis history available</p>
                          )}
                        </div>
                      </div>

                      {/* Current Medications */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-gray-800 flex items-center text-2xl">
                            <Heart size={28} className="mr-4 text-green-500" />
                            Current Medications
                          </h4>
                          <span className="text-xl text-gray-500 italic">Updated by Doctor</span>
                        </div>
                        <div className="bg-green-50 p-8 rounded-lg border border-green-200">
                          {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 ? (
                            <div className="space-y-6">
                              {selectedPatient.currentMedications.map((medication, index) => (
                                <div key={index} className="bg-white p-6 rounded border border-green-100">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-bold text-green-900 text-2xl">{medication.name}</span>
                                      <span className="text-green-700 ml-4 text-2xl">{medication.dosage}</span>
                                    </div>
                                    <span className="text-2xl text-green-600">{medication.frequency}</span>
                                  </div>
                                  {medication.prescribedBy && (
                                    <p className="text-xl text-green-600 mt-3">Prescribed by: {medication.prescribedBy}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-green-700 text-2xl">No current medications prescribed</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Visit History Tab */}
              {activeTab === 'visit-history' && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 mb-10">
                    <ClipboardList size={36} className="text-blue-600" />
                    <h3 className="text-5xl font-bold">Patient Visit History</h3>
                  </div>
                  
                  {selectedPatient.visitHistory && selectedPatient.visitHistory.length > 0 ? (
                    <div className="space-y-8">
                      {selectedPatient.visitHistory.map((visit, index) => (
                        <Card key={index} className="p-8 border border-gray-200">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedVisit(expandedVisit === index ? null : index)}
                          >
                            <div className="flex items-center space-x-6">
                              <ClipboardList size={28} className="text-blue-500" />
                              <div>
                                <h4 className="font-bold text-blue-900 text-2xl">
                                  Visit on {visit.date} - {visit.reason}
                                </h4>
                              </div>
                            </div>
                            <ChevronDown 
                              size={28} 
                              className={`text-gray-500 transition-transform ${expandedVisit === index ? 'rotate-180' : ''}`}
                            />
                          </div>
                          
                          {expandedVisit === index && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                  <h5 className="font-bold mb-4 text-2xl">Doctor: {visit.doctor}</h5>
                                  <div className="space-y-4 text-xl text-gray-600">
                                    {selectedPatient.vitals && (
                                      <>
                                        <p>• BP: {selectedPatient.vitals.bp || 'N/A'}</p>
                                        <p>• BPM: {selectedPatient.vitals.heartRate || 'N/A'}</p>
                                        <p>• Weight: {selectedPatient.vitals.weight ? `${selectedPatient.vitals.weight} kg` : 'N/A'}</p>
                                        <p>• Temp: {selectedPatient.vitals.temp ? `${selectedPatient.vitals.temp} °F` : 'N/A'}</p>
                                        <p>• Observations: Patient reports feeling well, no new symptoms.</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-bold mb-4 text-2xl">Doctor's Notes:</h5>
                                  <div className="space-y-4 text-xl text-gray-600">
                                    <p>• Diagnosis: {visit.diagnosis || 'Follow-up care'}</p>
                                    <p>• Comments: Continue current medication. Next review in 3 months.</p>
                                    <h6 className="font-bold mt-6 mb-3 text-xl">Prescribed Medications:</h6>
                                    {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 ? (
                                      selectedPatient.currentMedications.map((med, medIndex) => (
                                        <p key={medIndex} className="text-xl">• {med.name} ({med.dosage}) - {med.frequency}</p>
                                      ))
                                    ) : (
                                      <p className="text-xl">• No medications prescribed</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Calendar size={80} className="mx-auto text-gray-400 mb-8" />
                      <h3 className="text-3xl font-medium text-gray-900 mb-4">No Visit History</h3>
                      <p className="text-gray-500 text-2xl">No previous visits recorded for this patient.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Doctor's Notes Tab */}
              {activeTab === 'doctors-notes' && (
                <div className="space-y-10">
                  <div className="flex items-center space-x-4 mb-10">
                    <FileText size={36} className="text-blue-600" />
                    <h3 className="text-5xl font-bold">Doctor's Medical Notes</h3>
                  </div>
                  
                  <div className="space-y-10">
                    {doctorNotes.map((note, index) => (
                      <Card key={index} className="p-10 border border-blue-200">
                        <div className="flex items-start space-x-6 mb-8">
                          <FileText size={32} className="text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-bold text-blue-900 mb-6 text-3xl">Note from {note.date}</h4>
                            <p className="text-gray-700 text-2xl leading-relaxed">{note.note}</p>
                          </div>
                        </div>
                        
                        {note.prescribedMedications && (
                          <div className="mt-8 pt-8 border-t border-blue-100">
                            <h5 className="font-bold text-gray-800 mb-6 text-3xl">Prescribed Medications:</h5>
                            <div className="bg-green-50 p-8 rounded-lg border border-green-200">
                              {note.prescribedMedications.map((med, medIndex) => (
                                <div key={medIndex} className="flex justify-between items-center py-4">
                                  <span className="font-bold text-green-900 text-2xl">{med.name}</span>
                                  <div className="text-2xl text-green-700">
                                    <span className="mr-6">Dosage: {med.dosage}</span>
                                    <span>Reason: {med.reason}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Files & Images Tab */}
              {activeTab === 'files-images' && (
                <div className="space-y-10">
                  <div className="flex items-center space-x-4 mb-10">
                    <FileText size={36} className="text-blue-600" />
                    <h3 className="text-5xl font-bold">Files & Images</h3>
                  </div>
                  
                  {/* Upload Section */}
                  <Card className="p-10">
                    <h4 className="font-bold text-gray-800 mb-8 text-3xl">Upload New Files</h4>
                    <div className="flex items-center space-x-8">
                      <input type="file" className="hidden" id="file-upload" multiple />
                      <label htmlFor="file-upload" className="text-2xl text-gray-600 bg-gray-50 px-8 py-6 rounded border cursor-pointer hover:bg-gray-100">
                        Choose Files  No file chosen
                      </label>
                      <Button variant="outline" size="lg" className="text-2xl px-8 py-6">
                        <Upload size={28} className="mr-3" />
                        Upload
                      </Button>
                    </div>
                  </Card>
                  
                  {/* Existing Files */}
                  <Card className="p-10">
                    <h4 className="font-bold text-gray-800 mb-8 text-3xl">Existing Files</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {patientFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-8 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-blue-100 rounded flex items-center justify-center">
                              <FileText size={32} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-2xl">{file.name}</p>
                              <p className="text-2xl text-gray-500">{file.type} • {file.size}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="lg" className="text-2xl px-6 py-4">
                            <Eye size={24} className="mr-3" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedPatient && !showResults && (
          <Card className="p-20 text-center">
            <div className="space-y-8">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText size={48} className="text-gray-400" />
              </div>
              <h3 className="text-3xl font-medium text-gray-900">No Patient Selected</h3>
              <p className="text-gray-500 max-w-md mx-auto text-2xl">
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
