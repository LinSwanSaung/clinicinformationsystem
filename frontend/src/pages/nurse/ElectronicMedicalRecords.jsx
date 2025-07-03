import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

// Import our new reusable components
import PatientSearchInterface from '../../components/medical/PatientSearchInterface';
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import PatientDocumentManager from '../../components/medical/PatientDocumentManager';
import { patientService } from '../../services/patientService';

const ElectronicMedicalRecords = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);

  // Modal states for add functionality
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState({ condition: '', date: '' });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Visit History', icon: Activity },
    { id: 'notes', label: "Doctor's Notes", icon: FileText },
    { id: 'files', label: 'Files & Images', icon: Calendar }
  ];

  // Dummy data
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

  const patientFiles = [
    { name: "Blood Test Results - Jan 2024", type: "PDF", size: "2.1 MB" },
    { name: "Chest X-Ray - Dec 2023", type: "DICOM", size: "15.8 MB" },
    { name: "Prescription History", type: "PDF", size: "1.2 MB" }
  ];

  // Event handlers
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
  };

  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
  };

  // Medical action handlers (these would integrate with your backend)
  const handleAddVitals = () => {
    console.log('Add vitals for patient:', selectedPatient?.id);
  };

  const handleEditVitals = () => {
    console.log('Edit vitals for patient:', selectedPatient?.id);
  };

  const handleAddAllergy = () => {
    setIsAllergyModalOpen(true);
  };

  const handleSaveAllergy = () => {
    if (newAllergy.trim()) {
      // In a real app, this would update the database
      console.log('Adding allergy:', newAllergy, 'for patient:', selectedPatient?.id);
      // Update local state
      if (selectedPatient) {
        selectedPatient.allergies = selectedPatient.allergies || [];
        selectedPatient.allergies.push(newAllergy.trim());
      }
      setNewAllergy('');
      setIsAllergyModalOpen(false);
    }
  };

  const handleAddDiagnosis = () => {
    setIsDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = () => {
    if (newDiagnosis.condition.trim() && newDiagnosis.date.trim()) {
      // In a real app, this would update the database
      console.log('Adding diagnosis:', newDiagnosis, 'for patient:', selectedPatient?.id);
      // Update local state
      if (selectedPatient) {
        selectedPatient.diagnosisHistory = selectedPatient.diagnosisHistory || [];
        selectedPatient.diagnosisHistory.push({
          condition: newDiagnosis.condition.trim(),
          date: newDiagnosis.date.trim()
        });
      }
      setNewDiagnosis({ condition: '', date: '' });
      setIsDiagnosisModalOpen(false);
    }
  };

  const handleAddMedication = () => {
    console.log('Add medication for patient:', selectedPatient?.id);
  };

  const handleAddNote = () => {
    console.log('Add doctor note for patient:', selectedPatient?.id);
  };

  const handleEditNote = (note, index) => {
    console.log('Edit doctor note:', note, 'at index:', index);
  };

  const handleUploadFile = () => {
    console.log('Upload file for patient:', selectedPatient?.id);
  };

  const handleViewFile = (file) => {
    console.log('View file:', file);
  };

  const handleDownloadFile = (file) => {
    console.log('Download file:', file);
  };

  // Render visit history tab content
  const renderVisitHistory = () => (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Activity size={24} className="text-green-600" />
        <h3 className="text-xl font-bold">Patient Visit History</h3>
      </div>
      
      {selectedPatient.visitHistory && selectedPatient.visitHistory.length > 0 ? (
        <div className="space-y-4">
          {selectedPatient.visitHistory.map((visit, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                onClick={() => setExpandedVisit(expandedVisit === index ? null : index)}
              >
                <div className="flex items-center space-x-3">
                  {expandedVisit === index ? 
                    <ChevronDown size={16} className="text-gray-500" /> : 
                    <ChevronRight size={16} className="text-gray-500" />
                  }
                  <span className="text-base font-semibold">Visit on {visit.date} - {visit.type}</span>
                </div>
              </div>
              
              {expandedVisit === index && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Nurse's Notes */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Activity size={16} className="text-blue-500" />
                        <h5 className="font-semibold text-base text-gray-800">Nurse's Notes:</h5>
                      </div>
                      {visit.nurseNotes && (
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">BP:</span> {visit.nurseNotes.bp}</div>
                          <div><span className="font-medium">BPM:</span> {visit.nurseNotes.bpm}</div>
                          <div><span className="font-medium">Weight:</span> {visit.nurseNotes.weight}</div>
                          <div><span className="font-medium">Temp:</span> {visit.nurseNotes.temp}</div>
                          <div><span className="font-medium">Observations:</span> {visit.nurseNotes.observations}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Doctor's Notes */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <FileText size={16} className="text-purple-500" />
                        <h5 className="font-semibold text-base text-gray-800">Doctor's Notes:</h5>
                      </div>
                      <div className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Doctor:</span> {visit.doctor}
                      </div>
                      {visit.doctorNotes && (
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Diagnosis:</span> {visit.doctorNotes.diagnosis}</div>
                          <div><span className="font-medium">Comments:</span> {visit.doctorNotes.comments}</div>
                          {visit.doctorNotes.prescribedMedications && visit.doctorNotes.prescribedMedications.length > 0 && (
                            <div>
                              <span className="font-medium">Prescribed Medications:</span>
                              <ul className="mt-1 space-y-1">
                                {visit.doctorNotes.prescribedMedications.map((med, medIndex) => (
                                  <li key={medIndex} className="bg-blue-50 p-2 rounded text-xs">
                                    <span className="font-medium">{med.name}</span> - {med.dosage} | {med.frequency}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 text-base">No visit history available</p>
        </div>
      )}
    </Card>
  );

  // Empty state component
  const EmptyState = () => (
    <Card className="p-12 text-center">
      <div className="space-y-6">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <FileText size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Patient Selected</h3>
        <p className="text-gray-500 max-w-md mx-auto text-sm">
          Use the search bar above to find a patient and view their complete electronic medical record.
        </p>
      </div>
    </Card>
  );

  return (
    <PageLayout title="Electronic Medical Records" subtitle="Patient medical record management system" fullWidth={true}>
      <div className="space-y-6 w-full">
        {/* Patient Search */}
        {!selectedPatient && (
          <div className="space-y-4">
            {/* Back to Dashboard Button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => navigate('/nurse/dashboard')}
                className="flex items-center space-x-2 h-12 px-6 text-base"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            
            <PatientSearchInterface 
              patients={nursePatientsData}
              onPatientSelect={handlePatientSelect}
            />
          </div>
        )}

        {/* Patient EMR Display */}
        {selectedPatient && (
          <div className="space-y-4">
            {/* Patient Header */}
            <PatientInformationHeader 
              patient={selectedPatient}
              onBackClick={handleBackToSearch}
              onClearSelection={handleClearSelection}
            />

            {/* Tab Navigation */}
            <NavigationTabs 
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <PatientVitalsDisplay 
                    vitals={selectedPatient.vitals}
                    onAddVitals={handleAddVitals}
                    onEditVitals={handleEditVitals}
                    showAddButton={!selectedPatient.vitals}
                    showEditButton={!!selectedPatient.vitals}
                  />
                  
                  <MedicalInformationPanel 
                    patient={selectedPatient}
                    onAddAllergy={handleAddAllergy}
                    onAddDiagnosis={handleAddDiagnosis}
                    onAddMedication={handleAddMedication}
                  />
                </div>
              )}

              {/* Visit History Tab */}
              {activeTab === 'history' && renderVisitHistory()}

              {/* Doctor's Notes Tab */}
              {activeTab === 'notes' && (
                <ClinicalNotesDisplay 
                  notes={doctorNotes}
                  userRole="nurse"
                  onAddNote={handleAddNote}
                  onEditNote={handleEditNote}
                />
              )}

              {/* Files & Images Tab */}
              {activeTab === 'files' && (
                <PatientDocumentManager 
                  files={patientFiles}
                  onUploadFile={handleUploadFile}
                  onViewFile={handleViewFile}
                  onDownloadFile={handleDownloadFile}
                />
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedPatient && <EmptyState />}
      </div>

      {/* Allergy Modal */}
      {isAllergyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Add New Allergy</h3>
              <button onClick={() => setIsAllergyModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FileText size={20} />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium mb-2">Allergy Name</label>
              <input
                type="text"
                placeholder="e.g., Penicillin, Peanuts, etc."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2 mt-4">
                <button 
                  onClick={() => setIsAllergyModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAllergy}
                  disabled={!newAllergy.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Allergy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Modal */}
      {isDiagnosisModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Add New Diagnosis</h3>
              <button onClick={() => setIsDiagnosisModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FileText size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <input
                  type="text"
                  placeholder="e.g., Hypertension, Diabetes, etc."
                  value={newDiagnosis.condition}
                  onChange={(e) => setNewDiagnosis({...newDiagnosis, condition: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={newDiagnosis.date}
                  onChange={(e) => setNewDiagnosis({...newDiagnosis, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsDiagnosisModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveDiagnosis}
                  disabled={!newDiagnosis.condition.trim() || !newDiagnosis.date.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Diagnosis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ElectronicMedicalRecords;
