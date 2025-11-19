import React from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  getStraightPath
} from '@xyflow/react';
import theme from '../../theme';

export type MarkerType = 'arrow' | 'arrow-open' | 'diamond' | 'diamond-filled' | 'circle' | 'circle-filled' | 'square' | 'square-filled' | 'cross' | 'bar' | 'none';

export interface CustomEdgeData {
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  animated?: boolean;
  bidirectional?: boolean;
  routingType?: 'bezier' | 'smoothstep' | 'straight';
  markerStart?: MarkerType;
  markerEnd?: MarkerType;
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

  const color = edgeData?.color || theme.border.default;
  const routingType = edgeData?.routingType || 'bezier';
  const strokeStyle = edgeData?.style || 'solid';
  const animated = edgeData?.animated || false;
  const label = edgeData?.label;
  const markerStartType = edgeData?.markerStart || 'none';
  const markerEndType = edgeData?.markerEnd || 'arrow';

  // Generate marker URL references
  const getMarkerUrl = (markerType: MarkerType, position: 'start' | 'end') => {
    if (markerType === 'none') return undefined;
    // Encode color for URL (remove # and handle transparency)
    const colorId = color.replace('#', '');
    return `url(#${markerType}-${position}-${colorId})`;
  };

  const markerStartUrl = getMarkerUrl(markerStartType, 'start');
  const markerEndUrl = getMarkerUrl(markerEndType, 'end');

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
        markerStart={markerStartUrl}
        markerEnd={markerEndUrl}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray,
          opacity: selected ? 1 : 0.8,
          filter: selected ? `drop-shadow(0 0 4px ${theme.shadow.md})` : 'none',
        }}
      />

      {/* Animated flow effect with intense glow */}
      {animated && (
        <>
          {/* Outer glow layer */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="8"
            style={{
              filter: 'blur(8px)',
              opacity: 0.6,
              animation: 'glow-pulse 1.5s ease-in-out infinite'
            }}
          />
          {/* Middle glow layer */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="4"
            style={{
              filter: 'blur(4px)',
              opacity: 0.8,
              animation: 'glow-pulse 1.5s ease-in-out infinite 0.3s'
            }}
          />
          {/* Animated dashes */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 5"
            style={{
              animation: 'dashdraw 0.5s linear infinite',
              opacity: 1
            }}
          />
        </>
      )}

      {/* Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: theme.background.elevated,
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.radius.md,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              border: `2px solid ${color}`,
              color: theme.text.primary,
              pointerEvents: 'all',
              boxShadow: theme.shadow.sm,
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
              opacity: 0.4;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default CustomEdge;
