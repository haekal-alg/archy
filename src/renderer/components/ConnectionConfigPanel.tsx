import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { EnhancedDeviceData, ConnectionConfig, SSHPortForward } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { PlugIcon, SaveIcon } from './StatusIcons';
import theme from '../../theme';

interface ConnectionConfigPanelProps {
  selectedNode: Node;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData>) => void;
}

type EditablePortForward = {
  id: string;
  localPort: number | null;
  remoteHost: string;
  remotePort: number | null;
  bindAddress?: string;
};

const ConnectionConfigPanel: React.FC<ConnectionConfigPanelProps> = ({
  selectedNode,
  onUpdateNode,
}) => {
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

  // Connection-related state
  const [nodeHost, setNodeHost] = useState('');
  const [nodePort, setNodePort] = useState(22);
  const [nodeUsername, setNodeUsername] = useState('');
  const [nodePassword, setNodePassword] = useState('');
  const [nodeType, setNodeType] = useState<'rdp' | 'ssh' | 'browser' | 'custom'>('ssh');
  const [nodeCustomCommand, setNodeCustomCommand] = useState('');
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [sshPortForwards, setSshPortForwards] = useState<EditablePortForward[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState('');
  const [connectionGroup, setConnectionGroup] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privateKeyPath, setPrivateKeyPath] = useState('');
  const [draggingConnectionId, setDraggingConnectionId] = useState<string | null>(null);
  const [dragOverConnectionId, setDragOverConnectionId] = useState<string | null>(null);

  // Helper function to migrate old single-connection format to new array format
  const migrateOldConnectionFormat = (data: any): ConnectionConfig | null => {
    const connectionType = data.connectionType;
    const host = data.host;

    if (!host && !data.customCommand) {
      return null;
    }

    return {
      id: `conn-${Date.now()}`,
      label: '',
      type: connectionType || 'ssh',
      host: host,
      port: data.port || 22,
      username: data.username || '',
      password: data.password || '',
      customCommand: data.customCommand || '',
      privateKeyPath: ''
    };
  };

  // Initialize connection state from selectedNode
  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData;

      // Load connections array or migrate from old format
      if ((data as any).connections) {
        setConnections((data as any).connections);
      } else {
        const legacyConnection = migrateOldConnectionFormat(data as any);
        setConnections(legacyConnection ? [legacyConnection] : []);
      }

      // Reset connection form state
      setShowConnectionForm(false);
      setEditingConnectionId(null);
      setConnectionLabel('');
      setConnectionGroup('');
      setNodeType('ssh');
      setNodeHost('');
      setNodePort(22);
      setNodeUsername('');
      setNodePassword('');
      setNodeCustomCommand('');
      setPrivateKeyPath('');
      setSshPortForwards([]);
      setShowPassword(false);
      setHasUnsavedChanges(false);
    }
  }, [selectedNode]);

  // Connection management functions
  const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const normalizeGroup = (group?: string) => (group || '').trim();

  const reorderConnections = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections((prev) => {
      const fromIndex = prev.findIndex((conn) => conn.id === fromId);
      const toIndex = prev.findIndex((conn) => conn.id === toId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const toEditablePortForwards = (portForwards?: SSHPortForward[]): EditablePortForward[] => {
    if (!portForwards || portForwards.length === 0) {
      return [];
    }

    return portForwards.map((forward) => ({
      id: makeId('pf'),
      localPort: typeof forward.localPort === 'number' ? forward.localPort : null,
      remoteHost: forward.remoteHost || 'localhost',
      remotePort: typeof forward.remotePort === 'number' ? forward.remotePort : null,
      bindAddress: forward.bindAddress,
    }));
  };

  const handleAddPortForward = () => {
    setSshPortForwards([
      ...sshPortForwards,
      {
        id: makeId('pf'),
        localPort: null,
        remoteHost: 'localhost',
        remotePort: null,
      },
    ]);
  };

  const handleUpdatePortForward = (id: string, updates: Partial<EditablePortForward>) => {
    setSshPortForwards(sshPortForwards.map((forward) => (
      forward.id === id ? { ...forward, ...updates } : forward
    )));
  };

  const handleDeletePortForward = (id: string) => {
    setSshPortForwards(sshPortForwards.filter((forward) => forward.id !== id));
  };

  const handleAddConnection = () => {
    setShowConnectionForm(true);
    setEditingConnectionId(null);
    setConnectionLabel('');
    setConnectionGroup('');
    setNodeType('ssh');
    setNodeHost('');
    setNodePort(22);
    setNodeUsername('');
    setNodePassword('');
    setNodeCustomCommand('');
    setPrivateKeyPath('');
    setSshPortForwards([]);
    setShowPassword(false);
  };

  const handleEditConnection = (connection: ConnectionConfig) => {
    setEditingConnectionId(connection.id);
    setShowConnectionForm(true);
    setConnectionLabel(connection.label || '');
    setConnectionGroup(connection.group || '');
    setNodeType(connection.type);
    setNodeHost(connection.host || '');
    setNodePort(connection.port || 22);
    setNodeUsername(connection.username || '');
    setNodePassword(connection.password || '');
    setNodeCustomCommand(connection.customCommand || '');
    setPrivateKeyPath(connection.privateKeyPath || '');
    setSshPortForwards(toEditablePortForwards(connection.portForwards));
    setShowPassword(false);
  };

  const handleSaveConnection = () => {
    const cleanedPortForwards: SSHPortForward[] = nodeType === 'ssh'
      ? sshPortForwards
          .map((forward) => ({
            localPort: forward.localPort ?? 0,
            remoteHost: (forward.remoteHost || '').trim(),
            remotePort: forward.remotePort ?? 0,
            bindAddress: forward.bindAddress?.trim() || undefined,
          }))
          .filter((forward) => (
            forward.localPort > 0 && forward.remotePort > 0 && forward.remoteHost.length > 0
          ))
      : [];

    const newConnection: ConnectionConfig = {
      id: editingConnectionId || makeId('conn'),
      label: connectionLabel,
      group: connectionGroup.trim() !== '' ? connectionGroup.trim() : undefined,
      type: nodeType,
      host: nodeHost,
      port: nodePort,
      username: nodeUsername,
      password: nodePassword,
      customCommand: nodeCustomCommand,
      privateKeyPath: privateKeyPath,
      portForwards: nodeType === 'ssh' && cleanedPortForwards.length > 0 ? cleanedPortForwards : undefined
    };

    if (editingConnectionId) {
      setConnections(connections.map(conn =>
        conn.id === editingConnectionId ? newConnection : conn
      ));
    } else {
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
    setPrivateKeyPath('');
    setSshPortForwards([]);
    setShowPassword(false);
    setConnectionGroup('');

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
    setConnectionLabel('');
    setConnectionGroup('');
    setNodeType('ssh');
    setNodeHost('');
    setNodePort(22);
    setNodeUsername('');
    setNodePassword('');
    setNodeCustomCommand('');
    setPrivateKeyPath('');
    setSshPortForwards([]);
    setShowPassword(false);
  };

  const handleSaveAllChanges = () => {
    onUpdateNode(selectedNode.id, { connections } as any);
    setHasUnsavedChanges(false);
  };

  const getConnectionDisplayText = (connection: ConnectionConfig): string => {
    if (connection.label) {
      return connection.label;
    }

    switch (connection.type) {
      case 'rdp':
        return connection.host || 'No host';
      case 'ssh': {
        const base = `${connection.username || 'user'}@${connection.host || 'host'}:${connection.port || 22}`;
        const forwardCount = connection.portForwards?.length || 0;
        return forwardCount > 0 ? `${base} (+${forwardCount} fwd)` : base;
      }
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

  const groupedConnectionItems: Array<
    | { type: 'divider'; label: string }
    | { type: 'connection'; connection: ConnectionConfig }
  > = [];
  let currentGroup = '';
  connections.forEach((connection) => {
    const group = normalizeGroup(connection.group);
    if (group && group !== currentGroup) {
      groupedConnectionItems.push({ type: 'divider', label: group });
      currentGroup = group;
    }
    if (!group) {
      currentGroup = '';
    }
    groupedConnectionItems.push({ type: 'connection', connection });
  });

  return (
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
          {groupedConnectionItems.map((item) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={`group-${item.label}`}
                  style={{
                    margin: `${theme.spacing.md} 0 ${theme.spacing.sm}`,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.xs,
                    background: theme.background.secondary,
                    border: `1px solid ${theme.border.default}`,
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {item.label}
                </div>
              );
            }

            const { connection } = item;
            const isDragging = draggingConnectionId === connection.id;
            const isDragOver = dragOverConnectionId === connection.id;

            return (
              <div
                key={connection.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={() => setDragOverConnectionId(connection.id)}
                onDragLeave={() => {
                  if (dragOverConnectionId === connection.id) {
                    setDragOverConnectionId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData('text/plain') || draggingConnectionId;
                  if (fromId) {
                    reorderConnections(fromId, connection.id);
                  }
                  setDraggingConnectionId(null);
                  setDragOverConnectionId(null);
                }}
                onDragEnd={() => {
                  setDraggingConnectionId(null);
                  setDragOverConnectionId(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  background: theme.background.tertiary,
                  border: `1px solid ${isDragOver ? theme.accent.blue : theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.fontSize.sm,
                  boxShadow: isDragOver ? '0 0 0 2px rgba(47, 129, 247, 0.2)' : 'none',
                  opacity: isDragging ? 0.6 : 1
                }}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    setDraggingConnectionId(connection.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', connection.id);
                  }}
                  onDragEnd={() => {
                    setDraggingConnectionId(null);
                    setDragOverConnectionId(null);
                  }}
                  title="Drag to reorder"
                  style={{
                    width: '14px',
                    height: '14px',
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: '3px',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'grab',
                    background: theme.background.secondary,
                    color: theme.text.tertiary,
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '2px',
                    border: `1px solid ${theme.border.default}`
                  }} />
                </div>

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
            );
          })}
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
          <div style={{ marginBottom: theme.spacing.md }}><PlugIcon size={24} color={theme.text.tertiary} /></div>
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
                Connection Label
              </label>
              <input
                type="text"
                value={connectionLabel}
                onChange={(e) => setConnectionLabel(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="e.g., Connect via SSH, Open Web Panel, etc."
                autoComplete="off"
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
                Group (Optional)
              </label>
              <input
                type="text"
                value={connectionGroup}
                onChange={(e) => setConnectionGroup(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                placeholder="e.g., Lab, Prod, External"
                autoComplete="off"
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="192.168.1.1"
                    autoComplete="off"
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="administrator"
                    autoComplete="off"
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
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
                      style={{
                        ...connectionInputStyle,
                        paddingRight: '40px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.text.secondary,
                        fontSize: theme.fontSize.base,
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="192.168.1.1"
                    autoComplete="off"
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="22"
                    autoComplete="off"
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="root"
                    autoComplete="off"
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={nodePassword}
                      onChange={(e) => setNodePassword(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      placeholder="••••••••"
                      autoComplete="off"
                      style={{
                        ...connectionInputStyle,
                        paddingRight: '40px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.text.secondary,
                        fontSize: theme.fontSize.base,
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
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
                    Private Key (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <input
                      type="text"
                      value={privateKeyPath}
                      onChange={(e) => setPrivateKeyPath(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      placeholder="Path to private key file"
                      autoComplete="off"
                      style={{
                        ...connectionInputStyle,
                        flex: 1,
                        fontFamily: 'monospace'
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const result = await (window as any).electron.showOpenDialog({
                            properties: ['openFile'],
                            filters: [
                              { name: 'Key Files', extensions: ['pem', 'key', 'pub'] },
                              { name: 'All Files', extensions: ['*'] }
                            ]
                          });
                          if (result && !result.canceled && result.filePaths.length > 0) {
                            setPrivateKeyPath(result.filePaths[0]);
                          }
                        } catch (error) {
                          console.error('Error selecting private key:', error);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: `1px solid ${theme.accent.blue}`,
                        borderRadius: theme.radius.sm,
                        background: theme.accent.blue,
                        color: theme.text.inverted,
                        cursor: 'pointer',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.semibold,
                        transition: theme.transition.normal,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.accent.blueDark;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.accent.blue;
                      }}
                      title="Import private key file"
                    >
                      + Import
                    </button>
                  </div>
                </div>
                <div style={{
                  marginBottom: theme.spacing.lg,
                  padding: theme.spacing.md,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  background: theme.background.tertiary
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.sm
                  }}>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.text.primary
                    }}>
                      Port Forwarding (Optional)
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPortForward}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        border: `1px solid ${theme.accent.green}`,
                        borderRadius: theme.radius.xs,
                        background: theme.accent.green,
                        color: theme.text.inverted,
                        cursor: 'pointer',
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.semibold,
                        pointerEvents: 'auto'
                      }}
                      title="Add local port forward (-L)"
                    >
                      + Add Forward
                    </button>
                  </div>

                  {sshPortForwards.length === 0 && (
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.text.tertiary,
                      marginBottom: theme.spacing.sm
                    }}>
                      Example: ssh -L 1455:localhost:1455 user@remote
                    </div>
                  )}

                  {sshPortForwards.map((forward) => (
                    <div
                      key={forward.id}
                      style={{
                        border: `1px solid ${theme.border.default}`,
                        borderRadius: theme.radius.sm,
                        padding: theme.spacing.sm,
                        marginBottom: theme.spacing.sm,
                        background: theme.background.elevated
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing.sm
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.xs,
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Local Port
                          </label>
                          <input
                            type="number"
                            value={forward.localPort ?? ''}
                            onChange={(e) => handleUpdatePortForward(forward.id, {
                              localPort: parseInt(e.target.value, 10) || null
                            })}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            placeholder="1455"
                            autoComplete="off"
                            style={connectionInputStyle}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.xs,
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Remote Host
                          </label>
                          <input
                            type="text"
                            value={forward.remoteHost}
                            onChange={(e) => handleUpdatePortForward(forward.id, {
                              remoteHost: e.target.value
                            })}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            placeholder="localhost"
                            autoComplete="off"
                            style={{
                              ...connectionInputStyle,
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.xs,
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Remote Port
                          </label>
                          <input
                            type="number"
                            value={forward.remotePort ?? ''}
                            onChange={(e) => handleUpdatePortForward(forward.id, {
                              remotePort: parseInt(e.target.value, 10) || null
                            })}
                            onMouseDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            placeholder="1455"
                            autoComplete="off"
                            style={connectionInputStyle}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePortForward(forward.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            border: `1px solid ${theme.accent.red}`,
                            borderRadius: theme.radius.xs,
                            background: theme.accent.red,
                            color: theme.text.inverted,
                            cursor: 'pointer',
                            fontSize: theme.fontSize.xs,
                            fontWeight: theme.fontWeight.semibold,
                            height: '36px',
                            alignSelf: 'flex-start',
                            pointerEvents: 'auto'
                          }}
                          title="Remove this port forward"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          marginBottom: theme.spacing.xs,
                          fontWeight: theme.fontWeight.medium,
                          color: theme.text.secondary
                        }}>
                          Bind Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={forward.bindAddress || ''}
                          onChange={(e) => handleUpdatePortForward(forward.id, {
                            bindAddress: e.target.value
                          })}
                          onMouseDown={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          placeholder="127.0.0.1"
                          autoComplete="off"
                          style={{
                            ...connectionInputStyle,
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </div>
                  ))}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="https://example.com"
                  autoComplete="off"
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="ping 8.8.8.8"
                  title="Enter command to execute in CMD (e.g., ping 8.8.8.8)"
                  autoComplete="off"
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
        <SaveIcon size={16} color="currentColor" />
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
  );
};

export default ConnectionConfigPanel;
