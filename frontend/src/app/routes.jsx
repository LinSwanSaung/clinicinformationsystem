import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants/roles';
import { AdminLogin } from '../features/auth';
import {
  AdminDashboard,
  EmployeeManagement,
  PatientAccountRegistration,
  DoctorAvailability,
  AuditLogs,
  PendingItems,
  PaymentTransactions,
} from '../features/admin';
import ServiceCatalog from '../features/services/pages/ServiceCatalog.jsx';
import { AppointmentsPage } from '../features/appointments';
import { PatientListPage, PatientDetailPage, RegisterPatientPage } from '../features/patients';
import { LiveQueuePage, DoctorQueueDetailPage, NursePatientQueuePage } from '../features/queue';
import {
  ElectronicMedicalRecords,
  PatientMedicalRecord,
  PatientMedicalRecordManagement,
} from '../features/visits';
import ReceptionistDashboard from '../pages/role-dashboards/ReceptionistDashboard';
import NurseDashboard from '../pages/role-dashboards/NurseDashboard';
import DoctorDashboard from '../pages/role-dashboards/DoctorDashboard';
import CashierDashboard from '../pages/role-dashboards/CashierDashboard';
import { InvoiceManagement } from '../features/billing';
import PatientPortalDashboard from '../pages/patient/PatientPortalDashboard';
import PatientLiveQueue from '../pages/patient/PatientLiveQueue';
import PatientMedicalRecords from '../pages/patient/PatientMedicalRecords';

// Protected Route Component
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route Component (redirects if already authenticated)
export const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Redirects user to their role-specific dashboard
export function RoleAwareDashboard() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  switch (user.role) {
    case ROLES.ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    case ROLES.RECEPTIONIST:
      return <Navigate to="/receptionist/dashboard" replace />;
    case ROLES.NURSE:
      return <Navigate to="/nurse/dashboard" replace />;
    case ROLES.DOCTOR:
      return <Navigate to="/doctor/dashboard" replace />;
    case ROLES.CASHIER:
    case ROLES.PHARMACIST:
      return <Navigate to="/cashier/dashboard" replace />;
    case 'patient': // Patient role not in ROLES constant yet
      return <Navigate to="/patient/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Role-aware Dashboard Redirect */}
      <Route path="/dashboard" element={<RoleAwareDashboard />} />
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />

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
        path="/admin/services"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ServiceCatalog />
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
            <RegisterPatientPage />
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
