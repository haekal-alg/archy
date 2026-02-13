import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';
import ConnectionContextMenu from './ConnectionContextMenu';
import SFTPModal from './SFTPModal';
import { ClimbingBoxLoader } from 'react-spinners';
import { PlugIcon, LatencyDot, LightningIcon } from './StatusIcons';
import theme from '../../theme';

// Icon for local terminal connections
const LocalTerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M3.5 5L5.5 7L3.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Icon for remote SSH connections
const RemoteSSHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="4" y="1" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <rect x="4" y="9" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M7 5V9" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 7H2V11H4M10 7H12V11H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection, removeConnection, retryConnection, createLocalTerminal, renameConnection, cancelAutoReconnect, topologyNodes, focusNode } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);
  const [renameModal, setRenameModal] = useState<{ connectionId: string; currentName: string } | null>(null);
  const [sftpModalOpen, setSftpModalOpen] = useState(false);

  // Cache zoom values in state to avoid localStorage reads during render
  const [zoomCache, setZoomCache] = useState<Record<string, number>>({});

  // Helper function to get zoom from cache (no localStorage access during render)
  const getConnectionZoom = useCallback((connectionId: string): number => {
    return zoomCache[connectionId] ?? 1.0;
  }, [zoomCache]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return theme.accent.greenDark;
      case 'connecting': return theme.accent.orange;
      case 'disconnected': return theme.text.disabled;
      case 'error': return theme.accent.red;
      default: return theme.text.disabled;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleString();
  };

  // Event handlers
  const handleZoomChange = (connectionId: string, delta: number) => {
    const currentZoom = getConnectionZoom(connectionId);
    // Allow zoom from 0.5 (50%) to 2.0 (200%)
    const newZoom = Math.max(0.5, Math.min(2.0, currentZoom + delta));

    localStorage.setItem(`terminal-zoom-${connectionId}`, newZoom.toString());
    window.dispatchEvent(new CustomEvent('terminal-zoom-change', { detail: { connectionId, zoom: newZoom } }));
  };

  const handleContextMenu = (e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      connectionId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleRetry = () => {
    if (contextMenu) {
      retryConnection(contextMenu.connectionId);
      closeContextMenu();
    }
  };

  const handleDisconnect = () => {
    if (contextMenu) {
      disconnectConnection(contextMenu.connectionId);
      closeContextMenu();
    }
  };

  const handleRemove = () => {
    if (contextMenu) {
      removeConnection(contextMenu.connectionId);
      closeContextMenu();
    }
  };

  const handleRename = () => {
    if (contextMenu) {
      const conn = connections.find(c => c.id === contextMenu.connectionId);
      if (conn) {
        setRenameModal({
          connectionId: conn.id,
          currentName: conn.customLabel || conn.nodeName,
        });
        closeContextMenu();
      }
    }
  };

  const handleRenameSubmit = (newLabel: string) => {
    if (renameModal) {
      renameConnection(renameModal.connectionId, newLabel);
      setRenameModal(null);
    }
  };

  const handleOpenInExplorer = () => {
    if (contextMenu) {
      const conn = connections.find(c => c.id === contextMenu.connectionId);
      if (conn && conn.connectionType === 'local') {
        window.electron.openTerminalInExplorer(contextMenu.connectionId);
      }
      closeContextMenu();
    }
  };

  const handleDuplicateLocal = async () => {
    if (!contextMenu) return;
    const connectionId = contextMenu.connectionId;
    closeContextMenu();

    const conn = connections.find(c => c.id === connectionId);
    if (conn && conn.connectionType === 'local') {
      const result = await window.electron.getLocalTerminalCwd(conn.id);
      const cwd = result.success ? result.cwd : undefined;
      await createLocalTerminal(cwd);
    }
  };

  // Derived state
  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const activeZoom = activeConnectionId ? getConnectionZoom(activeConnectionId) : 1.0;

  // Initialize zoom cache from localStorage when connections change
  useEffect(() => {
    const newCache: Record<string, number> = {};
    connections.forEach(conn => {
      const stored = localStorage.getItem(`terminal-zoom-${conn.id}`);
      newCache[conn.id] = stored ? parseFloat(stored) : 1.0;
    });
    setZoomCache(prev => {
      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasChanges = connections.some(conn => prev[conn.id] !== newCache[conn.id]);
      return hasChanges ? newCache : prev;
    });
  }, [connections]);

  // Listen for zoom changes from user interaction
  useEffect(() => {
    const handleZoomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ connectionId: string; zoom: number }>;
      const { connectionId, zoom } = customEvent.detail;
      setZoomCache(prev => ({ ...prev, [connectionId]: zoom }));
    };

    window.addEventListener('terminal-zoom-change', handleZoomUpdate);
    return () => window.removeEventListener('terminal-zoom-change', handleZoomUpdate);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Side Panel - Always rendered for animation */}
      <div style={{
        width: sidePanelCollapsed ? '0px' : '320px',
        background: theme.background.primary,
        borderRight: sidePanelCollapsed ? 'none' : `1px solid ${theme.border.default}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease, border 0.3s ease',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}>

        {/* Side Panel Header */}
        <div style={{
          minWidth: '320px',
          padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
          borderBottom: `1px solid ${theme.border.default}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: theme.background.primary,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{
              margin: 0,
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              color: theme.text.primary,
            }}>
              Active Connections
            </h3>
          </div>

          {/* Action Buttons Container */}
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            {/* New Local Terminal Button */}
            <button
              onClick={() => createLocalTerminal()}
              style={{
                padding: `${theme.spacing.sm} 10px`,
                background: theme.background.hover,
                color: theme.text.primary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.sm,
                cursor: 'pointer',
                fontWeight: theme.fontWeight.semibold,
                letterSpacing: '0.3px',
                transition: theme.transition.normal,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.background.active;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background.hover;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M3 5L5 7L3 9M6 9H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Terminal
            </button>

            {/* SFTP Button */}
            <button
              onClick={() => setSftpModalOpen(true)}
              style={{
                padding: `${theme.spacing.sm} 10px`,
                background: theme.background.hover,
                color: theme.text.primary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.sm,
                cursor: 'pointer',
                fontWeight: theme.fontWeight.semibold,
                letterSpacing: '0.3px',
                transition: theme.transition.normal,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.background.active;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.background.hover;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L10 4M7 1L4 4M7 1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 7V12C2 12.5523 2.44772 13 3 13H11C11.5523 13 12 12.5523 12 12V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M7 5L10 8M7 5L4 8M7 5V13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
              SFTP
            </button>
          </div>
        </div>

        {/* Connections List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          minWidth: '320px',
          padding: theme.spacing.xl,
        }}>
          {connections.length === 0 ? (
            <div style={{
              padding: `48px ${theme.spacing.xxl}`,
              textAlign: 'center',
              background: theme.background.tertiary,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
            }}>
              <div style={{ marginBottom: theme.spacing.lg }}><PlugIcon size={36} color={theme.text.tertiary} /></div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.text.secondary, marginBottom: theme.spacing.xs }}>
                No active connections
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.text.tertiary }}>
                Connect to a device from the Design tab
              </div>
            </div>
          ) : (
            connections.map(conn => (
              <div
                key={conn.id}
                onClick={() => setActiveConnectionId(conn.id)}
                onContextMenu={(e) => handleContextMenu(e, conn.id)}
                style={{
                  position: 'relative',
                  marginBottom: theme.spacing.md,
                  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  background: activeConnectionId === conn.id ? theme.background.secondary : theme.background.tertiary,
                  border: activeConnectionId === conn.id ? `1px solid ${theme.accent.blue}` : `1px solid ${theme.border.default}`,
                  transition: theme.transition.normal,
                }}
                onMouseEnter={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = theme.background.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = theme.background.tertiary;
                  }
                }}
              >
                {/* Node Name / Custom Label with Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  paddingRight: conn.status === 'connected' ? '32px' : '0',
                }}>
                  <span style={{ color: conn.connectionType === 'local' ? theme.accent.green : theme.accent.blue }}>
                    {conn.connectionType === 'local' ? <LocalTerminalIcon /> : <RemoteSSHIcon />}
                  </span>
                  {/* Device type color indicator */}
                  {conn.nodeType && conn.nodeType !== 'local' && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: (theme.device as Record<string, string>)[conn.nodeType] || theme.text.tertiary,
                      flexShrink: 0,
                      marginLeft: `-${theme.spacing.xs}`,
                    }} title={conn.nodeType} />
                  )}
                  <span style={{
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                    color: theme.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {conn.customLabel || conn.nodeName}
                  </span>
                </div>

                {/* Connection Details */}
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.text.tertiary,
                  marginBottom: theme.spacing.md,
                  fontFamily: 'Consolas, "Courier New", monospace',
                  background: theme.background.elevated,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.border.default}`,
                }}>
                  {conn.username}@{conn.host}:{conn.port}
                </div>

                {/* Status & Last Activity */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: conn.status === 'connected'
                        ? theme.accent.green
                        : conn.status === 'connecting'
                          ? theme.accent.orange
                          : conn.status === 'error'
                            ? theme.accent.red
                            : theme.text.disabled,
                      display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: conn.status === 'connected' ? theme.accent.green : theme.text.secondary,
                    }}>
                      {getStatusText(conn.status)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.text.tertiary,
                    fontWeight: theme.fontWeight.medium,
                  }}>
                    {formatLastActivity(conn.lastActivity)}
                  </span>
                </div>

                {/* Error Message */}
                {conn.error && !conn.reconnectState && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    fontSize: theme.fontSize.xs,
                    color: theme.accent.redLight,
                    background: theme.background.elevated,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.accent.red}`,
                    lineHeight: '1.4',
                  }}>
                    {conn.error}
                  </div>
                )}

                {/* Auto-Reconnect Status */}
                {conn.reconnectState?.isReconnecting && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    background: theme.background.elevated,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.accent.orange}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: theme.fontSize.sm, color: theme.accent.orange, fontWeight: theme.fontWeight.medium }}>
                        Reconnecting... Attempt {conn.reconnectState.attemptNumber}/{conn.reconnectState.maxAttempts}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelAutoReconnect(conn.id);
                        }}
                        style={{
                          padding: `3px ${theme.spacing.md}`,
                          background: theme.background.hover,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: '3px',
                          color: theme.text.primary,
                          fontSize: theme.fontSize.xs,
                          cursor: 'pointer',
                          fontWeight: theme.fontWeight.medium,
                          transition: theme.transition.normal,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.background.active;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme.background.hover;
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.text.tertiary, marginTop: theme.spacing.xs }}>
                      Next attempt in {Math.ceil(conn.reconnectState.nextAttemptIn / 1000)}s
                    </div>
                    {/* Progress bar for countdown */}
                    <div style={{
                      marginTop: theme.spacing.sm,
                      height: '3px',
                      background: theme.background.secondary,
                      borderRadius: theme.radius.xs,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(0, (conn.reconnectState.nextAttemptIn / (1000 * Math.pow(2, conn.reconnectState.attemptNumber - 1))) * 100)}%`,
                        background: theme.accent.orange,
                        transition: 'width 1s linear',
                      }} />
                    </div>
                  </div>
                )}

                {/* Remove X Button */}
                {conn.status === 'connected' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(conn.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: theme.spacing.lg,
                      right: theme.spacing.lg,
                      width: '18px',
                      height: '18px',
                      padding: '0',
                      background: theme.background.hover,
                      color: theme.text.tertiary,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.base,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: theme.fontWeight.semibold,
                      lineHeight: '1',
                      transition: theme.transition.normal,
                    }}
                    title="Disconnect and Remove"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.accent.red;
                      e.currentTarget.style.color = theme.text.inverted;
                      e.currentTarget.style.border = `1px solid ${theme.accent.redDark}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.background.hover;
                      e.currentTarget.style.color = theme.text.tertiary;
                      e.currentTarget.style.border = `1px solid ${theme.border.default}`;
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Unified Toggle Button */}
      <button
        onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)}
        className="panel-glass"
        style={{
          position: 'absolute',
          left: sidePanelCollapsed ? '0' : '290px',
          top: '10px',
          width: '30px',
          height: '40px',
          borderRight: sidePanelCollapsed ? undefined : 'none',
          borderLeft: sidePanelCollapsed ? 'none' : undefined,
          borderTopRightRadius: sidePanelCollapsed ? '8px' : '0',
          borderBottomRightRadius: sidePanelCollapsed ? '8px' : '0',
          borderTopLeftRadius: sidePanelCollapsed ? '0' : '8px',
          borderBottomLeftRadius: sidePanelCollapsed ? '0' : '8px',
          fontSize: '18px',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.3)',
          transition: theme.transition.slow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        {sidePanelCollapsed ? '\u203A' : '\u2039'}
      </button>

      {/* Main Terminal Canvas */}
      <div style={{
        flex: 1,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {activeConnection ? (
          <>
            {/* Terminal Header with Zoom Controls */}
            <div style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderBottom: `1px solid ${theme.border.subtle}`,
              backgroundColor: theme.background.primary,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: theme.fontSize.md,
                color: theme.text.primary,
                fontFamily: 'Consolas, monospace',
              }}>
                {activeConnection.username}@{activeConnection.host} — {activeConnection.customLabel || activeConnection.nodeName}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.lg,
              }}>
                {/* Latency Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.xs} 10px`,
                  backgroundColor: theme.background.tertiary,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.border.default}`,
                }}>
                  {activeConnection.latency !== undefined ? (
                    <>
                      <LatencyDot
                        size={10}
                        color={activeConnection.latency < 100 ? theme.accent.green : activeConnection.latency < 300 ? theme.accent.orange : theme.accent.red}
                      />
                      <span style={{
                        fontSize: '12px',
                        color: activeConnection.latency < 100 ? theme.accent.green : activeConnection.latency < 300 ? theme.accent.orange : theme.accent.red,
                        fontWeight: theme.fontWeight.medium,
                        fontFamily: 'Consolas, monospace',
                        minWidth: '45px',
                      }}>
                        {activeConnection.latency}ms
                      </span>
                    </>
                  ) : (
                    <span style={{
                      fontSize: '12px',
                      color: theme.text.disabled,
                      fontFamily: 'Consolas, monospace',
                      minWidth: '45px',
                    }}>
                      ---
                    </span>
                  )}
                </div>
                {/* Zoom Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}>
                  <button
                    onClick={() => handleZoomChange(activeConnection.id, -0.1)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      backgroundColor: theme.background.hover,
                      color: theme.text.primary,
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: theme.fontSize.lg,
                      cursor: 'pointer',
                      lineHeight: '1',
                      transition: 'background-color 0.2s ease',
                    }}
                    title="Zoom out"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.background.active}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.background.hover}
                  >
                    −
                  </button>
                  <span style={{
                    fontSize: '12px',
                    color: theme.text.secondary,
                    minWidth: '45px',
                    textAlign: 'center',
                  }}>
                    {Math.round(activeZoom * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoomChange(activeConnection.id, 0.1)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      backgroundColor: theme.background.hover,
                      color: theme.text.primary,
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: theme.fontSize.lg,
                      cursor: 'pointer',
                      lineHeight: '1',
                      transition: 'background-color 0.2s ease',
                    }}
                    title="Zoom in"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.background.active}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.background.hover}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Device Info Bar - topology cross-reference */}
            {activeConnection && (() => {
              const topoNode = activeConnection.nodeId
                ? topologyNodes.find(n => n.id === activeConnection.nodeId)
                : null;

              if (activeConnection.connectionType === 'local') {
                return (
                  <div style={{
                    margin: '0 8px',
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    background: theme.background.tertiary,
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                  }}>
                    <LocalTerminalIcon />
                    <span style={{ fontSize: theme.fontSize.sm, color: theme.text.secondary }}>Local Terminal</span>
                  </div>
                );
              }

              if (!topoNode) return null;

              return (
                <div style={{
                  margin: '0 8px',
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  background: theme.background.tertiary,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: topoNode.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.text.primary,
                      fontWeight: theme.fontWeight.semibold,
                    }}>
                      {topoNode.label}
                    </span>
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.text.tertiary,
                      textTransform: 'capitalize',
                    }}>
                      {topoNode.type}
                    </span>
                  </div>
                  <button
                    onClick={() => focusNode(topoNode.id)}
                    className="btn-secondary"
                    style={{
                      padding: `3px 10px`,
                      fontSize: theme.fontSize.xs,
                    }}
                  >
                    Show in Design
                  </button>
                </div>
              );
            })()}

            {/* Terminal Area - render all terminals but hide inactive ones */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '8px', position: 'relative' }}>
              {/* Render all connected terminals */}
              {connections.filter(c => c.status === 'connected').map(conn => (
                <div
                  key={conn.id}
                  style={{
                    display: conn.id === activeConnectionId ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <TerminalEmulator
                    connectionId={conn.id}
                    isVisible={conn.id === activeConnectionId}
                    zoom={getConnectionZoom(conn.id)}
                    isActive={conn.id === activeConnectionId}
                  />
                </div>
              ))}

              {/* Status messages for active connection */}
              {activeConnection && activeConnection.status === 'connecting' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.text.primary,
                  fontSize: theme.fontSize.base,
                  gap: theme.spacing.xxxl,
                }}>
                  {/* Modern Loading Spinner with Glow */}
                  <div style={{
                    filter: 'drop-shadow(0 0 15px rgba(77, 124, 254, 1)) drop-shadow(0 0 30px rgba(77, 124, 254, 0.8)) drop-shadow(0 0 50px rgba(77, 124, 254, 0.6)) drop-shadow(0 0 80px rgba(77, 124, 254, 0.4))',
                  }}>
                    <ClimbingBoxLoader color={theme.accent.blue} size={18} />
                  </div>
                  <div style={{
                    textShadow: '0 0 10px rgba(77, 124, 254, 0.5)',
                    fontWeight: theme.fontWeight.medium,
                  }}>Connecting to {activeConnection.host}...</div>
                </div>
              )}
              {activeConnection && activeConnection.status === 'error' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.accent.red,
                  fontSize: theme.fontSize.base,
                  gap: theme.spacing.md,
                }}>
                  <div>Connection failed</div>
                  <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
                    {activeConnection.error}
                  </div>
                </div>
              )}
              {activeConnection && activeConnection.status === 'disconnected' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme.text.tertiary,
                  fontSize: theme.fontSize.base,
                }}>
                  Connection closed
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.text.tertiary,
            fontSize: theme.fontSize.base,
            gap: theme.spacing.md,
          }}>
            <div style={{ marginBottom: theme.spacing.xl }}><LightningIcon size={48} color={theme.text.disabled} /></div>
            <div>No active connection selected</div>
            <div style={{ fontSize: '12px', color: theme.text.disabled }}>
              {connections.length > 0
                ? 'Select a connection from the sidebar'
                : 'Connect to a device from the Design tab'}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const conn = connections.find(c => c.id === contextMenu.connectionId);
        if (!conn) return null;

        return (
          <ConnectionContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            connectionStatus={conn.status}
            onRetry={conn.connectionType === 'local' ? undefined : handleRetry}
            onDisconnect={conn.connectionType === 'local' ? undefined : handleDisconnect}
            onRemove={handleRemove}
            onRename={handleRename}
            onOpenInExplorer={conn.connectionType === 'local' ? handleOpenInExplorer : undefined}
            onDuplicate={conn.connectionType === 'local' ? handleDuplicateLocal : undefined}
            onClose={closeContextMenu}
          />
        );
      })()}

      {/* Rename Modal */}
      {renameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={() => setRenameModal(null)}
        >
          <div
            style={{
              background: theme.background.secondary,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.xxxl,
              minWidth: '400px',
              boxShadow: theme.shadow.xl,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: `0 0 ${theme.spacing.xl} 0`,
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.text.primary,
            }}>
              Rename Connection
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('newLabel') as HTMLInputElement;
              if (input && input.value.trim()) {
                handleRenameSubmit(input.value.trim());
              }
            }}>
              <input
                type="text"
                name="newLabel"
                defaultValue={renameModal.currentName}
                autoFocus
                style={{
                  width: '100%',
                  padding: `10px ${theme.spacing.lg}`,
                  background: theme.background.tertiary,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  color: theme.text.primary,
                  fontSize: theme.fontSize.base,
                  marginBottom: theme.spacing.xl,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.select()}
              />
              <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRenameModal(null)}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    background: theme.background.hover,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.fontSize.md,
                    cursor: 'pointer',
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                    background: theme.accent.blue,
                    color: theme.text.primary,
                    border: `1px solid ${theme.accent.blueDark}`,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.fontSize.md,
                    cursor: 'pointer',
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SFTP Modal */}
      <SFTPModal isOpen={sftpModalOpen} onClose={() => setSftpModalOpen(false)} />

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConnectionsTab;
