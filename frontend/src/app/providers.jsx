import { AuthProvider } from '../contexts/AuthContext';
import { ErrorModalProvider } from '../contexts/ErrorModalContext.jsx';
import { FeedbackProvider } from '../contexts/FeedbackContext';

export function AppProviders({ children }) {
  // Currency cache will be initialized lazily when first needed
  // This prevents API calls before authentication is established

  return (
    <AuthProvider>
      <ErrorModalProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </ErrorModalProvider>
    </AuthProvider>
  );
}
