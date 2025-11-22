// Components
export { default as MedicalInformationPanel } from './components/MedicalInformationPanel';
export { default as PatientVitalsDisplay } from './components/PatientVitalsDisplay';
export { default as ClinicalNotesDisplay } from './components/ClinicalNotesDisplay';
export { default as PatientDocumentManager } from './components/PatientDocumentManager';

// Forms
export { default as AllergyForm } from './components/forms/AllergyForm';
export { default as DiagnosisForm } from './components/forms/DiagnosisForm';
export { MedicationForm } from './components/forms/MedicationForm';
export { default as PrescriptionForm } from './components/forms/PrescriptionForm';
export { DoctorNotesForm } from './components/forms/DoctorNotesForm';

// Hooks
export { useVitals } from './hooks/useVitals';
export { usePrescriptionsByPatient, usePrescriptionsByVisit } from './hooks/usePrescriptions';

// Services
export { default as vitalsService } from './services/vitalsService';
export { default as prescriptionService } from './services/prescriptionService';
export { allergyService } from './services/allergyService';
export { diagnosisService } from './services/diagnosisService';
export { default as doctorNotesService } from './services/doctorNotesService';
export { default as documentService } from './services/documentService';
