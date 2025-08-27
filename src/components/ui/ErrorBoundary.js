// src/components/ui/ErrorBoundary.js
import React from 'react';
import Button from './Button';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, theme = 'tsa', showDetails = false } = this.props;

      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className={`error-boundary error-boundary--theme-${theme}`}>
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="error-boundary__title">Something went wrong</h2>

            <p className="error-boundary__message">
              We're sorry, but something unexpected happened. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            <div className="error-boundary__actions">
              <Button onClick={this.handleRetry} variant="primary" theme={theme}>
                Try Again
              </Button>

              <Button onClick={this.handleReload} variant="secondary" theme={theme}>
                Reload Page
              </Button>
            </div>

            {showDetails && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (for developers)</summary>
                <div className="error-boundary__error-info">
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>

                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error component for inline errors
export const ErrorMessage = ({ error, onRetry, theme = 'tsa', size = 'medium' }) => {
  const sizeClass = `error-message--${size}`;
  const themeClass = `error-message--theme-${theme}`;

  return (
    <div className={`error-message ${sizeClass} ${themeClass}`}>
      <div className="error-message__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="error-message__content">
        <p className="error-message__text">
          {typeof error === 'string' ? error : 'An error occurred'}
        </p>

        {onRetry && (
          <Button onClick={onRetry} variant="ghost" size="small" theme={theme}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;