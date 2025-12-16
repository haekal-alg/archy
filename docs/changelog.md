# Changelog

All notable changes to Archy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2025-12-16

### Added
- **WebGL Renderer (Phase 3)**:
  - GPU-accelerated terminal rendering using `@xterm/addon-webgl`
  - Up to 900% faster rendering compared to canvas
  - Automatic canvas fallback if WebGL unavailable
  - WebGL context loss handling with graceful recovery

- **Renderer-Side Write Batching**:
  - Data writes synced with display refresh using `requestAnimationFrame`
  - Smoother visual rendering during high throughput

### Technical Details
- **Files Modified**:
  - `src/renderer/components/TerminalEmulator.tsx` - WebGL + batching
  - `package.json` - Added `@xterm/addon-webgl` dependency

---

## [1.2.0] - 2025-12-16

### Added
- **Terminal Flow Control (Phase 2)**:
  - Backpressure mechanism to prevent renderer freezing during high SSH throughput
  - `SSHSession` now tracks `isPaused` and `queuedBytes` state
  - New IPC channel `ssh-data-consumed` for renderer to signal data consumption
  - Stream pauses at 64KB queue, resumes at 32KB threshold

### Improved
- Terminal performance under high data throughput (+20-30% under load)
- Memory stability during stress conditions (e.g., `yes` command)
- Graceful degradation when SSH data exceeds renderer capacity

### Technical Details
- **Files Modified**:
  - `src/main/main.ts` - Added flow control logic
  - `src/main/preload.ts` - Exposed `sshDataConsumed` IPC method
  - `src/renderer/components/TerminalEmulator.tsx` - Signals data consumption
  - `src/renderer/types.d.ts` - Added type definition
  - `docs/features/feature-optimize-terminal-emulator/implementation-notes.md`

---

## [1.1.0] - 2025-12-15

### Added
- Icons to ConnectionContextMenu component:
  - Retry icon (circular arrow) for retry connection action
  - Disconnect icon (power symbol) for disconnect action
  - Remove icon (X symbol) for remove action
- Shared styling utilities for context menus:
  - `getMenuContainerStyle()` - Unified container styling with glassmorphic effects
  - `getMenuItemStyle()` - Consistent menu item styling with hover states
- Entrance animations for both ContextMenu and ConnectionContextMenu components

### Changed
- **Toast Notification System**:
  - Reduced default duration from 3000ms (3 seconds) to 2000ms (2 seconds)
  - Removed 300ms dismissal delay for immediate closure when timer expires
  - Updated close button handler to dismiss immediately without animation delay
  - Updated action button handler to dismiss immediately without animation delay
- **CustomEdge Component**:
  - Simplified arrow marker types from 17 options to 2 (arrow/none)
  - Increased base edge stroke width from 2px to 4px
  - Increased selected edge stroke width from 4px to 6px
  - Updated hover state stroke width from 3px to 5px
  - Updated animated edge glow widths proportionally (8→10, 4→6, 2→4)
- **ContextMenu Component**:
  - Refactored to use shared styling utilities
  - Applied consistent glassmorphic design
  - Improved code maintainability and consistency

### Improved
- Visual consistency between ContextMenu and ConnectionContextMenu
- User experience with faster, more responsive toast notifications
- Edge visibility and clarity in diagrams with increased stroke width
- Code reusability by extracting shared menu styling logic

### Technical Details
- **Files Modified**:
  - `src/renderer/components/ConnectionContextMenu.tsx`
  - `src/renderer/components/ContextMenu.tsx`
  - `src/renderer/components/Toast.tsx`
  - `src/renderer/hooks/useToast.tsx`
  - `src/renderer/components/CustomEdge.tsx`
  - `docs/architecture.md`

- **Type Changes**:
  - `MarkerType` type simplified from 11 options to 2: `'arrow' | 'none'`

---

## [1.0.0] - 2025-12-15

### Added
- Initial release of Archy network architecture visualization tool
- Interactive diagram editor with React Flow
- 11 device types: router, server, firewall, Windows, Linux, switch, cloud, database, laptop, attacker, generic
- Group nodes for network segmentation
- Text annotation nodes
- Custom edge rendering with multiple routing types (bezier, smoothstep, straight)
- SSH terminal integration with xterm.js
- RDP connection support (Windows)
- Terminal emulator with features:
  - Copy/paste support
  - Zoom control (0.5x to 2.0x)
  - Latency monitoring (every 3 seconds)
  - Connection status tracking
- Diagram features:
  - Save/Load diagrams as JSON
  - Export to PNG/JPG/SVG
  - Undo/Redo (50 states)
  - Customizable node and edge styling
- Modern dark theme with design tokens
- Keyboard shortcuts
- Toast notification system
- Context menus for nodes and edges
- Connection management UI

### Core Components
- **DesignTab** - Main diagram canvas
- **ConnectionsTab** - Terminal management
- **EnhancedDeviceNode** - Device node rendering
- **GroupNode** - Container nodes
- **TextNode** - Text annotations
- **CustomEdge** - Edge rendering
- **TerminalEmulator** - SSH terminal UI
- **ShapeLibrary** - Drag-and-drop device library
- **StylePanel** - Property editor
- **ToolPalette** - Tool selection

### Architecture
- Electron-based desktop application
- Multi-process architecture (Main/Renderer)
- IPC bridge for secure communication
- React 19 with TypeScript
- Context API for global state
- Persistent storage with electron-store

---

## Version History

- **1.3.0** (2025-12-16) - WebGL renderer and write batching (Phase 3)
- **1.2.0** (2025-12-16) - Terminal flow control (Phase 2 optimization)
- **1.1.0** (2025-12-15) - UI/UX improvements and edge rendering enhancements
- **1.0.0** (2025-12-15) - Initial release

---

*For more details, see [architecture.md](./architecture.md)*
