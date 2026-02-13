# UI/UX Improvement Changelog

## Overview

Five prioritized UI/UX improvements were implemented across the Archy application, reducing inline style duplication, replacing inconsistent emoji characters with SVG icons, surfacing connection health in the tab bar, adding topology cross-referencing between tabs, and decomposing the oversized StylePanel component.

---

## Phase 5: CSS Utility Foundation

**Files created:**
- `src/renderer/styles/theme-vars.css` -- CSS custom properties mirroring all tokens from `src/theme.ts`
- `src/renderer/styles/common.css` -- Utility classes for repeated UI patterns

**Files modified:**
- `src/renderer/App.tsx` -- Added CSS imports for both new stylesheets

**Key changes:**
- Extracted `.panel-glass` class replacing 4 identical inline glassmorphism blocks (backdrop-filter + hover handlers)
- Created `.tab-badge`, `.pulse-red`, `.pulse-dot` for tab bar status indicators
- Created `.btn-secondary`, `.btn-primary`, `.btn-icon` for button patterns
- Created `.field-label`, `.field-input`, `.field-group`, `.color-input` for form patterns
- Created layout utilities: `.flex-row`, `.flex-col`, `.flex-center`, `.flex-between`
- Moved hover states from JavaScript `onMouseEnter`/`onMouseLeave` handlers to CSS `:hover` pseudo-classes

**Impact:** Reduced ~120 lines of duplicated inline styles across toggle buttons in StylePanel, ConnectionsTab, and ShapeLibrary.

---

## Phase 4: Replace Emojis with SVG Icons

**Files created:**
- `src/renderer/components/StatusIcons.tsx` -- 17 SVG icon components (14-16px, stroke-based, `color` prop)

**Icons created:** `PlugIcon`, `LatencyDot`, `LightningIcon`, `CheckIcon`, `WarningIcon`, `CrossIcon`, `InfoIcon`, `KeyboardIcon`, `SaveIcon`, `PencilIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ExportIcon`, `SortAscIcon`, `SortDescIcon`, `AppleIcon`, `TerminalIcon`

**Files modified:**

| File | Change |
|------|--------|
| `ConnectionsTab.tsx` | Replaced plug, latency dot, and lightning emojis |
| `EnhancedDeviceNode.tsx` | Replaced check and warning emojis |
| `GroupNode.tsx` | Replaced warning emoji |
| `KeyboardShortcuts.tsx` | Replaced keyboard emoji |
| `StylePanel.tsx` | Replaced plug, save, pencil, and chevron emojis |
| `ShapeLibrary.tsx` | Replaced chevron arrow characters |
| `App.tsx` | Replaced export emoji |
| `SFTPModal.tsx` | Replaced OS and utility emojis with SVG icons from StatusIcons and NetworkIcons |
| `Toast.tsx` | Replaced check, cross, warning, and info text characters |

**Impact:** Consistent icon rendering across all platforms. Icons scale properly with the UI and respect the dark theme color palette.

---

## Phase 3: Connection Health Badges in Tab Bar

**Files modified:**
- `src/renderer/components/TabBar.tsx` -- Complete enhancement of the Connections tab indicator

**Key changes:**
- Added three colored pill badges on the Connections tab:
  - Green badge: count of connected sessions
  - Orange badge: count of connecting/reconnecting sessions
  - Red badge (with pulse animation): count of errored sessions
- Added 6px red alert dot on the Connections tab when errors exist and user is on the Design tab
- Used `.tab-badge` and `.pulse-red` CSS classes from Phase 5

**Impact:** Users can monitor connection health at a glance without switching tabs. Error states are immediately visible via the pulsing red indicator.

---

## Phase 1: Topology Mini-Reference in Connections Tab

**Files modified:**

| File | Change |
|------|--------|
| `src/renderer/types/terminal.ts` | Added `TopologyNodeInfo` interface, `nodeId` to `SSHConnection`, topology fields to `TabContextType` |
| `src/renderer/contexts/TabContext.tsx` | Added topology state (`topologyNodes`, `focusNode`, `setOnFocusNode`), pass `nodeId` when creating connections |
| `src/renderer/App.tsx` | Sync lightweight node list to TabContext via `useEffect`, register viewport-centering handler via `setOnFocusNode` using `reactFlowInstance.setCenter()` |
| `src/renderer/components/ConnectionsTab.tsx` | Added Device Info bar showing originating node color, label, type, and "Show in Design" button |

**Key changes:**
- SSH connections now track which topology node they originated from via `nodeId`
- A Device Info bar appears between the terminal header and terminal area showing:
  - For SSH connections: node color dot, label, type badge, and "Show in Design" button
  - For local terminals: a "Local Terminal" indicator with terminal icon
- "Show in Design" switches to the Design tab and smoothly centers the viewport on the originating node using `reactFlowInstance.setCenter()` with 400ms animation

**Impact:** Eliminates the need to mentally map terminal sessions to topology nodes. Users can navigate directly from a terminal to its corresponding device on the canvas.

---

## Phase 2: StylePanel Decomposition

**Files created:**
- `src/renderer/components/ConnectionConfigPanel.tsx` -- Extracted connection configuration component (~800 lines)

**Files modified:**
- `src/renderer/components/StylePanel.tsx` -- Reduced from ~2735 lines to ~1360 lines

**Extraction boundary:**

Moved to `ConnectionConfigPanel`:
- Connection list with drag-to-reorder
- Connection form (type selector, host/port/username/password, private key, port forwarding)
- Add/edit/delete connection handlers
- Save all changes button with unsaved indicator
- 15+ connection-related state variables
- Migration logic for legacy single-connection format
- Group divider rendering
- Connection display text and badge color helpers

Stays in `StylePanel`:
- Outer panel container, toggle button, internal tab bar
- Property tab: appearance (label, OS, color pickers), description, layer order actions
- Edge styling: line style, routing, markers, color, animation
- Text node styling: font size, color, background, border
- `CollapsibleSection` helper component

**Interface:**
```typescript
interface ConnectionConfigPanelProps {
  selectedNode: Node;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData>) => void;
}
```

**Impact:** StylePanel is now ~50% smaller and focused on visual properties. Connection configuration is isolated in its own component with clear ownership of connection-related state. This separation makes both components easier to maintain and test.

---

## Build Verification

All three build targets pass successfully:
- `npm run build:main` -- TypeScript compilation for main process
- `npm run build:preload` -- TypeScript compilation for preload script
- `npm run build:renderer` -- Webpack production build for React renderer

## Summary of Files Changed

| Category | Files |
|----------|-------|
| **Created** | `styles/theme-vars.css`, `styles/common.css`, `components/StatusIcons.tsx`, `components/ConnectionConfigPanel.tsx`, `docs/ui-ux-implementation-plan.md`, `docs/ui-ux-changes.md` |
| **Modified** | `App.tsx`, `App.css`, `ConnectionsTab.tsx`, `StylePanel.tsx`, `TabBar.tsx`, `EnhancedDeviceNode.tsx`, `GroupNode.tsx`, `KeyboardShortcuts.tsx`, `Toast.tsx`, `SFTPModal.tsx`, `ShapeLibrary.tsx`, `TabContext.tsx`, `types/terminal.ts` |
| **Deleted** | `components/EditNodeModal.tsx` (pre-existing deletion, not part of this change set) |
