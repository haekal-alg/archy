import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DeviceData } from '../App';

const DeviceNode: React.FC<NodeProps> = ({ data }) => {
  const deviceData = data as unknown as DeviceData;

  const getIcon = () => {
    switch (deviceData.type) {
      case 'windows':
        return '🪟';
      case 'linux':
        return '🐧';
      default:
        return '💻';
    }
  };

  const getColor = () => {
    switch (deviceData.type) {
      case 'windows':
        return '#0078d4';
      case 'linux':
        return '#f7a41d';
      default:
        return '#666';
    }
  };

  return (
    <div
      style={{
        padding: '15px',
        borderRadius: '8px',
        border: `2px solid ${getColor()}`,
        background: 'white',
        minWidth: '150px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      className="device-node"
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{getIcon()}</div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{deviceData.label}</div>
        {deviceData.host && (
          <div style={{ fontSize: '12px', color: '#666' }}>{deviceData.host}</div>
        )}
        <div
          style={{
            fontSize: '10px',
            marginTop: '6px',
            padding: '4px 8px',
            background: getColor(),
            color: 'white',
            borderRadius: '4px',
          }}
        >
          {deviceData.type.toUpperCase()}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default DeviceNode;
