# UI/UX Improvement Implementation Plan

## Overview

This document describes the comprehensive implementation plan for 5 prioritized UI/UX improvements to the Archy desktop application. These improvements were identified through a thorough UI/UX audit analyzing visual hierarchy, usability, information architecture, visual design, and accessibility.

## Motivation

Archy combines network topology visualization with terminal access management. The audit found:

- **Workflow friction**: Users must tab-switch between topology and terminal views with no cross-reference
- **Information gaps**: The tab bar hides connection health (errors, reconnection attempts)
- **Maintainability concerns**: StylePanel.tsx is 2735 lines combining two distinct concerns
- **Visual inconsistency**: Emoji characters render differently across Windows/macOS/Linux
- **Code bloat**: 539 inline style objects across 26 files with heavy duplication

## The 5 Recommendations

### 1. Topology Mini-Reference in Connections Tab
**Problem**: When working in a terminal, users cannot see which network node they are connected to without switching tabs.
**Solution**: Add a "Device Info" bar in the Connections tab showing the originating node's name, type, color, and a "Show in Design" button that navigates back to the node on the canvas.

### 2. StylePanel Decomposition
**Problem**: StylePanel.tsx is a 2735-line monolith combining connection configuration (SSH/RDP credentials, port forwarding) with visual styling (colors, labels, appearance).
**Solution**: Extract connection configuration into a separate `ConnectionConfigPanel.tsx` component, reducing StylePanel to ~1700 lines and ConnectionConfigPanel to ~1050 lines.

### 3. Connection Health Badges in Tab Bar
**Problem**: The tab bar only shows a green count of connected sessions. Error, connecting, and disconnected states are invisible when the user is on the Design tab.
**Solution**: Render multiple colored badges (green/orange/red) and a subtle red alert dot when errors exist.

### 4. Replace Emojis with SVG Icons
**Problem**: Emojis (used in 13+ files for status indicators, empty states, device icons) render differently across platforms and don't scale cleanly.
**Solution**: Create a `StatusIcons.tsx` component with ~15 consistent SVG icon components and replace all emoji usage.

### 5. CSS Utility Foundation
**Problem**: 539 inline style objects with heavy duplication. Manual `onMouseEnter`/`onMouseLeave` handlers used for hover states because inline styles don't support pseudo-classes.
**Solution**: Create CSS custom properties from theme tokens and utility classes for the most-repeated patterns. Replace JS hover handlers with CSS `:hover`.

## Execution Order

```
Phase 5 (CSS foundation) -> Phase 4 (SVG icons) -> Phase 3 (TabBar) -> Phase 1 (Topology ref) -> Phase 2 (StylePanel split)
```

**Rationale**: Phase 5 provides CSS classes used by all subsequent phases. Phase 4 creates icons used in Phases 1-2. Phase 3 is self-contained. Phase 1 requires TabContext changes. Phase 2 is the largest refactor and benefits from all prior work.

## Detailed Implementation

### Phase 5: CSS Utility Foundation

**New files:**
- `src/renderer/styles/theme-vars.css` - CSS custom properties mirroring theme.ts tokens
- `src/renderer/styles/common.css` - Utility classes

**CSS classes to create:**
| Class | Purpose | Replaces |
|-------|---------|----------|
| `.field-label` | Form field labels | ~40 inline style objects |
| `.field-input` | Text inputs | ~30 inline style objects |
| `.field-group` | Field wrapper with margin | ~25 inline wrappers |
| `.color-input` | Color picker inputs | ~8 inline style objects |
| `.btn-secondary` | Gray outline buttons | ~15 button styles + hover handlers |
| `.btn-primary` | Blue accent buttons | ~8 button styles + hover handlers |
| `.btn-icon` | Small icon-only buttons | ~10 button styles + hover handlers |
| `.panel-glass` | Glassmorphism panels | 4 identical inline glassmorphism blocks |
| `.card` | Card container | ~12 inline card styles |
| `.flex-row/col/center/between` | Flex utilities | ~50+ flex declarations |

**Files modified:**
- `src/renderer/App.tsx` - Import new CSS files
- `src/renderer/components/StylePanel.tsx` - Toggle button uses `.panel-glass`
- `src/renderer/components/ConnectionsTab.tsx` - Toggle button uses `.panel-glass`, buttons use `.btn-*`
- `src/renderer/components/ShapeLibrary.tsx` - Toggle button uses `.panel-glass`

