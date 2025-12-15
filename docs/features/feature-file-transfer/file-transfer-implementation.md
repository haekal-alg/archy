# File Transfer Feature Implementation Plan for Archy (SIMPLIFIED)

## Overview
Add simple SFTP file transfer capabilities for uploading files to and downloading files from SSH-connected devices. Focus on essential functionality: local ↔ SSH transfers only.

## User Requirements
- **Operations**: Upload files (local → SSH), Download files (SSH → local)
- **Trigger**: Right-click context menu on connection card
- **Download UI**: File browser modal with directory navigation
- **Progress**: Dedicated transfers panel with real-time tracking
- **Scope**: LOCAL ↔ SSH ONLY (no SSH-to-SSH)

## User Flow

### Upload Flow:
1. User right-clicks connection card in sidebar
2. Clicks "Upload Files..." in context menu
3. Native file picker opens (can select multiple files/folders)
4. User selects files and confirms
5. Files upload to remote home directory (~/)
6. Progress appears in transfers panel at bottom
7. Toast notification on completion

### Download Flow:
1. User right-clicks connection card in sidebar
2. Clicks "Browse & Download..." in context menu
3. File browser modal opens showing remote filesystem
4. User navigates directories (breadcrumb, double-click)
5. User selects files via checkboxes
6. User clicks "Download Selected"
7. Native directory picker opens for download location
8. Files download to selected location
9. Progress appears in transfers panel
10. Toast notification on completion

## Architecture Approach

### Core Strategy
- **SFTP Integration**: Leverage ssh2's built-in SFTP support, reusing existing SSH connections
- **Session Management**: Create SFTP client on-demand from active SSH sessions
- **IPC Pattern**: Follow existing patterns (invoke for operations, send for progress events)
- **UI Integration**:
  - Context menu on connection cards for Upload/Browse actions
  - File browser as modal dialog (not side panel)
  - Transfers panel at bottom of ConnectionsTab

## Implementation Plan

### Phase 1: Core SFTP Infrastructure (Main Process)

#### File: `src/main/main.ts`

**1. Extend SSHSession Interface** (line 28-34)
```typescript
interface SSHSession {
  client: Client;
  stream: ClientChannel;
  connectionId: string;
  latency?: number;
  lastPingTime?: number;
  sftpClient?: SFTPWrapper; // Add SFTP wrapper
}
```

**2. Add SFTP IPC Handlers** (after line 468)

New handlers needed:
- `sftp-init` - Initialize SFTP session (lazy, reuses SSH connection)
- `sftp-list-dir` - List directory contents with file metadata
- `sftp-upload` - Upload single file with progress events
- `sftp-upload-dir` - Recursive directory upload
- `sftp-download` - Download file with progress events (using fastGet)
- `sftp-cancel-transfer` - Cancel active transfer

**Key Implementation Details**:
- Progress events throttled to 100ms intervals
- Store active transfers in Map for cancellation support
- Use stream piping for uploads, fastGet for downloads
- Recursive directory traversal with mkdir error handling (code 4 = exists)

**3. Update Cleanup Logic** (line 410-417)
- Dispose SFTP client when SSH session closes
- Clean up active transfer streams

#### File: `src/main/preload.ts`

**4. Extend IPC Bridge**

Add to ElectronAPI:
```typescript
sftpInit: (connectionId: string) => Promise<{ success: boolean }>;
sftpListDir: (connectionId: string, path: string) => Promise<{ files: RemoteFile[] }>;
sftpUpload: (connectionId: string, localPath: string, remotePath: string, transferId: string) => Promise<void>;
sftpDownload: (connectionId: string, remotePath: string, localPath: string, transferId: string) => Promise<void>;
onSftpProgress: (callback: (data: ProgressData) => void) => () => void;
```

### Phase 2: Type Definitions

#### File: `src/renderer/types/terminal.ts` (or new `transfer.ts`)

**5. Add Transfer Data Structures**

```typescript
interface RemoteFile {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  permissions: string;
  modifiedTime: Date;
}

interface FileTransfer {
  id: string;
  type: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  fileName: string;
  fileSize: number;
  bytesTransferred: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'error' | 'cancelled';
  speed: number; // bytes per second
  startTime: Date;
  endTime?: Date;
  error?: string;
  connectionId: string;
}

interface TransferContextType {
  transfers: FileTransfer[];
  addTransfer: (transfer: Omit<FileTransfer, 'id'>) => string;
  updateTransferProgress: (id: string, progress: Partial<FileTransfer>) => void;
  cancelTransfer: (id: string) => void;
  retryTransfer: (id: string) => void;
  removeTransfer: (id: string) => void;
  clearCompleted: () => void;
}
```

### Phase 3: Transfer State Management

#### File: `src/renderer/contexts/TransferContext.tsx` (NEW)

**6. Create Transfer Context**

