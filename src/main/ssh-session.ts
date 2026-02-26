/**
 * SSH session management
 * Handles SSH connections via native SSH client and node-pty
 */

import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import {
  bufferData,
  cleanupBuffer,
  BUFFER_SIZE_BYTES,
  MIN_FLUSH_INTERVAL_MS,
  BUFFER_TIME_MS,
  flushBuffer,
  getBufferState,
} from './buffer-manager';

/**
 * SSH port forwarding configuration
 */
export interface SSHPortForward {
  localPort: number;
  remoteHost: string;
  remotePort: number;
  bindAddress?: string;
}

/**
 * SSH session state
 */
export interface SSHSession {
  ptyProcess: pty.IPty;
  connectionId: string;
  isPaused: boolean;
  queuedBytes: number;
  password?: string;
  passwordSent: boolean;
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  portForwards?: SSHPortForward[];
}

/**
 * SSH session creation configuration
 */
export interface SSHSessionConfig {
  connectionId: string;
  host: string;
  port?: number;
  username: string;
  password: string;
  privateKeyPath?: string;
  portForwards?: SSHPortForward[];
}

/**
 * Disconnect reason for auto-reconnect logic
 */
export type DisconnectReason = 'user' | 'network' | 'auth' | 'timeout' | 'unknown';

/**
 * SSH close event data
 */
export interface SSHCloseEvent {
  connectionId: string;
  reason: DisconnectReason;
  exitCode?: number;
  signal?: number;
}

// Store active SSH sessions
const sshSessions = new Map<string, SSHSession>();

// Track user-initiated closes (for auto-reconnect logic)
const userInitiatedCloses = new Set<string>();

// Reference to main window for IPC
let mainWindowRef: BrowserWindow | null = null;

/**
 * Initialize the SSH session manager
 */
