import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import CONFIG from '../../config';
import theme from '../../theme';

export interface TextNodeData {
  label: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderWidth?: number;
}

const TextNode: React.FC<NodeProps> = ({ data, selected }) => {
  const textData = data as unknown as TextNodeData;
  const [isHovered, setIsHovered] = useState(false);

  const fontSize = textData.fontSize || 14;
  const fontColor = textData.fontColor || theme.text.primary;
  const backgroundColor = textData.backgroundColor || 'transparent';
  const borderColor = textData.borderColor || theme.border.default;
  const borderStyle = textData.borderStyle || 'none';
  const borderWidth = textData.borderWidth || 1;

  return (
    <div
      style={{
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        fontSize: `${fontSize}px`,
        color: fontColor,
        backgroundColor: backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: theme.radius.sm,
        minWidth: '50px',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: selected
          ? `0 0 0 3px #9ca3af`
          : 'none',
        cursor: 'pointer',
        position: 'relative',
      }}
      className="text-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
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
          background: theme.border.strong,
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          left: 0
        }}
      />

      {textData.label || 'Text'}
    </div>
  );
};

export default TextNode;
