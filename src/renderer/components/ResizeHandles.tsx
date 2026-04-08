import React, { useCallback, useRef, useState } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';
import CONFIG from '../../config';

// --- Generalized handle configuration ---
// Each handle declares which axes it affects and whether dragging in the
// positive screen direction grows or shrinks that axis. This avoids 8
// separate hardcoded cases — the same math works for every handle.

interface HandleConfig {
  id: string;
  cursor: string;          // inline fallback
  cursorClass: string;     // CSS class that applies cursor with !important (overrides global reset)
  affectsWidth: boolean;
  affectsHeight: boolean;
  invertX: boolean;   // true = left-side handle (positive drag shrinks)
  invertY: boolean;   // true = top-side handle (positive drag shrinks)
  // CSS positioning for the hit-area wrapper on the node boundary
  positionStyle: React.CSSProperties;
}

const HANDLE_SIZE = CONFIG.deviceNodes.resizeHandleSize;
const HIT_AREA = HANDLE_SIZE * 2;           // 16px invisible click target
const HIT_OFFSET = -(HIT_AREA / 2);        // center hit area on the boundary edge

const HANDLE_CONFIGS: HandleConfig[] = [
  // Corners
  {
    id: 'top-left',
    cursor: 'nwse-resize', cursorClass: 'cursor-nwse',
    affectsWidth: true, affectsHeight: true,
    invertX: true, invertY: true,
    positionStyle: { top: HIT_OFFSET, left: HIT_OFFSET },
  },
  {
    id: 'top-right',
    cursor: 'nesw-resize', cursorClass: 'cursor-nesw',
    affectsWidth: true, affectsHeight: true,
    invertX: false, invertY: true,
    positionStyle: { top: HIT_OFFSET, right: HIT_OFFSET },
  },
  {
    id: 'bottom-left',
    cursor: 'nesw-resize', cursorClass: 'cursor-nesw',
    affectsWidth: true, affectsHeight: true,
    invertX: true, invertY: false,
    positionStyle: { bottom: HIT_OFFSET, left: HIT_OFFSET },
  },
  {
    id: 'bottom-right',
    cursor: 'nwse-resize', cursorClass: 'cursor-nwse',
    affectsWidth: true, affectsHeight: true,
    invertX: false, invertY: false,
    positionStyle: { bottom: HIT_OFFSET, right: HIT_OFFSET },
  },
  // Edge midpoints
  {
    id: 'top',
    cursor: 'ns-resize', cursorClass: 'cursor-ns',
    affectsWidth: false, affectsHeight: true,
    invertX: false, invertY: true,
    positionStyle: { top: HIT_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  },
  {
    id: 'right',
    cursor: 'ew-resize', cursorClass: 'cursor-ew',
    affectsWidth: true, affectsHeight: false,
    invertX: false, invertY: false,
    positionStyle: { top: '50%', right: HIT_OFFSET, transform: 'translateY(-50%)' },
  },
  {
    id: 'bottom',
    cursor: 'ns-resize', cursorClass: 'cursor-ns',
    affectsWidth: false, affectsHeight: true,
    invertX: false, invertY: false,
    positionStyle: { bottom: HIT_OFFSET, left: '50%', transform: 'translateX(-50%)' },
  },
  {
    id: 'left',
    cursor: 'ew-resize', cursorClass: 'cursor-ew',
    affectsWidth: true, affectsHeight: false,
    invertX: true, invertY: false,
    positionStyle: { top: '50%', left: HIT_OFFSET, transform: 'translateY(-50%)' },
  },
];

// --- Component ---

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

type LimitState = 'none' | 'min' | 'max';

const LIMIT_COLOR = '#ff5c5c';
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
  const rafRef = useRef<number | null>(null);
  // Store latest pointer event data for rAF callback (avoids stale closures)
  const latestEventRef = useRef<{ clientX: number; clientY: number; altKey: boolean } | null>(null);

  const [activeHandleId, setActiveHandleId] = useState<string | null>(null);
  const [liveSize, setLiveSize] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [limitState, setLimitState] = useState<LimitState>('none');

  const minSize = CONFIG.deviceNodes.minIconSize;
  const maxSize = CONFIG.deviceNodes.maxIconSize;

  // --- Pointer handlers ---

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
    setLimitState('none');
  }, [getNode, nodeId, iconSize]);

  // The actual resize computation — called inside rAF
  const computeResize = useCallback(() => {
    const drag = dragRef.current;
    const evt = latestEventRef.current;
    if (!drag || !evt) return;

    const zoom = storeApi.getState().transform[2];
    const rawDx = (evt.clientX - drag.startX) / zoom;
    const rawDy = (evt.clientY - drag.startY) / zoom;

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

    const rawNewSize = drag.startSize + delta;
    const newSize = Math.round(clamp(rawNewSize, minSize, maxSize));
    const actualDelta = newSize - drag.startSize;

    // --- Limit detection ---
    // Check if the user is pushing beyond the boundary
    const hitMin = rawNewSize <= minSize;
    const hitMax = rawNewSize >= maxSize;
    setLimitState(hitMin ? 'min' : hitMax ? 'max' : 'none');

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
    if (evt.altKey) {
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
    rafRef.current = null;
  }, [storeApi, nodeId, updateNodeData, setNodes, minSize, maxSize]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;

    // Store latest event data for the rAF callback
    latestEventRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      altKey: e.altKey,
    };

    // Position tooltip near the active handle (immediate, outside rAF for responsiveness)
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });

    // Throttle resize computation to animation frames
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(computeResize);
    }
  }, [computeResize]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Cancel any pending rAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    dragRef.current = null;
    latestEventRef.current = null;
    setActiveHandleId(null);
    setLiveSize(null);
    setTooltipPos(null);
    setLimitState('none');
    onResizeEnd();
  }, [onResizeEnd]);

  // --- Render ---

  const isAtLimit = limitState !== 'none';
  const handleColor = isAtLimit ? LIMIT_COLOR : color;

  return (
    <>
      {HANDLE_CONFIGS.map((handle) => {
        const isActive = activeHandleId === handle.id;
        return (
          // Outer hit-area: larger invisible click target (16x16)
          <div
            key={handle.id}
            className={`resize-handle-hitarea ${handle.cursorClass} nodrag nopan`}
            onPointerDown={(e) => onPointerDown(e, handle)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              position: 'absolute',
              width: HIT_AREA,
              height: HIT_AREA,
              pointerEvents: isVisible ? 'auto' : 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...handle.positionStyle,
            }}
          >
            {/* Visible handle circle */}
            <div
              className={`resize-handle${isAtLimit && isActive ? ' resize-handle-at-limit' : ''}`}
              style={{
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: '50%',
                background: isActive ? handleColor : color,
                border: `${CONFIG.deviceNodes.resizeHandleBorder}px solid ${CONFIG.deviceNodes.resizeHandleBorderColor}`,
                opacity: isVisible ? (isActive ? 1 : 0.85) : 0,
                boxSizing: 'border-box',
              }}
            />
          </div>
        );
      })}

      {/* Size tooltip during active resize */}
      {liveSize !== null && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            background: isAtLimit ? 'rgba(255, 92, 92, 0.9)' : 'rgba(0, 0, 0, 0.8)',
            color: '#e8ecf4',
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'background-color 0.15s ease',
          }}
        >
          {liveSize}px{limitState === 'min' ? ' MIN' : limitState === 'max' ? ' MAX' : ''}
        </div>
      )}
    </>
  );
};

export default ResizeHandles;
