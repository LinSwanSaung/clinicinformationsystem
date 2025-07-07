import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import DoctorAvailability from './pages/admin/DoctorAvailability';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import AppointmentsPage from './pages/receptionist/AppointmentsPage';
import PatientListPage from './pages/receptionist/PatientListPage';
import PatientDetailPage from './pages/receptionist/PatientDetailPage';
import NurseDashboard from './pages/nurse/NurseDashboard';
import ElectronicMedicalRecords from './pages/nurse/ElectronicMedicalRecords';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientMedicalRecord from './pages/doctor/PatientMedicalRecord';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'receptionist') {
      return <Navigate to="/receptionist/dashboard" replace />;
    } else if (user.role === 'nurse') {
      return <Navigate to="/nurse/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'receptionist') {
      return <Navigate to="/receptionist/dashboard" replace />;
    } else if (user.role === 'nurse') {
      return <Navigate to="/nurse/dashboard" replace />;
    } else if (user.role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
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

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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
