import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TabType, SSHConnection, TabContextType } from '../types/terminal';

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

  const disconnectConnection = useCallback((id: string) => {
    window.electron.closeSSHSession(id);
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id ? { ...conn, status: 'disconnected', lastActivity: new Date() } : conn
      )
    );
    if (activeConnectionId === id) {
      const remainingConnections = connections.filter(c => c.id !== id && c.status === 'connected');
      setActiveConnectionId(remainingConnections.length > 0 ? remainingConnections[0].id : null);
    }
  }, [activeConnectionId, connections]);

  const value: TabContextType = {
    activeTab,
    setActiveTab,
    connections,
    activeConnectionId,
    setActiveConnectionId,
    createConnection,
    disconnectConnection,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};
