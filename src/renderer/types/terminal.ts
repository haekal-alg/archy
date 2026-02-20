export type TabType = 'design' | 'connections';

export interface SSHPortForward {
  localPort: number;
  remoteHost: string;
  remotePort: number;
  bindAddress?: string;
}

/**
 * Reason for SSH disconnection - used for auto-reconnect logic
 */
export type DisconnectReason = 'user' | 'network' | 'auth' | 'timeout' | 'unknown';

/**
 * State for auto-reconnect functionality
 */
export interface ReconnectState {
  isReconnecting: boolean;
  attemptNumber: number;
  maxAttempts: number;
  nextAttemptIn: number; // milliseconds until next attempt
  reason: DisconnectReason;
}

/**
 * Lightweight topology node info for cross-tab reference
 */
export interface TopologyNodeInfo {
  id: string;
  label: string;
  type: string;
  color: string;
}

export interface SSHConnection {
  id: string;
  nodeId?: string; // ID of the React Flow node this connection originated from
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
  portForwards?: SSHPortForward[];
  // Auto-reconnect state
  reconnectState?: ReconnectState;
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
    nodeId?: string;
    nodeName: string;
    nodeType: string;
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath?: string;
    portForwards?: SSHPortForward[];
  }) => Promise<void>;
  createLocalTerminal: (cwd?: string) => Promise<void>;
  renameConnection: (id: string, newLabel: string) => void;
  disconnectConnection: (id: string) => void;
  removeConnection: (id: string) => void;
  retryConnection: (id: string) => Promise<void>;
  cancelAutoReconnect: (id: string) => void;
  // Reconnect countdown (ref-based, does not trigger full re-render)
  subscribeReconnectUpdates: (listener: () => void) => () => void;
  getReconnectCountdown: (connectionId: string) => number | undefined;
  // Topology cross-reference
  topologyNodes: TopologyNodeInfo[];
  setTopologyNodes: (nodes: TopologyNodeInfo[]) => void;
  focusNode: (nodeId: string) => void;
  setOnFocusNode: (handler: (nodeId: string) => void) => void;
}
