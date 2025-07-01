import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { 
  User,
  Activity,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';

// Import our new reusable components
import PatientInformationHeader from '../../components/medical/PatientInformationHeader';
import NavigationTabs from '../../components/ui/NavigationTabs';
import PatientVitalsDisplay from '../../components/medical/PatientVitalsDisplay';
import MedicalInformationPanel from '../../components/medical/MedicalInformationPanel';
import ClinicalNotesDisplay from '../../components/medical/ClinicalNotesDisplay';
import PatientDocumentManager from '../../components/medical/PatientDocumentManager';

const PatientMedicalRecord = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [selectedPatient] = useState(location.state?.patient || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedVisit, setExpandedVisit] = useState(null);

  // Modal states for add functionality
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState({ condition: '', date: '' });
  const [newNote, setNewNote] = useState({
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

  // Common medications for dropdown
  const commonMedications = [
    'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
    'Lisinopril', 'Metformin', 'Atorvastatin', 'Omeprazole', 'Levothyroxine',
    'Amlodipine', 'Metoprolol', 'Hydrochlorothiazide', 'Prednisone', 'Albuterol',
    'Losartan', 'Gabapentin', 'Sertraline', 'Fluoxetine', 'Clopidogrel'
  ];

  // Common dosages for dropdown
  const commonDosages = [
    '5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg',
    '1 tablet', '2 tablets', '1 capsule', '2 capsules',
    '5ml', '10ml', '15ml', '1 teaspoon', '2 teaspoons',
    'Once daily', 'Twice daily', 'Three times daily', 'As needed'
  ];

  // Event handlers
  const handleClearSelection = () => {
    navigate('/doctor/dashboard');
  };

  const handleAddNote = () => {
    setIsAddNoteModalOpen(true);
  };

  const [doctorNotesList, setDoctorNotesList] = useState(doctorNotes);

  const handleSaveNote = () => {
    if (newNote.note.trim() && newNote.diagnosis.trim()) {
      const newNoteData = {
        date: new Date().toLocaleDateString(),
        note: newNote.note,
        diagnosis: newNote.diagnosis,
        prescribedMedications: newNote.medications.filter(med => med.name && med.dosage)
      };
      
      setDoctorNotesList(prev => [newNoteData, ...prev]);
      
      // Reset form and close modal
      setNewNote({ 
        note: '', 
        diagnosis: '', 
        medications: [{ name: '', dosage: '', reason: '' }] 
      });
      setIsAddNoteModalOpen(false);
    }
  };

  const handleAddMedication = () => {
    setNewNote(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', reason: '' }]
    }));
  };

  const handleRemoveMedication = (index) => {
    setNewNote(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    setNewNote(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const [editingNote, setEditingNote] = useState(null);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);

  const handleEditNote = (note, index) => {
    setEditingNote({ ...note, index });
    setIsEditNoteModalOpen(true);
    setNewNote({
      note: note.note,
      diagnosis: note.diagnosis || '',
      medications: note.prescribedMedications?.length > 0 
        ? note.prescribedMedications 
        : [{ name: '', dosage: '', reason: '' }]
    });
  };

  const handleUpdateNote = () => {
    if (newNote.note.trim() && newNote.diagnosis.trim() && editingNote) {
      const updatedNote = {
        date: editingNote.date,
        note: newNote.note,
        diagnosis: newNote.diagnosis,
        prescribedMedications: newNote.medications.filter(med => med.name && med.dosage)
      };

      setDoctorNotesList(prev => prev.map((note, index) => 
        index === editingNote.index ? updatedNote : note
      ));

      // Reset form and close modal
      setNewNote({ 
        note: '', 
        diagnosis: '', 
        medications: [{ name: '', dosage: '', reason: '' }] 
      });
      setIsEditNoteModalOpen(false);
      setEditingNote(null);
    }
  };

  const handleAddAllergy = () => {
    // TODO: Implement add allergy functionality
    console.log('Add allergy functionality would be implemented here');
  };

  const handleAddDiagnosis = () => {
    // TODO: Implement add diagnosis functionality
    console.log('Add diagnosis functionality would be implemented here');
  };

  return (
    <PageLayout 
      title="Electronic Medical Records" 
      subtitle={selectedPatient ? `Viewing record for ${selectedPatient.name}` : "Select a patient to view their medical record"}
      fullWidth
    >
      <div className="space-y-6 p-6">
        {/* Patient Header */}
        {selectedPatient && (
          <PatientInformationHeader 
            patient={selectedPatient}
            onBackClick={handleClearSelection}
            userRole="doctor"
          />
        )}

        {/* Navigation Tabs */}
        {selectedPatient && (
          <NavigationTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Tab Content */}
        {selectedPatient && (
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
        )}

        {/* No patient selected state */}
        {!selectedPatient && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <FileText className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-700">No Patient Selected</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Please go back to the dashboard and select a patient to view their medical records.
              </p>
              <button 
                onClick={() => navigate('/doctor/dashboard')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Add Note Modal */}
      <Dialog
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        title="Add Doctor's Note"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Diagnosis Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <Input
              value={newNote.diagnosis}
              onChange={(e) => setNewNote(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter primary diagnosis..."
              className="w-full"
            />
          </div>

          {/* Clinical Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newNote.note}
              onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Enter your clinical observations, treatment plan, and recommendations..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Medications Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Prescribed Medications
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMedication}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Add Medication
              </Button>
            </div>
            
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {newNote.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Medication Name
                      </label>
                      <select
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select medication...</option>
                        {commonMedications.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Dosage
                      </label>
                      <select
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select dosage...</option>
                        {commonDosages.map(dosage => (
                          <option key={dosage} value={dosage}>{dosage}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reason
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={medication.reason}
                          onChange={(e) => handleMedicationChange(index, 'reason', e.target.value)}
                          placeholder="Reason for prescription..."
                          className="text-sm"
                        />
                        {newNote.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-600 border-red-600 hover:bg-red-50 px-2"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!newNote.note.trim() || !newNote.diagnosis.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Note
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Note Modal */}
      <Dialog
        isOpen={isEditNoteModalOpen}
        onClose={() => {
          setIsEditNoteModalOpen(false);
          setEditingNote(null);
          setNewNote({ 
            note: '', 
            diagnosis: '', 
            medications: [{ name: '', dosage: '', reason: '' }] 
          });
        }}
        title="Edit Doctor's Note"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Diagnosis Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <Input
              value={newNote.diagnosis}
              onChange={(e) => setNewNote(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter primary diagnosis..."
              className="w-full"
            />
          </div>

          {/* Clinical Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newNote.note}
              onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Enter your clinical observations, treatment plan, and recommendations..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Medications Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Prescribed Medications
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMedication}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Add Medication
              </Button>
            </div>
            
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {newNote.medications.map((medication, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Medication Name
                      </label>
                      <select
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select medication...</option>
                        {commonMedications.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Dosage
                      </label>
                      <select
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select dosage...</option>
                        {commonDosages.map(dosage => (
                          <option key={dosage} value={dosage}>{dosage}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reason
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={medication.reason}
                          onChange={(e) => handleMedicationChange(index, 'reason', e.target.value)}
                          placeholder="Reason for prescription..."
                          className="text-sm"
                        />
                        {newNote.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-600 border-red-600 hover:bg-red-50 px-2"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditNoteModalOpen(false);
                setEditingNote(null);
                setNewNote({ 
                  note: '', 
                  diagnosis: '', 
                  medications: [{ name: '', dosage: '', reason: '' }] 
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNote}
              disabled={!newNote.note.trim() || !newNote.diagnosis.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Note
            </Button>
          </div>
        </div>
      </Dialog>
    </PageLayout>
  );
};

export default PatientMedicalRecord;
