import React from 'react';
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

  const getConnectionIcon = (type: string): string => {
    switch (type) {
      case 'rdp': return '🖥️';
      case 'ssh': return '🔐';
      case 'browser': return '🌐';
      case 'custom': return '⚙️';
      default: return '▶️';
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
          zIndex: 9998
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
          background: theme.background.elevated,
          border: `1px solid ${theme.border.default}`,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadow.lg,
          zIndex: theme.zIndex.popover,
          minWidth: '160px',
          overflow: 'hidden'
        }}
      >
        {/* Connection options */}
        {showConnect && onConnect && connections.length > 0 && (
          <>
            {connections.map((connection, index) => (
              <button
                key={connection.id}
                onClick={() => {
                  onConnect(connection);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
                  border: 'none',
                  background: 'transparent',
                  color: theme.text.primary,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: theme.fontSize.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.lg,
                  transition: theme.transition.normal,
                  borderTop: index > 0 ? `1px solid ${theme.border.subtle}` : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.background.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>{getConnectionIcon(connection.type)}</span>
                <span>{getConnectionLabel(connection)}</span>
              </button>
            ))}
          </>
        )}

        {/* No connections available */}
        {showConnect && connections.length === 0 && (
          <div
            style={{
              width: '100%',
              padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
              color: theme.text.tertiary,
              fontSize: theme.fontSize.sm,
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.lg
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>No connections</span>
          </div>
        )}

        {onDuplicate && (
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            style={{
              width: '100%',
              padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
              border: 'none',
              background: 'transparent',
              color: theme.text.primary,
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: theme.fontSize.md,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.lg,
              transition: theme.transition.normal
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.background.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>📑</span>
            <span>Duplicate</span>
          </button>
        )}

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            width: '100%',
            padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
            border: 'none',
            background: 'transparent',
            color: theme.text.primary,
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: theme.fontSize.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
            transition: theme.transition.normal
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.accent.red;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
