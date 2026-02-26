import React, { useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import CONFIG from '../../config';
import theme from '../../theme';
import { CheckIcon, WarningIcon } from './StatusIcons';
import {
  RouterIcon,
  ServerIcon,
  FirewallIcon,
  DesktopIcon,
  LinuxIcon,
  SwitchIcon,
  CloudIcon,
  CloudIcon2,
  DatabaseIcon,
  GenericIcon,
  LaptopIcon,
  AttackIcon,
  MobileIcon
} from './NetworkIcons';

export interface SSHPortForward {
  localPort: number;
  remoteHost: string;
  remotePort: number;
  bindAddress?: string;
}

export interface ConnectionConfig {
  id: string;
  label?: string;
  group?: string;
  type: 'rdp' | 'ssh' | 'browser' | 'custom';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  customCommand?: string;
  privateKeyPath?: string;
  portForwards?: SSHPortForward[];
}

export interface EnhancedDeviceData {
  label: string;
  type: 'router' | 'server' | 'firewall' | 'windows' | 'linux' | 'switch' | 'cloud' | 'cloud2' | 'database' | 'laptop' | 'mobile' | 'attacker' | 'generic';
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

// Static style constants extracted to module scope (never re-created)
const HANDLE_BASE_STYLE: React.CSSProperties = {
  width: `${CONFIG.handles.size}px`,
  height: `${CONFIG.handles.size}px`,
  border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
  transition: 'opacity 0.2s ease-in-out',
};

const ICON_CONTAINER_STYLE: React.CSSProperties = {
  marginBottom: theme.spacing.md,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const LABEL_STYLE: React.CSSProperties = {
  fontWeight: theme.fontWeight.bold,
  marginBottom: theme.spacing.xs,
  fontSize: theme.fontSize.md,
  color: theme.text.primary,
  wordWrap: 'break-word',
};

const OS_STYLE: React.CSSProperties = {
  fontSize: theme.fontSize.sm,
  color: theme.text.secondary,
  marginTop: theme.spacing.xs,
};

const STATUS_CONNECTED_STYLE: React.CSSProperties = {
  marginTop: theme.spacing.sm,
  fontSize: theme.fontSize.xs,
  color: theme.accent.green,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.xs,
};

const STATUS_DISCONNECTED_STYLE: React.CSSProperties = {
  marginTop: theme.spacing.sm,
  fontSize: theme.fontSize.xs,
  color: theme.text.tertiary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.xs,
};

const CENTER_STYLE: React.CSSProperties = { textAlign: 'center' };

const EnhancedDeviceNode: React.FC<NodeProps> = React.memo(({ data, selected }) => {
  const deviceData = data as unknown as EnhancedDeviceData;
  const [isHovered, setIsHovered] = useState(false);

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
      case 'cloud2':
        return <CloudIcon2 color={color} />;
      case 'database':
        return <DatabaseIcon color={color} />;
      case 'laptop':
        return <LaptopIcon color={color} />;
      case 'mobile':
        return <MobileIcon color={color} />;
      case 'attacker':
        return <AttackIcon color={color} />;
      default:
        return <GenericIcon color={color} />;
    }
  };

  const getDefaultColor = () => {
    if (deviceData.color) return deviceData.color;

    switch (deviceData.type) {
      case 'router': return theme.device.router;
      case 'server': return theme.device.server;
      case 'firewall': return theme.device.firewall;
      case 'windows': return theme.device.windows;
      case 'linux': return theme.device.linux;
      case 'switch': return theme.device.switch;
      case 'cloud': return theme.device.cloud;
      case 'database': return theme.device.database;
      case 'laptop': return theme.device.laptop;
      case 'attacker': return theme.device.attacker;
      default: return theme.text.tertiary;
    }
  };

  const borderColor = getDefaultColor();
  const handleOpacity = isHovered ? 1 : 0;

  // Memoize handle styles that depend on borderColor and hover state
  const handleStyles = useMemo(() => ({
    top: { ...HANDLE_BASE_STYLE, background: borderColor, opacity: handleOpacity, top: 0 } as React.CSSProperties,
    right: { ...HANDLE_BASE_STYLE, background: borderColor, opacity: handleOpacity, right: 0 } as React.CSSProperties,
    bottom: { ...HANDLE_BASE_STYLE, background: borderColor, opacity: handleOpacity, bottom: 0 } as React.CSSProperties,
    left: { ...HANDLE_BASE_STYLE, background: borderColor, opacity: handleOpacity, left: 0 } as React.CSSProperties,
  }), [borderColor, handleOpacity]);

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        border: `2px solid ${borderColor}`,
        background: isHovered ? theme.gradient.nodeHover : theme.gradient.nodeDefault,
        minWidth: '140px',
        maxWidth: '200px',
        boxShadow: selected
          ? `0 0 0 3px #9ca3af`
          : 'none',
        cursor: 'pointer',
        position: 'relative',
      }}
      className="enhanced-device-node device-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles - All 4 directions as both source and target */}
      <Handle type="source" position={Position.Top} id="top" style={handleStyles.top} />
      <Handle type="target" position={Position.Top} id="top-target" style={handleStyles.top} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyles.right} />
      <Handle type="target" position={Position.Right} id="right-target" style={handleStyles.right} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyles.bottom} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={handleStyles.bottom} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyles.left} />
      <Handle type="target" position={Position.Left} id="left-target" style={handleStyles.left} />

      <div style={CENTER_STYLE}>
        {/* Icon */}
        <div style={ICON_CONTAINER_STYLE}>
          {getIcon()}
        </div>

        {/* Label */}
        <div style={LABEL_STYLE}>
          {deviceData.label}
        </div>

        {/* Operating System */}
        {deviceData.operatingSystem && (
          <div style={OS_STYLE}>
            {deviceData.operatingSystem}
          </div>
        )}

        {/* Connection Status Indicator */}
        {deviceData.connections && deviceData.connections.length > 0 ? (
          <div style={STATUS_CONNECTED_STYLE}>
            <CheckIcon size={13} color={theme.accent.green} />
            <span>{deviceData.connections.length} connection{deviceData.connections.length > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div style={STATUS_DISCONNECTED_STYLE}>
            <WarningIcon size={13} color={theme.text.tertiary} />
            <span>No connection</span>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.selected === next.selected && prev.data === next.data);

export default EnhancedDeviceNode;
