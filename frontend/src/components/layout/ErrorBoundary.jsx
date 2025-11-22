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
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                The application encountered an error. Please refresh the page or contact support.
              </p>
              <details className="text-left bg-gray-100 p-4 rounded text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <div className="mt-2">
                  <p><strong>Error:</strong> {this.state.error ? this.state.error.toString() : 'Unknown error'}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {(this.state.errorInfo && this.state.errorInfo.componentStack) || (this.state.error && this.state.error.stack) || 'No stack available'}
                  </pre>
                </div>
              </details>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
