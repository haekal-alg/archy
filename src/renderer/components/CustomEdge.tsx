import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  getStraightPath
} from '@xyflow/react';

export interface CustomEdgeData {
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  animated?: boolean;
  bidirectional?: boolean;
  routingType?: 'bezier' | 'smoothstep' | 'straight';
}

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}) => {
  const edgeData = data as CustomEdgeData;

  const color = edgeData?.color || '#000000';
  const routingType = edgeData?.routingType || 'bezier';
  const strokeStyle = edgeData?.style || 'solid';
  const animated = edgeData?.animated || false;
  const label = edgeData?.label;

  // Get the appropriate path based on routing type
  let path: string;
  let labelX: number;
  let labelY: number;

  if (routingType === 'smoothstep') {
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (routingType === 'straight') {
    [path, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const strokeDasharray = strokeStyle === 'dashed' ? '8 4' : strokeStyle === 'dotted' ? '2 4' : 'none';

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray,
          opacity: selected ? 1 : 0.8,
          filter: selected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none',
        }}
      />

      {/* Animated flow effect with glow */}
      {animated && (
        <>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="4"
            style={{
              filter: 'blur(4px)',
              opacity: 0.5,
              animation: 'glow-pulse 1.5s ease-in-out infinite'
            }}
          />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 5"
            style={{
              animation: 'dashdraw 0.5s linear infinite',
              opacity: 0.8
            }}
          />
        </>
      )}

      {/* Bidirectional arrow */}
      {edgeData?.bidirectional && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={selected ? 3 : 2}
          markerStart="url(#arrow-start)"
          style={{ opacity: 0 }}
        />
      )}

      {/* Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              border: `2px solid ${color}`,
              color: '#333',
              pointerEvents: 'all',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Animation styles */}
      <style>
        {`
          @keyframes dashdraw {
            to {
              stroke-dashoffset: -10;
            }
          }
          @keyframes glow-pulse {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}
      </style>
    </>
  );
};

export default CustomEdge;
