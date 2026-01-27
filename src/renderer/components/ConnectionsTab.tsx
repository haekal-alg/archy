import React, { useState, useEffect } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';
import ConnectionContextMenu from './ConnectionContextMenu';
import SFTPModal from './SFTPModal';
import { ClimbingBoxLoader } from 'react-spinners';

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
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection, removeConnection, retryConnection, createLocalTerminal, renameConnection } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [, setForceUpdate] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);
  const [renameModal, setRenameModal] = useState<{ connectionId: string; currentName: string } | null>(null);
  const [sftpModalOpen, setSftpModalOpen] = useState(false);

  // Helper functions defined first
  const getConnectionZoom = (connectionId: string): number => {
    const stored = localStorage.getItem(`terminal-zoom-${connectionId}`);
    return stored ? parseFloat(stored) : 1.0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#16825d';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#6b7280';
      case 'error': return '#dc2626';
      default: return '#6b7280';
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

  // Effects
  useEffect(() => {
    const handleZoomUpdate = () => {
      setForceUpdate(prev => !prev);
    };

    window.addEventListener('terminal-zoom-change', handleZoomUpdate);
    return () => window.removeEventListener('terminal-zoom-change', handleZoomUpdate);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Side Panel - Always rendered for animation */}
      <div style={{
        width: sidePanelCollapsed ? '0px' : '320px',
        background: '#151923',
        borderRight: sidePanelCollapsed ? 'none' : '1px solid #3a4556',
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
          padding: '12px 16px',
          borderBottom: '1px solid #3a4556',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: '#151923',
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
              fontSize: '13px',
              fontWeight: 600,
              color: '#e8ecf4',
            }}>
              Active Connections
            </h3>
          </div>

          {/* Action Buttons Container */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* New Local Terminal Button */}
            <button
              onClick={() => createLocalTerminal()}
              style={{
                padding: '6px 10px',
                background: '#303948',
                color: '#e8ecf4',
                border: '1px solid #3a4556',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.3px',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3a4556';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#303948';
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
                padding: '6px 10px',
                background: '#303948',
                color: '#e8ecf4',
                border: '1px solid #3a4556',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.3px',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3a4556';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#303948';
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
          padding: '16px',
        }}>
          {connections.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              background: '#252d3f',
              border: '1px solid #3a4556',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔌</div>
              <div style={{ fontSize: '11px', color: '#b4bcc9', marginBottom: '4px' }}>
                No active connections
              </div>
              <div style={{ fontSize: '10px', color: '#8892a6' }}>
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
                  marginBottom: '8px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: activeConnectionId === conn.id ? '#1e2433' : '#252d3f',
                  border: activeConnectionId === conn.id ? '1px solid #4d7cfe' : '1px solid #3a4556',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = '#303948';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = '#252d3f';
                  }
                }}
              >
                {/* Node Name / Custom Label with Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  paddingRight: conn.status === 'connected' ? '32px' : '0',
                }}>
                  <span style={{ color: conn.connectionType === 'local' ? '#3dd68c' : '#4d7cfe' }}>
                    {conn.connectionType === 'local' ? <LocalTerminalIcon /> : <RemoteSSHIcon />}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#e8ecf4',
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
                  fontSize: '10px',
                  color: '#8892a6',
                  marginBottom: '8px',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  background: '#2a3347',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4556',
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
                    gap: '6px',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: conn.status === 'connected'
                        ? '#3dd68c'
                        : conn.status === 'connecting'
                          ? '#ffab40'
                          : conn.status === 'error'
                            ? '#ff5c5c'
                            : '#6b7280',
                      display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: conn.status === 'connected' ? '#3dd68c' : '#b4bcc9',
                    }}>
                      {getStatusText(conn.status)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    color: '#8892a6',
                    fontWeight: 500,
                  }}>
                    {formatLastActivity(conn.lastActivity)}
                  </span>
                </div>

                {/* Error Message */}
                {conn.error && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '10px',
                    color: '#ff7878',
                    background: '#2a3347',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ff5c5c',
                    lineHeight: '1.4',
                  }}>
                    {conn.error}
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
                      top: '12px',
                      right: '12px',
                      width: '18px',
                      height: '18px',
                      padding: '0',
                      background: '#303948',
                      color: '#8892a6',
                      border: '1px solid #3a4556',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      lineHeight: '1',
                      transition: 'all 0.2s ease',
                    }}
                    title="Disconnect and Remove"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ff5c5c';
                      e.currentTarget.style.color = '#0a0e1a';
                      e.currentTarget.style.border = '1px solid #e84545';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#303948';
                      e.currentTarget.style.color = '#8892a6';
                      e.currentTarget.style.border = '1px solid #3a4556';
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
        style={{
          position: 'absolute',
          left: sidePanelCollapsed ? '0' : '290px', // Inside sidebar when expanded
          top: '10px', // Aligned with header
          width: '30px',
          height: '40px', // Smaller height to fit header
          border: '1px solid rgba(255, 255, 255, 0.25)',
          // Dynamic borders based on state
          borderRight: sidePanelCollapsed ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
          borderLeft: sidePanelCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
          borderTopRightRadius: sidePanelCollapsed ? '8px' : '0',
          borderBottomRightRadius: sidePanelCollapsed ? '8px' : '0',
          borderTopLeftRadius: sidePanelCollapsed ? '0' : '8px',
          borderBottomLeftRadius: sidePanelCollapsed ? '0' : '8px',

          background: 'rgba(30, 33, 51, 0.65)',
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          color: '#e8ecf4',
          cursor: 'pointer',
          fontSize: '18px',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(40, 44, 68, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30, 33, 51, 0.65)';
        }}
      >
        {sidePanelCollapsed ? '›' : '‹'}
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
              padding: '8px 16px',
              borderBottom: '1px solid #333',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '13px',
                color: '#e0e0e0',
                fontFamily: 'Consolas, monospace',
              }}>
                {activeConnection.username}@{activeConnection.host} — {activeConnection.customLabel || activeConnection.nodeName}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                {/* Latency Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: '#252d3f',
                  borderRadius: '4px',
                  border: '1px solid #3a4556',
                }}>
                  {activeConnection.latency !== undefined ? (
                    <>
                      <span style={{
                        fontSize: '14px',
                      }}>
                        {activeConnection.latency < 100 ? '🟢' : activeConnection.latency < 300 ? '🟡' : '🔴'}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: activeConnection.latency < 100 ? '#3dd68c' : activeConnection.latency < 300 ? '#ffab40' : '#ff5c5c',
                        fontWeight: 500,
                        fontFamily: 'Consolas, monospace',
                        minWidth: '45px',
                      }}>
                        {activeConnection.latency}ms
                      </span>
                    </>
                  ) : (
                    <span style={{
                      fontSize: '12px',
                      color: '#666',
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
                  gap: '8px',
                }}>
                  <button
                    onClick={() => handleZoomChange(activeConnection.id, -0.1)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      lineHeight: '1',
                      transition: 'background-color 0.2s ease',
                    }}
                    title="Zoom out"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  >
                    −
                  </button>
                  <span style={{
                    fontSize: '12px',
                    color: '#aaa',
                    minWidth: '45px',
                    textAlign: 'center',
                  }}>
                    {Math.round(activeZoom * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoomChange(activeConnection.id, 0.1)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      lineHeight: '1',
                      transition: 'background-color 0.2s ease',
                    }}
                    title="Zoom in"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#e8ecf4',
                  fontSize: '14px',
                  gap: '24px',
                }}>
                  {/* Modern Loading Spinner with Glow */}
                  <div style={{
                    filter: 'drop-shadow(0 0 15px rgba(77, 124, 254, 1)) drop-shadow(0 0 30px rgba(77, 124, 254, 0.8)) drop-shadow(0 0 50px rgba(77, 124, 254, 0.6)) drop-shadow(0 0 80px rgba(77, 124, 254, 0.4))',
                  }}>
                    <ClimbingBoxLoader color="#4d7cfe" size={18} />
                  </div>
                  <div style={{
                    textShadow: '0 0 10px rgba(77, 124, 254, 0.5)',
                    fontWeight: 500,
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
                  color: '#dc2626',
                  fontSize: '14px',
                  gap: '8px',
                }}>
                  <div>Connection failed</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
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
                  color: '#888',
                  fontSize: '14px',
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
            color: '#888',
            fontSize: '14px',
            gap: '8px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <div>No active connection selected</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
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
              background: '#1e2433',
              border: '1px solid #3a4556',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#e8ecf4',
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
                  padding: '10px 12px',
                  background: '#252d3f',
                  border: '1px solid #3a4556',
                  borderRadius: '4px',
                  color: '#e8ecf4',
                  fontSize: '14px',
                  marginBottom: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.select()}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRenameModal(null)}
                  style={{
                    padding: '8px 16px',
                    background: '#303948',
                    color: '#e8ecf4',
                    border: '1px solid #3a4556',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#4d7cfe',
                    color: '#e8ecf4',
                    border: '1px solid #3461e8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
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
