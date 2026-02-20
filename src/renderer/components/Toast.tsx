import React, { useEffect, useState, useRef } from 'react';
import { CheckIcon, CrossIcon, WarningIcon, InfoIcon } from './StatusIcons';
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
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(100);
  const onCloseRef = useRef(onClose);

  // Keep the ref up to date
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Trigger entry animation after mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    // Auto-close timer - start fade out animation, then close
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration);

    // Close timer - actually remove the toast after fade out
    const closeTimer = setTimeout(() => {
      onCloseRef.current();
    }, duration + 300); // Duration + fade out animation

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckIcon size={14} color={theme.status.success} />,
          color: theme.status.success,
          bgColor: theme.status.successBg,
        };
      case 'error':
        return {
          icon: <CrossIcon size={14} color={theme.status.error} />,
          color: theme.status.error,
          bgColor: theme.status.errorBg,
        };
      case 'warning':
        return {
          icon: <WarningIcon size={14} color={theme.status.warning} />,
          color: theme.status.warning,
          bgColor: theme.status.warningBg,
        };
      case 'info':
        return {
          icon: <InfoIcon size={14} color={theme.status.info} />,
          color: theme.status.info,
          bgColor: theme.status.infoBg,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      role={type === 'error' ? 'alert' : undefined}
      style={{
        background: theme.background.elevated,
        color: theme.text.primary,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        border: `2px solid ${config.color}`,
        boxShadow: `${theme.shadow.xl}, 0 0 20px ${config.color}40`,
        fontSize: theme.fontSize.md,
        maxWidth: '400px',
        opacity: isFadingOut ? 0 : (isVisible ? 1 : 0),
        transform: isFadingOut
          ? 'translateX(100%) scale(0.9)'
          : (isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.9)'),
        transition: isFadingOut
          ? 'opacity 0.3s ease, transform 0.3s ease'
          : 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: (isVisible && !isFadingOut) ? 'auto' : 'none',
        position: 'relative',
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
            wordBreak: 'break-word',
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
              setIsFadingOut(true);
              setTimeout(() => onCloseRef.current(), 300);
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
            setIsFadingOut(true);
            setTimeout(() => onCloseRef.current(), 300);
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
