import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const ElectronicMedicalRecords = () => {
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
  const [loading, setLoading] = useState(false);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);

  // Tab configuration
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
      console.log('🔍 [NURSE EMR] Active visit check:', { 
        hasActiveVisit: !!activeVisit, 
        visitStatus: activeVisit?.status,
        activeVisitId: activeVisit?.id,
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
    } catch (error) {
      console.error('Error loading patient medical data:', error);
      setAllergies([]);
      setDiagnoses([]);
      setVisitHistory([]);
      setLatestVitals(null);
      setPrescriptions([]);
      setDoctorNotes([]);
    } finally {
      setLoading(false);
    }
  };

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
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
  };

  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setActiveTab('overview');
    setAllergies([]);
    setDiagnoses([]);
    setLatestVitals(null);
    setPrescriptions([]);
    setDoctorNotes([]);
  };

  // Medical action handlers - NURSES CANNOT ADD DIAGNOSIS/ALLERGY
  const handleAddVitals = () => {
    if (!hasActiveVisit) {
      console.warn('[NURSE EMR] Cannot add vitals - No active visit');
      return;
    }
    console.log('Add vitals for patient:', selectedPatient?.id);
    // TODO: Navigate to vitals entry or open modal
  };

  const handleEditVitals = () => {
    if (!hasActiveVisit) {
      console.warn('[NURSE EMR] Cannot edit vitals - No active visit');
      return;
    }
    console.log('Edit vitals for patient:', selectedPatient?.id);
    // TODO: Navigate to vitals entry or open modal
  };

  // Nurses cannot add allergies, diagnoses, medications, or notes - only doctors can
  // These functions are not needed as buttons are hidden for nurses
  const handleAddNote = () => {
    // Nurses cannot add notes - this should not be called
    console.warn('[NURSE EMR] Nurses cannot add clinical notes');
  };

  const handleEditNote = () => {
    // Nurses cannot edit notes - this should not be called
    console.warn('[NURSE EMR] Nurses cannot edit clinical notes');
  };

  const handleUploadFile = () => {
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      try {
        setLoading(true);
        
        // TODO: Implement actual file upload to backend
        alert(`Successfully selected ${files.length} file(s) for upload:\n${files.map(f => f.name).join('\n')}\n\nFile upload API integration pending.`);
        
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload files. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    input.click();
  };

  const handleViewFile = (file) => {
    console.log('View file:', file);
    alert(`File viewing functionality will open: ${file.name}\n\nThis requires backend integration.`);
  };

  const handleDownloadFile = (file) => {
    console.log('Download file:', file);
    alert(`File download functionality for: ${file.name}\n\nThis requires backend integration.`);
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
    <PageLayout title="Electronic Medical Records" subtitle="Patient medical record viewing (Nurse Access - View Only)" fullWidth={true}>
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
              {/* Loading State */}
              {loading && <LoadingState message="Loading patient medical data..." />}
              
              {/* Overview Tab */}
              {!loading && activeTab === 'overview' && (
                <>
                  {!hasActiveVisit && (
                    <Card className="p-4 mb-4 bg-amber-50 border-amber-300">
                      <div className="flex items-center space-x-3 text-amber-800">
                        <AlertCircle size={20} />
                        <div>
                          <p className="font-semibold">No Active Consultation</p>
                          <p className="text-sm">Patient does not have an active consultation session. Vitals can only be recorded during active consultations.</p>
                        </div>
                      </div>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <PatientVitalsDisplay 
                      vitals={latestVitals}
                      onAddVitals={hasActiveVisit ? handleAddVitals : undefined}
                      onEditVitals={hasActiveVisit ? handleEditVitals : undefined}
                      showAddButton={hasActiveVisit && !latestVitals}
                      showEditButton={hasActiveVisit && !!latestVitals}
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
                      showActionButtons={false}
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
    </PageLayout>
  );
};

export default ElectronicMedicalRecords;
