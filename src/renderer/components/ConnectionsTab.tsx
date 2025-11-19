import React, { useState } from 'react';
import { useTabContext } from '../contexts/TabContext';
import TerminalEmulator from './TerminalEmulator';

const ConnectionsTab: React.FC = () => {
  const { connections, activeConnectionId, setActiveConnectionId, disconnectConnection } = useTabContext();
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

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

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Side Panel */}
      {!sidePanelCollapsed && (
        <div style={{
          width: '280px',
          backgroundColor: '#252526',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Side Panel Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #333',
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
              }}
              title="Collapse sidebar"
            >
              ‹
            </button>
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
                    padding: '12px 16px',
                    borderBottom: '1px solid #2d2d2d',
                    cursor: 'pointer',
                    backgroundColor: activeConnectionId === conn.id ? '#2d2d2d' : 'transparent',
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
                  {/* Node Name & Type */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
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
                    <span style={{
                      fontSize: '10px',
                      color: '#888',
                      backgroundColor: '#1e1e1e',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                    }}>
                      {conn.nodeType}
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

                  {/* Disconnect Button */}
                  {conn.status === 'connected' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        disconnectConnection(conn.id);
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '6px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Disconnect
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
            backgroundColor: '#252526',
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
          }}
          title="Expand sidebar"
        >
          ›
        </button>
      )}

      {/* Main Terminal Canvas */}
      <div style={{
        flex: 1,
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {activeConnection ? (
          <>
            {/* Terminal Header */}
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #333',
              backgroundColor: '#2d2d2d',
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

            {/* Terminal */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '8px' }}>
              {activeConnection.status === 'connected' ? (
                <TerminalEmulator connectionId={activeConnection.id} />
              ) : activeConnection.status === 'connecting' ? (
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
              ) : activeConnection.status === 'error' ? (
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
              ) : (
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
