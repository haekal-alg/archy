import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { useTabContext } from '../contexts/TabContext';
import { PlugIcon, AppleIcon, TerminalIcon } from './StatusIcons';
import { DesktopIcon, LinuxIcon, ServerIcon } from './NetworkIcons';
import theme from '../../theme';
import { sftpReducer, initialState, FileItem, SSHHost, SortColumn } from './sftp/sftpReducer';
import FilePane from './sftp/FilePane';
import EditablePathBar from './sftp/EditablePathBar';

interface SFTPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isHiddenFile = (fileName: string) => fileName.startsWith('.') && fileName !== '..';

const filterAndSortFiles = (
  files: FileItem[], showHidden: boolean, sortColumn: SortColumn, sortDirection: 'asc' | 'desc'
): FileItem[] => {
  const filtered = showHidden ? files : files.filter(f => !isHiddenFile(f.name));
  return [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortColumn) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'modified': cmp = new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime(); break;
      case 'type': cmp = a.type.localeCompare(b.type); break;
      case 'size': cmp = a.size - b.size; break;
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });
};

const formatSize = (bytes: number) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) { value /= 1024; unitIndex++; }
  return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const getOSIcon = (host: SSHHost): React.ReactNode => {
  const label = host.label.toLowerCase();
  const iconColor = theme.text.secondary;
  const iconSize = 16;
  if (label.includes('windows') || label.includes('win')) return <DesktopIcon color={iconColor} />;
  if (label.includes('linux') || label.includes('ubuntu') || label.includes('debian')) return <LinuxIcon color={iconColor} />;
  if (label.includes('mac') || label.includes('darwin')) return <AppleIcon size={iconSize} color={iconColor} />;
  if (label.includes('router') || label.includes('switch')) return <PlugIcon size={iconSize} color={iconColor} />;
  if (label.includes('server')) return <ServerIcon color={iconColor} />;
  return <TerminalIcon size={iconSize} color={iconColor} />;
};

