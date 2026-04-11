import { useCallback, useRef } from 'react';
import { Edge, useReactFlow } from '@xyflow/react';
import {
  Waypoint,
  findClosestSegment,
  snapToGrid,
} from '../utils/edgePath';
import { CustomEdgeData } from '../components/CustomEdge';
import { EdgeInteractionContextValue } from '../contexts/EdgeInteractionContext';

const GRID_SIZE = 15;

interface UseEdgeInteractionOptions {
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  saveToHistory: () => void;
}

export function useEdgeInteraction({
  edges,
  setEdges,
  saveToHistory,
}: UseEdgeInteractionOptions): EdgeInteractionContextValue {
  const { screenToFlowPosition } = useReactFlow();
  const isDraggingRef = useRef(false);

  const onWaypointDragStart = useCallback(
    (edgeId: string, waypointIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingRef.current = true;

      let rafId: number | null = null;

      const onMouseMove = (ev: MouseEvent) => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const flowPos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
          const snapped = snapToGrid(flowPos, GRID_SIZE);

          setEdges((eds) =>
            eds.map((edge) => {
              if (edge.id !== edgeId) return edge;
              const data = (edge.data || {}) as CustomEdgeData;
              const waypoints = data.waypoints ? [...data.waypoints] : [];
              if (waypointIndex < 0 || waypointIndex >= waypoints.length) return edge;
              waypoints[waypointIndex] = { x: snapped.x, y: snapped.y };
              return {
                ...edge,
                data: { ...data, waypoints },
              };
            })
          );
        });
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        saveToHistory();
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [screenToFlowPosition, setEdges, saveToHistory]
  );

  const onSegmentClick = useCallback(
    (edgeId: string, segmentIndex: number, e: React.MouseEvent) => {
      // Don't add waypoints if we were just finishing a drag
      if (isDraggingRef.current) return;
      e.stopPropagation();

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const snapped = snapToGrid(flowPos, GRID_SIZE);

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== edgeId) return edge;
          const data = (edge.data || {}) as CustomEdgeData;
          const waypoints = data.waypoints ? [...data.waypoints] : [];

          // Insert new waypoint at the correct position in the array
          // segmentIndex 0 = between source and first waypoint (or target if no waypoints)
          // So insert at index = segmentIndex
          waypoints.splice(segmentIndex, 0, { x: snapped.x, y: snapped.y });

          return {
            ...edge,
            data: {
              ...data,
              waypoints,
              routingMode: 'manual' as const,
            },
          };
        })
      );

      setTimeout(() => saveToHistory(), 0);
    },
    [screenToFlowPosition, setEdges, saveToHistory]
  );

  const onWaypointDoubleClick = useCallback(
    (edgeId: string, waypointIndex: number) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== edgeId) return edge;
          const data = (edge.data || {}) as CustomEdgeData;
          const waypoints = data.waypoints ? [...data.waypoints] : [];
          if (waypointIndex < 0 || waypointIndex >= waypoints.length) return edge;

          waypoints.splice(waypointIndex, 1);

          // If all waypoints removed, revert to auto
          const newMode = waypoints.length === 0 ? 'auto' as const : 'manual' as const;

          return {
            ...edge,
            data: {
              ...data,
              waypoints: waypoints.length > 0 ? waypoints : undefined,
              routingMode: newMode,
            },
          };
        })
      );

      setTimeout(() => saveToHistory(), 0);
    },
    [setEdges, saveToHistory]
  );

  return {
    onWaypointDragStart,
    onSegmentClick,
    onWaypointDoubleClick,
  };
}
