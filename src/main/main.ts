import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
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
  // Determine icon path - __dirname is 'dist' folder, build is at same level as dist
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
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
ipcMain.handle('create-ssh-session', async (event, { connectionId, host, port = 22, username, password }) => {
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

    client.connect({
      host,
      port,
      username,
      password,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
    });
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
