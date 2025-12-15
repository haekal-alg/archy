import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DeviceData } from '../App';
import theme from '../../theme';

const DeviceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const deviceData = data as unknown as DeviceData;
  const [isHovered, setIsHovered] = useState(false);

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
        return theme.device.windows;
      case 'linux':
        return theme.device.linux;
      default:
        return theme.text.tertiary;
    }
  };

  const borderColor = getColor();

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        border: selected ? `2px solid ${borderColor}` : `2px solid ${borderColor}`,
        background: isHovered ? theme.gradient.nodeHover : theme.gradient.nodeDefault,
        minWidth: '140px',
        maxWidth: '200px',
        boxShadow: selected
          ? `${theme.shadow.lg}, 0 0 0 3px #9ca3af`
          : isHovered
            ? theme.shadow.lg
            : theme.shadow.md,
        cursor: 'pointer',
      }}
      className="device-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles - All 4 directions */}
      <Handle type="source" position={Position.Top} id="top" style={{ background: getColor() }} />
      <Handle type="target" position={Position.Top} id="top-target" style={{ background: getColor() }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: getColor() }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ background: getColor() }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: getColor() }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: getColor() }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: getColor() }} />
      <Handle type="target" position={Position.Left} id="left-target" style={{ background: getColor() }} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: theme.spacing.md }}>{getIcon()}</div>
        <div style={{
          fontWeight: theme.fontWeight.bold,
          marginBottom: theme.spacing.xs,
          fontSize: theme.fontSize.md,
          color: theme.text.primary
        }}>
          {deviceData.label}
        </div>
        {deviceData.host && (
          <div style={{
            fontSize: theme.fontSize.sm,
            color: theme.text.secondary
          }}>
            {deviceData.host}
          </div>
        )}
        <div
          style={{
            fontSize: theme.fontSize.xs,
            marginTop: theme.spacing.sm,
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            background: borderColor,
            color: theme.text.primary,
            borderRadius: theme.radius.sm,
          }}
        >
          {deviceData.type.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default DeviceNode;
