import { useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';
import React from 'react';

interface ToastItem {
  id: number;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ShowToastOptions {
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, options?: ShowToastOptions) => {
    const id = toastIdCounter++;
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type: options?.type,
        duration: options?.duration,
        action: options?.action,
      },
    ]);
  }, []);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message: string, options?: Omit<ShowToastOptions, 'type'>) => {
    showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Omit<ShowToastOptions, 'type'>) => {
    showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Omit<ShowToastOptions, 'type'>) => {
    showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Omit<ShowToastOptions, 'type'>) => {
    showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = useCallback(() => {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px',
            pointerEvents: 'auto',
          }}
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              action={toast.action}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    );
  }, [toasts, removeToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer,
  };
};
