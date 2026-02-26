/**
 * Diagram persistence manager
 * Handles save, load, and management of diagram files
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

const { readFile, writeFile, access } = fsPromises;

// Reference to main window for dialogs
let mainWindowRef: BrowserWindow | null = null;

// Reference to electron-store instance
let storeRef: any = null;

/**
 * Initialize the diagram manager
 */
export function initDiagramManager(mainWindow: BrowserWindow | null, store: any): void {
  mainWindowRef = mainWindow;
  storeRef = store;
}

/**
 * Update references
 */
export function setMainWindow(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Register all diagram-related IPC handlers
 */
export function registerDiagramIPCHandlers(mainWindow: BrowserWindow | null, store: any): void {
  mainWindowRef = mainWindow;
  storeRef = store;

  // Save diagram - if filePath provided, save directly; otherwise show save dialog
  ipcMain.handle('save-diagram', async (event, { name, data, filePath }) => {
    try {
      let targetPath = filePath;

      // If no file path provided, show save dialog
      if (!targetPath) {
        const result = await dialog.showSaveDialog(mainWindowRef!, {
          title: 'Save Diagram',
          defaultPath: `${name}.json`,
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        targetPath = result.filePath;
      }

      // Save to the file asynchronously to avoid blocking main process
      const jsonString = JSON.stringify(data, null, 2);
      await writeFile(targetPath, jsonString, 'utf-8');

      // Also save to electron-store for quick access
      storeRef.set(`diagram.${name}`, data);

      // Save as last opened file for session persistence
      storeRef.set('lastOpenedFile', targetPath);

      return { success: true, path: targetPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Save diagram as - always show save dialog
  ipcMain.handle('save-diagram-as', async (event, { name, data }) => {
    try {
      const result = await dialog.showSaveDialog(mainWindowRef!, {
        title: 'Save Diagram As',
        defaultPath: `${name}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Save to file asynchronously to avoid blocking main process
        const jsonString = JSON.stringify(data, null, 2);
        await writeFile(result.filePath, jsonString, 'utf-8');

        // Also save to electron-store for quick access
        storeRef.set(`diagram.${name}`, data);

        // Save as last opened file for session persistence
        storeRef.set('lastOpenedFile', result.filePath);

        return { success: true, path: result.filePath };
      }

      return { success: false, canceled: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Load diagram - show open dialog
  ipcMain.handle('load-diagram', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindowRef!, {
        title: 'Load Diagram',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        // Read file asynchronously to avoid blocking main process
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Save as last opened file for session persistence
        storeRef.set('lastOpenedFile', filePath);

        return {
          success: true,
          data,
          filename: path.basename(filePath, '.json'),
          filePath: filePath
        };
      }

      return { success: false, canceled: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Get last session - load the last opened file automatically
  ipcMain.handle('get-last-session', async () => {
    try {
      const lastFilePath = storeRef.get('lastOpenedFile') as string | undefined;

      if (!lastFilePath) {
        return { success: false, noSession: true };
      }

      // Check if file exists asynchronously
      try {
        await access(lastFilePath, fs.constants.F_OK);
      } catch {
        return { success: false, noSession: true };
      }

      // Read file asynchronously to avoid blocking main process
      const fileContent = await readFile(lastFilePath, 'utf-8');
      const data = JSON.parse(fileContent);

      return {
        success: true,
        data,
        filename: path.basename(lastFilePath, '.json'),
        filePath: lastFilePath
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // List diagrams from electron-store
  ipcMain.handle('list-diagrams', async () => {
    const store_data = storeRef.store as any;
    const diagrams = Object.keys(store_data)
      .filter(key => key.startsWith('diagram.'))
      .map(key => key.replace('diagram.', ''));
    return diagrams;
  });

  // Delete diagram from electron-store
  ipcMain.handle('delete-diagram', async (event, name) => {
    storeRef.delete(`diagram.${name}`);
    return { success: true };
  });
}
