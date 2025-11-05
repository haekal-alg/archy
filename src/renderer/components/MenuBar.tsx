import React, { useState } from 'react';

interface MenuBarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onClear: () => void;
  diagramName: string;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onSave,
  onLoad,
  onExport,
  onClear,
  diagramName
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = {
    File: [
      { label: 'Save Diagram', action: onSave, shortcut: 'Ctrl+S' },
      { label: 'Load Diagram', action: onLoad, shortcut: 'Ctrl+O' },
      { label: 'Export as PNG', action: onExport, shortcut: 'Ctrl+E' },
      { label: 'Clear Canvas', action: onClear, shortcut: 'Ctrl+Shift+N' }
    ]
  };

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        background: '#2c3e50',
        color: '#ecf0f1',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 2000,
        userSelect: 'none'
      }}
    >
      {/* App Title */}
      <div style={{
        fontWeight: 'bold',
        fontSize: '14px',
        marginRight: '24px',
        color: '#3498db'
      }}>
        Archy
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {Object.keys(menuItems).map((menuName) => (
          <div key={menuName} style={{ position: 'relative' }}>
            <button
              onClick={() => handleMenuClick(menuName)}
              style={{
                background: activeMenu === menuName ? '#34495e' : 'transparent',
                color: '#ecf0f1',
                border: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeMenu !== menuName) {
                  e.currentTarget.style.background = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenu !== menuName) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {menuName}
            </button>

            {/* Dropdown */}
            {activeMenu === menuName && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#34495e',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  minWidth: '200px',
                  overflow: 'hidden'
                }}
              >
                {menuItems[menuName as keyof typeof menuItems].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(item.action)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: '#ecf0f1',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2c3e50';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{
                      fontSize: '11px',
                      color: '#95a5a6',
                      fontFamily: 'monospace'
                    }}>
                      {item.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Diagram Name */}
      <div style={{
        fontSize: '13px',
        color: '#95a5a6',
        fontStyle: 'italic'
      }}>
        {diagramName}
      </div>
    </div>
  );
};

export default MenuBar;
