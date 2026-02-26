/**
 * Archy - Network Topology Visualization & Remote Access Management
 * Main process entry point
 */

import { app, BrowserWindow, ipcMain, dialog, clipboard, session, shell } from 'electron';
import * as path from 'path';
import { execFile } from 'child_process';

// Module imports
import { createMenu } from './menu-system';
import { connectRDP } from './rdp-handler';
import { initBufferManager, setMainWindow as setBufferMainWindow } from './buffer-manager';
import {
  initSSHSessionManager,
  setMainWindow as setSSHMainWindow,
  createSSHSession,
  getSSHSession,
  getAllSSHSessions,
} from './ssh-session';
import {
  initLocalTerminalManager,
  setMainWindow as setLocalMainWindow,
  createLocalTerminal,
  getLocalSession,
} from './local-terminal';
import { registerTerminalIPCHandlers } from './terminal-ipc';
import { registerDiagramIPCHandlers } from './diagram-manager';
import { registerSFTPIPCHandlers } from './sftp-manager';

// Electron store for persistence
const Store = require('electron-store');
const store = new Store.default();

// Window references
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Fix cache permission issues - clear cache in development
if (!app.isPackaged) {
  app.commandLine.appendSwitch('disable-http-cache');
  app.commandLine.appendSwitch('disk-cache-size', '0');
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
  app.commandLine.appendSwitch('disable-gpu-program-cache');
}

// Set a custom user data path to avoid permission issues
if (!app.isPackaged) {
  const userDataPath = path.join(app.getPath('appData'), 'archy-dev');
  app.setPath('userData', userDataPath);
}

/**
 * Create the splash screen window
 */
function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    backgroundColor: '#0f0f14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = path.join(__dirname, '../src/splash.html');
  splash.loadFile(splashPath).catch((err) => {
    console.error('Failed to load splash screen:', err);
  });

  splash.center();
  return splash;
}

/**
 * Create the main application window
 */
function createWindow(): void {
  // Determine icon path based on environment
  let iconPath: string;

  if (app.isPackaged) {
    iconPath = process.platform === 'win32'
      ? path.join(process.resourcesPath, 'icon.ico')
      : path.join(process.resourcesPath, 'icon.png');
  } else {
    iconPath = process.platform === 'win32'
      ? path.join(__dirname, '../build/icon.ico')
      : path.join(__dirname, '../build/icon.png');
  }

  const windowTitle = app.isPackaged ? 'Archy' : '[DEV] Archy';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: windowTitle,
    icon: iconPath,
    show: false,
    frame: false,
    backgroundColor: '#151923',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      partition: app.isPackaged ? 'persist:main' : 'persist:dev',
    },
  });

  // Initialize all modules with main window reference
  initializeModules();

  // Create application menu
  createMenu(mainWindow);

  // Load the application
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show main window when ready and close splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow?.show();
    }, 500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Forward maximize/unmaximize state to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized-change', false);
  });
}

/**
 * Initialize all modules with required references
 */
function initializeModules(): void {
  // Initialize buffer manager with session getters for flow control
  initBufferManager(
    mainWindow,
    (connectionId) => getSSHSession(connectionId),
    (connectionId) => getLocalSession(connectionId)
  );

  // Initialize session managers
  initSSHSessionManager(mainWindow);
  initLocalTerminalManager(mainWindow);

  // Register IPC handlers
  registerTerminalIPCHandlers();
  registerDiagramIPCHandlers(mainWindow, store);
  registerSFTPIPCHandlers();
}

/**
 * Update main window reference in all modules
 */
function updateMainWindowReferences(): void {
  setBufferMainWindow(mainWindow);
  setSSHMainWindow(mainWindow);
  setLocalMainWindow(mainWindow);
}

// ============================================================================
// Application Lifecycle
// ============================================================================

app.whenReady().then(() => {
  // Show splash screen first
  splashWindow = createSplashWindow();

  // Clear cache in development
  if (!app.isPackaged) {
    session.defaultSession.clearCache().catch(() => {});
    session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'serviceworkers']
    }).catch(() => {});
  }

  // Create main window
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================================================
// Core IPC Handlers
// ============================================================================

// App info
ipcMain.handle('is-packaged', async () => {
  return app.isPackaged;
});

// RDP connections
ipcMain.handle('connect-rdp', async (event, { host, username, password }) => {
  return connectRDP({ host, username, password });
});

// SSH session creation
ipcMain.handle('create-ssh-session', async (event, config) => {
  return createSSHSession(config);
});

// Local terminal creation
ipcMain.handle('create-local-terminal', async (event, { connectionId, cwd }) => {
  return createLocalTerminal(connectionId, cwd);
});

// Open URL in default browser (validated scheme)
ipcMain.handle('open-url', async (event, { url }) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    throw new Error('Invalid URL: must start with http:// or https://');
  }
  await shell.openExternal(url);
  return { success: true };
});

// Launch mstsc (RDP client) with validated hostname
ipcMain.handle('launch-mstsc', async (event, { host }) => {
  if (typeof host !== 'string' || !/^[a-zA-Z0-9._:\-\[\]]+$/.test(host)) {
    throw new Error('Invalid hostname: only alphanumeric characters, dots, colons, hyphens, and brackets allowed');
  }
  return new Promise((resolve, reject) => {
    execFile('mstsc', [`/v:${host}`], (error) => {
      if (error) {
        console.error(`mstsc launch error: ${error.message}`);
        reject(error);
      } else {
        console.log(`mstsc launched for host: ${host}`);
        resolve({ success: true });
      }
    });
  });
});

// Execute custom command in a new cmd window (Windows only)
ipcMain.handle('execute-custom-command', async (event, { command }) => {
  if (typeof command !== 'string' || !command.trim()) {
    throw new Error('Invalid command: must be a non-empty string');
  }
  return new Promise((resolve, reject) => {
    execFile('cmd', ['/c', 'start', 'cmd', '/k', command], (error) => {
      if (error) {
        console.error(`Custom command error: ${error.message}`);
        reject(error);
      } else {
        console.log(`Custom command executed in CMD: ${command}`);
        resolve({ success: true });
      }
    });
  });
});

// File dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, options);
    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    throw error;
  }
});

// Clipboard operations
ipcMain.handle('clipboard-write-text', async (event, text: string) => {
  clipboard.writeText(text);
  return { success: true };
});

ipcMain.handle('clipboard-read-text', async () => {
  return clipboard.readText();
});

// ============================================================================
// Window Control IPC Handlers (for custom title bar)
// ============================================================================

ipcMain.handle('window-minimize', async () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', async () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', async () => {
  return mainWindow?.isMaximized() ?? false;
});

// View control IPC handlers
ipcMain.handle('window-reload', async () => {
  mainWindow?.webContents.reload();
});

ipcMain.handle('window-toggle-devtools', async () => {
  mainWindow?.webContents.toggleDevTools();
});

ipcMain.handle('window-zoom-in', async () => {
  if (mainWindow) {
    const currentZoom = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
  }
});

ipcMain.handle('window-zoom-out', async () => {
  if (mainWindow) {
    const currentZoom = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
  }
});

ipcMain.handle('window-zoom-reset', async () => {
  mainWindow?.webContents.setZoomLevel(0);
});
