import React, { useState, useEffect, useRef } from 'react';
import { useTabContext } from '../contexts/TabContext';
import { getMenuContainerStyle, getMenuItemStyle } from './ContextMenu';
import theme from '../../theme';

interface SFTPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modifiedTime: string;
  path: string;
}

interface SSHHost {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  hasSSH: boolean;
}

const SFTPModal: React.FC<SFTPModalProps> = ({ isOpen, onClose }) => {
  const { connections } = useTabContext();
  const [selectedHost, setSelectedHost] = useState<SSHHost | null>(null);
  const [localPath, setLocalPath] = useState<string>('');
  const [remotePath, setRemotePath] = useState<string>('');
  const [localFiles, setLocalFiles] = useState<FileItem[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<FileItem[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocalFile, setSelectedLocalFile] = useState<string | null>(null);
  const [selectedRemoteFile, setSelectedRemoteFile] = useState<string | null>(null);
  const [dragOverPane, setDragOverPane] = useState<'local' | 'remote' | null>(null);
  const [transferProgress, setTransferProgress] = useState<{
    pane: 'local' | 'remote';
    fileName: string;
    progress: number;
    sizeBytes?: number;
    startedAt: number;
  } | null>(null);
  const [showLocalHidden, setShowLocalHidden] = useState(false);
  const [showRemoteHidden, setShowRemoteHidden] = useState(false);
  const [localContextMenu, setLocalContextMenu] = useState(false);
  const [remoteContextMenu, setRemoteContextMenu] = useState(false);
  const [localMenuPos, setLocalMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [remoteMenuPos, setRemoteMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [localMenuVisible, setLocalMenuVisible] = useState(false);
  const [remoteMenuVisible, setRemoteMenuVisible] = useState(false);
  const [localMenuHover, setLocalMenuHover] = useState<number | null>(null);
  const [remoteMenuHover, setRemoteMenuHover] = useState<number | null>(null);
  const [localSortColumn, setLocalSortColumn] = useState<'name' | 'modified' | 'type' | 'size'>('name');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [remoteSortColumn, setRemoteSortColumn] = useState<'name' | 'modified' | 'type' | 'size'>('name');
  const [remoteSortDirection, setRemoteSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hostSearchQuery, setHostSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const localGearRef = useRef<HTMLButtonElement | null>(null);
  const remoteGearRef = useRef<HTMLButtonElement | null>(null);

  // Get ALL hosts from connections (not just SSH)
  const allHosts: SSHHost[] = connections.map(conn => ({
    id: conn.id,
    label: conn.customLabel || conn.nodeName || `${conn.username}@${conn.host}:${conn.port}`,
    host: conn.host,
    port: conn.port,
    username: conn.username,
    hasSSH: conn.connectionType === 'ssh',
  }));

  // Filter hosts based on search query
  const filteredHosts = allHosts.filter(host =>
    host.label.toLowerCase().includes(hostSearchQuery.toLowerCase()) ||
    host.host.toLowerCase().includes(hostSearchQuery.toLowerCase()) ||
    host.username.toLowerCase().includes(hostSearchQuery.toLowerCase())
  );

  // Helper function to check if file is hidden
  const isHiddenFile = (fileName: string) => {
    return fileName.startsWith('.') && fileName !== '..';
  };

  // Helper function to get OS icon based on node type or OS
  const getOSIcon = (host: SSHHost) => {
    // This is a placeholder - ideally we'd detect the actual OS
    // For now, return different icons based on common patterns
    const label = host.label.toLowerCase();

    if (label.includes('windows') || label.includes('win')) return '🪟';
    if (label.includes('linux') || label.includes('ubuntu') || label.includes('debian')) return '🐧';
    if (label.includes('mac') || label.includes('darwin')) return '🍎';
    if (label.includes('router') || label.includes('switch')) return '🔌';
    if (label.includes('server')) return '🖥️';

    // Default icon
    return '💻';
  };

  // Helper function to filter and sort files
  const filterAndSortFiles = (
    files: FileItem[],
    showHidden: boolean,
    sortColumn: 'name' | 'modified' | 'type' | 'size',
    sortDirection: 'asc' | 'desc'
  ) => {
    console.log('[SFTP] Filtering files - showHidden:', showHidden, 'sortColumn:', sortColumn, 'sortDirection:', sortDirection);

    // Filter hidden files
    let filtered = showHidden ? files : files.filter(f => !isHiddenFile(f.name));

    // Sort files
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          comparison = new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  // Compute filtered and sorted files
  const displayLocalFiles = filterAndSortFiles(localFiles, showLocalHidden, localSortColumn, localSortDirection);
  const displayRemoteFiles = filterAndSortFiles(remoteFiles, showRemoteHidden, remoteSortColumn, remoteSortDirection);

  // Log available hosts when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[Frontend] SFTP Modal opened');
      console.log('[Frontend] Available connections:', connections.length);
      console.log('[Frontend] Available hosts:', allHosts.length);
      console.log('[Frontend] Hosts:', allHosts);
      console.log('[Frontend] window.electron.listRemoteFiles exists?', !!window.electron.listRemoteFiles);
    }
  }, [isOpen]);

  // Subtle entrance animation
  useEffect(() => {
    if (!isOpen) {
      setModalVisible(false);
      return;
    }
    setModalVisible(false);
    const timer = setTimeout(() => setModalVisible(true), 10);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Initialize local path to user's home directory
  useEffect(() => {
    if (isOpen && !localPath) {
      window.electron.getHomeDirectory().then(homeDir => {
        if (homeDir) {
          setLocalPath(homeDir);
          loadLocalFiles(homeDir);
        }
      }).catch(err => {
        console.error('Failed to get home directory:', err);
        setError('Failed to get home directory');
      });
    }
  }, [isOpen]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Cleanup SFTP connection when modal closes
  useEffect(() => {
    return () => {
      if (selectedHost) {
        console.log('[Frontend] Cleanup: Closing SFTP connection:', selectedHost.id);
        window.electron.closeSFTPConnection(selectedHost.id).catch(err => {
          console.error('[Frontend] Cleanup error:', err);
        });
      }
    };
  }, [selectedHost]);

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setLocalContextMenu(false);
      setRemoteContextMenu(false);
      setLocalMenuVisible(false);
      setRemoteMenuVisible(false);
      setLocalMenuHover(null);
      setRemoteMenuHover(null);
      setLocalMenuPos(null);
      setRemoteMenuPos(null);
    };
    if (localContextMenu || remoteContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [localContextMenu, remoteContextMenu]);

  // Trigger context menu entrance animations
  useEffect(() => {
    if (!localContextMenu) {
      setLocalMenuVisible(false);
      return;
    }
    setLocalMenuVisible(false);
    const timer = setTimeout(() => setLocalMenuVisible(true), 10);
    return () => clearTimeout(timer);
  }, [localContextMenu]);

  useEffect(() => {
    if (!remoteContextMenu) {
      setRemoteMenuVisible(false);
      return;
    }
    setRemoteMenuVisible(false);
    const timer = setTimeout(() => setRemoteMenuVisible(true), 10);
    return () => clearTimeout(timer);
  }, [remoteContextMenu]);

  const SETTINGS_MENU_WIDTH = 200;
  const SETTINGS_MENU_GAP = 6;

  const getSettingsMenuPosition = (button: HTMLButtonElement | null) => {
    if (!button) return null;
    const rect = button.getBoundingClientRect();
    const width = SETTINGS_MENU_WIDTH;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const x = Math.min(maxX, Math.max(8, rect.right - width));
    const maxY = Math.max(8, window.innerHeight - 120);
    const y = Math.min(maxY, rect.bottom + SETTINGS_MENU_GAP);
    return { x, y };
  };

  const closeLocalMenu = () => {
    setLocalContextMenu(false);
    setLocalMenuVisible(false);
    setLocalMenuPos(null);
    setLocalMenuHover(null);
  };

  const closeRemoteMenu = () => {
    setRemoteContextMenu(false);
    setRemoteMenuVisible(false);
    setRemoteMenuPos(null);
    setRemoteMenuHover(null);
  };

  const loadLocalFiles = async (path: string) => {
    try {
      setLocalLoading(true);
      setError(null);
      console.log('[Frontend] Loading local files from:', path);
      const files = await window.electron.listLocalFiles(path);
      console.log('[Frontend] Local files loaded:', files.length);
      setLocalFiles(files);
      setLocalPath(path);
    } catch (err: any) {
      setError(`Failed to load local files: ${err.message}`);
      console.error('[Frontend] Local files error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const loadRemoteFiles = async (path: string, host?: SSHHost) => {
    const targetHost = host || selectedHost;

    console.log('[Frontend] loadRemoteFiles called with path:', path);
    console.log('[Frontend] targetHost:', targetHost);
    console.log('[Frontend] selectedHost state:', selectedHost);

    if (!targetHost) {
      console.log('[Frontend] No host available, returning');
      return;
    }

    try {
      setRemoteLoading(true);
      setError(null);
      console.log('[Frontend] Calling window.electron.listRemoteFiles with:', {
        connectionId: targetHost.id,
        path,
      });

      const files = await window.electron.listRemoteFiles({
        connectionId: targetHost.id,
        path,
      });

      console.log('[Frontend] Received files:', files);
      console.log('[Frontend] Number of files:', files.length);

      setRemoteFiles(files);
      setRemotePath(path);
      console.log('Remote files loaded:', files.length, 'files');
    } catch (err: any) {
      setError(`Failed to load remote files: ${err.message}`);
      console.error('[Frontend] Remote files error:', err);
    } finally {
      setRemoteLoading(false);
      console.log('[Frontend] Loading complete');
    }
  };

  const handleHostSelect = async (host: SSHHost) => {
    console.log('[Frontend] handleHostSelect called with host:', host);

    // Close previous SFTP connection if switching hosts
    if (selectedHost && selectedHost.id !== host.id) {
      console.log('[Frontend] Closing previous SFTP connection:', selectedHost.id);
      try {
        await window.electron.closeSFTPConnection(selectedHost.id);
      } catch (err) {
        console.error('[Frontend] Error closing previous connection:', err);
      }
    }

    setSelectedHost(host);
    // Determine home directory based on username
    const homeDir = host.username === 'root' ? '/root' : `/home/${host.username}`;
    console.log('[Frontend] Determined homeDir:', homeDir);
    setRemotePath(homeDir);
    console.log('[Frontend] Calling loadRemoteFiles with host directly...');
    await loadRemoteFiles(homeDir, host); // Pass host directly to avoid state timing issue
    console.log('[Frontend] loadRemoteFiles completed');
  };

  const handleLocalNavigate = (path: string) => {
    loadLocalFiles(path);
  };

  const handleRemoteNavigate = (path: string) => {
    loadRemoteFiles(path);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const precision = value < 10 && unitIndex > 0 ? 1 : 0;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
  };

  const getFileExtension = (name: string) => {
    const parts = name.toLowerCase().split('.');
    if (parts.length <= 1) return '';
    return parts.slice(1).join('.');
  };

  const isArchiveFile = (name: string) => {
    const ext = getFileExtension(name);
    const archiveExtensions = [
      'zip', 'tar', 'gz', 'tgz', 'bz2', 'tbz2', 'xz', 'txz', '7z', 'rar',
    ];
    return archiveExtensions.some(a => ext === a || ext.endsWith(`.${a}`));
  };

  const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 4.5C1.5 3.67 2.17 3 3 3h3l1.2 1.4h5.8c.83 0 1.5.67 1.5 1.5v6.6c0 .83-.67 1.5-1.5 1.5H3c-.83 0-1.5-.67-1.5-1.5V4.5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );

  const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.5h5.2L12.5 4.8V14c0 .83-.67 1.5-1.5 1.5H4c-.83 0-1.5-.67-1.5-1.5V3c0-.83.67-1.5 1.5-1.5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 1.5V5h3.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );

  const ArchiveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 2.5v11M8 5h3M8 8h3M8 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.8 4.2h1.4M4.8 7.2h1.4M4.8 10.2h1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  const CheckIcon = ({ visible }: { visible: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ opacity: visible ? 1 : 0 }}>
      <path d="M3 7.5l2.2 2.2L11 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <FolderIcon />;
    }
    if (isArchiveFile(file.name)) {
      return <ArchiveIcon />;
    }
    return <FileIcon />;
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(1, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remMinutes = minutes % 60;
      return `${hours}h ${remMinutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const estimateTransferTime = (sizeBytes?: number) => {
    if (!sizeBytes) return null;
    // Heuristic: assume ~8 MB/s average transfer speed
    const assumedBytesPerSecond = 8 * 1024 * 1024;
    const ms = (sizeBytes / assumedBytesPerSecond) * 1000;
    return Math.max(1000, ms);
  };

  const findFileSize = (pane: 'local' | 'remote', fileName: string) => {
    const sourceFiles = pane === 'local' ? localFiles : remoteFiles;
    const match = sourceFiles.find(f => f.name === fileName);
    return match?.size;
  };

  const startTransfer = (targetPane: 'local' | 'remote', fileName: string) => {
    const sourcePane = targetPane === 'local' ? 'remote' : 'local';
    const sizeBytes = findFileSize(sourcePane, fileName);
    setTransferProgress({
      pane: targetPane,
      fileName,
      progress: 0,
      sizeBytes,
      startedAt: Date.now(),
    });
  };

  const ArrowDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.2v8.2M3.8 7.8 7 11.2l3.2-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ArrowUpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 11.8V3.6M10.2 6.2 7 2.8 3.8 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const TRANSFER_FOOTER_HEIGHT = 78;

  const renderTransferFooter = (pane: 'local' | 'remote') => {
    const active = transferProgress && transferProgress.pane === pane;
    const directionLabel = pane === 'local' ? 'Downloading' : 'Uploading';
    const sizeLabel = active && transferProgress.sizeBytes ? formatSize(transferProgress.sizeBytes) : null;
    const etaMs = active ? estimateTransferTime(transferProgress.sizeBytes) : null;
    const etaLabel = etaMs ? formatDuration(etaMs) : 'Estimating...';

    return (
      <div style={{
        height: `${TRANSFER_FOOTER_HEIGHT}px`,
        borderTop: '1px solid #3a4556',
        background: 'linear-gradient(180deg, rgba(31, 36, 48, 0.92), rgba(26, 31, 46, 0.98))',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '8px',
        opacity: active ? 1 : 0.6,
        transition: 'opacity 0.2s ease',
      }}>
        {active ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
                color: '#c9d1d9',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                <span style={{ color: pane === 'local' ? '#4d7cfe' : '#3dd68c', display: 'flex' }}>
                  {pane === 'local' ? <ArrowDownIcon /> : <ArrowUpIcon />}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>{directionLabel}</span>
                <span style={{ color: '#e8ecf4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {transferProgress.fileName}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: '#8b949e',
                flexShrink: 0,
              }}>
                {sizeLabel && <span>{sizeLabel}</span>}
                <span>ETA ~{etaLabel}</span>
              </div>
            </div>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: '#222a3a',
              border: '1px solid #2d374a',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.45)',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-35%',
                width: '35%',
                height: '100%',
                borderRadius: '999px',
                background: pane === 'local'
                  ? 'linear-gradient(90deg, rgba(77, 124, 254, 0.15), #4d7cfe, rgba(77, 124, 254, 0.15))'
                  : 'linear-gradient(90deg, rgba(22, 130, 93, 0.15), #1ea672, rgba(22, 130, 93, 0.15))',
                boxShadow: pane === 'local'
                  ? '0 0 12px rgba(77, 124, 254, 0.45)'
                  : '0 0 12px rgba(30, 166, 114, 0.45)',
                animation: 'sftp-progress-slide 1.6s ease-in-out infinite',
              }} />
            </div>
          </>
        ) : (
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            letterSpacing: '0.2px',
          }}>
            No active transfers
          </div>
        )}
      </div>
    );
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClose = async () => {
    // Close SFTP connection when modal closes
    if (selectedHost) {
      console.log('[Frontend] Closing SFTP connection on modal close:', selectedHost.id);
      try {
        await window.electron.closeSFTPConnection(selectedHost.id);
      } catch (err) {
        console.error('[Frontend] Error closing SFTP connection:', err);
      }
    }

    setSelectedHost(null);
    setLocalPath('');
    setRemotePath('');
    setLocalFiles([]);
    setRemoteFiles([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#1a1f2e',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      opacity: modalVisible ? 1 : 0,
      transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.995)',
      transition: 'opacity 0.18s ease-out, transform 0.22s ease-out',
    }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #3a4556',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L17 7M12 2L7 7M12 2V16" stroke="#16825d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V12" stroke="#16825d" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8L17 13M12 8L7 13M12 8V22" stroke="#16825d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#e8ecf4',
            }}>
              SFTP File Transfer
            </h2>
            {selectedHost && (
              <span style={{
                fontSize: '13px',
                color: '#8892a6',
                marginLeft: '8px',
              }}>
                → {selectedHost.label}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8892a6',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#303948';
              e.currentTarget.style.color = '#e8ecf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8892a6';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Two-Pane File Browser - Always Visible */}
          <div style={{
            display: 'flex',
            height: '100%',
          }}>
              {/* Left Pane - Local Files */}
              <div style={{
                flex: 1,
                borderRight: '1px solid #3a4556',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#252d3f',
                  borderBottom: '1px solid #3a4556',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#e8ecf4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}>
                  <span>Local Machine</span>
                  <button
                    ref={localGearRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextOpen = !localContextMenu;
                      if (nextOpen) {
                        setLocalMenuPos(getSettingsMenuPosition(e.currentTarget));
                      } else {
                        setLocalMenuPos(null);
                      }
                      setLocalContextMenu(nextOpen);
                      setLocalMenuHover(null);
                      setRemoteContextMenu(false);
                      setRemoteMenuPos(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e8ecf4',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1f2430';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="8" cy="8" r="2.2" />
                      <path d="M8 1.6v1.4M8 13v1.4M1.6 8h1.4M13 8h1.4M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1" />
                      <circle cx="8" cy="8" r="5.4" strokeOpacity="0.55" />
                    </svg>
                  </button>
                  
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: '#1f2430',
                  borderBottom: '1px solid #3a4556',
                  fontSize: '11px',
                  color: '#8892a6',
                  fontFamily: 'monospace',
                }}>
                  {localPath}
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    console.log('[SFTP] Drag enter local pane');
                    setDragOverPane('local');
                  }}
                  onDragLeave={(e) => {
                    // Only clear if leaving the pane completely
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (
                      e.clientX < rect.left ||
                      e.clientX >= rect.right ||
                      e.clientY < rect.top ||
                      e.clientY >= rect.bottom
                    ) {
                      console.log('[SFTP] Drag leave local pane');
                      setDragOverPane(null);
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverPane(null);
                    const sourcePane = e.dataTransfer.getData('sourcePane');
                    const filePath = e.dataTransfer.getData('filePath');
                    const fileName = e.dataTransfer.getData('fileName');

                    console.log('[SFTP] File dropped on local pane:', { sourcePane, filePath, fileName });

                    if (sourcePane === 'remote') {
                      // Download from remote to local
                      console.log('[SFTP] Initiating download:', fileName);
                      startTransfer('local', fileName);
                      try {
                        await window.electron.downloadFile({
                          connectionId: selectedHost!.id,
                          remotePath: filePath,
                          localPath: localPath,
                          fileName,
                        });
                        console.log('[SFTP] Download complete:', fileName);
                        setTransferProgress(null);
                        // Refresh local files
                        loadLocalFiles(localPath);
                      } catch (err: any) {
                        console.error('[SFTP] Download failed:', err);
                        setError(`Download failed: ${err.message}`);
                        setTransferProgress(null);
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '8px',
                    paddingBottom: `${TRANSFER_FOOTER_HEIGHT + 16}px`,
                    position: 'relative',
                    background: dragOverPane === 'local' ? 'rgba(22, 130, 93, 0.1)' : 'transparent',
                    border: dragOverPane === 'local' ? '2px dashed #16825d' : '2px dashed transparent',
                    transition: 'all 0.2s',
                  }}>
                  {displayLocalFiles.length === 0 && !localLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8892a6' }}>
                      No files found
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '28%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #3a4556' }}>
                          {['name', 'modified', 'type', 'size'].map((col) => (
                            <th
                              key={col}
                              onClick={() => {
                                console.log('[SFTP] Local sort column clicked:', col);
                                if (localSortColumn === col) {
                                  setLocalSortDirection(localSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setLocalSortColumn(col as any);
                                  setLocalSortDirection('asc');
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#8b949e',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#252d3f';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {col.charAt(0).toUpperCase() + col.slice(1)}
                              {localSortColumn === col && (
                                <span style={{ marginLeft: '4px' }}>
                                  {localSortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayLocalFiles.map((file, index) => (
                          <tr
                            key={index}
                            draggable={file.type === 'file'}
                            onClick={() => {
                              console.log('[SFTP] Local file clicked:', file.name);
                              setSelectedLocalFile(file.path);
                            }}
                            onDoubleClick={() => {
                              console.log('[SFTP] Local file double-clicked:', file.name);
                              if (file.type === 'directory') {
                                handleLocalNavigate(file.path);
                              }
                            }}
                            onDragStart={(e) => {
                              console.log('[SFTP] Drag started - local file:', file.name);
                              e.dataTransfer.setData('sourcePane', 'local');
                              e.dataTransfer.setData('filePath', file.path);
                              e.dataTransfer.setData('fileName', file.name);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            style={{
                              cursor: 'pointer',
                              background: selectedLocalFile === file.path ? '#1e3a5f' : 'transparent',
                              transition: 'background 0.15s',
                              opacity: isHiddenFile(file.name) ? 0.5 : 1,
                              filter: isHiddenFile(file.name) ? 'grayscale(50%)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedLocalFile !== file.path) {
                                e.currentTarget.style.background = '#252d3f';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedLocalFile !== file.path) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <td style={{ padding: '8px 12px', fontSize: '13px', color: '#e8ecf4' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <span style={{
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: file.type === 'directory'
                                    ? '#4d7cfe'
                                    : isArchiveFile(file.name)
                                      ? '#f59e0b'
                                      : '#b4bcc9',
                                }}>
                                  {getFileIcon(file)}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {formatDate(file.modifiedTime)}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.type === 'directory' ? 'Folder' : 'File'}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.type === 'file' ? formatSize(file.size) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Loading Overlay for Local Pane */}
                  {localLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
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
                        border: '3px solid rgba(58, 69, 86, 0.3)',
                        borderTop: '3px solid #16825d',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    </div>
                  )}

                  <div style={{ position: 'sticky', bottom: 0, paddingTop: '8px', zIndex: 15 }}>
                    {renderTransferFooter('local')}
                  </div>
                  </div>
              </div>

              {/* Right Pane - Remote Files */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#252d3f',
                  borderBottom: '1px solid #3a4556',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#e8ecf4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}>
                  <span>Remote Machine{selectedHost && ` (${selectedHost.username}@${selectedHost.host})`}</span>
                  {selectedHost && (
                    <button
                        ref={remoteGearRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextOpen = !remoteContextMenu;
                          if (nextOpen) {
                            setRemoteMenuPos(getSettingsMenuPosition(e.currentTarget));
                          } else {
                            setRemoteMenuPos(null);
                          }
                          setRemoteContextMenu(nextOpen);
                          setRemoteMenuHover(null);
                          setLocalContextMenu(false);
                          setLocalMenuPos(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#e8ecf4',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1f2430';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="8" cy="8" r="2.2" />
                          <path d="M8 1.6v1.4M8 13v1.4M1.6 8h1.4M13 8h1.4M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1" />
                          <circle cx="8" cy="8" r="5.4" strokeOpacity="0.55" />
                        </svg>
                      </button>
                  )}
                </div>

                {/* Search bar when no host selected, path when host selected */}
                {!selectedHost ? (
                  <div style={{
                    padding: '12px 16px',
                    background: '#1f2430',
                    borderBottom: '1px solid #3a4556',
                  }}>
                    <input
                      type="text"
                      placeholder="Search hosts..."
                      value={hostSearchQuery}
                      onChange={(e) => setHostSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#252d3f',
                        border: '1px solid #3a4556',
                        borderRadius: '6px',
                        color: '#e8ecf4',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#16825d';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#3a4556';
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 16px',
                    background: '#1f2430',
                    borderBottom: '1px solid #3a4556',
                    fontSize: '11px',
                    color: '#c9d1d9',
                    fontFamily: 'monospace',
                  }}>
                    {remotePath}
                  </div>
                )}

                {/* Remote Pane Content: Host Selection or File Browser */}
                {!selectedHost ? (
                  /* Show host cards when no host selected */
                  <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '16px',
                  }}>
                    {filteredHosts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#c9d1d9' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                          {hostSearchQuery ? 'No hosts found matching your search' : 'No hosts available'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>
                          {hostSearchQuery ? 'Try a different search term' : 'Create a connection from the Design tab'}
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
                              background: host.hasSSH ? '#252d3f' : '#1f2430',
                              border: '1px solid #3a4556',
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
                                e.currentTarget.style.background = '#2a3347';
                                e.currentTarget.style.borderColor = '#16825d';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = host.hasSSH ? '#252d3f' : '#1f2430';
                              e.currentTarget.style.borderColor = '#3a4556';
                            }}
                          >
                            <div style={{ fontSize: '32px' }}>{getOSIcon(host)}</div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: host.hasSSH ? '#e8ecf4' : '#8b949e',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                            }}>
                              {host.label}
                            </div>
                            {!host.hasSSH && (
                              <div style={{
                                fontSize: '10px',
                                color: '#8b949e',
                                fontStyle: 'italic',
                              }}>
                                SSH not available
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show file browser when host selected */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      console.log('[SFTP] Drag enter remote pane');
                      setDragOverPane('remote');
                    }}
                    onDragLeave={(e) => {
                      // Only clear if leaving the pane completely
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (
                        e.clientX < rect.left ||
                        e.clientX >= rect.right ||
                        e.clientY < rect.top ||
                        e.clientY >= rect.bottom
                      ) {
                        console.log('[SFTP] Drag leave remote pane');
                        setDragOverPane(null);
                      }
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverPane(null);
                      const sourcePane = e.dataTransfer.getData('sourcePane');
                      const filePath = e.dataTransfer.getData('filePath');
                      const fileName = e.dataTransfer.getData('fileName');

                      console.log('[SFTP] File dropped on remote pane:', { sourcePane, filePath, fileName });

                      if (sourcePane === 'local') {
                        // Upload from local to remote
                        console.log('[SFTP] Initiating upload:', fileName);
                        startTransfer('remote', fileName);
                        try {
                          await window.electron.uploadFile({
                            connectionId: selectedHost!.id,
                            localPath: filePath,
                            remotePath: remotePath,
                            fileName,
                          });
                          console.log('[SFTP] Upload complete:', fileName);
                          setTransferProgress(null);
                          // Refresh remote files
                          loadRemoteFiles(remotePath);
                        } catch (err: any) {
                          console.error('[SFTP] Upload failed:', err);
                          setError(`Upload failed: ${err.message}`);
                          setTransferProgress(null);
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      overflow: 'auto',
                      padding: '8px',
                      paddingBottom: `${TRANSFER_FOOTER_HEIGHT + 16}px`,
                      position: 'relative',
                      background: dragOverPane === 'remote' ? 'rgba(22, 130, 93, 0.1)' : 'transparent',
                      border: dragOverPane === 'remote' ? '2px dashed #16825d' : '2px dashed transparent',
                      transition: 'all 0.2s',
                    }}>
                    {displayRemoteFiles.length === 0 && !remoteLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8892a6' }}>
                      <div style={{ marginBottom: '12px' }}>📂</div>
                      {error ? 'Failed to load files' : 'No files found'}
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '28%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #3a4556' }}>
                          {['name', 'modified', 'type', 'size'].map((col) => (
                            <th
                              key={col}
                              onClick={() => {
                                console.log('[SFTP] Remote sort column clicked:', col);
                                if (remoteSortColumn === col) {
                                  setRemoteSortDirection(remoteSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setRemoteSortColumn(col as any);
                                  setRemoteSortDirection('asc');
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#8b949e',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#252d3f';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {col.charAt(0).toUpperCase() + col.slice(1)}
                              {remoteSortColumn === col && (
                                <span style={{ marginLeft: '4px' }}>
                                  {remoteSortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayRemoteFiles.map((file, index) => (
                          <tr
                            key={index}
                            draggable={file.type === 'file'}
                            onClick={() => {
                              console.log('[SFTP] Remote file clicked:', file.name);
                              setSelectedRemoteFile(file.path);
                            }}
                            onDoubleClick={() => {
                              console.log('[SFTP] Remote file double-clicked:', file.name);
                              if (file.type === 'directory') {
                                handleRemoteNavigate(file.path);
                              }
                            }}
                            onDragStart={(e) => {
                              console.log('[SFTP] Drag started - remote file:', file.name);
                              e.dataTransfer.setData('sourcePane', 'remote');
                              e.dataTransfer.setData('filePath', file.path);
                              e.dataTransfer.setData('fileName', file.name);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            style={{
                              cursor: 'pointer',
                              background: selectedRemoteFile === file.path ? '#1e3a5f' : 'transparent',
                              transition: 'background 0.15s',
                              opacity: isHiddenFile(file.name) ? 0.5 : 1,
                              filter: isHiddenFile(file.name) ? 'grayscale(50%)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedRemoteFile !== file.path) {
                                e.currentTarget.style.background = '#252d3f';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedRemoteFile !== file.path) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <td style={{ padding: '8px 12px', fontSize: '13px', color: '#e8ecf4' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <span style={{
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: file.type === 'directory'
                                    ? '#4d7cfe'
                                    : isArchiveFile(file.name)
                                      ? '#f59e0b'
                                      : '#b4bcc9',
                                }}>
                                  {getFileIcon(file)}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {formatDate(file.modifiedTime)}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.type === 'directory' ? 'Folder' : 'File'}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8892a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.type === 'file' ? formatSize(file.size) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Loading Overlay for Remote Pane */}
                  {remoteLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(26, 31, 46, 0.85)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid rgba(58, 69, 86, 0.2)',
                        borderTop: '4px solid #4d7cfe',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        boxShadow: '0 0 25px rgba(77, 124, 254, 0.6), 0 0 50px rgba(77, 124, 254, 0.3), inset 0 0 10px rgba(77, 124, 254, 0.2)',
                      }} />
                    </div>
                  )}

                  <div style={{ position: 'sticky', bottom: 0, paddingTop: '8px', zIndex: 15 }}>
                    {renderTransferFooter('remote')}
                  </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {localContextMenu && localMenuPos && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
              }}
              onClick={closeLocalMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeLocalMenu();
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: localMenuPos.y,
                left: localMenuPos.x,
                width: `${SETTINGS_MENU_WIDTH}px`,
                padding: '4px',
                zIndex: 1201,
                pointerEvents: 'auto',
                ...getMenuContainerStyle(localMenuVisible),
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLocalHidden(!showLocalHidden);
                  closeLocalMenu();
                }}
                onMouseEnter={() => setLocalMenuHover(0)}
                onMouseLeave={() => setLocalMenuHover(null)}
                style={getMenuItemStyle(localMenuHover === 0)}
              >
                <span style={{ width: '18px', display: 'flex', justifyContent: 'center' }}>
                  <CheckIcon visible={showLocalHidden} />
                </span>
                Show Hidden Files
              </button>
            </div>
          </>
        )}

        {remoteContextMenu && remoteMenuPos && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
              }}
              onClick={closeRemoteMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeRemoteMenu();
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: remoteMenuPos.y,
                left: remoteMenuPos.x,
                width: `${SETTINGS_MENU_WIDTH}px`,
                padding: '4px',
                zIndex: 1201,
                pointerEvents: 'auto',
                ...getMenuContainerStyle(remoteMenuVisible),
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRemoteHidden(!showRemoteHidden);
                  closeRemoteMenu();
                }}
                onMouseEnter={() => setRemoteMenuHover(0)}
                onMouseLeave={() => setRemoteMenuHover(null)}
                style={getMenuItemStyle(remoteMenuHover === 0)}
              >
                <span style={{ width: '18px', display: 'flex', justifyContent: 'center' }}>
                  <CheckIcon visible={showRemoteHidden} />
                </span>
                Show Hidden Files
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes sftp-progress-slide {
            0% { transform: translateX(-120%); }
            60% { transform: translateX(220%); }
            100% { transform: translateX(220%); }
          }
        `}</style>

        {/* Error Toast */}
        {error && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ff5c5c',
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
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ×
            </button>
          </div>
        )}
    </div>
  );
};

export default SFTPModal;
