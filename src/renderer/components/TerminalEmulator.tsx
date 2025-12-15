import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import '@xterm/xterm/css/xterm.css';
import { useToast } from '../hooks/useToast';

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
  dataListener: () => void;
  onDataDisposable: { dispose: () => void };
  pasteHandler?: (e: Event) => void;
  keydownHandler?: (e: KeyboardEvent) => void;
}>();

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
    instance.terminal.dispose();
    terminalInstances.delete(connectionId);
  }
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
  const { showToast, ToastContainer } = useToast();

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
            showToast('Copied to clipboard');
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
              showToast('Pasted from clipboard');
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
      const dataListener = window.electron.onSSHData((data: { connectionId: string; data: string }) => {
        if (data.connectionId === connectionId) {
          // Write data directly to terminal - xterm.js handles buffering and rendering efficiently
          instance!.terminal.write(data.data);
        }
      });

      // Initial resize notification
      window.electron.resizeSSHTerminal(connectionId, terminal.cols, terminal.rows);

      // Store instance with all cleanup functions
      instance = {
        terminal,
        fitAddon,
        serializeAddon,
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

    // Handle window resize
    const handleResize = () => {
      if (instance && isVisible) {
        instance.fitAddon.fit();
        window.electron.resizeSSHTerminal(connectionId, instance.terminal.cols, instance.terminal.rows);
      }
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      <ToastContainer />
    </div>
  );
};

export default TerminalEmulator;
