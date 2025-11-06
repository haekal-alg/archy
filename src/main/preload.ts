import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  connectRDP: (host: string, username: string, password: string) =>
    ipcRenderer.invoke('connect-rdp', { host, username, password }),

  connectSSH: (host: string, port: number, username: string, password: string) =>
    ipcRenderer.invoke('connect-ssh', { host, port, username, password }),

  executeCommand: (command: string) =>
    ipcRenderer.invoke('execute-command', { command }),

  saveDiagram: (name: string, data: any) =>
    ipcRenderer.invoke('save-diagram', { name, data }),

  loadDiagram: () =>
    ipcRenderer.invoke('load-diagram'),

  listDiagrams: () =>
    ipcRenderer.invoke('list-diagrams'),

  deleteDiagram: (name: string) =>
    ipcRenderer.invoke('delete-diagram', name),

  // Menu event listeners
  onMenuSave: (callback: () => void) => ipcRenderer.on('menu-save', callback),
  onMenuLoad: (callback: () => void) => ipcRenderer.on('menu-load', callback),
  onMenuExport: (callback: () => void) => ipcRenderer.on('menu-export', callback),
  onMenuClear: (callback: () => void) => ipcRenderer.on('menu-clear', callback),
});
