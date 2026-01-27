import React, { useState, useEffect } from 'react';
import { ConnectionConfig } from './EnhancedDeviceNode';
import theme from '../../theme';

interface ContextMenuProps {
  x: number;
  y: number;
  onConnect?: (connection: ConnectionConfig) => void;
  onDelete: () => void;
  onClose: () => void;
  showConnect: boolean;
  onDuplicate?: () => void;
  connections?: ConnectionConfig[];
}

// Icons for menu items
const DuplicateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M3 9V3C3 2.44772 3.44772 2 4 2H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ConnectIcon = ({ type }: { type: string }) => {
  if (type === 'rdp' || type === 'ssh') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
        <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 5H12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'browser') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 2C7 2 9 4 9 7C9 10 7 12 7 12M7 2C7 2 5 4 5 7C5 10 7 12 7 12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
      <circle cx="7" cy="7" r="2" fill="currentColor" />
      <path d="M7 2V5M7 9V12M2 7H5M9 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// Shared menu styles
export const getMenuContainerStyle = (isVisible: boolean) => ({
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

export const getMenuItemStyle = (isHovered: boolean, isDanger: boolean = false) => ({
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

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onConnect,
  onDelete,
  onClose,
  showConnect,
  onDuplicate,
  connections = []
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation on mount
  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  const getConnectionLabel = (connection: ConnectionConfig): string => {
    // Use custom label if provided
    if (connection.label && connection.label.trim() !== '') {
      return connection.label;
    }

    // Fall back to default labels based on connection type
    switch (connection.type) {
      case 'rdp':
        return `Connect via RDP`;
      case 'ssh':
        return `Connect via SSH`;
      case 'browser':
        return `Open via Browser`;
      case 'custom':
        return `Execute Custom Command`;
      default:
        return 'Connect';
    }
  };

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
          width: '200px',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Connection options */}
        {showConnect && onConnect && connections.length > 0 && (
          <>
            {connections.map((connection, index) => {
              const itemIndex = index;
              const isHovered = hoveredIndex === itemIndex;
              return (
                <button
                  key={connection.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onConnect(connection);
                    onClose();
                  }}
                  onMouseEnter={() => setHoveredIndex(itemIndex)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={getMenuItemStyle(isHovered)}
                >
                  <ConnectIcon type={connection.type} />
                  {getConnectionLabel(connection)}
                </button>
              );
            })}
          </>
        )}

        {/* No connections available */}
        {showConnect && connections.length === 0 && (
          <div
            style={{
              width: '100%',
              padding: '8px 16px',
              color: theme.text.tertiary,
              fontSize: theme.fontSize.sm,
              fontStyle: 'italic'
            }}
          >
            No connections
          </div>
        )}

        {/* Separator between connection settings and asset controls */}
        {showConnect && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            margin: '6px 0'
          }} />
        )}

        {onDuplicate && (() => {
          const duplicateIndex = 1000;
          const isHovered = hoveredIndex === duplicateIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDuplicate();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(duplicateIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={getMenuItemStyle(isHovered)}
            >
              <DuplicateIcon />
              Duplicate
            </button>
          );
        })()}

        {(() => {
          const deleteIndex = 1001;
          const isHovered = hoveredIndex === deleteIndex;
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(deleteIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={getMenuItemStyle(isHovered, true)}
            >
              <DeleteIcon />
              Delete
            </button>
          );
        })()}
      </div>
    </>
  );
};

export default ContextMenu;
