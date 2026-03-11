import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from main process on mount
  useEffect(() => {
    window.electron.getSettings().then((loaded: AppSettings) => {
      // Merge with defaults to handle missing keys from older versions
      setSettings({
        ...DEFAULT_SETTINGS,
        ...loaded,
        terminal: {
          ...DEFAULT_SETTINGS.terminal,
          ...loaded?.terminal,
          shellCwd: {
            ...DEFAULT_SETTINGS.terminal.shellCwd,
            ...loaded?.terminal?.shellCwd,
          },
        },
      });
    }).catch((err: unknown) => {
      console.error('Failed to load settings:', err);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const merged: AppSettings = {
      ...settings,
      ...partial,
      terminal: {
        ...settings.terminal,
        ...partial.terminal,
        shellCwd: {
          ...settings.terminal.shellCwd,
          ...partial.terminal?.shellCwd,
        },
      },
    };
    setSettings(merged);
    await window.electron.saveSettings(merged);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
