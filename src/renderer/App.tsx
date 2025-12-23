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
  useNodesState,
  useEdgesState,
  Panel,
  getNodesBounds,
  getViewportForBounds,
  ReactFlowInstance,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeviceNode from './components/DeviceNode';
import EnhancedDeviceNode, { EnhancedDeviceData } from './components/EnhancedDeviceNode';
import GroupNode from './components/GroupNode';
import TextNode from './components/TextNode';
import EditNodeModal from './components/EditNodeModal';
import ShapeLibrary from './components/ShapeLibrary';
import StylePanel from './components/StylePanel';
import ContextMenu from './components/ContextMenu';
import TabBar from './components/TabBar';
import DesignTab from './components/DesignTab';
import ConnectionsTab from './components/ConnectionsTab';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import LoadingSpinner from './components/LoadingSpinner';
import { TabProvider, useTabContext } from './contexts/TabContext';
import { ToolPalette } from './components/ToolPalette';
import { ToolType } from './types/tools';
import { useToast } from './hooks/useToast';
import './App.css';
import { toPng, toJpeg } from 'html-to-image';
import theme from '../theme';

const nodeTypes: NodeTypes = {
  device: DeviceNode,
  enhanced: EnhancedDeviceNode,
  group: GroupNode,
  text: TextNode,
};

