import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication on mount
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    
    if (isAuthenticated && userRole) {
      setUser({ role: userRole });
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    if (email === 'admin@clinic.com' && password === 'admin123') {
      const userData = { role: 'Admin' };
      setUser(userData);
      localStorage.setItem('userRole', 'Admin');
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin/dashboard');
      return true;
    } else if (email === 'receptionist.brown@clinic.com' && password === 'clinic123') {
      const userData = { role: 'Receptionist' };
      setUser(userData);
      localStorage.setItem('userRole', 'Receptionist');
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/receptionist/dashboard');
      return true;
    } else if (email === 'nurse@clinic.com' && password === 'nurse123') {
      const userData = { role: 'Nurse' };
      setUser(userData);
      localStorage.setItem('userRole', 'Nurse');
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/nurse/dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
