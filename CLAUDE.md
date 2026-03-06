# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

**Archy** is an Electron-based desktop application combining network topology visualization (using React Flow) with integrated remote access management. It allows users to create visual network diagrams and connect directly to devices via RDP/SSH with embedded credentials.

**Security Context**: This tool is designed for isolated lab networks and security research environments. Credentials are stored in plain text locally using electron-store. Not intended for production infrastructure.

## Build & Development Commands

### Building the Application
```bash
# Build all components (main process, preload script, and renderer)
npm run build

# Build individual components
npm run build:main      # TypeScript compilation for main process
npm run build:preload   # TypeScript compilation for preload script
npm run build:renderer  # Webpack build for React renderer

# Start the application
npm start

# Development mode with webpack-dev-server
npm run dev

# Create distributable package
npm run package
```

### TypeScript Compilation
The project uses separate TypeScript compilation for main/preload (via tsc) and webpack for the renderer. When modifying TypeScript files:
- Main process (`src/main/main.ts`): Run `npm run build:main`
- Preload script (`src/main/preload.ts`): Run `npm run build:preload`
- Renderer components: Run `npm run build:renderer`

### Development Environment
- Development mode loads from `http://localhost:8080` with webpack-dev-server
- Production mode loads from `dist/index.html`
- DevTools automatically open in development mode

## Architecture

### Electron Process Model

**Main Process** (`src/main/main.ts`):
- Frameless BrowserWindow (`frame: false`) with custom title bar
- Handles all IPC communication via `ipcMain`
- Controls native system integrations (RDP via cmdkey/mstsc, SSH via ssh2)
- Delegates SSH sessions to `ssh-session.ts`, buffering to `buffer-manager.ts`
- Native menu (`menu-system.ts`) remains set for keyboard accelerator registration (hidden behind frameless window)
- Window control IPC handlers (minimize, maximize, close, zoom, reload, devtools)
- Uses electron-store for persistent data storage
- Icon loading from disk via `icon-manager.ts`
- Settings persistence via `get-settings`/`save-settings` IPC handlers
- CWD tracking for local terminals via `cwd-tracker.ts`

**Preload Script** (`src/main/preload.ts`):
- Creates secure IPC bridge using `contextBridge.exposeInMainWorld`
- Exposes `window.electron` API to renderer process
- Provides type-safe methods for SSH operations, SFTP operations, file dialogs, clipboard, menu events, settings, icon loading, and window controls

**Renderer Process** (`src/renderer/`):
- React application using React Flow for diagram visualization
- Custom title bar (`TitleBar.tsx`) with File/Edit/View menus and window controls
- Tab-based UI with Design and Connections tabs
- Context-based state management (TabContext, SettingsContext)
- Component-based architecture with hooks pattern (useConfirm, useToast)

### SSH Session Architecture

The application implements a sophisticated SSH session management system with performance optimizations:

**Main Process** (`src/main/ssh-session.ts`, `src/main/buffer-manager.ts`):
- **Session Storage**: Active SSH sessions stored in `Map<string, SSHSession>`
- **Flow Control** (`buffer-manager.ts`): Implements backpressure mechanism to prevent overwhelming renderer
  - `MAX_QUEUED_BYTES = 65536` (64KB) - pause threshold
  - `RESUME_THRESHOLD_BYTES = 32768` (32KB) - resume threshold
  - Tracks `queuedBytes` per session and pauses/resumes streams accordingly
- **Data Buffering** (`buffer-manager.ts`): Reduces IPC overhead by batching terminal data
  - `BUFFER_TIME_MS = 4ms` - minimum latency mode for responsive input
  - `BUFFER_SIZE_BYTES = 8192` (8KB) - force flush threshold
  - `MIN_FLUSH_INTERVAL_MS = 8ms` - prevents excessive flushing
- **Latency Monitoring**: Periodic ping/pong mechanism to measure SSH latency
- **IPC Events**:
  - `ssh-data`: Batched terminal output to renderer
  - `ssh-closed`: Connection termination notification
  - `ssh-latency`: Real-time latency updates
  - `ssh-data-consumed`: Flow control feedback from renderer

**Renderer Process**:
- **Terminal Emulator** (`src/renderer/components/TerminalEmulator.tsx`):
  - Uses xterm.js with WebGL rendering for 60fps performance
  - Terminal instances persisted globally to survive React re-renders
  - Implements flow control by reporting consumed bytes back to main process
  - Performance optimizations:
    - Cursor blink disabled
    - 10,000 line scrollback limit
    - Fast scroll with Shift key modifier
    - WebGL renderer with power preference
