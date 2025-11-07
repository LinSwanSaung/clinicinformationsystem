import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Modal } from '../../components/ui/modal';
import { DoctorNotesForm } from '../../components/medical/forms/DoctorNotesForm';
import DiagnosisForm from '../../components/medical/forms/DiagnosisForm';
import AllergyForm from '../../components/medical/forms/AllergyForm';
import { User, Activity, Calendar, FileText, DollarSign, AlertCircle } from 'lucide-react';

// Import our reusable medical components
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import ServiceSelector from '../../components/ServiceSelector';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import PatientDocumentManager from '../../components/medical/PatientDocumentManager';
import VisitHistoryCard from '../../components/medical/VisitHistoryCard';
import { allergyService } from '../../services/allergyService';
import { diagnosisService } from '../../services/diagnosisService';
import { visitService } from '../../services/visitService';
import prescriptionService from '../../services/prescriptionService';
import doctorNotesService from '../../services/doctorNotesService';
import documentService from '../../services/documentService';

const PatientMedicalRecord = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Basic state
  const [selectedPatient] = useState(location.state?.patient || null);
  const [fullPatientData, setFullPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  // const [expandedVisit, setExpandedVisit] = useState(null); // Reserved for future use
  const [activeVisitId, setActiveVisitId] = useState(null); // Don't initialize from location.state, verify it first
  const [hasActiveVisit, setHasActiveVisit] = useState(false);
  const [visitCheckComplete, setVisitCheckComplete] = useState(false); // Track if visit check is done
  const [patientFiles, setPatientFiles] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Doctor notes management
  const [doctorNotesList, setDoctorNotesList] = useState([
    {
      date: '2024-01-15',
      note: 'Patient presents with mild symptoms of seasonal allergies. No significant changes since last visit. Vital signs stable and within normal range. Continue current medication regimen. Patient reports good adherence to treatment plan.',
      diagnosis: 'Seasonal Allergies',
      prescribedMedications: [
        { name: 'Loratadine', dosage: '10mg', reason: 'Seasonal allergies' },
        { name: 'Nasal spray', dosage: '2 sprays daily', reason: 'Congestion relief' },
      ],
    },
    {
      date: '2023-12-10',
      note: 'Routine follow-up visit. Patient feeling well overall. Blood pressure slightly elevated, will monitor closely. Recommended lifestyle modifications including diet and exercise.',
      diagnosis: 'Hypertension (mild)',
      prescribedMedications: [
        { name: 'Lisinopril', dosage: '5mg', reason: 'Blood pressure management' },
      ],
    },
  ]);

  // Modal states
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isAddDiagnosisModalOpen, setIsAddDiagnosisModalOpen] = useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);

  // Form state for diagnosis and allergy
  const [diagnosisFormData, setDiagnosisFormData] = useState({
    diagnosis_name: '',
    icd_10_code: '',
    category: 'primary',
    status: 'active',
    severity: 'mild',
    notes: '',
  });

  const [allergyFormData, setAllergyFormData] = useState({
    allergy_name: '',
    allergen_type: 'medication',
    severity: 'mild',
    reaction: '',
    notes: '',
  });

  // Form state
  const [noteFormData, setNoteFormData] = useState({
    note: '',
    diagnosis: '',
    medications: [
      {
        name: '',
        dosage: '',
        frequency: '',
        frequencyValue: 0,
        duration: '',
        durationDays: 0,
        quantity: '',
        refills: 0,
        instructions: '',
        customName: false,
        customDosage: false,
      },
    ],
  });

  // Tab configuration: show Doctor's Notes tab (doctor can add only with active visit)
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Visit History', icon: Activity },
    { id: 'notes', label: "Doctor's Orders", icon: FileText },
    { id: 'services', label: 'Services & Billing', icon: DollarSign },
    { id: 'files', label: 'Files & Images', icon: Calendar },
  ];

  // Fetch full patient data including allergies and diagnoses
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!selectedPatient?.id) {
        navigate('/doctor/dashboard');
        return;
      }

      try {
        setLoading(true);

        // Check for ACTIVE visit using visit history (same approach as nurse's view)
        try {
          setVisitCheckComplete(false); // Reset check flag

          // Fetch visit history with in-progress visits included
          const visitHistory = await visitService.getPatientVisitHistory(selectedPatient.id, {
            includeCompleted: true,
            includeInProgress: true,
            limit: 50,
          });

          // Ensure we have an array
          const visitsArray = Array.isArray(visitHistory) ? visitHistory : [];

          // Find active visit (status === 'in_progress' exactly)
          // Normalize status check: trim whitespace and compare case-insensitively
          const normalizeStatus = (status) => {
            if (!status) {
              return '';
            }
            return String(status).trim().toLowerCase();
          };

          // Explicitly check for 'in_progress' and exclude 'completed' and 'cancelled'
          const activeVisit = visitsArray.find((v) => {
            if (!v || !v.id) {
              return false;
            }
            const status = normalizeStatus(v.status);
            // Only match 'in_progress', explicitly exclude others
            const isInProgress = status === 'in_progress';
            const isNotCompleted = status !== 'completed';
            const isNotCancelled = status !== 'cancelled';
            return isInProgress && isNotCompleted && isNotCancelled;
          });

          // Set state atomically
          if (activeVisit?.id) {
            setActiveVisitId(activeVisit.id);
            setHasActiveVisit(true);
            setVisitCheckComplete(true);
            console.log('🔍 [DOCTOR PMR] Active visit found:', {
              visitId: activeVisit.id,
              status: activeVisit.status,
              normalizedStatus: normalizeStatus(activeVisit.status),
              patientId: selectedPatient.id,
            });
          } else {
            setActiveVisitId(null);
            setHasActiveVisit(false);
            setVisitCheckComplete(true);
            console.log(
              '🔍 [DOCTOR PMR] No active visit found - patient cannot have medical data added',
              {
                patientId: selectedPatient.id,
                visitHistoryLength: visitsArray.length,
                visitStatuses: visitsArray.map((v) => ({
                  raw: v?.status,
                  normalized: normalizeStatus(v?.status),
                  id: v?.id,
                })),
              }
            );
          }
        } catch (error) {
          // No active visit found
          console.error('🔍 [DOCTOR PMR] Error checking active visit:', error);
          setActiveVisitId(null);
          setHasActiveVisit(false);
          setVisitCheckComplete(true);
        }

        // Fetch allergies
        const allergies = await allergyService.getAllergiesByPatient(selectedPatient.id);

        // Fetch diagnoses
        const diagnoses = await diagnosisService.getDiagnosesByPatient(selectedPatient.id, true);

        // Fetch visit history (include in-progress visits for consistency)
        const visits = await visitService.getPatientVisitHistory(selectedPatient.id, {
          includeCompleted: true,
          includeInProgress: true,
          limit: 50,
        });

        // Fetch doctor notes for this patient
        try {
          const notes = await doctorNotesService.getNotesByPatient(selectedPatient.id);
          if (Array.isArray(notes) && notes.length > 0) {
            // Format notes for display and fetch prescriptions for each note
            const formattedNotes = await Promise.all(
              notes.map(async (note) => {
                // Parse the content to extract diagnosis and clinical notes
                const content = note.content || '';
                const diagnosisMatch = content.match(/Diagnosis:\s*(.+?)(?:\n\n|$)/);
                const notesMatch = content.match(/Clinical Notes:\s*(.+)/s);

                // Fetch prescriptions for this note's visit and doctor
                let prescriptions = [];
                if (note.visit_id) {
                  try {
                    const visitPrescriptions = await prescriptionService.getPrescriptionsByVisit(
                      note.visit_id
                    );

                    // Filter prescriptions to only those by the same doctor and around the same time
                    const noteTime = new Date(note.created_at).getTime();
                    const timeWindow = 5 * 60 * 1000; // 5 minutes window

                    prescriptions = Array.isArray(visitPrescriptions)
                      ? visitPrescriptions
                          .filter((p) => {
                            // Match by doctor ID
                            if (p.doctor_id !== note.doctor_id) {
                              return false;
                            }

                            // Match by time window (prescriptions created within 5 minutes of note)
                            const prescriptionTime = new Date(
                              p.created_at || p.prescribed_date
                            ).getTime();
                            const timeDiff = Math.abs(noteTime - prescriptionTime);

                            return timeDiff <= timeWindow;
                          })
                          .map((p) => ({
                            name: p.medication_name,
                            dosage: p.dosage,
                            frequency: p.frequency,
                            duration: p.duration,
                            quantity: p.quantity,
                            refills: p.refills,
                            instructions: p.instructions,
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
                  prescribedMedications: prescriptions,
                };
              })
            );
            setDoctorNotesList(formattedNotes);
          }
        } catch (error) {
          console.error('Failed to fetch doctor notes:', error);
        }

        // Get prescriptions from most recent visit for "Current Medications" overview
        const mostRecentVisit = Array.isArray(visits) && visits.length > 0 ? visits[0] : null;
        const recentPrescriptions = mostRecentVisit?.prescriptions || [];

        // Fetch patient documents
        try {
          const documents = await documentService.getPatientDocuments(selectedPatient.id);
          const formattedDocs = Array.isArray(documents)
            ? documents.map((doc) => ({
                id: doc.id,
                name: doc.document_name || doc.file_name || 'Unnamed Document',
                type: doc.document_type || 'other',
                size: doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown',
                uploadDate: doc.created_at
                  ? new Date(doc.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown',
                uploadedBy: doc.uploader
                  ? `${doc.uploader.first_name} ${doc.uploader.last_name} (${doc.uploader.role})`
                  : 'Unknown',
                file_path: doc.file_path,
                mime_type: doc.mime_type,
              }))
            : [];
          setPatientFiles(formattedDocs);
        } catch (error) {
          console.error('Failed to fetch patient documents:', error);
          setPatientFiles([]);
        }

        // Combine all data
        const enrichedPatient = {
          ...selectedPatient,
          allergies: Array.isArray(allergies) ? allergies.map((a) => a.allergy_name) : [],
          diagnosisHistory: Array.isArray(diagnoses)
            ? diagnoses.map((d) => ({
                condition: d.diagnosis_name,
                date: new Date(d.diagnosed_date).toLocaleDateString(),
              }))
            : [],
          visits: Array.isArray(visits) ? visits : [],
          currentMedications: recentPrescriptions.map((p) => ({
            name: p.medication_name,
            dosage: p.dosage,
            frequency: p.frequency,
          })),
        };

        setFullPatientData(enrichedPatient);
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
        setFullPatientData(selectedPatient); // Fallback to basic data
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [selectedPatient?.id, navigate]);

  // Navigation check
  if (!selectedPatient) {
    navigate('/doctor/dashboard');
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <PageLayout title="Patient Medical Record" subtitle="Loading patient data..." fullWidth>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  // Use fullPatientData if available, otherwise fallback to selectedPatient
  const displayPatient = fullPatientData || selectedPatient;

  // Event handlers
  const resetForm = () => {
    setNoteFormData({
      note: '',
      diagnosis: '',
      medications: [
        {
          name: '',
          dosage: '',
          frequency: '',
          frequencyValue: 0,
          duration: '',
          durationDays: 0,
          quantity: '',
          refills: 0,
          instructions: '',
          customName: false,
          customDosage: false,
        },
      ],
    });
  };

  const closeAllModals = () => {
    setIsAddNoteModalOpen(false);
    setIsEditNoteModalOpen(false);
    setEditingNote(null);
    resetForm();
  };

  const handleAddNote = () => {
    // Check for active visit first
    if (!activeVisitId) {
      alert(
        "⚠️ No Visit Today\n\nCannot add clinical notes: Patient does not have a visit from today.\n\nMedical data can only be added for today's visits."
      );
      return;
    }

    resetForm();
    setIsAddNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteFormData.note.trim() || !noteFormData.diagnosis.trim()) {
      alert('Diagnosis and clinical notes are required');
      return;
    }

    if (!activeVisitId) {
      alert('No active visit found. Please ensure the patient has an active consultation.');
      return;
    }

    try {
      // Filter medications that have required fields
      const validMedications = noteFormData.medications.filter(
        (med) => med.name && med.dosage && med.frequency
      );

      // Step 1: Mark previous active prescriptions as completed
      // This ensures old medications don't remain "active" when new ones are prescribed
      try {
        // Get ALL prescriptions including inactive ones to find active ones
        const allPatientPrescriptions = await prescriptionService.getPrescriptionsByPatient(
          displayPatient.id,
          true
        );
        const activePrescriptions = Array.isArray(allPatientPrescriptions)
          ? allPatientPrescriptions.filter((p) => p.status === 'active')
          : [];

        if (activePrescriptions.length > 0) {
          // Mark each active prescription as completed
          const updatePromises = activePrescriptions.map((prescription) =>
            prescriptionService.updatePrescriptionStatus(prescription.id, 'completed')
          );

          // Wait for all updates to complete
          await Promise.all(updatePromises);
        }
      } catch (error) {
        console.error('Error fetching/updating previous prescriptions:', error);
      }

      // Step 2: Save the doctor note to the database
      const noteData = {
        visit_id: activeVisitId,
        patient_id: displayPatient.id,
        doctor_id: JSON.parse(localStorage.getItem('user'))?.id,
        note_type: 'assessment', // Using valid note_type from schema
        content: `Diagnosis: ${noteFormData.diagnosis}\n\nClinical Notes: ${noteFormData.note}`,
        is_private: false,
      };

      await doctorNotesService.createNote(noteData);

      // Step 3: Save new prescriptions to database (with status: 'active')
      const savedPrescriptions = [];
      for (const med of validMedications) {
        try {
          const prescription = await prescriptionService.createPrescription({
            patient_id: displayPatient.id,
            doctor_id: JSON.parse(localStorage.getItem('user'))?.id,
            visit_id: activeVisitId,
            medication_name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration || null,
            quantity: med.quantity || null,
            refills: med.refills || 0,
            instructions: med.instructions || null,
            status: 'active',
            prescribed_date: new Date().toISOString().split('T')[0],
          });
          savedPrescriptions.push(prescription);
        } catch (error) {
          console.error('Error saving prescription:', error);

          // Check for specific error from backend
          if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
            alert(
              '⚠️ Security Check Failed\n\nCannot add prescription: Patient does not have an active visit.\n\nPlease ensure the patient has an active consultation session before prescribing medications.'
            );
            throw error; // Stop processing
          }
        }
      }

      // Show success message
      alert(`Note saved successfully! ${savedPrescriptions.length} prescription(s) added.`);

      // Close modal
      closeAllModals();

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditNote = (note, index) => {
    setEditingNote({ ...note, index });
    setNoteFormData({
      note: note.note,
      diagnosis: note.diagnosis || '',
      medications:
        note.prescribedMedications?.length > 0
          ? note.prescribedMedications
          : [
              {
                name: '',
                dosage: '',
                frequency: '',
                frequencyValue: 0,
                duration: '',
                durationDays: 0,
                quantity: '',
                refills: 0,
                instructions: '',
                customName: false,
                customDosage: false,
              },
            ],
    });
    setIsEditNoteModalOpen(true);
  };

  const handleUpdateNote = () => {
    if (noteFormData.note.trim() && noteFormData.diagnosis.trim() && editingNote) {
      const updatedNote = {
        date: editingNote.date,
        note: noteFormData.note,
        diagnosis: noteFormData.diagnosis,
        prescribedMedications: noteFormData.medications.filter(
          (med) => med.name && med.dosage && med.frequency
        ),
      };

      setDoctorNotesList((prev) =>
        prev.map((note, index) => (index === editingNote.index ? updatedNote : note))
      );

      closeAllModals();
    }
  };

  // Diagnosis handlers
  const handleAddDiagnosis = () => {
    // Require active visit to add diagnosis
    if (!activeVisitId) {
      alert(
        '⚠️ No Visit Today\n\nCannot add diagnosis: Patient does not have an active consultation.'
      );
      return;
    }

    // Reset form
    setDiagnosisFormData({
      diagnosis_name: '',
      icd_10_code: '',
      category: 'primary',
      status: 'active',
      severity: 'mild',
      notes: '',
    });
    setIsAddDiagnosisModalOpen(true);
  };

  const handleSaveDiagnosis = async () => {
    try {
      // Validate required fields
      if (!diagnosisFormData.diagnosis_name.trim()) {
        alert('Diagnosis name is required');
        return;
      }

      if (!activeVisitId) {
        alert('No active visit found. Please ensure the patient has an active consultation.');
        return;
      }

      // Map form field names to database column names
      const diagnosisDataForDB = {
        patient_id: displayPatient.id,
        visit_id: activeVisitId,
        diagnosis_name: diagnosisFormData.diagnosis_name,
        diagnosis_code: diagnosisFormData.icd_10_code, // Map icd_10_code → diagnosis_code
        diagnosis_type: diagnosisFormData.category, // Map category → diagnosis_type
        status: diagnosisFormData.status,
        severity: diagnosisFormData.severity,
        notes: diagnosisFormData.notes,
        diagnosed_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      };

      await diagnosisService.createDiagnosis(diagnosisDataForDB);

      // Close modal and reset form immediately
      setIsAddDiagnosisModalOpen(false);
      setDiagnosisFormData({
        diagnosis_name: '',
        icd_10_code: '',
        category: 'primary',
        status: 'active',
        severity: 'mild',
        notes: '',
      });

      // Show success message
      alert('Diagnosis added successfully!');

      // Refresh the page to show new diagnosis
      window.location.reload();
    } catch (error) {
      console.error('Error adding diagnosis:', error);

      // Check for specific error from backend
      if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
        alert(
          '⚠️ Security Check Failed\n\nCannot add diagnosis: Patient does not have an active visit.'
        );
      } else {
        alert(
          'Failed to add diagnosis: ' +
            (error.response?.data?.message || error.message || 'Unknown error')
        );
      }
    }
  };

  // Allergy handlers
  const handleAddAllergy = () => {
    // Require active visit to add allergy
    if (!activeVisitId) {
      alert(
        '⚠️ No Visit Today\n\nCannot add allergy: Patient does not have an active consultation.'
      );
      return;
    }

    // Reset form
    setAllergyFormData({
      allergy_name: '',
      allergen_type: 'medication',
      severity: 'mild',
      reaction: '',
      notes: '',
    });
    setIsAddAllergyModalOpen(true);
  };

  const handleSaveAllergy = async () => {
    try {
      // Validate required fields
      if (!allergyFormData.allergy_name.trim()) {
        alert('Allergy name is required');
        return;
      }

      if (!activeVisitId) {
        alert('No active visit found. Please ensure the patient has an active consultation.');
        return;
      }

      await allergyService.createAllergy({
        patient_id: displayPatient.id,
        visit_id: activeVisitId,
        ...allergyFormData,
      });

      // Close modal and reset form immediately
      setIsAddAllergyModalOpen(false);
      setAllergyFormData({
        allergy_name: '',
        allergen_type: 'medication',
        severity: 'mild',
        reaction: '',
        notes: '',
      });

      // Show success message
      alert('Allergy added successfully!');

      // Refresh the page to show new allergy
      window.location.reload();
    } catch (error) {
      console.error('Error adding allergy:', error);

      // Check for specific error from backend
      if (error.response?.data?.code === 'NO_ACTIVE_VISIT') {
        alert(
          '⚠️ Security Check Failed\n\nCannot add allergy: Patient does not have an active visit.'
        );
      } else {
        alert(
          'Failed to add allergy: ' +
            (error.response?.data?.message || error.message || 'Unknown error')
        );
      }
    }
  };

  // File handlers
  const handleUploadFile = () => {
    if (!selectedPatient?.id) {
      alert('No patient selected');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        return;
      }

      try {
        setUploadingFiles(true);

        const patientId = selectedPatient.id;
        const result = await documentService.uploadMultipleDocuments(patientId, files);

        if (result.success) {
          alert(`Successfully uploaded ${files.length} file(s)!`);
          // Reload documents
          const documents = await documentService.getPatientDocuments(patientId);
          setPatientFiles(Array.isArray(documents) ? documents : []);
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
    if (file.file_url) {
      window.open(file.file_url, '_blank');
    } else {
      alert('File URL not available');
    }
  };

  const handleDownloadFile = (file) => {
    if (file.file_url) {
      window.open(file.file_url, '_blank');
    } else {
      alert('File URL not available');
    }
  };

  return (
    <PageLayout
      title="Electronic Medical Records"
      subtitle={`Viewing record for ${displayPatient.name}`}
      fullWidth
    >
      <div className="space-y-6 p-6">
        {/* Patient Header */}
        <PatientInformationHeader
          patient={displayPatient}
          onBackClick={() => navigate('/doctor/dashboard')}
          userRole="doctor"
        />

        {/* Navigation Tabs */}
        <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <>
              {!loading && visitCheckComplete && !hasActiveVisit && (
                <Card className="mb-4 border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center space-x-3 text-amber-800">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-semibold">No Active Consultation</p>
                      <p className="text-sm">
                        Patient does not have an active consultation session. Medical data can only
                        be added during active consultations.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <PatientVitalsDisplay
                  vitals={displayPatient.vitals}
                  userRole="doctor"
                  readOnly={false}
                />

                <MedicalInformationPanel
                  patient={displayPatient}
                  userRole="doctor"
                  onAddDiagnosis={activeVisitId ? handleAddDiagnosis : undefined}
                  onAddAllergy={activeVisitId ? handleAddAllergy : undefined}
                  showActionButtons={!!activeVisitId}
                />
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="mb-6 text-xl font-semibold text-gray-800">Patient Visit History</h3>
              {displayPatient.visits && displayPatient.visits.length > 0 ? (
                displayPatient.visits.map((visit, index) => (
                  <VisitHistoryCard
                    key={visit.id || `visit-${index}`}
                    visit={visit}
                    patientName={displayPatient.name}
                    userRole="doctor"
                  />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Activity size={48} className="text-gray-300" />
                    <div>
                      <p className="text-lg font-medium text-gray-600">
                        No visit history available
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Visit history will appear here once the patient completes visits
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <>
              {!loading && visitCheckComplete && !hasActiveVisit && (
                <Card className="mb-4 border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center space-x-3 text-amber-800">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-semibold">No Active Consultation</p>
                      <p className="text-sm">
                        Cannot add clinical notes without an active consultation session.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              <ClinicalNotesDisplay
                notes={doctorNotesList}
                userRole="doctor"
                onAddNote={activeVisitId ? handleAddNote : undefined}
                onEditNote={activeVisitId ? handleEditNote : undefined}
              />
            </>
          )}

          {activeTab === 'services' && (
            <ServiceSelector
              visitId={activeVisitId}
              onServicesAdded={() => {
                // Optionally refresh data or show success message
                console.log('Services added successfully');
              }}
            />
          )}

          {activeTab === 'files' && (
            <PatientDocumentManager
              files={patientFiles}
              onUploadFile={handleUploadFile}
              onViewFile={handleViewFile}
              onDownloadFile={handleDownloadFile}
              showUploadButton={true}
            />
          )}
        </div>

        {/* Add Note Modal */}
        <Modal
          isOpen={isAddNoteModalOpen}
          onClose={closeAllModals}
          title="Add Doctor's Note"
          size="large"
        >
          <DoctorNotesForm
            formData={noteFormData}
            onChange={setNoteFormData}
            onSubmit={handleSaveNote}
            onCancel={closeAllModals}
            isEditing={false}
          />
        </Modal>

        {/* Edit Note Modal */}
        <Modal
          isOpen={isEditNoteModalOpen}
          onClose={closeAllModals}
          title="Edit Doctor's Note"
          size="large"
        >
          <DoctorNotesForm
            formData={noteFormData}
            onChange={setNoteFormData}
            onSubmit={handleUpdateNote}
            onCancel={closeAllModals}
            isEditing={true}
          />
        </Modal>

        {/* Add Diagnosis Modal */}
        <Modal
          isOpen={isAddDiagnosisModalOpen}
          onClose={() => setIsAddDiagnosisModalOpen(false)}
          title="Add Diagnosis"
          size="small"
        >
          <div className="space-y-4">
            {!activeVisitId && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Patient does not have an active visit. This diagnosis will be recorded without
                linking to a visit.
              </div>
            )}
            <DiagnosisForm
              diagnosis={diagnosisFormData}
              onChange={setDiagnosisFormData}
              disabled={false}
            />
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setIsAddDiagnosisModalOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiagnosis}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Save Diagnosis
              </button>
            </div>
          </div>
        </Modal>

        {/* Add Allergy Modal */}
        <Modal
          isOpen={isAddAllergyModalOpen}
          onClose={() => setIsAddAllergyModalOpen(false)}
          title="Add Allergy"
          size="small"
        >
          <div className="space-y-4">
            {!activeVisitId && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Patient does not have an active visit. This allergy will be recorded without linking
                to a visit.
              </div>
            )}
            <AllergyForm allergy={allergyFormData} onChange={setAllergyFormData} disabled={false} />
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setIsAddAllergyModalOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllergy}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Save Allergy
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default PatientMedicalRecord;
