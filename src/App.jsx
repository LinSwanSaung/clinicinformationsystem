import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import RegisterPatient from './pages/receptionist/RegisterPatient';
import AppointmentsPage from './pages/receptionist/AppointmentsPage';
import PatientListPage from './pages/receptionist/PatientListPage';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/receptionist/dashboard'} replace />;
  }
  
  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/receptionist/dashboard'} replace />;
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
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/employees" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <EmployeeManagement />
          </ProtectedRoute>
        } 
      />

      {/* Protected Receptionist Routes */}
      <Route 
        path="/receptionist/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/register-patient" 
        element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <RegisterPatient />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/appointments" 
        element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <AppointmentsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receptionist/patients" 
        element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <PatientListPage />
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
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
