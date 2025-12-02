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
  sendSSHData: (connectionId: string, data: string) => void;
  resizeSSHTerminal: (connectionId: string, cols: number, rows: number) => void;
  closeSSHSession: (connectionId: string) => void;
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
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
