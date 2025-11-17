<div align="center">
  <img src="build/icon.png" alt="Archy Logo" width="120"/>
  <h1>Archy</h1>
  <p><strong>Visual Network Architecture Tool</strong></p>
  <p>Design your network topology and connect to devices with a single click</p>
</div>

---

## What is Archy?

Archy is a desktop application that makes managing your network infrastructure easy. Draw your network diagram, store connection details, and connect to any device with just a click. No more hunting for IP addresses or remembering which credentials go where.

## Why Use Archy?

**Stop juggling spreadsheets and sticky notes.** Archy keeps your network documentation and access tools in one place.

### Key Features

- **Drag-and-Drop Diagramming** - Build your network map visually
- **One-Click Connections** - Click to open RDP or SSH sessions instantly
- **Built-in Credential Storage** - Save usernames and passwords with each device
- **Save Your Work** - Load your diagrams anytime you need them
- **Multi-Platform** - Works on Windows, Mac, and Linux

## Quick Start

```bash
npm install      # Install dependencies
npm run build    # Build the application
npm start        # Launch Archy
```

That's it! The application window will open and you're ready to start building your network diagram.

## How to Use

### Building Your Network Map

1. **Add devices** using the toolbar buttons (Windows, Linux, or Generic)
2. **Drag devices** around the canvas to arrange them
3. **Connect devices** by clicking and dragging from one device to another
4. **Double-click a device** to edit its properties:
   - Name/Label
   - IP address or hostname
   - Port number
   - Login credentials

### Connecting to Devices

Double-click any device and hit **"Connect Now"**:
- **Windows devices** → Opens RDP session automatically
- **Linux devices** → Opens SSH in your terminal

### Managing Your Diagrams

- **Save** - Store your current diagram
- **Load** - Open a previously saved diagram
- **Clear** - Start over with a blank canvas

## Important Security Information

**Please read this before using Archy:**

- Credentials are stored on your local machine in **plain text**
- This is designed for convenience in **trusted, secure environments**
- Not recommended for production or shared systems
- Future versions will include encryption options

**Use Archy responsibly** - only in environments where you control physical and network access.

## Platform Notes

**Windows**
- RDP connections use the built-in `mstsc` command
- Works out of the box, no additional setup needed

**Mac/Linux**
- SSH connections open in your default terminal
- May need to install `sshpass` for password authentication

## Built With

- **Electron** - Cross-platform desktop framework
- **React** - User interface
- **React Flow** - Visual diagramming engine
- **Electron Store** - Local data persistence

## For Developers

```bash
npm run dev              # Start development mode
npm run build:main       # Compile main process
npm run build:renderer   # Compile UI
npm run package          # Create distributable
```

## Roadmap

Here's what's coming next:

- [ ] Encrypted credential storage
- [ ] Multiple diagram tabs
- [ ] Export diagrams as PNG/SVG
- [ ] Network device discovery
- [ ] SSH key-based authentication
- [ ] VNC protocol support
- [ ] Connection history and favorites

## License

ISC
