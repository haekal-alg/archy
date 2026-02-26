import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';


interface TerminalEmulatorProps {
  connectionId: string;
  isVisible: boolean;
  zoom?: number;
  isActive?: boolean;
}

// Store terminal instances globally to persist across re-renders
const terminalInstances = new Map<string, {
  terminal: Terminal;
  fitAddon: FitAddon;
  serializeAddon: SerializeAddon;
  webglAddon?: WebglAddon;
  dataListener: () => void;
  onDataDisposable: { dispose: () => void };
  pasteHandler?: (e: Event) => void;
  keydownHandler?: (e: KeyboardEvent) => void;
}>();

// === PERFORMANCE FIX: Bounded chunk-based buffer for terminal data ===
// Prevents unbounded memory growth when data arrives faster than rendering

// Buffer configuration constants
const MAX_PENDING_CHUNKS = 100;      // Maximum queued data chunks before dropping
const MAX_CHUNK_SIZE = 16384;        // 16KB per chunk max (split larger chunks)
const WRITE_BATCH_SIZE = 8192;       // 8KB per write to terminal (prevents blocking)
const MAX_TOTAL_BUFFER_SIZE = 1048576; // 1MB total buffer limit

// Buffer state for each connection
interface PendingDataState {
  chunks: string[];
  totalSize: number;
  writeScheduled: boolean;
  droppedBytes: number;
  lastDropWarning: number;
}

const pendingDataStates = new Map<string, PendingDataState>();

// Get or create buffer state for a connection
function getBufferState(connectionId: string): PendingDataState {
  let state = pendingDataStates.get(connectionId);
  if (!state) {
    state = {
      chunks: [],
      totalSize: 0,
      writeScheduled: false,
      droppedBytes: 0,
      lastDropWarning: 0,
    };
    pendingDataStates.set(connectionId, state);
  }
  return state;
}

// Clean up buffer state for a connection
function cleanupBufferState(connectionId: string): void {
  pendingDataStates.delete(connectionId);
}

// Enqueue data chunk with size enforcement
function enqueueChunk(state: PendingDataState, chunk: string): void {
  // Split large chunks to maintain granular control
  if (chunk.length > MAX_CHUNK_SIZE) {
    for (let i = 0; i < chunk.length; i += MAX_CHUNK_SIZE) {
      const subChunk = chunk.slice(i, i + MAX_CHUNK_SIZE);
      state.chunks.push(subChunk);
      state.totalSize += subChunk.length;
    }
  } else {
    state.chunks.push(chunk);
    state.totalSize += chunk.length;
  }

  // Enforce maximum chunks limit - drop oldest
  while (state.chunks.length > MAX_PENDING_CHUNKS) {
    const dropped = state.chunks.shift()!;
    state.totalSize -= dropped.length;
    state.droppedBytes += dropped.length;
  }

  // Enforce maximum total buffer size - drop oldest
  while (state.totalSize > MAX_TOTAL_BUFFER_SIZE && state.chunks.length > 0) {
    const dropped = state.chunks.shift()!;
    state.totalSize -= dropped.length;
    state.droppedBytes += dropped.length;
  }

  // Log warning about dropped data (throttled to once per second)
  const now = Date.now();
  if (state.droppedBytes > 0 && now - state.lastDropWarning > 1000) {
    console.warn(`[TerminalEmulator] Buffer overflow: dropped ${state.droppedBytes} bytes to maintain responsiveness`);
    state.lastDropWarning = now;
    // Reset counter after warning
    state.droppedBytes = 0;
  }
}

// Schedule batched write to terminal
function scheduleTerminalWrite(connectionId: string, state: PendingDataState): void {
  if (state.writeScheduled || state.chunks.length === 0) return;

  state.writeScheduled = true;
  requestAnimationFrame(() => {
    const instance = terminalInstances.get(connectionId);
    if (!instance || state.chunks.length === 0) {
      state.writeScheduled = false;
      return;
    }

    // Collect up to WRITE_BATCH_SIZE bytes for this frame
    let writeData = '';
    let bytesToWrite = 0;

    while (state.chunks.length > 0 && bytesToWrite < WRITE_BATCH_SIZE) {
      const chunk = state.chunks[0];
      if (bytesToWrite + chunk.length <= WRITE_BATCH_SIZE) {
        // Take entire chunk
        writeData += state.chunks.shift()!;
        bytesToWrite += chunk.length;
      } else {
        // Partial chunk - take what we can fit
        const remaining = WRITE_BATCH_SIZE - bytesToWrite;
        writeData += chunk.slice(0, remaining);
        state.chunks[0] = chunk.slice(remaining);
        bytesToWrite = WRITE_BATCH_SIZE;
        break;
      }
    }

    state.totalSize -= bytesToWrite;

    // Write batch to terminal
    if (writeData) {
      instance.terminal.write(writeData);
      // Signal consumption for flow control
      if (window.electron.sshDataConsumed) {
        window.electron.sshDataConsumed(connectionId, bytesToWrite);
      }
    }

    state.writeScheduled = false;

    // Schedule next batch if more data pending
    if (state.chunks.length > 0) {
      scheduleTerminalWrite(connectionId, state);
    }
  });
}


