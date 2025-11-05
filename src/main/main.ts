import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';
import { Client } from 'ssh2';

const Store = require('electron-store');
const store = new Store.default();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

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
    // Create a temporary .rdp file
    const rdpContent = `full address:s:${host}
username:s:${username}
prompt for credentials:i:0
authentication level:i:0`;

    const tempPath = path.join(app.getPath('temp'), 'temp_connection.rdp');
    require('fs').writeFileSync(tempPath, rdpContent);

    // Launch mstsc with the .rdp file
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

// Handle SSH connections
ipcMain.handle('connect-ssh', async (event, { host, port = 22, username, password }) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      // Launch an interactive shell
      conn.shell((err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        // Open a new terminal window with SSH
        let command;
        if (process.platform === 'win32') {
          // For Windows, use Windows Terminal or cmd with plink
          command = `start cmd /k "echo Connected to ${host} && plink -ssh ${username}@${host} -P ${port} -pw ${password}"`;
        } else if (process.platform === 'darwin') {
          // For macOS
          command = `osascript -e 'tell app "Terminal" to do script "sshpass -p '${password}' ssh -p ${port} ${username}@${host}"'`;
        } else {
          // For Linux
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

// Save/Load diagram data
ipcMain.handle('save-diagram', async (event, { name, data }) => {
  store.set(`diagram.${name}`, data);
  return { success: true };
});

ipcMain.handle('load-diagram', async (event, name) => {
  const data = store.get(`diagram.${name}`);
  return data;
});

ipcMain.handle('list-diagrams', async () => {
  const store_data = store.store as any;
  const diagrams = Object.keys(store_data)
    .filter(key => key.startsWith('diagram.'))
    .map(key => key.replace('diagram.', ''));
  return diagrams;
});

ipcMain.handle('delete-diagram', async (event, name) => {
  store.delete(`diagram.${name}`);
  return { success: true };
});
