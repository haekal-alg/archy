import React, { useState, useEffect } from 'react';
import { getMenuContainerStyle, getMenuItemStyle } from '../ContextMenu';
import { TrashIcon, RenameIcon, NewFolderIcon, FolderIcon } from './SFTPIcons';
import { FileItem } from './sftpReducer';

interface FileContextMenuProps {
  x: number;
  y: number;
  file: FileItem | null; // null = right-clicked empty area
  onDelete: () => void;
  onRename: () => void;
  onNewFolder: () => void;
  onOpen?: () => void;
  onClose: () => void;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x, y, file, onDelete, onRename, onNewFolder, onOpen, onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  // Compute position to keep within viewport
  const menuWidth = 180;
  const menuHeight = file ? (file.type === 'directory' && file.name !== '..' ? 140 : 90) : 50;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  const items: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }> = [];

  if (!file) {
    // Right-clicked on empty area
    items.push({ label: 'New Folder', icon: <NewFolderIcon />, onClick: onNewFolder });
  } else if (file.name === '..') {
    // Parent directory - no actions
    return null;
  } else {
    if (file.type === 'directory' && onOpen) {
      items.push({ label: 'Open', icon: <FolderIcon size={14} />, onClick: onOpen });
    }
    items.push({ label: 'Rename', icon: <RenameIcon />, onClick: onRename });
    items.push({ label: 'Delete', icon: <TrashIcon />, onClick: onDelete, danger: true });
  }

  if (items.length === 0) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1200 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        style={{
          position: 'fixed',
          top: adjustedY,
          left: adjustedX,
          width: `${menuWidth}px`,
          padding: '4px',
          zIndex: 1201,
          pointerEvents: 'auto',
          ...getMenuContainerStyle(isVisible),
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            onClick={(e) => { e.stopPropagation(); item.onClick(); onClose(); }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            style={getMenuItemStyle(hoverIndex === i, item.danger)}
          >
            <span style={{ width: '22px', display: 'flex', justifyContent: 'center', marginRight: '6px' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default FileContextMenu;
