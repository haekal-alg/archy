import React from 'react';
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
  children,
}) => {
  // Configure ReactFlow behavior based on active tool
  const isHandTool = activeTool === 'hand';
  const isSelectionTool = activeTool === 'selection';

  // Hand tool: enable panning, disable node dragging
  // Selection tool: disable panning, enable node dragging (default behavior)
  const panOnDrag = isHandTool;
  const nodesDraggable = isSelectionTool;
  const nodesConnectable = isSelectionTool;
  const elementsSelectable = isSelectionTool;

  // Set cursor based on tool
  const cursorStyle = isHandTool ? 'grab' : 'default';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        cursor: cursorStyle,
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
