import React, { useState, useEffect, useRef, useCallback } from 'react';
import theme from '../../theme';

interface ConnectionContextMenuProps {
  x: number;
  y: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onRetry?: () => void;
  onDisconnect?: () => void;
  onRemove?: () => void;
  onRename?: () => void;
  onOpenInExplorer?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onClose: () => void;
}

// Icons for menu items
const RetryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M12 7C12 9.76142 9.76142 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C8.38071 2 9.61929 2.57857 10.5 3.5M10.5 3.5V1M10.5 3.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DisconnectIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M5 2V5M9 9V12M2 5H5M9 12H12M3.5 3.5L5.5 5.5M8.5 8.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RenameIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M8.5 2L12 5.5M2 12L5 11.5L11.5 5C12 4.5 12 3.5 11.5 3L11 2.5C10.5 2 9.5 2 9 2.5L2.5 9L2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExplorerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M2 3C2 2.44772 2.44772 2 3 2H5.5L7 3.5H11C11.5523 3.5 12 3.94772 12 4.5V11C12 11.5523 11.5523 12 11 12H3C2.44772 12 2 11.5523 2 11V3Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <rect x="2" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <rect x="5" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const MoveUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M7 11V3M7 3L4 6M7 3L10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoveDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
    <path d="M7 3V11M7 11L4 8M7 11L10 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Shared menu styles
const getMenuContainerStyle = (isVisible: boolean) => ({
  background: 'rgba(50, 50, 55, 0.65)',
  backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderTop: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'scale(1)' : 'scale(0.95)',
  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  transformOrigin: 'top left',
});

const getMenuItemStyle = (isHovered: boolean, isDanger: boolean = false) => ({
  width: '100%',
  padding: '6px 12px',
  border: 'none',
  background: isHovered
    ? (isDanger ? 'rgba(255, 92, 92, 0.25)' : 'rgba(255, 255, 255, 0.2)')
    : 'transparent',
  borderRadius: '6px',
  color: isDanger ? '#ff5c5c' : theme.text.primary,
  textAlign: 'left' as const,
  cursor: 'pointer',
  fontSize: theme.fontSize.sm,
  transition: 'background 0.12s ease-out',
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
});

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isDanger?: boolean;
  isSeparatorBefore?: boolean;
}

const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
  x,
  y,
  connectionStatus,
  onRetry,
  onDisconnect,
  onRemove,
  onRename,
  onOpenInExplorer,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Build menu items dynamically
  const items: MenuItem[] = [];
  if (onRetry) items.push({ label: 'Retry Connection', icon: <RetryIcon />, action: onRetry });
  if (onDisconnect) items.push({ label: 'Disconnect', icon: <DisconnectIcon />, action: onDisconnect });
  if (onRename) items.push({ label: 'Rename', icon: <RenameIcon />, action: onRename });
  if (onOpenInExplorer) items.push({ label: 'Open in Explorer', icon: <ExplorerIcon />, action: onOpenInExplorer });
  if (onDuplicate) items.push({ label: 'Duplicate in New Tab', icon: <DuplicateIcon />, action: onDuplicate });
  if (onMoveUp || onMoveDown) {
    const needsSeparator = items.length > 0;
    if (onMoveUp) items.push({ label: 'Move Up', icon: <MoveUpIcon />, action: onMoveUp, isSeparatorBefore: needsSeparator });
    if (onMoveDown) items.push({ label: 'Move Down', icon: <MoveDownIcon />, action: onMoveDown, isSeparatorBefore: !onMoveUp && needsSeparator });
  }
  if (onRemove) items.push({ label: 'Remove', icon: <RemoveIcon />, action: onRemove, isDanger: true, isSeparatorBefore: true });

  // Entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus first item
  useEffect(() => {
    if (isVisible && itemRefs.current[0]) {
      itemRefs.current[0].focus();
    }
  }, [isVisible]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (hoveredIndex + 1) % items.length;
      setHoveredIndex(next);
      itemRefs.current[next]?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (hoveredIndex - 1 + items.length) % items.length;
      setHoveredIndex(next);
      itemRefs.current[next]?.focus();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setHoveredIndex(0);
      itemRefs.current[0]?.focus();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      const last = items.length - 1;
      setHoveredIndex(last);
      itemRefs.current[last]?.focus();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hoveredIndex >= 0 && hoveredIndex < items.length) {
        items[hoveredIndex].action();
        onClose();
      }
    }
  }, [hoveredIndex, items, onClose]);

  return (
    <>
      {/* Overlay to close menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          pointerEvents: 'auto'
        }}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Context Menu */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Connection actions"
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          top: y,
          left: x,
          ...getMenuContainerStyle(isVisible),
          zIndex: 9999,
          minWidth: '180px',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'auto'
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {item.isSeparatorBefore && (
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                margin: '6px 0'
              }} />
            )}
            <button
              ref={el => { itemRefs.current[index] = el; }}
              role="menuitem"
              tabIndex={hoveredIndex === index ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
                onClose();
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => {}}
              onFocus={() => setHoveredIndex(index)}
              style={getMenuItemStyle(hoveredIndex === index, item.isDanger)}
            >
              {item.icon}
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default ConnectionContextMenu;
