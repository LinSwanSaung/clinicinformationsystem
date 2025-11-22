import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import './i18n'; // Initialize i18n
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure React Query client with Stage 2 defaults
function createQueryClient() {
  // We cannot call a hook here, so we will dispatch window events for errors.
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
        onError: (error) => {
          // Skip auth handled elsewhere
          const message = error?.message || 'Failed to load data';
          if (message.toLowerCase().includes('unauthorized')) return;
          window.dispatchEvent(
            new CustomEvent('global-error', {
              detail: { message },
            })
          );
        },
      },
      mutations: {
        onError: (error) => {
          const message = error?.message || 'Action failed';
          if (message.toLowerCase().includes('unauthorized')) return;
          window.dispatchEvent(
            new CustomEvent('global-error', {
              detail: { message },
            })
          );
        },
      },
    },
  });
}
const queryClient = createQueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
