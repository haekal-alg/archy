/**
 * Output-based CWD tracking for local terminal sessions
 *
 * Scans PTY output for shell prompt patterns to detect the real working
 * directory, regardless of how the user navigated there (tab completion,
 * arrow-key history, pasted commands, pushd/popd, etc.).
 *
 * Primary strategy: parse prompt lines from terminal output
 * Secondary (Linux/macOS): on-demand OS query via /proc or lsof
 * Tertiary: input-based parsing in shell-utils.ts (kept as fallback)
 */

import * as fs from 'fs';
import { execFile } from 'child_process';

// ─── Per-session state ───────────────────────────────────────────────

interface TrackerState {
  pid: number;
  shellType: 'cmd' | 'bash' | 'zsh' | 'powershell' | 'other';
  lastCwd: string;
  lineBuffer: string;
}

const MAX_LINE_BUFFER = 2048;

const trackers = new Map<string, TrackerState>();

// ─── ANSI stripping ─────────────────────────────────────────────────

/** Remove ANSI escape sequences so prompt regex works on clean text. */
function stripAnsi(str: string): string {
  // Covers CSI sequences, OSC sequences, and single-char escapes
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b(?:\[[0-9;?]*[A-Za-z]|\][^\x07]*(?:\x07|\x1b\\)|[()#][0-9A-Za-z]|.)/g, '');
}

// ─── Prompt regexes ─────────────────────────────────────────────────

// cmd.exe prompt:  C:\Users\foo>
// Matches a drive-letter absolute path followed by ">"
const CMD_PROMPT_RE = /^([A-Za-z]:\\[^>\r\n]*?)>\s*$/m;

// bash / zsh prompt: common formats like "user@host:~/dir$" or "~/dir $"
const BASH_PROMPT_RE = /(?:^|\s)(\/[^\$#>\r\n]*?|~[^\$#>\r\n]*?)\s*[\$#]\s*$/m;

// PowerShell prompt: PS C:\Users\foo>
const PS_PROMPT_RE = /^PS\s+([A-Za-z]:\\[^>\r\n]*?)>\s*$/m;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Initialize CWD tracking for a new terminal session.
 */
export function initCwdTracker(
  connectionId: string,
  pid: number,
  shellType: 'cmd' | 'bash' | 'zsh' | 'powershell' | 'other',
  initialCwd: string,
): void {
  trackers.set(connectionId, {
    pid,
    shellType,
    lastCwd: initialCwd,
    lineBuffer: '',
  });
}

/**
 * Feed raw PTY output data into the tracker.
 * Returns the newly-detected CWD if one was found, otherwise null.
 */
export function feedOutput(connectionId: string, data: string): string | null {
  const state = trackers.get(connectionId);
  if (!state) return null;

  const clean = stripAnsi(data);

  // Accumulate into line buffer, cap size to prevent unbounded growth
  state.lineBuffer += clean;
  if (state.lineBuffer.length > MAX_LINE_BUFFER) {
    state.lineBuffer = state.lineBuffer.slice(-MAX_LINE_BUFFER);
  }

  // Try to extract CWD from complete lines
  let detected: string | null = null;

  // Split on newlines/carriage-returns to get individual lines
  const lines = state.lineBuffer.split(/[\r\n]+/);

  // Keep only the last (possibly incomplete) line in the buffer
  state.lineBuffer = lines[lines.length - 1] || '';

  // Check each complete line for a prompt pattern
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const candidate = matchPrompt(line, state.shellType);
    if (candidate && isValidDirectory(candidate)) {
      detected = candidate;
      state.lastCwd = candidate;
    }
  }

  // Also check the current (last) line — prompts often appear without
  // a trailing newline, and the next data chunk starts with user input.
  const tailCandidate = matchPrompt(state.lineBuffer, state.shellType);
  if (tailCandidate && isValidDirectory(tailCandidate)) {
    detected = tailCandidate;
    state.lastCwd = tailCandidate;
  }

  return detected;
}

/**
 * Get the last CWD detected from output scanning (synchronous).
 */
export function getTrackedCwd(connectionId: string): string | null {
  return trackers.get(connectionId)?.lastCwd ?? null;
}

/**
 * On-demand OS-level CWD query (async).
 * - Linux: readlink /proc/<pid>/cwd
 * - macOS: lsof -p <pid> -Fn (parse cwd field)
 * - Windows: returns prompt-detected value (no reliable OS-level query)
 */
export async function queryOsCwd(connectionId: string): Promise<string | null> {
  const state = trackers.get(connectionId);
  if (!state) return null;

  if (process.platform === 'linux') {
    try {
      const target = fs.readlinkSync(`/proc/${state.pid}/cwd`);
      if (isValidDirectory(target)) {
        state.lastCwd = target;
        return target;
      }
    } catch {
      // PID may have exited or /proc unavailable
    }
  }

  if (process.platform === 'darwin') {
    try {
      const cwd = await lsofCwd(state.pid);
      if (cwd && isValidDirectory(cwd)) {
        state.lastCwd = cwd;
        return cwd;
      }
    } catch {
      // lsof may fail
    }
  }

  // Windows or fallback: return prompt-detected CWD
  return state.lastCwd;
}

/**
 * Clean up tracker state for a closed session.
 */
export function cleanupCwdTracker(connectionId: string): void {
  trackers.delete(connectionId);
}

// ─── Helpers ────────────────────────────────────────────────────────

function matchPrompt(line: string, shellType: string): string | null {
  if (shellType === 'cmd') {
    const m = CMD_PROMPT_RE.exec(line);
    return m ? m[1] : null;
  }
  if (shellType === 'powershell') {
    const m = PS_PROMPT_RE.exec(line);
    return m ? m[1] : null;
  }
  if (shellType === 'bash' || shellType === 'zsh') {
    const m = BASH_PROMPT_RE.exec(line);
    if (!m) return null;
    // Expand ~ to home directory
    let p = m[1];
    if (p.startsWith('~')) {
      const home = process.env.HOME || process.env.USERPROFILE || '';
      p = home + p.slice(1);
    }
    return p;
  }
  // 'other' — try all patterns
  for (const re of [CMD_PROMPT_RE, PS_PROMPT_RE, BASH_PROMPT_RE]) {
    const m = re.exec(line);
    if (m) return m[1];
  }
  return null;
}

function isValidDirectory(candidate: string): boolean {
  try {
    return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function lsofCwd(pid: number): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('lsof', ['-p', String(pid), '-Fn'], { timeout: 3000 }, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      // lsof -Fn output contains lines like "fcwd" followed by "n/path"
      const lines = stdout.split('\n');
      let foundCwd = false;
      for (const l of lines) {
        if (l === 'fcwd') {
          foundCwd = true;
          continue;
        }
        if (foundCwd && l.startsWith('n')) {
          resolve(l.slice(1));
          return;
        }
      }
      resolve(null);
    });
  });
}
