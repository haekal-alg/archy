import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onConnect?: () => void;
  onDelete: () => void;
  onClose: () => void;
  showConnect: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onConnect,
  onDelete,
  onClose,
  showConnect
}) => {
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
        {showConnect && onConnect && (
          <button
            onClick={() => {
              onConnect();
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
            <span style={{ fontSize: '16px' }}>▶️</span>
            <span>Connect</span>
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
