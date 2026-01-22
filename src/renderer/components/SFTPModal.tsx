import React, { useState, useEffect } from 'react';
import { useTabContext } from '../contexts/TabContext';
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
  const [transferProgress, setTransferProgress] = useState<{ pane: 'local' | 'remote'; fileName: string; progress: number } | null>(null);
  const [showLocalHidden, setShowLocalHidden] = useState(false);
  const [showRemoteHidden, setShowRemoteHidden] = useState(false);
  const [localContextMenu, setLocalContextMenu] = useState(false);
  const [remoteContextMenu, setRemoteContextMenu] = useState(false);
  const [localSortColumn, setLocalSortColumn] = useState<'name' | 'modified' | 'type' | 'size'>('name');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [remoteSortColumn, setRemoteSortColumn] = useState<'name' | 'modified' | 'type' | 'size'>('name');
  const [remoteSortDirection, setRemoteSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hostSearchQuery, setHostSearchQuery] = useState('');

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
    };
    if (localContextMenu || remoteContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [localContextMenu, remoteContextMenu]);

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

  // Helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
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
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[SFTP] Local gear clicked');
                      setLocalContextMenu(!localContextMenu);
                      setRemoteContextMenu(false);
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v3m0 16v3m9-9h-3m-16 0H1M19.071 4.929l-2.121 2.121M7.05 16.95l-2.121 2.121M19.071 19.071l-2.121-2.121M7.05 7.05L4.929 4.929"/>
                    </svg>
                  </button>
                  {localContextMenu && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '8px',
                      background: '#1f2430',
                      border: '1px solid #3a4556',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      zIndex: 1000,
                      minWidth: '180px',
                      marginTop: '4px',
                    }}>
                      <button
                        onClick={() => {
                          console.log('[SFTP] Toggle local hidden files:', !showLocalHidden);
                          setShowLocalHidden(!showLocalHidden);
                          setLocalContextMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'transparent',
                          border: 'none',
                          color: '#e8ecf4',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#252d3f';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ width: '16px' }}>{showLocalHidden ? '✓' : ''}</span>
                        <span>Show Hidden Files</span>
                      </button>
                    </div>
                  )}
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
                      setTransferProgress({ pane: 'local', fileName, progress: 0 });
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
                                <span style={{ flexShrink: 0 }}>{file.type === 'directory' ? '📁' : '📄'}</span>
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
                      <style>{`
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                    </div>
                  )}

                  {/* Transfer Progress for Local Pane */}
                  {transferProgress && transferProgress.pane === 'local' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      background: 'rgba(26, 31, 46, 0.95)',
                      border: '1px solid #3a4556',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      zIndex: 20,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#8892a6',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span>⬇️</span>
                        <span>Downloading: {transferProgress.fileName}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#252d3f',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #16825d, #1ea672)',
                          animation: 'progress 1.5s ease-in-out infinite',
                        }} />
                      </div>
                      <style>{`
                        @keyframes progress {
                          0% { transform: translateX(-100%); }
                          100% { transform: translateX(100%); }
                        }
                      `}</style>
                    </div>
                  )}
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
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[SFTP] Remote gear clicked');
                          setRemoteContextMenu(!remoteContextMenu);
                          setLocalContextMenu(false);
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v3m0 16v3m9-9h-3m-16 0H1M19.071 4.929l-2.121 2.121M7.05 16.95l-2.121 2.121M19.071 19.071l-2.121-2.121M7.05 7.05L4.929 4.929"/>
                        </svg>
                      </button>
                      {remoteContextMenu && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '8px',
                          background: '#1f2430',
                          border: '1px solid #3a4556',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          zIndex: 1000,
                          minWidth: '180px',
                          marginTop: '4px',
                        }}>
                          <button
                            onClick={() => {
                              console.log('[SFTP] Toggle remote hidden files:', !showRemoteHidden);
                              setShowRemoteHidden(!showRemoteHidden);
                              setRemoteContextMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: 'transparent',
                              border: 'none',
                              color: '#e8ecf4',
                              fontSize: '13px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#252d3f';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <span style={{ width: '16px' }}>{showRemoteHidden ? '✓' : ''}</span>
                            <span>Show Hidden Files</span>
                          </button>
                        </div>
                      )}
                    </>
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
                        setTransferProgress({ pane: 'remote', fileName, progress: 0 });
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
                                <span style={{ flexShrink: 0 }}>{file.type === 'directory' ? '📁' : '📄'}</span>
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

                  {/* Transfer Progress for Remote Pane */}
                  {transferProgress && transferProgress.pane === 'remote' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      background: 'rgba(26, 31, 46, 0.95)',
                      border: '1px solid #3a4556',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      zIndex: 20,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#8892a6',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span>⬆️</span>
                        <span>Uploading: {transferProgress.fileName}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#252d3f',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #16825d, #1ea672)',
                          animation: 'progress 1.5s ease-in-out infinite',
                        }} />
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
        </div>

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
