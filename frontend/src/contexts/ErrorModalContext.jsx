import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertModal } from '@/components/library';

const ErrorModalContext = createContext({
  showError: () => {},
});

export function ErrorModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState({ title: 'Error', message: '', details: '' });
  const lastMsgRef = useRef({ message: '', time: 0 });

  const coalesce = (message) => {
    const now = Date.now();
    if (lastMsgRef.current.message === message && now - lastMsgRef.current.time < 2000) {
      return true;
    }
    lastMsgRef.current = { message, time: now };
    return false;
  };

  const showError = useCallback(({ title, message, details } = {}) => {
    const msg = message || 'Something went wrong';
    if (coalesce(msg)) return;
    setError({
      title: title || 'Something went wrong',
      message: msg,
      details: details || '',
    });
    setOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {};
      const code = payload.code ? ` [${payload.code}]` : '';
      const message = payload.message || 'An unexpected error occurred';
      const details = payload.details || '';
      showError({ title: `Error${code}`, message, details });
    };
    window.addEventListener('global-error', handler);
    return () => window.removeEventListener('global-error', handler);
  }, [showError]);

  const value = useMemo(() => ({ showError }), [showError]);

  return (
    <ErrorModalContext.Provider value={value}>
      {children}
      {open && (
        <AlertModal
          title={error.title}
          message={error.message}
          type="error"
          onClose={() => setOpen(false)}
          showConfirm={false}
        />
      )}
    </ErrorModalContext.Provider>
  );
}

export function useErrorModal() {
  return useContext(ErrorModalContext);
}
