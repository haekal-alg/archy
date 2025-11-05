export interface ElectronAPI {
  connectRDP: (host: string, username: string, password: string) => Promise<any>;
  connectSSH: (host: string, port: number, username: string, password: string) => Promise<any>;
  saveDiagram: (name: string, data: any) => Promise<any>;
  loadDiagram: (name: string) => Promise<any>;
  listDiagrams: () => Promise<string[]>;
  deleteDiagram: (name: string) => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
