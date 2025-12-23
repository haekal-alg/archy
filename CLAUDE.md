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
- Manages the Electron BrowserWindow lifecycle
- Handles all IPC communication via `ipcMain`
- Controls native system integrations (RDP via cmdkey/mstsc, SSH via ssh2)
- Manages SSH sessions with flow control and data buffering
- Implements menu system and file operations
- Uses electron-store for persistent data storage

**Preload Script** (`src/main/preload.ts`):
- Creates secure IPC bridge using `contextBridge.exposeInMainWorld`
- Exposes `window.electron` API to renderer process
- Provides type-safe methods for SSH operations, file dialogs, clipboard, and menu events

**Renderer Process** (`src/renderer/`):
- React application using React Flow for diagram visualization
- Tab-based UI with Design and Connections tabs
- Context-based state management (TabContext)
- Component-based architecture

### SSH Session Architecture

The application implements a sophisticated SSH session management system with performance optimizations:

**Main Process (src/main/main.ts)**:
- **Session Storage**: Active SSH sessions stored in `Map<string, SSHSession>`
- **Flow Control**: Implements backpressure mechanism to prevent overwhelming renderer
  - `MAX_QUEUED_BYTES = 65536` (64KB) - pause threshold
  - `RESUME_THRESHOLD_BYTES = 32768` (32KB) - resume threshold
  - Tracks `queuedBytes` per session and pauses/resumes streams accordingly
- **Data Buffering**: Reduces IPC overhead by batching terminal data
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

### React Flow Integration

**Node Types**:
- `device`: Basic device nodes (legacy)
- `enhanced`: Feature-rich device nodes with connection credentials (EnhancedDeviceNode)
- `group`: Zone/container nodes for network segmentation (GroupNode)
- `text`: Annotation nodes (TextNode)

**Custom Components**:
- `CustomEdge.tsx`: Configurable network connections with line styles, colors, and arrow types
- `StylePanel.tsx`: Live edge styling (stroke width, color, type, arrows)
- `ShapeLibrary.tsx`: Draggable device library (11+ device icons)
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
- `src/main/main.ts` - Electron main process, IPC handlers, SSH session management
- `src/main/preload.ts` - Context bridge, exposes secure IPC API to renderer

### Renderer
- `src/renderer/App.tsx` - Main React component, React Flow integration, canvas logic
- `src/renderer/index.tsx` - React entry point, wraps App with TabProvider
- `src/renderer/contexts/TabContext.tsx` - SSH connection state management
- `src/renderer/components/` - All React components
  - `TerminalEmulator.tsx` - xterm.js integration with WebGL rendering
  - `EnhancedDeviceNode.tsx` - Primary node type with credentials
  - `ConnectionsTab.tsx` - SSH session UI with tabs
  - `DesignTab.tsx` - Main diagram canvas
  - `EditNodeModal.tsx` - Node configuration dialog

### Types
- `src/renderer/types/terminal.ts` - SSH connection and tab types
- `src/renderer/types/tools.ts` - Canvas tool definitions

### Configuration
- `webpack.config.js` - Renderer build configuration
- `tsconfig.json` - TypeScript compiler options
- `electron-builder.json` - Packaging configuration (portable Windows exe, AppImage, DMG)

## Data Flow Patterns

### Creating an SSH Connection
1. User double-clicks node → EditNodeModal opens
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
3. Add TypeScript declaration in global window interface (typically in component)
4. Call via `window.electron.methodName()` in renderer

### Adding a New Node Type
1. Create component in `src/renderer/components/` extending NodeProps
2. Add to `nodeTypes` object in `App.tsx`
3. Update node creation logic in drag handlers or toolbar
4. Ensure node.data structure includes required fields

### Modifying SSH Performance Parameters
Key constants in `src/main/main.ts`:
- `BUFFER_TIME_MS`: Latency vs throughput trade-off (lower = more responsive, higher CPU)
- `BUFFER_SIZE_BYTES`: Max buffer before force flush
- `MAX_QUEUED_BYTES`: Flow control threshold for pausing streams
- Terminal config in `TerminalEmulator.tsx`:
  - `scrollback`: Memory vs history trade-off
  - WebGL rendering: Can be disabled by not loading WebglAddon

### Adding Device Icons
1. Add SVG icon to `src/renderer/components/NetworkIcons.tsx`
2. Update `deviceIcons` mapping with device type
3. Add color to `theme.device` in `src/theme.ts`
4. Update ShapeLibrary.tsx to include in palette

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
