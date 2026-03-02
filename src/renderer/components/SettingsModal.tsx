import React, { useState, useEffect } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ShellType, TerminalSettings } from '../types/settings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHELL_OPTIONS: { value: ShellType; label: string; description: string }[] = [
  { value: 'cmd', label: 'CMD', description: 'Windows Command Prompt' },
  { value: 'wsl', label: 'WSL', description: 'Windows Subsystem for Linux' },
  { value: 'powershell', label: 'PowerShell', description: 'Windows PowerShell' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { settings, updateSettings } = useSettingsContext();
  const [localTerminal, setLocalTerminal] = useState<TerminalSettings>(settings.terminal);

  // Sync local state when settings change or modal opens
  useEffect(() => {
    if (open) {
      setLocalTerminal(settings.terminal);
    }
  }, [open, settings.terminal]);

  if (!open) return null;

  const handleShellChange = (shell: ShellType) => {
    setLocalTerminal(prev => ({ ...prev, defaultShell: shell }));
  };

  const handleCwdChange = (shell: ShellType, value: string) => {
    setLocalTerminal(prev => ({
      ...prev,
      shellCwd: { ...prev.shellCwd, [shell]: value },
    }));
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

  const handleSave = async () => {
    await updateSettings({ terminal: localTerminal });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>Settings</span>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 10 10">
              <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Section: Terminal */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Terminal</h3>

            {/* Default Shell */}
            <label style={styles.label}>Default Shell</label>
            <div style={styles.shellSelector}>
              {SHELL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
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
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSave}>Save</button>
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
    width: 480,
    maxHeight: '80vh',
    backgroundColor: '#151923',
    border: '1px solid #2d3548',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #2d3548',
  },
  headerTitle: {
    color: '#e0e4ec',
    fontSize: 15,
    fontWeight: 600,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  content: {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: 8,
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
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid #2d3548',
  },
  cancelBtn: {
    padding: '7px 18px',
    backgroundColor: 'transparent',
    border: '1px solid #2d3548',
    borderRadius: 6,
    color: '#8892a6',
    fontSize: 13,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '7px 18px',
    backgroundColor: '#4d7cfe',
    border: '1px solid #4d7cfe',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default SettingsModal;
