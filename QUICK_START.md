# Archy - Quick Start Guide

## What You Just Built

You now have a fully functional **Visual Network Architecture Tool** that combines:
- Interactive network diagram creation
- One-click RDP/SSH connections
- Secure credential storage
- Diagram save/load functionality

## Running the Application

### First Time Setup
```bash
# Install dependencies (already done)
npm install

# Build the application
npm run build

# Start the application
npm start
```

### Development Mode
```bash
# For development with live reload
npm run dev
```

## Using Archy

### 1. Create Your Network Diagram

**Add Devices:**
- Click "Windows" button to add a Windows machine
- Click "Linux" button to add a Linux server
- Click "Generic" for any other device type

**Arrange Your Topology:**
- Drag devices around the canvas
- Click and drag from a device's connection point to another to create network connections
- Use mouse wheel to zoom in/out
- Click and drag on empty space to pan

### 2. Configure Device Credentials

**Edit a Device:**
1. Double-click any device node
2. Fill in the details:
   - **Label**: Friendly name (e.g., "Web Server")
   - **Type**: Windows (RDP) / Linux (SSH) / Generic
   - **Host**: IP address or hostname
   - **Port**: 3389 for RDP, 22 for SSH
   - **Username**: Login username
   - **Password**: Login password

### 3. Connect to Your Devices

**Two Ways to Connect:**

**Option 1: From Edit Modal**
1. Double-click a device
2. Click "Connect Now" button
3. Connection launches immediately

**Option 2: Quick Connect**
- Configure device first
- Double-click to open modal
- Click "Connect Now"

### 4. Save Your Work

**Save Diagram:**
1. Click "Save" in the toolbar
2. Enter a name for your diagram
3. Your diagram and ALL credentials are saved locally

**Load Diagram:**
1. Click "Load" in the toolbar
2. See list of available diagrams
3. Enter the name to load

**Clear Canvas:**
- Click "Clear" to start fresh
- Confirms before deleting

## How Connections Work

### Windows (RDP)
- Uses Windows built-in `mstsc` (Remote Desktop Connection)
- Automatically stores credentials using `cmdkey`
- Launches fullscreen RDP session

### Linux (SSH)
- Opens a new terminal window
- Establishes SSH connection on specified port
- On Windows, uses `cmd` with `plink` or similar
- On Linux/Mac, uses native terminal

## Features Overview

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Intuitive diagram creation |
| **Auto-Connect** | One-click remote access |
| **Credential Storage** | Securely saved locally |
| **Multiple Protocols** | RDP and SSH support |
| **Save/Load** | Persistent diagram storage |
| **Visual Indicators** | Color-coded device types |
| **Mini Map** | Navigate large diagrams |
| **Zoom & Pan** | Flexible canvas control |

## Security Notes

⚠️ **Important Security Information:**

- Credentials are stored **locally** on your machine
- Uses `electron-store` for persistent storage
- **Passwords are currently stored in plain text**
- Recommended for **trusted environments only**

### For Production Use:
Consider implementing:
- Password encryption at rest
- Master password protection
- SSH key authentication
- Windows Credential Manager integration

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Double-click node** | Edit device properties |
| **Drag node** | Move device |
| **Drag from handle** | Create connection |
| **Mouse wheel** | Zoom in/out |
| **Click + drag canvas** | Pan view |
| **Delete key** | Remove selected items |

## Troubleshooting

### RDP Connection Fails
- Ensure Windows machine has RDP enabled
- Check firewall rules allow port 3389
- Verify correct IP address and credentials
- Ensure remote desktop is enabled on target

### SSH Connection Fails
- Verify SSH service is running on target
- Check firewall rules allow port 22 (or custom port)
- Confirm username and password are correct
- On Windows, ensure SSH client is installed

### Application Won't Start
```bash
# Rebuild from scratch
npm run build
npm start
```

### Diagram Won't Save
- Check you have write permissions
- Ensure enough disk space
- Try a different diagram name

## Example Use Cases

### 1. Home Lab Documentation
- Map your home servers and workstations
- Store all connection credentials in one place
- Quick access to all your machines

### 2. Client Infrastructure
- Document client network topology
- Maintain connection details securely
- Fast troubleshooting access

### 3. Test Environments
- Map test/staging/prod environments
- Store credentials for each environment
- Visual representation of architecture

### 4. Learning Environment
- Document your learning setup
- Practice network design
- Easy access to VMs and containers

## Advanced Tips

### Organizing Large Networks
- Use clear, descriptive labels
- Group related systems together
- Use connections to show relationships
- Save multiple views as different diagrams

### Connection Management
- Test credentials before saving
- Update passwords regularly
- Keep backup of diagram files

### Workflow Integration
- Save diagrams with project names
- Export diagrams (screenshot for documentation)
- Share topology designs (without credentials)

## Next Steps

1. **Try it out**: Add your first device and connect
2. **Build your network**: Create a complete architecture diagram
3. **Customize**: Modify colors, add more device types
4. **Enhance**: Add encryption, SSH keys, more protocols

## Need Help?

- Check the main [README.md](README.md) for technical details
- Review the project structure in the source code
- Modify components in `src/renderer/components/`
- Extend functionality in `src/main/main.ts`

## What's Next?

Consider adding:
- VNC support
- SSH key authentication
- Network device support (switches, routers)
- Ping/connectivity testing
- Connection history
- Export diagrams as PNG/SVG
- Team collaboration features
- Cloud storage sync

---

**You're all set!** Start building your network architecture and connecting to your machines with a single click.
