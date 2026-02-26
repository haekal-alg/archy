/**
 * Terminal IPC handlers
 * Dispatches terminal-related IPC messages to appropriate session managers
 */

import { ipcMain, shell } from 'electron';
import {
  sendSSHData,
  resizeSSHTerminal,
  closeSSHSession,
  handleSSHDataConsumed,
  getSSHSession,
  markUserInitiatedClose,
} from './ssh-session';
import {
  sendLocalData,
  resizeLocalTerminal,
  closeLocalTerminal,
  handleLocalDataConsumed,
  getLocalSession,
  getLocalTerminalCwd,
} from './local-terminal';
import { cleanupBuffer } from './buffer-manager';

/**
 * Register all terminal-related IPC handlers
 */
export function registerTerminalIPCHandlers(): void {
  // Send data to SSH or local terminal session (fire-and-forget for low latency)
  ipcMain.on('send-ssh-data', (event, { connectionId, data }) => {
    // Try SSH first
    if (sendSSHData(connectionId, data)) {
      return;
    }

    // Then try local terminal
    sendLocalData(connectionId, data);
  });

  // Resize SSH or local terminal (fire-and-forget)
  ipcMain.on('resize-ssh-terminal', (event, { connectionId, cols, rows }) => {
    // Try SSH first
    if (resizeSSHTerminal(connectionId, cols, rows)) {
      return;
    }

    // Then try local terminal
    resizeLocalTerminal(connectionId, cols, rows);
  });

  // Close SSH or local terminal session (fire-and-forget)
  ipcMain.on('close-ssh-session', (event, { connectionId }) => {
    // Clean up buffer state first
    cleanupBuffer(connectionId);

    // Check if it's an SSH session
    const sshSession = getSSHSession(connectionId);
    if (sshSession) {
      closeSSHSession(connectionId, true); // Mark as user-initiated
      return;
    }

    // Check if it's a local session
    const localSession = getLocalSession(connectionId);
    if (localSession) {
      closeLocalTerminal(connectionId);
    }
  });

  // Flow control: renderer signals that data has been consumed
  ipcMain.on('ssh-data-consumed', (event, { connectionId, bytesConsumed }) => {
    // Try SSH first
    const sshSession = getSSHSession(connectionId);
    if (sshSession) {
      handleSSHDataConsumed(connectionId, bytesConsumed);
      return;
    }

    // Try local terminal
    const localSession = getLocalSession(connectionId);
    if (localSession) {
      handleLocalDataConsumed(connectionId, bytesConsumed);
    }
  });

  // Open local terminal's directory in system file explorer
  ipcMain.handle('open-terminal-in-explorer', async (event, { connectionId }) => {
    const cwd = getLocalTerminalCwd(connectionId);
    if (cwd) {
      try {
        await shell.openPath(cwd);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to open explorer' };
      }
    }
    return { success: false, error: 'Local terminal session not found' };
  });

  // Get local terminal's current working directory
  ipcMain.handle('get-local-terminal-cwd', async (event, { connectionId }) => {
    const cwd = getLocalTerminalCwd(connectionId);
    if (cwd) {
      return { success: true, cwd };
    }
    return { success: false, error: 'Local terminal session not found' };
  });
}
