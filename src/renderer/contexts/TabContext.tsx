import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { TabType, SSHConnection, TabContextType, SSHPortForward, DisconnectReason, TopologyNodeInfo } from '../types/terminal';
import { cleanupTerminal } from '../components/TerminalEmulator';

const TabContext = createContext<TabContextType | undefined>(undefined);

// Connection timeout in milliseconds (30 seconds)
const CONNECTION_TIMEOUT_MS = 30000;

// Auto-reconnect configuration
const RECONNECT_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within TabProvider');
  }
  return context;
};

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('design');
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);

  // Topology cross-reference
  const [topologyNodes, setTopologyNodes] = useState<TopologyNodeInfo[]>([]);
  const onFocusNodeRef = useRef<((nodeId: string) => void) | undefined>(undefined);

  const focusNode = useCallback((nodeId: string) => {
    setActiveTab('design');
    setTimeout(() => {
      onFocusNodeRef.current?.(nodeId);
    }, 100);
  }, []);

  const setOnFocusNode = useCallback((handler: (nodeId: string) => void) => {
    onFocusNodeRef.current = handler;
  }, []);

  // Track connection timeouts to prevent memory leaks
  const connectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track auto-reconnect timers and intervals
  const reconnectTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to clear connection timeout
  const clearConnectionTimeout = useCallback((connectionId: string) => {
    const timeout = connectionTimeouts.current.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      connectionTimeouts.current.delete(connectionId);
    }
  }, []);

  const createConnection = useCallback(async (config: {
    nodeId?: string;
    nodeName: string;
    nodeType: string;
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath?: string;
    portForwards?: SSHPortForward[];
  }) => {
    // Validate required fields
    if (!config.host || !config.host.trim()) {
      console.error('[TabContext] Connection failed: host is required');
      return;
    }
    if (!config.username || !config.username.trim()) {
      console.error('[TabContext] Connection failed: username is required');
      return;
    }
    if (config.port <= 0 || config.port > 65535) {
      console.error('[TabContext] Connection failed: invalid port');
      return;
    }

    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newConnection: SSHConnection = {
      id: connectionId,
      nodeId: config.nodeId,
      nodeName: config.nodeName,
      nodeType: config.nodeType,
      host: config.host,
      port: config.port,
      username: config.username,
      status: 'connecting',
      lastActivity: new Date(),
      password: config.password,
      privateKeyPath: config.privateKeyPath,
      portForwards: config.portForwards,
      connectionType: 'ssh',
    };

    setConnections(prev => [...prev, newConnection]);
    setActiveConnectionId(connectionId);
    setActiveTab('connections');

    // Set up connection timeout
    const timeoutId = setTimeout(() => {
      setConnections(prev => {
        const conn = prev.find(c => c.id === connectionId);
        if (conn && conn.status === 'connecting') {
          console.warn(`[TabContext] Connection timeout for ${connectionId}`);
          // Cleanup terminal and close session
          cleanupTerminal(connectionId);
          window.electron.closeSSHSession(connectionId);
          return prev.map(c =>
            c.id === connectionId
              ? { ...c, status: 'error', error: 'Connection timeout', lastActivity: new Date() }
              : c
          );
        }
        return prev;
      });
      connectionTimeouts.current.delete(connectionId);
    }, CONNECTION_TIMEOUT_MS);

    connectionTimeouts.current.set(connectionId, timeoutId);

    try {
      await window.electron.createSSHSession({
        connectionId,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKeyPath: config.privateKeyPath,
        portForwards: config.portForwards,
      });

      // Clear timeout on success
      clearConnectionTimeout(connectionId);

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'connected', lastActivity: new Date() }
            : conn
        )
      );
    } catch (error) {
      // Clear timeout on error
      clearConnectionTimeout(connectionId);

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'error', error: error instanceof Error ? error.message : 'Connection failed', lastActivity: new Date() }
            : conn
        )
      );
    }
  }, [clearConnectionTimeout]);

  const createLocalTerminal = useCallback(async (cwd?: string) => {
    const connectionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const terminalNumber = connections.filter(c => c.connectionType === 'local').length + 1;

    const newConnection: SSHConnection = {
      id: connectionId,
      nodeName: `Local Terminal ${terminalNumber}`,
      nodeType: 'local',
      host: 'localhost',
      port: 0,
      username: 'local',
      status: 'connecting',
      lastActivity: new Date(),
      connectionType: 'local',
    };

    setConnections(prev => [...prev, newConnection]);
    setActiveConnectionId(connectionId);
    setActiveTab('connections');

    try {
      await window.electron.createLocalTerminal({ connectionId, cwd });

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'connected', lastActivity: new Date() }
            : conn
        )
      );
    } catch (error) {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'error', error: error instanceof Error ? error.message : 'Failed to create terminal', lastActivity: new Date() }
            : conn
        )
      );
    }
  }, [connections]);

  const renameConnection = useCallback((id: string, newLabel: string) => {
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? { ...conn, customLabel: newLabel, lastActivity: new Date() }
          : conn
      )
    );
  }, []);

  const disconnectConnection = useCallback((id: string) => {
    // Clear any pending timeout
    clearConnectionTimeout(id);

    // Cancel any active auto-reconnect
    const reconnectTimer = reconnectTimers.current.get(id);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimers.current.delete(id);
    }
    const reconnectInterval = reconnectIntervals.current.get(id);
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectIntervals.current.delete(id);
    }

    // Close SSH session
    window.electron.closeSSHSession(id);

    // Cleanup terminal but keep connection in list
    cleanupTerminal(id);

    // Update status to disconnected and clear reconnect state
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? { ...conn, status: 'disconnected', reconnectState: undefined, lastActivity: new Date() }
          : conn
      )
    );

    // If this was the active connection, switch to another connected one
    if (activeConnectionId === id) {
      const remainingConnections = connections.filter(c => c.id !== id && c.status === 'connected');
      setActiveConnectionId(remainingConnections.length > 0 ? remainingConnections[0].id : null);
    }
  }, [activeConnectionId, connections, clearConnectionTimeout]);

  const removeConnection = useCallback((id: string) => {
    // Clear any pending timeout
    clearConnectionTimeout(id);

    // Close SSH session
    window.electron.closeSSHSession(id);

    // Completely remove and cleanup terminal
    cleanupTerminal(id);
    setConnections(prev => prev.filter(c => c.id !== id));

    // If this was the active connection, switch to another connected one
    if (activeConnectionId === id) {
      const remainingConnections = connections.filter(c => c.id !== id && c.status === 'connected');
      setActiveConnectionId(remainingConnections.length > 0 ? remainingConnections[0].id : null);
    }
  }, [activeConnectionId, connections, clearConnectionTimeout]);

  const retryConnection = useCallback(async (id: string) => {
    const connection = connections.find(c => c.id === id);
    if (!connection) return;

    // Cleanup old terminal if exists
    cleanupTerminal(id);

    // Reset to connecting state
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? { ...conn, status: 'connecting', error: undefined, lastActivity: new Date() }
          : conn
      )
    );

    // Set as active connection
    setActiveConnectionId(id);
    setActiveTab('connections');

    try {
      await window.electron.createSSHSession({
        connectionId: id,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password || '',
        privateKeyPath: connection.privateKeyPath,
        portForwards: connection.portForwards,
      });

      setConnections(prev =>
        prev.map(conn =>
          conn.id === id
            ? { ...conn, status: 'connected', lastActivity: new Date() }
            : conn
        )
      );
    } catch (error) {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === id
            ? { ...conn, status: 'error', error: error instanceof Error ? error.message : 'Connection failed', lastActivity: new Date() }
            : conn
        )
      );
    }
  }, [connections]);

  // Calculate exponential backoff delay for reconnect attempts
  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = RECONNECT_CONFIG.initialDelayMs * Math.pow(RECONNECT_CONFIG.backoffMultiplier, attempt - 1);
    return Math.min(delay, RECONNECT_CONFIG.maxDelayMs);
  }, []);

  // Cancel auto-reconnect for a connection
  const cancelAutoReconnect = useCallback((connectionId: string) => {
    // Clear reconnect timer
    const timer = reconnectTimers.current.get(connectionId);
    if (timer) {
      clearTimeout(timer);
      reconnectTimers.current.delete(connectionId);
    }

    // Clear countdown interval
    const interval = reconnectIntervals.current.get(connectionId);
    if (interval) {
      clearInterval(interval);
      reconnectIntervals.current.delete(connectionId);
    }

    // Update connection state to disconnected without reconnect state
    setConnections(prev =>
      prev.map(conn =>
        conn.id === connectionId
          ? { ...conn, status: 'disconnected', reconnectState: undefined }
          : conn
      )
    );
  }, []);

  // Execute a reconnect attempt
  const executeReconnectAttempt = useCallback(async (connectionId: string, attempt: number) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !connection.reconnectState?.isReconnecting) {
      return;
    }

    // Don't reconnect local terminals
    if (connection.connectionType === 'local') {
      cancelAutoReconnect(connectionId);
      return;
    }

    console.log(`[TabContext] Auto-reconnect attempt ${attempt}/${RECONNECT_CONFIG.maxAttempts} for ${connectionId}`);

    try {
      // Cleanup old terminal
      cleanupTerminal(connectionId);

      await window.electron.createSSHSession({
        connectionId,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password || '',
        privateKeyPath: connection.privateKeyPath,
        portForwards: connection.portForwards,
      });

      // Success - clear reconnect state
      console.log(`[TabContext] Auto-reconnect successful for ${connectionId}`);
      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: 'connected', reconnectState: undefined, lastActivity: new Date() }
            : conn
        )
      );
    } catch (error) {
      console.error(`[TabContext] Auto-reconnect attempt ${attempt} failed:`, error);

      if (attempt < RECONNECT_CONFIG.maxAttempts) {
        // Schedule next attempt
        const nextDelay = getReconnectDelay(attempt + 1);

        setConnections(prev =>
          prev.map(conn =>
            conn.id === connectionId && conn.reconnectState
              ? {
                  ...conn,
                  reconnectState: {
                    ...conn.reconnectState,
                    attemptNumber: attempt + 1,
                    nextAttemptIn: nextDelay,
                  },
                }
              : conn
          )
        );

        // Start countdown interval for UI
        const countdownInterval = setInterval(() => {
          setConnections(prev =>
            prev.map(conn => {
              if (conn.id === connectionId && conn.reconnectState) {
                const newNextAttemptIn = Math.max(0, conn.reconnectState.nextAttemptIn - 1000);
                return {
                  ...conn,
                  reconnectState: { ...conn.reconnectState, nextAttemptIn: newNextAttemptIn },
                };
              }
              return conn;
            })
          );
        }, 1000);
        reconnectIntervals.current.set(connectionId, countdownInterval);

        // Schedule the actual reconnect
        const timer = setTimeout(() => {
          // Clear countdown interval before attempting
          const interval = reconnectIntervals.current.get(connectionId);
          if (interval) {
            clearInterval(interval);
            reconnectIntervals.current.delete(connectionId);
          }
          executeReconnectAttempt(connectionId, attempt + 1);
        }, nextDelay);
        reconnectTimers.current.set(connectionId, timer);
      } else {
        // Max attempts reached
        console.warn(`[TabContext] Auto-reconnect max attempts reached for ${connectionId}`);
        setConnections(prev =>
          prev.map(conn =>
            conn.id === connectionId
              ? {
                  ...conn,
                  status: 'error',
                  error: 'Auto-reconnect failed after max attempts',
                  reconnectState: undefined,
                }
              : conn
          )
        );
      }
    }
  }, [connections, getReconnectDelay, cancelAutoReconnect]);

  // Start auto-reconnect process for a connection
  const startAutoReconnect = useCallback((connectionId: string, reason: DisconnectReason) => {
    // Don't retry for auth failures or user-initiated disconnects
    if (reason === 'auth' || reason === 'user') {
      console.log(`[TabContext] Skipping auto-reconnect for ${connectionId}: reason=${reason}`);
      return;
    }

    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    // Don't auto-reconnect local terminals
    if (connection.connectionType === 'local') {
      return;
    }

    console.log(`[TabContext] Starting auto-reconnect for ${connectionId}: reason=${reason}`);

    const initialDelay = RECONNECT_CONFIG.initialDelayMs;

    // Update connection state with reconnect info
    setConnections(prev =>
      prev.map(conn =>
        conn.id === connectionId
          ? {
              ...conn,
              status: 'connecting',
              reconnectState: {
                isReconnecting: true,
                attemptNumber: 1,
                maxAttempts: RECONNECT_CONFIG.maxAttempts,
                nextAttemptIn: initialDelay,
                reason,
              },
            }
          : conn
      )
    );

    // Start countdown interval for UI
    const countdownInterval = setInterval(() => {
      setConnections(prev =>
        prev.map(conn => {
          if (conn.id === connectionId && conn.reconnectState) {
            const newNextAttemptIn = Math.max(0, conn.reconnectState.nextAttemptIn - 1000);
            return {
              ...conn,
              reconnectState: { ...conn.reconnectState, nextAttemptIn: newNextAttemptIn },
            };
          }
          return conn;
        })
      );
    }, 1000);
    reconnectIntervals.current.set(connectionId, countdownInterval);

    // Schedule first reconnect attempt
    const timer = setTimeout(() => {
      // Clear countdown interval before attempting
      const interval = reconnectIntervals.current.get(connectionId);
      if (interval) {
        clearInterval(interval);
        reconnectIntervals.current.delete(connectionId);
      }
      executeReconnectAttempt(connectionId, 1);
    }, initialDelay);
    reconnectTimers.current.set(connectionId, timer);
  }, [connections, executeReconnectAttempt]);

  // Listen for latency updates - use useEffect for proper cleanup
  React.useEffect(() => {
    const unsubscribe = window.electron.onSSHLatency((data: { connectionId: string; latency: number }) => {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === data.connectionId
            ? { ...conn, latency: data.latency, lastActivity: new Date() }
            : conn
        )
      );
    });
    return unsubscribe; // Cleanup on unmount
  }, []);

  // Listen for SSH close events to cleanup timeouts and trigger auto-reconnect
  React.useEffect(() => {
    const unsubscribe = window.electron.onSSHClosed((data: { connectionId: string; reason?: string; exitCode?: number; signal?: number }) => {
      // Clear any pending timeout for this connection
      const timeout = connectionTimeouts.current.get(data.connectionId);
      if (timeout) {
        clearTimeout(timeout);
        connectionTimeouts.current.delete(data.connectionId);
      }

      // Get the connection to check if it should auto-reconnect
      const connection = connections.find(c => c.id === data.connectionId);
      if (!connection) return;

      // Skip if already disconnected or has active reconnect state
      if (connection.status === 'disconnected' || connection.reconnectState?.isReconnecting) {
        return;
      }

      const reason = (data.reason as DisconnectReason) || 'unknown';

      // For non-user-initiated disconnects and non-auth failures, start auto-reconnect
      if (reason !== 'user' && reason !== 'auth' && connection.connectionType !== 'local') {
        startAutoReconnect(data.connectionId, reason);
      } else {
        // Just update status to disconnected
        setConnections(prev =>
          prev.map(conn =>
            conn.id === data.connectionId
              ? { ...conn, status: 'disconnected', lastActivity: new Date() }
              : conn
          )
        );
      }
    });
    return unsubscribe;
  }, [connections, startAutoReconnect]);

  // Cleanup all timeouts and reconnect timers on unmount
  React.useEffect(() => {
    return () => {
      connectionTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      connectionTimeouts.current.clear();

      reconnectTimers.current.forEach((timer) => {
        clearTimeout(timer);
      });
      reconnectTimers.current.clear();

      reconnectIntervals.current.forEach((interval) => {
        clearInterval(interval);
      });
      reconnectIntervals.current.clear();
    };
  }, []);

  const value: TabContextType = {
    activeTab,
    setActiveTab,
    connections,
    activeConnectionId,
    setActiveConnectionId,
    createConnection,
    createLocalTerminal,
    renameConnection,
    disconnectConnection,
    removeConnection,
    retryConnection,
    cancelAutoReconnect,
    topologyNodes,
    setTopologyNodes,
    focusNode,
    setOnFocusNode,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
