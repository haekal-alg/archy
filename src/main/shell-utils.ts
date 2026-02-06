/**
 * Shell utilities for local terminal management
 * Handles directory navigation, environment variables, and command parsing
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Get the user's home directory
 */
export const getHomeDirectory = (): string =>
  process.env.HOME || process.env.USERPROFILE || process.cwd();

/**
 * Strip surrounding quotes from a string value
 */
export const stripQuotes = (value: string): string => {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
};

/**
 * Expand environment variables in a string
 * Supports Windows %VAR% and Unix $VAR or ${VAR} syntax
 */
export const expandEnvVariables = (value: string): string => {
  if (process.platform === 'win32') {
    return value.replace(/%([^%]+)%/g, (match, name) => {
      const key = String(name || '').trim();
      return process.env[key] ?? match;
    });
  }

  return value.replace(/\$(\w+)|\$\{([^}]+)\}/g, (match, name, braceName) => {
    const key = String(name || braceName || '').trim();
    return process.env[key] ?? match;
  });
};

/**
 * Resolve a local working directory path
 * Handles ~, environment variables, and relative paths
 */
export const resolveLocalCwd = (baseCwd: string, target: string | undefined | null): string | null => {
  const trimmed = (target || '').trim();
  if (!trimmed) {
    if (process.platform === 'win32') {
      return baseCwd;
    }
    return getHomeDirectory();
  }

  let nextPath = expandEnvVariables(trimmed);
  if (nextPath.startsWith('~')) {
    const homeDir = getHomeDirectory();
    nextPath = path.join(homeDir, nextPath.slice(1));
  }

  if (process.platform === 'win32' && /^[a-zA-Z]:$/.test(nextPath)) {
    nextPath = `${nextPath}\\`;
  }

  const candidate = path.isAbsolute(nextPath) ? nextPath : path.resolve(baseCwd, nextPath);

  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  } catch (error) {
    return null;
  }

  return null;
};

/**
 * Result of updating the input buffer
 */
export interface InputBufferResult {
  buffer: string;
  commands: string[];
}

/**
 * Update input buffer with new data and extract completed commands
 * Handles backspace, control characters, and newlines
 */
export const updateInputBuffer = (buffer: string, data: string): InputBufferResult => {
  let nextBuffer = buffer;
  const commands: string[] = [];

  for (const char of data) {
    if (char === '\r' || char === '\n') {
      if (nextBuffer.trim()) {
        commands.push(nextBuffer);
      }
      nextBuffer = '';
      continue;
    }
    if (char === '\b' || char === '\x7f') {
      nextBuffer = nextBuffer.slice(0, -1);
      continue;
    }
    if (char.charCodeAt(0) < 32) {
      continue;
    }
    nextBuffer += char;
  }

  return { buffer: nextBuffer, commands };
};

/**
 * Result of parsing a cd/pushd/popd command
 */
export interface CwdCommandResult {
  action: 'cd' | 'pushd' | 'popd';
  target?: string;
}

/**
 * Parse a command line for cd/pushd/popd commands
 * Returns null if the command is not a directory change command
 */
export const parseCwdCommand = (line: string): CwdCommandResult | null => {
  const [firstSegment] = line.split(/&&|&|;/);
  const command = (firstSegment || '').trim();
  if (!command) {
    return null;
  }

  // Windows drive letter (e.g., "D:")
  if (/^[a-zA-Z]:$/.test(command)) {
    return { action: 'cd', target: `${command}\\` };
  }

  // pushd command
  const pushdMatch = command.match(/^pushd(?:\s+(.*))?$/i);
  if (pushdMatch) {
    const target = stripQuotes((pushdMatch[1] || '').trim());
    return target ? { action: 'pushd', target } : null;
  }

  // popd command
  if (/^popd$/i.test(command)) {
    return { action: 'popd' };
  }

  // cd.. or chdir..
  if (/^cd\.\.$/i.test(command) || /^chdir\.\.$/i.test(command)) {
    return { action: 'cd', target: '..' };
  }

  // cd. or chdir.
  if (/^cd\.$/i.test(command) || /^chdir\.$/i.test(command)) {
    return { action: 'cd', target: '.' };
  }

  // cd/ or cd\ (root)
  if (/^cd[\\/]+$/i.test(command) || /^chdir[\\/]+$/i.test(command)) {
    return { action: 'cd', target: command.slice(2).trim() };
  }

  // cd/path or cd\path (direct path without space)
  const directPathMatch = command.match(/^(cd|chdir)([\\/].+)$/i);
  if (directPathMatch) {
    return { action: 'cd', target: stripQuotes(directPathMatch[2].trim()) };
  }

  // Standard cd or chdir command with optional /d flag
  const cdMatch = command.match(/^(cd|chdir)(?:\s+\/d)?(?:\s+(.*))?$/i);
  if (!cdMatch) {
    return null;
  }

  const rawTarget = stripQuotes((cdMatch[2] || '').trim());
  if (!rawTarget) {
    return { action: 'cd', target: '' };
  }

  return { action: 'cd', target: rawTarget };
};
