import React from 'react';
import theme from '../../../theme';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm', confirmDanger, onConfirm, onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10002,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: theme.background.tertiary,
          border: `1px solid ${theme.border.default}`,
          borderRadius: '10px',
          padding: '20px 24px',
          width: '380px',
          maxWidth: '90vw',
          boxShadow: theme.shadow.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '15px',
          fontWeight: 600,
          color: theme.text.primary,
        }}>
          {title}
        </h3>
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '13px',
          color: theme.text.secondary,
          lineHeight: '1.5',
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '7px 16px',
              background: theme.background.hover,
              border: `1px solid ${theme.border.default}`,
              borderRadius: '6px',
              color: theme.text.secondary,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.background.active;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.background.hover;
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '7px 16px',
              background: confirmDanger ? theme.accent.red : theme.accent.blue,
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