Responsibilities:
- Manage transfer queue with concurrent execution (max 3 simultaneous)
- Listen to progress events from main process
- Calculate transfer speed using sliding window (last 10 samples)
- Persist transfer history to electron-store (last 50 per connection)
- Provide transfer CRUD operations

**Key Implementation**:
```typescript
class TransferSpeedCalculator {
  private samples: Array<{ bytes: number; time: number }> = [];
  // Calculate speed from sliding window
  // Provide ETA calculation
}

class TransferQueue {
  private maxConcurrent = 3;
  // Process pending transfers when slot available
  // Handle pause/cancel/retry
}
```

### Phase 4: File Browser Modal Component

#### File: `src/renderer/components/FileBrowserModal.tsx` (NEW)

**7. Create File Browser Modal Component**

**UI Structure** (Modal overlay, centered):
```
┌─────────────────────────────────────────┐
│ Browse Files: server-name        [✕]    │
├─────────────────────────────────────────┤
│ [📁] /home/user              [⟳]       │  ← Breadcrumb + Refresh
├─────────────────────────────────────────┤
│ ☐ [📁] Documents         →              │
│ ☑ [📄] config.txt        4.2 KB         │  ← Selectable files
│ ☑ [📄] script.sh         1.8 KB         │
│   ...                                    │
├─────────────────────────────────────────┤
│ [Download Selected]            [Cancel] │
└─────────────────────────────────────────┘
```

**Features**:
- Modal dialog (600px width, 500px height)
- Breadcrumb navigation (clickable path segments)
- Double-click directories to navigate
- Multi-select with checkboxes
- Sort by name/size/modified
- File type icons with colors
- "Download Selected" button: Opens directory picker, downloads files
- "Cancel" button: Close modal

**Props**:
```typescript
interface FileBrowserModalProps {
  connectionId: string;
  connectionName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Styling**: Modal pattern like EditNodeModal
- Backdrop: rgba(0,0,0,0.5)
- Container: Glassmorphism effect
- Z-index: 1000

### Phase 5: Transfers Panel Component

#### File: `src/renderer/components/TransfersPanel.tsx` (NEW)

**8. Create Transfers Panel**

**UI Structure**:
```
┌─────────────────────────────────────────────┐
│ Transfers (2 active, 3 completed) [Clear] ▼ │
├─────────────────────────────────────────────┤
│ ⬆ config.txt → /home/user/                 │
│   [████████░░] 65% • 1.2 MB/s • 2s left    │
│   [⏸ Pause] [✕ Cancel]                     │
├─────────────────────────────────────────────┤
│ ⬇ backup.tar.gz ← /var/backups/            │
│   [██████████] 100% • Completed            │
└─────────────────────────────────────────────┘
```

**Features**:
- Real-time progress bars (0-100%)
- Speed display: KB/s or MB/s
- ETA calculation based on current speed
- Status icons: ⬆ (upload), ⬇ (download), ✓ (complete), ✕ (error)
- Actions per item: Pause/Resume, Cancel, Retry, Remove
- Header actions: Clear All completed/failed
- Collapsible: 120px collapsed, 300px expanded

**Display Logic**:
- Show active transfers first
- Show last 10 completed transfers
- Auto-expand when new transfer starts
- Toast notification on completion/error

**Positioning**: Bottom of ConnectionsTab, fixed height

### Phase 6: UI Integration

#### A. Add Context Menu to Connection Cards

**File**: `src/renderer/components/ConnectionsTab.tsx`

**9. Add Right-Click Menu to Connections**

Add context menu handler to connection cards (around line 400-500 where connection cards are rendered):

```typescript
const [contextMenu, setContextMenu] = useState<{
  x: number;
  y: number;
  connectionId: string;
} | null>(null);

// On connection card:
onContextMenu={(e) => {
  e.preventDefault();
  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    connectionId: connection.id,
  });
}}
```

**New Context Menu Component** (or extend existing ConnectionContextMenu):
- "Upload Files..." → Opens native file picker
- "Browse & Download..." → Opens FileBrowserModal
- Separator
- Existing options (Retry, Disconnect, Remove)

#### B. Integrate Transfers Panel

**File**: `src/renderer/components/ConnectionsTab.tsx`

**10. Add Transfers Panel at Bottom** (after line 638)

**Layout**:
```
┌───────────┬─────────────┐
│ Sidebar   │  Terminal   │
│ (320px)   │             │
└───────────┴─────────────┘
            │ Transfers   │
            │ (120-300px) │
            └─────────────┘
```

- Fixed positioning at bottom
- Full width
- Collapsible header

**State**:
```typescript
const [transfersPanelCollapsed, setTransfersPanelCollapsed] = useState(true);
```

#### File: `src/renderer/App.tsx`

**10. Add Context Provider** (around line 54)

```typescript
<TransferProvider>
  <TabProvider>
    {/* Existing app structure */}
  </TabProvider>
