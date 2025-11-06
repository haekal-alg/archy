export interface ElectronAPI {
  connectRDP: (host: string, username: string, password: string) => Promise<any>;
  connectSSH: (host: string, port: number, username: string, password: string) => Promise<any>;
  executeCommand: (command: string) => Promise<any>;
  saveDiagram: (name: string, data: any) => Promise<any>;
  loadDiagram: () => Promise<any>;
  listDiagrams: () => Promise<string[]>;
  deleteDiagram: (name: string) => Promise<any>;
  onMenuSave: (callback: () => void) => void;
  onMenuLoad: (callback: () => void) => void;
  onMenuExport: (callback: () => void) => void;
  onMenuClear: (callback: () => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
