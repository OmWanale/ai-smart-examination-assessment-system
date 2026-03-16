# Electron Desktop Wrapper

Quiz Desktop Application - Electron wrapper for the React quiz app.

## Directory Structure

```
apps/desktop/
├── package.json              # Electron app configuration + build config
├── public/
│   ├── main.js              # Electron main process
│   └── preload.js           # Secure preload script for IPC
├── build/                   # React build output (created during build)
├── dist/                    # Electron build output (created after build)
└── assets/                  # Application icons and resources
    ├── icon.png             # App icon
    ├── icon.ico             # Windows icon
    └── icon.icns            # macOS icon (optional)
```

## Development

### Start Development Mode

```bash
cd apps/desktop

# Install dependencies (first time only)
npm install

# Start dev server (runs React dev server + Electron together)
npm run electron:dev
```

This command:
1. Starts React dev server on `https://classyn-ai.onrender.com`
2. Waits for dev server to be ready
3. Launches Electron pointing to dev server
4. Opens DevTools automatically

Changes to React code will hot-reload in the Electron window.

## Building

### Build for Windows

```bash
cd apps/desktop

# Build and create Windows installer + portable exe
npm run electron:build:win
```

Output files in `dist/`:
- `Quiz Desktop-0.1.0-x64.exe` - NSIS installer (x64)
- `Quiz Desktop-0.1.0-ia32.exe` - NSIS installer (x86)
- `Quiz Desktop-0.1.0-portable.exe` - Portable exe (no installation)
- `Quiz Desktop-0.1.0-x64.zip` - Portable zip

### Build for All Platforms

```bash
npm run electron:build:all
```

Builds for macOS, Windows, and Linux.

## Configuration

### Main Process (main.js)

- Handles window creation and lifecycle
- Provides IPC handlers for React to communicate with Electron
- Implements security best practices:
  - `contextIsolation: true` - Isolate context
  - `nodeIntegration: false` - No Node.js in renderer
  - `sandbox: true` - Enable sandboxing
  - Preload script validation

### Preload Script (preload.js)

- Exposes safe APIs to React via `window.electron`
- Uses `contextBridge` to securely communicate
- Available APIs:
  - `getAppVersion()` - Get app version
  - `getAppPath()` - Get app installation path
  - `getUserDataPath()` - Get user data directory
  - `getApiUrl()` - Get backend API URL
  - `getSystemInfo()` - Get system information

### Build Configuration (package.json)

Electron-builder settings:
- **Windows targets**:
  - NSIS installer (x64 + ia32)
  - Portable executable
  - ZIP distribution
- **Installation**: Creates Start Menu and Desktop shortcuts
- **Code signing**: Configured for certificates (optional)

## Environment Variables

Set in `.env` or when running npm commands:

```bash
# Backend API URL (default: https://classyn-ai.onrender.com)
API_URL=http://api.example.com

# Development mode (auto-detected)
NODE_ENV=development
```

## Usage from React

### Access Electron API in React Components

```javascript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    // Call electron API exposed via preload
    window.electron.getAppVersion().then(version => {
      setAppVersion(version);
    });
  }, []);

  return <div>App Version: {appVersion}</div>;
}
```

### Get Backend API URL

```javascript
const apiUrl = await window.electron.getApiUrl();
// Use in axios config
const api = axios.create({
  baseURL: apiUrl,
});
```

## Security Features

### Context Isolation
- React app runs in isolated context with limited access
- Can't access Node.js modules directly
- Must use preload script to communicate

### Node Integration Disabled
- Can't require/import Node modules from React
- Prevents injection attacks

### Sandbox Enabled
- Additional OS-level security
- Restricts what renderer process can do

### IPC Validation
- Main process validates all IPC messages
- Only safe APIs exposed to React

### Navigation Control
- Blocks navigation to external sites (except localhost in dev)
- Prevents opening new windows unexpectedly

## Troubleshooting

### Electron not starting

1. Ensure React dev server is running on port 3000
2. Check that main.js exists at `apps/desktop/public/main.js`
3. Verify Node.js version >= 14.x

### Build errors

1. Run `npm install` to ensure all dependencies are installed
2. Delete `node_modules/` and reinstall: `npm ci`
3. Check electron-builder configuration in package.json

### Production build issues

1. React app must be built first: `npm run build`
2. Build output must be in `apps/frontend/build/`
3. Verify paths in main.js point to correct build directory

## Next Steps

1. Install platform-specific build tools:
   - Windows: Install Visual Studio Build Tools or Python
   - macOS: Install Xcode Command Line Tools
   - Linux: Install build-essential

2. Add icons:
   - Place icon.png in `apps/desktop/assets/`
   - Generate Windows icon (icon.ico)
   - Generate macOS icon (icon.icns)

3. Configure code signing (optional but recommended for production)

4. Test on different Windows versions before distribution

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [electron-builder](https://www.electron.build/)
- [IPC (Inter-Process Communication)](https://www.electronjs.org/docs/api/ipc-main)

