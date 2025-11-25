export type TabType = 'design' | 'connections';

export interface SSHConnection {
  id: string;
  nodeName: string;
  nodeType: string;
  host: string;
  port: number;
  username: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
  error?: string;
  zoom?: number; // Terminal zoom level (default 1.0)
}

export interface TerminalSession {
  connectionId: string;
  terminalElement?: HTMLDivElement;
}

export interface TabContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  connections: SSHConnection[];
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string | null) => void;
  createConnection: (config: {
    nodeName: string;
    nodeType: string;
    host: string;
    port: number;
    username: string;
    password: string;
  }) => Promise<void>;
  disconnectConnection: (id: string) => void;
}
