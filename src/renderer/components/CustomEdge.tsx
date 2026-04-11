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
import {
  Waypoint,
  RoutingMode,
  buildPolylinePath,
  buildSmoothStepManualPath,
  buildBezierManualPath,
  computeLabelPosition,
  buildSegmentPaths,
} from '../utils/edgePath';
import { useEdgeInteractionContext } from '../contexts/EdgeInteractionContext';

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
  waypoints?: Waypoint[];
  routingMode?: RoutingMode;
}

const HANDLE_SIZE = 8;

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
  const interaction = useEdgeInteractionContext();

  const color = edgeData?.color || theme.border.default;
  const routingType = edgeData?.routingType || 'bezier';
  const strokeStyle = (edgeData as any)?.lineStyle || edgeData?.style || 'solid';
  const strokeWidth = (edgeData as any)?.strokeWidth || 4;
  const animated = edgeData?.animated || false;
  const label = edgeData?.label;
  const markerStartType = edgeData?.markerStart || 'none';
  const markerEndType = edgeData?.markerEnd || 'arrow';

  const routingMode = edgeData?.routingMode || 'auto';
  const waypoints = edgeData?.waypoints || [];
  const isManual = routingMode === 'manual' && waypoints.length > 0;

  // Generate marker URL references
  const getMarkerUrl = (markerType: MarkerType, position: 'start' | 'end') => {
    if (markerType === 'none') return undefined;
    if (isHovered || selected) {
      return `url(#${markerType}-${position}-ff5c5c)`;
    }
    const colorId = color.replace('#', '');
    return `url(#${markerType}-${position}-${colorId})`;
  };

  const markerStartUrl = getMarkerUrl(markerStartType, 'start');
  const markerEndUrl = getMarkerUrl(markerEndType, 'end');

  // ─── Path Computation ──────────────────────────────────────
  let path: string;
  let labelX: number;
  let labelY: number;

  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };

  if (isManual) {
    // Manual mode: build path from stored waypoints
    if (routingType === 'smoothstep') {
      path = buildSmoothStepManualPath(source, target, waypoints);
    } else if (routingType === 'bezier') {
      path = buildBezierManualPath(source, target, waypoints);
    } else {
      path = buildPolylinePath(source, target, waypoints);
    }
    const labelPos = computeLabelPosition(source, target, waypoints);
    labelX = labelPos.x;
    labelY = labelPos.y;
  } else {
    // Auto mode: use React Flow's built-in path computation
    if (routingType === 'smoothstep') {
      [path, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
      });
    } else if (routingType === 'straight') {
      [path, labelX, labelY] = getStraightPath({
        sourceX, sourceY, targetX, targetY,
      });
    } else {
      [path, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
      });
    }
  }

  const strokeDasharray = strokeStyle === 'dashed' ? '8 4' : strokeStyle === 'dotted' ? '2 4' : 'none';

  // Build segment hit-zone paths for click-to-add-waypoint
  const segmentPaths = (selected || isHovered) && interaction
    ? buildSegmentPaths(source, target, waypoints)
    : [];

  return (
    <>
      {/* Main edge path */}
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

      {/* Segment hit zones for adding waypoints */}
      {segmentPaths.map((segPath, i) => (
        <path
          key={`hit-${id}-${i}`}
          d={segPath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'crosshair', pointerEvents: 'stroke' }}
          onClick={(e) => interaction?.onSegmentClick(id, i, e)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      ))}

      {/* Animated flow effect with intense glow */}
      {animated && (
        <>
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

      {/* Waypoint handles (visible when selected and in manual mode) */}
      {selected && isManual && interaction && (
        <EdgeLabelRenderer>
          {waypoints.map((wp, i) => (
            <div
              key={`wp-${id}-${i}`}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${wp.x}px,${wp.y}px)`,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: '50%',
                background: '#ffffff',
                border: `2px solid ${color}`,
                cursor: 'grab',
                pointerEvents: 'all',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                zIndex: 10,
              }}
              className="nodrag nopan"
              onMouseDown={(e) => interaction.onWaypointDragStart(id, i, e)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                interaction.onWaypointDoubleClick(id, i);
              }}
            />
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;
