import React, { useState, useCallback, useRef } from 'react';
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
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './components/DeviceNode';
import EditNodeModal from './components/EditNodeModal';
import Toolbar from './components/Toolbar';
import './App.css';

const nodeTypes: NodeTypes = {
  device: DeviceNode,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [diagramName, setDiagramName] = useState('Untitled');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  }, []);

  const handleConnectToDevice = async (node: Node) => {
    const { type, host, port, username, password } = node.data as unknown as DeviceData;

    try {
      if (type === 'windows') {
        await window.electron.connectRDP(host, username, password);
        console.log('RDP connection initiated');
      } else if (type === 'linux') {
        await window.electron.connectSSH(host, port, username, password);
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

  const addNewDevice = (type: 'windows' | 'linux' | 'generic') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'device',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Device',
        type,
        host: '',
        port: type === 'linux' ? 22 : 3389,
        username: '',
        password: '',
      } as unknown as Record<string, unknown>,
    };

    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const saveDiagram = async () => {
    const name = prompt('Enter diagram name:', diagramName);
    if (name) {
      const diagramData = {
        nodes,
        edges,
      };
      await window.electron.saveDiagram(name, diagramData);
      setDiagramName(name);
      alert('Diagram saved successfully!');
    }
  };

  const loadDiagram = async () => {
    const diagrams = await window.electron.listDiagrams();
    if (diagrams.length === 0) {
      alert('No saved diagrams found');
      return;
    }

    const name = prompt(
      `Enter diagram name to load:\n\nAvailable diagrams:\n${diagrams.join('\n')}`
    );

    if (name) {
      const data = await window.electron.loadDiagram(name);
      if (data) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setDiagramName(name);
        alert('Diagram loaded successfully!');
      } else {
        alert('Diagram not found');
      }
    }
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      setDiagramName('Untitled');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <Toolbar
        onAddWindows={() => addNewDevice('windows')}
        onAddLinux={() => addNewDevice('linux')}
        onAddGeneric={() => addNewDevice('generic')}
        onSave={saveDiagram}
        onLoad={loadDiagram}
        onClear={clearCanvas}
        diagramName={diagramName}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {isModalOpen && selectedNode && (
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
    </div>
  );
};

export default App;
