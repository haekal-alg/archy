import React from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';

export interface GroupNodeData {
  label: string;
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  description?: string;
}

const GroupNode: React.FC<NodeProps> = ({ data, selected }) => {
  const groupData = data as unknown as GroupNodeData;

  const backgroundColor = groupData.backgroundColor || '#ffb3ba40';
  const borderColor = groupData.borderColor || '#ff6b6b';
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
          border: '2px solid white'
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          background: backgroundColor,
          border: `3px ${borderStyle} ${borderColor}`,
          borderRadius: '16px',
          padding: '16px',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '20px',
            background: borderColor,
            color: 'white',
            padding: '6px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            letterSpacing: '0.5px'
          }}
        >
          {groupData.label}
        </div>

        {/* Description */}
        {groupData.description && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '20px',
              right: '20px',
              fontSize: '11px',
              color: '#666',
              fontStyle: 'italic',
              background: 'rgba(255,255,255,0.8)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${borderColor}40`
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