</TransferProvider>
```

### Phase 7: Utilities and Helpers

**11. Create Utility Functions**

```typescript
// Format functions
formatSpeed(bytesPerSecond: number): string
formatETA(seconds: number): string
formatFileSize(bytes: number): string
formatLastActivity(date: Date): string

// Transfer ID generation
generateTransferId(): string // 'upload-{timestamp}-{random}'

// Path utilities
joinPath(parts: string[]): string
getBasename(path: string): string
getParentPath(path: string): string
```

## Critical Files Summary

**Files to Create** (6 new files):
1. `src/renderer/contexts/TransferContext.tsx` - Transfer state management
2. `src/renderer/components/FileBrowserModal.tsx` - File browser modal (download)
3. `src/renderer/components/TransfersPanel.tsx` - Transfers panel UI
4. `src/renderer/types/transfer.ts` - Type definitions
5. `src/renderer/utils/formatters.ts` - Utility functions (formatSpeed, formatFileSize, formatETA)
6. `src/renderer/utils/transferHelpers.tsx` - Queue and speed calculator logic

**Files to Modify** (5 existing files):
1. `src/main/main.ts` - Add SFTP IPC handlers, extend SSHSession
2. `src/main/preload.ts` - Expose SFTP methods to renderer
3. `src/renderer/components/ConnectionsTab.tsx` - Add context menu, integrate TransfersPanel
4. `src/renderer/App.tsx` - Add TransferProvider wrapper
5. `src/renderer/components/ConnectionContextMenu.tsx` - Add Upload/Browse options

## Implementation Sequence (Simplified)

### Phase 1: Backend (Days 1-2)
1. Extend SSHSession interface with sftpClient
2. Add SFTP IPC handlers (init, list-dir, upload, download, cancel)
3. Extend preload.ts IPC bridge
4. Test SFTP connection and basic operations

### Phase 2: Types & Utilities (Day 3)
5. Create transfer type definitions
6. Create utility functions (formatters, queue, speed calculator)

### Phase 3: State Management (Day 4)
7. Create TransferContext
8. Set up progress event listeners
9. Implement transfer queue logic

### Phase 4: UI Components (Days 5-6)
10. Create FileBrowserModal component
11. Create TransfersPanel component
12. Style with glassmorphism theme

### Phase 5: Integration (Days 7-8)
13. Add context menu to connection cards
14. Integrate TransfersPanel into ConnectionsTab
15. Add TransferProvider to App.tsx
16. Wire up upload/download triggers

### Phase 6: Testing (Day 9)
17. Test single/multiple file uploads
18. Test file downloads with navigation
19. Test concurrent transfers and cancellation
20. Test error scenarios (permissions, network, disk full)

## Key Design Decisions

1. **Reuse SSH Connections**: SFTP clients piggyback on existing SSH sessions (efficient, no re-auth)
2. **Progress Throttling**: Update UI every 100ms to prevent render thrashing
3. **Concurrent Transfers**: Max 3 simultaneous transfers (configurable)
4. **History Persistence**: Last 50 transfers per connection in electron-store
5. **Cancel Support**: Store active streams in Map for immediate cancellation
6. **Speed Calculation**: Sliding window average over last 10 samples (smooth, responsive)

## Testing Checklist

- [ ] Single file upload (<1MB, 10-100MB, >500MB)
- [ ] Multiple files upload (10, 50, 100+ files)
- [ ] Recursive directory upload (nested 3+ levels)
- [ ] Single file download
- [ ] Multiple files download with directory structure preservation
- [ ] Cancel transfer mid-operation
- [ ] Retry failed transfer
- [ ] Concurrent transfers (3 simultaneous)
- [ ] Error scenarios: permission denied, disk full, network loss
- [ ] UI responsiveness during large transfers
- [ ] Transfer history persistence across app restarts
- [ ] Connection removal while transfer active (cleanup)

## Future Enhancements (Not in Initial Implementation)

1. **Resume Capability**: Resume interrupted downloads
   - Track byte offsets
   - Use `fastGet` with `start` option

2. **Drag-and-Drop Upload**: Drag files from OS
   - Add drop zone in terminal or file browser
   - Extract file paths from drop event

3. **File Preview**: Quick preview for text/image files
   - Modal with syntax highlighting
   - Image viewer for common formats

4. **Edit Remote Files**: Open remote text files in local editor
   - Download to temp, watch for changes, upload on save

5. **Permissions Management**: Change file permissions
   - Right-click file → "Change Permissions"
   - Modal with chmod interface (rwx checkboxes)

## Notes

- All components follow existing Archy design patterns (glassmorphism, theme tokens, animations)
- SFTP operations are non-blocking (async/await with promises)
- Error messages surfaced via toast notifications
- Progress updates optimized to prevent UI lag
- File paths normalized for cross-platform compatibility
- SSH key authentication supported (already in SSH implementation)
