import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import '@xterm/xterm/css/xterm.css';

interface TerminalEmulatorProps {
  connectionId: string;
  isVisible: boolean;
}

// Store terminal instances globally to persist across re-renders
const terminalInstances = new Map<string, {
  terminal: Terminal;
  fitAddon: FitAddon;
  serializeAddon: SerializeAddon;
  dataListener: () => void;
  onDataDisposable: { dispose: () => void };
}>();

// Export cleanup function
export const cleanupTerminal = (connectionId: string) => {
  const instance = terminalInstances.get(connectionId);
  if (instance) {
    instance.dataListener(); // Remove SSH data listener
    instance.onDataDisposable.dispose(); // Remove onData handler
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

const TerminalEmulator: React.FC<TerminalEmulatorProps> = ({ connectionId, isVisible }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let instance = terminalInstances.get(connectionId);

    if (!instance) {
      // Create terminal instance
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
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

      // Give terminal time to render before fitting
      setTimeout(() => {
        fitAddon.fit();
        // Force focus immediately after fit
        terminal.focus();
      }, 10);

      // Handle terminal input (user typing) - store disposable to prevent duplicates
      const onDataDisposable = terminal.onData((data) => {
        window.electron.sendSSHData(connectionId, data);
      });

      // Listen for data from SSH session - only ONE listener per terminal
      const dataListener = window.electron.onSSHData((data: { connectionId: string; data: string }) => {
        if (data.connectionId === connectionId) {
          terminal.write(data.data);
        }
      });

      // Initial resize notification
      window.electron.resizeSSHTerminal(connectionId, terminal.cols, terminal.rows);

      // Store instance with all cleanup functions
      instance = { terminal, fitAddon, serializeAddon, dataListener, onDataDisposable };
      terminalInstances.set(connectionId, instance);
    } else {
      // Reattach existing terminal to DOM if needed
      const element = terminalRef.current;
      if (element && instance && !element.contains(instance.terminal.element!)) {
        instance.terminal.open(element);
        const inst = instance; // Capture for closure
        setTimeout(() => {
          inst.fitAddon.fit();
          inst.terminal.focus();
        }, 10);
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
      // Use multiple attempts to ensure focus
      setTimeout(() => {
        instance.fitAddon.fit();
        instance.terminal.focus();
      }, 0);
      setTimeout(() => {
        instance.terminal.focus();
      }, 50);
      setTimeout(() => {
        instance.terminal.focus();
      }, 150);
    }

    // Cleanup on unmount (but keep terminal instance alive)
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [connectionId, isVisible]);

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
      }}
    />
  );
};

export default TerminalEmulator;
