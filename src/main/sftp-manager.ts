/**
 * SFTP file transfer manager
 * Handles SFTP connections and file operations
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from './logger';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { getSSHSession, SSHSession } from './ssh-session';
import { getHomeDirectory } from './shell-utils';

const SftpClient = require('ssh2-sftp-client');
const { readFile, stat, readdir } = fsPromises;

// Store active SFTP connections (persistent while modal is open)
const sftpClients = new Map<string, any>();

/**
 * Register all SFTP-related IPC handlers
 */
export function registerSFTPIPCHandlers(): void {
  // Get home directory
  ipcMain.handle('get-home-directory', async () => {
    return getHomeDirectory();
  });

  // List local files
  ipcMain.handle('list-local-files', async (event, dirPath: string) => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      // Process all file stats in parallel to avoid blocking event loop
      const filePromises = entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        try {
          const stats = await stat(fullPath);
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modifiedTime: stats.mtime.toISOString(),
            path: fullPath,
          };
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(filePromises);
      const files = results.filter((f): f is NonNullable<typeof f> => f !== null);

      // Add parent directory entry (..) if not at root
      const parentPath = path.dirname(dirPath);
      if (parentPath !== dirPath) {
        files.unshift({
          name: '..',
          type: 'directory' as const,
          size: 0,
          modifiedTime: '',
          path: parentPath,
        });
      }

      return files;
    } catch (err: any) {
      throw new Error(`Failed to read directory: ${err.message}`);
    }
  });

  // List remote files via SFTP protocol
  ipcMain.handle('list-remote-files', async (event, { connectionId, path: remotePath }) => {
    log.info(`[SFTP] Listing remote files for connection ${connectionId}, path: ${remotePath}`);

    const session = getSSHSession(connectionId);
    if (!session) {
      log.error('[SFTP] SSH session not found for connectionId:', connectionId);
      throw new Error('SSH session not found. Please connect first.');
    }

    log.info(`[SFTP] Found session - host: ${session.host}, port: ${session.port}, username: ${session.username}`);

    let sftp = sftpClients.get(connectionId);
    let needsNewConnection = !sftp;

    // Validate existing connection is still alive
    if (sftp) {
      try {
        await sftp.cwd();
        log.info('[SFTP] Reusing existing SFTP connection (validated)');
      } catch (validationError) {
        log.info('[SFTP] Existing connection is stale, creating new one');
        try {
          await sftp.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        sftpClients.delete(connectionId);
        sftp = null;
        needsNewConnection = true;
      }
    }

    if (needsNewConnection) {
      log.info('[SFTP] Creating new SFTP client');
      sftp = new SftpClient();

      const config: any = {
        host: session.host,
        port: session.port,
        username: session.username,
        readyTimeout: 20000,
        retries: 3,
        retry_minTimeout: 2000,
      };

      // Add authentication (password or private key)
      if (session.privateKeyPath && session.privateKeyPath.trim() !== '') {
        log.info(`[SFTP] Using private key authentication: ${session.privateKeyPath}`);
        try {
          const privateKey = await readFile(session.privateKeyPath, 'utf8');
          config.privateKey = privateKey;
          if (session.password) {
            config.passphrase = session.password;
          }
        } catch (error: any) {
          log.error('[SFTP] Failed to read private key:', error.message);
          throw new Error(`Failed to read private key file: ${error.message}`);
        }
      } else if (session.password) {
        log.info('[SFTP] Using password authentication');
        config.password = session.password;
      } else {
        log.error('[SFTP] No authentication method available');
        throw new Error('No authentication credentials found');
      }

      try {
        log.info('[SFTP] Connecting to SFTP server...');
        await sftp.connect(config);
        log.info('[SFTP] Connected successfully');
        sftpClients.set(connectionId, sftp);
        log.info('[SFTP] Connection stored for reuse');
      } catch (error: any) {
        log.error('[SFTP] Connection failed:', error.message);
        try {
          await sftp.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        throw new Error(`Failed to connect to SFTP server: ${error.message}`);
      }
    }

    try {
      log.info(`[SFTP] Listing directory: ${remotePath}`);
      const fileList = await sftp.list(remotePath);
      log.info(`[SFTP] Number of items: ${fileList.length}`);

      const files = fileList.map((file: any) => ({
        name: file.name,
        type: file.type === 'd' ? 'directory' : 'file',
        size: file.size,
        modifiedTime: new Date(file.modifyTime).toISOString(),
        path: path.posix.join(remotePath, file.name),
      }));

      // Add parent directory entry if not at root
      const parentPath = path.posix.dirname(remotePath);
      if (parentPath !== remotePath) {
        files.unshift({
          name: '..',
          type: 'directory' as const,
          size: 0,
          modifiedTime: '',
          path: parentPath,
        });
      }

      log.info(`[SFTP] Returning ${files.length} files`);
      return files;
    } catch (error: any) {
      log.error('[SFTP] Error listing files:', error.message);
      sftpClients.delete(connectionId);
      try {
        await sftp.end();
      } catch (e) {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to list remote files: ${error.message}`);
    }
  });

  // Close SFTP connection
  ipcMain.handle('close-sftp-connection', async (event, connectionId: string) => {
    log.info(`[SFTP] Closing connection for ${connectionId}`);

    const sftp = sftpClients.get(connectionId);
    if (sftp) {
      try {
        await sftp.end();
        sftpClients.delete(connectionId);
        log.info(`[SFTP] Connection closed and removed from cache`);
      } catch (error: any) {
        log.error('[SFTP] Error closing connection:', error.message);
        sftpClients.delete(connectionId);
      }
    } else {
      log.info(`[SFTP] No active connection found for ${connectionId}`);
    }
  });

  // Upload file from local to remote (with progress reporting)
  ipcMain.handle('upload-file', async (event, { connectionId, localPath: localFilePath, remotePath, fileName }) => {
    log.info(`[SFTP] Upload file request:`, { connectionId, localPath: localFilePath, remotePath, fileName });

    const sftp = sftpClients.get(connectionId);
    if (!sftp) {
      log.error('[SFTP] No active SFTP connection for upload');
      throw new Error('No active SFTP connection. Please ensure connection is established.');
    }

    try {
      const remoteFilePath = path.posix.join(remotePath, fileName);
      log.info(`[SFTP] Uploading from ${localFilePath} to ${remoteFilePath}`);

      const mainWindow = BrowserWindow.getAllWindows()[0];
      let lastProgressTime = 0;

      try {
        await sftp.fastPut(localFilePath, remoteFilePath, {
          step: (transferred: number, _chunk: number, total: number) => {
            const now = Date.now();
            if (now - lastProgressTime < 100 && transferred < total) return;
            lastProgressTime = now;
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('sftp-progress', {
                connectionId, fileName,
                bytesTransferred: transferred,
                totalBytes: total,
                direction: 'upload',
              });
            }
          },
        });
      } catch (fastPutError: any) {
        log.info('[SFTP] fastPut failed, falling back to put:', fastPutError.message);
        await sftp.put(localFilePath, remoteFilePath);
      }

      log.info(`[SFTP] Upload successful: ${fileName}`);
      return { success: true };
    } catch (error: any) {
      log.error('[SFTP] Upload error:', error.message);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  });

  // Download file from remote to local (with progress reporting)
  ipcMain.handle('download-file', async (event, { connectionId, remotePath, localPath, fileName }) => {
    log.info(`[SFTP] Download file request:`, { connectionId, remotePath, localPath, fileName });

    const sftp = sftpClients.get(connectionId);
    if (!sftp) {
      log.error('[SFTP] No active SFTP connection for download');
      throw new Error('No active SFTP connection. Please ensure connection is established.');
    }

    try {
      const localFilePath = path.join(localPath, fileName);
      log.info(`[SFTP] Downloading from ${remotePath} to ${localFilePath}`);

      const mainWindow = BrowserWindow.getAllWindows()[0];
      let lastProgressTime = 0;

      try {
        await sftp.fastGet(remotePath, localFilePath, {
          step: (transferred: number, _chunk: number, total: number) => {
            const now = Date.now();
            if (now - lastProgressTime < 100 && transferred < total) return;
            lastProgressTime = now;
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('sftp-progress', {
                connectionId, fileName,
                bytesTransferred: transferred,
                totalBytes: total,
                direction: 'download',
              });
            }
          },
        });
      } catch (fastGetError: any) {
        log.info('[SFTP] fastGet failed, falling back to get:', fastGetError.message);
        await sftp.get(remotePath, localFilePath);
      }

      log.info(`[SFTP] Download successful: ${fileName}`);
      return { success: true };
    } catch (error: any) {
      log.error('[SFTP] Download error:', error.message);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  });

  // Remote file operations
  ipcMain.handle('sftp-delete', async (event, { connectionId, remotePath, isDirectory }) => {
    const sftp = sftpClients.get(connectionId);
    if (!sftp) throw new Error('No active SFTP connection.');
    try {
      if (isDirectory) {
        await sftp.rmdir(remotePath, true);
      } else {
        await sftp.delete(remotePath);
      }
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  });

  ipcMain.handle('sftp-rename', async (event, { connectionId, oldPath, newPath }) => {
    const sftp = sftpClients.get(connectionId);
    if (!sftp) throw new Error('No active SFTP connection.');
    try {
      await sftp.rename(oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  });

  ipcMain.handle('sftp-mkdir', async (event, { connectionId, remotePath }) => {
    const sftp = sftpClients.get(connectionId);
    if (!sftp) throw new Error('No active SFTP connection.');
    try {
      await sftp.mkdir(remotePath, true);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  });

  // Local file operations
  ipcMain.handle('local-delete', async (event, filePath: string) => {
    try {
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        await fsPromises.rm(filePath, { recursive: true });
      } else {
        await fsPromises.unlink(filePath);
      }
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  });

  ipcMain.handle('local-rename', async (event, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
    try {
      await fsPromises.rename(oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  });

  ipcMain.handle('local-mkdir', async (event, dirPath: string) => {
    try {
      await fsPromises.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error: any) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  });
}

/**
 * Close all SFTP connections (for cleanup)
 */
export async function closeAllSFTPConnections(): Promise<void> {
  for (const [connectionId, sftp] of sftpClients) {
    try {
      await sftp.end();
      log.info(`[SFTP] Closed connection ${connectionId}`);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  sftpClients.clear();
}
