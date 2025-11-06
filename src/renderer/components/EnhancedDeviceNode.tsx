import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import CONFIG from '../../config';
import {
  RouterIcon,
  ServerIcon,
  FirewallIcon,
  DesktopIcon,
  LinuxIcon,
  SwitchIcon,
  CloudIcon,
  DatabaseIcon,
  GenericIcon,
  LaptopIcon,
  AttackIcon
} from './NetworkIcons';

export interface ConnectionConfig {
  id: string;
  type: 'rdp' | 'ssh' | 'browser' | 'custom';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  customCommand?: string;
}

export interface EnhancedDeviceData {
  label: string;
  type: 'router' | 'server' | 'firewall' | 'windows' | 'linux' | 'switch' | 'cloud' | 'database' | 'laptop' | 'attacker' | 'generic';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  color?: string;
  ipAddress?: string;
  description?: string;
  interfaces?: { name: string; ip: string }[];
  operatingSystem?: string;
  customCommand?: string;
  connections?: ConnectionConfig[];
}

const EnhancedDeviceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const deviceData = data as unknown as EnhancedDeviceData;

  const getIcon = () => {
    const color = deviceData.color;
    switch (deviceData.type) {
      case 'router':
        return <RouterIcon color={color} />;
      case 'server':
        return <ServerIcon color={color} />;
      case 'firewall':
        return <FirewallIcon color={color} />;
      case 'windows':
        return <DesktopIcon color={color} />;
      case 'linux':
        return <LinuxIcon color={color} />;
      case 'switch':
        return <SwitchIcon color={color} />;
      case 'cloud':
        return <CloudIcon color={color} />;
      case 'database':
        return <DatabaseIcon color={color} />;
      case 'laptop':
        return <LaptopIcon color={color} />;
      case 'attacker':
        return <AttackIcon color={color} />;
      default:
        return <GenericIcon color={color} />;
    }
  };

  const getDefaultColor = () => {
    if (deviceData.color) return deviceData.color;

    switch (deviceData.type) {
      case 'router': return '#1976d2';
      case 'server': return '#2e7d32';
      case 'firewall': return '#d32f2f';
      case 'windows': return '#0078d4';
      case 'linux': return '#f7a41d';
      case 'switch': return '#455a64';
      case 'cloud': return '#4285f4';
      case 'database': return '#7b1fa2';
      case 'laptop': return '#546e7a';
      case 'attacker': return '#e91e63';
      default: return '#666666';
    }
  };

  const borderColor = getDefaultColor();

  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: selected ? `3px solid ${borderColor}` : `2px solid ${borderColor}`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        minWidth: '140px',
        maxWidth: '200px',
        boxShadow: selected
          ? `0 8px 16px rgba(0,0,0,0.2), 0 0 0 3px ${borderColor}40`
          : '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      className="enhanced-device-node"
    >
      {/* Connection Handles - All 4 directions as both source and target */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />

      <div style={{ textAlign: 'center' }}>
        {/* Icon */}
        <div style={{
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {getIcon()}
        </div>

        {/* Label */}
        <div style={{
          fontWeight: 'bold',
          marginBottom: '4px',
          fontSize: '13px',
          color: '#333',
          wordWrap: 'break-word'
        }}>
          {deviceData.label}
        </div>

        {/* Operating System */}
        {deviceData.operatingSystem && (
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px'
          }}>
            {deviceData.operatingSystem}
          </div>
        )}

        {/* Connection Status Indicator */}
        {deviceData.connections && deviceData.connections.length > 0 ? (
          <div style={{
            marginTop: '6px',
            fontSize: '10px',
            color: '#28a745',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px' }}>✓</span>
            <span>{deviceData.connections.length} connection{deviceData.connections.length > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div style={{
            marginTop: '6px',
            fontSize: '10px',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '12px' }}>⚠️</span>
            <span>No connection</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDeviceNode;