- **TabContext** (`src/renderer/contexts/TabContext.tsx`):
  - Manages connection lifecycle (connecting → connected → disconnected/error)
  - Stores connection metadata (host, port, username, latency, zoom level)
  - Provides retry functionality preserving credentials

### Custom Icon System

The application uses a file-based SVG icon system for device nodes:

**Icon Storage** (`icons/` directory):
- `categories.json` - Defines icon categories (Devices, Network, Infra, Security) and metadata
- 13+ SVG icon files: attacker, cloud, cloud2, database, desktop, firewall, generic, laptop, linux, mobile, router, server, switch

**Icon Loading Pipeline**:
- `src/main/icon-manager.ts` - Loads SVG files from disk, registers `load-icons` IPC handler
- `src/renderer/iconStore.ts` - Client-side icon caching, category mapping, and `onIconsLoaded` callbacks
- `NetworkIcons.tsx` - `DynamicIcon` component renders SVGs with auto-resize and drop-shadow; falls back to built-in detailed icons (RouterIcon, ServerIcon, etc.)

### Settings System

**SettingsContext** (`src/renderer/contexts/SettingsContext.tsx`):
- App-wide settings management with `useSettingsContext` hook
- Persisted via `get-settings`/`save-settings` IPC handlers

**Settings Types** (`src/renderer/types/settings.ts`):
- `AppSettings`, `TerminalSettings`, `ShellType` ('cmd' | 'wsl' | 'powershell')
- Per-shell working directory configuration (`shellCwd` record)

**SettingsModal** (`src/renderer/components/SettingsModal.tsx`):
- Terminal shell configuration (CMD/WSL/PowerShell) with directory picker
- Keyboard shortcuts reference
- Focus trap and keyboard navigation

### SFTP File Transfer

**Main Process** (`src/main/sftp-manager.ts`):
- Full SFTP operations: list, upload, download, delete, rename, mkdir
- Transfer progress events via `onSFTPProgress`
- Local file operations: delete, rename, mkdir

**Renderer**:
- `SFTPModal.tsx` - Dual-pane file browser modal
- `src/renderer/components/sftp/` - Subcomponents:
  - `FilePane.tsx` - File browser pane
  - `EditablePathBar.tsx` - Editable path navigation
  - `FileContextMenu.tsx` - File operation context menu
  - `TransferFooter.tsx` - Transfer progress display
  - `SFTPIcons.tsx` - SFTP-specific icons
  - `ConfirmDialog.tsx` - SFTP-specific confirmation dialog
  - `sftpReducer.ts` - State management reducer for SFTP operations

### Local Terminal CWD Tracking

**CWD Detection** (`src/main/cwd-tracker.ts`, `src/main/shell-utils.ts`):
- Output-based prompt pattern detection (primary strategy)
- On-demand OS-level query via `/proc` or `lsof` (fallback)
- Input-based command parsing (last resort)
- Shell-specific prompt patterns with ANSI escape stripping

### React Flow Integration

**Node Types**:
- `device`: Basic device nodes (legacy)
- `enhanced`: Feature-rich device nodes with connection credentials and custom SVG icons (EnhancedDeviceNode)
- `group`: Zone/container nodes for network segmentation (GroupNode)
- `text`: Annotation nodes (TextNode)

**Custom Components**:
- `TitleBar.tsx`: Custom frameless title bar with File/Edit/View menus and window controls
- `CustomEdge.tsx`: Configurable network connections with line styles, colors, and arrow types
- `StylePanel.tsx`: Live edge styling (stroke width, color, type, arrows)
- `ShapeLibrary.tsx`: Draggable device library with categorized icons from custom icon system
- `ToolPalette.tsx`: Canvas tools (selection, hand/pan)
- `ContextMenu.tsx`: Right-click actions for nodes/edges

**State Management**:
- History system with 50-state undo/redo buffer
- Auto-save last session functionality
- Diagram serialization includes nodes, edges, and viewport state

### Theme System

Centralized theme configuration in `src/theme.ts`:
- Dark theme optimized for network diagrams
- Comprehensive color tokens (background, text, border, accent, device, status)
- Device type colors aligned with industry conventions
- Gradient definitions for UI elements
- Typography scale and spacing system
- Animation and transition tokens

## Key File Locations

