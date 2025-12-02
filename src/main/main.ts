import { app, BrowserWindow, ipcMain, Menu, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { Client, ClientChannel } from 'ssh2';

const Store = require('electron-store');
const store = new Store.default();

let mainWindow: BrowserWindow | null = null;

// Store active SSH sessions
interface SSHSession {
  client: Client;
  stream: ClientChannel;
  connectionId: string;
  latency?: number;
  lastPingTime?: number;
}

const sshSessions = new Map<string, SSHSession>();

function createMenu() {
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Diagram',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save');
          }
        },
        {
          label: 'Load Diagram',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-load');
          }
        },
        { type: 'separator' },
        {
          label: 'Export as PNG',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Canvas',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow?.webContents.send('menu-clear');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Determine icon path based on environment
  // In production, icons are in resources directory via extraResources
  // In development, icons are in build directory
  let iconPath: string;

  if (app.isPackaged) {
    // Production: icons copied to resources directory by electron-builder
    iconPath = process.platform === 'win32'
      ? path.join(process.resourcesPath, 'icon.ico')
      : path.join(process.resourcesPath, 'icon.png');
  } else {
    // Development: icons in build directory
    iconPath = process.platform === 'win32'
      ? path.join(__dirname, '../build/icon.ico')
      : path.join(__dirname, '../build/icon.png');
  }

  // Set window title based on environment
  const windowTitle = app.isPackaged ? 'Archy' : '[DEV] Archy';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: windowTitle,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  createMenu();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

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

// Handle app info requests
ipcMain.handle('is-packaged', async () => {
  return app.isPackaged;
});

// Handle RDP connections
ipcMain.handle('connect-rdp', async (event, { host, username, password }) => {
  return new Promise((resolve, reject) => {
    const rdpContent = `full address:s:${host}
username:s:${username}
prompt for credentials:i:0
authentication level:i:0`;

    const tempPath = path.join(app.getPath('temp'), 'temp_connection.rdp');
    fs.writeFileSync(tempPath, rdpContent);

    const command = `cmdkey /generic:${host} /user:${username} /pass:${password} && mstsc "${tempPath}"`;

    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Handle SSH connections (legacy - for backward compatibility)
ipcMain.handle('connect-ssh', async (event, { host, port = 22, username, password }) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.shell((err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let command;
        if (process.platform === 'win32') {
          command = `start cmd /k "echo Connected to ${host} && plink -ssh ${username}@${host} -P ${port} -pw ${password}"`;
        } else if (process.platform === 'darwin') {
          command = `osascript -e 'tell app "Terminal" to do script "sshpass -p '${password}' ssh -p ${port} ${username}@${host}"'`;
        } else {
          command = `gnome-terminal -- bash -c "sshpass -p '${password}' ssh -p ${port} ${username}@${host}; exec bash"`;
        }

        exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve({ success: true });
          }
        });

        conn.end();
      });
    });

    conn.on('error', (err) => {
      reject(err);
    });

    conn.connect({
      host,
      port,
      username,
      password,
    });
  });
});

// Create persistent SSH session with xterm.js
ipcMain.handle('create-ssh-session', async (event, { connectionId, host, port = 22, username, password, privateKeyPath }) => {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      client.shell({
        term: 'xterm-256color',
        cols: 80,
        rows: 24,
      }, (err, stream) => {
        if (err) {
          client.end();
          reject(err);
          return;
        }

        // Store the session
        sshSessions.set(connectionId, { client, stream, connectionId });

        // Forward stream data to renderer
        stream.on('data', (data: Buffer) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ssh-data', {
              connectionId,
              data: data.toString('utf-8'),
            });
          }
        });

        // Send a newline to trigger the prompt - delay increased to ensure terminal is ready
        setTimeout(() => {
          if (sshSessions.has(connectionId)) {
            stream.write('\n');
          }
        }, 300);

        stream.on('close', () => {
          sshSessions.delete(connectionId);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ssh-closed', { connectionId });
          }
          client.end();
        });

        stream.stderr.on('data', (data: Buffer) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ssh-data', {
              connectionId,
              data: data.toString('utf-8'),
            });
          }
        });

        resolve({ success: true });
      });
    });

    client.on('error', (err) => {
      sshSessions.delete(connectionId);
      reject(err);
    });

    // Prepare connection config
    const connectConfig: any = {
      host,
      port,
      username,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
    };

    // Use private key if provided, otherwise use password
    if (privateKeyPath && privateKeyPath.trim() !== '') {
      try {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        connectConfig.privateKey = privateKey;

        // If password is also provided, use it as passphrase for encrypted keys
        if (password && password.trim() !== '') {
          connectConfig.passphrase = password;
        }
      } catch (error) {
        reject(new Error(`Failed to read private key file: ${error}`));
        return;
      }
    } else if (password) {
      connectConfig.password = password;
    }

    client.connect(connectConfig);
  });
});

