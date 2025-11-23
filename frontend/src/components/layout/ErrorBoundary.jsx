import React from 'react';
import logger from '@/utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h2>
              <p className="mb-4 text-muted-foreground">
                The application encountered an error. Please refresh the page or contact support.
              </p>
              <details className="rounded bg-muted p-4 text-left text-sm">
                <summary className="cursor-pointer font-medium text-foreground">Error Details</summary>
                <div className="mt-2">
                  <p className="text-foreground">
                    <strong>Error:</strong>{' '}
                    {this.state.error ? this.state.error.toString() : 'Unknown error'}
                  </p>
                  <p className="text-foreground">
                    <strong>Stack:</strong>
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {(this.state.errorInfo && this.state.errorInfo.componentStack) ||
                      (this.state.error && this.state.error.stack) ||
                      'No stack available'}
                  </pre>
                </div>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
