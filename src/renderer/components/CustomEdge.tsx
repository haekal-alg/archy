import React, { useState } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  getStraightPath
} from '@xyflow/react';
import theme from '../../theme';

export type MarkerType = 'arrow' | 'none';

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
  const [isHovered, setIsHovered] = useState(false);
  const edgeData = data as CustomEdgeData;

  const color = edgeData?.color || theme.border.default;
  const routingType = edgeData?.routingType || 'bezier';
  const strokeStyle = (edgeData as any)?.lineStyle || edgeData?.style || 'solid';
  const strokeWidth = (edgeData as any)?.strokeWidth || 4;
  const animated = edgeData?.animated || false;
  const label = edgeData?.label;
  const markerStartType = edgeData?.markerStart || 'none';
  const markerEndType = edgeData?.markerEnd || 'arrow';

  // Generate marker URL references
  const getMarkerUrl = (markerType: MarkerType, position: 'start' | 'end') => {
    if (markerType === 'none') return undefined;
    // Use red markers when hovered or selected
    if (isHovered || selected) {
      return `url(#${markerType}-${position}-ff5c5c)`;
    }
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
          strokeWidth,
          strokeDasharray,
          opacity: 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Animated flow effect with intense glow */}
      {animated && (
        <>
          {/* Outer glow layer */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="10"
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
            strokeWidth="6"
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
            strokeWidth="4"
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
          /* Hover effect for edges - using CSS hover */
          .react-flow__edge-path {
            transition: stroke-width 0.2s ease, filter 0.2s ease;
          }
          .react-flow__edge:hover .react-flow__edge-path {
            stroke-width: 5;
            filter: brightness(1.2);
          }
        `}
      </style>
    </>
  );
};

export default CustomEdge;
