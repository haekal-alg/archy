import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TitleBarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

type MenuId = 'file' | 'edit' | 'view';

const TitleBar: React.FC<TitleBarProps> = ({
  onSave, onLoad, onExport, onClear,
  onUndo, onRedo, canUndo, canRedo,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Query initial maximized state
  useEffect(() => {
    window.electron.windowIsMaximized().then(setIsMaximized);
    const cleanup = window.electron.onWindowMaximizedChange(setIsMaximized);
    return cleanup;
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenu]);

  // Close menu on Escape
  useEffect(() => {
    if (!openMenu) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openMenu]);

  const handleMenuClick = useCallback((id: MenuId) => {
    setOpenMenu(prev => prev === id ? null : id);
  }, []);

  const handleMenuHover = useCallback((id: MenuId) => {
    if (openMenu !== null) setOpenMenu(id);
  }, [openMenu]);

  const handleItemClick = useCallback((action?: () => void, disabled?: boolean) => {
    if (disabled || !action) return;
    action();
    setOpenMenu(null);
  }, []);

  const menus: Record<MenuId, { label: string; items: MenuItem[] }> = {
    file: {
      label: 'File',
      items: [
        { label: 'Save', shortcut: 'Ctrl+S', action: onSave },
        { label: 'Load', shortcut: 'Ctrl+O', action: onLoad },
        { separator: true, label: '' },
        { label: 'Export as PNG', shortcut: 'Ctrl+E', action: onExport },
        { separator: true, label: '' },
        { label: 'Clear Canvas', shortcut: 'Ctrl+Shift+N', action: onClear },
        { separator: true, label: '' },
        { label: 'Exit', shortcut: 'Alt+F4', action: () => window.electron.windowClose() },
      ],
    },
    edit: {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: onUndo, disabled: !canUndo },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: onRedo, disabled: !canRedo },
        { separator: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
        { separator: true, label: '' },
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') },
      ],
    },
    view: {
      label: 'View',
      items: [
        { label: 'Reload', shortcut: 'Ctrl+R', action: () => window.electron.windowReload() },
        { label: 'Toggle DevTools', shortcut: 'F12', action: () => window.electron.windowToggleDevTools() },
        { separator: true, label: '' },
        { label: 'Zoom In', shortcut: 'Ctrl++', action: () => window.electron.windowZoomIn() },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => window.electron.windowZoomOut() },
        { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: () => window.electron.windowZoomReset() },
      ],
    },
  };

  const menuOrder: MenuId[] = ['file', 'edit', 'view'];

  return (
    <div
      style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#151923',
        borderBottom: '1px solid #2d3548',
        fontSize: 13,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* App icon + title */}
      <div
        className="titlebar-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          height: '100%',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d7cfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: '#8892a6', fontSize: 12, fontWeight: 500 }}>Archy</span>
      </div>

      {/* Menu bar */}
      <div
        ref={menuBarRef}
        className="titlebar-no-drag"
        style={{ display: 'flex', height: '100%', alignItems: 'stretch' }}
      >
        {menuOrder.map(id => (
          <div key={id} style={{ position: 'relative', height: '100%' }}>
            <button
              className={`titlebar-menu-btn${openMenu === id ? ' active' : ''}`}
              onClick={() => handleMenuClick(id)}
              onMouseEnter={() => handleMenuHover(id)}
            >
              {menus[id].label}
            </button>
            {openMenu === id && (
              <div className="titlebar-menu-dropdown">
                {menus[id].items.map((item, i) =>
                  item.separator ? (
                    <div key={`sep-${i}`} className="titlebar-menu-separator" />
                  ) : (
                    <button
                      key={item.label}
                      className={`titlebar-menu-item${item.disabled ? ' disabled' : ''}`}
                      onClick={() => handleItemClick(item.action, item.disabled)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="titlebar-menu-shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drag region (fills remaining space) */}
      <div
        className="titlebar-drag"
        style={{ flex: 1, height: '100%' }}
        onDoubleClick={() => window.electron.windowMaximize()}
      />

      {/* Window controls */}
      <div className="titlebar-no-drag" style={{ display: 'flex', height: '100%' }}>
        {/* Minimize */}
        <button
          className="titlebar-window-btn"
          onClick={() => window.electron.windowMinimize()}
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          className="titlebar-window-btn"
          onClick={() => window.electron.windowMaximize()}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            // Restore icon (overlapping squares)
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="2" y="0" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" rx="0.5" />
              <rect x="0" y="2" width="8" height="8" fill="#151923" stroke="currentColor" strokeWidth="1" rx="0.5" />
            </svg>
          ) : (
            // Maximize icon (single square)
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" rx="0.5" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          className="titlebar-window-btn titlebar-window-btn--close"
          onClick={() => window.electron.windowClose()}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
