/**
 * SFTP file transfer manager
 * Handles SFTP connections and file operations
 */

import { ipcMain } from 'electron';
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
    console.log(`[SFTP] Listing remote files for connection ${connectionId}, path: ${remotePath}`);

    const session = getSSHSession(connectionId);
    if (!session) {
      console.error('[SFTP] SSH session not found for connectionId:', connectionId);
      throw new Error('SSH session not found. Please connect first.');
    }

    console.log(`[SFTP] Found session - host: ${session.host}, port: ${session.port}, username: ${session.username}`);

    let sftp = sftpClients.get(connectionId);
    let needsNewConnection = !sftp;

    // Validate existing connection is still alive
    if (sftp) {
      try {
        await sftp.cwd();
        console.log('[SFTP] Reusing existing SFTP connection (validated)');
      } catch (validationError) {
        console.log('[SFTP] Existing connection is stale, creating new one');
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
      console.log('[SFTP] Creating new SFTP client');
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
        console.log(`[SFTP] Using private key authentication: ${session.privateKeyPath}`);
        try {
          const privateKey = await readFile(session.privateKeyPath, 'utf8');
          config.privateKey = privateKey;
          if (session.password) {
            config.passphrase = session.password;
          }
        } catch (error: any) {
          console.error('[SFTP] Failed to read private key:', error.message);
          throw new Error(`Failed to read private key file: ${error.message}`);
        }
      } else if (session.password) {
        console.log('[SFTP] Using password authentication');
        config.password = session.password;
      } else {
        console.error('[SFTP] No authentication method available');
        throw new Error('No authentication credentials found');
      }

      try {
        console.log('[SFTP] Connecting to SFTP server...');
        await sftp.connect(config);
        console.log('[SFTP] Connected successfully');
        sftpClients.set(connectionId, sftp);
        console.log('[SFTP] Connection stored for reuse');
      } catch (error: any) {
        console.error('[SFTP] Connection failed:', error.message);
        try {
          await sftp.end();
        } catch (e) {
          // Ignore cleanup errors
        }
        throw new Error(`Failed to connect to SFTP server: ${error.message}`);
      }
    }

    try {
      console.log(`[SFTP] Listing directory: ${remotePath}`);
      const fileList = await sftp.list(remotePath);
      console.log(`[SFTP] Number of items: ${fileList.length}`);

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

      console.log(`[SFTP] Returning ${files.length} files`);
      return files;
    } catch (error: any) {
      console.error('[SFTP] Error listing files:', error.message);
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
    console.log(`[SFTP] Closing connection for ${connectionId}`);

    const sftp = sftpClients.get(connectionId);
    if (sftp) {
      try {
        await sftp.end();
        sftpClients.delete(connectionId);
        console.log(`[SFTP] Connection closed and removed from cache`);
      } catch (error: any) {
        console.error('[SFTP] Error closing connection:', error.message);
        sftpClients.delete(connectionId);
      }
    } else {
      console.log(`[SFTP] No active connection found for ${connectionId}`);
    }
  });

  // Upload file from local to remote
  ipcMain.handle('upload-file', async (event, { connectionId, localPath, remotePath, fileName }) => {
    console.log(`[SFTP] Upload file request:`, { connectionId, localPath, remotePath, fileName });

    const sftp = sftpClients.get(connectionId);
    if (!sftp) {
      console.error('[SFTP] No active SFTP connection for upload');
      throw new Error('No active SFTP connection. Please ensure connection is established.');
    }

    try {
      const remoteFilePath = path.posix.join(remotePath, fileName);
      console.log(`[SFTP] Uploading from ${localPath} to ${remoteFilePath}`);

      await sftp.put(localPath, remoteFilePath);

      console.log(`[SFTP] Upload successful: ${fileName}`);
      return { success: true };
    } catch (error: any) {
      console.error('[SFTP] Upload error:', error.message);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  });

  // Download file from remote to local
  ipcMain.handle('download-file', async (event, { connectionId, remotePath, localPath, fileName }) => {
    console.log(`[SFTP] Download file request:`, { connectionId, remotePath, localPath, fileName });

    const sftp = sftpClients.get(connectionId);
    if (!sftp) {
      console.error('[SFTP] No active SFTP connection for download');
      throw new Error('No active SFTP connection. Please ensure connection is established.');
    }

    try {
      const localFilePath = path.join(localPath, fileName);
      console.log(`[SFTP] Downloading from ${remotePath} to ${localFilePath}`);

      await sftp.get(remotePath, localFilePath);

      console.log(`[SFTP] Download successful: ${fileName}`);
      return { success: true };
    } catch (error: any) {
      console.error('[SFTP] Download error:', error.message);
      throw new Error(`Failed to download file: ${error.message}`);
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
      console.log(`[SFTP] Closed connection ${connectionId}`);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  sftpClients.clear();
}
