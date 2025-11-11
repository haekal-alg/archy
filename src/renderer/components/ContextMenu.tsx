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
          background: theme.background.canvas,
          border: '1px solid #808080',
          borderRadius: '4px',
          boxShadow: 'none',
          zIndex: 9999,
          minWidth: '180px',
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
                    padding: '8px 16px',
                    border: 'none',
                    background: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: theme.text.primary,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: theme.fontSize.sm,
                    transition: 'background 0.15s ease',
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
            borderTop: '1px solid #808080',
            margin: '4px 0'
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
                padding: '8px 16px',
                border: 'none',
                background: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: theme.text.primary,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                transition: 'background 0.15s ease',
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
                padding: '8px 16px',
                border: 'none',
                background: isHovered ? 'rgba(255, 92, 92, 0.15)' : 'transparent',
                color: '#ff5c5c',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                transition: 'background 0.15s ease',
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
