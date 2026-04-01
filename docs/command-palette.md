# Command Palette

The Command Palette provides quick access to devices on the canvas and their actions. It is a Spotlight-style floating panel with glassmorphism styling.

## Opening

- **Keyboard**: `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS) toggles the palette
- **Menu**: View > Command Palette

The search input auto-focuses on open.

## Visual Layout

The palette is a 580px-wide floating panel centered horizontally, positioned 14vh from the top. It sits on a dimmed full-screen backdrop.

```
+--------------------------------------------------+
|  [chip]  [magnifying glass]  Search...     [ESC]  |  Search input
|--------------------------------------------------|
|  [All]  [Network]  [Compute]  [Cloud]  [Security]|  Category chips
|--------------------------------------------------|
|  [icon]  Device Name                          >   |  Result rows
|          type . ip address                        |
|  [icon]  Device Name                          >   |
|          type . ip address                        |
|--------------------------------------------------|
|  up/down navigate   Enter select   Esc close      |  Footer hints
+--------------------------------------------------+
```

### Panel Styling

- **Background**: `rgba(25, 30, 42, 0.82)` with `backdrop-filter: blur(40px) saturate(150%)`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`, 20px border-radius
- **Shadow**: Multi-layered (`0 24px 80px rgba(0,0,0,0.5)`)
- **Font**: SF Pro / Segoe UI system font stack

### Search Input

A pill-shaped container (`border-radius: 12px`) with translucent background containing:
- Magnifying glass icon (left)
- Text input (15px, placeholder: "Search devices...")
- ESC keyboard badge (right)

### Category Chips

Horizontal row of pill-shaped filter buttons. The active chip has a blue tint with an inset border. Categories:

| Chip | Device Types |
|------|-------------|
| All | Everything (default) |
| Network | router, switch, firewall |
| Compute | server, desktop, laptop, linux, windows, mobile |
| Cloud | cloud, cloud2, database |
| Security | attacker |

Chips are hidden when in action mode.

### Result Rows

Each row displays:
- Device icon in a 36x36px rounded container
- Device name (13px, medium weight)
- Subtitle: type and IP/host separated by a dot
- Chevron arrow on the right

The selected row has a blue accent bar (3px) on the left edge and a blue-tinted background.

## Flow

The palette operates in two modes with a two-level navigation pattern.

### Mode 1: Device List (default)

On open, all `enhanced` device nodes from the canvas are listed. Users can:

- **Type to search** -- filters by name, type, IP address, host, or description (case-insensitive substring)
- **Click a category chip** -- filters by device type
- **Arrow Up/Down** -- moves selection highlight
- **Mouse hover** -- also moves selection highlight
- **Enter or Click** -- selects the device, enters action mode
- **Esc or click backdrop** -- closes the palette

The selection resets to the first item when the query, category, or mode changes.

### Mode 2: Action Menu (after selecting a device)

After selecting a device:
- Category chips disappear
- A **device pill chip** (icon + name, blue-tinted) appears inside the search input
- Placeholder changes to "Select action..."
- Results list shows available actions:

| Action | Icon | Condition |
|--------|------|-----------|
| Show in Design | Magnifying glass | Always available |
| Connect SSH | Terminal prompt | Only if device has a `host` |
| Connect RDP | Monitor | Only if device has a `host` |

Navigation in action mode:
- **Arrow keys / hover** -- navigate actions
- **Enter or Click** -- execute the action (palette closes)
- **Esc** -- go back to device list (does not close)
- **Backspace** (empty input) -- also goes back to device list

### What the Actions Do

- **Show in Design** -- switches to the Design tab, zooms/pans the canvas to the node, selects it, opens the style panel
- **Connect SSH** -- creates an SSH connection tab using the node's credentials (host, port, username, password), switches to the Connections tab
- **Connect RDP** -- launches an RDP session via `cmdkey`/`mstsc` (Windows) using the node's credentials

## Data Searched

Only `enhanced` type nodes are included. Group nodes and text annotations are excluded. The search matches against five fields from `EnhancedDeviceData`:

- `label` (device name)
- `type` (device type, e.g. "server")
- `ipAddress`
- `host`
- `description`

## Key Files

- `src/renderer/components/CommandPalette.tsx` -- Component implementation
- `src/renderer/App.tsx` -- Keyboard shortcut handler and action callbacks
- `src/renderer/components/TitleBar.tsx` -- Menu entry (View > Command Palette)