### Main Process
- `src/main/main.ts` - Electron main process, IPC handlers, window control handlers
- `src/main/preload.ts` - Context bridge, exposes secure IPC API to renderer
- `src/main/menu-system.ts` - Native menu template (hidden, registers keyboard accelerators)
- `src/main/ssh-session.ts` - SSH session lifecycle management
- `src/main/buffer-manager.ts` - SSH data buffering and flow control
- `src/main/local-terminal.ts` - Local terminal (shell) session management
- `src/main/terminal-ipc.ts` - Terminal-related IPC handler registration
- `src/main/diagram-manager.ts` - Diagram save/load/list file operations
- `src/main/sftp-manager.ts` - SFTP file transfer operations
- `src/main/rdp-handler.ts` - RDP connection via cmdkey/mstsc
- `src/main/icon-manager.ts` - SVG icon loading from disk
- `src/main/shell-utils.ts` - Shell utilities (directory navigation, env vars, command parsing)
- `src/main/cwd-tracker.ts` - Output-based CWD tracking for local terminals

### Renderer
- `src/renderer/App.tsx` - Main React component, React Flow integration, canvas logic
- `src/renderer/index.tsx` - React entry point, wraps App with TabProvider and SettingsProvider
- `src/renderer/iconStore.ts` - Icon loading, caching, and category mapping
- `src/renderer/contexts/TabContext.tsx` - SSH connection state management
- `src/renderer/contexts/SettingsContext.tsx` - App-wide settings management
- `src/renderer/hooks/useConfirm.tsx` - Confirmation dialog hook (promise-based)
- `src/renderer/hooks/useToast.tsx` - Toast notification hook (success/error/warning/info)
- `src/renderer/utils/errorMessages.ts` - Maps technical errors to user-friendly messages
- `src/renderer/components/` - All React components
  - `TitleBar.tsx` - Custom frameless title bar (menus, window controls)
  - `TerminalEmulator.tsx` - xterm.js integration with WebGL rendering
  - `EnhancedDeviceNode.tsx` - Primary node type with credentials and custom SVG icons
  - `ConnectionsTab.tsx` - SSH session UI with tabs, SFTP modal, context menus
  - `DesignTab.tsx` - Main diagram canvas
  - `StylePanel.tsx` - Node/edge property editor
  - `SettingsModal.tsx` - Settings modal (shell config, keyboard shortcuts)
  - `SFTPModal.tsx` - Dual-pane SFTP file browser
  - `ConnectionContextMenu.tsx` - Context menu for SSH connection tabs
  - `ConnectionConfigPanel.tsx` - Configuration panel for SSH connections
  - `TabBar.tsx` - Tab bar component for connection management
  - `ConfirmDialog.tsx` - Confirmation dialog with focus trap
  - `Toast.tsx` - Toast notification with auto-close and progress bar
  - `StatusIcons.tsx` - Status indicator icons (Plug, Latency, Lightning, etc.)
  - `Skeleton.tsx` - Loading skeleton component
  - `Tooltip.tsx` - Tooltip component
- `src/renderer/components/sftp/` - SFTP subcomponents
  - `FilePane.tsx`, `EditablePathBar.tsx`, `FileContextMenu.tsx`
  - `TransferFooter.tsx`, `SFTPIcons.tsx`, `ConfirmDialog.tsx`, `sftpReducer.ts`

### Types
- `src/renderer/types.d.ts` - ElectronAPI interface (window.electron type declarations)
- `src/renderer/types/terminal.ts` - SSH connection and tab types
- `src/renderer/types/tools.ts` - Canvas tool definitions
- `src/renderer/types/settings.ts` - AppSettings, TerminalSettings, ShellType definitions

### Configuration
- `src/config.ts` - Centralized UI configuration (handle sizing, edge settings, panel widths, node sizing, zoom ranges)
- `webpack.config.js` - Renderer build configuration
- `tsconfig.json` - TypeScript compiler options
- `electron-builder.json` - Packaging configuration (portable Windows exe, AppImage, DMG)

### Icons
- `icons/categories.json` - Icon category definitions and metadata
- `icons/*.svg` - Device icon SVG files (13+ icons)

## Data Flow Patterns

### Creating an SSH Connection
1. User double-clicks node → StylePanel opens for editing
2. User fills credentials and clicks "Connect" → calls TabContext.createConnection()
3. TabContext creates SSHConnection object and sends IPC to main via window.electron.createSSHSession()
4. Main process creates ssh2 Client, establishes connection, sets up data buffering
5. Main process sends success/error back, TabContext updates connection status
6. TerminalEmulator mounts, subscribes to window.electron.onSSHData() events
7. Terminal renders with xterm.js, sends input via window.electron.sendSSHData()

