import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import CONFIG from '../../config';

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

  const fontSize = textData.fontSize || 14;
  const fontColor = textData.fontColor || '#000000';
  const backgroundColor = textData.backgroundColor || 'transparent';
  const borderColor = textData.borderColor || '#000000';
  const borderStyle = textData.borderStyle || 'none';
  const borderWidth = textData.borderWidth || 1;

  return (
    <div
      style={{
        padding: '8px 12px',
        fontSize: `${fontSize}px`,
        color: fontColor,
        backgroundColor: backgroundColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: '4px',
        minWidth: '50px',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: selected ? '0 0 0 2px #1a192b' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      className="text-node"
    >
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{
          background: '#555',
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
          background: '#555',
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
          background: '#555',
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
          background: '#555',
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
          background: '#555',
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
          background: '#555',
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
          background: '#555',
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
          background: '#555',
          width: `${CONFIG.handles.size}px`,
          height: `${CONFIG.handles.size}px`,
          border: `${CONFIG.handles.borderWidth}px solid ${CONFIG.handles.borderColor}`
        }}
      />

      {textData.label || 'Text'}
    </div>
  );
};

export default TextNode;
