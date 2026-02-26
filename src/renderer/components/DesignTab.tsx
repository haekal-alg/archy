import React, { useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowInstance,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ToolType } from '../types/tools';
import CustomEdge from './CustomEdge';
import theme from '../../theme';

interface DesignTabProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: (event: React.MouseEvent) => void;
  onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void;
  onNodesDelete?: (nodes: Node[]) => void;
  onEdgesDelete?: (edges: Edge[]) => void;
  onInit: (instance: ReactFlowInstance) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  nodeTypes: any;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  activeTool: ToolType;
  onTemporaryHandToolStart: () => void;
  onTemporaryHandToolEnd: () => void;
  children?: React.ReactNode;
}

// Define edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const DesignTab: React.FC<DesignTabProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  onEdgeContextMenu,
  onNodesDelete,
  onEdgesDelete,
  onInit,
  onDrop,
  onDragOver,
  nodeTypes,
  reactFlowWrapper,
  activeTool,
  onTemporaryHandToolStart,
  onTemporaryHandToolEnd,
  children,
}) => {
  // Configure ReactFlow behavior based on active tool
  const isHandTool = activeTool === 'hand';
  const isSelectionTool = activeTool === 'selection';

  // Hand tool: enable panning with left or middle mouse, disable node dragging
  // Selection tool: enable panning with middle mouse only, enable node dragging
  // panOnDrag accepts: boolean, number (button), or array of numbers (buttons)
  // Button codes: 0 = left, 1 = middle, 2 = right
  const panOnDrag = isHandTool ? [0, 1] : [1]; // Hand: left+middle, Selection: middle only
  const nodesDraggable = isSelectionTool;
  const nodesConnectable = isSelectionTool;
  const elementsSelectable = isSelectionTool;

  // Drop zone highlight for drag-and-drop from ShapeLibrary
  const [isDragOver, setIsDragOver] = useState(false);

  // Set cursor based on tool - using state-based cursor
  const [currentCursor, setCurrentCursor] = useState<string>('default');
  const [isDragging, setIsDragging] = useState(false);
  const [isMiddleMouseDragging, setIsMiddleMouseDragging] = useState(false);

  useEffect(() => {
    // Update cursor based on tool and drag state
    if (isMiddleMouseDragging) {
      // Middle mouse button is being used - always show grabbing cursor
      setCurrentCursor('grabbing');
    } else if (isHandTool) {
      setCurrentCursor(isDragging ? 'grabbing' : 'grab');
    } else {
      setCurrentCursor('default');
    }
  }, [isHandTool, isDragging, isMiddleMouseDragging]);

  // Use window-level event listeners to capture middle mouse button
  // ReactFlow captures events and prevents bubbling, so we need to listen at window level
  useEffect(() => {
    const handleWindowMouseDown = (event: MouseEvent) => {
      if (event.button === 1) {
        // Middle mouse button (button 1)
        event.preventDefault();
        onTemporaryHandToolStart();
        setIsDragging(true);
        setIsMiddleMouseDragging(true);
      }
    };

    const handleWindowMouseUp = (event: MouseEvent) => {
      if (event.button === 1) {
        // Middle mouse button released
        event.preventDefault();
        setIsDragging(false);
        setIsMiddleMouseDragging(false);
        onTemporaryHandToolEnd();
      }
    };

    const handleWindowMouseMove = (event: MouseEvent) => {
      // Update dragging state when mouse moves with button pressed
      if (event.buttons === 1 && isHandTool) {
        // Left mouse button is pressed in hand tool mode
        if (!isDragging) setIsDragging(true);
      } else if (event.buttons === 0) {
        // No buttons pressed - reset all dragging states
        if (isDragging) setIsDragging(false);
        if (isMiddleMouseDragging) setIsMiddleMouseDragging(false);
      }
    };

    // Add event listeners to window with capture phase to ensure we get them before React Flow
    window.addEventListener('mousedown', handleWindowMouseDown, true);
    window.addEventListener('mouseup', handleWindowMouseUp, true);
    window.addEventListener('mousemove', handleWindowMouseMove, true);

    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleWindowMouseDown, true);
      window.removeEventListener('mouseup', handleWindowMouseUp, true);
      window.removeEventListener('mousemove', handleWindowMouseMove, true);
    };
  }, [onTemporaryHandToolStart, onTemporaryHandToolEnd, isHandTool, isDragging]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        cursor: currentCursor,
        outline: isDragOver ? '2px dashed rgba(77, 124, 254, 0.6)' : 'none',
        outlineOffset: '-2px',
        transition: 'outline 0.15s ease',
      }}
      ref={reactFlowWrapper}
      className={isMiddleMouseDragging ? 'middle-mouse-dragging' : ''}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={(e) => {
        // Only hide if leaving the wrapper entirely
        if (!e.currentTarget.contains(e.relatedTarget as HTMLElement)) {
          setIsDragOver(false);
        }
      }}
      onDrop={() => setIsDragOver(false)}
    >
      {children}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
        elementsSelectable={elementsSelectable}
        panOnDrag={panOnDrag}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        selectionOnDrag={isSelectionTool}
        selectionKeyCode="Control"
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        minZoom={0.01}
        maxZoom={20}
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
          markerStart: undefined,
          markerEnd: undefined,
        }}
        deleteKeyCode="Delete"
      >
        <Background
          color="rgba(77, 124, 254, 0.05)"
          gap={15}
          style={{
            opacity: 0.4,
          }}
        />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            backgroundColor: theme.background.primary,
            borderRadius: '8px',
            border: `1px solid ${theme.border.default}`,
          }}
        />
      </ReactFlow>

      {/* Selection Marquee Animation Styles */}
      <style>
        {`
          @keyframes selection-dash {
            to {
              stroke-dashoffset: -20;
            }
          }

          /* Custom selection rectangle styling */
          .react-flow__selection {
            background: rgba(77, 124, 254, 0.08) !important;
            border: 2px dashed rgba(77, 124, 254, 0.6) !important;
            animation: selection-dash 0.5s linear infinite;
            stroke-dasharray: 5, 5;
          }

          /* Instant pan/zoom for performance */
          .react-flow__viewport {
            transition: none !important;
          }

          /* Cursor override for middle mouse dragging */
          .react-flow__pane {
            cursor: ${isMiddleMouseDragging ? 'grabbing' : 'inherit'} !important;
          }

          .middle-mouse-dragging,
          .middle-mouse-dragging *:not(.react-flow__edge):not(.react-flow__edge-path) {
            cursor: grabbing !important;
          }

          /* Drag ghost/preview styling */
          .react-flow__node.dragging {
            opacity: 0.5;
            cursor: grabbing !important;
          }

          /* Connection line preview while dragging */
          .react-flow__connectionline {
            stroke: rgba(77, 124, 254, 0.8);
            stroke-width: 2;
            stroke-dasharray: 5, 5;
            animation: dashdraw 0.5s linear infinite;
          }

          @keyframes dashdraw {
            to {
              stroke-dashoffset: -10;
            }
          }

          /* Edge hover effects */
          .react-flow__edge {
            cursor: pointer !important;
          }

          .react-flow__edge-path {
            cursor: pointer !important;
            transition: stroke 0.15s ease, stroke-width 0.15s ease;
            pointer-events: all !important;
          }

          .react-flow__edge:hover .react-flow__edge-path {
            stroke: #ff5c5c !important;
          }

          /* Edge selected effect */
          .react-flow__edge.selected .react-flow__edge-path {
            stroke: #ff5c5c !important;
          }

          /* Edge interaction area (make it easier to hover) */
          .react-flow__edge-interaction {
            cursor: pointer !important;
          }

          /* Handle hover effects */
          .react-flow__handle {
            width: 12px !important;
            height: 12px !important;
            transition: all 0.2s ease;
          }

          .react-flow__handle:hover {
            width: 16px !important;
            height: 16px !important;
            box-shadow: 0 0 8px rgba(77, 124, 254, 0.6);
          }

          /* Node selection highlight */
          .react-flow__node.selected {
            z-index: 10;
          }

          /* Snap-to-grid visual feedback */
          .react-flow__node.dragging::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px dashed rgba(77, 124, 254, 0.4);
            border-radius: inherit;
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
};

export default DesignTab;