// Send data to SSH session (fire-and-forget for low latency)
ipcMain.on('send-ssh-data', (event, { connectionId, data }) => {
  const session = sshSessions.get(connectionId);
  if (session && session.stream) {
    session.stream.write(data);
  }
});

// Resize SSH terminal (fire-and-forget)
ipcMain.on('resize-ssh-terminal', (event, { connectionId, cols, rows }) => {
  const session = sshSessions.get(connectionId);
  if (session && session.stream) {
    session.stream.setWindow(rows, cols, 0, 0);
  }
});

// Close SSH session (fire-and-forget)
ipcMain.on('close-ssh-session', (event, { connectionId }) => {
  const session = sshSessions.get(connectionId);
  if (session) {
    session.stream.end();
    session.client.end();
    sshSessions.delete(connectionId);
  }
});

// Periodic latency measurement (measure every 3 seconds)
// We measure latency by sending a space followed by backspace and timing the response
// This is invisible but triggers response
let latencyMeasurementActive = false;

setInterval(() => {
  if (latencyMeasurementActive) return; // Skip if previous measurement still running

  sshSessions.forEach((session) => {
    if (session.stream && !session.stream.destroyed) {
      latencyMeasurementActive = true;
      const startTime = Date.now();
      let responded = false;

      // Listen for ANY data response from the stream
      const onData = (data: Buffer) => {
        if (!responded) {
          responded = true;
          const latency = Date.now() - startTime;
          session.latency = latency;
          session.lastPingTime = Date.now();

          // Send latency update to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ssh-latency', {
              connectionId: session.connectionId,
              latency: latency,
            });
          }

          // Remove this listener after receiving the response
          session.stream.removeListener('data', onData);
          latencyMeasurementActive = false;
        }
      };

      session.stream.on('data', onData);

      // Send a space followed by backspace - invisible but triggers response
      // This is more reliable than null byte for getting a server response
      session.stream.write(' \b');

      // Cleanup listener after timeout to avoid memory leaks
      setTimeout(() => {
        session.stream.removeListener('data', onData);
        latencyMeasurementActive = false;
      }, 2000);
    }
  });
}, 3000);

// Handle generic command execution (for browser, custom commands, etc.)
ipcMain.handle('execute-command', async (event, { command }) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        reject(error);
      } else {
        console.log(`Command executed: ${command}`);
        resolve({ success: true, stdout, stderr });
      }
    });
  });
});

// Show open dialog for file selection
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, options);
    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    throw error;
  }
});

// Save diagram - if filePath provided, save directly; otherwise show save dialog
ipcMain.handle('save-diagram', async (event, { name, data, filePath }) => {
  try {
    let targetPath = filePath;

    // If no file path provided, show save dialog
    if (!targetPath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
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

    // Save to the file
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(targetPath, jsonString);

    // Also save to electron-store for quick access
    store.set(`diagram.${name}`, data);

    // Save as last opened file for session persistence
    store.set('lastOpenedFile', targetPath);

    return { success: true, path: targetPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Save diagram as - always show save dialog
ipcMain.handle('save-diagram-as', async (event, { name, data }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Diagram As',
      defaultPath: `${name}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(result.filePath, jsonString);

      // Also save to electron-store for quick access
      store.set(`diagram.${name}`, data);

      // Save as last opened file for session persistence
      store.set('lastOpenedFile', result.filePath);

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
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Load Diagram',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Save as last opened file for session persistence
      store.set('lastOpenedFile', filePath);

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
    const lastFilePath = store.get('lastOpenedFile') as string | undefined;

    if (!lastFilePath || !fs.existsSync(lastFilePath)) {
      return { success: false, noSession: true };
    }

    const fileContent = fs.readFileSync(lastFilePath, 'utf-8');
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
  const store_data = store.store as any;
  const diagrams = Object.keys(store_data)
    .filter(key => key.startsWith('diagram.'))
    .map(key => key.replace('diagram.', ''));
  return diagrams;
});

// Delete diagram from electron-store
ipcMain.handle('delete-diagram', async (event, name) => {
  store.delete(`diagram.${name}`);
  return { success: true };
});

// Clipboard operations
ipcMain.handle('clipboard-write-text', async (event, text: string) => {
  clipboard.writeText(text);
  return { success: true };
});

ipcMain.handle('clipboard-read-text', async () => {
  return clipboard.readText();
});
