import { contextBridge, ipcRenderer, app } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // App information
  isPackaged: () => ipcRenderer.invoke('is-packaged'),

  connectRDP: (host: string, username: string, password: string) =>
    ipcRenderer.invoke('connect-rdp', { host, username, password }),

  connectSSH: (host: string, port: number, username: string, password: string) =>
    ipcRenderer.invoke('connect-ssh', { host, port, username, password }),

  executeCommand: (command: string) =>
    ipcRenderer.invoke('execute-command', { command }),

  showOpenDialog: (options: any) =>
    ipcRenderer.invoke('show-open-dialog', options),

  saveDiagram: (name: string, data: any, filePath?: string) =>
    ipcRenderer.invoke('save-diagram', { name, data, filePath }),

  saveDiagramAs: (name: string, data: any) =>
    ipcRenderer.invoke('save-diagram-as', { name, data }),

  loadDiagram: () =>
    ipcRenderer.invoke('load-diagram'),

  getLastSession: () =>
    ipcRenderer.invoke('get-last-session'),

  listDiagrams: () =>
    ipcRenderer.invoke('list-diagrams'),

  deleteDiagram: (name: string) =>
    ipcRenderer.invoke('delete-diagram', name),

  // SSH Session Management
  createSSHSession: (config: { connectionId: string; host: string; port: number; username: string; password: string; privateKeyPath?: string; portForwards?: Array<{ localPort: number; remoteHost: string; remotePort: number; bindAddress?: string }> }) =>
    ipcRenderer.invoke('create-ssh-session', config),

  // Local Terminal Management
  createLocalTerminal: (config: { connectionId: string; cwd?: string }) =>
    ipcRenderer.invoke('create-local-terminal', config),

  openTerminalInExplorer: (connectionId: string) =>
    ipcRenderer.invoke('open-terminal-in-explorer', { connectionId }),

  getLocalTerminalCwd: (connectionId: string) =>
    ipcRenderer.invoke('get-local-terminal-cwd', { connectionId }),

  sendSSHData: (connectionId: string, data: string) => {
    ipcRenderer.send('send-ssh-data', { connectionId, data });
  },

  resizeSSHTerminal: (connectionId: string, cols: number, rows: number) => {
    ipcRenderer.send('resize-ssh-terminal', { connectionId, cols, rows });
  },

  closeSSHSession: (connectionId: string) => {
    ipcRenderer.send('close-ssh-session', { connectionId });
  },

  // Flow control: signal that SSH data has been consumed by renderer
  sshDataConsumed: (connectionId: string, bytesConsumed: number) => {
    ipcRenderer.send('ssh-data-consumed', { connectionId, bytesConsumed });
  },

  onSSHData: (callback: (data: { connectionId: string; data: string }) => void) => {
    const subscription = (_event: any, data: { connectionId: string; data: string }) => callback(data);
    ipcRenderer.on('ssh-data', subscription);
    return () => ipcRenderer.removeListener('ssh-data', subscription);
  },

  onSSHClosed: (callback: (data: { connectionId: string; reason?: string; exitCode?: number; signal?: number }) => void) => {
    const subscription = (_event: any, data: { connectionId: string; reason?: string; exitCode?: number; signal?: number }) => callback(data);
    ipcRenderer.on('ssh-closed', subscription);
    return () => ipcRenderer.removeListener('ssh-closed', subscription);
  },

  onSSHLatency: (callback: (data: { connectionId: string; latency: number }) => void) => {
    const subscription = (_event: any, data: { connectionId: string; latency: number }) => callback(data);
    ipcRenderer.on('ssh-latency', subscription);
    return () => ipcRenderer.removeListener('ssh-latency', subscription);
  },

  // Menu event listeners - return cleanup functions to prevent memory leaks
  onMenuSave: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-save', subscription);
    return () => ipcRenderer.removeListener('menu-save', subscription);
  },
  onMenuLoad: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-load', subscription);
    return () => ipcRenderer.removeListener('menu-load', subscription);
  },
  onMenuExport: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-export', subscription);
    return () => ipcRenderer.removeListener('menu-export', subscription);
  },
  onMenuClear: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('menu-clear', subscription);
    return () => ipcRenderer.removeListener('menu-clear', subscription);
  },

  // Clipboard operations
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard-write-text', text),
    readText: () => ipcRenderer.invoke('clipboard-read-text'),
  },

  // SFTP File Transfer
  getHomeDirectory: () => ipcRenderer.invoke('get-home-directory'),
  listLocalFiles: (path: string) => ipcRenderer.invoke('list-local-files', path),
  listRemoteFiles: (config: { connectionId: string; path: string }) =>
    ipcRenderer.invoke('list-remote-files', config),
  closeSFTPConnection: (connectionId: string) =>
    ipcRenderer.invoke('close-sftp-connection', connectionId),
  uploadFile: (config: { connectionId: string; localPath: string; remotePath: string; fileName: string }) =>
    ipcRenderer.invoke('upload-file', config),
  downloadFile: (config: { connectionId: string; remotePath: string; localPath: string; fileName: string }) =>
    ipcRenderer.invoke('download-file', config),

  // SFTP progress events
  onSFTPProgress: (callback: (data: { connectionId: string; fileName: string; bytesTransferred: number; totalBytes: number; direction: 'upload' | 'download' }) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('sftp-progress', subscription);
    return () => ipcRenderer.removeListener('sftp-progress', subscription);
  },

  // Remote file operations
  sftpDelete: (config: { connectionId: string; remotePath: string; isDirectory: boolean }) =>
    ipcRenderer.invoke('sftp-delete', config),
  sftpRename: (config: { connectionId: string; oldPath: string; newPath: string }) =>
    ipcRenderer.invoke('sftp-rename', config),
  sftpMkdir: (config: { connectionId: string; remotePath: string }) =>
    ipcRenderer.invoke('sftp-mkdir', config),

  // Local file operations
  localDelete: (filePath: string) => ipcRenderer.invoke('local-delete', filePath),
  localRename: (config: { oldPath: string; newPath: string }) => ipcRenderer.invoke('local-rename', config),
  localMkdir: (dirPath: string) => ipcRenderer.invoke('local-mkdir', dirPath),
});
