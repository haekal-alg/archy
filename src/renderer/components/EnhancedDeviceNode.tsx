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
import { LightningIcon, WarningIcon } from './StatusIcons';

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
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editValue, setEditValue] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);
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
    return <DynamicIcon deviceType={deviceData.type} fallback={builtIn} size={size} color={borderColor} />;
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

  // Connection handle styles - sit exactly on the edge perimeter
  const handleStyles = useMemo(() => {
    const base: React.CSSProperties = {
      ...HANDLE_BASE_STYLE,
      background: borderColor,
      opacity: handleOpacity,
      borderRadius: '50%',
    };
    return {
      top: { ...base, top: 0 } as React.CSSProperties,
      right: { ...base, right: 0 } as React.CSSProperties,
      bottom: { ...base, bottom: 0 } as React.CSSProperties,
      left: { ...base, left: 0 } as React.CSSProperties,
    };
  }, [borderColor, handleOpacity]);

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

  // Label inline editing
  const onLabelDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(deviceData.label);
    setIsEditingLabel(true);
    setTimeout(() => labelInputRef.current?.select(), 0);
  }, [deviceData.label]);

  const commitLabel = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== deviceData.label) {
      updateNodeData(id, { label: trimmed });
    }
    setIsEditingLabel(false);
  }, [editValue, deviceData.label, id, updateNodeData]);

  const onLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitLabel(); }
    if (e.key === 'Escape') { setIsEditingLabel(false); }
  }, [commitLabel]);

  // Connection ring style on the icon area
  const connectionRingStyle = useMemo((): React.CSSProperties => {
    if (!connectionStatus || connectionStatus === 'disconnected') return {};
    const color = STATUS_COLORS[connectionStatus];
    return {
      boxShadow: connectionStatus === 'connected'
        ? `0 0 0 2px ${color}, 0 0 10px ${color}60`
        : connectionStatus === 'connecting'
          ? `0 0 0 2px ${color}90`
          : `0 0 0 2px ${color}`,
      borderRadius: 8,
      animation: connectionStatus === 'connecting' ? 'pulse-ring 1.8s ease-in-out infinite' : 'none',
    };
  }, [connectionStatus]);

  const showResizeHandle = selected && isHovered;
  const handleSize = CONFIG.deviceNodes.resizeHandleSize;

  return (
    <div
      className="enhanced-device-node device-node"
      style={{
        padding: theme.spacing.md,
        background: 'transparent',
        minWidth: `${effectiveIconSize + 20}px`,
        cursor: 'pointer',
        position: 'relative',
        ...(selected ? { '--node-color': borderColor } as React.CSSProperties : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={CENTER_STYLE}>
        {/* Icon wrapper - selection outline and connection handles on this perimeter */}
        <div
          className="device-node-icon-area"
          aria-label={connectionStatus && connectionStatus !== 'disconnected' ? `Connection status: ${connectionStatus}` : undefined}
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            transition: 'box-shadow 0.25s ease, border-radius 0.25s ease',
            position: 'relative',
            ...connectionRingStyle,
          }}
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

          {getIcon()}

          {/* Connection badge - top right */}
          {connectionStatus && connectionStatus !== 'disconnected' && (
            <div
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: theme.background.primary,
                border: `1.5px solid ${STATUS_COLORS[connectionStatus]}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                boxShadow: `0 0 4px ${STATUS_COLORS[connectionStatus]}60, 0 0 8px ${STATUS_COLORS[connectionStatus]}30`,
                animation: connectionStatus === 'connected'
                  ? 'badge-glow-green 2.5s ease-in-out infinite'
                  : connectionStatus === 'connecting'
                    ? 'badge-glow-orange 1.8s ease-in-out infinite'
                    : 'badge-glow-red 2s ease-in-out infinite',
              }}
            >
              {connectionStatus === 'connected' && (
                <LightningIcon color={STATUS_COLORS[connectionStatus]} size={11} />
              )}
              {connectionStatus === 'connecting' && (
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke={STATUS_COLORS[connectionStatus]} strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M8 2A6 6 0 0 1 14 8" stroke={STATUS_COLORS[connectionStatus]} strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {connectionStatus === 'error' && (
                <WarningIcon color={STATUS_COLORS[connectionStatus]} size={11} />
              )}
            </div>
          )}

          {/* Resize handle - triangle at bottom-right corner */}
          {showResizeHandle && (
            <div
              className="nodrag nopan"
              onPointerDown={onResizePointerDown}
              onPointerMove={onResizePointerMove}
              onPointerUp={onResizePointerUp}
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: `0 0 ${handleSize + 4}px ${handleSize + 4}px`,
                borderColor: `transparent transparent ${borderColor} transparent`,
                cursor: 'nwse-resize',
                opacity: 0.85,
                zIndex: 10,
              }}
            />
          )}
        </div>


        {/* Label - double-click to edit inline */}
        {isEditingLabel ? (
          <input
            ref={labelInputRef}
            className="device-node-label-input nodrag nopan"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={onLabelKeyDown}
            style={{
              fontWeight: theme.fontWeight.semibold,
              fontSize: `${labelSize}px`,
              color: theme.text.primary,
              lineHeight: '1.3',
              marginTop: theme.spacing.xs,
            }}
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={onLabelDoubleClick}
            style={{
              fontWeight: theme.fontWeight.semibold,
              fontSize: `${labelSize}px`,
              color: theme.text.primary,
              wordWrap: 'break-word',
              lineHeight: '1.3',
              marginTop: theme.spacing.xs,
              cursor: 'text',
            }}
          >
            {deviceData.label}
          </div>
        )}

        {/* Discoverability hint on selection */}
        {selected && !isEditingLabel && (
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
