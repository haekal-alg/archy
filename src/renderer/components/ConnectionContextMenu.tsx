import React, { useState } from 'react';
import theme from '../../theme';

interface ConnectionContextMenuProps {
  x: number;
  y: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onRetry?: () => void;
  onDisconnect?: () => void;
  onRemove?: () => void;
  onClose: () => void;
}

const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
  x,
  y,
  connectionStatus,
  onRetry,
  onDisconnect,
  onRemove,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      {/* Overlay to close menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          pointerEvents: 'auto'
        }}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Context Menu */}
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          background: 'rgba(50, 50, 55, 0.65)',
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderTop: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          zIndex: 9999,
          minWidth: '180px',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'auto'
        }}
      >
        {/* Retry Connection */}
        {onRetry && (() => {
          const retryIndex = 0;
          const isHovered = hoveredIndex === retryIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRetry();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(retryIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderRadius: '6px',
                color: theme.text.primary,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                transition: 'background 0.12s ease-out',
                outline: 'none',
              }}
            >
              Retry Connection
            </button>
          );
        })()}

        {/* Disconnect */}
        {onDisconnect && (() => {
          const disconnectIndex = 1;
          const isHovered = hoveredIndex === disconnectIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDisconnect();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(disconnectIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderRadius: '6px',
                color: theme.text.primary,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                transition: 'background 0.12s ease-out',
                outline: 'none',
              }}
            >
              Disconnect
            </button>
          );
        })()}

        {/* Separator */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          margin: '6px 0'
        }} />

        {/* Remove */}
        {onRemove && (() => {
          const removeIndex = 2;
          const isHovered = hoveredIndex === removeIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(removeIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: isHovered ? 'rgba(255, 92, 92, 0.25)' : 'transparent',
                borderRadius: '6px',
                color: '#ff5c5c',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                transition: 'background 0.12s ease-out',
                outline: 'none',
              }}
            >
              Remove
            </button>
          );
        })()}
      </div>
    </>
  );
};

export default ConnectionContextMenu;
