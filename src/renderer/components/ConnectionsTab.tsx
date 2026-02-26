import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';
import ConnectionContextMenu from './ConnectionContextMenu';
const SFTPModal = React.lazy(() => import('./SFTPModal'));
import { ClimbingBoxLoader } from 'react-spinners';
import { PlugIcon, LatencyDot, LightningIcon } from './StatusIcons';
import { mapErrorMessage } from '../utils/errorMessages';
import { useConfirm } from '../hooks/useConfirm';
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

// Isolated component that subscribes to ref-based countdown updates
// Only this component re-renders every second, not the entire ConnectionsTab
const ReconnectCountdown: React.FC<{ connectionId: string }> = ({ connectionId }) => {
  const { subscribeReconnectUpdates, getReconnectCountdown } = useTabContext();
  const [countdown, setCountdown] = useState<number | undefined>(() => getReconnectCountdown(connectionId));

  useEffect(() => {
    const unsubscribe = subscribeReconnectUpdates(() => {
      setCountdown(getReconnectCountdown(connectionId));
    });
    return unsubscribe;
  }, [connectionId, subscribeReconnectUpdates, getReconnectCountdown]);

  if (countdown === undefined) return null;

  return (
    <span>{Math.ceil(countdown / 1000)}s</span>
  );
};

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection, removeConnection, retryConnection, createLocalTerminal, renameConnection, cancelAutoReconnect, topologyNodes, focusNode } = useTabContext();
  const { confirm, ConfirmContainer } = useConfirm();
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
      case 'connected': return theme.status.success;
      case 'connecting': return theme.status.warning;
      case 'disconnected': return theme.text.disabled;
      case 'error': return theme.status.error;
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

  const handleDisconnect = async () => {
    if (contextMenu) {
      const conn = connections.find(c => c.id === contextMenu.connectionId);
      const name = conn?.customLabel || conn?.nodeName || 'this connection';
      closeContextMenu();
      if (conn?.status === 'connected') {
        const confirmed = await confirm({
          title: 'Disconnect Session?',
          message: `This will terminate the active session to ${name}.`,
          confirmLabel: 'Disconnect',
          destructive: true,
        });
        if (!confirmed) return;
      }
      disconnectConnection(contextMenu.connectionId);
    }
  };

  const handleRemove = async () => {
    if (contextMenu) {
      const conn = connections.find(c => c.id === contextMenu.connectionId);
      const name = conn?.customLabel || conn?.nodeName || 'this connection';
      closeContextMenu();
      if (conn?.status === 'connected') {
        const confirmed = await confirm({
          title: 'Remove Connection?',
          message: `This will disconnect and remove ${name}. The terminal session will be lost.`,
          confirmLabel: 'Remove',
          destructive: true,
        });
        if (!confirmed) return;
      }
      removeConnection(contextMenu.connectionId);
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
      <aside aria-label="Active connections" style={{
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
              borderRadius: theme.radius.lg,
            }}>
              <div style={{ marginBottom: theme.spacing.xl }}><PlugIcon size={40} color={theme.text.disabled} /></div>
              <div style={{ fontSize: theme.fontSize.base, color: theme.text.secondary, marginBottom: theme.spacing.md, fontWeight: theme.fontWeight.medium }}>
                No active connections
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.text.tertiary, marginBottom: theme.spacing.xxl, lineHeight: '1.5' }}>
                Add a device on the Design tab, then<br />right-click to connect via SSH or RDP.
              </div>
              <button
                onClick={() => createLocalTerminal()}
                className="btn-ghost"
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  <path d="M3 5L5 7L3 9M6 9H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Open Local Terminal
              </button>
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
                    <span
                      className={`status-dot status-dot--${conn.status}`}
                    />
                    <span style={{
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: conn.status === 'connected' ? theme.status.success : theme.text.secondary,
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
                {conn.error && !conn.reconnectState && (() => {
                  const mapped = mapErrorMessage(conn.error);
                  return (
                    <div style={{
                      marginTop: theme.spacing.md,
                      background: theme.background.elevated,
                      padding: `${theme.spacing.md}`,
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${theme.accent.red}`,
                      lineHeight: '1.4',
                    }}>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.accent.redLight,
                        fontWeight: theme.fontWeight.medium,
                        marginBottom: '2px',
                      }}>
                        {mapped.title}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.text.tertiary,
                      }}>
                        {mapped.suggestion}
                      </div>
                    </div>
                  );
                })()}

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
                      Next attempt in <ReconnectCountdown connectionId={conn.id} />
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
                    className="btn-danger-ghost"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const name = conn.customLabel || conn.nodeName;
                      const confirmed = await confirm({
                        title: 'Remove Connection?',
                        message: `This will disconnect and remove ${name}.`,
                        confirmLabel: 'Remove',
                        destructive: true,
                      });
                      if (confirmed) removeConnection(conn.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: theme.spacing.md,
                      right: theme.spacing.md,
                      width: '28px',
                      height: '28px',
                      padding: '0',
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: theme.fontWeight.semibold,
                      lineHeight: '1',
                    }}
                    title="Disconnect and Remove"
                    aria-label={`Remove connection ${conn.customLabel || conn.nodeName}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </aside>

      {/* Unified Toggle Button */}
      <button
        onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)}
        className="panel-glass"
        aria-label={sidePanelCollapsed ? 'Show connections panel' : 'Hide connections panel'}
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
      <main style={{
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
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                minWidth: 0,
              }}>
                {/* Topology color dot */}
                {(() => {
                  const topoNode = activeConnection.nodeId
                    ? topologyNodes.find(n => n.id === activeConnection.nodeId)
                    : null;
                  if (activeConnection.connectionType === 'local') {
                    return <LocalTerminalIcon />;
                  }
                  if (topoNode) {
                    return (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: topoNode.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                    );
                  }
                  return null;
                })()}
                <span style={{
                  fontSize: theme.fontSize.md,
                  color: theme.text.primary,
                  fontFamily: 'Consolas, monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {activeConnection.connectionType === 'local'
                    ? (activeConnection.customLabel || 'Local Terminal')
                    : `${activeConnection.username}@${activeConnection.host} — ${activeConnection.customLabel || activeConnection.nodeName}`
                  }
                </span>
                {/* Show in Design button */}
                {activeConnection.nodeId && topologyNodes.find(n => n.id === activeConnection.nodeId) && (
                  <button
                    onClick={() => focusNode(activeConnection.nodeId!)}
                    style={{
                      padding: `2px 8px`,
                      fontSize: theme.fontSize.xs,
                      background: theme.background.tertiary,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.xs,
                      color: theme.text.secondary,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: theme.transition.normal,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.background.hover;
                      e.currentTarget.style.color = theme.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.background.tertiary;
                      e.currentTarget.style.color = theme.text.secondary;
                    }}
                  >
                    Show in Design
                  </button>
                )}
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
                    aria-label="Zoom out terminal text"
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
                    aria-label="Zoom in terminal text"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.background.active}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.background.hover}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

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
                  height: '100%',
                }}>
                  {/* Skeleton terminal lines */}
                  <div className="terminal-skeleton" style={{ flex: 1, opacity: 0.3 }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div
                        key={i}
                        className="terminal-skeleton-line"
                        style={{
                          width: `${30 + Math.random() * 50}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Centered connecting message overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.xxxl,
                  }}>
                    <div style={{
                      filter: 'drop-shadow(0 0 15px rgba(77, 124, 254, 1)) drop-shadow(0 0 30px rgba(77, 124, 254, 0.8)) drop-shadow(0 0 50px rgba(77, 124, 254, 0.6))',
                    }}>
                      <ClimbingBoxLoader color={theme.accent.blue} size={18} />
                    </div>
                    <div style={{
                      color: theme.text.primary,
                      fontSize: theme.fontSize.base,
                      textShadow: '0 0 10px rgba(77, 124, 254, 0.5)',
                      fontWeight: theme.fontWeight.medium,
                    }}>
                      Connecting to {activeConnection.host}...
                    </div>
                  </div>
                </div>
              )}
              {activeConnection && activeConnection.status === 'error' && (() => {
                const mapped = mapErrorMessage(activeConnection.error || 'Connection failed');
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: theme.spacing.lg,
                    padding: theme.spacing.xxxl,
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: theme.status.errorBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      marginBottom: theme.spacing.md,
                    }}>
                      &#9888;
                    </div>
                    <div style={{
                      color: theme.status.error,
                      fontSize: theme.fontSize.lg,
                      fontWeight: theme.fontWeight.semibold,
                    }}>
                      {mapped.title}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.md,
                      color: theme.text.tertiary,
                      textAlign: 'center',
                      maxWidth: '400px',
                      lineHeight: '1.5',
                    }}>
                      {mapped.suggestion}
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => retryConnection(activeConnection.id)}
                      style={{
                        marginTop: theme.spacing.md,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                      }}
                    >
                      Retry Connection
                    </button>
                  </div>
                );
              })()}
              {activeConnection && activeConnection.status === 'disconnected' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: theme.spacing.lg,
                }}>
                  <div style={{ color: theme.text.tertiary, fontSize: theme.fontSize.base }}>
                    Connection closed
                  </div>
                  {activeConnection.connectionType !== 'local' && (
                    <button
                      className="btn-ghost"
                      onClick={() => retryConnection(activeConnection.id)}
                      style={{
                        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                        borderRadius: theme.radius.sm,
                        fontSize: theme.fontSize.sm,
                      }}
                    >
                      Reconnect
                    </button>
                  )}
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
      </main>

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
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rename connection"
          style={{
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
          onKeyDown={(e) => {
            if (e.key === 'Escape') setRenameModal(null);
          }}
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
      <React.Suspense fallback={null}>
        <SFTPModal isOpen={sftpModalOpen} onClose={() => setSftpModalOpen(false)} />
      </React.Suspense>

      {/* Confirm Dialog */}
      <ConfirmContainer />

    </div>
  );
};

export default ConnectionsTab;
