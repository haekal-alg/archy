import React, { useRef, useState, useEffect } from 'react';
import theme from '../../../theme';
import { PaneState, TransferProgress, FileItem, SortColumn } from './sftpReducer';
import { FolderIcon, FileIcon, ArchiveIcon, GearIcon, SFTPCheckIcon, NewFolderIcon } from './SFTPIcons';
import { getMenuContainerStyle, getMenuItemStyle } from '../ContextMenu';
import TransferFooter, { TRANSFER_FOOTER_HEIGHT } from './TransferFooter';
import EditablePathBar from './EditablePathBar';
import FileContextMenu from './FileContextMenu';
import ConfirmDialog from './ConfirmDialog';

interface FilePaneProps {
  side: 'local' | 'remote';
  title: string;
  paneState: PaneState;
  transfer: TransferProgress | null;
  dragOverPane: 'local' | 'remote' | null;
  transferActive: boolean;

  onNavigate: (path: string) => void;
  onFileClick: (filePath: string) => void;
  onFileSelect: (filePath: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDragStart: (file: FileItem, e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
  onSortChange: (column: SortColumn) => void;
  onToggleHidden: () => void;
  onOpenSettingsMenu: (pos: { x: number; y: number }) => void;
  onCloseSettingsMenu: () => void;
  onSettingsMenuHover: (index: number | null) => void;
  onSettingsMenuVisible: (visible: boolean) => void;
  onDeleteFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem, newName: string) => void;
  onCreateFolder: (name: string) => void;
  onTransferSelected?: (filePaths: string[]) => void;

  displayFiles: FileItem[];
  formatSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  formatDuration: (ms: number) => string;

  pathSeparator: '/' | '\\';
  headerExtra?: React.ReactNode;
  pathBarSlot?: React.ReactNode;
}

const isHiddenFile = (fileName: string) => fileName.startsWith('.') && fileName !== '..';

const getFileExtension = (name: string) => {
  const parts = name.toLowerCase().split('.');
  if (parts.length <= 1) return '';
  return parts.slice(1).join('.');
};

const isArchiveFile = (name: string) => {
  const ext = getFileExtension(name);
  const archiveExtensions = ['zip', 'tar', 'gz', 'tgz', 'bz2', 'tbz2', 'xz', 'txz', '7z', 'rar'];
  return archiveExtensions.some(a => ext === a || ext.endsWith(`.${a}`));
};

const getFileIcon = (file: FileItem) => {
  if (file.type === 'directory') return <FolderIcon />;
  if (isArchiveFile(file.name)) return <ArchiveIcon />;
  return <FileIcon />;
};

const getFileIconColor = (file: FileItem) => {
  if (file.type === 'directory') return theme.accent.blue;
  if (isArchiveFile(file.name)) return theme.accent.orange;
  return theme.text.secondary;
};

const FilePane: React.FC<FilePaneProps> = ({
  side, title, paneState, transfer, dragOverPane, transferActive,
  onNavigate, onFileClick, onFileSelect, onSelectAll, onDeselectAll,
  onDragStart, onDrop, onDragEnter, onDragLeave, onSortChange,
  onToggleHidden, onOpenSettingsMenu, onCloseSettingsMenu,
  onSettingsMenuHover, onSettingsMenuVisible, onDeleteFile, onRenameFile,
  onCreateFolder, onTransferSelected,
  displayFiles, formatSize, formatDate, formatDuration,
  pathSeparator, headerExtra, pathBarSlot,
}) => {
  const gearRef = useRef<HTMLButtonElement | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [newFolderPrompt, setNewFolderPrompt] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const SETTINGS_MENU_WIDTH = 200;
  const SETTINGS_MENU_GAP = 6;

  useEffect(() => {
    if (newFolderPrompt && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [newFolderPrompt]);

  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus();
      // Select file name without extension
      const dotIndex = renameValue.lastIndexOf('.');
      if (dotIndex > 0) {
        renameInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingFile]);

  // Settings menu animation
  useEffect(() => {
    if (!paneState.contextMenuOpen) {
      onSettingsMenuVisible(false);
      return;
    }
    onSettingsMenuVisible(false);
    const timer = setTimeout(() => onSettingsMenuVisible(true), 10);
    return () => clearTimeout(timer);
  }, [paneState.contextMenuOpen]);

  const getSettingsMenuPosition = (button: HTMLButtonElement | null) => {
    if (!button) return null;
    const rect = button.getBoundingClientRect();
    const maxX = Math.max(8, window.innerWidth - SETTINGS_MENU_WIDTH - 8);
    const x = Math.min(maxX, Math.max(8, rect.right - SETTINGS_MENU_WIDTH));
    const maxY = Math.max(8, window.innerHeight - 120);
    const y = Math.min(maxY, rect.bottom + SETTINGS_MENU_GAP);
    return { x, y };
  };

  const handleGearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const nextOpen = !paneState.contextMenuOpen;
    if (nextOpen) {
      const pos = getSettingsMenuPosition(e.currentTarget);
      if (pos) onOpenSettingsMenu(pos);
    } else {
      onCloseSettingsMenu();
    }
  };

  const handleRowContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (file.name === '..') return;
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file: null });
  };

  const handleRenameSubmit = (file: FileItem) => {
    setRenamingFile(null);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== file.name) {
      onRenameFile(file, trimmed);
    }
  };

  const handleNewFolderSubmit = () => {
    setNewFolderPrompt(false);
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
    }
    setNewFolderName('');
  };

  const handleCheckboxClick = (e: React.MouseEvent, file: FileItem, index: number) => {
    e.stopPropagation();
    if (file.type === 'directory' || file.name === '..') return;

    if (e.shiftKey && lastClickedIndex !== null) {
      // Shift-click: select range
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const filePaths: string[] = [];
      for (let i = start; i <= end; i++) {
        const f = displayFiles[i];
        if (f && f.type === 'file' && f.name !== '..') {
          filePaths.push(f.path);
        }
      }
      // Use select range via multiple onFileSelect calls with ctrl
      for (const fp of filePaths) {
        if (!paneState.selectedFiles.has(fp)) {
          onFileSelect(fp, true, false);
        }
      }
    } else {
      onFileSelect(file.path, true, false);
    }
    setLastClickedIndex(index);
  };

  const selectableFiles = displayFiles.filter(f => f.type === 'file' && f.name !== '..');
  const allSelected = selectableFiles.length > 0 && selectableFiles.every(f => paneState.selectedFiles.has(f.path));
  const someSelected = paneState.selectedFiles.size > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: side === 'local' ? `1px solid ${theme.border.default}` : 'none' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: theme.background.tertiary,
        borderBottom: `1px solid ${theme.border.default}`,
        fontSize: '12px',
        fontWeight: 600,
        color: theme.text.primary,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{title}</span>
          {headerExtra}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {someSelected && onTransferSelected && (
            <button
              onClick={() => onTransferSelected(Array.from(paneState.selectedFiles))}
              disabled={transferActive}
              style={{
                background: theme.accent.greenDark,
                border: 'none',
                color: '#fff',
                cursor: transferActive ? 'not-allowed' : 'pointer',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                opacity: transferActive ? 0.5 : 1,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!transferActive) e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                if (!transferActive) e.currentTarget.style.opacity = '1';
              }}
            >
              Transfer {paneState.selectedFiles.size} file{paneState.selectedFiles.size !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => {
              setNewFolderPrompt(true);
              setNewFolderName('');
            }}
            disabled={transferActive}
            title="New Folder"
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.text.primary,
              cursor: transferActive ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
              opacity: transferActive ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!transferActive) e.currentTarget.style.background = theme.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <NewFolderIcon />
          </button>
          <button
            ref={gearRef}
            onClick={handleGearClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.text.primary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.background.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <GearIcon />
          </button>
        </div>
      </div>

      {/* Path bar */}
      {pathBarSlot || (
        <EditablePathBar
          path={paneState.path}
          separator={pathSeparator}
          onNavigate={onNavigate}
          disabled={transferActive}
        />
      )}

      {/* New folder inline prompt */}
      {newFolderPrompt && (
        <div style={{
          padding: '6px 16px',
          background: theme.background.secondary,
          borderBottom: `1px solid ${theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <NewFolderIcon size={14} color={theme.accent.blue} />
          <input
            ref={newFolderInputRef}
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNewFolderSubmit();
              if (e.key === 'Escape') { setNewFolderPrompt(false); setNewFolderName(''); }
            }}
            onBlur={handleNewFolderSubmit}
            style={{
              flex: 1,
              padding: '4px 8px',
              background: theme.background.tertiary,
              border: `1px solid ${theme.accent.blue}`,
              borderRadius: '4px',
              color: theme.text.primary,
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* File table area */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
        onDragLeave={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
            onDragLeave(e);
          }
        }}
        onDrop={onDrop}
        onContextMenu={(e) => {
          // Only fire on empty space (not on rows)
          if ((e.target as HTMLElement).closest('tr')) return;
          handleEmptyContextMenu(e);
        }}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          paddingBottom: `${TRANSFER_FOOTER_HEIGHT + 16}px`,
          position: 'relative',
          background: dragOverPane === side ? 'rgba(22, 130, 93, 0.1)' : 'transparent',
          border: dragOverPane === side ? `2px dashed ${theme.accent.greenDark}` : '2px dashed transparent',
          transition: 'all 0.2s',
        }}
      >
        {displayFiles.length === 0 && !paneState.loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.text.tertiary }}>
            No files found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '32px' }} />
              <col style={{ width: '42%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border.default}` }}>
                <th style={{ padding: '8px 4px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) onDeselectAll();
                      else onSelectAll();
                    }}
                    style={{ cursor: 'pointer', accentColor: theme.accent.blue }}
                    title="Select all files"
                  />
                </th>
                {['name', 'modified', 'type', 'size'].map((col) => (
                  <th
                    key={col}
                    onClick={() => onSortChange(col as SortColumn)}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.background.tertiary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    {paneState.sortColumn === col && (
                      <span style={{ marginLeft: '4px' }}>
                        {paneState.sortDirection === 'asc' ? '\u2191' : '\u2193'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayFiles.map((file, index) => {
                const isSelected = paneState.selectedFile === file.path;
                const isChecked = paneState.selectedFiles.has(file.path);
                const isRenaming = renamingFile === file.path;
                const isSelectableFile = file.type === 'file' && file.name !== '..';

                return (
                  <tr
                    key={file.path + index}
                    draggable={file.type === 'file' && !isRenaming}
                    onClick={(e) => {
                      if (isRenaming) return;
                      if (e.ctrlKey && isSelectableFile) {
                        onFileSelect(file.path, true, false);
                        setLastClickedIndex(index);
                      } else if (e.shiftKey && isSelectableFile && lastClickedIndex !== null) {
                        handleCheckboxClick(e, file, index);
                      } else {
                        onFileClick(file.path);
                      }
                    }}
                    onDoubleClick={() => {
                      if (isRenaming || transferActive) return;
                      if (file.type === 'directory') onNavigate(file.path);
                    }}
                    onContextMenu={(e) => handleRowContextMenu(e, file)}
                    onDragStart={(e) => {
                      if (file.type === 'file') onDragStart(file, e);
                    }}
                    style={{
                      cursor: isRenaming ? 'default' : 'pointer',
                      background: isSelected ? theme.background.active : (isChecked ? 'rgba(77, 124, 254, 0.08)' : 'transparent'),
                      transition: 'background 0.15s',
                      opacity: isHiddenFile(file.name) ? 0.5 : 1,
                      filter: isHiddenFile(file.name) ? 'grayscale(50%)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isChecked) e.currentTarget.style.background = theme.background.tertiary;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isChecked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      {isSelectableFile ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by click
                          onClick={(e) => handleCheckboxClick(e, file, index)}
                          style={{ cursor: 'pointer', accentColor: theme.accent.blue }}
                        />
                      ) : null}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '13px', color: theme.text.primary }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: getFileIconColor(file) }}>
                          {getFileIcon(file)}
                        </span>
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(file);
                              if (e.key === 'Escape') setRenamingFile(null);
                            }}
                            onBlur={() => handleRenameSubmit(file)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1,
                              padding: '2px 6px',
                              background: theme.background.primary,
                              border: `1px solid ${theme.accent.blue}`,
                              borderRadius: '3px',
                              color: theme.text.primary,
                              fontSize: '13px',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatDate(file.modifiedTime)}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.type === 'directory' ? 'Folder' : 'File'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.type === 'file' ? formatSize(file.size) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Loading overlay */}
        {paneState.loading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(26, 31, 46, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid rgba(58, 69, 86, 0.3)`,
              borderTop: `3px solid ${side === 'local' ? theme.accent.greenDark : theme.accent.blue}`,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        <div style={{ position: 'sticky', bottom: 0, paddingTop: '8px', zIndex: 15 }}>
          <TransferFooter pane={side} transfer={transfer} formatSize={formatSize} formatDuration={formatDuration} />
        </div>
      </div>

      {/* Settings context menu */}
      {paneState.contextMenuOpen && paneState.menuPos && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1200 }}
            onClick={onCloseSettingsMenu}
            onContextMenu={(e) => { e.preventDefault(); onCloseSettingsMenu(); }}
          />
          <div
            style={{
              position: 'fixed',
              top: paneState.menuPos.y,
              left: paneState.menuPos.x,
              width: `${SETTINGS_MENU_WIDTH}px`,
              padding: '4px',
              zIndex: 1201,
              pointerEvents: 'auto',
              ...getMenuContainerStyle(paneState.menuVisible),
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleHidden();
                onCloseSettingsMenu();
              }}
              onMouseEnter={() => onSettingsMenuHover(0)}
              onMouseLeave={() => onSettingsMenuHover(null)}
              style={getMenuItemStyle(paneState.menuHover === 0)}
            >
              <span style={{ width: '18px', display: 'flex', justifyContent: 'center' }}>
                <SFTPCheckIcon visible={paneState.showHidden} />
              </span>
              Show Hidden Files
            </button>
          </div>
        </>
      )}

      {/* File context menu (right-click) */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onDelete={() => {
            if (contextMenu.file) setConfirmDelete(contextMenu.file);
            setContextMenu(null);
          }}
          onRename={() => {
            if (contextMenu.file) {
              setRenamingFile(contextMenu.file.path);
              setRenameValue(contextMenu.file.name);
            }
            setContextMenu(null);
          }}
          onNewFolder={() => {
            setNewFolderPrompt(true);
            setNewFolderName('');
            setContextMenu(null);
          }}
          onOpen={contextMenu.file?.type === 'directory' ? () => {
            if (contextMenu.file) onNavigate(contextMenu.file.path);
            setContextMenu(null);
          } : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"?${confirmDelete.type === 'directory' ? ' This will delete all contents.' : ''}` : ''}
        confirmLabel="Delete"
        confirmDanger
        onConfirm={() => {
          if (confirmDelete) onDeleteFile(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default FilePane;