// Export cleanup function
export const cleanupTerminal = (connectionId: string) => {
  const instance = terminalInstances.get(connectionId);
  if (instance) {
    instance.dataListener(); // Remove SSH data listener
    instance.onDataDisposable.dispose(); // Remove onData handler
    // Remove paste event listener (must match the addEventListener flags)
    if (instance.pasteHandler && instance.terminal.element) {
      instance.terminal.element.removeEventListener('paste', instance.pasteHandler, true);
    }
    // Remove keydown event listener
    if (instance.keydownHandler && instance.terminal.element) {
      instance.terminal.element.removeEventListener('keydown', instance.keydownHandler, true);
    }
    // Dispose WebGL addon if active
    if (instance.webglAddon) {
      instance.webglAddon.dispose();
    }
    instance.terminal.dispose();
    terminalInstances.delete(connectionId);
  }
  // Clean up buffer state
  cleanupBufferState(connectionId);
};

// Export function to get serialized terminal content (useful for debugging or future features)
export const getTerminalContent = (connectionId: string): string | null => {
  const instance = terminalInstances.get(connectionId);
  if (instance && instance.serializeAddon) {
    return instance.serializeAddon.serialize();
  }
  return null;
};

const TerminalEmulator: React.FC<TerminalEmulatorProps> = ({ connectionId, isVisible, zoom = 1.0, isActive = false }) => {
  const terminalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!terminalRef.current) return;

    let instance = terminalInstances.get(connectionId);

    if (!instance) {
      // Create terminal instance with performance optimizations
      const terminal = new Terminal({
        cursorBlink: false, // Disable cursor blink for better performance
        fontSize: Math.round(14 * zoom),
        fontFamily: 'Consolas, "Courier New", monospace',

        // Performance optimizations
        scrollback: 10000, // Limit scrollback to prevent memory issues
        fastScrollModifier: 'shift', // Enable fast scrolling with Shift key
        fastScrollSensitivity: 5, // Scroll 5 lines per wheel tick when fast scrolling
        // Note: Canvas renderer is now default in xterm.js 5.x, no need to specify

        theme: {
          background: '#000000',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selectionBackground: 'rgba(255, 255, 255, 0.3)',
          selectionForeground: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        allowProposedApi: true,
      });

      // Create and load addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const serializeAddon = new SerializeAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(serializeAddon);

      // Open terminal in DOM
      terminal.open(terminalRef.current);

      // Load WebGL renderer for GPU-accelerated rendering (up to 900% faster than canvas)
      let webglAddon: WebglAddon | undefined;
      try {
        webglAddon = new WebglAddon();
        // Handle WebGL context loss gracefully
        webglAddon.onContextLoss(() => {
          console.warn('[TerminalEmulator] WebGL context lost, falling back to canvas renderer');
          webglAddon?.dispose();
        });
        terminal.loadAddon(webglAddon);
        console.log('[TerminalEmulator] WebGL renderer loaded successfully');
      } catch (e) {
        console.warn('[TerminalEmulator] WebGL not supported, using canvas renderer:', e);
        webglAddon = undefined;
      }

      // Prevent browser's default paste event to avoid double-paste
      // Use capture phase and stopImmediatePropagation to intercept BEFORE xterm's listener
      const pasteHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Critical: prevents other listeners from firing
      };

      // Also block Ctrl+V/Cmd+V keydown events at DOM level to be extra sure
      const keydownHandler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      const terminalElement = terminal.element;
      if (terminalElement) {
        // Use capture phase (true) to intercept before xterm's listener
        terminalElement.addEventListener('paste', pasteHandler, true);
        terminalElement.addEventListener('keydown', keydownHandler, true);
      }

      // Handle keyboard events for clipboard operations
      terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
        // Ctrl+C or Cmd+C for copy
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
          const selection = terminal.getSelection();
          if (selection) {
            event.preventDefault();
            event.stopPropagation();
            window.electron.clipboard.writeText(selection);
            return false;
          }
        }

        // Ctrl+V or Cmd+V for paste
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
          event.preventDefault();
          event.stopPropagation();
          window.electron.clipboard.readText().then((text: string) => {
            if (text) {
              // Send to server - let server echo it back
              window.electron.sendSSHData(connectionId, text);
            }
          });
          return false;
        }

        return true;
      });

      // Give terminal time to render before fitting (use requestAnimationFrame for better performance)
      requestAnimationFrame(() => {
        fitAddon.fit();
        terminal.focus();
      });

      // Handle terminal input (user typing) - store disposable to prevent duplicates
      const onDataDisposable = terminal.onData((data) => {
        // Send all user input directly to server - let server handle echo
        window.electron.sendSSHData(connectionId, data);
      });

      // Listen for data from SSH session - only ONE listener per terminal
      // Uses bounded chunk-based buffer to prevent memory exhaustion
      const bufferState = getBufferState(connectionId);

      const dataListener = window.electron.onSSHData((data: { connectionId: string; data: string }) => {
        // Enqueue data chunk (with overflow protection)
        enqueueChunk(bufferState, data.data);
        // Schedule batched write to terminal
        scheduleTerminalWrite(connectionId, bufferState);
      }, connectionId);

      // Initial resize notification
      window.electron.resizeSSHTerminal(connectionId, terminal.cols, terminal.rows);

      // Store instance with all cleanup functions
      instance = {
        terminal,
        fitAddon,
        serializeAddon,
        webglAddon,
        dataListener,
        onDataDisposable,
        pasteHandler,
        keydownHandler,
      };
      terminalInstances.set(connectionId, instance);
    } else {
      // Reattach existing terminal to DOM if needed
      const element = terminalRef.current;
      if (element && instance && !element.contains(instance.terminal.element!)) {
        instance.terminal.open(element);
        const inst = instance; // Capture for closure
        requestAnimationFrame(() => {
          inst.fitAddon.fit();
          inst.terminal.focus();
        });
      }
    }

    // Handle window resize with debouncing (prevents 50-100 calls/sec during window drag)
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        if (instance && isVisible) {
          instance.fitAddon.fit();
          window.electron.resizeSSHTerminal(connectionId, instance.terminal.cols, instance.terminal.rows);
        }
      }, 100); // Wait 100ms after resize stops
    };

    window.addEventListener('resize', handleResize);

    // Fit terminal when it becomes visible
    if (isVisible && instance) {
      // Single focus attempt using requestAnimationFrame for optimal timing
      requestAnimationFrame(() => {
        instance.fitAddon.fit();
        instance.terminal.focus();
      });
    }

    // Cleanup on unmount (but keep terminal instance alive)
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [connectionId, isVisible, zoom]);

  // Handle zoom changes
  useEffect(() => {
    const instance = terminalInstances.get(connectionId);
    if (instance && zoom) {
      const newFontSize = Math.round(14 * zoom);
      instance.terminal.options.fontSize = newFontSize;

      // We need to wait a brief moment for the DOM to update with the new font size
      // before fitting, otherwise the calculations might be off
      setTimeout(() => {
        instance.fitAddon.fit();
        // CRITICAL: Notify the backend PTY of the new size so text reflows correctly
        window.electron.resizeSSHTerminal(connectionId, instance.terminal.cols, instance.terminal.rows);
      }, 10);
    }
  }, [connectionId, zoom]);

  return (
    <div
      ref={terminalRef}
      onClick={() => {
        // Ensure terminal gets focus when clicked
        const instance = terminalInstances.get(connectionId);
        if (instance) {
          instance.terminal.focus();
        }
      }}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'text',
        border: isActive ? '2px solid rgba(59, 142, 234, 0.5)' : '2px solid transparent',
        borderRadius: '4px',
        transition: 'border-color 0.2s ease',
        boxShadow: isActive ? '0 0 12px rgba(59, 142, 234, 0.3)' : 'none',
      }}
    />
  );
};

export default TerminalEmulator;
