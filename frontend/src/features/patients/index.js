// Pages
export { default as PatientListPage } from './pages/PatientListPage';
export { default as PatientDetailPage } from './pages/PatientDetailPage';
export { default as RegisterPatientPage } from './pages/RegisterPatientPage';

// Components
export { default as PatientList } from './components/PatientList';
export { default as ReceptionistPatientCard } from './components/ReceptionistPatientCard';
export { default as PatientCard } from './components/PatientCard';
export { default as PatientSearchInterface } from './components/PatientSearchInterface';
export { default as PatientInformationHeader } from './components/PatientInformationHeader';
export { PatientStats } from './components/PatientStats';

// Hooks
export { usePatients } from './hooks/usePatients';
export { usePatient } from './hooks/usePatient';

// Services
export { default as patientService } from './services/patientService';
export { default as patientAccountService } from './services/patientAccountService';
export { default as patientPortalService } from './services/patientPortalService';
