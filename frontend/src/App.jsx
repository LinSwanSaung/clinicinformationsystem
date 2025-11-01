import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import PatientAccountRegistration from './pages/admin/PatientAccountRegistration';
import DoctorAvailability from './pages/admin/DoctorAvailability';
import AuditLogs from './pages/admin/AuditLogs';
import PendingItems from './pages/admin/PendingItems';
import PaymentTransactions from './pages/admin/PaymentTransactions';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import AppointmentsPage from './pages/receptionist/AppointmentsPage';
import PatientListPage from './pages/receptionist/PatientListPage';
import PatientDetailPage from './pages/receptionist/PatientDetailPage';
import LiveQueuePage from './pages/receptionist/LiveQueuePage';
import DoctorQueueDetailPage from './pages/receptionist/DoctorQueueDetailPage';
import NurseDashboard from './pages/nurse/NurseDashboard';
import ElectronicMedicalRecords from './pages/nurse/ElectronicMedicalRecords';
import NursePatientQueuePage from './pages/nurse/NursePatientQueuePage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientMedicalRecord from './pages/doctor/PatientMedicalRecord';
import PatientMedicalRecordManagement from './pages/doctor/PatientMedicalRecordManagement';
import CashierDashboard from './pages/cashier/CashierDashboard';
import InvoiceManagement from './pages/cashier/InvoiceManagement';
import PatientPortalDashboard from './pages/patient/PatientPortalDashboard';
import PatientLiveQueue from './pages/patient/PatientLiveQueue';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Role-aware Dashboard Redirect */}
      <Route path="/dashboard" element={<RoleAwareDashboard />} />
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <AdminLogin />
        </PublicRoute>
      } />
      
      {/* Protected Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/employees" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EmployeeManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/schedules" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DoctorAvailability />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/patient-accounts" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PatientAccountRegistration />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/audit-logs" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/pending-items" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PendingItems />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/payment-transactions" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PaymentTransactions />
          </ProtectedRoute>
        } 
      />

      {/* Protected Receptionist Routes */}
      <Route 
        path="/receptionist/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/register-patient" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <RegisterPatient />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/appointments" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <AppointmentsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/patients" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <PatientListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/live-queue" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <LiveQueuePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/queue/:doctorId" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <DoctorQueueDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/patients/:id" 
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <PatientDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Nurse Routes */}
      <Route 
        path="/nurse/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <NurseDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/nurse/emr" 
        element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <ElectronicMedicalRecords />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/nurse/queue/:doctorId" 
        element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <NursePatientQueuePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Doctor Routes */}
      <Route 
        path="/doctor/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/patient-record" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PatientMedicalRecord />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/medical-records" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <PatientMedicalRecordManagement />
          </ProtectedRoute>
        } 
      />

      {/* Protected Cashier/Pharmacist Routes */}
      <Route 
        path="/cashier" 
        element={
          <ProtectedRoute allowedRoles={['cashier', 'pharmacist']}>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cashier/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['cashier', 'pharmacist']}>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cashier/invoice/:id" 
        element={
          <ProtectedRoute allowedRoles={['cashier', 'pharmacist']}>
            <InvoiceManagement />
          </ProtectedRoute>
        } 
      />

      {/* Protected Patient Routes */}
      <Route 
        path="/patient/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientPortalDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/queue" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLiveQueue />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patient/medical-records" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMedicalRecords />
          </ProtectedRoute>
        } 
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Redirects user to their role-specific dashboard
function RoleAwareDashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'receptionist':
      return <Navigate to="/receptionist/dashboard" replace />;
    case 'nurse':
      return <Navigate to="/nurse/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'cashier':
    case 'pharmacist':
      return <Navigate to="/cashier/dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <Router>
      <div className="App">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </div>
    </Router>
  );
}

export default App;
