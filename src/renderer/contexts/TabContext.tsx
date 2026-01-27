import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TabType, SSHConnection, TabContextType } from '../types/terminal';
import { cleanupTerminal } from '../components/TerminalEmulator';

const TabContext = createContext<TabContextType | undefined>(undefined);

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

  const createConnection = useCallback(async (config: {
    nodeName: string;
    nodeType: string;
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath?: string;
  }) => {
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
      connectionType: 'ssh',
    };

    setConnections(prev => [...prev, newConnection]);
    setActiveConnectionId(connectionId);
    setActiveTab('connections');

    try {
      await window.electron.createSSHSession({
        connectionId,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKeyPath: config.privateKeyPath,
      });

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
            ? { ...conn, status: 'error', error: error instanceof Error ? error.message : 'Connection failed', lastActivity: new Date() }
            : conn
        )
      );
    }
  }, []);

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
  }, [activeConnectionId, connections]);

  const removeConnection = useCallback((id: string) => {
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
  }, [activeConnectionId, connections]);

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
