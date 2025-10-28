import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import ModalComponent from '../../components/ui/ModalComponent';
import AllergyForm from '../../components/medical/forms/AllergyForm';
import DiagnosisForm from '../../components/medical/forms/DiagnosisForm';
import VisitHistoryCard from '../../components/medical/VisitHistoryCard';
import LoadingState from '../../components/LoadingState';
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import PatientDocumentManager from '../../components/medical/PatientDocumentManager';
import PatientSearchInterface from '../../components/medical/PatientSearchInterface';
import { allergyService } from '../../services/allergyService';
import { diagnosisService } from '../../services/diagnosisService';
import { visitService } from '../../services/visitService';
import patientService from '../../services/patientService';
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ArrowLeft
} from 'lucide-react';

const PatientMedicalRecordManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);
  
  // Data state
  const [allergies, setAllergies] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [patientsData, setPatientsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states for add functionality (DOCTOR ONLY)
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [newAllergy, setNewAllergy] = useState({ 
    allergy_name: '', 
    severity: 'mild',
    allergen_type: 'other',
    reaction: '' 
  });
  const [newDiagnosis, setNewDiagnosis] = useState({ 
    diagnosis_name: '', 
    diagnosed_date: new Date().toISOString().split('T')[0],
    status: 'active',
    severity: 'mild'
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Visit History', icon: Activity },
    { id: 'notes', label: "Doctor's Notes", icon: FileText },
    { id: 'files', label: 'Files & Images', icon: Calendar }
  ];

  // Load patients data on component mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await patientService.getAllPatients();
        if (response.success) {
          setPatientsData(response.data);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        setPatientsData([]);
      }
    };

    loadPatients();
  }, []);

  // Load allergies and diagnoses when patient is selected
  useEffect(() => {
    if (selectedPatient?.id) {
      loadPatientMedicalData();
    }
  }, [selectedPatient?.id]);

  const loadPatientMedicalData = async () => {
    if (!selectedPatient?.id) {
      console.warn('No patient selected or patient has no ID');
      return;
    }
    
    setLoading(true);
    try {
      // Load allergies, diagnoses, and visit history in parallel
      const [patientAllergies, patientDiagnoses, patientVisitHistory] = await Promise.all([
        allergyService.getAllergiesByPatient(selectedPatient.id),
        diagnosisService.getDiagnosesByPatient(selectedPatient.id),
        visitService.getPatientVisitHistory(selectedPatient.id, { limit: 20, includeCompleted: true })
      ]);
      
      setAllergies(Array.isArray(patientAllergies) ? patientAllergies : []);
      setDiagnoses(Array.isArray(patientDiagnoses) ? patientDiagnoses : []);
      setVisitHistory(Array.isArray(patientVisitHistory) ? patientVisitHistory : []);
    } catch (error) {
      console.error('Error loading patient medical data:', error);
      setAllergies([]);
      setDiagnoses([]);
      setVisitHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Dummy data for doctor notes and files (these can be implemented later)
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
    setAllergies([]);
    setDiagnoses([]);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
  };

  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
  };

  // Medical action handlers - DOCTOR CAN ADD DIAGNOSIS AND ALLERGY
  const handleAddVitals = () => {
    console.log('Vitals are managed by nurses');
    alert('Vitals are managed by nursing staff. Please ask a nurse to record vitals.');
  };

  const handleEditVitals = () => {
    console.log('Vitals are managed by nurses');
    alert('Vitals are managed by nursing staff. Please ask a nurse to update vitals.');
  };

  const handleAddAllergy = () => {
    setNewAllergy({
      allergy_name: '',
      severity: 'mild',
      allergen_type: 'other',
      reaction: ''
    });
    setIsAllergyModalOpen(true);
  };

  const handleSaveAllergy = async () => {
    if (!newAllergy.allergy_name.trim()) {
      alert('Please enter an allergy name');
      return;
    }

    try {
      setLoading(true);
      const allergyData = {
        patient_id: selectedPatient.id,
        allergy_name: newAllergy.allergy_name.trim(),
        allergen_type: newAllergy.allergen_type,
        severity: newAllergy.severity,
        reaction: newAllergy.reaction.trim(),
        diagnosed_date: new Date().toISOString().split('T')[0]
      };

      const createdAllergy = await allergyService.createAllergy(allergyData);
      
      // Reload all medical data to ensure consistency
      await loadPatientMedicalData();
      
      setNewAllergy({
        allergy_name: '',
        severity: 'mild',
        allergen_type: 'other',
        reaction: ''
      });
      setIsAllergyModalOpen(false);
      alert('Allergy added successfully!');
    } catch (error) {
      console.error('Error saving allergy:', error);
      alert('Failed to save allergy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiagnosis = () => {
    setNewDiagnosis({
      diagnosis_name: '',
      diagnosed_date: new Date().toISOString().split('T')[0],
      status: 'active',
      severity: 'mild'
    });
    setIsDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = async () => {
    if (!newDiagnosis.diagnosis_name.trim()) {
      alert('Please enter a diagnosis');
      return;
    }

    try {
      setLoading(true);
      const diagnosisData = {
        patient_id: selectedPatient.id,
        diagnosis_name: newDiagnosis.diagnosis_name.trim(),
        diagnosed_date: newDiagnosis.diagnosed_date,
        status: newDiagnosis.status,
        severity: newDiagnosis.severity,
        // Remove diagnosed_by - let backend handle it with actual user from auth
      };

      const createdDiagnosis = await diagnosisService.createDiagnosis(diagnosisData);
      
      // Reload all medical data to ensure consistency
      await loadPatientMedicalData();
      
      setNewDiagnosis({
        diagnosis_name: '',
        diagnosed_date: new Date().toISOString().split('T')[0],
        status: 'active',
        severity: 'mild'
      });
      setIsDiagnosisModalOpen(false);
      alert('Diagnosis added successfully!');
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      alert('Failed to save diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    console.log('Add medication for patient:', selectedPatient?.id);
    // TODO: Implement medication management
  };

  const handleAddNote = () => {
    console.log('Add doctor note for patient:', selectedPatient?.id);
    // TODO: Implement doctor notes
  };

  const handleEditNote = (note, index) => {
    console.log('Edit doctor note:', note, 'at index:', index);
    // TODO: Implement doctor notes editing
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
      
      {loading ? (
        <LoadingState message="Loading visit history..." />
      ) : visitHistory && visitHistory.length > 0 ? (
        <div className="space-y-4">
          {visitHistory.map((visit, index) => (
            <VisitHistoryCard
              key={visit.id || `visit-${visit.visit_date}-${index}`}
              visit={visit}
              isExpanded={expandedVisit === index}
              onToggleExpand={(expanded) => setExpandedVisit(expanded ? index : null)}
              showDetailsButton={true}
            />
          ))}
        </div>
        ) : (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-base">No visit history available</p>
            <p className="text-gray-400 text-sm mt-2">
              Visit history will appear here once the patient completes visits
            </p>
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
    <PageLayout title="Patient Medical Records" subtitle="Complete patient medical record management (Doctor Access)" fullWidth={true}>
      <div className="space-y-6 w-full">
        {/* Patient Search */}
        {!selectedPatient && (
          <div className="space-y-4">
            {/* Back to Dashboard Button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => navigate('/doctor/dashboard')}
                className="flex items-center space-x-2 h-12 px-6 text-base"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            
            <PatientSearchInterface 
              patients={patientsData}
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
                    showAddButton={false}
                    showEditButton={false}
                  />
                  
                  <MedicalInformationPanel 
                    patient={{
                      ...selectedPatient,
                      allergies: (allergies || []).map(a => a?.allergy_name || 'Unknown').filter(Boolean),
                      diagnosisHistory: (diagnoses || []).map(d => ({
                        condition: d?.diagnosis_name || 'Unknown',
                        date: d?.diagnosed_date || 'Unknown'
                      })).filter(item => item.condition !== 'Unknown')
                    }}
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
                  userRole="doctor"
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

      {/* Allergy Modal - DOCTOR ACCESS ONLY */}
      <ModalComponent
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        title="Add New Allergy"
        size="md"
        onSave={handleSaveAllergy}
        saveText="Add Allergy"
        isLoading={loading}
        canSave={newAllergy.allergy_name.trim()}
      >
        <AllergyForm 
          allergy={newAllergy}
          onChange={setNewAllergy}
          disabled={loading}
        />
      </ModalComponent>

      {/* Diagnosis Modal - DOCTOR ACCESS ONLY */}
      <ModalComponent
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        title="Add New Diagnosis"
        size="md"
        onSave={handleSaveDiagnosis}
        saveText="Add Diagnosis"
        isLoading={loading}
        canSave={newDiagnosis.diagnosis_name.trim()}
      >
        <DiagnosisForm 
          diagnosis={newDiagnosis}
          onChange={setNewDiagnosis}
          disabled={loading}
        />
      </ModalComponent>
    </PageLayout>
  );
};

export default PatientMedicalRecordManagement;
