# Native Terminal Performance Alternatives

## Overview

The current Electron + xterm.js architecture has inherent performance limitations due to IPC overhead. This document explores two alternative approaches to achieve native-like terminal performance.

---

## Current Architecture Limitations

| Aspect | Electron + xterm.js | Native Terminals |
|--------|---------------------|------------------|
| Process model | Multi-process (IPC) | Single process |
| Latency | 5-15ms | 0.5ms |
| Memory | ~100-200MB | ~10-30MB |
| Rendering | WebGL (GPU) | Direct GPU |
| Data path | SSH → Node.js → IPC → Chromium → xterm.js | SSH → PTY → Direct render |

---

## Option 1: Tauri + Rust Terminal

### Overview

[Tauri](https://tauri.app/) is an Electron alternative using Rust for the backend and the system's native WebView for rendering. Combined with a Rust-based terminal like [Alacritty](https://github.com/alacritty/alacritty), it can achieve near-native performance.

### Architecture

```
┌─────────────────────────────────────────┐
│         Rust Backend (Tauri)            │
│  - SSH via russh crate                  │
│  - Direct PTY handling                  │
│  - Zero-copy data passing               │
└──────────────┬──────────────────────────┘
               │ (Native bridge, no serialization)
┌──────────────▼──────────────────────────┐
│    System WebView (Edge/WebKit/GTK)     │
│  - Lightweight (~5MB vs Chromium 80MB)  │
│  - Native GPU acceleration              │
└─────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology | Benefit |
|-----------|------------|---------|
| Backend | Rust | Memory safety, speed |
| SSH | `russh` crate | Native SSH implementation |
| Terminal render | `alacritty_terminal` | GPU-accelerated VTE |
| IPC | Tauri Commands | Near-zero overhead |
| Frontend | React/Vue/Svelte | Reuse existing code |

### Migration Effort

| Task | Effort | Notes |
|------|--------|-------|
| Learn Rust basics | 2-4 weeks | For backend development |
| Set up Tauri project | 1 day | CLI scaffolding |
| Migrate React UI | 1-2 weeks | WebView compatible |
| Implement SSH in Rust | 2-4 weeks | Using russh crate |
| Terminal rendering | 2-4 weeks | Integrate alacritty_terminal or custom |
| **Total** | **2-3 months** | For experienced developer |

### Pros & Cons

**Pros:**
- ✅ 10-50x faster than Electron
- ✅ 10x smaller binary size (~10MB vs ~100MB)
- ✅ Lower memory footprint
- ✅ True native performance
- ✅ Can reuse React/TypeScript for UI

**Cons:**
- ❌ Requires Rust knowledge
- ❌ Smaller ecosystem than Electron
- ❌ More complex build pipeline
- ❌ WebView quirks across platforms

### Getting Started

```bash
# Install Tauri CLI
npm install -g @tauri-apps/cli

# Add to existing React project
npx tauri init

# Rust SSH library
# In Cargo.toml: russh = "0.42"
```

---

## Option 2: Native Node.js Addon (node-pty)

### Overview

Use native Node.js addons written in C++/Rust to handle PTY directly, bypassing JavaScript for performance-critical paths. This keeps Electron but uses native code for terminal operations.

### Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌──────────────────────────────────┐   │
│  │  Native Addon (C++/Rust NAPI)    │   │
│  │  - node-pty for local PTY        │   │
│  │  - libssh2 bindings for SSH      │   │
│  │  - Direct buffer passing         │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ IPC (still required, but optimized)
┌──────────────▼──────────────────────────┐
│         Renderer (xterm.js)             │
│  - Receives binary data                 │
│  - WebGL rendering                      │
└─────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology | Benefit |
|-----------|------------|---------|
| Local PTY | `node-pty` | Native PTY handling |
| SSH | `libssh2` via N-API | Native SSH performance |
| Build | `node-gyp` or `napi-rs` | Node.js native addons |
| Rendering | xterm.js (unchanged) | No UI changes |

### Implementation Options

#### A) node-pty (Local terminals only)
```bash
npm install node-pty
```
```typescript
import * as pty from 'node-pty';

const shell = pty.spawn('bash', [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
});

shell.onData((data) => {
  // Send to renderer - native speed
});
```

#### B) Native SSH with napi-rs (Rust → Node.js)
```rust
// src/lib.rs - using napi-rs
use napi_derive::napi;
use russh::*;

#[napi]
pub async fn connect_ssh(host: String, user: String, password: String) -> Result<SshSession> {
    // Native Rust SSH implementation
}
```

### Migration Effort

| Task | Effort | Notes |
|------|--------|-------|
| Add node-pty for local | 1 day | Drop-in for local terminals |
| Build native SSH module | 2-3 weeks | Using napi-rs + russh |
| Integrate with existing | 1 week | Replace ssh2.js calls |
| **Total** | **3-4 weeks** | Keeps Electron architecture |

### Pros & Cons

**Pros:**
- ✅ Keep existing Electron + React codebase
- ✅ Incremental migration possible
- ✅ 2-5x faster for PTY operations
- ✅ Mature libraries (node-pty widely used)
- ✅ TypeScript types available

**Cons:**
- ❌ IPC overhead still exists
- ❌ Build complexity (native compilation)
- ❌ Platform-specific binaries
- ❌ Less improvement than full Tauri rewrite

---

## Recommendation Matrix

| Scenario | Recommended Approach |
|----------|---------------------|
| "Performance is critical, willing to rewrite" | Tauri + Rust |
| "Want faster terminals but keep Electron" | Native Node.js addon |
| "Good enough performance, minimize effort" | Keep current (Electron + xterm.js) |
| "SSH performance specifically" | Native SSH addon (napi-rs) |

---

## Performance Comparison (Estimated)

| Metric | Current | Native Addon | Tauri |
|--------|---------|--------------|-------|
| Input latency | 10-20ms | 5-10ms | 1-3ms |
| Throughput | 5-10 MB/s | 15-30 MB/s | 50+ MB/s |
| Memory | 150MB | 120MB | 30MB |
| Binary size | 100MB | 105MB | 15MB |

---

## Resources

### Tauri
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [russh SSH crate](https://docs.rs/russh/)
- [Alacritty terminal crate](https://crates.io/crates/alacritty_terminal)

### Native Addons
- [node-pty](https://github.com/microsoft/node-pty)
- [napi-rs (Rust → Node.js)](https://napi.rs/)
- [libssh2 Node bindings](https://github.com/nicktimko/node-libssh2)

---

*Last Updated: 2025-12-16*
