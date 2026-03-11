import React, { useState } from 'react';
import { ToolType, TOOLS } from '../types/tools';
import { darkTheme } from '../../theme';

// CONFIGURATION: Change this single value to adjust the overall size of the tool palette
// Default: 1.0, Smaller: 0.8, 0.6, Larger: 1.2, 1.5
const PALETTE_SCALE = 0.8;

// Keyboard shortcut overlay
const SHORTCUTS = [
  { key: 'V', desc: 'Selection tool' },
  { key: 'H', desc: 'Hand (pan) tool' },
  { key: 'Del', desc: 'Delete selected' },
  { key: 'Ctrl+Z', desc: 'Undo' },
  { key: 'Ctrl+Y', desc: 'Redo' },
  { key: 'Ctrl+S', desc: 'Save diagram' },
  { key: 'Ctrl+O', desc: 'Load diagram' },
  { key: 'Ctrl+T', desc: 'Local terminal' },
  { key: 'Ctrl+Shift+F', desc: 'SFTP modal' },
  { key: 'Alt+1', desc: 'Design tab' },
  { key: 'Alt+2', desc: 'Connections tab' },
  { key: 'Middle click', desc: 'Pan canvas' },
  { key: 'Scroll', desc: 'Zoom in/out' },
  { key: 'Dbl-click node', desc: 'Configure' },
];

interface ToolPaletteProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isShapeLibraryOpen?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExportPNG?: () => void;
  onExportJPG?: () => void;
  onExportSVG?: () => void;
  isExporting?: boolean;
  hasNodes?: boolean;
  hasUnsavedChanges?: boolean;
}

const IconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    onMouseEnter={(e) => {
      if (!disabled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
    }}
    onMouseLeave={(e) => {
      if (!disabled) e.currentTarget.style.background = 'transparent';
    }}
    style={{
      ...styles.toolButton,
      opacity: disabled ? 0.35 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  activeTool,
  onToolChange,
  isShapeLibraryOpen = true,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExportPNG,
  onExportJPG,
  onExportSVG,
  isExporting = false,
  hasNodes = false,
  hasUnsavedChanges = false,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Offset center when ShapeLibrary is open (240px wide)
  const offsetLeft = isShapeLibraryOpen ? 'calc(50% + 120px)' : '50%';

  const iconSize = 16 * PALETTE_SCALE;
  const exportEnabled = !isExporting && hasNodes;

  return (
    <div style={{ ...styles.container, left: offsetLeft }}>
      <div style={styles.toolGroup}>
        {(Object.keys(TOOLS) as ToolType[]).map((toolType) => {
          const tool = TOOLS[toolType];
          const isActive = activeTool === toolType;

          return (
            <button
              key={toolType}
              onClick={() => onToolChange(toolType)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              style={{
                ...styles.toolButton,
                ...(isActive ? styles.activeToolButton : {}),
              }}
              title={`${tool.name} (${tool.shortcut})`}
              aria-label={tool.name}
            >
              {/* Icon SVG based on tool type */}
              {toolType === 'selection' && (
                <svg
                  width={20 * PALETTE_SCALE}
                  height={20 * PALETTE_SCALE}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? darkTheme.accent.blue : darkTheme.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              )}
              {toolType === 'hand' && (
                <svg
                  width={20 * PALETTE_SCALE}
                  height={20 * PALETTE_SCALE}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? darkTheme.accent.blue : darkTheme.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              )}
              <span style={styles.shortcutLabel}>{tool.shortcut}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div style={styles.divider} />

        {/* Undo button */}
        <IconButton onClick={() => onUndo?.()} disabled={!canUndo || isExporting} title="Undo (Ctrl+Z)">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={canUndo && !isExporting ? darkTheme.text.primary : darkTheme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </IconButton>

        {/* Redo button */}
        <IconButton onClick={() => onRedo?.()} disabled={!canRedo || isExporting} title="Redo (Ctrl+Y)">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={canRedo && !isExporting ? darkTheme.text.primary : darkTheme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </IconButton>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Export dropdown */}
        <div style={{ position: 'relative' }}>
          <IconButton onClick={() => setShowExportMenu(!showExportMenu)} disabled={!exportEnabled} title="Export diagram">
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={exportEnabled ? darkTheme.text.primary : darkTheme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </IconButton>

          {showExportMenu && exportEnabled && (
            <>
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
                onClick={() => setShowExportMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: `${(44 + 16) * PALETTE_SCALE + 8}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.92)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${darkTheme.border.default}`,
                borderRadius: '8px',
                boxShadow: darkTheme.shadow.lg,
                zIndex: 9999,
                minWidth: '140px',
                overflow: 'hidden',
              }}>
                {[
                  { label: 'Export as PNG', onClick: onExportPNG },
                  { label: 'Export as JPG', onClick: onExportJPG },
                  { label: 'Export as SVG', onClick: onExportSVG },
                ].map(({ label, onClick }, i) => (
                  <button
                    key={label}
                    onClick={() => { onClick?.(); setShowExportMenu(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: i < 2 ? `1px solid ${darkTheme.border.default}` : 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: darkTheme.fontSize.sm,
                      color: darkTheme.text.primary,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Keyboard shortcuts button */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          onMouseEnter={(e) => {
            if (!showShortcuts) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showShortcuts) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
          style={{
            ...styles.toolButton,
            ...(showShortcuts ? styles.activeToolButton : {}),
          }}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <span style={{
            fontSize: `${14 * PALETTE_SCALE}px`,
            fontWeight: 700,
            color: showShortcuts ? darkTheme.accent.blue : darkTheme.text.primary,
          }}>?</span>
        </button>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Unsaved/Saved status */}
        <span style={{
          fontSize: `${10 * PALETTE_SCALE}px`,
          fontWeight: 600,
          padding: `${2 * PALETTE_SCALE}px ${6 * PALETTE_SCALE}px`,
          borderRadius: `${4 * PALETTE_SCALE}px`,
          color: hasUnsavedChanges ? '#f59e0b' : '#22c55e',
          background: hasUnsavedChanges ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
          userSelect: 'none',
        }}>
          {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
        </span>
      </div>

      {/* Shortcut Overlay */}
      {showShortcuts && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
            onClick={() => setShowShortcuts(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: `${(44 + 16) * PALETTE_SCALE + 8}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${darkTheme.border.default}`,
              borderRadius: '12px',
              boxShadow: darkTheme.shadow.lg,
              padding: '12px 16px',
              zIndex: 9999,
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: darkTheme.fontSize.sm, fontWeight: darkTheme.fontWeight.semibold, color: darkTheme.text.primary, marginBottom: '8px' }}>
              Keyboard Shortcuts
            </div>
            {SHORTCUTS.map(({ key, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', gap: '16px' }}>
                <span style={{ fontSize: darkTheme.fontSize.sm, color: darkTheme.text.secondary }}>{desc}</span>
                <kbd style={{
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  color: darkTheme.text.primary,
                  whiteSpace: 'nowrap',
                }}>{key}</kbd>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Styles that scale based on PALETTE_SCALE
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: `${20 * PALETTE_SCALE}px`,
    left: '50%', // overridden inline
    transform: 'translateX(-50%)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    display: 'flex',
    gap: `${12 * PALETTE_SCALE}px`,
    padding: `${8 * PALETTE_SCALE}px`,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${darkTheme.border.default}`,
    borderRadius: `${12 * PALETTE_SCALE}px`,
    boxShadow: darkTheme.shadow.lg,
  },
  toolGroup: {
    display: 'flex',
    gap: `${4 * PALETTE_SCALE}px`,
    alignItems: 'center',
  },
  toolButton: {
    position: 'relative',
    width: `${44 * PALETTE_SCALE}px`,
    height: `${44 * PALETTE_SCALE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: `1px solid transparent`,
    borderRadius: `${8 * PALETTE_SCALE}px`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: darkTheme.text.primary,
    outline: 'none',
  },
  activeToolButton: {
    background: 'rgba(59, 130, 246, 0.15)',
    border: `1px solid ${darkTheme.accent.blue}`,
    boxShadow: `0 0 ${12 * PALETTE_SCALE}px rgba(59, 130, 246, 0.3)`,
  },
  divider: {
    width: '1px',
    height: `${24 * PALETTE_SCALE}px`,
    background: darkTheme.border.default,
    margin: `0 ${2 * PALETTE_SCALE}px`,
  },
  shortcutLabel: {
    position: 'absolute',
    bottom: `${2 * PALETTE_SCALE}px`,
    right: `${2 * PALETTE_SCALE}px`,
    fontSize: `${9 * PALETTE_SCALE}px`,
    fontWeight: 600,
    color: darkTheme.text.secondary,
    background: 'rgba(0, 0, 0, 0.6)',
    padding: `${1 * PALETTE_SCALE}px ${3 * PALETTE_SCALE}px`,
    borderRadius: `${3 * PALETTE_SCALE}px`,
  },
};