### SSH Data Flow (Terminal Output)
1. SSH stream emits data → buffered in main process
2. After 4ms or 8KB, buffer flushes → sends batched IPC message
3. TerminalEmulator receives data, writes to xterm.js terminal
4. After rendering, reports consumed bytes via window.electron.sshDataConsumed()
5. Main process decrements queuedBytes, resumes stream if below threshold

### Diagram Persistence
1. User clicks Save → App.tsx serializes nodes/edges/viewport
2. IPC call to window.electron.saveDiagram() with diagram name and data
3. Main process uses electron-store to persist JSON to user data directory
4. Load reverses process, restoring nodes/edges and fitting viewport

## Common Development Patterns

### Adding a New IPC Handler
1. Add handler in `src/main/main.ts` using `ipcMain.handle()` or `ipcMain.on()`
2. Expose method in `src/main/preload.ts` via contextBridge
3. Add TypeScript declaration to `ElectronAPI` interface in `src/renderer/types.d.ts`
4. Call via `window.electron.methodName()` in renderer

### Adding a New Node Type
1. Create component in `src/renderer/components/` extending NodeProps
2. Add to `nodeTypes` object in `App.tsx`
3. Update node creation logic in drag handlers or toolbar
4. Ensure node.data structure includes required fields

### Modifying SSH Performance Parameters
Key constants in `src/main/buffer-manager.ts`:
- `BUFFER_TIME_MS`: Latency vs throughput trade-off (lower = more responsive, higher CPU)
- `BUFFER_SIZE_BYTES`: Max buffer before force flush
- `MAX_QUEUED_BYTES`: Flow control threshold for pausing streams
- Terminal config in `TerminalEmulator.tsx`:
  - `scrollback`: Memory vs history trade-off
  - WebGL rendering: Can be disabled by not loading WebglAddon

### Adding Device Icons
1. Add SVG file to `icons/` directory
2. Register icon in `icons/categories.json` under the appropriate category
3. Add color to `theme.device` in `src/theme.ts` if needed
4. Icon automatically loads via `icon-manager.ts` → `iconStore.ts` → `DynamicIcon` in `NetworkIcons.tsx`
5. For built-in fallback icons, add to `NetworkIcons.tsx` directly

## Testing Connections

### RDP (Windows only)
- Requires target machine with RDP enabled (port 3389)
- Uses Windows cmdkey to store credentials with TERMSRV/ prefix
- Launches mstsc.exe with temporary .rdp file
- Credentials persist in Windows Credential Manager

### SSH
- Requires SSH server on target (default port 22)
- Password authentication via ssh2 library
- Private key authentication supported via privateKeyPath
- Terminal emulator supports full PTY (resize, colors, etc.)

## Performance Considerations

### Terminal Rendering
- WebGL renderer provides 60fps for smooth output
- Data buffering reduces IPC messages by ~95%
- Flow control prevents renderer lockup during high throughput
- 4ms buffer time provides near-instant input feedback while batching output

### React Flow Canvas
- MiniMap can be toggled for performance on large diagrams
- Node rendering optimized with React.memo patterns
- Undo/redo limited to 50 states to prevent memory issues

### Electron Bundle
- Production builds use ASAR packaging
- electron-builder excludes source maps and TypeScript files
- Portable Windows build for single-exe distribution
- Maximum compression enabled

## Security Notes

- Credentials stored in electron-store without encryption
- Plain text storage intended for lab/research environments only
- RDP passwords visible in process list temporarily during cmdkey execution
- SSH passwords transmitted securely over SSH protocol but stored locally unencrypted
- No authentication required to access stored diagrams
- Consider implementing encryption-at-rest for production deployments

## Troubleshooting

### Build Failures
- Ensure all three build steps complete: main, preload, renderer
- Check TypeScript errors with `npx tsc --noEmit`
- Webpack errors often indicate missing dependencies

### SSH Connection Issues
- Check `connectionId` consistency across IPC calls
- Verify ssh2 native module rebuilt: `npx @electron/rebuild`
- Enable DevTools to see IPC message flow
- Monitor main process console for SSH session lifecycle logs

### Terminal Not Rendering
- Verify TerminalEmulator receives correct `connectionId`
- Check that terminal instance exists in global Map
- Ensure container div has non-zero dimensions
- WebGL failures fallback silently - check console warnings

### Packaging Errors
- Ensure electron-builder.json includes all runtime dependencies
- Native modules (ssh2) require rebuild for target platform
- Icon files must exist in build/ directory