const SFTPModal: React.FC<SFTPModalProps> = ({ isOpen, onClose }) => {
  const { connections } = useTabContext();
  const [state, dispatch] = useReducer(sftpReducer, initialState);
  const hostRef = useRef(state.selectedHost);
  hostRef.current = state.selectedHost;

  const allHosts: SSHHost[] = connections.map(conn => ({
    id: conn.id,
    label: conn.customLabel || conn.nodeName || `${conn.username}@${conn.host}:${conn.port}`,
    host: conn.host,
    port: conn.port,
    username: conn.username,
    hasSSH: conn.connectionType === 'ssh',
  }));

  const filteredHosts = allHosts.filter(host =>
    host.label.toLowerCase().includes(state.hostSearchQuery.toLowerCase()) ||
    host.host.toLowerCase().includes(state.hostSearchQuery.toLowerCase()) ||
    host.username.toLowerCase().includes(state.hostSearchQuery.toLowerCase())
  );

  const displayLocalFiles = filterAndSortFiles(state.local.files, state.local.showHidden, state.local.sortColumn, state.local.sortDirection);
  const displayRemoteFiles = filterAndSortFiles(state.remote.files, state.remote.showHidden, state.remote.sortColumn, state.remote.sortDirection);

  const transferActive = state.transfer !== null;

  // Detect local path separator
  const localSep: '/' | '\\' = state.local.path.match(/^[A-Z]:\\/i) ? '\\' : '/';

  // --- Effects ---
  useEffect(() => {
    if (!isOpen) { dispatch({ type: 'SET_MODAL_VISIBLE', visible: false }); return; }
    dispatch({ type: 'SET_MODAL_VISIBLE', visible: false });
    const timer = setTimeout(() => dispatch({ type: 'SET_MODAL_VISIBLE', visible: true }), 10);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !state.local.path) {
      window.electron.getHomeDirectory().then(homeDir => {
        if (homeDir) {
          dispatch({ type: 'SET_PANE_PATH', pane: 'local', path: homeDir });
          loadLocalFiles(homeDir);
        }
      }).catch(() => dispatch({ type: 'SET_ERROR', error: 'Failed to get home directory' }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => dispatch({ type: 'SET_ERROR', error: null }), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  useEffect(() => {
    return () => {
      if (hostRef.current) {
        window.electron.closeSFTPConnection(hostRef.current.id).catch(() => {});
      }
    };
  }, []);

  // Listen for real progress events
  useEffect(() => {
    if (!window.electron.onSFTPProgress) return;
    const cleanup = window.electron.onSFTPProgress((data) => {
      dispatch({
        type: 'UPDATE_TRANSFER_PROGRESS',
        bytesTransferred: data.bytesTransferred,
        totalBytes: data.totalBytes,
        speedBps: data.bytesTransferred > 0 ? data.bytesTransferred / (Math.max(1, Date.now() - (state.transfer?.startedAt || Date.now())) / 1000) : 0,
      });
    });
    return cleanup;
  }, []);

  // Close context menus on outside click
  useEffect(() => {
    if (state.local.contextMenuOpen || state.remote.contextMenuOpen) {
      const handleClick = () => dispatch({ type: 'CLOSE_ALL_MENUS' });
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [state.local.contextMenuOpen, state.remote.contextMenuOpen]);

  // --- Data loading ---
  const loadLocalFiles = useCallback(async (dirPath: string) => {
    try {
      dispatch({ type: 'SET_PANE_LOADING', pane: 'local', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      const files = await window.electron.listLocalFiles(dirPath);
      dispatch({ type: 'SET_PANE_FILES', pane: 'local', files });
      dispatch({ type: 'SET_PANE_PATH', pane: 'local', path: dirPath });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Failed to load local files: ${err.message}` });
    } finally {
      dispatch({ type: 'SET_PANE_LOADING', pane: 'local', loading: false });
    }
  }, []);

  const loadRemoteFiles = useCallback(async (remotePath: string, host?: SSHHost) => {
    const targetHost = host || hostRef.current;
    if (!targetHost) return;
    try {
      dispatch({ type: 'SET_PANE_LOADING', pane: 'remote', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      const files = await window.electron.listRemoteFiles({ connectionId: targetHost.id, path: remotePath });
      dispatch({ type: 'SET_PANE_FILES', pane: 'remote', files });
      dispatch({ type: 'SET_PANE_PATH', pane: 'remote', path: remotePath });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Failed to load remote files: ${err.message}` });
    } finally {
      dispatch({ type: 'SET_PANE_LOADING', pane: 'remote', loading: false });
    }
  }, []);

  // --- Host selection ---
  const handleHostSelect = useCallback(async (host: SSHHost) => {
    if (state.selectedHost && state.selectedHost.id !== host.id) {
      try { await window.electron.closeSFTPConnection(state.selectedHost.id); } catch {}
    }
    dispatch({ type: 'SET_HOST', host });
    const homeDir = host.username === 'root' ? '/root' : `/home/${host.username}`;
    dispatch({ type: 'SET_PANE_PATH', pane: 'remote', path: homeDir });
    await loadRemoteFiles(homeDir, host);
  }, [state.selectedHost, loadRemoteFiles]);

  // --- Transfer handlers ---
  const startSingleTransfer = useCallback(async (sourcePane: 'local' | 'remote', file: FileItem) => {
    const targetPane = sourcePane === 'local' ? 'remote' : 'local';
    dispatch({
      type: 'SET_TRANSFER', transfer: {
        pane: targetPane, fileName: file.name, progress: 0,
        bytesTransferred: 0, totalBytes: file.size, startedAt: Date.now(), speedBps: 0,
      },
    });
    try {
      if (sourcePane === 'local') {
        await window.electron.uploadFile({
          connectionId: state.selectedHost!.id, localPath: file.path,
          remotePath: state.remote.path, fileName: file.name,
        });
      } else {
        await window.electron.downloadFile({
          connectionId: state.selectedHost!.id, remotePath: file.path,
          localPath: state.local.path, fileName: file.name,
        });
      }
      dispatch({ type: 'SET_TRANSFER', transfer: null });
      if (sourcePane === 'local') loadRemoteFiles(state.remote.path);
      else loadLocalFiles(state.local.path);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Transfer failed: ${err.message}` });
      dispatch({ type: 'SET_TRANSFER', transfer: null });
    }
  }, [state.selectedHost, state.local.path, state.remote.path, loadLocalFiles, loadRemoteFiles]);

  const transferSelectedFiles = useCallback(async (sourcePaths: string[], sourcePane: 'local' | 'remote') => {
    const sourceFiles = sourcePane === 'local' ? state.local.files : state.remote.files;
    const filesToTransfer = sourcePaths
      .map(p => sourceFiles.find(f => f.path === p))
      .filter((f): f is FileItem => f != null && f.type === 'file');

    if (filesToTransfer.length === 0) return;

    const totalBytesAllFiles = filesToTransfer.reduce((sum, f) => sum + f.size, 0);
    let bytesTransferredAllFiles = 0;
    const targetPane = sourcePane === 'local' ? 'remote' : 'local';

    for (let i = 0; i < filesToTransfer.length; i++) {
      const file = filesToTransfer[i];
      dispatch({
        type: 'SET_TRANSFER', transfer: {
          pane: targetPane, fileName: file.name, progress: 0,
          bytesTransferred: 0, totalBytes: file.size, startedAt: Date.now(), speedBps: 0,
          currentFileIndex: i + 1, totalFiles: filesToTransfer.length,
          totalBytesAllFiles, bytesTransferredAllFiles,
        },
      });

      try {
        if (sourcePane === 'local') {
          await window.electron.uploadFile({
            connectionId: state.selectedHost!.id, localPath: file.path,
            remotePath: state.remote.path, fileName: file.name,
          });
        } else {
          await window.electron.downloadFile({
            connectionId: state.selectedHost!.id, remotePath: file.path,
            localPath: state.local.path, fileName: file.name,
          });
        }
        bytesTransferredAllFiles += file.size;
      } catch (err: any) {
        dispatch({ type: 'SET_ERROR', error: `Transfer failed: ${file.name}: ${err.message}` });
        break;
      }
    }

    dispatch({ type: 'SET_TRANSFER', transfer: null });
    dispatch({ type: 'DESELECT_ALL_FILES', pane: sourcePane });
    if (sourcePane === 'local') loadRemoteFiles(state.remote.path);
    else loadLocalFiles(state.local.path);
  }, [state.selectedHost, state.local.files, state.remote.files, state.local.path, state.remote.path, loadLocalFiles, loadRemoteFiles]);

  // --- File operation handlers ---
  const handleDeleteFile = useCallback(async (pane: 'local' | 'remote', file: FileItem) => {
    try {
      if (pane === 'remote') {
        await window.electron.sftpDelete({ connectionId: state.selectedHost!.id, remotePath: file.path, isDirectory: file.type === 'directory' });
        loadRemoteFiles(state.remote.path);
      } else {
        await window.electron.localDelete(file.path);
        loadLocalFiles(state.local.path);
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Delete failed: ${err.message}` });
    }
  }, [state.selectedHost, state.local.path, state.remote.path, loadLocalFiles, loadRemoteFiles]);

  const handleRenameFile = useCallback(async (pane: 'local' | 'remote', file: FileItem, newName: string) => {
    try {
      if (pane === 'remote') {
        const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
        const newPath = parentDir + '/' + newName;
        await window.electron.sftpRename({ connectionId: state.selectedHost!.id, oldPath: file.path, newPath });
        loadRemoteFiles(state.remote.path);
      } else {
        const sep = localSep;
        const parentDir = file.path.substring(0, file.path.lastIndexOf(sep));
        const newPath = parentDir + sep + newName;
        await window.electron.localRename({ oldPath: file.path, newPath });
        loadLocalFiles(state.local.path);
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Rename failed: ${err.message}` });
    }
  }, [state.selectedHost, state.local.path, state.remote.path, localSep, loadLocalFiles, loadRemoteFiles]);

  const handleCreateFolder = useCallback(async (pane: 'local' | 'remote', name: string) => {
    try {
      if (pane === 'remote') {
        const fullPath = state.remote.path + '/' + name;
        await window.electron.sftpMkdir({ connectionId: state.selectedHost!.id, remotePath: fullPath });
        loadRemoteFiles(state.remote.path);
      } else {
        const sep = localSep;
        const fullPath = state.local.path + sep + name;
        await window.electron.localMkdir(fullPath);
        loadLocalFiles(state.local.path);
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `Create folder failed: ${err.message}` });
    }
  }, [state.selectedHost, state.local.path, state.remote.path, localSep, loadLocalFiles, loadRemoteFiles]);

  // --- Drop handlers ---
  const handleLocalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAG_OVER', pane: null });
    const sourcePane = e.dataTransfer.getData('sourcePane');
    const filePath = e.dataTransfer.getData('filePath');
    const fileName = e.dataTransfer.getData('fileName');
    if (sourcePane !== 'remote' || !state.selectedHost) return;

    const sourceFile = state.remote.files.find(f => f.path === filePath);
    if (sourceFile) await startSingleTransfer('remote', sourceFile);
  }, [state.selectedHost, state.remote.files, startSingleTransfer]);

  const handleRemoteDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAG_OVER', pane: null });
    const sourcePane = e.dataTransfer.getData('sourcePane');
    const filePath = e.dataTransfer.getData('filePath');
    if (sourcePane !== 'local' || !state.selectedHost) return;

    const sourceFile = state.local.files.find(f => f.path === filePath);
    if (sourceFile) await startSingleTransfer('local', sourceFile);
  }, [state.selectedHost, state.local.files, startSingleTransfer]);

  // --- Sort handler ---
  const handleSortChange = useCallback((pane: 'local' | 'remote', column: SortColumn) => {
    const currentState = pane === 'local' ? state.local : state.remote;
    if (currentState.sortColumn === column) {
      dispatch({ type: 'SET_PANE_SORT', pane, column, direction: currentState.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      dispatch({ type: 'SET_PANE_SORT', pane, column, direction: 'asc' });
    }
  }, [state.local.sortColumn, state.local.sortDirection, state.remote.sortColumn, state.remote.sortDirection]);

  // --- File selection handler ---
  const handleFileSelect = useCallback((pane: 'local' | 'remote', filePath: string, ctrlKey: boolean, shiftKey?: boolean) => {
    if (shiftKey) {
      // Range selection - toggle for now since shift-click is handled inside FilePane
      dispatch({ type: 'TOGGLE_FILE_SELECTION', pane, filePath });
    } else if (ctrlKey) {
      dispatch({ type: 'TOGGLE_FILE_SELECTION', pane, filePath });
    } else {
      dispatch({ type: 'SET_PANE_SELECTED_FILE', pane, file: filePath });
    }
  }, []);

  // --- Close ---
  const handleClose = useCallback(async () => {
    if (state.selectedHost) {
      try { await window.electron.closeSFTPConnection(state.selectedHost.id); } catch {}
    }
    dispatch({ type: 'RESET' });
    onClose();
  }, [state.selectedHost, onClose]);

  // Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !transferActive) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, transferActive, handleClose]);

  if (!isOpen) return null;

  // --- Remote pane path bar / host selector ---
  const remotePathBar = !state.selectedHost ? (
    <div style={{
      padding: '12px 16px',
      background: theme.background.secondary,
      borderBottom: `1px solid ${theme.border.default}`,
    }}>
      <input
        type="text"
        placeholder="Search hosts..."
        value={state.hostSearchQuery}
        onChange={(e) => dispatch({ type: 'SET_HOST_SEARCH', query: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: theme.background.tertiary,
          border: `1px solid ${theme.border.default}`,
          borderRadius: '6px',
          color: theme.text.primary,
          fontSize: '13px',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = theme.accent.greenDark; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = theme.border.default; }}
      />
    </div>
  ) : (
    <EditablePathBar
      path={state.remote.path}
      separator="/"
      onNavigate={(p) => loadRemoteFiles(p)}
      disabled={transferActive}
    />
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: theme.background.primary,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      opacity: state.modalVisible ? 1 : 0,
      transform: state.modalVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.995)',
      transition: 'opacity 0.18s ease-out, transform 0.22s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L17 7M12 2L7 7M12 2V16" stroke={theme.accent.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V12" stroke={theme.accent.greenDark} strokeWidth="2" strokeLinecap="round" />
            <path d="M12 8L17 13M12 8L7 13M12 8V22" stroke={theme.accent.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: theme.text.primary }}>
            SFTP File Transfer
          </h2>
          {state.selectedHost && (
            <span style={{ fontSize: '13px', color: theme.text.tertiary, marginLeft: '8px' }}>
              {'\u2192'} {state.selectedHost.label}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          disabled={transferActive}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.text.tertiary,
            cursor: transferActive ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            padding: '0',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s',
            opacity: transferActive ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!transferActive) {
              e.currentTarget.style.background = theme.background.hover;
              e.currentTarget.style.color = theme.text.primary;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.text.tertiary;
          }}
        >
          {'\u00d7'}
        </button>
      </div>

      {/* Content - Two panes */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Local pane */}
          <FilePane
            side="local"
            title="Local Machine"
            paneState={state.local}
            transfer={state.transfer}
            dragOverPane={state.dragOverPane}
            transferActive={transferActive}
            onNavigate={(p) => { if (!transferActive) loadLocalFiles(p); }}
            onFileClick={(fp) => dispatch({ type: 'SET_PANE_SELECTED_FILE', pane: 'local', file: fp })}
            onFileSelect={(fp, ctrl, shift) => handleFileSelect('local', fp, ctrl, shift)}
            onSelectAll={() => {
              const selectableFiles = displayLocalFiles.filter(f => f.type === 'file' && f.name !== '..');
              dispatch({ type: 'SELECT_ALL_FILES', pane: 'local', filePaths: selectableFiles.map(f => f.path) });
            }}
            onDeselectAll={() => dispatch({ type: 'DESELECT_ALL_FILES', pane: 'local' })}
            onDragStart={(file, e) => {
              e.dataTransfer.setData('sourcePane', 'local');
              e.dataTransfer.setData('filePath', file.path);
              e.dataTransfer.setData('fileName', file.name);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onDrop={handleLocalDrop}
            onDragEnter={() => dispatch({ type: 'SET_DRAG_OVER', pane: 'local' })}
            onDragLeave={() => dispatch({ type: 'SET_DRAG_OVER', pane: null })}
            onSortChange={(col) => handleSortChange('local', col)}
            onToggleHidden={() => dispatch({ type: 'SET_PANE_SHOW_HIDDEN', pane: 'local', showHidden: !state.local.showHidden })}
            onOpenSettingsMenu={(pos) => dispatch({ type: 'SET_PANE_CONTEXT_MENU', pane: 'local', open: true, pos })}
            onCloseSettingsMenu={() => dispatch({ type: 'SET_PANE_CONTEXT_MENU', pane: 'local', open: false })}
            onSettingsMenuHover={(i) => dispatch({ type: 'SET_PANE_MENU_HOVER', pane: 'local', index: i })}
            onSettingsMenuVisible={(v) => dispatch({ type: 'SET_PANE_MENU_VISIBLE', pane: 'local', visible: v })}
            onDeleteFile={(file) => handleDeleteFile('local', file)}
            onRenameFile={(file, newName) => handleRenameFile('local', file, newName)}
            onCreateFolder={(name) => handleCreateFolder('local', name)}
            onTransferSelected={state.selectedHost ? (paths) => transferSelectedFiles(paths, 'local') : undefined}
            displayFiles={displayLocalFiles}
            formatSize={formatSize}
            formatDate={formatDate}
            formatDuration={formatDuration}
            pathSeparator={localSep}
          />

          {/* Remote pane */}
          {!state.selectedHost ? (
            // Host selection view
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '12px 16px',
                background: theme.background.tertiary,
                borderBottom: `1px solid ${theme.border.default}`,
                fontSize: '12px',
                fontWeight: 600,
                color: theme.text.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Remote Machine
              </div>
              {remotePathBar}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {filteredHosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.text.secondary }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
                        <circle cx="7" cy="7" r="5" stroke={theme.text.tertiary} strokeWidth="1.3" />
                        <path d="M11 11L14 14" stroke={theme.text.tertiary} strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      {state.hostSearchQuery ? 'No hosts found matching your search' : 'No hosts available'}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
                      {state.hostSearchQuery ? 'Try a different search term' : 'Create a connection from the Design tab'}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                  }}>
                    {filteredHosts.map((host) => (
                      <button
                        key={host.id}
                        onClick={() => host.hasSSH && handleHostSelect(host)}
                        disabled={!host.hasSSH}
                        style={{
                          background: host.hasSSH ? theme.background.tertiary : theme.background.secondary,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: host.hasSSH ? 'pointer' : 'not-allowed',
                          opacity: host.hasSSH ? 1 : 0.5,
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (host.hasSSH) {
                            e.currentTarget.style.background = theme.background.elevated;
                            e.currentTarget.style.borderColor = theme.accent.greenDark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = host.hasSSH ? theme.background.tertiary : theme.background.secondary;
                          e.currentTarget.style.borderColor = theme.border.default;
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px' }}>
                          {getOSIcon(host)}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: host.hasSSH ? theme.text.primary : theme.text.tertiary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}>
                          {host.label}
                        </div>
                        {!host.hasSSH && (
                          <div style={{ fontSize: '10px', color: theme.text.tertiary, fontStyle: 'italic' }}>
                            SSH not available
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <FilePane
              side="remote"
              title={`Remote Machine (${state.selectedHost.username}@${state.selectedHost.host})`}
              paneState={state.remote}
              transfer={state.transfer}
              dragOverPane={state.dragOverPane}
              transferActive={transferActive}
              onNavigate={(p) => { if (!transferActive) loadRemoteFiles(p); }}
              onFileClick={(fp) => dispatch({ type: 'SET_PANE_SELECTED_FILE', pane: 'remote', file: fp })}
              onFileSelect={(fp, ctrl, shift) => handleFileSelect('remote', fp, ctrl, shift)}
              onSelectAll={() => {
                const selectableFiles = displayRemoteFiles.filter(f => f.type === 'file' && f.name !== '..');
                dispatch({ type: 'SELECT_ALL_FILES', pane: 'remote', filePaths: selectableFiles.map(f => f.path) });
              }}
              onDeselectAll={() => dispatch({ type: 'DESELECT_ALL_FILES', pane: 'remote' })}
              onDragStart={(file, e) => {
                e.dataTransfer.setData('sourcePane', 'remote');
                e.dataTransfer.setData('filePath', file.path);
                e.dataTransfer.setData('fileName', file.name);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDrop={handleRemoteDrop}
              onDragEnter={() => dispatch({ type: 'SET_DRAG_OVER', pane: 'remote' })}
              onDragLeave={() => dispatch({ type: 'SET_DRAG_OVER', pane: null })}
              onSortChange={(col) => handleSortChange('remote', col)}
              onToggleHidden={() => dispatch({ type: 'SET_PANE_SHOW_HIDDEN', pane: 'remote', showHidden: !state.remote.showHidden })}
              onOpenSettingsMenu={(pos) => dispatch({ type: 'SET_PANE_CONTEXT_MENU', pane: 'remote', open: true, pos })}
              onCloseSettingsMenu={() => dispatch({ type: 'SET_PANE_CONTEXT_MENU', pane: 'remote', open: false })}
              onSettingsMenuHover={(i) => dispatch({ type: 'SET_PANE_MENU_HOVER', pane: 'remote', index: i })}
              onSettingsMenuVisible={(v) => dispatch({ type: 'SET_PANE_MENU_VISIBLE', pane: 'remote', visible: v })}
              onDeleteFile={(file) => handleDeleteFile('remote', file)}
              onRenameFile={(file, newName) => handleRenameFile('remote', file, newName)}
              onCreateFolder={(name) => handleCreateFolder('remote', name)}
              onTransferSelected={(paths) => transferSelectedFiles(paths, 'remote')}
              displayFiles={displayRemoteFiles}
              formatSize={formatSize}
              formatDate={formatDate}
              formatDuration={formatDuration}
              pathSeparator="/"
              pathBarSlot={remotePathBar}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Error Toast */}
      {state.error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: theme.accent.red,
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '600px',
          zIndex: 10001,
        }}>
          <span style={{ flex: 1 }}>{state.error}</span>
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {'\u00d7'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SFTPModal;
