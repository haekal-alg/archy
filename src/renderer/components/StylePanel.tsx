import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { EnhancedDeviceData, ConnectionConfig } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { CustomEdgeData } from './CustomEdge';
import { TextNodeData } from './TextNode';
import theme from '../../theme';

interface StylePanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData | TextNodeData>) => void;
  onUpdateEdge: (edgeId: string, data: Partial<CustomEdgeData>) => void;
  onMoveToFront?: (nodeId: string) => void;
  onMoveToBack?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const StylePanel: React.FC<StylePanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onMoveToFront,
  onMoveToBack,
  onDeleteNode,
  onDeleteEdge,
  isOpen,
  onToggle
}) => {
  // Helper function to convert hex + opacity to rgba
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  // Base input style for connection form inputs
  const connectionInputStyle = {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.border.default}`,
    borderRadius: theme.radius.sm,
    background: theme.background.elevated,
    color: theme.text.primary,
    fontSize: theme.fontSize.sm,
    boxSizing: 'border-box' as const,
    pointerEvents: 'auto' as const,
    userSelect: 'text' as const,
    WebkitUserSelect: 'text' as const,
    cursor: 'text' as const,
    outline: 'none' as const
  };

  const [activeTab, setActiveTab] = useState<'connection' | 'property'>('connection');
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#1976d2');
  const [nodeBgColor, setNodeBgColor] = useState('#ffb3ba40');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeOS, setNodeOS] = useState('');
  const [nodeHost, setNodeHost] = useState('');
  const [nodePort, setNodePort] = useState(22);
  const [nodeUsername, setNodeUsername] = useState('');
  const [nodePassword, setNodePassword] = useState('');
  const [nodeType, setNodeType] = useState<'rdp' | 'ssh' | 'browser' | 'custom'>('ssh');
  const [nodeCustomCommand, setNodeCustomCommand] = useState('');
  const [textFontSize, setTextFontSize] = useState(14);
  const [textFontColor, setTextFontColor] = useState('#000000');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textBorderColor, setTextBorderColor] = useState('#000000');
  const [textBorderStyle, setTextBorderStyle] = useState<'solid' | 'dashed' | 'dotted' | 'none'>('none');
  const [textBorderWidth, setTextBorderWidth] = useState(1);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeColor, setEdgeColor] = useState('#000000');
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [edgeRouting, setEdgeRouting] = useState<'bezier' | 'smoothstep' | 'straight'>('bezier');
  const [edgeAnimated, setEdgeAnimated] = useState(false);

  // Background opacity and transparency controls
  const [textBgOpacity, setTextBgOpacity] = useState(100);
  const [textBgTransparent, setTextBgTransparent] = useState(false);
  const [nodeBgOpacity, setNodeBgOpacity] = useState(100);
  const [nodeBgTransparent, setNodeBgTransparent] = useState(false);

  // Multiple connections support
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      // Set default tab to 'connection' for device/group nodes
      if (selectedNode.type !== 'text') {
        setActiveTab('connection');
      }

      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData | TextNodeData;
      setNodeLabel(data.label || '');

      if (selectedNode.type === 'text') {
        const textData = data as TextNodeData;
        setTextFontSize(textData.fontSize || 14);
        setTextFontColor(textData.fontColor || '#000000');

        // Parse background color for opacity and transparency
        const bgColor = textData.backgroundColor || 'transparent';
        if (bgColor === 'transparent') {
          setTextBgColor('#ffffff');
          setTextBgTransparent(true);
          setTextBgOpacity(100);
        } else if (bgColor.startsWith('rgba')) {
          // Parse rgba format
          const match = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            setTextBgColor(`#${r}${g}${b}`);
            setTextBgOpacity(Math.round(parseFloat(match[4]) * 100));
            setTextBgTransparent(false);
          }
        } else {
          setTextBgColor(bgColor);
          setTextBgOpacity(100);
          setTextBgTransparent(false);
        }

        setTextBorderColor(textData.borderColor || '#000000');
        setTextBorderStyle(textData.borderStyle || 'none');
        setTextBorderWidth(textData.borderWidth || 1);
      } else if (selectedNode.type === 'group') {
        // Group/Network Zone specific
        const groupData = data as GroupNodeData;
        setNodeColor(groupData.borderColor || '#ff6b6b');

        // Parse background color for opacity and transparency
        const bgColor = groupData.backgroundColor || '#ffb3ba40';
        if (bgColor === 'transparent') {
          setNodeBgColor('#ffb3ba');
          setNodeBgTransparent(true);
          setNodeBgOpacity(100);
        } else if (bgColor.startsWith('rgba')) {
          // Parse rgba format
          const match = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            setNodeBgColor(`#${r}${g}${b}`);
            setNodeBgOpacity(Math.round(parseFloat(match[4]) * 100));
            setNodeBgTransparent(false);
          }
        } else if (bgColor.startsWith('#') && bgColor.length === 9) {
          // Parse hex with alpha channel (e.g., #ffb3ba40)
          setNodeBgColor(bgColor.substring(0, 7));
          const alpha = parseInt(bgColor.substring(7, 9), 16);
          setNodeBgOpacity(Math.round((alpha / 255) * 100));
          setNodeBgTransparent(false);
        } else {
          setNodeBgColor(bgColor);
          setNodeBgOpacity(100);
          setNodeBgTransparent(false);
        }

        setNodeDescription(groupData.description || '');

        // Load connections array or migrate from old format
        if ((groupData as any).connections) {
          setConnections((groupData as any).connections);
        } else {
          // Migrate from old single-connection format
          const legacyConnection = migrateOldConnectionFormat(groupData as any);
          setConnections(legacyConnection ? [legacyConnection] : []);
        }

        // Reset connection form state
        setShowConnectionForm(false);
        setEditingConnectionId(null);
        setNodeType('ssh');
        setNodeHost('');
        setNodePort(22);
        setNodeUsername('');
        setNodePassword('');
        setNodeCustomCommand('');
        setHasUnsavedChanges(false);
      } else {
        // Enhanced device node
        setNodeColor((data as any).color || '#1976d2');
        setNodeDescription((data as any).description || '');
        setNodeOS((data as EnhancedDeviceData).operatingSystem || '');

        // Load connections array or migrate from old format
        if ((data as any).connections) {
          setConnections((data as any).connections);
        } else {
          // Migrate from old single-connection format
          const legacyConnection = migrateOldConnectionFormat(data as any);
          setConnections(legacyConnection ? [legacyConnection] : []);
        }

        // Reset connection form state
        setShowConnectionForm(false);
        setEditingConnectionId(null);
        setNodeType('ssh');
        setNodeHost('');
        setNodePort(22);
        setNodeUsername('');
        setNodePassword('');
        setNodeCustomCommand('');
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedNode]);

  // Helper function to migrate old single-connection format to new array format
  const migrateOldConnectionFormat = (data: any): ConnectionConfig | null => {
    const connectionType = data.connectionType;
    const host = data.host;

    if (!host && !data.customCommand) {
      return null;
    }

    return {
      id: `conn-${Date.now()}`,
      type: connectionType || 'ssh',
      host: host,
      port: data.port || 22,
      username: data.username || '',
      password: data.password || '',
      customCommand: data.customCommand || ''
    };
  };

  useEffect(() => {
    if (selectedEdge) {
      const data = (selectedEdge.data as unknown as CustomEdgeData) || {};
      setEdgeLabel(data.label || '');
      setEdgeColor(data.color || '#000000');
      setEdgeStyle(data.style || 'solid');
      setEdgeRouting(data.routingType || 'bezier');
      setEdgeAnimated(data.animated || false);
    }
  }, [selectedEdge]);

  const handleNodeUpdate = () => {
    if (selectedNode) {
      const updates: any = {
        label: nodeLabel
      };

      if (selectedNode.type === 'text') {
        updates.fontSize = textFontSize;
        updates.fontColor = textFontColor;
        // Set background color based on transparent flag and opacity
        updates.backgroundColor = textBgTransparent
          ? 'transparent'
          : hexToRgba(textBgColor, textBgOpacity);
        updates.borderColor = textBorderColor;
        updates.borderStyle = textBorderStyle;
        updates.borderWidth = textBorderWidth;
      } else if (selectedNode.type === 'group') {
        updates.borderColor = nodeColor;
        // Set background color based on transparent flag and opacity
        updates.backgroundColor = nodeBgTransparent
          ? 'transparent'
          : hexToRgba(nodeBgColor, nodeBgOpacity);
        updates.description = nodeDescription;
        updates.connections = connections;
      } else {
        updates.color = nodeColor;
        updates.operatingSystem = nodeOS;
        updates.description = nodeDescription;
        updates.connections = connections;
      }

      onUpdateNode(selectedNode.id, updates);
    }
  };

  const handleEdgeUpdate = () => {
    if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, {
        label: edgeLabel,
        color: edgeColor,
        style: edgeStyle,
        routingType: edgeRouting,
        animated: edgeAnimated
      });
    }
  };

  // Connection management functions
  const handleAddConnection = () => {
    setShowConnectionForm(true);
    setEditingConnectionId(null);
    setNodeType('ssh');
    setNodeHost('');
    setNodePort(22);
    setNodeUsername('');
    setNodePassword('');
    setNodeCustomCommand('');
  };

  const handleEditConnection = (connection: ConnectionConfig) => {
    setEditingConnectionId(connection.id);
    setShowConnectionForm(true);
    setNodeType(connection.type);
    setNodeHost(connection.host || '');
    setNodePort(connection.port || 22);
    setNodeUsername(connection.username || '');
    setNodePassword(connection.password || '');
    setNodeCustomCommand(connection.customCommand || '');
  };

  const handleSaveConnection = () => {
    const newConnection: ConnectionConfig = {
      id: editingConnectionId || `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      host: nodeHost,
      port: nodePort,
      username: nodeUsername,
      password: nodePassword,
      customCommand: nodeCustomCommand
    };

    if (editingConnectionId) {
      // Update existing connection
      setConnections(connections.map(conn =>
        conn.id === editingConnectionId ? newConnection : conn
      ));
    } else {
      // Add new connection
      setConnections([...connections, newConnection]);
    }

    // Reset form
    setShowConnectionForm(false);
    setEditingConnectionId(null);
    setNodeType('ssh');
    setNodeHost('');
    setNodePort(22);
    setNodeUsername('');
    setNodePassword('');
    setNodeCustomCommand('');

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      setConnections(connections.filter(conn => conn.id !== connectionId));
      setHasUnsavedChanges(true);
    }
  };

  const handleCancelConnectionForm = () => {
    setShowConnectionForm(false);
    setEditingConnectionId(null);
    setNodeType('ssh');
    setNodeHost('');
    setNodePort(22);
    setNodeUsername('');
    setNodePassword('');
    setNodeCustomCommand('');
  };

  const handleSaveAllChanges = () => {
    handleNodeUpdate();
    setHasUnsavedChanges(false);
  };

  const getConnectionDisplayText = (connection: ConnectionConfig): string => {
    switch (connection.type) {
      case 'rdp':
        return connection.host || 'No host';
      case 'ssh':
        return `${connection.username || 'user'}@${connection.host || 'host'}:${connection.port || 22}`;
      case 'browser':
        return connection.host || 'No URL';
      case 'custom':
        return connection.customCommand || 'No command';
      default:
        return 'Unknown';
    }
  };

  const getConnectionTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'rdp': return theme.accent.blue;
      case 'ssh': return theme.accent.orange;
      case 'browser': return theme.accent.blueLight;
      case 'custom': return theme.accent.purple;
      default: return theme.text.tertiary;
    }
  };

  const presetColors = [
    { name: 'Blue', value: theme.swatches.blue },
    { name: 'Green', value: theme.swatches.green },
    { name: 'Red', value: theme.swatches.red },
    { name: 'Orange', value: theme.swatches.orange },
    { name: 'Purple', value: theme.swatches.purple },
    { name: 'Pink', value: theme.swatches.pink },
    { name: 'Teal', value: theme.swatches.teal },
    { name: 'Gray', value: theme.swatches.gray }
  ];

  return (
    <div
      onMouseDown={(e) => {
        // Stop propagation to ReactFlow only when panel is open
        if (isOpen) {
          e.stopPropagation();
        }
      }}
      style={{
        position: 'fixed',
        right: isOpen ? '0' : '-320px',
        top: '0',
        width: '320px',
        height: '100vh',
        background: theme.background.secondary,
        boxShadow: theme.shadow.lg,
        transition: theme.transition.slow,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        color: theme.text.primary,
        overflowY: 'auto',
        borderLeft: `1px solid ${theme.border.default}`,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* Header */}
      <div style={{
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        borderBottom: `1px solid ${theme.border.default}`,
        background: theme.background.primary,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h3 style={{
          margin: 0,
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.semibold,
          color: theme.text.primary
        }}>
          Properties
        </h3>
      </div>

      {/* Tabs for non-text nodes (not for edges or text nodes) */}
      {selectedNode && selectedNode.type !== 'text' && (
        <div style={{
          display: 'flex',
          borderBottom: `2px solid ${theme.border.default}`,
          background: theme.background.primary,
          position: 'sticky',
          top: '49px',
          zIndex: 10
        }}>
          <button
            onClick={() => setActiveTab('connection')}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: 'none',
              background: activeTab === 'connection' ? theme.background.secondary : 'transparent',
              color: activeTab === 'connection' ? theme.accent.blue : theme.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              fontWeight: activeTab === 'connection' ? theme.fontWeight.semibold : theme.fontWeight.medium,
              borderBottom: activeTab === 'connection' ? `3px solid ${theme.accent.blue}` : '3px solid transparent',
              transition: theme.transition.normal,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'connection') {
                e.currentTarget.style.background = theme.background.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'connection') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Connection
          </button>
          <button
            onClick={() => setActiveTab('property')}
            style={{
              flex: 1,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              border: 'none',
              background: activeTab === 'property' ? theme.background.secondary : 'transparent',
              color: activeTab === 'property' ? theme.accent.blue : theme.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              fontWeight: activeTab === 'property' ? theme.fontWeight.semibold : theme.fontWeight.medium,
              borderBottom: activeTab === 'property' ? `3px solid ${theme.accent.blue}` : '3px solid transparent',
              transition: theme.transition.normal,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'property') {
                e.currentTarget.style.background = theme.background.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'property') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Property
          </button>
        </div>
      )}

      {/* Node Styling */}
      {selectedNode && (
        <div style={{ padding: theme.spacing.xl }}>
          {/* Text Node - No tabs, just style content */}
          {selectedNode.type === 'text' && (
            <>
              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.text.secondary
                }}>
                  Text
                </label>
                <input
                  type="text"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  onBlur={handleNodeUpdate}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    background: theme.background.tertiary,
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.text.secondary
                }}>
                  Font Size
                </label>
                <input
                  type="number"
                  value={textFontSize}
                  onChange={(e) => setTextFontSize(parseInt(e.target.value) || 14)}
                  onBlur={handleNodeUpdate}
                  min="8"
                  max="72"
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    background: theme.background.tertiary,
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.text.secondary
                }}>
                  Font Color
                </label>
                <input
                  type="color"
                  value={textFontColor}
                  onChange={(e) => setTextFontColor(e.target.value)}
                  onBlur={handleNodeUpdate}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    cursor: 'pointer',
                    background: theme.background.tertiary
                  }}
                />
              </div>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.text.secondary
                }}>
                  Background Color
                </label>
                <input
                  type="color"
                  value={textBgColor}
                  onChange={(e) => setTextBgColor(e.target.value)}
                  onBlur={handleNodeUpdate}
                  disabled={textBgTransparent}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    cursor: textBgTransparent ? 'not-allowed' : 'pointer',
                    background: theme.background.tertiary,
                    opacity: textBgTransparent ? 0.5 : 1
                  }}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.md,
                  fontSize: theme.fontSize.sm,
                  color: theme.text.secondary,
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={textBgTransparent}
                    onChange={(e) => {
                      setTextBgTransparent(e.target.checked);
                      setTimeout(handleNodeUpdate, 0);
                    }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Transparent Background
                </label>

                {/* Opacity Slider */}
                <div style={{ marginTop: theme.spacing.md }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: textBgTransparent ? theme.text.tertiary : theme.text.secondary
                  }}>
                    Opacity: {textBgOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textBgOpacity}
                    onChange={(e) => setTextBgOpacity(parseInt(e.target.value))}
                    onMouseUp={handleNodeUpdate}
                    disabled={textBgTransparent}
                    style={{
                      width: '100%',
                      cursor: textBgTransparent ? 'not-allowed' : 'pointer',
                      opacity: textBgTransparent ? 0.5 : 1
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: theme.spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.text.secondary
                }}>
                  Border Style
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.sm }}>
                  {(['none', 'solid', 'dashed', 'dotted'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setTextBorderStyle(style);
                        setTimeout(handleNodeUpdate, 0);
                      }}
                      style={{
                        padding: theme.spacing.sm,
                        border: textBorderStyle === style ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        background: textBorderStyle === style ? theme.background.active : theme.background.tertiary,
                        color: theme.text.primary,
                        cursor: 'pointer',
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.medium,
                        textTransform: 'capitalize'
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {textBorderStyle !== 'none' && (
                <>
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: theme.text.secondary
                    }}>
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={textBorderColor}
                      onChange={(e) => setTextBorderColor(e.target.value)}
                      onBlur={handleNodeUpdate}
                      style={{
                        width: '100%',
                        height: '32px',
                        border: `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        cursor: 'pointer',
                        background: theme.background.tertiary
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: theme.text.secondary
                    }}>
                      Border Width
                    </label>
                    <input
                      type="number"
                      value={textBorderWidth}
                      onChange={(e) => setTextBorderWidth(parseInt(e.target.value) || 1)}
                      onBlur={handleNodeUpdate}
                      min="1"
                      max="10"
                      style={{
                        width: '100%',
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        background: theme.background.tertiary,
                        color: theme.text.primary,
                        fontSize: theme.fontSize.sm,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Non-text nodes with tabs */}
          {selectedNode.type !== 'text' && (
            <>
              {/* CONNECTION TAB */}
              {activeTab === 'connection' && (
                <>
                  {/* Connections List - Always visible */}
                  {connections.length > 0 && (
                    <div style={{ marginBottom: theme.spacing.xl }}>
                      <label style={{
                        display: 'block',
                        fontSize: theme.fontSize.sm,
                        marginBottom: theme.spacing.md,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.text.secondary
                      }}>
                        Configured Connections
                      </label>
                          {connections.map((connection) => (
                            <div
                              key={connection.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: theme.spacing.md,
                                padding: theme.spacing.md,
                                marginBottom: theme.spacing.md,
                                background: theme.background.tertiary,
                                border: `1px solid ${theme.border.default}`,
                                borderRadius: theme.radius.sm,
                                fontSize: theme.fontSize.sm
                              }}
                            >
                              {/* Connection Type Badge */}
                              <span style={{
                                padding: `2px ${theme.spacing.sm}`,
                                borderRadius: theme.radius.xs,
                                background: getConnectionTypeBadgeColor(connection.type),
                                color: theme.text.inverted,
                                fontSize: theme.fontSize.xs,
                                fontWeight: theme.fontWeight.semibold,
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                              }}>
                                {connection.type}
                              </span>

                              {/* Connection Info */}
                              <div style={{
                                flex: 1,
                                fontFamily: 'monospace',
                                fontSize: theme.fontSize.xs,
                                color: theme.text.primary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {getConnectionDisplayText(connection)}
                              </div>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditConnection(connection)}
                                style={{
                                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                                  border: `1px solid ${theme.border.default}`,
                                  borderRadius: theme.radius.xs,
                                  background: theme.background.tertiary,
                                  color: theme.text.primary,
                                  cursor: 'pointer',
                                  fontSize: theme.fontSize.xs,
                                  fontWeight: theme.fontWeight.medium,
                                  transition: theme.transition.normal
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = theme.background.hover;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = theme.background.tertiary;
                                }}
                              >
                                Edit
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteConnection(connection.id)}
                                style={{
                                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                                  border: `1px solid ${theme.accent.red}`,
                                  borderRadius: theme.radius.xs,
                                  background: theme.background.tertiary,
                                  color: theme.accent.red,
                                  cursor: 'pointer',
                                  fontSize: theme.fontSize.xs,
                                  fontWeight: theme.fontWeight.medium,
                                  transition: theme.transition.normal
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = theme.accent.red;
                                  e.currentTarget.style.color = theme.text.inverted;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = theme.background.tertiary;
                                  e.currentTarget.style.color = theme.accent.red;
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                  {/* No connections message */}
                  {connections.length === 0 && (
                    <div style={{
                      padding: theme.spacing.xxl,
                      textAlign: 'center',
                      background: theme.background.tertiary,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      marginBottom: theme.spacing.xl
                    }}>
                      <div style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>🔌</div>
                      <div style={{ fontSize: theme.fontSize.sm, color: theme.text.secondary, marginBottom: theme.spacing.xs }}>
                        No connections configured
                      </div>
                      <div style={{ fontSize: theme.fontSize.xs, color: theme.text.tertiary }}>
                        Add a connection to enable remote access
                      </div>
                    </div>
                  )}

                  {/* Add Connection Button */}
                  <button
                    onClick={handleAddConnection}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.accent.blue}`,
                      borderRadius: theme.radius.sm,
                      background: theme.accent.blue,
                      color: theme.text.inverted,
                      cursor: 'pointer',
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                      transition: theme.transition.normal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.xl
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.accent.blueDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.accent.blue;
                    }}
                  >
                    <span style={{ fontSize: theme.fontSize.base }}>+</span>
                    <span>Add Connection</span>
                  </button>

                  {/* Show connection form when adding/editing */}
                  {showConnectionForm && (
                    <>
                      <div
                        style={{
                          marginBottom: theme.spacing.xl,
                          padding: theme.spacing.lg,
                          background: theme.background.tertiary,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: theme.radius.sm,
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 100
                        }}
                      >
                        <div style={{
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.fontWeight.semibold,
                          marginBottom: theme.spacing.lg,
                          color: theme.text.primary
                        }}>
                          {editingConnectionId ? 'Edit Connection' : 'New Connection'}
                        </div>

                        <div style={{ marginBottom: theme.spacing.lg }}>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.sm,
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Connection Type
                          </label>
                          <select
                            value={nodeType}
                            onChange={(e) => {
                              setNodeType(e.target.value as 'rdp' | 'ssh' | 'browser' | 'custom');
                              if (e.target.value !== 'custom') {
                                setNodeCustomCommand('');
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            tabIndex={0}
                            style={{
                              width: '100%',
                              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              background: theme.background.elevated,
                              color: theme.text.primary,
                              fontSize: theme.fontSize.sm,
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              pointerEvents: 'auto'
                            }}
                          >
                            <option value="rdp">RDP</option>
                            <option value="ssh">SSH</option>
                            <option value="browser">Browser</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {/* RDP Settings */}
                        {nodeType === 'rdp' && (
                          <>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Host
                              </label>
                              <input
                                type="text"
                                value={nodeHost}
                                onChange={(e) => setNodeHost(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="192.168.1.1"
                                autoComplete="off"
                                tabIndex={0}
                                style={{
                                  ...connectionInputStyle,
                                  fontFamily: 'monospace'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Username (Optional)
                              </label>
                              <input
                                type="text"
                                value={nodeUsername}
                                onChange={(e) => setNodeUsername(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="administrator"
                                autoComplete="off"
                                tabIndex={0}
                                style={connectionInputStyle}
                              />
                            </div>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Password (Optional)
                              </label>
                              <input
                                type="password"
                                value={nodePassword}
                                onChange={(e) => setNodePassword(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="••••••••"
                                autoComplete="off"
                                tabIndex={0}
                                style={connectionInputStyle}
                              />
                            </div>
                          </>
                        )}

                        {/* SSH Settings */}
                        {nodeType === 'ssh' && (
                          <>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Host
                              </label>
                              <input
                                type="text"
                                value={nodeHost}
                                onChange={(e) => setNodeHost(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="192.168.1.1"
                                autoComplete="off"
                                tabIndex={0}
                                style={{
                                  ...connectionInputStyle,
                                  fontFamily: 'monospace'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Port
                              </label>
                              <input
                                type="number"
                                value={nodePort}
                                onChange={(e) => setNodePort(parseInt(e.target.value) || 22)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="22"
                                autoComplete="off"
                                tabIndex={0}
                                style={{
                                  ...connectionInputStyle,
                                  fontFamily: 'monospace'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Username
                              </label>
                              <input
                                type="text"
                                value={nodeUsername}
                                onChange={(e) => setNodeUsername(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="root"
                                autoComplete="off"
                                tabIndex={0}
                                style={connectionInputStyle}
                              />
                            </div>
                            <div style={{ marginBottom: theme.spacing.lg }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                marginBottom: theme.spacing.xs,
                                fontWeight: theme.fontWeight.medium,
                                color: theme.text.secondary
                              }}>
                                Password
                              </label>
                              <input
                                type="password"
                                value={nodePassword}
                                onChange={(e) => setNodePassword(e.target.value)}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.focus();
                                }}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder="••••••••"
                                autoComplete="off"
                                tabIndex={0}
                                style={connectionInputStyle}
                              />
                            </div>
                          </>
                        )}

                        {/* Browser Settings */}
                        {nodeType === 'browser' && (
                          <div style={{ marginBottom: theme.spacing.lg }}>
                            <label style={{
                              display: 'block',
                              fontSize: theme.fontSize.sm,
                              marginBottom: theme.spacing.xs,
                              fontWeight: theme.fontWeight.medium,
                              color: theme.text.secondary
                            }}>
                              URL
                            </label>
                            <input
                              type="text"
                              value={nodeHost}
                              onChange={(e) => setNodeHost(e.target.value)}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.currentTarget.focus();
                              }}
                              onFocus={(e) => e.stopPropagation()}
                              placeholder="https://example.com"
                              autoComplete="off"
                              tabIndex={0}
                              style={{
                                ...connectionInputStyle,
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        )}

                        {/* Custom Command */}
                        {nodeType === 'custom' && (
                          <div style={{ marginBottom: theme.spacing.lg }}>
                            <label style={{
                              display: 'block',
                              fontSize: theme.fontSize.sm,
                              marginBottom: theme.spacing.xs,
                              fontWeight: theme.fontWeight.medium,
                              color: theme.text.secondary
                            }}>
                              Custom Command
                            </label>
                            <input
                              type="text"
                              value={nodeCustomCommand}
                              onChange={(e) => setNodeCustomCommand(e.target.value)}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.currentTarget.focus();
                              }}
                              onFocus={(e) => e.stopPropagation()}
                              placeholder="ping 8.8.8.8"
                              title="Enter command to execute in CMD (e.g., ping 8.8.8.8)"
                              autoComplete="off"
                              tabIndex={0}
                              style={{
                                ...connectionInputStyle,
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
                          <button
                            onClick={handleSaveConnection}
                            style={{
                              flex: 1,
                              padding: theme.spacing.md,
                              border: `1px solid ${theme.accent.green}`,
                              borderRadius: theme.radius.sm,
                              background: theme.accent.green,
                              color: theme.text.inverted,
                              cursor: 'pointer',
                              fontSize: theme.fontSize.sm,
                              fontWeight: theme.fontWeight.semibold,
                              transition: theme.transition.normal
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.accent.greenDark;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.accent.green;
                            }}
                          >
                            {editingConnectionId ? 'Update' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelConnectionForm}
                            style={{
                              flex: 1,
                              padding: theme.spacing.md,
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              background: theme.background.elevated,
                              color: theme.text.primary,
                              cursor: 'pointer',
                              fontSize: theme.fontSize.sm,
                              fontWeight: theme.fontWeight.semibold,
                              transition: theme.transition.normal
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.background.hover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.background.elevated;
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Save All Changes Button */}
                  <button
                    onClick={handleSaveAllChanges}
                    style={{
                      width: '100%',
                      padding: theme.spacing.lg,
                      border: hasUnsavedChanges ? `2px solid ${theme.accent.green}` : `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: hasUnsavedChanges ? theme.accent.green : theme.background.tertiary,
                      color: hasUnsavedChanges ? theme.text.inverted : theme.text.secondary,
                      cursor: 'pointer',
                      fontSize: theme.fontSize.md,
                      fontWeight: theme.fontWeight.semibold,
                      transition: theme.transition.normal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: theme.spacing.md,
                      marginTop: theme.spacing.xl
                    }}
                    onMouseEnter={(e) => {
                      if (hasUnsavedChanges) {
                        e.currentTarget.style.background = theme.accent.greenDark;
                      } else {
                        e.currentTarget.style.background = theme.background.hover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasUnsavedChanges) {
                        e.currentTarget.style.background = theme.accent.green;
                      } else {
                        e.currentTarget.style.background = theme.background.tertiary;
                      }
                    }}
                  >
                    <span style={{ fontSize: theme.fontSize.lg }}>💾</span>
                    <span>Save All Changes</span>
                    {hasUnsavedChanges && (
                      <span style={{
                        fontSize: theme.fontSize.xs,
                        padding: `2px ${theme.spacing.sm}`,
                        background: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: theme.radius.full,
                        fontWeight: theme.fontWeight.medium
                      }}>
                        •
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* PROPERTY TAB */}
              {activeTab === 'property' && (
                <>
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: theme.text.secondary
                    }}>
                      Label
                    </label>
                    <input
                      type="text"
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onBlur={handleNodeUpdate}
                      style={{
                        width: '100%',
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        background: theme.background.tertiary,
                        color: theme.text.primary,
                        fontSize: theme.fontSize.sm,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Operating System - only for enhanced nodes */}
                  {selectedNode.type !== 'group' && (
                    <div style={{ marginBottom: theme.spacing.lg }}>
                      <label style={{
                        display: 'block',
                        fontSize: theme.fontSize.sm,
                        marginBottom: theme.spacing.xs,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.text.secondary
                      }}>
                        Operating System
                      </label>
                      <input
                        type="text"
                        value={nodeOS}
                        onChange={(e) => setNodeOS(e.target.value)}
                        onBlur={handleNodeUpdate}
                        style={{
                          width: '100%',
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: theme.radius.sm,
                          background: theme.background.tertiary,
                          color: theme.text.primary,
                          fontSize: theme.fontSize.sm,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Color Section */}
                  {selectedNode.type === 'group' ? (
                    <>
                      {/* Group nodes: Border and Background colors */}
                      <div style={{ marginBottom: theme.spacing.lg }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.fontWeight.medium,
                          color: theme.text.secondary
                        }}>
                          Border Color
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: theme.spacing.sm,
                          marginBottom: theme.spacing.sm
                        }}>
                          {presetColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => {
                                setNodeColor(color.value);
                                setTimeout(handleNodeUpdate, 0);
                              }}
                              style={{
                                width: '100%',
                                height: '32px',
                                border: nodeColor === color.value ? `2px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                                borderRadius: theme.radius.sm,
                                background: color.value,
                                cursor: 'pointer',
                                transition: theme.transition.normal
                              }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={nodeColor}
                          onChange={(e) => setNodeColor(e.target.value)}
                          onBlur={handleNodeUpdate}
                          style={{
                            width: '100%',
                            height: '32px',
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: theme.radius.sm,
                            cursor: 'pointer',
                            background: theme.background.tertiary
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: theme.spacing.lg }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.fontWeight.medium,
                          color: theme.text.secondary
                        }}>
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={nodeBgColor}
                          onChange={(e) => setNodeBgColor(e.target.value)}
                          onBlur={handleNodeUpdate}
                          disabled={nodeBgTransparent}
                          style={{
                            width: '100%',
                            height: '32px',
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: theme.radius.sm,
                            cursor: nodeBgTransparent ? 'not-allowed' : 'pointer',
                            background: theme.background.tertiary,
                            opacity: nodeBgTransparent ? 0.5 : 1
                          }}
                        />
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          marginTop: theme.spacing.md,
                          fontSize: theme.fontSize.sm,
                          color: theme.text.secondary,
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={nodeBgTransparent}
                            onChange={(e) => {
                              setNodeBgTransparent(e.target.checked);
                              setTimeout(handleNodeUpdate, 0);
                            }}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Transparent Background
                        </label>

                        {/* Opacity Slider */}
                        <div style={{ marginTop: theme.spacing.md }}>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.sm,
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.fontWeight.medium,
                            color: nodeBgTransparent ? theme.text.tertiary : theme.text.secondary
                          }}>
                            Opacity: {nodeBgOpacity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={nodeBgOpacity}
                            onChange={(e) => setNodeBgOpacity(parseInt(e.target.value))}
                            onMouseUp={handleNodeUpdate}
                            disabled={nodeBgTransparent}
                            style={{
                              width: '100%',
                              cursor: nodeBgTransparent ? 'not-allowed' : 'pointer',
                              opacity: nodeBgTransparent ? 0.5 : 1
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Enhanced nodes: Single color picker */}
                      <div style={{ marginBottom: theme.spacing.lg }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.fontWeight.medium,
                          color: theme.text.secondary
                        }}>
                          Color
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: theme.spacing.sm,
                          marginBottom: theme.spacing.sm
                        }}>
                          {presetColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => {
                                setNodeColor(color.value);
                                setTimeout(handleNodeUpdate, 0);
                              }}
                              style={{
                                width: '100%',
                                height: '32px',
                                border: nodeColor === color.value ? `2px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                                borderRadius: theme.radius.sm,
                                background: color.value,
                                cursor: 'pointer',
                                transition: theme.transition.normal
                              }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={nodeColor}
                          onChange={(e) => setNodeColor(e.target.value)}
                          onBlur={handleNodeUpdate}
                          style={{
                            width: '100%',
                            height: '32px',
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: theme.radius.sm,
                            cursor: 'pointer',
                            background: theme.background.tertiary
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: theme.text.secondary
                    }}>
                      Description
                    </label>
                    <textarea
                      value={nodeDescription}
                      onChange={(e) => setNodeDescription(e.target.value)}
                      onBlur={handleNodeUpdate}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        background: theme.background.tertiary,
                        color: theme.text.primary,
                        fontSize: theme.fontSize.sm,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Layer Order Controls - Only in Style Tab */}
                  {onMoveToFront && onMoveToBack && (
                    <div style={{
                      marginTop: theme.spacing.xl,
                      paddingTop: theme.spacing.xl,
                      borderTop: `1px solid ${theme.border.default}`
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: theme.fontSize.sm,
                        marginBottom: theme.spacing.md,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.text.secondary
                      }}>
                        Layer Order
                      </label>
                      <div style={{ display: 'flex', gap: theme.spacing.md }}>
                        <button
                          onClick={() => onMoveToFront(selectedNode.id)}
                          style={{
                            flex: 1,
                            padding: theme.spacing.md,
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: theme.radius.sm,
                            background: theme.background.tertiary,
                            color: theme.text.primary,
                            cursor: 'pointer',
                            fontSize: theme.fontSize.sm,
                            fontWeight: theme.fontWeight.medium,
                            transition: theme.transition.normal
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.background.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.background.tertiary;
                          }}
                        >
                          Bring to Front
                        </button>
                        <button
                          onClick={() => onMoveToBack(selectedNode.id)}
                          style={{
                            flex: 1,
                            padding: theme.spacing.md,
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: theme.radius.sm,
                            background: theme.background.tertiary,
                            color: theme.text.primary,
                            cursor: 'pointer',
                            fontSize: theme.fontSize.sm,
                            fontWeight: theme.fontWeight.medium,
                            transition: theme.transition.normal
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.background.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.background.tertiary;
                          }}
                        >
                          Send to Back
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      )}

      {/* Edge Styling */}
      {selectedEdge && (
        <div style={{ padding: theme.spacing.xl }}>
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.text.secondary
            }}>
              Label
            </label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              onBlur={handleEdgeUpdate}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                background: theme.background.tertiary,
                color: theme.text.primary,
                fontSize: theme.fontSize.sm,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.text.secondary
            }}>
              Line Style
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setEdgeStyle(style);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    border: edgeStyle === style ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    background: edgeStyle === style ? theme.background.active : theme.background.tertiary,
                    color: theme.text.primary,
                    cursor: 'pointer',
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                    textTransform: 'capitalize'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.text.secondary
            }}>
              Routing
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              {(['bezier', 'smoothstep', 'straight'] as const).map((routing) => (
                <button
                  key={routing}
                  onClick={() => {
                    setEdgeRouting(routing);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    border: edgeRouting === routing ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    background: edgeRouting === routing ? theme.background.active : theme.background.tertiary,
                    color: theme.text.primary,
                    cursor: 'pointer',
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                    textTransform: 'capitalize'
                  }}
                >
                  {routing === 'smoothstep' ? 'Step' : routing}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              color: theme.text.secondary
            }}>
              <input
                type="checkbox"
                checked={edgeAnimated}
                onChange={(e) => {
                  setEdgeAnimated(e.target.checked);
                  setTimeout(handleEdgeUpdate, 0);
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Animated Flow
            </label>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
              fontWeight: theme.fontWeight.medium,
              color: theme.text.secondary
            }}>
              Color
            </label>
            <input
              type="color"
              value={edgeColor}
              onChange={(e) => setEdgeColor(e.target.value)}
              onBlur={handleEdgeUpdate}
              style={{
                width: '100%',
                height: '32px',
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
                background: theme.background.tertiary
              }}
            />
          </div>

        </div>
      )}

      {!selectedNode && !selectedEdge && (
        <div style={{
          padding: `${theme.spacing.xxxl} ${theme.spacing.xxl}`,
          textAlign: 'center',
          color: theme.text.tertiary
        }}>
          <div style={{ fontSize: theme.fontSize.xxxl, marginBottom: theme.spacing.lg }}>✏️</div>
          <p style={{ fontSize: theme.fontSize.sm, margin: 0 }}>
            Select a node or edge to customize
          </p>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '320px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          border: `1px solid ${theme.border.default}`,
          borderRight: 'none',
          borderTopLeftRadius: theme.radius.md,
          borderBottomLeftRadius: theme.radius.md,
          background: theme.background.secondary,
          color: theme.text.primary,
          cursor: 'pointer',
          fontSize: theme.fontSize.lg,
          boxShadow: theme.shadow.md,
          transition: theme.transition.slow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.background.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.background.secondary;
        }}
      >
        {isOpen ? '▶' : '◀'}
      </button>
    </div>
  );
};

export default StylePanel;