export function initSSHSessionManager(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Update the main window reference
 */
export function setMainWindow(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Get an SSH session by connection ID
 */
export function getSSHSession(connectionId: string): SSHSession | undefined {
  return sshSessions.get(connectionId);
}

/**
 * Get all SSH sessions
 */
export function getAllSSHSessions(): Map<string, SSHSession> {
  return sshSessions;
}

/**
 * Mark a close as user-initiated (for auto-reconnect logic)
 */
export function markUserInitiatedClose(connectionId: string): void {
  userInitiatedCloses.add(connectionId);
}

/**
 * Create an SSH session
 */
export function createSSHSession(config: SSHSessionConfig): Promise<{ success: boolean }> {
  const {
    connectionId,
    host,
    port = 22,
    username,
    password,
    privateKeyPath,
    portForwards = [],
  } = config;

  return new Promise((resolve, reject) => {
    // Clean up any existing session with the same ID (for retry support)
    const existingSession = sshSessions.get(connectionId);
    if (existingSession) {
      console.log(`[${connectionId}] Cleaning up existing session for retry`);
      try {
        existingSession.ptyProcess.kill();
      } catch (e) {
        // Ignore kill errors for already-dead processes
      }
      sshSessions.delete(connectionId);
      cleanupBuffer(connectionId);
    }

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

      // Add local port forwards (-L)
      const validPortForwards = (portForwards || [])
        .map((forward) => ({
          localPort: Number(forward.localPort),
          remoteHost: String(forward.remoteHost || '').trim(),
          remotePort: Number(forward.remotePort),
          bindAddress: forward.bindAddress ? String(forward.bindAddress).trim() : undefined,
        }))
        .filter((forward) => (
          Number.isFinite(forward.localPort) &&
          forward.localPort > 0 &&
          Number.isFinite(forward.remotePort) &&
          forward.remotePort > 0 &&
          forward.remoteHost.length > 0
        ));

      validPortForwards.forEach((forward) => {
        const spec = forward.bindAddress && forward.bindAddress.length > 0
          ? `${forward.bindAddress}:${forward.localPort}:${forward.remoteHost}:${forward.remotePort}`
          : `${forward.localPort}:${forward.remoteHost}:${forward.remotePort}`;
        args.push('-L', spec);
      });

      // Add user@host
      args.push(`${username}@${host}`);

      // Spawn SSH process with error handling
      const shell = process.platform === 'win32' ? 'ssh.exe' : 'ssh';
      let ptyProcess: pty.IPty;

      try {
        ptyProcess = pty.spawn(shell, args, {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
          env: process.env as { [key: string]: string },
        });
      } catch (spawnError: any) {
        console.error(`[${connectionId}] Failed to spawn SSH process:`, spawnError);
        reject(new Error(`Failed to spawn SSH process: ${spawnError.message}`));
        return;
      }

      console.log(`[${connectionId}] SSH spawned: ${shell} ${args.join(' ')}`);

      let connectionEstablished = false;
      let outputBuffer = ''; // Accumulate output for prompt detection
      let authFailed = false;

      // Store the session with connection details for SFTP
      const session: SSHSession = {
        ptyProcess,
        connectionId,
        isPaused: false,
        queuedBytes: 0,
        password: password,
        passwordSent: false,
        host,
        port,
        username,
        privateKeyPath,
        portForwards: validPortForwards,
      };
      sshSessions.set(connectionId, session);

      // Handle PTY data (both stdout and stderr combined)
      ptyProcess.onData((data: string) => {
        const currentSession = sshSessions.get(connectionId);
        if (!currentSession) return;

        // Accumulate output for password prompt detection
        outputBuffer += data;

        // Keep only last 500 chars to avoid memory issues
        if (outputBuffer.length > 500) {
          outputBuffer = outputBuffer.slice(-500);
        }

        // Detect password prompt and auto-type password
        const passwordPromptRegex = /(password|passphrase).*:\s*$/i;
        if (!currentSession.passwordSent && currentSession.password && passwordPromptRegex.test(outputBuffer.toLowerCase())) {
          console.log(`[${connectionId}] Password prompt detected, auto-typing password`);
          currentSession.passwordSent = true;
          ptyProcess.write(currentSession.password + '\r');
          return;
        }

        // Detect successful connection (shell prompt or welcome message)
        if (!connectionEstablished) {
          const successIndicators = [
            /[$#>]\s*$/,           // Shell prompt
            /welcome/i,             // Welcome message
            /last login/i,          // Last login message
            /\[.*@.*\]/,           // [user@host] format
          ];

          if (successIndicators.some(pattern => pattern.test(outputBuffer))) {
            connectionEstablished = true;
            console.log(`[${connectionId}] SSH connection established`);
            // Clear output buffer after connection established to prevent false positives
            outputBuffer = '';
            resolve({ success: true });
          }
        }

        // Detect authentication failure - ONLY before connection is established
        // After connection is established, programs like tmux may output "permission denied"
        // for file operations which should not kill the connection
        if (!connectionEstablished && !authFailed) {
          const authFailureRegex = /(permission denied|authentication failed|access denied)/i;
          if (authFailureRegex.test(outputBuffer)) {
            authFailed = true;
            console.error(`[${connectionId}] Authentication failed`);
            ptyProcess.kill();
            sshSessions.delete(connectionId);
            reject(new Error('Authentication failed'));
            return;
          }
        }

        // Buffer and forward data to renderer
        bufferData(connectionId, data);
      });

      // Handle process exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`[${connectionId}] SSH process exited: code=${exitCode}, signal=${signal}`);

        // Cleanup buffer state
        cleanupBuffer(connectionId);

        // Determine disconnect reason
        const wasUserInitiated = userInitiatedCloses.has(connectionId);
        userInitiatedCloses.delete(connectionId);

        let reason: DisconnectReason = 'unknown';
        if (wasUserInitiated) {
          reason = 'user';
        } else if (authFailed) {
          reason = 'auth';
        } else if (exitCode === 255) {
          // Exit code 255 typically indicates network issues
          reason = 'network';
        }

        sshSessions.delete(connectionId);

        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('ssh-closed', {
            connectionId,
            reason,
            exitCode,
            signal,
          } as SSHCloseEvent);
        }

        // If connection was never established, reject
        if (!connectionEstablished && !authFailed) {
          reject(new Error(`SSH connection failed: exit code ${exitCode}`));
        }
      });

      // Timeout if connection doesn't establish in 20 seconds
      setTimeout(() => {
        if (!connectionEstablished && sshSessions.has(connectionId)) {
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
}

/**
 * Send data to an SSH session
 */
export function sendSSHData(connectionId: string, data: string): boolean {
  const session = sshSessions.get(connectionId);
  if (session && session.ptyProcess) {
    session.ptyProcess.write(data);
    return true;
  }
  return false;
}

/**
 * Resize an SSH session's terminal
 */
export function resizeSSHTerminal(connectionId: string, cols: number, rows: number): boolean {
  const session = sshSessions.get(connectionId);
  if (session && session.ptyProcess) {
    session.ptyProcess.resize(cols, rows);
    return true;
  }
  return false;
}

/**
 * Close an SSH session
 */
export function closeSSHSession(connectionId: string, userInitiated: boolean = false): void {
  // Mark as user-initiated if applicable
  if (userInitiated) {
    markUserInitiatedClose(connectionId);
  }

  // Clean up buffer state first
  cleanupBuffer(connectionId);

  const session = sshSessions.get(connectionId);
  if (session) {
    try {
      session.ptyProcess.kill();
    } catch (e) {
      console.log(`[${connectionId}] SSH process already terminated`);
    }
    sshSessions.delete(connectionId);
  }
}

/**
 * Handle flow control - called when renderer signals data consumption
 */
export function handleSSHDataConsumed(connectionId: string, bytesConsumed: number): void {
  const session = sshSessions.get(connectionId);
  if (session) {
    session.queuedBytes = Math.max(0, session.queuedBytes - bytesConsumed);

    if (session.queuedBytes < 32768 && session.isPaused) {
      session.isPaused = false;
      console.log(`[${connectionId}] SSH queue resumed: queue size ${session.queuedBytes} bytes`);
    }
  }
}
