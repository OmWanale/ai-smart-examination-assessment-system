# Electron Setup Guide

This directory contains the Electron wrapper for the Quiz Desktop application.

## Quick Start

### 1. Install Dependencies

```bash
cd apps/desktop
npm install
```

**Installs:**
- `electron` (27.0.0) - Electron framework
- `electron-builder` (24.6.4) - Build and package Electron apps
- `electron-is-dev` - Detect development mode
- `concurrently` - Run React dev server + Electron together
- `cross-env` - Set NODE_ENV across platforms
- `wait-on` - Wait for dev server before starting Electron

### 2. Development Mode

```bash
npm run electron:dev
```

**What happens:**
- Starts React dev server on http://localhost:3000
- Waits for server to start
- Launches Electron app
- Opens DevTools for debugging
- Hot reload enabled for React code

### 3. Build Production App

#### Windows .exe Installer + Portable

```bash
npm run electron:build:win
```

**Output files in `dist/`:**
- NSIS installers (.exe) - x64 and ia32 versions
- Portable executable (.exe) - no installation needed
- ZIP archive for distribution

#### All Platforms

```bash
npm run electron:build:all
```

**Creates:** Windows, macOS, Linux builds

---

## Architecture

### Main Process (Electron)
- **File:** `public/main.js`
- **Role:** Window management, application lifecycle
- **Runs in:** Node.js environment
- **Capabilities:**
  - Create/manage windows
  - Access filesystem
  - System integration
  - IPC communication

### Preload Script
- **File:** `public/preload.js`
- **Role:** Secure bridge between Electron and React
- **Runs in:** Limited context
- **Exposes:** `window.electron` API

### Renderer Process (React)
- **File:** `apps/frontend/` (CRA)
- **Role:** UI rendering
- **Runs in:** Sandboxed environment
- **Communicates via:** `window.electron` API

---

## Configuration Files

### package.json
```json
{
  "main": "public/main.js",              // Entry point for Electron
  "homepage": "./",                      // Use relative paths for routing
  "scripts": {
    "electron:dev": "...",              // Development mode
    "electron:build:win": "..."         // Build Windows
  },
  "build": {
    // electron-builder configuration
    "appId": "com.quiz-app.desktop",
    "productName": "Quiz Desktop",
    "win": {                            // Windows-specific settings
      "target": ["nsis", "portable"]
    },
    "nsis": {                           // Installer settings
      "oneClick": false,
      "createDesktopShortcut": true
    }
  }
}
```

---

## How It Works

### Development Flow

```
1. npm run electron:dev
   ├─ Start: React dev server (port 3000)
   ├─ Wait: Server ready
   ├─ Start: Electron main.js
   ├─ Load: http://localhost:3000 in Electron
   └─ Open: DevTools
```

### Production Flow

```
1. npm run build (from frontend directory)
   └─ Creates: apps/frontend/build/
   
2. npm run electron:build:win
   ├─ Build React: npm run build
   ├─ Read: apps/frontend/build/
   ├─ Create: Electron app bundle
   └─ Output: dist/*.exe installers
```

### Window Creation

```javascript
// main.js
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  
  // Development: Load dev server
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production: Load built React app
    mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  }
}
```

---

## IPC Communication (Electron ↔ React)

### From React to Electron

```javascript
// In React component
const apiUrl = await window.electron.getApiUrl();
const version = await window.electron.getAppVersion();
```

### From Electron to React

```javascript
// In main.js
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// In preload.js
getAppVersion: () => ipcRenderer.invoke('get-app-version'),
```

---

## Security Implementation

### 1. Context Isolation
```javascript
contextIsolation: true  // Isolate Electron from React
```
- React can't access Node.js directly
- Must use preload script

### 2. Preload Script
```javascript
contextBridge.exposeInMainWorld('electron', electronAPI);
```
- Only safe APIs exposed
- XSS can't access sensitive APIs

### 3. Node Integration Disabled
```javascript
nodeIntegration: false  // No require() in React
```
- Prevents accidental Node.js access

### 4. Sandbox Enabled
```javascript
sandbox: true  // OS-level security
```
- Limits system access

### 5. IPC Validation
- Main process validates all messages
- Only defined handlers allowed

---

## Build Output

### Windows NSIS Installer
- Creates Start Menu entry
- Desktop shortcut option
- Uninstaller included
- Updates capable

### Portable Executable
- Single .exe file
- No installation needed
- Runs from any location
- USB portable

### ZIP Distribution
- Easy HTTP distribution
- Lightweight
- Unzip to run

---

## Environment Setup (First Time)

### Windows Prerequisites

1. **Visual Studio Build Tools** (for node-gyp)
   ```bash
   # Download from Microsoft
   # Or install: npm install --global windows-build-tools
   ```

2. **Python 3.x** (optional, for build tools)
   ```bash
   python --version
   ```

### Verify Installation

```bash
node --version      # >= 14.0
npm --version       # >= 6.0
electron --version  # Should be installed after npm install
```

---

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development:**
   ```bash
   npm run electron:dev
   ```

3. **Test the app:**
   - Navigate between pages
   - Check that frontend works as expected
   - Open DevTools (F12)
   - Check console for errors

4. **Build for distribution:**
   ```bash
   npm run electron:build:win
   ```

5. **Distribute:**
   - Share .exe from `dist/` folder
   - Users can install or run portable version

---

## Troubleshooting

### "Cannot find module 'electron'"
```bash
npm install
```

### "React dev server not responding"
- Ensure `apps/frontend` running `npm start`
- Check port 3000 is not blocked
- Increase wait timeout in package.json scripts

### "Blank Electron window"
- Check DevTools console for errors
- Verify React app loads on http://localhost:3000
- Check preload.js path is correct

### Windows build fails
- Install Visual Studio Build Tools
- Run `npm install` in apps/desktop
- Delete node_modules and reinstall

---

## Useful Commands

```bash
# Development
npm run electron:dev              # Start dev mode

# Building
npm run electron:build:win        # Windows only
npm run electron:build            # All platforms
npm run build                     # Rebuild React first

# Debugging
npm run electron:dev              # With DevTools open
# Press Ctrl+Shift+I to toggle DevTools
# Press Ctrl+R to reload
# Press Ctrl+Q to quit

# Cleaning
rm -r dist                        # Remove build output
rm -r node_modules                # Clean install
npm install                       # Reinstall
```

---

## Resources

- [Electron Main Docs](https://www.electronjs.org/docs/api/app)
- [electron-builder Docs](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [IPC Communication](https://www.electronjs.org/docs/api/ipc-main)

