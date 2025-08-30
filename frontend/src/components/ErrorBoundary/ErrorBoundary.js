import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to Sentry with additional context
    Sentry.withScope(scope => {
      scope.setExtras({
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });
      
      // Add user context if available
      const user = this.getUserContext();
      if (user) {
        scope.setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        });
      }
      
      // Capture the error
      Sentry.captureException(error);
    });
    
    this.setState({
      error,
      errorInfo,
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }
  
  getUserContext() {
    try {
      // Get user from your auth context or store
      // This is an example - adjust based on your auth implementation
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    const { fallback: FallbackComponent } = this.props;
    const { hasError, error, errorInfo } = this.state;
    
    if (hasError) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} errorInfo={errorInfo} onRetry={this.handleReset} />;
      }
      
      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {this.props.fallbackMessage || 'Something went wrong'}
            </h2>
            <p className="mt-2 text-gray-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
                {this.props.retryLabel || 'Try again'}
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Show error details
                </summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded text-xs text-red-600 overflow-auto">
                  {this.state.error?.stack}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onRetry: PropTypes.func,
  fallback: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
  ]),
};

ErrorBoundary.defaultProps = {
  onRetry: null,
  fallback: null,
};

export default Sentry.withErrorBoundary(
  ErrorBoundary,
  {
    // Configure the error boundary for Sentry
    showDialog: process.env.NODE_ENV === 'production',
    onError: (error, componentStack) => {
      // Additional error handling if needed
      console.error('Sentry Error Boundary caught an error:', error, componentStack);
    },
  }
);
