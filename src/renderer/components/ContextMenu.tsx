import React, { useState } from 'react';
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
  const getConnectionLabel = (connection: ConnectionConfig): string => {
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
          background: 'rgba(50, 50, 55, 0.65)',
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderTop: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          zIndex: 9999,
          width: '200px',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'auto'
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
                    outline: 'none'
                  }}
                >
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
                outline: 'none'
              }}
            >
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
                outline: 'none'
              }}
            >
              Delete
            </button>
          );
        })()}
      </div>
    </>
  );
};

export default ContextMenu;
