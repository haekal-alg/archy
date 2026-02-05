import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { TabType, SSHConnection, TabContextType, SSHPortForward } from '../types/terminal';
import { cleanupTerminal } from '../components/TerminalEmulator';

const TabContext = createContext<TabContextType | undefined>(undefined);

// Connection timeout in milliseconds (30 seconds)
const CONNECTION_TIMEOUT_MS = 30000;

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

  // Track connection timeouts to prevent memory leaks
  const connectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to clear connection timeout
  const clearConnectionTimeout = useCallback((connectionId: string) => {
    const timeout = connectionTimeouts.current.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      connectionTimeouts.current.delete(connectionId);
    }
  }, []);

  const createConnection = useCallback(async (config: {
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

    // Close SSH session
    window.electron.closeSSHSession(id);

    // Cleanup terminal but keep connection in list
    cleanupTerminal(id);

    // Update status to disconnected
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? { ...conn, status: 'disconnected', lastActivity: new Date() }
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

  // Listen for SSH close events to cleanup timeouts and update state
  React.useEffect(() => {
    const unsubscribe = window.electron.onSSHClosed((data: { connectionId: string }) => {
      // Clear any pending timeout for this connection
      const timeout = connectionTimeouts.current.get(data.connectionId);
      if (timeout) {
        clearTimeout(timeout);
        connectionTimeouts.current.delete(data.connectionId);
      }

      // Update connection status
      setConnections(prev =>
        prev.map(conn =>
          conn.id === data.connectionId && conn.status !== 'disconnected'
            ? { ...conn, status: 'disconnected', lastActivity: new Date() }
            : conn
        )
      );
    });
    return unsubscribe;
  }, []);

  // Cleanup all timeouts on unmount
  React.useEffect(() => {
    return () => {
      connectionTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      connectionTimeouts.current.clear();
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
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
