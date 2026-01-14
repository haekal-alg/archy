export interface ElectronAPI {
  // App information
  isPackaged: () => Promise<boolean>;

  connectRDP: (host: string, username: string, password: string) => Promise<any>;
  connectSSH: (host: string, port: number, username: string, password: string) => Promise<any>;
  executeCommand: (command: string) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  saveDiagram: (name: string, data: any, filePath?: string) => Promise<any>;
  saveDiagramAs: (name: string, data: any) => Promise<any>;
  loadDiagram: () => Promise<any>;
  getLastSession: () => Promise<any>;
  listDiagrams: () => Promise<string[]>;
  deleteDiagram: (name: string) => Promise<any>;

  // SSH Session Management
  createSSHSession: (config: {
    connectionId: string;
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Local Terminal Management
  createLocalTerminal: (config: { connectionId: string }) => Promise<{ success: boolean; error?: string }>;

  sendSSHData: (connectionId: string, data: string) => void;
  resizeSSHTerminal: (connectionId: string, cols: number, rows: number) => void;
  closeSSHSession: (connectionId: string) => void;
  sshDataConsumed: (connectionId: string, bytesConsumed: number) => void;
  onSSHData: (callback: (data: { connectionId: string; data: string }) => void) => () => void;
  onSSHClosed: (callback: (data: { connectionId: string }) => void) => () => void;
  onSSHLatency: (callback: (data: { connectionId: string; latency: number }) => void) => () => void;

  // Menu event listeners
  onMenuSave: (callback: () => void) => void;
  onMenuLoad: (callback: () => void) => void;
  onMenuExport: (callback: () => void) => void;
  onMenuClear: (callback: () => void) => void;

  // Clipboard operations
  clipboard: {
    writeText: (text: string) => Promise<{ success: boolean }>;
    readText: () => Promise<string>;
  };

  // SFTP File Transfer
  getHomeDirectory: () => Promise<string>;

  listLocalFiles: (path: string) => Promise<Array<{
    name: string;
    type: 'file' | 'directory';
    size: number;
    modifiedTime: string;
    path: string;
  }>>;

  listRemoteFiles: (config: {
    connectionId: string;
    path: string;
  }) => Promise<Array<{
    name: string;
    type: 'file' | 'directory';
    size: number;
    modifiedTime: string;
    path: string;
  }>>;

  closeSFTPConnection: (connectionId: string) => Promise<void>;

  uploadFile: (config: {
    connectionId: string;
    localPath: string;
    remotePath: string;
    fileName: string;
  }) => Promise<{ success: boolean }>;

  downloadFile: (config: {
    connectionId: string;
    remotePath: string;
    localPath: string;
    fileName: string;
  }) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
