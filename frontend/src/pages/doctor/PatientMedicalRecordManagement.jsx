import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FormModal } from '@/components/library';
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
import prescriptionService from '../../services/prescriptionService';
import doctorNotesService from '../../services/doctorNotesService';
import documentService from '../../services/documentService';
import api from '../../services/api';
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ArrowLeft,
  AlertCircle
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
  const [latestVitals, setLatestVitals] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);

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

  // Tab configuration: show Doctor's Notes tab (view/add guarded by visit)
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Visit History', icon: Activity },
    { id: 'notes', label: "Doctor's Orders", icon: FileText },
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
      // Use patientId if available, otherwise fall back to id
      const patientIdToUse = selectedPatient.patientId || selectedPatient.id;
      
      // Load allergies, diagnoses, and visit history in parallel
      const [patientAllergies, patientDiagnoses, patientVisitHistory] = await Promise.all([
        allergyService.getAllergiesByPatient(patientIdToUse),
        diagnosisService.getDiagnosesByPatient(patientIdToUse),
        visitService.getPatientVisitHistory(patientIdToUse, { limit: 20, includeCompleted: true, includeInProgress: true })
      ]);
      
      setAllergies(Array.isArray(patientAllergies) ? patientAllergies : []);
      setDiagnoses(Array.isArray(patientDiagnoses) ? patientDiagnoses : []);
      setVisitHistory(Array.isArray(patientVisitHistory) ? patientVisitHistory : []);
      
      // Check if patient has an ACTIVE visit (in_progress status only)
      const activeVisit = Array.isArray(patientVisitHistory) 
        ? patientVisitHistory.find(v => v.status === 'in_progress')
        : null;
      
      setHasActiveVisit(!!activeVisit);
      console.log('🔍 [DOCTOR EMR] Active visit check:', { 
        hasActiveVisit: !!activeVisit, 
        activeVisitId: activeVisit?.id,
        visitStatus: activeVisit?.status,
        patientId: patientIdToUse 
      });
      
      // Extract vitals and prescriptions from the most recent visit
      if (Array.isArray(patientVisitHistory) && patientVisitHistory.length > 0) {
        const latestVisit = patientVisitHistory[0];
        setLatestVitals(latestVisit.vitals || null);
        
        // Collect all prescriptions from all visits
        const allPrescriptions = patientVisitHistory
          .filter(visit => visit.prescriptions && visit.prescriptions.length > 0)
          .flatMap(visit => visit.prescriptions);
        setPrescriptions(allPrescriptions);
      } else {
        setLatestVitals(null);
        setPrescriptions([]);
      }

      // Fetch doctor notes for this patient
      try {
        const notes = await doctorNotesService.getNotesByPatient(patientIdToUse);
        if (Array.isArray(notes) && notes.length > 0) {
          // Format notes for display and fetch prescriptions for each note
          const formattedNotes = await Promise.all(notes.map(async (note) => {
            // Parse the content to extract diagnosis and clinical notes
            const content = note.content || '';
            const diagnosisMatch = content.match(/Diagnosis:\s*(.+?)(?:\n\n|$)/);
            const notesMatch = content.match(/Clinical Notes:\s*(.+)/s);
            
            // Fetch prescriptions for this note's visit and doctor
            let prescriptions = [];
            if (note.visit_id) {
              try {
                const visitPrescriptions = await prescriptionService.getPrescriptionsByVisit(note.visit_id);
                
                // Filter prescriptions to only those by the same doctor and around the same time
                const noteTime = new Date(note.created_at).getTime();
                const timeWindow = 5 * 60 * 1000; // 5 minutes window
                
                prescriptions = Array.isArray(visitPrescriptions) 
                  ? visitPrescriptions
                      .filter(p => {
                        // Match by doctor ID
                        if (p.doctor_id !== note.doctor_id) return false;
                        
                        // Match by time window (prescriptions created within 5 minutes of note)
                        const prescriptionTime = new Date(p.created_at || p.prescribed_date).getTime();
                        const timeDiff = Math.abs(noteTime - prescriptionTime);
                        
                        return timeDiff <= timeWindow;
                      })
                      .map(p => ({
                        name: p.medication_name,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        quantity: p.quantity,
                        refills: p.refills,
                        instructions: p.instructions
                      }))
                  : [];
              } catch (error) {
                console.error('Error fetching prescriptions for visit:', note.visit_id, error);
              }
            }
            
            return {
              date: new Date(note.created_at).toLocaleDateString(),
              note: notesMatch ? notesMatch[1].trim() : content,
              diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : 'N/A',
              prescribedMedications: prescriptions
            };
          }));
          setDoctorNotes(formattedNotes);
        } else {
          setDoctorNotes([]);
        }
      } catch (error) {
        console.error('Failed to fetch doctor notes:', error);
        setDoctorNotes([]);
      }

      // Fetch patient documents
      try {
        const documents = await documentService.getPatientDocuments(patientIdToUse);
        const formattedDocs = Array.isArray(documents) ? documents.map(doc => ({
          id: doc.id,
          name: doc.document_name || doc.file_name || 'Unnamed Document',
          type: doc.document_type || 'other',
          size: doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown',
          uploadDate: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Unknown',
          uploadedBy: doc.uploader ? `${doc.uploader.first_name} ${doc.uploader.last_name} (${doc.uploader.role})` : 'Unknown',
          file_path: doc.file_path,
          mime_type: doc.mime_type
        })) : [];
        setPatientFiles(formattedDocs);
      } catch (error) {
        console.error('Failed to fetch patient documents:', error);
        setPatientFiles([]);
      }
    } catch (error) {
      console.error('Error loading patient medical data:', error);
      setAllergies([]);
      setDiagnoses([]);
      setVisitHistory([]);
      setLatestVitals(null);
      setPrescriptions([]);
      setDoctorNotes([]);
      setPatientFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setAllergies([]);
    setDiagnoses([]);
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
    setPatientFiles([]);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
    setPatientFiles([]);
  };

  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
    setPatientFiles([]);
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
    if (!hasActiveVisit) {
      alert('⚠️ No Active Visit\n\nCannot add allergy: Patient does not have an active visit.\n\nPlease start a consultation first.');
      return;
    }
    
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
      const patientIdToUse = selectedPatient.patientId || selectedPatient.id;
      const allergyData = {
        patient_id: patientIdToUse,
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
      
      // Check for specific error from backend
      if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
        alert('⚠️ Security Check Failed\n\nCannot add allergy: Patient does not have an active visit.\n\nPlease ensure the patient has an active consultation session before adding medical data.');
      } else {
        alert('Failed to save allergy: ' + (error.response?.data?.message || error.message || 'Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiagnosis = () => {
    if (!hasActiveVisit) {
      alert('⚠️ No Active Visit\n\nCannot add diagnosis: Patient does not have an active visit.\n\nPlease start a consultation first.');
      return;
    }
    
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
      const patientIdToUse = selectedPatient.patientId || selectedPatient.id;
      const diagnosisData = {
        patient_id: patientIdToUse,
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
      
      // Check for specific error from backend
      if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
        alert('⚠️ Security Check Failed\n\nCannot add diagnosis: Patient does not have an active visit.\n\nPlease ensure the patient has an active consultation session before adding medical data.');
      } else {
        alert('Failed to save diagnosis: ' + (error.response?.data?.message || error.message || 'Please try again.'));
      }
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
    if (!selectedPatient?.id) {
      alert('No patient selected');
      return;
    }

    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      try {
        setUploadingFiles(true);
        
        const patientId = selectedPatient.patientId || selectedPatient.id;
        const result = await documentService.uploadMultipleDocuments(patientId, files);
        
        if (result.success) {
          alert(`Successfully uploaded ${files.length} file(s)!`);
          // Reload patient documents
          await loadPatientMedicalData();
        }
        
      } catch (error) {
        console.error('Error uploading files:', error);
        alert(`Failed to upload files: ${error.message || 'Please try again.'}`);
      } finally {
        setUploadingFiles(false);
      }
    };
    
    input.click();
  };

  const handleViewFile = (file) => {
    // Open document in new tab for viewing
    const fileUrl = file.file_url || file.url;
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert('File URL not available');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const blob = await api.getBlob(`/documents/${file.id}/download`, {
        headers: { Accept: 'application/octet-stream' },
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.document_name || file.name || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file: ' + error.message);
    }
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
                <>
                  {!hasActiveVisit && (
                    <Card className="p-4 mb-4 bg-amber-50 border-amber-300">
                      <div className="flex items-center space-x-3 text-amber-800">
                        <AlertCircle size={20} />
                        <div>
                          <p className="font-semibold">No Active Consultation</p>
                          <p className="text-sm">Patient does not have an active consultation session. Medical data can only be added/edited during active consultations.</p>
                        </div>
                      </div>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <PatientVitalsDisplay 
                      vitals={latestVitals}
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
                        })).filter(item => item.condition !== 'Unknown'),
                        currentMedications: (prescriptions || [])
                          .filter(p => p.is_active)
                          .map(p => ({
                            name: p.medication_name,
                            dosage: p.dosage,
                            frequency: p.frequency
                          }))
                      }}
                      onAddAllergy={hasActiveVisit ? handleAddAllergy : undefined}
                      onAddDiagnosis={hasActiveVisit ? handleAddDiagnosis : undefined}
                      showActionButtons={hasActiveVisit}
                    />
                  </div>
                </>
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
      <FormModal
        isOpen={isAllergyModalOpen}
        onOpenChange={setIsAllergyModalOpen}
        title="Add New Allergy"
        size="md"
        onSubmit={handleSaveAllergy}
        submitText="Add Allergy"
        isLoading={loading}
        submitDisabled={!newAllergy.allergy_name.trim()}
      >
        <AllergyForm 
          allergy={newAllergy}
          onChange={setNewAllergy}
          disabled={loading}
        />
      </FormModal>

      {/* Diagnosis Modal - DOCTOR ACCESS ONLY */}
      <FormModal
        isOpen={isDiagnosisModalOpen}
        onOpenChange={setIsDiagnosisModalOpen}
        title="Add New Diagnosis"
        size="md"
        onSubmit={handleSaveDiagnosis}
        submitText="Add Diagnosis"
        isLoading={loading}
        submitDisabled={!newDiagnosis.diagnosis_name.trim()}
      >
        <DiagnosisForm 
          diagnosis={newDiagnosis}
          onChange={setNewDiagnosis}
          disabled={loading}
        />
      </FormModal>
    </PageLayout>
  );
};

export default PatientMedicalRecordManagement;
