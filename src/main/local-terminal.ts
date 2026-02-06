/**
 * Local terminal session management
 * Handles local shell sessions via node-pty with directory tracking
 */

import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import {
  getHomeDirectory,
  resolveLocalCwd,
  updateInputBuffer,
  parseCwdCommand,
} from './shell-utils';
import {
  bufferData,
  cleanupBuffer,
} from './buffer-manager';

/**
 * Local terminal session state
 */
export interface LocalSession {
  ptyProcess: pty.IPty;
  connectionId: string;
  isPaused: boolean;
  queuedBytes: number;
  cwd: string;
}

// Store active local terminal sessions
const localSessions = new Map<string, LocalSession>();
const localInputBuffers = new Map<string, string>();
const localDirStacks = new Map<string, string[]>();

// Reference to main window for IPC
let mainWindowRef: BrowserWindow | null = null;

/**
 * Initialize the local terminal manager
 */
export function initLocalTerminalManager(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Update the main window reference
 */
export function setMainWindow(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Get a local session by connection ID
 */
export function getLocalSession(connectionId: string): LocalSession | undefined {
  return localSessions.get(connectionId);
}

/**
 * Get all local sessions
 */
export function getAllLocalSessions(): Map<string, LocalSession> {
  return localSessions;
}

/**
 * Create a local terminal session
 */
export function createLocalTerminal(connectionId: string, cwd?: string): Promise<{ success: boolean; cwd: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Spawn PTY session for proper terminal emulation
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

      const defaultCwd = getHomeDirectory();
      const initialCwd = resolveLocalCwd(defaultCwd, cwd) || defaultCwd;

      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: initialCwd,
        env: process.env as { [key: string]: string },
      });

      // Store the session with flow control state initialized
      localSessions.set(connectionId, {
        ptyProcess: ptyProcess,
        connectionId,
        isPaused: false,
        queuedBytes: 0,
        cwd: initialCwd,
      });
      localInputBuffers.set(connectionId, '');
      localDirStacks.set(connectionId, []);

      // Forward PTY data to renderer with buffering
      ptyProcess.onData((data: string) => {
        bufferData(connectionId, data);
      });

      // Handle process exit
      ptyProcess.onExit((e) => {
        // Cleanup buffer state
        cleanupBuffer(connectionId);

        localInputBuffers.delete(connectionId);
        localDirStacks.delete(connectionId);
        localSessions.delete(connectionId);

        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('ssh-closed', { connectionId });
        }
      });

      resolve({ success: true, cwd: initialCwd });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send data to a local terminal session
 * Also tracks directory changes for "Open in Explorer" functionality
 */
export function sendLocalData(connectionId: string, data: string): boolean {
  const localSession = localSessions.get(connectionId);
  if (!localSession || !localSession.ptyProcess) {
    return false;
  }

  // Track input for directory change detection
  const bufferState = localInputBuffers.get(connectionId) || '';
  const { buffer, commands } = updateInputBuffer(bufferState, data);
  localInputBuffers.set(connectionId, buffer);

  // Process directory change commands
  if (commands.length > 0) {
    const dirStack = localDirStacks.get(connectionId) || [];

    commands.forEach((command) => {
      const parsed = parseCwdCommand(command);
      if (!parsed) {
        return;
      }

      if (parsed.action === 'popd') {
        const previous = dirStack.pop();
        if (previous) {
          const resolved = resolveLocalCwd(previous, '.');
          if (resolved) {
            localSession.cwd = resolved;
          }
        }
        return;
      }

      if (parsed.action === 'pushd') {
        dirStack.push(localSession.cwd);
      }

      const resolved = resolveLocalCwd(localSession.cwd, parsed.target || '');
      if (resolved) {
        localSession.cwd = resolved;
      }
    });

    localDirStacks.set(connectionId, dirStack);
  }

  localSession.ptyProcess.write(data);
  return true;
}

/**
 * Resize a local terminal session
 */
export function resizeLocalTerminal(connectionId: string, cols: number, rows: number): boolean {
  const session = localSessions.get(connectionId);
  if (session && session.ptyProcess) {
    session.ptyProcess.resize(cols, rows);
    return true;
  }
  return false;
}

/**
 * Close a local terminal session
 */
export function closeLocalTerminal(connectionId: string): void {
  // Clean up buffer state first
  cleanupBuffer(connectionId);

  const session = localSessions.get(connectionId);
  if (session) {
    try {
      session.ptyProcess.kill();
    } catch (e) {
      console.log(`[${connectionId}] Local process already terminated`);
    }
    localSessions.delete(connectionId);
    localInputBuffers.delete(connectionId);
    localDirStacks.delete(connectionId);
  }
}

/**
 * Get the current working directory of a local terminal
 */
export function getLocalTerminalCwd(connectionId: string): string | null {
  const session = localSessions.get(connectionId);
  return session?.cwd || null;
}

/**
 * Handle flow control - called when renderer signals data consumption
 */
export function handleLocalDataConsumed(connectionId: string, bytesConsumed: number): void {
  const session = localSessions.get(connectionId);
  if (session) {
    session.queuedBytes = Math.max(0, session.queuedBytes - bytesConsumed);

    if (session.queuedBytes < 32768 && session.isPaused) {
      session.isPaused = false;
      console.log(`[${connectionId}] Local terminal queue resumed: queue size ${session.queuedBytes} bytes`);
    }
  }
}
