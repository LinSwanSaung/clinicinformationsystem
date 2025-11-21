import { AuthProvider } from '../contexts/AuthContext';
import { ErrorModalProvider } from '../contexts/ErrorModalContext.jsx';
import { FeedbackProvider } from '../contexts/FeedbackContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ErrorModalProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </ErrorModalProvider>
    </AuthProvider>
  );
}
