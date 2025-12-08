import React, { useState, useEffect } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';
import ConnectionContextMenu from './ConnectionContextMenu';

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection, removeConnection, retryConnection } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [, setForceUpdate] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);

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
  const clearDisconnected = () => {
    connections
      .filter(c => c.status === 'disconnected' || c.status === 'error')
      .forEach(c => removeConnection(c.id));
  };

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
          padding: '16px 20px',
          borderBottom: '1px solid #3a4556',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
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
              fontSize: '14px',
              fontWeight: 600,
              color: '#e8ecf4',
            }}>
              Active Connections
            </h3>
          </div>
          {connections.some(c => c.status === 'disconnected' || c.status === 'error') && (
            <button
              onClick={clearDisconnected}
              style={{
                padding: '8px 12px',
                background: '#ff5c5c',
                color: '#0a0e1a',
                border: '1px solid #e84545',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e84545';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ff5c5c';
              }}
            >
              Clear Disconnected
            </button>
          )}
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
                {/* Node Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  paddingRight: conn.status === 'connected' ? '32px' : '0',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#e8ecf4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {conn.nodeName}
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

                {/* Disconnect X Button */}
                {conn.status === 'connected' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectConnection(conn.id);
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
                    title="Disconnect"
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
                {activeConnection.username}@{activeConnection.host} — {activeConnection.nodeName}
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
                  color: '#b4bcc9',
                  fontSize: '14px',
                  gap: '16px',
                }}>
                  {/* Loading Spinner */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #252d3f',
                    borderTop: '4px solid #4d7cfe',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div>Connecting to {activeConnection.host}...</div>
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
            onRetry={handleRetry}
            onDisconnect={handleDisconnect}
            onRemove={handleRemove}
            onClose={closeContextMenu}
          />
        );
      })()}

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
