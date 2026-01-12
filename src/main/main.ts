import { app, BrowserWindow, ipcMain, Menu, dialog, clipboard, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as pty from 'node-pty';

const Store = require('electron-store');
const store = new Store.default();

let mainWindow: BrowserWindow | null = null;

// Fix cache permission issues - clear cache in development
if (!app.isPackaged) {
  app.commandLine.appendSwitch('disable-http-cache');
  app.commandLine.appendSwitch('disk-cache-size', '0');
  // Additional flags to reduce cache-related errors
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
  app.commandLine.appendSwitch('disable-gpu-program-cache');
}

// Set a custom user data path to avoid permission issues
if (!app.isPackaged) {
  const userDataPath = path.join(app.getPath('appData'), 'archy-dev');
  app.setPath('userData', userDataPath);
}

// Store active SSH sessions
interface SSHSession {
  ptyProcess: pty.IPty;
  connectionId: string;
  isPaused: boolean;     // Flow control: track if stream is paused
  queuedBytes: number;   // Flow control: track bytes queued for renderer
  password?: string;     // Store password for auto-typing when prompted
  passwordSent: boolean; // Track if password has been sent
}

const sshSessions = new Map<string, SSHSession>();

// Store active local terminal sessions
interface LocalSession {
  ptyProcess: pty.IPty;
  connectionId: string;
  isPaused: boolean;     // Flow control: track if stream is paused
  queuedBytes: number;   // Flow control: track bytes queued for renderer
}

const localSessions = new Map<string, LocalSession>();

// Data buffering for improved terminal performance
interface BufferState {
  buffer: Buffer[];
  timer: NodeJS.Timeout | null;
  lastFlush: number;
}

const dataBuffers = new Map<string, BufferState>();

// Buffer configuration - optimized for 60fps rendering and low latency
const BUFFER_TIME_MS = 4; // Minimum latency mode (trade-off: higher CPU during throughput)
const BUFFER_SIZE_BYTES = 8192; // 8KB max buffer before force flush
const MIN_FLUSH_INTERVAL_MS = 8; // Minimum time between flushes

// Flow control configuration - prevents renderer from being overwhelmed
const MAX_QUEUED_BYTES = 65536; // 64KB max queue before pausing stream
const RESUME_THRESHOLD_BYTES = 32768; // 32KB resume threshold (50%)

function flushBuffer(connectionId: string) {
  const bufferState = dataBuffers.get(connectionId);
  if (!bufferState || bufferState.buffer.length === 0) return;

  // Concatenate all buffered chunks into single buffer
  const combinedBuffer = Buffer.concat(bufferState.buffer);
  const dataStr = combinedBuffer.toString('utf-8');
  const bytesSent = combinedBuffer.length;

  // Send single IPC message with batched data
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('ssh-data', {
      connectionId,
      data: dataStr,
    });
  }

  // Track queued bytes for flow control (monitoring only - node-pty doesn't support pause/resume)
  const session = sshSessions.get(connectionId);
  if (session) {
    session.queuedBytes += bytesSent;

    // Log warning if queue exceeds threshold
    if (session.queuedBytes >= MAX_QUEUED_BYTES && !session.isPaused) {
      session.isPaused = true;
      console.warn(`[${connectionId}] Queue exceeded threshold: ${session.queuedBytes} bytes (note: node-pty doesn't support backpressure)`);
    }
  }

  // Also track for local sessions
  const localSession = localSessions.get(connectionId);
  if (localSession) {
    localSession.queuedBytes += bytesSent;

    if (localSession.queuedBytes >= MAX_QUEUED_BYTES && !localSession.isPaused) {
      localSession.isPaused = true;
      console.warn(`[${connectionId}] Local queue exceeded threshold: ${localSession.queuedBytes} bytes`);
    }
  }

  // Reset buffer state
  bufferState.buffer = [];
  bufferState.lastFlush = Date.now();
  bufferState.timer = null;
}

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
      // Use separate partitions for dev and production
      partition: app.isPackaged ? 'persist:main' : 'persist:dev',
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

