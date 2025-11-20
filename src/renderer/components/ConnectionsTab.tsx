import React, { useState } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

  const clearDisconnected = () => {
    connections
      .filter(c => c.status === 'disconnected' || c.status === 'error')
      .forEach(c => disconnectConnection(c.id));
  };

  const handleZoomChange = (connectionId: string, delta: number) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      const currentZoom = connection.zoom || 1.0;
      const newZoom = Math.max(0.5, Math.min(2.0, currentZoom + delta));

      // Update the zoom in the connection (we'll need to add a method for this in TabContext)
      // For now, we'll use a workaround by storing it in localStorage
      localStorage.setItem(`terminal-zoom-${connectionId}`, newZoom.toString());
      // Force a re-render by updating the connection
      window.dispatchEvent(new CustomEvent('terminal-zoom-change', { detail: { connectionId, zoom: newZoom } }));
    }
  };

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

  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const activeZoom = activeConnectionId ? getConnectionZoom(activeConnectionId) : 1.0;

  // Listen for zoom changes
  React.useEffect(() => {
    const handleZoomChange = () => {
      // Force re-render when zoom changes
      setState(prev => !prev);
    };

    window.addEventListener('terminal-zoom-change', handleZoomChange as any);
    return () => window.removeEventListener('terminal-zoom-change', handleZoomChange as any);
  }, []);

  const [, setState] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Side Panel - Styled to match Design Tab but without glossiness */}
      {!sidePanelCollapsed && (
        <div style={{
          width: '280px',
          background: '#252526',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Side Panel Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#252526',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#cccccc',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Active Connections
              </div>
              <button
                onClick={() => setSidePanelCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '18px',
                  transition: 'color 0.2s ease',
                }}
                title="Collapse sidebar"
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
              >
                ‹
              </button>
            </div>
            {connections.some(c => c.status === 'disconnected' || c.status === 'error') && (
              <button
                onClick={clearDisconnected}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Clear Disconnected
              </button>
            )}
          </div>

          {/* Connections List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {connections.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '13px',
              }}>
                No active connections.<br />
                Connect to a device from the Design tab.
              </div>
            ) : (
              connections.map(conn => (
                <div
                  key={conn.id}
                  onClick={() => setActiveConnectionId(conn.id)}
                  style={{
                    position: 'relative',
                    padding: '12px 16px',
                    borderBottom: '1px solid #2d2d2d',
                    cursor: 'pointer',
                    backgroundColor: activeConnectionId === conn.id ? '#37373d' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeConnectionId !== conn.id) {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConnectionId !== conn.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Node Name */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    paddingRight: conn.status === 'connected' ? '28px' : '0',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#e0e0e0',
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
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '6px',
                    fontFamily: 'Consolas, monospace',
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
                        backgroundColor: getStatusColor(conn.status),
                        display: 'inline-block',
                      }} />
                      <span style={{
                        fontSize: '11px',
                        color: '#aaa',
                      }}>
                        {getStatusText(conn.status)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#777',
                    }}>
                      {formatLastActivity(conn.lastActivity)}
                    </span>
                  </div>

                  {/* Error Message */}
                  {conn.error && (
                    <div style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      color: '#dc2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      padding: '4px 6px',
                      borderRadius: '3px',
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
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        padding: '0',
                        backgroundColor: 'rgba(220, 38, 38, 0.8)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        lineHeight: '1',
                        transition: 'background-color 0.2s ease',
                      }}
                      title="Disconnect"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.8)'}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Collapse Button (when collapsed) */}
      {sidePanelCollapsed && (
        <button
          onClick={() => setSidePanelCollapsed(false)}
          style={{
            width: '32px',
            background: '#252526',
            borderRight: '1px solid #333',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            writingMode: 'vertical-rl',
            padding: '12px 0',
            transition: 'all 0.2s ease',
          }}
          title="Expand sidebar"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.background = '#252526';
          }}
        >
          ›
        </button>
      )}

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

                {/* Status Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(activeConnection.status),
                  }} />
                  <span style={{
                    fontSize: '12px',
                    color: '#aaa',
                  }}>
                    {getStatusText(activeConnection.status)}
                  </span>
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#888',
                  fontSize: '14px',
                }}>
                  Connecting to {activeConnection.host}...
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
    </div>
  );
};

export default ConnectionsTab;
