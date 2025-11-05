import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  Panel,
  getNodesBounds,
  getViewportForBounds,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './components/DeviceNode';
import EnhancedDeviceNode, { EnhancedDeviceData } from './components/EnhancedDeviceNode';
import GroupNode from './components/GroupNode';
import CustomEdge, { CustomEdgeData } from './components/CustomEdge';
import EditNodeModal from './components/EditNodeModal';
import ShapeLibrary from './components/ShapeLibrary';
import StylePanel from './components/StylePanel';
import ContextMenu from './components/ContextMenu';
import './App.css';
import { toPng } from 'html-to-image';

const nodeTypes: NodeTypes = {
  device: DeviceNode,
  enhanced: EnhancedDeviceNode,
  group: GroupNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export interface DeviceData {
  label: string;
  type: 'windows' | 'linux' | 'generic';
  host: string;
  port: number;
  username: string;
  password: string;
}

const App: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [diagramName, setDiagramName] = useState('Untitled');
  const [isShapeLibraryOpen, setIsShapeLibraryOpen] = useState(true);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node?: Node;
    edge?: Edge;
  } | null>(null);

  // Setup menu event listeners with refs to avoid stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const diagramNameRef = useRef(diagramName);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    diagramNameRef.current = diagramName;
  }, [diagramName]);

  // Setup menu event listeners (only once on mount)
  useEffect(() => {
    const handleSave = async () => {
      const diagramData = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
        metadata: {
          name: diagramNameRef.current,
          created: new Date().toISOString(),
          version: '1.0'
        }
      };

      try {
        const result = await window.electron.saveDiagram(diagramNameRef.current, diagramData);
        if (result.success) {
          alert('Diagram saved successfully!');
        }
      } catch (error) {
        console.error('Save failed:', error);
        alert('Failed to save diagram');
      }
    };

    const handleLoad = async () => {
      try {
        const result = await window.electron.loadDiagram();
        if (result.success && result.data) {
          setNodes(result.data.nodes || []);
          setEdges(result.data.edges || []);
          setDiagramName(result.data.metadata?.name || result.filename || 'Untitled');
          alert('Diagram loaded successfully!');
        }
      } catch (error) {
        console.error('Load failed:', error);
        alert('Failed to load diagram');
      }
    };

    const handleExport = () => {
      if (!reactFlowWrapper.current || !reactFlowInstance) {
        alert('Please wait for the diagram to load');
        return;
      }

      const nodesBounds = getNodesBounds(nodesRef.current);
      if (nodesRef.current.length === 0) {
        alert('Please add some nodes to export');
        return;
      }

      const viewport = getViewportForBounds(
        nodesBounds,
        nodesBounds.width,
        nodesBounds.height,
        0.5,
        2,
        0.2
      );

      toPng(reactFlowWrapper.current, {
        backgroundColor: '#ffffff',
        width: nodesBounds.width + 200,
        height: nodesBounds.height + 200,
        style: {
          width: `${nodesBounds.width + 200}px`,
          height: `${nodesBounds.height + 200}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${diagramNameRef.current}.png`;
        link.href = dataUrl;
        link.click();
        alert('Diagram exported as PNG!');
      }).catch((error) => {
        console.error('Export failed:', error);
        alert('Failed to export diagram');
      });
    };

    const handleClear = () => {
      if (confirm('Are you sure you want to clear the canvas?')) {
        setNodes([]);
        setEdges([]);
        setDiagramName('Untitled');
      }
    };

    window.electron.onMenuSave(handleSave);
    window.electron.onMenuLoad(handleLoad);
    window.electron.onMenuExport(handleExport);
    window.electron.onMenuClear(handleClear);
  }, []); // Empty dependency array - only run once

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        data: {
          label: '',
          style: 'solid',
          color: '#b1b1b7',
          animated: false,
          routingType: 'bezier'
        } as CustomEdgeData
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type !== 'group') {
      setSelectedNode(node);
      setIsModalOpen(true);
    }
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node
    });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edge
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  const handleConnectToDevice = async (node: Node) => {
    const deviceData = node.data as unknown as DeviceData | EnhancedDeviceData;
    const { host, port, username, password } = deviceData as any;
    const type = (deviceData as any).type;

    try {
      if (type === 'windows') {
        await window.electron.connectRDP(host, username, password);
        console.log('RDP connection initiated');
      } else if (type === 'linux') {
        await window.electron.connectSSH(host, port || 22, username, password);
        console.log('SSH connection initiated');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Failed to connect: ${error}`);
    }
  };

  const handleSaveNode = (nodeData: DeviceData) => {
    if (selectedNode) {
      setNodes((nds: Node[]) =>
        nds.map((node: Node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: nodeData as unknown as Record<string, unknown>,
            };
          }
          return node;
        })
      );
    }
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  const addEnhancedNode = (type: string) => {
    const typeMap: Record<string, string> = {
      router: 'Router',
      server: 'Server',
      firewall: 'Firewall',
      windows: 'Windows PC',
      linux: 'Linux Server',
      switch: 'Network Switch',
      cloud: 'Cloud',
      database: 'Database',
      laptop: 'Laptop',
      attacker: 'Attacker',
      generic: 'Device'
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'enhanced',
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150
      },
      data: {
        label: typeMap[type] || 'Device',
        type: type,
        host: '',
        port: 22,
        username: '',
        password: '',
        ipAddress: '',
        description: '',
        interfaces: []
      } as unknown as Record<string, unknown>,
    };

    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const addGroupNode = () => {
    const colors = [
      { bg: '#ffb3ba40', border: '#ff6b6b' },
      { bg: '#bae1ff40', border: '#4dabf7' },
      { bg: '#baffc940', border: '#51cf66' },
      { bg: '#ffdfba40', border: '#ffa94d' },
      { bg: '#e3baff40', border: '#cc5de8' }
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNode: Node = {
      id: `group-${Date.now()}`,
      type: 'group',
      position: {
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100
      },
      style: {
        width: 400,
        height: 300,
        zIndex: -1
      },
      data: {
        label: 'Network Zone',
        backgroundColor: randomColor.bg,
        borderColor: randomColor.border,
        borderStyle: 'solid',
        description: ''
      },
    };

    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const updateNodeData = (nodeId: string, data: Partial<any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      })
    );
  };

  const updateEdgeData = (edgeId: string, data: Partial<CustomEdgeData>) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            animated: data.animated !== undefined ? data.animated : edge.animated,
            data: {
              ...edge.data,
              ...data
            }
          };
        }
        return edge;
      })
    );
  };

  const saveDiagram = async () => {
    const diagramData = {
      nodes,
      edges,
      metadata: {
        name: diagramName,
        created: new Date().toISOString(),
        version: '1.0'
      }
    };

    try {
      const result = await window.electron.saveDiagram(diagramName, diagramData);
      if (result.success) {
        alert('Diagram saved successfully!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save diagram');
    }
  };

  const loadDiagram = async () => {
    try {
      const result = await window.electron.loadDiagram();
      if (result.success && result.data) {
        setNodes(result.data.nodes || []);
        setEdges(result.data.edges || []);
        setDiagramName(result.data.metadata?.name || result.filename || 'Untitled');
        alert('Diagram loaded successfully!');
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load diagram');
    }
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      setDiagramName('Untitled');
    }
  };

  const exportToPNG = useCallback(() => {
    if (!reactFlowWrapper.current || !reactFlowInstance) {
      alert('Please wait for the diagram to load');
      return;
    }

    const nodesBounds = getNodesBounds(nodes);
    if (nodes.length === 0) {
      alert('Please add some nodes to export');
      return;
    }

    const viewport = getViewportForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2,
      0.2
    );

    toPng(reactFlowWrapper.current, {
      backgroundColor: '#ffffff',
      width: nodesBounds.width + 200,
      height: nodesBounds.height + 200,
      style: {
        width: `${nodesBounds.width + 200}px`,
        height: `${nodesBounds.height + 200}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `${diagramName}.png`;
      link.href = dataUrl;
      link.click();
      alert('Diagram exported as PNG!');
    }).catch((error) => {
      console.error('Export failed:', error);
      alert('Failed to export diagram');
    });
  }, [nodes, reactFlowInstance, diagramName]);

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <ShapeLibrary
        onAddNode={addEnhancedNode}
        onAddGroup={addGroupNode}
        isOpen={isShapeLibraryOpen}
        onToggle={() => setIsShapeLibraryOpen(!isShapeLibraryOpen)}
      />

      <StylePanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNode={updateNodeData}
        onUpdateEdge={updateEdgeData}
        isOpen={isStylePanelOpen}
        onToggle={() => setIsStylePanelOpen(!isStylePanelOpen)}
      />

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
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.01}
        maxZoom={10}
        defaultEdgeOptions={{
          type: 'custom',
        }}
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            background: '#f8f9fa',
            border: '2px solid #dee2e6',
            borderRadius: '8px'
          }}
        />
        <Panel position="bottom-center" style={{
          background: 'rgba(44,62,80,0.95)',
          color: '#ecf0f1',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <strong>Tip:</strong> Double-click nodes to edit | Right-click to delete/connect | {diagramName}
        </Panel>
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          showConnect={!!contextMenu.node && contextMenu.node.type !== 'group'}
          onConnect={contextMenu.node ? () => handleConnectToDevice(contextMenu.node!) : undefined}
          onDelete={() => {
            if (contextMenu.node) {
              handleDeleteNode(contextMenu.node.id);
            } else if (contextMenu.edge) {
              handleDeleteEdge(contextMenu.edge.id);
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {isModalOpen && selectedNode && selectedNode.type !== 'group' && (
        <EditNodeModal
          node={selectedNode}
          onSave={handleSaveNode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNode(null);
          }}
          onConnect={() => handleConnectToDevice(selectedNode)}
        />
      )}

      {/* Arrow markers for edges */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="arrow-start"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polyline
              points="10,1 5,5 10,9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default App;
