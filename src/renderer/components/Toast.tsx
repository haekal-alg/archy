import React, { useEffect, useState } from 'react';
import theme from '../../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 2000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    // Auto-close timer - immediately close when time is up
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose(); // Close immediately without delay
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          color: theme.status.success,
          bgColor: theme.status.successBg,
        };
      case 'error':
        return {
          icon: '✕',
          color: theme.status.error,
          bgColor: theme.status.errorBg,
        };
      case 'warning':
        return {
          icon: '⚠',
          color: theme.status.warning,
          bgColor: theme.status.warningBg,
        };
      case 'info':
        return {
          icon: 'ℹ',
          color: theme.status.info,
          bgColor: theme.status.infoBg,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      style={{
        position: 'fixed',
        top: theme.spacing.xl,
        right: theme.spacing.xl,
        background: theme.background.elevated,
        color: theme.text.primary,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        border: `2px solid ${config.color}`,
        boxShadow: `${theme.shadow.xl}, 0 0 20px ${config.color}40`,
        fontSize: theme.fontSize.md,
        zIndex: theme.zIndex.tooltip,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Toast Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.md,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: theme.fontSize.xl,
            color: config.color,
            flexShrink: 0,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: config.bgColor,
            borderRadius: theme.radius.full,
            fontWeight: theme.fontWeight.bold,
          }}
        >
          {config.icon}
        </div>

        {/* Message */}
        <div
          style={{
            flex: 1,
            paddingTop: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </div>

        {/* Action Button (optional) */}
        {action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              setIsVisible(false);
              onClose(); // Close immediately
            }}
            style={{
              background: 'transparent',
              border: `1px solid ${config.color}`,
              borderRadius: theme.radius.sm,
              color: config.color,
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              cursor: 'pointer',
              transition: theme.transition.fast,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = config.bgColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            onClose(); // Close immediately
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.text.tertiary,
            fontSize: theme.fontSize.lg,
            cursor: 'pointer',
            padding: 0,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: theme.transition.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.text.tertiary;
          }}
        >
          ×
        </button>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: theme.background.tertiary,
          borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: config.color,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
