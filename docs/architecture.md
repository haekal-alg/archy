# Archy - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture](#core-architecture)
5. [Component Architecture](#component-architecture)
6. [Data Flow](#data-flow)
7. [IPC Communication](#ipc-communication)
8. [Design Patterns](#design-patterns)
9. [State Management](#state-management)
10. [Build & Deployment](#build--deployment)
11. [Security](#security)

---

## Overview

Archy is an Electron-based desktop application for network architecture visualization and remote connection management. It combines interactive diagram design capabilities with integrated SSH/RDP terminal access, allowing users to create network diagrams and directly connect to the devices they've mapped.

**Key Features:**
- Interactive network diagram editor with 11 device types
- Persistent SSH terminal emulation
- RDP integration for Windows systems
- Export diagrams to PNG/JPG/SVG
- Real-time connection status and latency monitoring
- Comprehensive undo/redo system

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI framework with hooks
- **TypeScript 5.9.3** - Type-safe development
- **@xyflow/react 12.9.2** - Flow-based diagram visualization
- **@xterm/xterm 5.5.0** - Terminal emulator with addons (fit, serialize, web-links)

### Desktop Framework
- **Electron 39.1.0** - Cross-platform desktop application

### Core Libraries
- **ssh2 1.17.0** - SSH client for remote connections
- **electron-store 11.0.2** - Persistent application settings
- **html-to-image 1.11.13** - Diagram export functionality

### Build Tools
- **Webpack 5.102.1** - Module bundler
- **ts-loader 9.5.4** - TypeScript compilation
- **webpack-dev-server 5.2.2** - Development server with HMR
- **electron-builder 26.0.12** - Application packaging

---

## Project Structure

```
archy/
├── src/
│   ├── main/
│   │   ├── main.ts           # Electron main process
│   │   └── preload.ts        # IPC bridge (secure API surface)
│   └── renderer/
│       ├── App.tsx           # Root React component
│       ├── index.tsx         # React entry point
│       ├── index.html        # HTML template
│       ├── App.css           # Main styles
│       ├── components/       # React components (24 files)
│       ├── contexts/         # React context providers
│       ├── hooks/            # Custom React hooks
│       └── types/            # TypeScript definitions
├── webpack.config.js         # Webpack configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── electron-builder.json    # Packaging configuration
```

---

## Core Architecture

### Process Model

Archy follows Electron's multi-process architecture:

```
┌─────────────────────────────────────────┐
│       Main Process (Node.js)            │
│  - Window management                    │
│  - SSH session handling (ssh2)          │
│  - File I/O operations                  │
│  - System command execution             │
└──────────────┬──────────────────────────┘
               │
               │ IPC Bridge (preload.ts)
               │ Secure API exposure
               │
┌──────────────▼──────────────────────────┐
│    Renderer Process (Chromium)          │
│  - React UI rendering                   │
│  - Diagram state management             │
│  - Terminal emulation (xterm)           │
│  - User interactions                    │
└─────────────────────────────────────────┘
```

### Application Entry Points

#### Main Process Entry (`main.ts`)
1. Electron app initialization on `app.whenReady()`
2. Creates BrowserWindow (1400x900)
3. Loads renderer from:
   - Dev: `http://localhost:8080`
   - Prod: `dist/index.html`
4. Sets up IPC handlers for SSH, file operations, commands
5. Creates application menu with shortcuts

#### Renderer Entry (`index.tsx`)
1. Creates React root with StrictMode
2. Wraps app in `TabProvider` for global state
3. Renders `App.tsx` component
4. Auto-loads last session via IPC

---

## Component Architecture

### Component Hierarchy

```
App.tsx (Root)
├── TabBar (Navigation)
├── DesignTab (Diagram Editor)
│   ├── MenuBar (File/Edit operations)
│   ├── Toolbar (Actions: Save, Export, Delete)
│   ├── ShapeLibrary (Left Sidebar)
│   │   └── Draggable device icons
│   ├── ReactFlow (Canvas)
│   │   ├── EnhancedDeviceNode (x N)
│   │   ├── GroupNode (x N)
│   │   ├── TextNode (x N)
│   │   └── CustomEdge (x N)
│   ├── ToolPalette (Selection/Hand tools)
│   ├── StylePanel (Right Sidebar)
│   │   └── Property editors
│   ├── ContextMenu (Right-click menu)
│   └── EditNodeModal (Node editing dialog)
└── ConnectionsTab (Terminal Manager)
    ├── Connection list UI
    ├── TerminalEmulator (per connection)
    │   └── xterm.js instance
    └── ConnectionContextMenu
```

### Key Components

#### Canvas & Visualization
- **DesignTab** - Main diagram canvas using React Flow
- **CustomEdge** - Custom edge rendering with arrow markers (4px width, 6px when selected)
- **ReactFlow** - Flow-based node/edge visualization library

#### Node Types
- **EnhancedDeviceNode** - 11 device types (router, server, firewall, Windows, Linux, switch, cloud, database, laptop, attacker, generic)
- **GroupNode** - Container nodes for network zones/grouping
- **TextNode** - Text annotation nodes

#### UI Panels
- **ShapeLibrary** - Left panel with draggable device icons
- **StylePanel** - Right panel for editing node/edge properties
- **ToolPalette** - Tool selection (Selection vs Hand mode)
- **TabBar** - Tab navigation (Design vs Connections)

#### Connection Management
- **ConnectionsTab** - SSH/RDP connection manager
- **TerminalEmulator** - xterm-based terminal with zoom, copy/paste
- **ConnectionContextMenu** - Context menu for connection operations

#### UI Components
- **MenuBar** - Top menu (File, Edit, View)
- **Toolbar** - Action buttons (Save, Export, Delete, etc.)
- **ContextMenu** - Right-click menu for nodes/edges with icons and smooth animations
- **ConnectionContextMenu** - Right-click menu for connection management with retry, disconnect, and remove actions
- **EditNodeModal** - Modal for editing node properties
- **Toast** - Toast notification system with 2-second default duration and immediate dismissal
- **KeyboardShortcuts** - Help modal showing shortcuts
- **LoadingSpinner** - Loading indicator overlay
- **Skeleton** - Placeholder skeleton loader
- **RippleButton** - Button with ripple effect
- **Tooltip** - Tooltip component

---

## Data Flow

### Diagram Design Flow

```
User Action
    ↓
ShapeLibrary/DesignTab
    ↓
Node/Edge State Update (React hooks)
    ↓
StylePanel reflects changes
    ↓
History Stack updated (undo/redo)
    ↓
Save triggers IPC → Main Process → File System
```

### SSH Connection Flow

```
User right-clicks node → "Connect"
    ↓
TabContext.createConnection(credentials)
    ↓
IPC: create-ssh-session
    ↓
Main Process: ssh2 Client connects
    ↓
Terminal instance created (xterm)
    ↓
Bidirectional data stream:
  - Input: send-ssh-data IPC
  - Output: onSSHData listener
    ↓
Latency monitoring (every 3s)
    ↓
Connection status updates in UI
```

### File Operations Flow

```
User clicks Save/Load
    ↓
IPC to Main Process
    ↓
Native file dialog (showSaveDialog/showOpenDialog)
    ↓
File system read/write
    ↓
electron-store cache update
    ↓
Diagram state loaded into React
```

---

## IPC Communication

### IPC API Surface (preload.ts)

The preload script exposes a secure API via `window.electron`:

#### SSH Operations
- `createSSHSession(config)` - Opens persistent SSH connection
- `sendSSHData(connectionId, data)` - Sends input to terminal
- `resizeSSHTerminal(connectionId, cols, rows)` - Resize PTY
- `closeSSHSession(connectionId)` - Closes connection
- `sshDataConsumed(connectionId, bytesConsumed)` - Flow control signal
- `onSSHData(callback)` - Listens for terminal output
- `onSSHClosed(callback)` - Listens for connection close
- `onSSHLatency(callback)` - Receives latency measurements

#### File Operations
- `saveDiagram(data, path)` - Save diagram JSON
- `loadDiagram(path)` - Load diagram JSON
- `getLastSession()` - Retrieve last opened file
- `showSaveDialog(options)` - Native save dialog
- `showOpenDialog(options)` - Native open dialog

#### System Operations
- `executeCommand(command, args)` - Execute system commands
- `showContextMenu(template)` - Display context menu
- `setClipboardText(text)` - Copy to clipboard
- `getClipboardText()` - Paste from clipboard

### IPC Handlers (main.ts)

Main process handlers correspond to the exposed API:

```typescript
ipcMain.handle('create-ssh-session', async (event, config) => {
  // Create ssh2 Client, connect, set up event handlers
  // Store session in sshSessions Map
  // Send data via event.sender.send('ssh-data', ...)
});

ipcMain.handle('send-ssh-data', async (event, connectionId, data) => {
  // Write to SSH channel
});

ipcMain.handle('save-diagram', async (event, data, filePath) => {
  // Write JSON to file system
  // Update electron-store cache
});
```

---

## Design Patterns

### 1. Component Composition
- Container components (App, DesignTab, ConnectionsTab) manage state
- Presentational components (nodes, edges, panels) render UI
- Clear separation of concerns
- Shared styling utilities for consistent UI (context menus, menu items)

### 2. Context API Pattern
- `TabProvider` wraps entire app for global connection state
- `useTabContext()` hook provides access throughout tree
- Manages SSH connections, tab state, latency

### 3. Custom Hooks
- `useToast()` - Toast notification management
- `useNodesState()`, `useEdgesState()` - React Flow state
- Encapsulates reusable stateful logic

### 4. IPC Bridge Pattern
- Preload script exposes secure API surface
- Main process handles privileged operations
- Renderer makes requests via `window.electron.*`
- Context isolation prevents direct Node.js access

### 5. Singleton Pattern
- Terminal instances stored in global `terminalInstances` Map
- SSH sessions stored in `sshSessions` Map
- Persist across re-renders, survive navigation

### 6. Observer Pattern
- SSH event listeners (`onSSHData`, `onSSHClosed`, `onSSHLatency`)
- Terminal zoom events via `CustomEvent`
- Decouples data producers from consumers

### 7. History/Memento Pattern
- Undo/Redo stack maintains diagram states
- Limited to 50 states with automatic cleanup
- Preserves complete node/edge snapshots

---

## State Management

### Local Component State
- React hooks (`useState`, `useEffect`) for component-specific state
- Node/edge state via React Flow hooks
- UI state (modals, tooltips, loading states)

### Global State (Context API)
- **TabContext** manages:
  - Active tab (Design vs Connections)
  - SSH connections array
  - Connection lifecycle methods
  - Latency monitoring

### Persistent State
1. **File System:**
   - Diagrams saved as JSON: `{ nodes, edges, metadata }`
   - User selects location via native dialog

2. **Electron Store:**
   - Recently saved diagrams
   - Last opened file path (session restoration)

3. **Local Storage:**
   - Terminal zoom levels: `terminal-zoom-{connectionId}`

### In-Memory State
- **Main Process:**
  - `sshSessions` Map - Active SSH connections
  - BrowserWindow instance

- **Renderer Process:**
  - `terminalInstances` Map - xterm instances
  - Diagram history stack
  - Undo/redo state

---

## Build & Deployment

### Development Workflow

```bash
npm run dev
```

1. Compiles `main.ts` with TypeScript compiler → `dist/main.js`
2. Compiles `preload.ts` → `dist/preload.js`
3. Starts webpack-dev-server on `localhost:8080`
4. Launches Electron with HMR enabled
5. Renderer changes auto-reload, main process changes require restart

### Production Build

```bash
npm run build
npm run package
```

1. **Build Phase:**
   - `tsc src/main/main.ts` → `dist/main.js`
   - `tsc src/main/preload.ts` → `dist/preload.js`
   - `webpack` → `dist/renderer.js` + `dist/index.html`

2. **Package Phase:**
   - `electron-builder` packages `dist/` + `node_modules` into ASAR
   - Creates platform-specific installers:
     - Windows: Portable executable (.exe)
     - Linux: AppImage
     - macOS: DMG
   - Output to `release/` directory

### Configuration Files

#### `tsconfig.json`
- Target: ES2020
- Module: CommonJS
- JSX: React
- Strict mode enabled

#### `webpack.config.js`
- Entry: `src/renderer/index.tsx`
- Target: `electron-renderer`
- Loaders: ts-loader, style-loader, css-loader
- Plugins: HtmlWebpackPlugin
- Dev server: Port 8080 with source maps

#### `electron-builder.json`
- App ID: `com.archy.app`
- Targets: Windows (portable), Linux (AppImage), macOS (DMG)
- Compression: Maximum (ASAR archive)
- Code signing: Disabled

---

## Security

### Context Isolation
- **nodeIntegration**: `false` - Prevents direct Node.js access in renderer
- **contextIsolation**: `true` - Isolates renderer from Electron internals
- **Preload Bridge**: Only explicitly exposed APIs available

### Secure IPC
- All IPC handlers validate input
- No arbitrary code execution from renderer
- File paths validated before file operations

### SSH Security
- Credentials never stored persistently
- SSH keys supported for authentication
- Host key verification enabled

### Development vs Production
- Separate user data paths prevent conflicts
- Cache disabled in development
- Different window partitions for dev/prod

---

## Theme System

Comprehensive design tokens in `theme.ts`:

```typescript
{
  colors: {
    background: { primary, secondary, tertiary, hover, border },
    text: { primary, secondary, tertiary, accent },
    accent: { primary, hover, text },
    status: { success, error, warning, info },
    device: { router, server, firewall, etc. }
  },
  spacing: { xs, sm, md, lg, xl, xxl },
  typography: { fontSize, fontWeight, fontFamily, lineHeight },
  shadows: { sm, md, lg, xl },
  borderRadius: { sm, md, lg, xl, full },
  zIndex: { modal, overlay, dropdown, tooltip, toast },
  animations: { duration, easing }
}
```

All components use theme tokens for consistent styling.

---

## Key Features Summary

### Diagram Design
- 11 device types with custom icons
- Group nodes for network segmentation
- Text annotations
- Customizable styling (colors, thickness, line styles)
- Arrow markers for edges (optional)
- Undo/Redo (50 states)
- Export to PNG/JPG/SVG

### Remote Access
- **SSH**: Persistent terminal with xterm.js
- **RDP**: Launch mstsc.exe (Windows)
- **Browser**: Open URLs
- **Custom Commands**: Execute shell commands

### Connection Management
- Active/historic connection list
- Status indicators (connected, connecting, error, disconnected)
- Latency monitoring (every 3 seconds)
- Connection retry
- Terminal zoom (0.5x to 2.0x)

### UI/UX
- Modern dark theme with glassmorphic effects
- Keyboard shortcuts (V, H, ?, Ctrl+Z, etc.)
- Context menus with icons and smooth animations
- Toast notifications (2-second duration with immediate dismissal)
- Loading states and skeletons
- Responsive panels

---

## Architecture Strengths

1. **Clean Separation**: Main/renderer processes properly isolated
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Reusability**: Component-based architecture
4. **Consistency**: Theme system for unified styling
5. **Security**: Context isolation and secure IPC bridge
6. **Performance**: Singleton pattern for terminal persistence
7. **User Experience**: Undo/redo, auto-save, session restoration

---

## Future Considerations

- **State Management**: Consider Redux/Zustand for complex state
- **CSS Architecture**: Migrate to styled-components or CSS modules
- **Testing**: Add unit/integration tests
- **Error Handling**: Centralized error boundary
- **Logging**: Structured logging for debugging
- **Updates**: Auto-update mechanism via electron-updater
- **Multi-platform**: Test and optimize for Linux/macOS
- **Terminal Performance**: For native-like terminal performance, consider:
  - **Tauri + Rust**: Full rewrite with 10-50x performance gain ([details](features/feature-native-terminal-alternatives.md))
  - **Native Node.js addon**: node-pty for local PTY, napi-rs for native SSH

---

*Last Updated: 2025-12-16*
*Version: 1.3.0*
*Branch: feature/improvements*

## Recent Updates (v1.1.0)

### UI/UX Improvements
- Added icons to ConnectionContextMenu (Retry, Disconnect, Remove)
- Refactored both ContextMenu and ConnectionContextMenu to use shared styling utilities
- Implemented consistent glassmorphic design with smooth entrance animations
- Improved Toast notification system:
  - Reduced default duration from 3 seconds to 2 seconds
  - Removed 300ms dismissal delay for immediate closure
  - Enhanced user experience with faster, more responsive feedback

### Edge Rendering Enhancements
- Simplified CustomEdge arrow markers from 17 types to 2 (arrow/none)
- Increased edge stroke width from 2px to 4px (6px when selected)
- Updated hover state width from 3px to 5px
- Improved visual clarity and consistency across diagrams
