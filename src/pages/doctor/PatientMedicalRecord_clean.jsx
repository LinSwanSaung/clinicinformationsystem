import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Modal } from '../../components/ui/modal';
import { DoctorNotesForm } from '../../components/medical/forms/DoctorNotesForm';
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Import our reusable medical components
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import PatientDocumentManager from '../../components/medical/PatientDocumentManager';

const PatientMedicalRecord = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Basic state
  const [selectedPatient] = useState(location.state?.patient || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);

  // Doctor notes management
  const [doctorNotesList, setDoctorNotesList] = useState([
    {
      date: "2024-01-15",
      note: "Patient presents with mild symptoms of seasonal allergies. No significant changes since last visit. Vital signs stable and within normal range. Continue current medication regimen. Patient reports good adherence to treatment plan.",
      diagnosis: "Seasonal Allergies",
      prescribedMedications: [
        { name: "Loratadine", dosage: "10mg", reason: "Seasonal allergies" },
        { name: "Nasal spray", dosage: "2 sprays daily", reason: "Congestion relief" }
      ]
    },
    {
      date: "2023-12-10",
      note: "Routine follow-up visit. Patient feeling well overall. Blood pressure slightly elevated, will monitor closely. Recommended lifestyle modifications including diet and exercise.",
      diagnosis: "Hypertension (mild)",
      prescribedMedications: [
        { name: "Lisinopril", dosage: "5mg", reason: "Blood pressure management" }
      ]
    }
  ]);

  // Modal states
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  // Form state
  const [noteFormData, setNoteFormData] = useState({
    note: '',
    diagnosis: '',
    medications: [{ name: '', dosage: '', reason: '' }]
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'Visit History', icon: Activity },
    { id: 'notes', label: "Doctor's Notes", icon: FileText },
    { id: 'files', label: 'Files & Images', icon: Calendar }
  ];

  // Patient files dummy data
  const patientFiles = [
    { name: "Blood Test Results - Jan 2024", type: "PDF", size: "2.1 MB" },
    { name: "Chest X-Ray - Dec 2023", type: "DICOM", size: "15.8 MB" },
    { name: "Prescription History", type: "PDF", size: "1.2 MB" }
  ];

  // Navigation check
  if (!selectedPatient) {
    navigate('/doctor/dashboard');
    return null;
  }

  // Event handlers
  const resetForm = () => {
    setNoteFormData({
      note: '',
      diagnosis: '',
      medications: [{ name: '', dosage: '', reason: '' }]
    });
  };

  const closeAllModals = () => {
    setIsAddNoteModalOpen(false);
    setIsEditNoteModalOpen(false);
    setEditingNote(null);
    resetForm();
  };

  const handleAddNote = () => {
    resetForm();
    setIsAddNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (noteFormData.note.trim() && noteFormData.diagnosis.trim()) {
      const newNote = {
        date: new Date().toLocaleDateString(),
        note: noteFormData.note,
        diagnosis: noteFormData.diagnosis,
        prescribedMedications: noteFormData.medications.filter(med => med.name && med.dosage)
      };
      
      setDoctorNotesList(prev => [newNote, ...prev]);
      closeAllModals();
    }
  };

  const handleEditNote = (note, index) => {
    setEditingNote({ ...note, index });
    setNoteFormData({
      note: note.note,
      diagnosis: note.diagnosis || '',
      medications: note.prescribedMedications?.length > 0 
        ? note.prescribedMedications 
        : [{ name: '', dosage: '', reason: '' }]
    });
    setIsEditNoteModalOpen(true);
  };

  const handleUpdateNote = () => {
    if (noteFormData.note.trim() && noteFormData.diagnosis.trim() && editingNote) {
      const updatedNote = {
        date: editingNote.date,
        note: noteFormData.note,
        diagnosis: noteFormData.diagnosis,
        prescribedMedications: noteFormData.medications.filter(med => med.name && med.dosage)
      };

      setDoctorNotesList(prev => prev.map((note, index) => 
        index === editingNote.index ? updatedNote : note
      ));

      closeAllModals();
    }
  };

  return (
    <PageLayout 
      title="Electronic Medical Records" 
      subtitle={`Viewing record for ${selectedPatient.name}`}
      fullWidth
    >
      <div className="space-y-6 p-6">
        {/* Patient Header */}
        <PatientInformationHeader 
          patient={selectedPatient}
          onBackClick={() => navigate('/doctor/dashboard')}
          userRole="doctor"
        />

        {/* Navigation Tabs */}
        <NavigationTabs 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PatientVitalsDisplay 
                vitals={selectedPatient.vitals}
                userRole="doctor"
                readOnly={false}
              />
              
              <MedicalInformationPanel 
                patient={selectedPatient}
                userRole="doctor"
                canAddDiagnosis={true}
                canAddPrescription={true}
                canAddAllergy={true}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Visit History</h3>
              <div className="space-y-4">
                {selectedPatient.visits?.map((visit, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedVisit(expandedVisit === index ? null : index)}
                    >
                      <div>
                        <p className="font-medium text-lg">{visit.date}</p>
                        <p className="text-sm text-gray-600">{visit.reason}</p>
                      </div>
                      {expandedVisit === index ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    
                    {expandedVisit === index && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Diagnosis:</h4>
                          <p className="text-gray-600">{visit.diagnosis}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Treatment:</h4>
                          <p className="text-gray-600">{visit.treatment}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Medications:</h4>
                          <ul className="list-disc list-inside text-gray-600">
                            {visit.medications?.map((med, medIndex) => (
                              <li key={medIndex}>{med}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No previous visits recorded</p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'notes' && (
            <ClinicalNotesDisplay 
              notes={doctorNotesList}
              userRole="doctor"
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
            />
          )}

          {activeTab === 'files' && (
            <PatientDocumentManager 
              files={patientFiles}
              userRole="doctor"
              canUpload={true}
              canDownload={true}
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
      </div>
    </PageLayout>
  );
};

export default PatientMedicalRecord;
