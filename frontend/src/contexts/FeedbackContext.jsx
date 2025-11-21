import { createContext, useCallback, useContext, useState, useMemo } from 'react';
import { ToastContainer } from '@/components/library/feedback/Toast';

const FeedbackContext = createContext({
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

let toastIdCounter = 0;

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type, options) => {
    const id = `toast-${++toastIdCounter}`;
    const {
      title,
      message,
      duration = type === 'error' ? null : type === 'success' ? 4000 : 5000,
      action,
    } = options;

    const toast = {
      id,
      type,
      title,
      message,
      duration,
      action,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const showSuccess = useCallback(
    (message, options = {}) => {
      return addToast('success', {
        message,
        title: options.title || 'Success',
        duration: options.duration || 4000,
        action: options.action,
      });
    },
    [addToast]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return addToast('error', {
        message,
        title: options.title || 'Error',
        duration: null, // Errors don't auto-dismiss
        action: options.action,
      });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return addToast('warning', {
        message,
        title: options.title || 'Warning',
        duration: options.duration || 5000,
        action: options.action,
      });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return addToast('info', {
        message,
        title: options.title || 'Information',
        duration: options.duration || 5000,
        action: options.action,
      });
    },
    [addToast]
  );

  const value = useMemo(
    () => ({
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showSuccess, showError, showWarning, showInfo]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </FeedbackContext.Provider>
  );
}

/**
 * Hook to use feedback system across all components
 * 
 * @example
 * const { showSuccess, showError } = useFeedback();
 * 
 * // Success message
 * showSuccess('Patient record saved successfully');
 * 
 * // Error message
 * showError('Failed to save patient record');
 * 
 * // With title
 * showSuccess('Record updated', { title: 'Update Complete' });
 * 
 * // With action button
 * showError('Network error', {
 *   action: <Button onClick={retry}>Retry</Button>
 * });
 */
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
}

