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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ToolType } from '../types/tools';

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
  onInit: (instance: ReactFlowInstance) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  nodeTypes: any;
  edgeTypes: any;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  activeTool: ToolType;
  onTemporaryHandToolStart: () => void;
  onTemporaryHandToolEnd: () => void;
  children?: React.ReactNode;
}

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
  onInit,
  onDrop,
  onDragOver,
  nodeTypes,
  edgeTypes,
  reactFlowWrapper,
  activeTool,
  onTemporaryHandToolStart,
  onTemporaryHandToolEnd,
  children,
}) => {
  // Configure ReactFlow behavior based on active tool
  console.log('DesignTab render - activeTool prop:', activeTool);
  const isHandTool = activeTool === 'hand';
  const isSelectionTool = activeTool === 'selection';
  console.log('isHandTool:', isHandTool, 'isSelectionTool:', isSelectionTool);

  // Hand tool: enable panning with left or middle mouse, disable node dragging
  // Selection tool: enable panning with middle mouse only, enable node dragging
  // panOnDrag accepts: boolean, number (button), or array of numbers (buttons)
  // Button codes: 0 = left, 1 = middle, 2 = right
  const panOnDrag = isHandTool ? [0, 1] : [1]; // Hand: left+middle, Selection: middle only
  const nodesDraggable = isSelectionTool;
  const nodesConnectable = isSelectionTool;
  const elementsSelectable = isSelectionTool;

  // Set cursor based on tool - using state-based cursor
  const [currentCursor, setCurrentCursor] = useState<string>('default');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Update cursor based on tool and drag state
    if (isHandTool) {
      setCurrentCursor(isDragging ? 'grabbing' : 'grab');
    } else {
      setCurrentCursor('default');
    }
  }, [isHandTool, isDragging]);

  // Use window-level event listeners to capture middle mouse button
  // ReactFlow captures events and prevents bubbling, so we need to listen at window level
  useEffect(() => {
    const handleWindowMouseDown = (event: MouseEvent) => {
      console.log('WINDOW Mouse down - button:', event.button, 'buttons:', event.buttons);
      if (event.button === 1) {
        // Middle mouse button (button 1)
        console.log('MIDDLE MOUSE BUTTON PRESSED - Activating Hand Tool');
        event.preventDefault();
        onTemporaryHandToolStart();
        setIsDragging(true);
        console.log('Active tool should now be: hand, isDragging:', true);
      }
    };

    const handleWindowMouseUp = (event: MouseEvent) => {
      console.log('WINDOW Mouse up - button:', event.button, 'buttons:', event.buttons);
      if (event.button === 1) {
        // Middle mouse button released
        console.log('MIDDLE MOUSE BUTTON RELEASED - Returning to Selection Tool');
        event.preventDefault();
        setIsDragging(false);
        onTemporaryHandToolEnd();
        console.log('Active tool should now be: selection, isDragging:', false);
      }
    };

    const handleWindowMouseMove = (event: MouseEvent) => {
      // Update dragging state when mouse moves with button pressed
      if (event.buttons === 1 && isHandTool) {
        // Left mouse button is pressed in hand tool mode
        if (!isDragging) setIsDragging(true);
      } else if (event.buttons === 0) {
        // No buttons pressed
        if (isDragging) setIsDragging(false);
      }
    };

    // Add event listeners to window
    window.addEventListener('mousedown', handleWindowMouseDown);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('mousemove', handleWindowMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('mousedown', handleWindowMouseDown);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [onTemporaryHandToolStart, onTemporaryHandToolEnd, isHandTool, isDragging]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        cursor: currentCursor,
      }}
      ref={reactFlowWrapper}
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
        }}
        deleteKeyCode="Delete"
      >
        <Background color="#000000" gap={20} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default DesignTab;
