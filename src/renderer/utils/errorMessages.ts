/**
 * Maps technical SSH/network error strings to user-friendly messages
 * with actionable guidance.
 */

interface ErrorMapping {
  /** User-friendly title */
  title: string;
  /** Actionable guidance */
  suggestion: string;
}

const ERROR_PATTERNS: [RegExp, ErrorMapping][] = [
  [/ECONNREFUSED/i, {
    title: 'Connection refused',
    suggestion: 'Check that the SSH service is running and the port is correct.',
  }],
  [/ECONNRESET/i, {
    title: 'Connection reset',
    suggestion: 'The remote host unexpectedly closed the connection. It may be overloaded or restarting.',
  }],
  [/ETIMEDOUT|ETIMEOUT|timed?\s*out/i, {
    title: 'Connection timed out',
    suggestion: 'The host did not respond in time. Check the IP address and ensure it is reachable.',
  }],
  [/ENOTFOUND|ENOENT|getaddrinfo/i, {
    title: 'Host not found',
    suggestion: 'The hostname could not be resolved. Check the address for typos.',
  }],
  [/ENETUNREACH/i, {
    title: 'Network unreachable',
    suggestion: 'No route to the host. Check your network connection and VPN status.',
  }],
  [/EHOSTUNREACH/i, {
    title: 'Host unreachable',
    suggestion: 'The host is not reachable from your network. Verify the address and firewall rules.',
  }],
  [/authentication\s*fail|auth.*fail|All configured authentication methods failed/i, {
    title: 'Authentication failed',
    suggestion: 'The username or password is incorrect. Check your credentials and try again.',
  }],
  [/handshake.*fail|key exchange|kex/i, {
    title: 'SSH handshake failed',
    suggestion: 'Could not negotiate encryption with the server. The SSH server may use an unsupported algorithm.',
  }],
  [/EACCES|permission denied/i, {
    title: 'Permission denied',
    suggestion: 'The server rejected access. Verify your username has SSH login permissions.',
  }],
  [/EADDRINUSE/i, {
    title: 'Port already in use',
    suggestion: 'The local port for forwarding is already in use. Choose a different port.',
  }],
  [/Connection timeout/i, {
    title: 'Connection timed out',
    suggestion: 'The server did not respond within 30 seconds. Check connectivity and try again.',
  }],
  [/Auto-reconnect failed/i, {
    title: 'Reconnection failed',
    suggestion: 'All automatic reconnection attempts have been exhausted. Try connecting manually.',
  }],
  [/ECONNABORTED/i, {
    title: 'Connection aborted',
    suggestion: 'The connection was terminated mid-setup. The server may have dropped the connection.',
  }],
  [/socket.*hang.*up|socket.*close/i, {
    title: 'Connection lost',
    suggestion: 'The connection was unexpectedly dropped. Check network stability.',
  }],
  [/Failed to create terminal/i, {
    title: 'Terminal creation failed',
    suggestion: 'Could not start a local terminal process. Check that your shell is configured correctly.',
  }],
];

/**
 * Maps a raw error string to a user-friendly message.
 * Returns the original error if no pattern matches.
 */
export function mapErrorMessage(rawError: string): { title: string; suggestion: string } {
  for (const [pattern, mapping] of ERROR_PATTERNS) {
    if (pattern.test(rawError)) {
      return mapping;
    }
  }

  return {
    title: rawError.length > 80 ? rawError.slice(0, 77) + '...' : rawError,
    suggestion: 'If this persists, check the server logs or try reconnecting.',
  };
}
