# Changelog - Branch: terminal-emulator

All notable changes to this project in the `terminal-emulator` branch will be documented in this file.

## [Unreleased] - 2025-01-XX

### Added

#### Session Persistence
- **Auto-load Last Session**: Application now automatically loads the last opened diagram file on startup
  - Backend: Added `get-last-session` IPC handler in `main.ts`
  - Frontend: Added automatic session loading on app mount in `App.tsx`
  - File path persistence using electron-store
  - Seamless workflow - pick up right where you left off

#### UI/UX Improvements - Active Connections Panel
- **Unified Design System**: Active connections side panel now matches Design tab StylePanel aesthetic
  - **Width**: Increased from 300px to 320px for consistency
  - **Background**: Solid `#151923` background (removed glassmorphic effects)
  - **Border**: Clean `#3a4556` border
  - **Typography**:
    - Header: 14px, font-weight 600
    - Connection names: 11px, font-weight 600
    - Details: 10px monospace
  - **Transitions**: Smooth `0.3s ease` animations
  - **Border Radius**: Consistent 4px across all elements

- **Improved Side Panel Animation**
  - Removed opacity fade animation (eliminated white flash on minimize)
  - Clean slide-in/slide-out using width transition only
  - Smooth 320px panel width animation

- **Subtle Disconnect Button**
  - Changed from prominent red to discrete gray (`#303948`)
  - Only shows red on hover for clear action feedback
  - Reduced size from 20px to 18px
  - Better visual hierarchy

#### Terminal Connection Improvements
- **Loading Spinner**: Added professional spinning loader during connection establishment
  - Animated blue circular spinner using theme colors (`#4d7cfe`)
  - Clear "Connecting to {host}..." status message
  - CSS @keyframes animation for smooth rotation
  - Better user feedback during connection process

#### UI Cleanup
- **Removed Redundant Connection Indicator**: Eliminated status indicator beside zoom controls in terminal header
  - Status already visible in side panel
  - Cleaner, less cluttered terminal header
  - Focus on essential controls only

### Changed

#### Styling & Theme Consistency
- **Color Palette Standardization**:
  - Primary background: `#151923`
  - Secondary background: `#1e2433`
  - Tertiary background: `#252d3f`
  - Card backgrounds: Inactive `#252d3f`, Active `#1e2433`
  - Hover state: `#303948`
  - Active border: `#4d7cfe` (blue accent)
  - Text primary: `#e8ecf4`
  - Text secondary: `#b4bcc9`
  - Text tertiary: `#8892a6`

- **Button Styles**:
  - Clear Disconnected: `#ff5c5c` background with uppercase text
  - Border radius: 4px across all buttons
  - Consistent hover transitions: `all 0.2s ease`

- **Connection Cards**:
  - Simplified border and background (removed gradients)
  - Cleaner status indicators (solid dots instead of glowing)
  - Better monospace font display for connection details
  - Improved error message styling

### Technical Details

#### File Structure Changes
```
src/
├── main/
│   ├── main.ts (Added get-last-session handler, session persistence)
│   └── preload.ts (Added getLastSession API)
├── renderer/
│   ├── App.tsx (Added auto-load session on mount)
│   ├── types.d.ts (Added getLastSession type definition)
│   └── components/
│       ├── ConnectionsTab.tsx (Redesigned styling, added spinner)
│       └── StylePanel.tsx (Reference implementation)
```

#### API Additions
- `window.electron.getLastSession()`: Retrieves and loads the last opened file
- electron-store key: `lastOpenedFile` - Stores path to most recent diagram

### Previous Features (Earlier in Branch)

#### Terminal Emulator
- Revamped active connection side panel
- Dynamic terminal zooming support
- Persistent terminal context across sessions
- Smooth animations for panel transitions

#### Bug Fixes
- Fixed space handling issues in terminal
- Fixed dynamic zooming behavior
- Various packaging updates

---

## Version Information

**Branch**: `terminal-emulator`
**Base Branch**: `main`
**Status**: In Development
**Last Updated**: 2025-01-XX

## Migration Notes

When merging this branch:
1. Ensure electron-store is properly initialized
2. First-time users will see empty canvas (no previous session)
3. Session auto-load only triggers on clean app startup
4. All styling changes are backward compatible

## Dependencies

No new dependencies added in this update. Uses existing:
- electron-store (for session persistence)
- Existing theme system from `src/theme.ts`

---

*For questions or issues related to these features, please refer to the project documentation or create an issue.*
