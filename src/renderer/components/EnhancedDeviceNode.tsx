import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStoreApi } from '@xyflow/react';
import CONFIG from '../../config';
import theme from '../../theme';
import { useNodeConnectionStatus, NodeConnectionStatus } from '../contexts/NodeConnectionStatusContext';
import {
  DynamicIcon,
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
  iconSize?: number;
  labelSize?: number;
}

// Static style constants extracted to module scope (never re-created)
const HANDLE_BASE_STYLE: React.CSSProperties = {
  width: `${CONFIG.handles.size}px`,
  height: `${CONFIG.handles.size}px`,
  border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
  transition: 'opacity 0.2s ease-in-out',
};

const CENTER_STYLE: React.CSSProperties = { textAlign: 'center' };

const STATUS_COLORS: Record<NodeConnectionStatus, string> = {
  connected: theme.accent.green,
  connecting: theme.accent.orange,
  error: theme.accent.red,
  disconnected: theme.text.disabled,
};

const EnhancedDeviceNode: React.FC<NodeProps> = React.memo(({ id, data, selected }) => {
  const deviceData = data as unknown as EnhancedDeviceData;
  const [isHovered, setIsHovered] = useState(false);
  const [dragIconSize, setDragIconSize] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startSize: number } | null>(null);
  const { updateNodeData } = useReactFlow();
  const storeApi = useStoreApi();
  const connectionStatus = useNodeConnectionStatus(id);

  const iconSize = deviceData.iconSize ?? CONFIG.deviceNodes.defaultIconSize;
  const labelSize = deviceData.labelSize ?? CONFIG.deviceNodes.defaultLabelSize;
  const effectiveIconSize = dragIconSize ?? iconSize;

  const getIcon = () => {
    const color = deviceData.color;
    const size = effectiveIconSize;
    const builtIn = (() => {
      switch (deviceData.type) {
        case 'router': return <RouterIcon color={color} size={size} />;
        case 'server': return <ServerIcon color={color} size={size} />;
        case 'firewall': return <FirewallIcon color={color} size={size} />;
        case 'windows': return <DesktopIcon color={color} size={size} />;
        case 'linux': return <LinuxIcon color={color} size={size} />;
        case 'switch': return <SwitchIcon color={color} size={size} />;
        case 'cloud': return <CloudIcon color={color} size={size} />;
        case 'cloud2': return <CloudIcon2 color={color} size={size} />;
        case 'database': return <DatabaseIcon color={color} size={size} />;
        case 'laptop': return <LaptopIcon color={color} size={size} />;
        case 'mobile': return <MobileIcon color={color} size={size} />;
        case 'attacker': return <AttackIcon color={color} size={size} />;
        default: return <GenericIcon color={color} size={size} />;
      }
    })();
    return <DynamicIcon deviceType={deviceData.type} fallback={builtIn} size={size} />;
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

  // Resize handle drag logic
  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startSize: effectiveIconSize };
  }, [effectiveIconSize]);

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const zoom = storeApi.getState().transform[2];
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    const delta = (dx + dy) / 2;
    const newSize = Math.round(
      Math.min(CONFIG.deviceNodes.maxIconSize,
        Math.max(CONFIG.deviceNodes.minIconSize, dragRef.current.startSize + delta))
    );
    setDragIconSize(newSize);
  }, [storeApi]);

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const finalSize = dragIconSize ?? effectiveIconSize;
    dragRef.current = null;
    setDragIconSize(null);
    updateNodeData(id, { iconSize: finalSize });
    window.dispatchEvent(new CustomEvent('node-resize-end'));
  }, [dragIconSize, effectiveIconSize, id, updateNodeData]);

  const showResizeHandle = selected && isHovered;
  const handleSize = CONFIG.deviceNodes.resizeHandleSize;

  return (
    <div
      style={{
        padding: theme.spacing.md,
        background: 'transparent',
        minWidth: `${effectiveIconSize + 20}px`,
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
        {/* Icon with selection glow */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          filter: selected ? `drop-shadow(0 0 8px ${borderColor})` : 'none',
          transition: 'filter 0.2s ease',
          position: 'relative',
        }}>
          {getIcon()}

          {/* Resize handle */}
          {showResizeHandle && (
            <div
              className="nodrag nopan"
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              style={{
                position: 'absolute',
                right: -handleSize / 2,
                bottom: -handleSize / 2,
                width: handleSize,
                height: handleSize,
                cursor: 'nwse-resize',
                background: borderColor,
                border: `1px solid ${theme.text.primary}`,
                borderRadius: 2,
                opacity: 0.8,
                zIndex: 10,
              }}
            />
          )}
        </div>

        {/* Connection status indicator */}
        {connectionStatus && connectionStatus !== 'disconnected' && (
          <div
            aria-label={`Connection status: ${connectionStatus}`}
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[connectionStatus],
              border: `1px solid ${theme.background.primary}`,
              boxShadow: connectionStatus === 'connected'
                ? `0 0 6px ${STATUS_COLORS[connectionStatus]}80`
                : 'none',
              animation: connectionStatus === 'connecting' ? 'pulse-status 1.5s ease-in-out infinite' : 'none',
            }}
          />
        )}

        {/* Label */}
        <div style={{
          fontWeight: theme.fontWeight.semibold,
          fontSize: `${labelSize}px`,
          color: theme.text.primary,
          wordWrap: 'break-word',
          lineHeight: '1.3',
          marginTop: theme.spacing.xs,
        }}>
          {deviceData.label}
        </div>

        {/* Discoverability hint on selection */}
        {selected && (
          <div style={{
            fontSize: '9px',
            color: theme.text.disabled,
            marginTop: '2px',
            whiteSpace: 'nowrap',
          }}>
            Double-click to configure
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.selected === next.selected && prev.data === next.data);

export default EnhancedDeviceNode;
