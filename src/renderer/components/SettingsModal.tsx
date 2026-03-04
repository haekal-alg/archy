import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ShellType, TerminalSettings } from '../types/settings';

export type SettingsTab = 'terminal' | 'shortcuts';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

const SHELL_OPTIONS: { value: ShellType; label: string; description: string }[] = [
  { value: 'cmd', label: 'CMD', description: 'Windows Command Prompt' },
  { value: 'wsl', label: 'WSL', description: 'Windows Subsystem for Linux' },
  { value: 'powershell', label: 'PowerShell', description: 'Windows PowerShell' },
];

// --- Icons ---
const TerminalIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const KeyboardIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="6" y1="8" x2="6" y2="8" />
    <line x1="10" y1="8" x2="10" y2="8" />
    <line x1="14" y1="8" x2="14" y2="8" />
    <line x1="18" y1="8" x2="18" y2="8" />
    <line x1="6" y1="12" x2="6" y2="12" />
    <line x1="10" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="14" y2="12" />
    <line x1="18" y1="12" x2="18" y2="12" />
    <line x1="8" y1="16" x2="16" y2="16" />
  </svg>
);

// --- Tab definitions ---
const tabs: { id: SettingsTab; label: string; icon: React.FC<{ size?: number; color?: string }> }[] = [
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: KeyboardIcon },
];

// --- Shortcuts data ---
interface Shortcut {
  key: string;
  description: string;
  category: 'Navigation' | 'Editing' | 'Tools' | 'View';
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl/\u2318 + 1', description: 'Switch to Design tab', category: 'Navigation' },
  { key: 'Ctrl/\u2318 + 2', description: 'Switch to Connections tab', category: 'Navigation' },
  { key: 'Space + Drag', description: 'Pan canvas', category: 'Navigation' },
  { key: 'Mouse Wheel', description: 'Zoom in/out', category: 'Navigation' },
  { key: 'Middle Click + Drag', description: 'Pan canvas', category: 'Navigation' },
  { key: 'Ctrl/\u2318 + Z', description: 'Undo', category: 'Editing' },
  { key: 'Ctrl/\u2318 + Y', description: 'Redo', category: 'Editing' },
  { key: 'Ctrl/\u2318 + Shift + Z', description: 'Redo (alternative)', category: 'Editing' },
  { key: 'Delete', description: 'Delete selected', category: 'Editing' },
  { key: 'Ctrl + A', description: 'Select all', category: 'Editing' },
  { key: 'V', description: 'Selection tool', category: 'Tools' },
  { key: 'H', description: 'Hand tool', category: 'Tools' },
  { key: 'Esc', description: 'Deselect all', category: 'Tools' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'View' },
  { key: 'Esc', description: 'Close modal', category: 'View' },
];

const categoryOrder: Shortcut['category'][] = ['Navigation', 'Editing', 'Tools', 'View'];

// --- Scoped CSS to override global button:hover ---
const SCOPED_STYLES = `
.settings-modal:focus,
.settings-modal:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
.settings-modal button.sm-btn {
  opacity: 1 !important;
  transform: none !important;
  outline: none !important;
}
.settings-modal button.sm-btn:active {
  transform: scale(0.97) !important;
}
.settings-modal button.sm-btn:focus-visible {
  box-shadow: 0 0 0 2px #4d7cfe !important;
  outline: none;
}
.settings-modal button.sm-close:hover {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}
.settings-modal button.sm-sidebar {
  background: transparent !important;
  color: #8892a6 !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
.settings-modal button.sm-sidebar-active {
  background: #1e2a4a !important;
  color: #6b9aff !important;
  border-color: #4d7cfe55 !important;
}
.settings-modal button.sm-sidebar:hover {
  background: #1a2236 !important;
  color: #c9cdd5 !important;
}
.settings-modal button.sm-sidebar-active:hover {
  background: #1e2a4a !important;
  color: #6b9aff !important;
}
.settings-modal button.sm-shell {
  background: #1c2333 !important;
  color: #8892a6 !important;
  border-color: #2d3548 !important;
  box-shadow: none !important;
}
.settings-modal button.sm-shell-active {
  background: #4d7cfe20 !important;
  border-color: #4d7cfe !important;
  color: #4d7cfe !important;
}
.settings-modal button.sm-shell:hover {
  background: #242d40 !important;
  border-color: #3d4a60 !important;
}
.settings-modal button.sm-shell-active:hover {
  background: #4d7cfe20 !important;
  border-color: #4d7cfe !important;
  color: #4d7cfe !important;
}
.settings-modal button.sm-browse {
  background: #1c2333 !important;
  border-color: #2d3548 !important;
  box-shadow: none !important;
}
.settings-modal button.sm-browse:hover {
  background: #242d40 !important;
  border-color: #3d4a60 !important;
}
`;

