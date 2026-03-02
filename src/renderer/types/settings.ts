export type ShellType = 'cmd' | 'wsl' | 'powershell';

export interface TerminalSettings {
  defaultShell: ShellType;
  shellCwd: Record<ShellType, string>;
}

export interface AppSettings {
  terminal: TerminalSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  terminal: {
    defaultShell: 'cmd',
    shellCwd: {
      cmd: '',
      wsl: '',
      powershell: '',
    },
  },
};
