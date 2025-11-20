import React, { useState, useEffect } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [, setForceUpdate] = useState(false);

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
      .forEach(c => disconnectConnection(c.id));
  };

  const handleZoomChange = (connectionId: string, delta: number) => {
    const currentZoom = getConnectionZoom(connectionId);
    // Allow zoom from 0.5 (50%) to 2.0 (200%)
    const newZoom = Math.max(0.5, Math.min(2.0, currentZoom + delta));

    localStorage.setItem(`terminal-zoom-${connectionId}`, newZoom.toString());
    window.dispatchEvent(new CustomEvent('terminal-zoom-change', { detail: { connectionId, zoom: newZoom } }));
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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Side Panel - Always rendered for animation */}
      <div style={{
        width: sidePanelCollapsed ? '0px' : '300px',
        opacity: sidePanelCollapsed ? 0 : 1,
        background: 'linear-gradient(180deg, #1e1e1e 0%, #181818 100%)',
        borderRight: sidePanelCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}>
        {/* Subtle gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Side Panel Header */}
        <div style={{
          minWidth: '300px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#a8a8a8',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              background: 'linear-gradient(135deg, #e0e0e0 0%, #a0a0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Active Connections
            </div>
            <button
              onClick={() => setSidePanelCollapsed(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: '#888',
                cursor: 'pointer',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                lineHeight: '1',
              }}
              title="Collapse sidebar"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ‹
            </button>
          </div>
          {connections.some(c => c.status === 'disconnected' || c.status === 'error') && (
            <button
              onClick={clearDisconnected}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600',
                letterSpacing: '0.3px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
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
          minWidth: '300px',
          position: 'relative',
          zIndex: 1,
        }}>
          {connections.length === 0 ? (
            <div style={{
              padding: '40px 24px',
              textAlign: 'center',
              color: '#888',
              fontSize: '13px',
              lineHeight: '1.6',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>⚡</div>
              <div style={{ marginBottom: '4px', color: '#aaa' }}>No active connections</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Connect to a device from the Design tab</div>
            </div>
          ) : (
            connections.map(conn => (
              <div
                key={conn.id}
                onClick={() => setActiveConnectionId(conn.id)}
                style={{
                  position: 'relative',
                  margin: '8px 12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: activeConnectionId === conn.id
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: activeConnectionId === conn.id
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeConnectionId === conn.id
                    ? '0 4px 16px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeConnectionId !== conn.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {/* Node Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                  paddingRight: conn.status === 'connected' ? '32px' : '0',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#f0f0f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    letterSpacing: '0.2px',
                  }}>
                    {conn.nodeName}
                  </span>
                </div>

                {/* Connection Details */}
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginBottom: '10px',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
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
                    gap: '8px',
                  }}>
                    <span style={{
                      position: 'relative',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: conn.status === 'connected'
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : conn.status === 'connecting'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : conn.status === 'error'
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : '#6b7280',
                      display: 'inline-block',
                      boxShadow: conn.status === 'connected'
                        ? '0 0 12px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        : conn.status === 'connecting'
                          ? '0 0 12px rgba(245, 158, 11, 0.6)'
                          : '0 0 8px rgba(107, 114, 128, 0.4)',
                      animation: conn.status === 'connected' ? 'pulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: conn.status === 'connected' ? '#10b981' : '#aaa',
                      letterSpacing: '0.3px',
                    }}>
                      {getStatusText(conn.status)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    fontWeight: '500',
                  }}>
                    {formatLastActivity(conn.lastActivity)}
                  </span>
                </div>

                {/* Error Message */}
                {conn.error && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '10px',
                    color: '#fca5a5',
                    background: 'rgba(220, 38, 38, 0.15)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
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
                      width: '24px',
                      height: '24px',
                      padding: '0',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      lineHeight: '1',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    }}
                    title="Disconnect"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                      e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)';
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add keyframe animation style */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>

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
