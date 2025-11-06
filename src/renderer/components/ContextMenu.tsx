import React from 'react';
import { ConnectionConfig } from './EnhancedDeviceNode';

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
          background: '#34495e',
          border: '1px solid #2c3e50',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
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
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ecf0f1',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background 0.2s',
                  borderTop: index > 0 ? '1px solid #2c3e50' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4a5f7f';
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
              padding: '10px 16px',
              color: '#95a5a6',
              fontSize: '12px',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
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
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: '#ecf0f1',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a5f7f';
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
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            color: '#ecf0f1',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e74c3c';
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
