import { AuthProvider } from '../contexts/AuthContext';
import { ErrorModalProvider } from '../contexts/ErrorModalContext.jsx';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ErrorModalProvider>{children}</ErrorModalProvider>
    </AuthProvider>
  );
}
