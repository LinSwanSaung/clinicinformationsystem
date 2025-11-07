import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth';
import logger from '@/utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login({ email, password });

      if (result.success) {
        setUser(result.data);
        // Centralize role-based redirect via /dashboard
        navigate('/dashboard');
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      logger.error('Login failed:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const registerPatientAccount = async (formData) => {
    const result = await authService.registerPatientAccount(formData);

    if (result.success) {
      setUser(result.data);
      navigate('/patient/link-record');
      return { success: true };
    }

    return { success: false, message: result.message };
  };

  const bindPatientRecord = async (patientNumber, dateOfBirth) => {
    const result = await authService.bindPatientAccount(patientNumber, dateOfBirth);

    if (result.success) {
      const updatedUser = result.data.user
        ? { ...result.data.user, token: result.data.token }
        : user;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return { success: true, patient: result.data.patient };
    }

    return { success: false, message: result.message };
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/');
    } catch (error) {
      logger.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      navigate('/');
    }
  };

  // Get current user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        getUserRole,
        isAuthenticated,
        registerPatientAccount,
        bindPatientRecord,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
