import { AuthProvider } from '../contexts/AuthContext';
import { ErrorModalProvider } from '../contexts/ErrorModalContext.jsx';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorModalProvider>
          <FeedbackProvider>{children}</FeedbackProvider>
        </ErrorModalProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
