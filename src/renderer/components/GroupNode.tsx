import React, { useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import CONFIG from '../../config';
import { ConnectionConfig } from './EnhancedDeviceNode';
import { WarningIcon } from './StatusIcons';
import theme from '../../theme';

export interface GroupNodeData {
  label: string;
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  description?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  customCommand?: string;
  connections?: ConnectionConfig[];
}

const GroupNode: React.FC<NodeProps> = ({ data, selected }) => {
  const groupData = data as unknown as GroupNodeData;
  const [isHovered, setIsHovered] = useState(false);

  const backgroundColor = groupData.backgroundColor || theme.accent.pink + '40';
  const borderColor = groupData.borderColor || theme.accent.pink;
  const borderStyle = groupData.borderStyle || 'solid';

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        lineStyle={{
          borderWidth: 2,
          borderColor: borderColor
        }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: borderColor,
          border: `2px solid ${theme.text.primary}`
        }}
      />

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: borderColor,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          top: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          top: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          right: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          right: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          bottom: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          bottom: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          left: 0
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
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          left: 0
        }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          background: backgroundColor,
          border: `3px ${borderStyle} ${borderColor}`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.xl,
          position: 'relative',
          boxShadow: selected
            ? `0 0 0 3px #9ca3af`
            : 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Title Bar - only show if label exists */}
        {groupData.label && (
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '20px',
              background: borderColor,
              color: theme.text.primary,
              padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              fontWeight: theme.fontWeight.bold,
              fontSize: theme.fontSize.base,
              boxShadow: theme.shadow.sm,
              letterSpacing: '0.5px'
            }}
          >
            {groupData.label}
          </div>
        )}

        {/* Description */}
        {groupData.description && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '20px',
              right: '20px',
              fontSize: theme.fontSize.sm,
              color: theme.text.primary,
              fontStyle: 'italic',
              background: 'transparent',
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.radius.md,
              border: 'none'
            }}
          >
            {groupData.description}
          </div>
        )}

        {/* Connection Status Indicator for Groups */}
        {(!groupData.connections || groupData.connections.length === 0) && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: theme.fontSize.xs,
              color: theme.text.primary,
              background: 'transparent',
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.radius.sm,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              border: 'none'
            }}
          >
            <WarningIcon size={12} color={theme.text.primary} />
            <span>No connection</span>
          </div>
        )}
      </div>
    </>
  );
};

export default GroupNode;
