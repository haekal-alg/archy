import React, { useState, useEffect } from 'react';
import theme from '../../theme';

interface ConnectionContextMenuProps {
  x: number;
  y: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onRetry?: () => void;
  onDisconnect?: () => void;
  onRemove?: () => void;
  onRename?: () => void;
  onClose: () => void;
}

// Icons for menu items
const RetryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M12 7C12 9.76142 9.76142 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C8.38071 2 9.61929 2.57857 10.5 3.5M10.5 3.5V1M10.5 3.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DisconnectIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M5 2V5M9 9V12M2 5H5M9 12H12M3.5 3.5L5.5 5.5M8.5 8.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RenameIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M8.5 2L12 5.5M2 12L5 11.5L11.5 5C12 4.5 12 3.5 11.5 3L11 2.5C10.5 2 9.5 2 9 2.5L2.5 9L2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Shared menu styles
const getMenuContainerStyle = (isVisible: boolean) => ({
  background: 'rgba(50, 50, 55, 0.65)',
  backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderTop: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'scale(1)' : 'scale(0.95)',
  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  transformOrigin: 'top left',
});

const getMenuItemStyle = (isHovered: boolean, isDanger: boolean = false) => ({
  width: '100%',
  padding: '6px 12px',
  border: 'none',
  background: isHovered
    ? (isDanger ? 'rgba(255, 92, 92, 0.25)' : 'rgba(255, 255, 255, 0.2)')
    : 'transparent',
  borderRadius: '6px',
  color: isDanger ? '#ff5c5c' : theme.text.primary,
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: theme.fontSize.sm,
  transition: 'background 0.12s ease-out',
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
});

const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
  x,
  y,
  connectionStatus,
  onRetry,
  onDisconnect,
  onRemove,
  onRename,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

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
          ...getMenuContainerStyle(isVisible),
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
              style={getMenuItemStyle(isHovered)}
            >
              <RetryIcon />
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
              style={getMenuItemStyle(isHovered)}
            >
              <DisconnectIcon />
              Disconnect
            </button>
          );
        })()}

        {/* Rename */}
        {onRename && (() => {
          const renameIndex = 2;
          const isHovered = hoveredIndex === renameIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRename();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(renameIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={getMenuItemStyle(isHovered)}
            >
              <RenameIcon />
              Rename
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
          const removeIndex = 3;
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
              style={getMenuItemStyle(isHovered, true)}
            >
              <RemoveIcon />
              Remove
            </button>
          );
        })()}
      </div>
    </>
  );
};

export default ConnectionContextMenu;
