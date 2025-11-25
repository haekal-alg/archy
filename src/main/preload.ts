import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
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
  createSSHSession: (config: { connectionId: string; host: string; port: number; username: string; password: string; privateKeyPath?: string }) =>
    ipcRenderer.invoke('create-ssh-session', config),

  sendSSHData: (connectionId: string, data: string) => {
    ipcRenderer.send('send-ssh-data', { connectionId, data });
  },

  resizeSSHTerminal: (connectionId: string, cols: number, rows: number) => {
    ipcRenderer.send('resize-ssh-terminal', { connectionId, cols, rows });
  },

  closeSSHSession: (connectionId: string) => {
    ipcRenderer.send('close-ssh-session', { connectionId });
  },

  onSSHData: (callback: (data: { connectionId: string; data: string }) => void) => {
    const subscription = (_event: any, data: { connectionId: string; data: string }) => callback(data);
    ipcRenderer.on('ssh-data', subscription);
    return () => ipcRenderer.removeListener('ssh-data', subscription);
  },

  onSSHClosed: (callback: (data: { connectionId: string }) => void) => {
    const subscription = (_event: any, data: { connectionId: string }) => callback(data);
    ipcRenderer.on('ssh-closed', subscription);
    return () => ipcRenderer.removeListener('ssh-closed', subscription);
  },

  // Menu event listeners
  onMenuSave: (callback: () => void) => ipcRenderer.on('menu-save', callback),
  onMenuLoad: (callback: () => void) => ipcRenderer.on('menu-load', callback),
  onMenuExport: (callback: () => void) => ipcRenderer.on('menu-export', callback),
  onMenuClear: (callback: () => void) => ipcRenderer.on('menu-clear', callback),
});
