import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

