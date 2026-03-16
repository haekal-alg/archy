/**
 * Local terminal session management
 * Handles local shell sessions via node-pty with directory tracking
 */

import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import log from './logger';
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
import {
  initCwdTracker,
  feedOutput,
  getTrackedCwd,
  queryOsCwd,
  cleanupCwdTracker,
} from './cwd-tracker';

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
 * Resolve shell executable and arguments based on shell type
 */
function resolveShell(shellType?: string): { exe: string; args: string[]; trackerType: 'cmd' | 'bash' | 'powershell' } {
  switch (shellType) {
    case 'wsl':
      return { exe: 'wsl.exe', args: [], trackerType: 'bash' };
    case 'powershell':
      return { exe: 'powershell.exe', args: ['-NoLogo'], trackerType: 'powershell' };
    case 'cmd':
    default:
      return {
        exe: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
        args: [],
        trackerType: process.platform === 'win32' ? 'cmd' : 'bash',
      };
  }
}

/**
 * Create a local terminal session
 */
export function createLocalTerminal(connectionId: string, cwd?: string, shellType?: string): Promise<{ success: boolean; cwd: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Clean up any existing session with the same ID (for retry support)
      const existingSession = localSessions.get(connectionId);
      if (existingSession) {
        log.info(`[${connectionId}] Cleaning up existing local session for retry`);
        try {
          existingSession.ptyProcess.kill();
        } catch (e) {
          // Ignore kill errors for already-dead processes
        }
        localSessions.delete(connectionId);
        localInputBuffers.delete(connectionId);
        localDirStacks.delete(connectionId);
        cleanupBuffer(connectionId);
        cleanupCwdTracker(connectionId);
      }

      const shell = resolveShell(shellType);

      const defaultCwd = getHomeDirectory();
      // For WSL with a Unix-style CWD, pass it via --cd arg instead of pty cwd
      let initialCwd = defaultCwd;
      let shellArgs = [...shell.args];

      if (shellType === 'wsl' && cwd && cwd.startsWith('/')) {
        // WSL Unix path: use --cd to set starting directory
        shellArgs = ['--cd', cwd, ...shellArgs];
        initialCwd = defaultCwd; // pty cwd must be a valid Windows path
      } else {
        initialCwd = resolveLocalCwd(defaultCwd, cwd) || defaultCwd;
      }

      const ptyProcess = pty.spawn(shell.exe, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: initialCwd,
        env: process.env as { [key: string]: string },
      });

      // For WSL, the effective CWD is the Unix path if provided
      const effectiveCwd = (shellType === 'wsl' && cwd && cwd.startsWith('/')) ? cwd : initialCwd;

      // Store the session with flow control state initialized
      localSessions.set(connectionId, {
        ptyProcess: ptyProcess,
        connectionId,
        isPaused: false,
        queuedBytes: 0,
        cwd: effectiveCwd,
      });
      localInputBuffers.set(connectionId, '');
      localDirStacks.set(connectionId, []);

      // Initialize output-based CWD tracking with correct shell type
      initCwdTracker(connectionId, ptyProcess.pid, shell.trackerType, effectiveCwd);

      // Forward PTY data to renderer with buffering
      ptyProcess.onData((data: string) => {
        // Guard: skip if session was already cleaned up (prevents orphaned buffers)
        const session = localSessions.get(connectionId);
        if (!session) return;

        // Scan output for prompt patterns to track real CWD
        const detectedCwd = feedOutput(connectionId, data);
        if (detectedCwd) {
          session.cwd = detectedCwd;
        }
        bufferData(connectionId, data);
      });

      // Handle process exit
      ptyProcess.onExit((e) => {
        // Guard: skip if session was already cleaned up by closeLocalTerminal
        if (!localSessions.has(connectionId)) return;

        // Guard: skip if a new session has replaced this one (retry scenario)
        const currentSession = localSessions.get(connectionId);
        if (currentSession && currentSession.ptyProcess !== ptyProcess) {
          log.info(`[${connectionId}] Ignoring stale onExit from previous local session`);
          return;
        }

        // Cleanup buffer state
        cleanupBuffer(connectionId);
        cleanupCwdTracker(connectionId);

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
  cleanupCwdTracker(connectionId);

  const session = localSessions.get(connectionId);
  if (session) {
    try {
      session.ptyProcess.kill();
    } catch (e) {
      log.info(`[${connectionId}] Local process already terminated`);
    }
    localSessions.delete(connectionId);
    localInputBuffers.delete(connectionId);
    localDirStacks.delete(connectionId);
  }
}

/**
 * Get the current working directory of a local terminal (synchronous).
 * Prefers output-based tracking, falls back to session.cwd.
 */
export function getLocalTerminalCwd(connectionId: string): string | null {
  const tracked = getTrackedCwd(connectionId);
  if (tracked) return tracked;
  const session = localSessions.get(connectionId);
  return session?.cwd || null;
}

/**
 * Get the current working directory of a local terminal (async).
 * Uses OS-level query on Linux/macOS for authoritative result,
 * falls back to prompt-detected or session CWD.
 */
export async function getLocalTerminalCwdAsync(connectionId: string): Promise<string | null> {
  const osCwd = await queryOsCwd(connectionId);
  if (osCwd) return osCwd;
  return getLocalTerminalCwd(connectionId);
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
      log.info(`[${connectionId}] Local terminal queue resumed: queue size ${session.queuedBytes} bytes`);
    }
  }
}
