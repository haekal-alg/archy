import React from 'react';
import theme from '../../theme';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  overlay = false
}) => {
  const sizeMap = {
    sm: 24,
    md: 48,
    lg: 72,
  };

  const spinnerSize = sizeMap[size];
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;

  const spinner = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.lg,
      }}
    >
      {/* Spinner SVG */}
      <svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 50 50"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={theme.border.subtle}
          strokeWidth={strokeWidth}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={theme.accent.blue}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
          style={{
            animation: 'spin-dash 1.5s ease-in-out infinite',
          }}
        />
      </svg>

      {/* Optional text label */}
      {text && (
        <div
          style={{
            fontSize: size === 'sm' ? theme.fontSize.sm : theme.fontSize.md,
            color: theme.text.secondary,
            fontWeight: theme.fontWeight.medium,
          }}
        >
          {text}
        </div>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes spin-dash {
            0% {
              stroke-dasharray: 1, 200;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 100, 200;
              stroke-dashoffset: -15;
            }
            100% {
              stroke-dasharray: 100, 200;
              stroke-dashoffset: -125;
            }
          }
        `}
      </style>
    </div>
  );

  // If overlay mode, wrap in full-screen overlay
  if (overlay) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: theme.zIndex.modal,
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            background: theme.background.elevated,
            padding: theme.spacing.xxxl,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadow.xl,
            border: `1px solid ${theme.border.default}`,
          }}
        >
          {spinner}
        </div>

        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  }

  // Otherwise, return spinner inline
  return spinner;
};

export default LoadingSpinner;