### Phase 4: SVG Icon Replacement

**New file:** `src/renderer/components/StatusIcons.tsx`

**Icons created (15 total):**
- `PlugIcon` - Replaces plug emoji in empty states
- `LatencyDot` - Replaces colored circle emojis for latency display
- `LightningIcon` - Replaces lightning emoji in empty state
- `CheckIcon` - Replaces checkmark text character
- `WarningIcon` - Replaces warning emoji on nodes
- `CrossIcon` - Replaces X character in error toasts
- `InfoIcon` - Replaces info character in info toasts
- `KeyboardIcon` - Replaces keyboard emoji in shortcuts modal
- `SaveIcon` - Replaces floppy disk emoji
- `PencilIcon` - Replaces pencil emoji in empty state
- `ChevronLeftIcon` / `ChevronRightIcon` - Replaces arrow characters on toggle buttons
- `ExportIcon` - Replaces download emoji on export button
- `SortAscIcon` / `SortDescIcon` - Replaces arrow text characters for sort indicators

**Files modified:** ConnectionsTab.tsx, EnhancedDeviceNode.tsx, GroupNode.tsx, KeyboardShortcuts.tsx, StylePanel.tsx, ShapeLibrary.tsx, App.tsx, SFTPModal.tsx, Toast.tsx

### Phase 3: Connection Health Badges

**File modified:** `src/renderer/components/TabBar.tsx`

**Changes:**
1. Compute separate counts: `connectedCount`, `errorCount`, `connectingCount`
2. Render green badge (connected), orange badge (connecting), red badge with pulse animation (errors)
3. Red alert dot on "Connections" tab when user is on Design tab and errors exist

### Phase 1: Topology Mini-Reference

**Type changes** (`src/renderer/types/terminal.ts`):
- `SSHConnection.nodeId?: string` - Maps connection back to React Flow node
- `TopologyNodeInfo { id, label, type, color }` - Lightweight node data for cross-tab reference
- Extended `TabContextType` with topology fields

**Context changes** (`src/renderer/contexts/TabContext.tsx`):
- New state: `topologyNodes: TopologyNodeInfo[]`
- New method: `focusNode(nodeId)` - Switches to design tab + centers viewport
- New method: `setOnFocusNode(handler)` - Registers viewport-centering callback

**App.tsx changes:**
- Pass `nodeId: node.id` when creating connections
- Sync derived node list to TabContext via `useEffect`
- Register `onFocusNode` handler using `reactFlowInstance.setCenter()`

**ConnectionsTab.tsx changes:**
- Device Info bar between terminal header and terminal area
- Shows: color dot, node label, node type, "Show in Design" button
- Graceful fallback for local terminals and pre-existing connections

### Phase 2: StylePanel Decomposition

**New file:** `src/renderer/components/ConnectionConfigPanel.tsx`

**Extraction boundary:**
- Connection list with drag-to-reorder
- Connection form (type selector, credentials, port forwarding)
- Add/Save/Delete connection handlers
- Related state variables (~15 useState hooks)

**Remaining in StylePanel:**
- Panel container, toggle button, internal tab bar
- Property tab (appearance, colors, description, actions)
- Edge styling (line style, routing, markers)
- Text node styling
- CollapsibleSection helper

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `reactFlowInstance` null when "Show in Design" clicked | Null guard + toast notification |
| StylePanel state entanglement during extraction | Careful useEffect split - each component initializes its own data subset |
| CSS specificity conflicts with existing App.css rules | Test hover states per-component, adjust specificity as needed |
| SVG icons rendering at wrong sizes | Each icon accepts `size` prop with sensible defaults |
| Breaking existing connection CRUD after Phase 2 | Test all 4 connection types (SSH, RDP, Browser, Custom) |

## Verification Plan

After all phases:
1. `npm run build` (main + preload + renderer) must succeed
2. Visual regression check: all panels, buttons, inputs look identical
3. Functional check: connection creation, terminal access, SFTP, context menus
4. Cross-reference check: "Show in Design" navigates correctly
5. Edge cases: local terminals, pre-existing connections without nodeId, null reactFlowInstance
