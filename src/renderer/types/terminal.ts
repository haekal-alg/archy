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
  latency?: number; // Connection latency in milliseconds
  connectionType?: 'ssh' | 'local'; // Type of connection (default: ssh)
  customLabel?: string; // User-defined label for the connection
  // Store credentials for retry functionality
  password?: string;
  privateKeyPath?: string;
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
    privateKeyPath?: string;
  }) => Promise<void>;
  createLocalTerminal: (cwd?: string) => Promise<void>;
  renameConnection: (id: string, newLabel: string) => void;
  disconnectConnection: (id: string) => void;
  removeConnection: (id: string) => void;
  retryConnection: (id: string) => Promise<void>;
}
