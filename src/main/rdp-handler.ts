/**
 * RDP connection handler
 * Manages Remote Desktop Protocol connections on Windows
 */

import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { exec } from 'child_process';
import { app } from 'electron';

const { writeFile } = fsPromises;

/**
 * RDP connection configuration
 */
export interface RDPConnectionConfig {
  host: string;
  username: string;
  password: string;
}

/**
 * Connect to a remote host via RDP
 * Uses Windows cmdkey for credential storage and mstsc for connection
 */
export async function connectRDP(config: RDPConnectionConfig): Promise<{ success: boolean }> {
  const { host, username, password } = config;

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

  // Write temp file asynchronously to avoid blocking main process
  await writeFile(tempPath, rdpContent, 'utf-8');

  // IMPORTANT: For RDP, cmdkey requires TERMSRV/ prefix
  const credentialTarget = `TERMSRV/${host}`;

  // First, delete any existing credentials for this host
  const deleteCmd = `cmdkey /delete:${credentialTarget}`;

  // Then add the new credentials and launch mstsc
  const addCmd = `cmdkey /generic:${credentialTarget} /user:${username} /pass:"${password}"`;
  const launchCmd = `mstsc "${tempPath}"`;

  const fullCommand = `${deleteCmd} 2>nul & ${addCmd} && ${launchCmd}`;

  return new Promise((resolve, reject) => {
    exec(fullCommand, (error) => {
      if (error) {
        console.error('RDP connection error:', error);
        reject(error);
      } else {
        resolve({ success: true });
      }
    });
  });
}
