import React from 'react';
import { NodeProps } from '@xyflow/react';

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
      }}
      className="text-node"
    >
      {textData.label || 'Text'}
    </div>
  );
};

export default TextNode;
