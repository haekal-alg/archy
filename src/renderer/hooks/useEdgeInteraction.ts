import { useCallback, useRef } from 'react';
import { Edge, useReactFlow } from '@xyflow/react';
import {
  Waypoint,
  findClosestSegment,
  snapToGrid,
} from '../utils/edgePath';
import { CustomEdgeData } from '../components/CustomEdge';
import { EdgeInteractionContextValue } from '../contexts/EdgeInteractionContext';

function log(level: string, message: string) {
  try {
    if ((window as any).electron?.log) {
      (window as any).electron.log(level, message);
    }
  } catch {}
  if (level === 'error') {
    console.error(`[EdgeInteraction] ${message}`);
  } else if (level === 'warn') {
    console.warn(`[EdgeInteraction] ${message}`);
  } else {
    console.log(`[EdgeInteraction] ${message}`);
  }
}

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
      try {
        e.stopPropagation();
        e.preventDefault();
        isDraggingRef.current = true;
        log('info', `Waypoint drag start: edge=${edgeId}, waypointIndex=${waypointIndex}`);

        let rafId: number | null = null;

        const onMouseMove = (ev: MouseEvent) => {
          if (rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            try {
              const flowPos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
              const snapped = snapToGrid(flowPos, GRID_SIZE);

              setEdges((eds) =>
                eds.map((edge) => {
                  if (edge.id !== edgeId) return edge;
                  const data = (edge.data || {}) as CustomEdgeData;
                  const waypoints = data.waypoints ? [...data.waypoints] : [];
                  if (waypointIndex < 0 || waypointIndex >= waypoints.length) {
                    log('warn', `Waypoint drag: index ${waypointIndex} out of bounds (${waypoints.length} waypoints) on edge ${edgeId}`);
                    return edge;
                  }
                  waypoints[waypointIndex] = { x: snapped.x, y: snapped.y };
                  return {
                    ...edge,
                    data: { ...data, waypoints },
                  };
                })
              );
            } catch (err) {
              log('error', `Waypoint drag move failed: edge=${edgeId}, error=${err instanceof Error ? err.message : String(err)}, stack=${err instanceof Error ? err.stack : 'n/a'}`);
            }
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
          log('info', `Waypoint drag end: edge=${edgeId}, waypointIndex=${waypointIndex}`);
          saveToHistory();
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      } catch (err) {
        log('error', `Waypoint drag start failed: edge=${edgeId}, error=${err instanceof Error ? err.message : String(err)}, stack=${err instanceof Error ? err.stack : 'n/a'}`);
      }
    },
    [screenToFlowPosition, setEdges, saveToHistory]
  );

  const onSegmentClick = useCallback(
    (edgeId: string, segmentIndex: number, e: React.MouseEvent) => {
      try {
        // Don't add waypoints if we were just finishing a drag
        if (isDraggingRef.current) return;
        e.stopPropagation();

        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const snapped = snapToGrid(flowPos, GRID_SIZE);
        log('info', `Segment click: edge=${edgeId}, segmentIndex=${segmentIndex}, insertAt=(${snapped.x}, ${snapped.y})`);

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id !== edgeId) return edge;
            const data = (edge.data || {}) as CustomEdgeData;
            const waypoints = data.waypoints ? [...data.waypoints] : [];

            // Insert new waypoint at the correct position in the array
            // segmentIndex 0 = between source and first waypoint (or target if no waypoints)
            // So insert at index = segmentIndex
            waypoints.splice(segmentIndex, 0, { x: snapped.x, y: snapped.y });
            log('info', `Waypoint inserted: edge=${edgeId}, totalWaypoints=${waypoints.length}, routingMode=manual`);

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
      } catch (err) {
        log('error', `Segment click failed: edge=${edgeId}, segmentIndex=${segmentIndex}, error=${err instanceof Error ? err.message : String(err)}, stack=${err instanceof Error ? err.stack : 'n/a'}`);
      }
    },
    [screenToFlowPosition, setEdges, saveToHistory]
  );

  const onWaypointDoubleClick = useCallback(
    (edgeId: string, waypointIndex: number) => {
      try {
        log('info', `Waypoint double-click (delete): edge=${edgeId}, waypointIndex=${waypointIndex}`);

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id !== edgeId) return edge;
            const data = (edge.data || {}) as CustomEdgeData;
            const waypoints = data.waypoints ? [...data.waypoints] : [];
            if (waypointIndex < 0 || waypointIndex >= waypoints.length) {
              log('warn', `Waypoint delete: index ${waypointIndex} out of bounds (${waypoints.length} waypoints) on edge ${edgeId}`);
              return edge;
            }

            waypoints.splice(waypointIndex, 1);

            // If all waypoints removed, revert to auto
            const newMode = waypoints.length === 0 ? 'auto' as const : 'manual' as const;
            log('info', `Waypoint deleted: edge=${edgeId}, remaining=${waypoints.length}, routingMode=${newMode}`);

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
      } catch (err) {
        log('error', `Waypoint double-click failed: edge=${edgeId}, waypointIndex=${waypointIndex}, error=${err instanceof Error ? err.message : String(err)}, stack=${err instanceof Error ? err.stack : 'n/a'}`);
      }
    },
    [setEdges, saveToHistory]
  );

  return {
    onWaypointDragStart,
    onSegmentClick,
    onWaypointDoubleClick,
  };
}