export interface DeviceData {
  label: string;
  type: 'windows' | 'linux' | 'generic';
  host: string;
  port: number;
  username: string;
  password: string;
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const AppContent: React.FC = () => {
  const { activeTab, createConnection } = useTabContext();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [diagramName, setDiagramName] = useState('Untitled');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isShapeLibraryOpen, setIsShapeLibraryOpen] = useState(true);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType>('selection');
  const [isHandToolTemporary, setIsHandToolTemporary] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node?: Node;
    edge?: Edge;
  } | null>(null);

  // Debug logging for tool changes
  useEffect(() => {
    console.log('===== ACTIVE TOOL CHANGED =====');
    console.log('New activeTool:', activeTool);
    console.log('isHandToolTemporary:', isHandToolTemporary);
    console.log('===============================');
  }, [activeTool, isHandToolTemporary]);

  // History state for Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Setup menu event listeners with refs to avoid stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const diagramNameRef = useRef(diagramName);
  const currentFilePathRef = useRef(currentFilePath);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    diagramNameRef.current = diagramName;
  }, [diagramName]);

  useEffect(() => {
    currentFilePathRef.current = currentFilePath;
  }, [currentFilePath]);

  // Track unsaved changes when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);

  // Auto-load last session on mount
  useEffect(() => {
    const loadLastSession = async () => {
      try {
        const result = await window.electron.getLastSession();
        if (result.success && result.data) {
          setNodes(result.data.nodes || []);
          setEdges(result.data.edges || []);
          setDiagramName(result.data.metadata?.name || result.filename || 'Untitled');
          setCurrentFilePath(result.filePath);
          setHasUnsavedChanges(false);
          console.log('Loaded last session:', result.filePath);
        }
      } catch (error) {
        console.log('No previous session to load');
      }
    };

    loadLastSession();
  }, []); // Run only once on mount

  // History management functions
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex((idx) => idx);
        return newHistory;
      }
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [nodes, edges, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);

      // Visual feedback
      showInfo('Undo', { duration: 2000 });
    }
  }, [historyIndex, history, setNodes, setEdges, showInfo]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);

      // Visual feedback
      showInfo('Redo', { duration: 2000 });
    }
  }, [historyIndex, history, setNodes, setEdges, showInfo]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handle manual tool changes (from UI or keyboard)
  const handleToolChange = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    setIsHandToolTemporary(false); // Reset temporary flag on manual change
  }, []);

  // Handle temporary hand tool activation (middle mouse button)
  const handleTemporaryHandToolStart = useCallback(() => {
    console.log('handleTemporaryHandToolStart called - Current tool:', activeTool);
    if (activeTool !== 'hand') {
      // Only activate temporary hand tool if not already in hand tool mode
      console.log('Setting activeTool to HAND (temporary)');
      setActiveTool('hand');
      setIsHandToolTemporary(true);
    } else {
      console.log('Already in hand tool mode, not changing');
    }
  }, [activeTool]);

  const handleTemporaryHandToolEnd = useCallback(() => {
    console.log('handleTemporaryHandToolEnd called - isHandToolTemporary:', isHandToolTemporary);
    if (isHandToolTemporary) {
      // Only revert if it was temporary
      console.log('Setting activeTool back to SELECTION');
      setActiveTool('selection');
      setIsHandToolTemporary(false);
    } else {
      console.log('Not temporary mode, not reverting');
    }
  }, [isHandToolTemporary]);

  // Keyboard shortcuts for Undo/Redo and Tools
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Toggle keyboard shortcuts modal with ?
      if (!isInputField && event.key === '?' && !event.shiftKey) {
        event.preventDefault();
        setShowKeyboardShortcuts(true);
      } else if (event.key === 'Escape') {
        // Close keyboard shortcuts modal or deselect
        if (showKeyboardShortcuts) {
          event.preventDefault();
          setShowKeyboardShortcuts(false);
        } else {
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
        }
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        handleRedo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        handleRedo();
      } else if (!isInputField && event.key.toLowerCase() === 'v') {
        // Selection tool shortcut
        event.preventDefault();
        handleToolChange('selection');
      } else if (!isInputField && event.key.toLowerCase() === 'h') {
        // Hand tool shortcut
        event.preventDefault();
        handleToolChange('hand');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleToolChange, showKeyboardShortcuts]);

  // Track node position changes and save to history when dragging ends
  const nodesMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Clear existing timeout
    if (nodesMoveTimeoutRef.current) {
      clearTimeout(nodesMoveTimeoutRef.current);
    }

    // Set new timeout to save history after nodes settle (500ms after last change)
    nodesMoveTimeoutRef.current = setTimeout(() => {
      // Only save if we have nodes (avoid saving on initial render)
      if (nodes.length > 0 && history.length > 0) {
        // Check if positions actually changed from last history state
        const lastState = history[historyIndex];
        if (lastState) {
          const positionsChanged = nodes.some((node, idx) => {
            const lastNode = lastState.nodes.find(n => n.id === node.id);
            return lastNode && (
              lastNode.position.x !== node.position.x ||
              lastNode.position.y !== node.position.y
            );
          });
          if (positionsChanged) {
            saveToHistory();
          }
        }
      }
    }, 500);

    return () => {
      if (nodesMoveTimeoutRef.current) {
        clearTimeout(nodesMoveTimeoutRef.current);
      }
    };
  }, [nodes]);

  // Setup menu event listeners (only once on mount)
  useEffect(() => {
    const handleSave = async () => {
      setIsLoading(true);
      setLoadingText('Saving diagram...');

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
        // Use currentFilePath if available, otherwise show save dialog
        const result = await window.electron.saveDiagram(
          diagramNameRef.current,
          diagramData,
          currentFilePathRef.current || undefined
        );

        if (result.success) {
          setCurrentFilePath(result.path);
          setHasUnsavedChanges(false);
          showSuccess('Diagram saved successfully!');
        } else if (!result.canceled) {
          showError('Failed to save diagram');
        }
      } catch (error) {
        console.error('Save failed:', error);
        showError('Failed to save diagram');
      } finally {
        setIsLoading(false);
        setLoadingText('');
      }
    };

    const handleLoad = async () => {
      setIsLoading(true);
      setLoadingText('Loading diagram...');

      try {
        const result = await window.electron.loadDiagram();
        if (result.success && result.data) {
          setNodes(result.data.nodes || []);
          setEdges(result.data.edges || []);
          setDiagramName(result.data.metadata?.name || result.filename || 'Untitled');
          setCurrentFilePath(result.filePath);
          setHasUnsavedChanges(false);
          showSuccess('Diagram loaded successfully!');
        }
      } catch (error) {
        console.error('Load failed:', error);
        showError('Failed to load diagram');
      } finally {
        setIsLoading(false);
        setLoadingText('');
      }
    };

    const handleExport = () => {
      if (!reactFlowWrapper.current || !reactFlowInstance) {
        showWarning('Please wait for the diagram to load');
        return;
      }

      const nodesBounds = getNodesBounds(nodesRef.current);
      if (nodesRef.current.length === 0) {
        showWarning('Please add some nodes to export');
        return;
      }

      setIsLoading(true);
      setLoadingText('Exporting diagram...');

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
        showSuccess('Diagram exported as PNG!');
      }).catch((error) => {
        console.error('Export failed:', error);
        showError('Failed to export diagram');
      }).finally(() => {
        setIsLoading(false);
        setLoadingText('');
      });
    };

    const handleClear = () => {
      if (confirm('Are you sure you want to clear the canvas?')) {
        setNodes([]);
        setEdges([]);
        setDiagramName('Untitled');
        setCurrentFilePath(null);
        setHasUnsavedChanges(false);
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
        type: 'custom', // Use custom edge type for arrow support
        label: '',
        style: { stroke: '#ffffff', strokeWidth: 2 },
        animated: false,
        markerStart: undefined, // Will be handled by CustomEdge component
        markerEnd: undefined, // No marker at end (point B)
        data: {
          customColor: '#ffffff',
          routingType: 'bezier',
          markerStart: 'arrow', // Add arrow marker at the start (point A - source)
          markerEnd: 'none', // No arrow at the end (point B)
          color: '#ffffff'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      // Save to history after adding edge
      setTimeout(() => saveToHistory(), 0);
    },
    [setEdges, saveToHistory]
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
    setShowExportMenu(false);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Removed modal - asset editing now done in right side panel
    // Just select the node to open the style panel
    setSelectedNode(node);
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
    // Save to history after deletion
    setTimeout(() => saveToHistory(), 0);
  }, [setNodes, setEdges, saveToHistory]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
    // Save to history after deletion
    setTimeout(() => saveToHistory(), 0);
  }, [setEdges, saveToHistory]);

  const handleDuplicateNode = useCallback((node: Node) => {
    const newNode: Node = {
      ...node,
      id: `node-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      className: 'node-entrance', // Entrance animation
    };
    setNodes((nds: Node[]) => [...nds, newNode]);

    // Remove entrance animation class after animation completes
    setTimeout(() => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === newNode.id ? { ...n, className: '' } : n))
      );
    }, 350); // Match animation duration

    // Save to history after duplication
    setTimeout(() => saveToHistory(), 0);
  }, [setNodes, saveToHistory]);

  const handleConnectToDevice = async (node: Node, connection?: any) => {
    if (!connection) {
      alert('No connection configuration provided');
      return;
    }

    const { type, host, port, username, password, customCommand, privateKeyPath } = connection;

    try {
      // Handle connection types
      if (type === 'rdp') {
        // RDP connection: mstsc /v:host
        const command = `mstsc /v:${host}`;
        await window.electron.executeCommand(command);
        console.log('RDP connection initiated');
      } else if (type === 'ssh') {
        // SSH connection: Use new terminal emulator
        const nodeData = node.data as unknown as EnhancedDeviceData;
        await createConnection({
          nodeName: nodeData.label || 'Unknown',
          nodeType: nodeData.type || 'generic',
          host,
          port: port || 22,
          username,
          password,
          privateKeyPath,
        });
        console.log('SSH connection initiated in terminal emulator');
      } else if (type === 'browser') {
        // Browser connection: start URL (opens in default browser)
        // Wrap URL in quotes to handle special characters like &, ?, #
        const command = `start "" "${host}"`;
        await window.electron.executeCommand(command);
        console.log('Browser opened');
      } else if (type === 'custom') {
        // Custom command: execute whatever user inputted in cmd window
        if (customCommand) {
          // Open cmd with the custom command and keep window open with /k
          const command = `start cmd /k "${customCommand}"`;
          await window.electron.executeCommand(command);
          console.log('Custom command executed in CMD');
        } else {
          alert('No custom command specified');
        }
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
      className: 'node-entrance', // Entrance animation
    };

    setNodes((nds: Node[]) => [...nds, newNode]);

    // Remove entrance animation class after animation completes
    setTimeout(() => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === newNode.id ? { ...n, className: '' } : n))
      );
    }, 350); // Match animation duration

    // Save to history after adding node
    setTimeout(() => saveToHistory(), 0);
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
      className: 'node-entrance', // Entrance animation
    };

    setNodes((nds: Node[]) => [...nds, newNode]);

    // Remove entrance animation class after animation completes
    setTimeout(() => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === newNode.id ? { ...n, className: '' } : n))
      );
    }, 350); // Match animation duration

    // Save to history after adding group
    setTimeout(() => saveToHistory(), 0);
  };

  const addTextNode = () => {
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150
      },
      data: {
        label: 'Text',
        fontSize: 14,
        fontColor: '#000000',
        backgroundColor: 'transparent',
        borderColor: '#000000',
        borderStyle: 'none',
        borderWidth: 1
      },
      className: 'node-entrance', // Entrance animation
    };

    setNodes((nds: Node[]) => [...nds, newNode]);

    // Remove entrance animation class after animation completes
    setTimeout(() => {
      setNodes((nds: Node[]) =>
        nds.map((n) => (n.id === newNode.id ? { ...n, className: '' } : n))
      );
    }, 350); // Match animation duration

    // Save to history after adding text
    setTimeout(() => saveToHistory(), 0);
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
    // Save to history after data update
    setTimeout(() => saveToHistory(), 0);
  };

  const moveNodeToFront = (nodeId: string) => {
    setNodes((nds) => {
      const maxZIndex = Math.max(...nds.map(n => (n.style?.zIndex as number) || 0), 0);
      return nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            style: {
              ...node.style,
              zIndex: maxZIndex + 1
            }
          };
        }
        return node;
      });
    });
  };

  const moveNodeToBack = (nodeId: string) => {
    setNodes((nds) => {
      const minZIndex = Math.min(...nds.map(n => (n.style?.zIndex as number) || 0), 0);
      return nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            style: {
              ...node.style,
              zIndex: minZIndex - 1
            }
          };
        }
        return node;
      });
    });
  };

  const updateEdgeData = (edgeId: string, data: any) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          const updates: any = {
            ...edge
          };

          // Handle native edge properties
          if (data.label !== undefined) updates.label = data.label;
          if (data.animated !== undefined) updates.animated = data.animated;

          // Handle routing type (bezier, smoothstep, straight)
          if (data.routingType !== undefined) {
            // Map routing type to React Flow edge types
            const typeMap: Record<string, string> = {
              'bezier': 'default',
              'smoothstep': 'smoothstep',
              'straight': 'straight'
            };
            updates.type = typeMap[data.routingType] || 'default';
          }

          // Handle style updates (color, strokeWidth, line style)
          const currentStyle = edge.style || {};
          const newStyle: any = { ...currentStyle };

          if (data.color !== undefined) {
            newStyle.stroke = data.color;
          }

          // Handle line style (solid, dashed, dotted)
          if (data.style !== undefined) {
            const dashMap: Record<string, string | undefined> = {
              'solid': undefined,
              'dashed': '5 5',
              'dotted': '1 3'
            };
            newStyle.strokeDasharray = dashMap[data.style];
          }

          updates.style = newStyle;

          // Store additional data
          updates.data = {
            ...edge.data,
            customColor: data.color,
            routingType: data.routingType,
            lineStyle: data.style
          };

          return updates;
        }
        return edge;
      })
    );
    // Save to history after edge data update
    setTimeout(() => saveToHistory(), 0);
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

  // Export functions with proper error handling
  const handleExportPNG = async () => {
    if (!reactFlowInstance) {
      alert('Diagram is still initializing, please wait a moment');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add some nodes to the diagram first');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      // Get viewport element (the actual flow canvas)
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        throw new Error('Canvas viewport not found');
      }

      // Calculate bounds of all nodes
      const nodesBounds = getNodesBounds(nodes);
      const imageWidth = nodesBounds.width + 100;
      const imageHeight = nodesBounds.height + 100;

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2,
        0.1
      );

      // Export only the viewport (canvas area) with proper transform
      const dataUrl = await toPng(viewportElement, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 3, // Higher quality
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `diagram-${diagramName}-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    if (!reactFlowInstance) {
      alert('Diagram is still initializing, please wait a moment');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add some nodes to the diagram first');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        throw new Error('Canvas viewport not found');
      }

      const nodesBounds = getNodesBounds(nodes);
      const imageWidth = nodesBounds.width + 100;
      const imageHeight = nodesBounds.height + 100;

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2,
        0.1
      );

      const dataUrl = await toJpeg(viewportElement, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        quality: 0.95,
        pixelRatio: 3,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `diagram-${diagramName}-${timestamp}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('JPG export failed:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = async () => {
    if (!reactFlowInstance) {
      alert('Diagram is still initializing, please wait a moment');
      return;
    }
    if (nodes.length === 0) {
      alert('Please add some nodes to the diagram first');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        throw new Error('Canvas viewport not found');
      }

      const nodesBounds = getNodesBounds(nodes);
      const imageWidth = nodesBounds.width + 100;
      const imageHeight = nodesBounds.height + 100;

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2,
        0.1
      );

      // Use toSvg for vector export
      const { toSvg } = await import('html-to-image');
      const dataUrl = await toSvg(viewportElement, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `diagram-${diagramName}-${timestamp}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('SVG export failed:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TabBar />

      {/* Design Tab */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: activeTab === 'design' ? 'flex' : 'none',
        flexDirection: 'column'
      }}>
        <ShapeLibrary
          onAddNode={addEnhancedNode}
          onAddGroup={addGroupNode}
          onAddText={addTextNode}
          isOpen={isShapeLibraryOpen}
          onToggle={() => setIsShapeLibraryOpen(!isShapeLibraryOpen)}
        />

        <DesignTab
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
          activeTool={activeTool}
          onTemporaryHandToolStart={handleTemporaryHandToolStart}
          onTemporaryHandToolEnd={handleTemporaryHandToolEnd}
          onDrop={(event) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (type && reactFlowInstance) {
              const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              });

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
                position: position,
                data: {
                  label: typeMap[type] || 'Device',
                  type: type,
                  host: '',
                  port: 22,
                  username: '',
                  password: '',
                  ipAddress: '',
                  description: '',
                  connections: []
                }
              };

              setNodes((nds) => nds.concat(newNode));
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          nodeTypes={nodeTypes}
          reactFlowWrapper={reactFlowWrapper}
        >
          {/* Tool Palette */}
          <ToolPalette
            activeTool={activeTool}
            onToolChange={handleToolChange}
          />
        </DesignTab>

        <StylePanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={updateNodeData}
          onUpdateEdge={updateEdgeData}
          onMoveToFront={moveNodeToFront}
          onMoveToBack={moveNodeToBack}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          isOpen={isStylePanelOpen}
          onToggle={() => setIsStylePanelOpen(!isStylePanelOpen)}
        />

        {/* Top control panel */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          display: 'flex',
          gap: theme.spacing.md,
          alignItems: 'center',
          background: theme.background.elevated,
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.lg,
          border: `1px solid ${theme.border.default}`
        }}>
          {/* Undo/Redo buttons */}
          <button
            onClick={handleUndo}
            disabled={!canUndo || isExporting}
            title="Undo (Ctrl+Z)"
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              background: canUndo && !isExporting ? theme.gradient.button : theme.background.hover,
              color: theme.text.primary,
              border: `1px solid ${canUndo && !isExporting ? theme.accent.blue : theme.border.default}`,
              borderRadius: theme.radius.sm,
              cursor: canUndo && !isExporting ? 'pointer' : 'not-allowed',
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.medium,
              transition: theme.transition.normal,
              opacity: canUndo && !isExporting ? 1 : 0.5
            }}
          >
            ↶ Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo || isExporting}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              background: canRedo && !isExporting ? theme.gradient.button : theme.background.hover,
              color: theme.text.primary,
              border: `1px solid ${canRedo && !isExporting ? theme.accent.blue : theme.border.default}`,
              borderRadius: theme.radius.sm,
              cursor: canRedo && !isExporting ? 'pointer' : 'not-allowed',
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.medium,
              transition: theme.transition.normal,
              opacity: canRedo && !isExporting ? 1 : 0.5
            }}
          >
            ↷ Redo
          </button>

          <div style={{ width: '1px', height: '24px', background: theme.border.default, margin: `0 ${theme.spacing.xs}` }} />

          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || nodes.length === 0}
              title="Export diagram"
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: !isExporting && nodes.length > 0 ? theme.accent.green : theme.background.hover,
                color: theme.text.primary,
                border: `1px solid ${!isExporting && nodes.length > 0 ? theme.accent.green : theme.border.default}`,
                borderRadius: theme.radius.sm,
                cursor: !isExporting && nodes.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: theme.fontSize.md,
                fontWeight: theme.fontWeight.medium,
                transition: theme.transition.normal,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                opacity: !isExporting && nodes.length > 0 ? 1 : 0.5
              }}
            >
              {isExporting ? 'Exporting...' : '📥 Export'} ▾
            </button>

            {showExportMenu && !isExporting && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: theme.spacing.xs,
                background: theme.background.elevated,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.md,
                boxShadow: theme.shadow.lg,
                minWidth: '140px',
                zIndex: theme.zIndex.dropdown
              }}>
                <button
                  onClick={handleExportPNG}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme.background.elevated,
                    border: 'none',
                    borderBottom: `1px solid ${theme.border.subtle}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: theme.fontSize.md,
                    color: theme.text.primary,
                    transition: theme.transition.fast,
                    borderTopLeftRadius: theme.radius.md,
                    borderTopRightRadius: theme.radius.md
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.background.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.background.elevated}
                >
                  Export as PNG
                </button>
                <button
                  onClick={handleExportJPG}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme.background.elevated,
                    border: 'none',
                    borderBottom: `1px solid ${theme.border.subtle}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: theme.fontSize.md,
                    color: theme.text.primary,
                    transition: theme.transition.fast
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.background.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.background.elevated}
                >
                  Export as JPG
                </button>
                <button
                  onClick={handleExportSVG}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: theme.background.elevated,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: theme.fontSize.md,
                    color: theme.text.primary,
                    transition: theme.transition.fast,
                    borderBottomLeftRadius: theme.radius.md,
                    borderBottomRightRadius: theme.radius.md
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.background.hover}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.background.elevated}
                >
                  Export as SVG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom tip panel */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: theme.background.elevated,
          color: theme.text.secondary,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          borderRadius: theme.radius.md,
          fontSize: theme.fontSize.sm,
          boxShadow: theme.shadow.md,
          border: `1px solid ${theme.border.default}`
        }}>
          <strong style={{ color: theme.accent.blue }}>Tip:</strong> Double-click nodes to edit | Right-click to delete/connect | {currentFilePath ? currentFilePath : diagramName}{hasUnsavedChanges ? ' *' : ''}
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            showConnect={!!contextMenu.node && (contextMenu.node.type === 'group' || contextMenu.node.type !== 'group')}
            connections={contextMenu.node ? (contextMenu.node.data as any).connections || [] : []}
            onConnect={contextMenu.node ? (connection) => handleConnectToDevice(contextMenu.node!, connection) : undefined}
            onDuplicate={contextMenu.node ? () => handleDuplicateNode(contextMenu.node!) : undefined}
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
            onConnect={() => {
              const connections = (selectedNode.data as any).connections || [];
              if (connections.length > 0) {
                handleConnectToDevice(selectedNode, connections[0]);
              } else {
                alert('No connections configured for this node');
              }
            }}
          />
        )}

        {/* Arrow markers for edges */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {/* Generate markers for each color used in edges */}
            {Array.from(new Set(edges.map(e => (e.data as any)?.customColor || theme.border.default))).map(color => {
              const colorId = String(color).replace('#', '');
              return (
                <React.Fragment key={colorId}>
                  {/* Arrow (filled triangle) - End */}
                  <marker
                    id={`arrow-end-${colorId}`}
                    markerWidth="4"
                    markerHeight="4"
                    refX="3.6"
                    refY="2"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,0 4,2 0,4"
                      fill={color}
                    />
                  </marker>

                  {/* Arrow (filled triangle) - Start */}
                  <marker
                    id={`arrow-start-${colorId}`}
                    markerWidth="4"
                    markerHeight="4"
                    refX="0.4"
                    refY="2"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="4,0 0,2 4,4"
                      fill={color}
                    />
                  </marker>

                  {/* Arrow Open (hollow triangle) - End */}
                  <marker
                    id={`arrow-open-end-${colorId}`}
                    markerWidth="4"
                    markerHeight="4"
                    refX="3.6"
                    refY="2"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,0 4,2 0,4"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Arrow Open (hollow triangle) - Start */}
                  <marker
                    id={`arrow-open-start-${colorId}`}
                    markerWidth="4"
                    markerHeight="4"
                    refX="0.4"
                    refY="2"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="4,0 0,2 4,4"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Diamond (hollow) - End */}
                  <marker
                    id={`diamond-end-${colorId}`}
                    markerWidth="12"
                    markerHeight="12"
                    refX="11"
                    refY="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,6 6,0 12,6 6,12"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Diamond (hollow) - Start */}
                  <marker
                    id={`diamond-start-${colorId}`}
                    markerWidth="12"
                    markerHeight="12"
                    refX="1"
                    refY="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,6 6,0 12,6 6,12"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Diamond Filled - End */}
                  <marker
                    id={`diamond-filled-end-${colorId}`}
                    markerWidth="12"
                    markerHeight="12"
                    refX="11"
                    refY="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,6 6,0 12,6 6,12"
                      fill={color}
                    />
                  </marker>

                  {/* Diamond Filled - Start */}
                  <marker
                    id={`diamond-filled-start-${colorId}`}
                    markerWidth="12"
                    markerHeight="12"
                    refX="1"
                    refY="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <polygon
                      points="0,6 6,0 12,6 6,12"
                      fill={color}
                    />
                  </marker>

                  {/* Circle (hollow) - End */}
                  <marker
                    id={`circle-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Circle (hollow) - Start */}
                  <marker
                    id={`circle-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="1"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Circle Filled - End */}
                  <marker
                    id={`circle-filled-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill={color}
                    />
                  </marker>

                  {/* Circle Filled - Start */}
                  <marker
                    id={`circle-filled-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="1"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill={color}
                    />
                  </marker>

                  {/* Square (hollow) - End */}
                  <marker
                    id={`square-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="8"
                      height="8"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Square (hollow) - Start */}
                  <marker
                    id={`square-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="1"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="8"
                      height="8"
                      fill="white"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </marker>

                  {/* Square Filled - End */}
                  <marker
                    id={`square-filled-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="8"
                      height="8"
                      fill={color}
                    />
                  </marker>

                  {/* Square Filled - Start */}
                  <marker
                    id={`square-filled-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="1"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="8"
                      height="8"
                      fill={color}
                    />
                  </marker>

                  {/* Cross - End */}
                  <marker
                    id={`cross-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M 2,2 L 8,8 M 8,2 L 2,8"
                      stroke={color}
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </marker>

                  {/* Cross - Start */}
                  <marker
                    id={`cross-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="2"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M 2,2 L 8,8 M 8,2 L 2,8"
                      stroke={color}
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </marker>

                  {/* Bar (perpendicular line) - End */}
                  <marker
                    id={`bar-end-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <line
                      x1="5"
                      y1="0"
                      x2="5"
                      y2="10"
                      stroke={color}
                      strokeWidth="2"
                    />
                  </marker>

                  {/* Bar (perpendicular line) - Start */}
                  <marker
                    id={`bar-start-${colorId}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="2"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <line
                      x1="5"
                      y1="0"
                      x2="5"
                      y2="10"
                      stroke={color}
                      strokeWidth="2"
                    />
                  </marker>
                </React.Fragment>
              );
            })}

            {/* Red markers for hover/selected states */}
            <React.Fragment key="red-hover">
              {/* Arrow (filled triangle) - End - Red */}
              <marker
                id="arrow-end-ff5c5c"
                markerWidth="4"
                markerHeight="4"
                refX="3.6"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0,0 4,2 0,4"
                  fill="#ff5c5c"
                />
              </marker>

              {/* Arrow (filled triangle) - Start - Red */}
              <marker
                id="arrow-start-ff5c5c"
                markerWidth="4"
                markerHeight="4"
                refX="0.4"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="4,0 0,2 4,4"
                  fill="#ff5c5c"
                />
              </marker>
            </React.Fragment>
          </defs>
        </svg>
      </div>

      {/* Connections Tab */}
      <div style={{
        flex: 1,
        display: activeTab === 'connections' ? 'flex' : 'none',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <ConnectionsTab />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner
          overlay
          size="lg"
          text={loadingText}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

// Wrap AppContent with TabProvider
const App: React.FC = () => {
  return (
    <TabProvider>
      <AppContent />
    </TabProvider>
  );
};

export default App;
