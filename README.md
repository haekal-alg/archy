# Archy - Visual Network Architecture Tool

A desktop application that combines network architecture visualization with seamless remote access capabilities. Design your network topology and connect to devices with a single click.

## Features

- **Visual Diagramming**: Drag-and-drop interface to create network architecture diagrams
- **One-Click Remote Access**:
  - RDP for Windows machines
  - SSH for Linux boxes
- **Credential Management**: Store connection credentials securely within each device node
- **Save/Load Diagrams**: Persist your network architectures and load them anytime
- **Interactive Canvas**: Pan, zoom, and arrange your network layout
- **Multiple Device Types**: Support for Windows, Linux, and generic devices

## Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run the application
npm start
```

## Usage

### Creating Your Network Diagram

1. **Add Devices**: Click the toolbar buttons to add Windows, Linux, or Generic devices
2. **Position Devices**: Drag devices around the canvas to arrange your architecture
3. **Connect Devices**: Click and drag from one device's handle to another to create connections
4. **Edit Device Properties**: Double-click any device to configure:
   - Label/Name
   - IP Address/Host
   - Port number
   - Username
   - Password

### Connecting to Devices

1. Double-click a device to open the edit modal
2. Click **"Connect Now"** to immediately launch:
   - **RDP connection** for Windows devices (via `mstsc`)
   - **SSH connection** for Linux devices (opens in terminal)

### Saving Your Work

- Click **Save** in the toolbar to save your diagram
- Click **Load** to restore a previously saved diagram
- Click **Clear** to start fresh

## Architecture

- **Electron**: Cross-platform desktop application
- **React**: UI framework
- **React Flow**: Visual diagramming library
- **Electron Store**: Secure local storage for diagrams
- **SSH2**: SSH connection handling
- **Windows RDP**: Native mstsc integration

## Security Notes

- Credentials are stored locally using electron-store
- For production use, consider implementing encryption for stored credentials
- The current implementation stores passwords in plain text for convenience
- Recommended for use in secure, trusted environments only

## Platform Support

### Windows
- RDP connections use native `mstsc` command
- Credentials are temporarily stored using `cmdkey`

### Linux/Mac
- SSH connections open in system terminal
- May require `sshpass` utility for password authentication

## Development

```bash
# Start development server
npm run dev

# Build main process
npm run build:main

# Build renderer process
npm run build:renderer

# Package application
npm run package
```

## Project Structure

```
archy/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main entry point
│   │   └── preload.ts  # Preload script for IPC
│   └── renderer/       # React application
│       ├── components/ # React components
│       ├── App.tsx     # Main app component
│       └── index.tsx   # React entry point
├── dist/              # Compiled output
└── package.json
```

## Future Enhancements

- Credential encryption at rest
- Multiple diagram workspaces
- Export diagrams as images
- Network scanning/discovery
- SSH key authentication
- VNC support
- Connection history/favorites
- Team collaboration features

## License

ISC
