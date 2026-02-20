/**
 * Data buffering manager for terminal performance optimization
 * Handles batching of terminal output to reduce IPC overhead
 */

import { BrowserWindow } from 'electron';

// Buffer configuration - optimized for 60fps rendering and low latency
export const BUFFER_TIME_MS = 4; // Minimum latency mode (trade-off: higher CPU during throughput)
export const BUFFER_SIZE_BYTES = 8192; // 8KB max buffer before force flush
export const MIN_FLUSH_INTERVAL_MS = 8; // Minimum time between flushes

// Flow control configuration - prevents renderer from being overwhelmed
export const MAX_QUEUED_BYTES = 65536; // 64KB max queue before pausing stream
export const RESUME_THRESHOLD_BYTES = 32768; // 32KB resume threshold (50%)

/**
 * State for a single connection's data buffer
 */
export interface BufferState {
  buffer: Buffer[];
  totalSize: number;
  timer: NodeJS.Timeout | null;
  lastFlush: number;
}

/**
 * Session interface for flow control tracking
 */
export interface FlowControlSession {
  queuedBytes: number;
  isPaused: boolean;
}

// Store buffers for all connections
const dataBuffers = new Map<string, BufferState>();

// Reference to main window for IPC
let mainWindowRef: BrowserWindow | null = null;

// Callbacks for getting session references (avoids circular dependencies)
let getSSHSessionCallback: ((connectionId: string) => FlowControlSession | undefined) | null = null;
let getLocalSessionCallback: ((connectionId: string) => FlowControlSession | undefined) | null = null;

/**
 * Initialize the buffer manager with required references
 */
export function initBufferManager(
  mainWindow: BrowserWindow | null,
  getSSHSession?: (connectionId: string) => FlowControlSession | undefined,
  getLocalSession?: (connectionId: string) => FlowControlSession | undefined
): void {
  mainWindowRef = mainWindow;
  if (getSSHSession) getSSHSessionCallback = getSSHSession;
  if (getLocalSession) getLocalSessionCallback = getLocalSession;
}

/**
 * Update the main window reference (e.g., after window recreation)
 */
export function setMainWindow(mainWindow: BrowserWindow | null): void {
  mainWindowRef = mainWindow;
}

/**
 * Get the current main window reference
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindowRef;
}

/**
 * Flush buffered data for a connection
 */
export function flushBuffer(connectionId: string): void {
  const bufferState = dataBuffers.get(connectionId);
  if (!bufferState || bufferState.buffer.length === 0) return;

  // Clear timer reference first to prevent double-flush
  if (bufferState.timer) {
    bufferState.timer = null;
  }

  // Concatenate all buffered chunks into single buffer
  const combinedBuffer = Buffer.concat(bufferState.buffer);
  const dataStr = combinedBuffer.toString('utf-8');
  const bytesSent = combinedBuffer.length;

  // Reset buffer state BEFORE sending to prevent race conditions
  bufferState.buffer = [];
  bufferState.totalSize = 0;
  bufferState.lastFlush = Date.now();

  // Send single IPC message with batched data on per-connection channel
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send(`ssh-data-${connectionId}`, {
      connectionId,
      data: dataStr,
    });
  }

  // Track queued bytes for flow control
  if (getSSHSessionCallback) {
    const session = getSSHSessionCallback(connectionId);
    if (session) {
      session.queuedBytes += bytesSent;

      // Log warning if queue exceeds threshold
      if (session.queuedBytes >= MAX_QUEUED_BYTES && !session.isPaused) {
        session.isPaused = true;
        console.warn(`[${connectionId}] Queue exceeded threshold: ${session.queuedBytes} bytes (note: node-pty doesn't support backpressure)`);
      }
    }
  }

  // Also track for local sessions
  if (getLocalSessionCallback) {
    const localSession = getLocalSessionCallback(connectionId);
    if (localSession) {
      localSession.queuedBytes += bytesSent;

      if (localSession.queuedBytes >= MAX_QUEUED_BYTES && !localSession.isPaused) {
        localSession.isPaused = true;
        console.warn(`[${connectionId}] Local queue exceeded threshold: ${localSession.queuedBytes} bytes`);
      }
    }
  }
}

/**
 * Add data to a connection's buffer and schedule flush
 */
export function bufferData(connectionId: string, data: string | Buffer): void {
  let bufferState = dataBuffers.get(connectionId);

  if (!bufferState) {
    bufferState = { buffer: [], totalSize: 0, timer: null, lastFlush: Date.now() };
    dataBuffers.set(connectionId, bufferState);
  }

  const bufferChunk = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  bufferState.buffer.push(bufferChunk);
  bufferState.totalSize += bufferChunk.length;

  // Force flush if buffer is too large
  if (bufferState.totalSize >= BUFFER_SIZE_BYTES) {
    if (bufferState.timer) {
      clearTimeout(bufferState.timer);
    }
    flushBuffer(connectionId);
    return;
  }

  // Schedule flush if not already scheduled
  if (!bufferState.timer) {
    const timeSinceLastFlush = Date.now() - bufferState.lastFlush;
    const delay = Math.max(0, MIN_FLUSH_INTERVAL_MS - timeSinceLastFlush);

    bufferState.timer = setTimeout(() => {
      flushBuffer(connectionId);
    }, Math.max(delay, BUFFER_TIME_MS));
  }
}

/**
 * Get the buffer state for a connection
 */
export function getBufferState(connectionId: string): BufferState | undefined {
  return dataBuffers.get(connectionId);
}

/**
 * Clean up buffer state for a connection
 */
export function cleanupBuffer(connectionId: string): void {
  const bufferState = dataBuffers.get(connectionId);
  if (bufferState) {
    if (bufferState.timer) {
      clearTimeout(bufferState.timer);
    }
    flushBuffer(connectionId); // Flush any remaining data
    dataBuffers.delete(connectionId);
  }
}

/**
 * Check if a connection has buffered data
 */
export function hasBufferedData(connectionId: string): boolean {
  const bufferState = dataBuffers.get(connectionId);
  return bufferState ? bufferState.buffer.length > 0 : false;
}
