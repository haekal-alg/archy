import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  connectRDP: (host: string, username: string, password: string) =>
    ipcRenderer.invoke('connect-rdp', { host, username, password }),

  connectSSH: (host: string, port: number, username: string, password: string) =>
    ipcRenderer.invoke('connect-ssh', { host, port, username, password }),

  saveDiagram: (name: string, data: any) =>
    ipcRenderer.invoke('save-diagram', { name, data }),

  loadDiagram: (name: string) =>
    ipcRenderer.invoke('load-diagram', name),

  listDiagrams: () =>
    ipcRenderer.invoke('list-diagrams'),

  deleteDiagram: (name: string) =>
    ipcRenderer.invoke('delete-diagram', name),
});