app.whenReady().then(() => {
  // Clear cache in development to avoid permission errors
  if (!app.isPackaged) {
    session.defaultSession.clearCache().catch(() => {
      // Ignore cache clear errors - not critical
    });
    session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'serviceworkers']
    }).catch(() => {
      // Ignore storage clear errors - not critical
    });
  }

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
authentication level:i:0
enablecredsspsupport:i:0
disableconnectionsharing:i:1
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:`;

    const tempPath = path.join(app.getPath('temp'), 'temp_connection.rdp');
    fs.writeFileSync(tempPath, rdpContent);

    // IMPORTANT: For RDP, cmdkey requires TERMSRV/ prefix
    const credentialTarget = `TERMSRV/${host}`;

    // First, delete any existing credentials for this host
    const deleteCmd = `cmdkey /delete:${credentialTarget}`;

    // Then add the new credentials and launch mstsc
    const addCmd = `cmdkey /generic:${credentialTarget} /user:${username} /pass:"${password}"`;
    const launchCmd = `mstsc "${tempPath}"`;

    const fullCommand = `${deleteCmd} 2>nul & ${addCmd} && ${launchCmd}`;

    exec(fullCommand, (error) => {
      if (error) {
        console.error('RDP connection error:', error);
        reject(error);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Create persistent SSH session using native SSH client via node-pty
// This provides better performance than ssh2 library (native crypto, direct PTY)
ipcMain.handle('create-ssh-session', async (event, { connectionId, host, port = 22, username, password, privateKeyPath }) => {
  return new Promise((resolve, reject) => {
    try {
      // Build SSH command arguments
      const args = [
        '-p', String(port),
        '-o', 'StrictHostKeyChecking=no', // Auto-accept host keys (lab environment)
        '-o', 'UserKnownHostsFile=/dev/null', // Don't store host keys
        '-o', 'ServerAliveInterval=10', // Keep connection alive
        '-o', 'ServerAliveCountMax=3',
      ];

      // Add private key if provided
      if (privateKeyPath && privateKeyPath.trim() !== '') {
        args.push('-i', privateKeyPath);
      }

      // Add user@host
      args.push(`${username}@${host}`);

      // Spawn SSH process
      const shell = process.platform === 'win32' ? 'ssh.exe' : 'ssh';
      const ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
        env: process.env as { [key: string]: string },
      });

      console.log(`[${connectionId}] SSH spawned: ${shell} ${args.join(' ')}`);

      let connectionEstablished = false;
      let outputBuffer = ''; // Accumulate output for prompt detection

      // Store the session
      sshSessions.set(connectionId, {
        ptyProcess,
        connectionId,
        isPaused: false,
        queuedBytes: 0,
        password: password,
        passwordSent: false,
      });

      // Handle PTY data (both stdout and stderr combined)
      ptyProcess.onData((data: string) => {
        const session = sshSessions.get(connectionId);
        if (!session) return;

        // Accumulate output for password prompt detection
        outputBuffer += data;

        // Keep only last 500 chars to avoid memory issues
        if (outputBuffer.length > 500) {
          outputBuffer = outputBuffer.slice(-500);
        }

        // Detect password prompt and auto-type password
        // Common prompts: "password:", "Password:", "password for", "passphrase"
        const passwordPromptRegex = /(password|passphrase).*:\s*$/i;
        if (!session.passwordSent && session.password && passwordPromptRegex.test(outputBuffer.toLowerCase())) {
          console.log(`[${connectionId}] Password prompt detected, auto-typing password`);
          session.passwordSent = true;
          ptyProcess.write(session.password + '\r');
          // Don't send the password prompt to the UI
          return;
        }

        // Detect successful connection (shell prompt or welcome message)
        if (!connectionEstablished) {
          // Look for common shell prompts: $, #, >, or typical welcome messages
          const successIndicators = [
            /[$#>]\s*$/,           // Shell prompt
            /welcome/i,             // Welcome message
            /last login/i,          // Last login message
            /\[.*@.*\]/,           // [user@host] format
          ];

          if (successIndicators.some(pattern => pattern.test(outputBuffer))) {
            connectionEstablished = true;
            console.log(`[${connectionId}] SSH connection established`);
            resolve({ success: true });
          }
        }

        // Detect authentication failure
        const authFailureRegex = /(permission denied|authentication failed|access denied)/i;
        if (authFailureRegex.test(outputBuffer)) {
          console.error(`[${connectionId}] Authentication failed`);
          ptyProcess.kill();
          sshSessions.delete(connectionId);
          reject(new Error('Authentication failed'));
          return;
        }

        // Buffer and forward data to renderer
        let bufferState = dataBuffers.get(connectionId);

        if (!bufferState) {
          bufferState = { buffer: [], timer: null, lastFlush: Date.now() };
          dataBuffers.set(connectionId, bufferState);
        }

        bufferState.buffer.push(Buffer.from(data, 'utf-8'));

        // Calculate current buffer size
        const totalSize = bufferState.buffer.reduce((sum, buf) => sum + buf.length, 0);

        // Force flush if buffer is too large
        if (totalSize >= BUFFER_SIZE_BYTES) {
          if (bufferState.timer) {
            clearTimeout(bufferState.timer);
          }
          flushBuffer(connectionId);
          return;
        }

        // Schedule flush if not already scheduled
        if (!bufferState.timer) {
          const timeSinceLastFlush = Date.now() - bufferState.lastFlush;
          const delay = Math.max(0, MIN_FLUSH_INTERVAL_MS - timeSinceLastFlush);

          bufferState.timer = setTimeout(() => {
            flushBuffer(connectionId);
          }, Math.max(delay, BUFFER_TIME_MS));
        }
      });

      // Handle process exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`[${connectionId}] SSH process exited: code=${exitCode}, signal=${signal}`);

        // Cleanup buffer state
        const bufferState = dataBuffers.get(connectionId);
        if (bufferState) {
          if (bufferState.timer) clearTimeout(bufferState.timer);
          flushBuffer(connectionId); // Flush any remaining data
          dataBuffers.delete(connectionId);
        }

        sshSessions.delete(connectionId);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ssh-closed', { connectionId });
        }

        // If connection was never established, reject
        if (!connectionEstablished) {
          reject(new Error(`SSH connection failed: exit code ${exitCode}`));
        }
      });

      // Timeout if connection doesn't establish in 20 seconds
      setTimeout(() => {
        if (!connectionEstablished) {
          console.error(`[${connectionId}] SSH connection timeout`);
          ptyProcess.kill();
          sshSessions.delete(connectionId);
          reject(new Error('SSH connection timeout'));
        }
      }, 20000);

    } catch (error: any) {
      console.error(`[${connectionId}] Failed to create SSH session:`, error);
      sshSessions.delete(connectionId);
      reject(new Error(`Failed to create SSH session: ${error.message}`));
    }
  });
});

// Create local terminal session
ipcMain.handle('create-local-terminal', async (event, { connectionId }) => {
  return new Promise((resolve, reject) => {
    try {
      // Spawn PTY session for proper terminal emulation
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
        env: process.env as { [key: string]: string },
      });

      // Store the session with flow control state initialized
      localSessions.set(connectionId, {
        ptyProcess: ptyProcess,
        connectionId,
        isPaused: false,
        queuedBytes: 0,
      });

      // Forward PTY data to renderer with buffering
      ptyProcess.onData((data: string) => {
        let bufferState = dataBuffers.get(connectionId);

        if (!bufferState) {
          bufferState = { buffer: [], timer: null, lastFlush: Date.now() };
          dataBuffers.set(connectionId, bufferState);
        }

        bufferState.buffer.push(Buffer.from(data, 'utf8'));

        // Calculate current buffer size
        const totalSize = bufferState.buffer.reduce((sum, buf) => sum + buf.length, 0);

        // Force flush if buffer is too large
        if (totalSize >= BUFFER_SIZE_BYTES) {
          if (bufferState.timer) {
            clearTimeout(bufferState.timer);
          }
          flushBuffer(connectionId);
          return;
        }

        // Schedule flush if not already scheduled
        if (!bufferState.timer) {
          const timeSinceLastFlush = Date.now() - bufferState.lastFlush;
          const delay = Math.max(0, MIN_FLUSH_INTERVAL_MS - timeSinceLastFlush);

          bufferState.timer = setTimeout(() => {
            flushBuffer(connectionId);
          }, Math.max(delay, BUFFER_TIME_MS));
        }
      });

      // Handle process exit
      ptyProcess.onExit((e) => {
        // Cleanup buffer state
        const bufferState = dataBuffers.get(connectionId);
        if (bufferState) {
          if (bufferState.timer) clearTimeout(bufferState.timer);
          flushBuffer(connectionId); // Flush any remaining data
          dataBuffers.delete(connectionId);
        }

        localSessions.delete(connectionId);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ssh-closed', { connectionId });
        }
      });

      resolve({ success: true });
    } catch (error) {
      reject(error);
    }
  });
});

// Send data to SSH or local terminal session (fire-and-forget for low latency)
ipcMain.on('send-ssh-data', (event, { connectionId, data }) => {
  const sshSession = sshSessions.get(connectionId);
  if (sshSession && sshSession.ptyProcess) {
    sshSession.ptyProcess.write(data);
    return;
  }

  const localSession = localSessions.get(connectionId);
  if (localSession && localSession.ptyProcess) {
    localSession.ptyProcess.write(data);
  }
});

// Resize SSH or local terminal (fire-and-forget)
ipcMain.on('resize-ssh-terminal', (event, { connectionId, cols, rows }) => {
  const sshSession = sshSessions.get(connectionId);
  if (sshSession && sshSession.ptyProcess) {
    sshSession.ptyProcess.resize(cols, rows);
    return;
  }

  const localSession = localSessions.get(connectionId);
  if (localSession && localSession.ptyProcess) {
    localSession.ptyProcess.resize(cols, rows);
  }
});

// Close SSH or local terminal session (fire-and-forget)
ipcMain.on('close-ssh-session', (event, { connectionId }) => {
  const sshSession = sshSessions.get(connectionId);
  if (sshSession) {
    sshSession.ptyProcess.kill();
    sshSessions.delete(connectionId);
    return;
  }

  const localSession = localSessions.get(connectionId);
  if (localSession) {
    localSession.ptyProcess.kill();
    localSessions.delete(connectionId);
  }
});

// Flow control: renderer signals that data has been consumed
ipcMain.on('ssh-data-consumed', (event, { connectionId, bytesConsumed }) => {
  const sshSession = sshSessions.get(connectionId);
  if (sshSession) {
    // Decrement queued bytes counter
    sshSession.queuedBytes = Math.max(0, sshSession.queuedBytes - bytesConsumed);

    // Note: node-pty doesn't support pause/resume, but we track queue size for monitoring
    if (sshSession.queuedBytes < RESUME_THRESHOLD_BYTES && sshSession.isPaused) {
      sshSession.isPaused = false;
      console.log(`[${connectionId}] SSH queue resumed: queue size ${sshSession.queuedBytes} bytes`);
    }
    return;
  }

  const localSession = localSessions.get(connectionId);
  if (localSession) {
    // Decrement queued bytes counter
    localSession.queuedBytes = Math.max(0, localSession.queuedBytes - bytesConsumed);

    // Note: node-pty doesn't support pause/resume, but we track queue size for monitoring
    if (localSession.queuedBytes < RESUME_THRESHOLD_BYTES && localSession.isPaused) {
      localSession.isPaused = false;
      console.log(`[${connectionId}] Local terminal queue resumed: queue size ${localSession.queuedBytes} bytes`);
    }
  }
});

// Periodic latency measurement - DISABLED
// The latency measurement was causing issues by sending space+backspace characters
// which would appear as ^H when the user is in an interactive input mode (like cat, vim, etc.)
// Disabled for better user experience. Connection status is still shown without exact latency.

// let latencyMeasurementActive = false;
// setInterval(() => {
//   if (latencyMeasurementActive) return;
//   sshSessions.forEach((session) => {
//     if (session.stream && !session.stream.destroyed) {
//       latencyMeasurementActive = true;
//       const startTime = Date.now();
//       let responded = false;
//       const onData = (data: Buffer) => {
//         if (!responded) {
//           responded = true;
//           const latency = Date.now() - startTime;
//           session.latency = latency;
//           session.lastPingTime = Date.now();
//           if (mainWindow && !mainWindow.isDestroyed()) {
//             mainWindow.webContents.send('ssh-latency', {
//               connectionId: session.connectionId,
//               latency: latency,
//             });
//           }
//           session.stream.removeListener('data', onData);
//           latencyMeasurementActive = false;
//         }
//       };
//       session.stream.on('data', onData);
//       session.stream.write(' \b');
//       setTimeout(() => {
//         session.stream.removeListener('data', onData);
//         latencyMeasurementActive = false;
//       }, 2000);
//     }
//   });
// }, 3000);

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

// Open native terminal with SSH connection
// NOTE: This provides faster terminal performance but reduced security
// Passwords may be visible in process list on some platforms
ipcMain.handle('open-native-terminal', async (event, { host, port = 22, username, password, privateKeyPath, label }) => {
  return new Promise((resolve, reject) => {
    try {
      let command: string;
      const displayLabel = label || `${username}@${host}:${port}`;

      if (process.platform === 'win32') {
        // Windows: Use Windows Terminal if available, otherwise cmd with ssh
        // Check if Windows Terminal is available
        const wtCommand = privateKeyPath
          ? `wt.exe new-tab --title "${displayLabel}" ssh -i "${privateKeyPath}" -p ${port} ${username}@${host}`
          : password
          ? `wt.exe new-tab --title "${displayLabel}" cmd /k "echo Connecting to ${displayLabel}... && ssh -p ${port} ${username}@${host}"`
          : `wt.exe new-tab --title "${displayLabel}" ssh -p ${port} ${username}@${host}`;

        // Try Windows Terminal first, fallback to cmd
        exec(wtCommand, (error) => {
          if (error) {
            // Fallback to cmd if Windows Terminal not available
            const fallbackCommand = privateKeyPath
              ? `start "SSH: ${displayLabel}" cmd /k "ssh -i "${privateKeyPath}" -p ${port} ${username}@${host}"`
              : `start "SSH: ${displayLabel}" cmd /k "ssh -p ${port} ${username}@${host}"`;

            exec(fallbackCommand, (fallbackError) => {
              if (fallbackError) {
                reject(new Error(`Failed to open terminal: ${fallbackError.message}`));
              } else {
                resolve({ success: true, method: 'cmd' });
              }
            });
          } else {
            resolve({ success: true, method: 'windows-terminal' });
          }
        });

      } else if (process.platform === 'darwin') {
        // macOS: Use Terminal.app or iTerm2
        // Note: Password authentication will prompt interactively in the terminal
        const sshCommand = privateKeyPath
          ? `ssh -i '${privateKeyPath}' -p ${port} ${username}@${host}`
          : `ssh -p ${port} ${username}@${host}`;

        // AppleScript to open Terminal.app with the SSH command
        command = `osascript -e 'tell app "Terminal" to do script "${sshCommand}"'`;

        exec(command, (error) => {
          if (error) {
            reject(new Error(`Failed to open terminal: ${error.message}`));
          } else {
            resolve({ success: true, method: 'terminal-app' });
          }
        });

      } else {
        // Linux: Try gnome-terminal (most common), fallback to others
        const sshCommand = privateKeyPath
          ? `ssh -i '${privateKeyPath}' -p ${port} ${username}@${host}`
          : `ssh -p ${port} ${username}@${host}`;

        // Try gnome-terminal first
        command = `gnome-terminal -- bash -c "${sshCommand}; exec bash"`;

        exec(command, (error) => {
          if (error) {
            // Try konsole as fallback
            const konsoleCmd = `konsole -e bash -c "${sshCommand}; exec bash"`;
            exec(konsoleCmd, (konsoleError) => {
              if (konsoleError) {
                // Try xterm as last resort
                const xtermCmd = `xterm -e bash -c "${sshCommand}; exec bash"`;
                exec(xtermCmd, (xtermError) => {
                  if (xtermError) {
                    reject(new Error('No suitable terminal emulator found. Please install gnome-terminal, konsole, or xterm.'));
                  } else {
                    resolve({ success: true, method: 'xterm' });
                  }
                });
              } else {
                resolve({ success: true, method: 'konsole' });
              }
            });
          } else {
            resolve({ success: true, method: 'gnome-terminal' });
          }
        });
      }

    } catch (error: any) {
      reject(new Error(`Failed to open native terminal: ${error.message}`));
    }
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