// --- Main Component ---
const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, initialTab = 'terminal' }) => {
  const { settings, updateSettings } = useSettingsContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [localTerminal, setLocalTerminal] = useState<TerminalSettings>(settings.terminal);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync local state & tab when modal opens
  useEffect(() => {
    if (open) {
      setLocalTerminal(settings.terminal);
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Auto-focus modal on open
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  // Focus trap + Escape handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }

    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  if (!open) return null;

  const applyChange = (next: TerminalSettings) => {
    setLocalTerminal(next);
    updateSettings({ terminal: next });
  };

  const handleShellChange = (shell: ShellType) => {
    applyChange({ ...localTerminal, defaultShell: shell });
  };

  const handleCwdChange = (shell: ShellType, value: string) => {
    applyChange({
      ...localTerminal,
      shellCwd: { ...localTerminal.shellCwd, [shell]: value },
    });
  };

  const handleBrowse = async (shell: ShellType) => {
    try {
      const result = await window.electron.showOpenDialog({
        properties: ['openDirectory'],
        title: `Select default directory for ${shell.toUpperCase()}`,
      });
      if (!result.canceled && result.filePaths.length > 0) {
        handleCwdChange(shell, result.filePaths[0]);
      }
    } catch (err) {
      console.error('Failed to open directory picker:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick} onKeyDown={handleKeyDown} role="dialog" aria-modal="true">
      <style>{SCOPED_STYLES}</style>
      <div ref={dialogRef} className="settings-modal" style={styles.modal} tabIndex={-1}>
        {/* Close button */}
        <button className="sm-btn sm-close" style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <div style={styles.body}>
          {/* Left sidebar tabs */}
          <div style={styles.sidebar}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`sm-btn sm-sidebar${isActive ? ' sm-sidebar-active' : ''}`}
                  style={{
                    ...styles.sidebarBtn,
                    ...(isActive ? styles.sidebarBtnActive : {}),
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} color={isActive ? '#6b9aff' : '#8892a6'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right content area */}
          <div style={styles.content}>
            {activeTab === 'terminal' && (
              <div>
                <h3 style={styles.sectionTitle}>Terminal</h3>

                {/* Default Shell */}
                <label style={styles.label}>Default Shell</label>
                <div style={styles.shellSelector}>
                  {SHELL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`sm-btn sm-shell${localTerminal.defaultShell === opt.value ? ' sm-shell-active' : ''}`}
                      style={{
                        ...styles.shellBtn,
                        ...(localTerminal.defaultShell === opt.value ? styles.shellBtnActive : {}),
                      }}
                      onClick={() => handleShellChange(opt.value)}
                      title={opt.description}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Per-shell CWD */}
                <label style={{ ...styles.label, marginTop: 20 }}>Default Working Directory</label>
                <p style={styles.hint}>Set a startup directory for each shell type. Leave empty to use the system default.</p>

                {SHELL_OPTIONS.map(opt => (
                  <div key={opt.value} style={styles.cwdRow}>
                    <span style={styles.cwdLabel}>{opt.label}</span>
                    <div style={styles.cwdInputGroup}>
                      <input
                        type="text"
                        style={styles.cwdInput}
                        value={localTerminal.shellCwd[opt.value]}
                        onChange={e => handleCwdChange(opt.value, e.target.value)}
                        placeholder={opt.value === 'wsl' ? '/mnt/c/users/...' : 'C:\\Users\\...'}
                        spellCheck={false}
                      />
                      {opt.value !== 'wsl' && (
                        <button
                          className="sm-btn sm-browse"
                          style={styles.browseBtn}
                          onClick={() => handleBrowse(opt.value)}
                          title="Browse..."
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div>
                <h3 style={styles.sectionTitle}>Keyboard Shortcuts</h3>
                {categoryOrder.map(category => {
                  const items = groupedShortcuts[category];
                  if (!items) return null;
                  return (
                    <div key={category} style={{ marginBottom: 20 }}>
                      <h4 style={styles.categoryTitle}>{category}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map((shortcut, i) => (
                          <div key={i} style={styles.shortcutRow}>
                            <span style={styles.shortcutDesc}>{shortcut.description}</span>
                            <kbd style={styles.kbd}>{shortcut.key}</kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    position: 'relative',
    width: 780,
    minWidth: 780,
    maxWidth: 780,
    height: 620,
    maxHeight: '85vh',
    backgroundColor: '#151923',
    border: '1px solid #2d3548',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    zIndex: 1,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: 180,
    backgroundColor: '#111827',
    borderRight: '1px solid #2d3548',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flexShrink: 0,
  },
  sidebarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    background: 'none',
    border: '1px solid transparent',
    borderRadius: 6,
    color: '#8892a6',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    width: '100%',
  },
  sidebarBtnActive: {
    backgroundColor: '#1e2a4a',
    borderColor: '#4d7cfe55',
    color: '#6b9aff',
  },
  content: {
    flex: 1,
    padding: '24px 28px',
    overflowY: 'auto' as const,
  },
  sectionTitle: {
    color: '#8892a6',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 0,
    marginBottom: 14,
  },
  label: {
    display: 'block',
    color: '#c9cdd5',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
  },
  hint: {
    color: '#6b7280',
    fontSize: 12,
    margin: '0 0 12px 0',
  },
  shellSelector: {
    display: 'flex',
    gap: 8,
  },
  shellBtn: {
    flex: 1,
    padding: '8px 0',
    backgroundColor: '#1c2333',
    border: '1px solid #2d3548',
    borderRadius: 6,
    color: '#8892a6',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  shellBtnActive: {
    backgroundColor: '#4d7cfe20',
    borderColor: '#4d7cfe',
    color: '#4d7cfe',
  },
  cwdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cwdLabel: {
    color: '#8892a6',
    fontSize: 12,
    fontWeight: 500,
    width: 80,
    flexShrink: 0,
  },
  cwdInputGroup: {
    flex: 1,
    display: 'flex',
    gap: 6,
  },
  cwdInput: {
    flex: 1,
    padding: '6px 10px',
    backgroundColor: '#1c2333',
    border: '1px solid #2d3548',
    borderRadius: 4,
    color: '#e0e4ec',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none',
  },
  browseBtn: {
    padding: '4px 8px',
    backgroundColor: '#1c2333',
    border: '1px solid #2d3548',
    borderRadius: 4,
    color: '#8892a6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    color: '#4d7cfe',
    fontSize: 13,
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 8,
  },
  shortcutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
    backgroundColor: '#1c2333',
    borderRadius: 4,
  },
  shortcutDesc: {
    color: '#c9cdd5',
    fontSize: 13,
  },
  kbd: {
    padding: '2px 8px',
    backgroundColor: '#111827',
    border: '1px solid #2d3548',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#e0e4ec',
    boxShadow: '0 2px 0 #1a1f2e',
    whiteSpace: 'nowrap' as const,
  },
};

export default SettingsModal;
