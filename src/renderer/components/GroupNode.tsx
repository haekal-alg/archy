import React, { useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import CONFIG from '../../config';
import { ConnectionConfig } from './EnhancedDeviceNode';

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
          borderWidth: 0,
          borderColor: 'transparent'
        }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: borderColor,
          border: `2px solid ${theme.text.primary}`
        }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          background: backgroundColor,
          border: `3px ${borderStyle} ${borderColor}`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.xl,
          position: 'relative',
          boxShadow: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Connection Handles - inside the bordered div so they align to its border */}
        <Handle type="source" position={Position.Top} id="top" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="target" position={Position.Top} id="top-target" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="source" position={Position.Right} id="right" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="target" position={Position.Right} id="right-target" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="source" position={Position.Left} id="left" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />
        <Handle type="target" position={Position.Left} id="left-target" style={{ background: borderColor, width: `${CONFIG.handles.size}px`, height: `${CONFIG.handles.size}px`, border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} />

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
      </div>
    </>
  );
};

export default GroupNode;
