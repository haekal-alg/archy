import React, { Component, ErrorInfo, ReactNode } from 'react';
import theme from '../../theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire application.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error(`[ErrorBoundary${this.props.componentName ? ` - ${this.props.componentName}` : ''}] Caught error:`, error);
    console.error('Component stack:', errorInfo.componentStack);

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '24px',
            margin: '16px',
            background: theme.background.elevated,
            border: `1px solid ${theme.accent.red}`,
            borderRadius: '8px',
            color: theme.text.primary,
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '24px' }}>&#9888;</span>
            <h3
              style={{
                margin: 0,
                color: theme.accent.red,
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Something went wrong
              {this.props.componentName && (
                <span style={{ color: theme.text.secondary, fontWeight: 400 }}>
                  {' '}in {this.props.componentName}
                </span>
              )}
            </h3>
          </div>

          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              background: theme.background.tertiary,
              borderRadius: '4px',
              border: `1px solid ${theme.border.default}`,
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                color: theme.text.secondary,
                fontSize: '13px',
              }}
            >
              Error: {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error?.name && (
              <p
                style={{
                  margin: 0,
                  color: theme.text.tertiary,
                  fontSize: '12px',
                }}
              >
                Type: {this.state.error.name}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                background: theme.accent.blue,
                color: theme.text.primary,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.accent.blueLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.accent.blue;
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: theme.background.hover,
                color: theme.text.primary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.background.active;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background.hover;
              }}
            >
              Reload App
            </button>
          </div>

          {/* Show stack trace in development */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details
              style={{
                marginTop: '16px',
                padding: '12px',
                background: theme.background.primary,
                borderRadius: '4px',
                border: `1px solid ${theme.border.subtle}`,
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color: theme.text.secondary,
                  fontSize: '12px',
                  marginBottom: '8px',
                }}
              >
                Component Stack (Development Only)
              </summary>
              <pre
                style={{
                  margin: 0,
                  padding: '8px',
                  background: theme.background.tertiary,
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: theme.text.tertiary,
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
