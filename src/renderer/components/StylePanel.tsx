import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { EnhancedDeviceData, ConnectionConfig } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { CustomEdgeData } from './CustomEdge';
import { TextNodeData } from './TextNode';

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
  const [activeTab, setActiveTab] = useState<'connection' | 'style'>('style');
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

  // Multiple connections support
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData | TextNodeData;
      setNodeLabel(data.label || '');

      if (selectedNode.type === 'text') {
        const textData = data as TextNodeData;
        setTextFontSize(textData.fontSize || 14);
        setTextFontColor(textData.fontColor || '#000000');
        setTextBgColor(textData.backgroundColor || 'transparent');
        setTextBorderColor(textData.borderColor || '#000000');
        setTextBorderStyle(textData.borderStyle || 'none');
        setTextBorderWidth(textData.borderWidth || 1);
      } else if (selectedNode.type === 'group') {
        // Group/Network Zone specific
        const groupData = data as GroupNodeData;
        setNodeColor(groupData.borderColor || '#ff6b6b');
        setNodeBgColor(groupData.backgroundColor || '#ffb3ba40');
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
        updates.backgroundColor = textBgColor;
        updates.borderColor = textBorderColor;
        updates.borderStyle = textBorderStyle;
        updates.borderWidth = textBorderWidth;
      } else if (selectedNode.type === 'group') {
        updates.borderColor = nodeColor;
        updates.backgroundColor = nodeBgColor;
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

    // Save to node
    setTimeout(() => {
      handleNodeUpdate();
    }, 0);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      setConnections(connections.filter(conn => conn.id !== connectionId));
      setTimeout(() => {
        handleNodeUpdate();
      }, 0);
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
      case 'rdp': return '#0078d4';
      case 'ssh': return '#f7a41d';
      case 'browser': return '#4285f4';
      case 'custom': return '#7b1fa2';
      default: return '#666666';
    }
  };

  const presetColors = [
    { name: 'Blue', value: '#5d7fa3' },
    { name: 'Green', value: '#6b8f71' },
    { name: 'Red', value: '#b06c6c' },
    { name: 'Orange', value: '#c89b6e' },
    { name: 'Purple', value: '#8a7a9e' },
    { name: 'Pink', value: '#b5788c' },
    { name: 'Teal', value: '#6b9990' },
    { name: 'Gray', value: '#7a8a95' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        right: isOpen ? '0' : '-320px',
        top: '0',
        width: '320px',
        height: '100vh',
        background: '#e8e8e8',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        color: '#333',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #d0d0d0',
        background: '#d8d8d8',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
          {selectedNode ? 'Node Style' : selectedEdge ? 'Edge Style' : 'Properties'}
        </h3>
      </div>

      {/* Tabs for non-text nodes (not for edges or text nodes) */}
      {selectedNode && selectedNode.type !== 'text' && (
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #d0d0d0',
          background: '#d8d8d8',
          position: 'sticky',
          top: '49px',
          zIndex: 10
        }}>
          <button
            onClick={() => setActiveTab('connection')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'connection' ? '#e8e8e8' : 'transparent',
              color: activeTab === 'connection' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'connection' ? '600' : '500',
              borderBottom: activeTab === 'connection' ? '3px solid #007bff' : '3px solid transparent',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'connection') {
                e.currentTarget.style.background = '#cfcfcf';
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
            onClick={() => setActiveTab('style')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'style' ? '#e8e8e8' : 'transparent',
              color: activeTab === 'style' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'style' ? '600' : '500',
              borderBottom: activeTab === 'style' ? '3px solid #007bff' : '3px solid transparent',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'style') {
                e.currentTarget.style.background = '#cfcfcf';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'style') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Style
          </button>
        </div>
      )}

      {/* Node Styling */}
      {selectedNode && (
        <div style={{ padding: '16px' }}>
          {/* Text Node - No tabs, just style content */}
          {selectedNode.type === 'text' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Text
                </label>
                <input
                  type="text"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  onBlur={handleNodeUpdate}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Background Color
                </label>
                <input
                  type="color"
                  value={textBgColor === 'transparent' ? '#ffffff' : textBgColor}
                  onChange={(e) => setTextBgColor(e.target.value)}
                  onBlur={handleNodeUpdate}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#fff'
                  }}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  fontSize: '10px',
                  color: '#666',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={textBgColor === 'transparent'}
                    onChange={(e) => {
                      setTextBgColor(e.target.checked ? 'transparent' : '#ffffff');
                      setTimeout(handleNodeUpdate, 0);
                    }}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  Transparent
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Border Style
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {(['none', 'solid', 'dashed', 'dotted'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setTextBorderStyle(style);
                        setTimeout(handleNodeUpdate, 0);
                      }}
                      style={{
                        padding: '6px',
                        border: textBorderStyle === style ? '1px solid #333' : '1px solid #ccc',
                        borderRadius: '4px',
                        background: textBorderStyle === style ? '#bbb' : '#fff',
                        color: '#333',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: '500',
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
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#333',
                        fontSize: '12px',
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
                  {/* Show connection list when not in form mode */}
                  {!showConnectionForm && (
                    <>
                      {/* Connections List */}
                      {connections.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                            Configured Connections
                          </label>
                          {connections.map((connection) => (
                            <div
                              key={connection.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                marginBottom: '8px',
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}
                            >
                              {/* Connection Type Badge */}
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: getConnectionTypeBadgeColor(connection.type),
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                              }}>
                                {connection.type}
                              </span>

                              {/* Connection Info */}
                              <div style={{
                                flex: 1,
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: '#333',
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
                                  padding: '4px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '3px',
                                  background: '#fff',
                                  color: '#333',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fff';
                                }}
                              >
                                Edit
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteConnection(connection.id)}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #e74c3c',
                                  borderRadius: '3px',
                                  background: '#fff',
                                  color: '#e74c3c',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#e74c3c';
                                  e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fff';
                                  e.currentTarget.style.color = '#e74c3c';
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
                          padding: '20px',
                          textAlign: 'center',
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔌</div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                            No connections configured
                          </div>
                          <div style={{ fontSize: '10px', color: '#999' }}>
                            Add a connection to enable remote access
                          </div>
                        </div>
                      )}

                      {/* Add Connection Button */}
                      <button
                        onClick={handleAddConnection}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #007bff',
                          borderRadius: '4px',
                          background: '#007bff',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#0056b3';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#007bff';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>+</span>
                        <span>Add Connection</span>
                      </button>
                    </>
                  )}

                  {/* Show connection form when adding/editing */}
                  {showConnectionForm && (
                    <>
                      <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          marginBottom: '12px',
                          color: '#333'
                        }}>
                          {editingConnectionId ? 'Edit Connection' : 'New Connection'}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              background: '#fff',
                              color: '#333',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                              cursor: 'pointer'
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
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Host
                              </label>
                              <input
                                type="text"
                                value={nodeHost}
                                onChange={(e) => setNodeHost(e.target.value)}
                                placeholder="192.168.1.1"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Username (Optional)
                              </label>
                              <input
                                type="text"
                                value={nodeUsername}
                                onChange={(e) => setNodeUsername(e.target.value)}
                                placeholder="administrator"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Password (Optional)
                              </label>
                              <input
                                type="password"
                                value={nodePassword}
                                onChange={(e) => setNodePassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* SSH Settings */}
                        {nodeType === 'ssh' && (
                          <>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Host
                              </label>
                              <input
                                type="text"
                                value={nodeHost}
                                onChange={(e) => setNodeHost(e.target.value)}
                                placeholder="192.168.1.1"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Port
                              </label>
                              <input
                                type="number"
                                value={nodePort}
                                onChange={(e) => setNodePort(parseInt(e.target.value) || 22)}
                                placeholder="22"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Username
                              </label>
                              <input
                                type="text"
                                value={nodeUsername}
                                onChange={(e) => setNodeUsername(e.target.value)}
                                placeholder="root"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                                Password
                              </label>
                              <input
                                type="password"
                                value={nodePassword}
                                onChange={(e) => setNodePassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px',
                                  background: '#fff',
                                  color: '#333',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Browser Settings */}
                        {nodeType === 'browser' && (
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                              URL
                            </label>
                            <input
                              type="text"
                              value={nodeHost}
                              onChange={(e) => setNodeHost(e.target.value)}
                              placeholder="https://example.com"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                background: '#fff',
                                color: '#333',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        )}

                        {/* Custom Command */}
                        {nodeType === 'custom' && (
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                              Custom Command
                            </label>
                            <input
                              type="text"
                              value={nodeCustomCommand}
                              onChange={(e) => setNodeCustomCommand(e.target.value)}
                              placeholder="ping 8.8.8.8"
                              title="Enter command to execute in CMD (e.g., ping 8.8.8.8)"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                background: '#fff',
                                color: '#333',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button
                            onClick={handleSaveConnection}
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: '1px solid #28a745',
                              borderRadius: '4px',
                              background: '#28a745',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#218838';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#28a745';
                            }}
                          >
                            {editingConnectionId ? 'Update' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelConnectionForm}
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: '1px solid #6c757d',
                              borderRadius: '4px',
                              background: '#6c757d',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#5a6268';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#6c757d';
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* STYLE TAB */}
              {activeTab === 'style' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                      Label
                    </label>
                    <input
                      type="text"
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onBlur={handleNodeUpdate}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#333',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Operating System - only for enhanced nodes */}
                  {selectedNode.type !== 'group' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                        Operating System
                      </label>
                      <input
                        type="text"
                        value={nodeOS}
                        onChange={(e) => setNodeOS(e.target.value)}
                        onBlur={handleNodeUpdate}
                        
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          background: '#fff',
                          color: '#333',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Color Section */}
                  {selectedNode.type === 'group' ? (
                    <>
                      {/* Group nodes: Border and Background colors */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: '500', color: '#666' }}>
                          Border Color
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          marginBottom: '6px'
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
                                border: nodeColor === color.value ? '2px solid #333' : '1px solid #ccc',
                                borderRadius: '4px',
                                background: color.value,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#fff'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: '500', color: '#666' }}>
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={nodeBgColor}
                          onChange={(e) => setNodeBgColor(e.target.value)}
                          onBlur={handleNodeUpdate}
                          style={{
                            width: '100%',
                            height: '32px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#fff'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Enhanced nodes: Single color picker */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: '500', color: '#666' }}>
                          Color
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          marginBottom: '6px'
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
                                border: nodeColor === color.value ? '2px solid #333' : '1px solid #ccc',
                                borderRadius: '4px',
                                background: color.value,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#fff'
                          }}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                      Description
                    </label>
                    <textarea
                      value={nodeDescription}
                      onChange={(e) => setNodeDescription(e.target.value)}
                      onBlur={handleNodeUpdate}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#333',
                        fontSize: '11px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Layering Controls */}
          {onMoveToFront && onMoveToBack && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d0d0d0' }}>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                Layer Order
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onMoveToFront(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Bring to Front
                </button>
                <button
                  onClick={() => onMoveToBack(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Send to Back
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Edge Styling */}
      {selectedEdge && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Label
            </label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              onBlur={handleEdgeUpdate}
              
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                color: '#333',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Line Style
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setEdgeStyle(style);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: edgeStyle === style ? '1px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    background: edgeStyle === style ? '#bbb' : '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Routing
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['bezier', 'smoothstep', 'straight'] as const).map((routing) => (
                <button
                  key={routing}
                  onClick={() => {
                    setEdgeRouting(routing);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: edgeRouting === routing ? '1px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    background: edgeRouting === routing ? '#bbb' : '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {routing === 'smoothstep' ? 'Step' : routing}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              color: '#666'
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

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff'
              }}
            />
          </div>

        </div>
      )}

      {!selectedNode && !selectedEdge && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✏️</div>
          <p style={{ fontSize: '12px', margin: 0 }}>
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
          border: 'none',
          borderTopLeftRadius: '6px',
          borderBottomLeftRadius: '6px',
          background: '#e8e8e8',
          color: '#333',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          transition: 'right 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d0d0d0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#e8e8e8';
        }}
      >
        {isOpen ? '▶' : '◀'}
      </button>
    </div>
  );
};

export default StylePanel;
