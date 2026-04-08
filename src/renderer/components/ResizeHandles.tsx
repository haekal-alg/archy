import React, { useCallback, useRef, useState } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';
import CONFIG from '../../config';

// --- Generalized handle configuration ---
// Each handle declares which axes it affects and whether dragging in the
// positive screen direction grows or shrinks that axis. This avoids 8
// separate hardcoded cases — the same math works for every handle.

interface HandleConfig {
  id: string;
  cursor: string;
  affectsWidth: boolean;
  affectsHeight: boolean;
  invertX: boolean;   // true = left-side handle (positive drag shrinks)
  invertY: boolean;   // true = top-side handle (positive drag shrinks)
  // CSS positioning for where the handle sits on the node boundary
  positionStyle: React.CSSProperties;
}

const HALF = CONFIG.deviceNodes.resizeHandleSize / 2;

const HANDLE_CONFIGS: HandleConfig[] = [
  // Corners
  {
    id: 'top-left',
    cursor: 'nwse-resize',
    affectsWidth: true, affectsHeight: true,
    invertX: true, invertY: true,
    positionStyle: { top: -HALF, left: -HALF },
  },
  {
    id: 'top-right',
    cursor: 'nesw-resize',
    affectsWidth: true, affectsHeight: true,
    invertX: false, invertY: true,
    positionStyle: { top: -HALF, right: -HALF },
  },
  {
    id: 'bottom-left',
    cursor: 'nesw-resize',
    affectsWidth: true, affectsHeight: true,
    invertX: true, invertY: false,
    positionStyle: { bottom: -HALF, left: -HALF },
  },
  {
    id: 'bottom-right',
    cursor: 'nwse-resize',
    affectsWidth: true, affectsHeight: true,
    invertX: false, invertY: false,
    positionStyle: { bottom: -HALF, right: -HALF },
  },
  // Edge midpoints
  {
    id: 'top',
    cursor: 'ns-resize',
    affectsWidth: false, affectsHeight: true,
    invertX: false, invertY: true,
    positionStyle: { top: -HALF, left: '50%', transform: 'translateX(-50%)' },
  },
  {
    id: 'right',
    cursor: 'ew-resize',
    affectsWidth: true, affectsHeight: false,
    invertX: false, invertY: false,
    positionStyle: { top: '50%', right: -HALF, transform: 'translateY(-50%)' },
  },
  {
    id: 'bottom',
    cursor: 'ns-resize',
    affectsWidth: false, affectsHeight: true,
    invertX: false, invertY: false,
    positionStyle: { bottom: -HALF, left: '50%', transform: 'translateX(-50%)' },
  },
  {
    id: 'left',
    cursor: 'ew-resize',
    affectsWidth: true, affectsHeight: false,
    invertX: true, invertY: false,
    positionStyle: { top: '50%', left: -HALF, transform: 'translateY(-50%)' },
  },
];

interface ResizeHandlesProps {
  nodeId: string;
  isVisible: boolean;
  color: string;
  iconSize: number;
  onResizeEnd: () => void;
}

interface DragState {
  handle: HandleConfig;
  startX: number;
  startY: number;
  startSize: number;
  startNodeX: number;
  startNodeY: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  nodeId,
  isVisible,
  color,
  iconSize,
  onResizeEnd,
}) => {
  const { updateNodeData, setNodes, getNode } = useReactFlow();
  const storeApi = useStoreApi();
  const dragRef = useRef<DragState | null>(null);
  const [activeHandleId, setActiveHandleId] = useState<string | null>(null);
  const [liveSize, setLiveSize] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleSize = CONFIG.deviceNodes.resizeHandleSize;
  const minSize = CONFIG.deviceNodes.minIconSize;
  const maxSize = CONFIG.deviceNodes.maxIconSize;

  const onPointerDown = useCallback((e: React.PointerEvent, handle: HandleConfig) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const node = getNode(nodeId);
    if (!node) return;

    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startSize: iconSize,
      startNodeX: node.position.x,
      startNodeY: node.position.y,
    };
    setActiveHandleId(handle.id);
    setLiveSize(iconSize);
  }, [getNode, nodeId, iconSize]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const zoom = storeApi.getState().transform[2];
    const rawDx = (e.clientX - drag.startX) / zoom;
    const rawDy = (e.clientY - drag.startY) / zoom;

    const { handle } = drag;

    // Compute effective delta per axis based on handle direction
    const effectiveDx = handle.invertX ? -rawDx : rawDx;
    const effectiveDy = handle.invertY ? -rawDy : rawDy;

    // Determine the size delta from applicable axes
    let delta: number;
    if (handle.affectsWidth && handle.affectsHeight) {
      // Corner handle: average both axes for smooth diagonal resize
      delta = (effectiveDx + effectiveDy) / 2;
    } else if (handle.affectsWidth) {
      delta = effectiveDx;
    } else {
      delta = effectiveDy;
    }

    const newSize = Math.round(clamp(drag.startSize + delta, minSize, maxSize));
    const actualDelta = newSize - drag.startSize;

    // Compute new node position — shift when resizing from top/left
    let newX = drag.startNodeX;
    let newY = drag.startNodeY;

    if (handle.invertX && handle.affectsWidth) {
      newX = drag.startNodeX - actualDelta;
    }
    if (handle.invertY && handle.affectsHeight) {
      newY = drag.startNodeY - actualDelta;
    }

    // Alt key: resize from center (both sides move equally)
    if (e.altKey) {
      newX = drag.startNodeX - actualDelta / 2;
      newY = drag.startNodeY - actualDelta / 2;
    }

    // Update icon size in node data (live during drag)
    updateNodeData(nodeId, { iconSize: newSize });

    // Update node position if it changed
    if (newX !== drag.startNodeX || newY !== drag.startNodeY) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, position: { x: newX, y: newY } }
            : n
        )
      );
    }

    setLiveSize(newSize);

    // Position tooltip near the active handle element
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, [storeApi, nodeId, updateNodeData, setNodes, minSize, maxSize]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setActiveHandleId(null);
    setLiveSize(null);
    setTooltipPos(null);
    onResizeEnd();
  }, [onResizeEnd]);

  return (
    <>
      {HANDLE_CONFIGS.map((handle) => (
        <div
          key={handle.id}
          className="resize-handle nodrag nopan"
          onPointerDown={(e) => onPointerDown(e, handle)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            borderRadius: '50%',
            background: color,
            border: `${CONFIG.deviceNodes.resizeHandleBorder}px solid ${CONFIG.deviceNodes.resizeHandleBorderColor}`,
            cursor: handle.cursor,
            opacity: isVisible ? (activeHandleId === handle.id ? 1 : 0.85) : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
            zIndex: 10,
            boxSizing: 'border-box',
            ...handle.positionStyle,
          }}
        />
      ))}

      {/* Size tooltip during active resize */}
      {liveSize !== null && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#e8ecf4',
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {liveSize}px
        </div>
      )}
    </>
  );
};

export default ResizeHandles;
