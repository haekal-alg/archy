import React from 'react';

interface ToolbarProps {
  onAddWindows: () => void;
  onAddLinux: () => void;
  onAddGeneric: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  diagramName: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddWindows,
  onAddLinux,
  onAddGeneric,
  onSave,
  onLoad,
  onClear,
  diagramName,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: '200px',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
        {diagramName}
      </div>

      <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>
          Add Device
        </div>
        <button
          onClick={onAddWindows}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '5px',
            background: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🪟 Windows
        </button>
        <button
          onClick={onAddLinux}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '5px',
            background: '#f7a41d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🐧 Linux
        </button>
        <button
          onClick={onAddGeneric}
          style={{
            width: '100%',
            padding: '8px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          💻 Generic
        </button>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>
          Diagram
        </div>
        <button
          onClick={onSave}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '5px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          💾 Save
        </button>
        <button
          onClick={onLoad}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '5px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          📂 Load
        </button>
        <button
          onClick={onClear}
          style={{
            width: '100%',
            padding: '8px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🗑️ Clear
        </button>
      </div>

      <div style={{ fontSize: '10px', color: '#999', marginTop: '5px', textAlign: 'center' }}>
        Double-click a device to edit or connect
      </div>
    </div>
  );
};

export default Toolbar;
