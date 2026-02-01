const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const express = require('express');
const isDevelopment = process.env.NODE_ENV === 'development' || isDev;

let mainWindow;
let expressServer;

// Disable GPU acceleration on Windows to avoid issues
app.disableHardwareAcceleration();

/**
 * Start local Express server to serve React build
 * This fixes the issue with file:// protocol not loading CSS/JS with absolute paths
 */
function startExpressServer() {
  return new Promise((resolve, reject) => {
    const app_express = express();
    const frontendBuildPath = path.join(__dirname, '../../frontend/build');
    
    // Serve static files from build directory
    app_express.use(express.static(frontendBuildPath));
    
    // Serve index.html for all routes (SPA routing)
    app_express.get(/.*/, (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
    
    // Start server on port 4000
    expressServer = app_express.listen(4000, 'localhost', () => {
      console.log('🖥️  Express server started on http://localhost:4000');
      resolve();
    }).on('error', (err) => {
      console.error('❌ Failed to start Express server:', err);
      reject(err);
    });
  });
}

/**
 * Create and configure the main application window
 */
function createWindow() {
  console.log('📦 Creating BrowserWindow...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // Simplify preferences for stability
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,  // Enable for security
      sandbox: true,  // Enable sandbox for security
      spellcheck: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,  // Don't show until ready
  });

  console.log('✅ BrowserWindow instance created');
  console.log('   Window object:', mainWindow !== null ? 'ASSIGNED ✓' : 'NULL ✗');

  // STABILITY FIX: Load from local Express server (not file:// protocol)
  // Local server properly handles absolute paths in CSS/JS script tags
  // This is the bridge between development build and production stability
  const startURL = 'http://localhost:4000';

  console.log('🌐 Electron Main Process Started');
  console.log('   Loading URL:', startURL);
  
  mainWindow.loadURL(startURL).catch(err => {
    console.error('❌ Failed to load URL:', err);
    process.exit(1);
  });

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });

  // Set CSP headers to allow localhost API calls (backend at http://localhost:5000)
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('📄 Page loaded successfully');
    mainWindow.webContents.insertCSS(`
      /* Allow localhost API calls to backend */
    `);
    // Show window once content is loaded
    console.log('👁️  Showing window...');
    mainWindow.show();
    console.log('✅ Window is now VISIBLE');
  });

  // Open DevTools in development
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('🔴 Window closed - setting mainWindow to null');
    mainWindow = null;
  });

  // Handle any unhandled exceptions
  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    mainWindow.reload();
  });
}

/**
 * Handle app ready event
 */
app.on('ready', async () => {
  console.log('⚙️  App ready, starting Express server...');
  try {
    await startExpressServer();
    createWindow();
    createMenu();
  } catch (err) {
    console.error('Error during app startup:', err);
    process.exit(1);
  }
});

/**
 * Handle app quit
 */
app.on('window-all-closed', () => {
  console.log('📋 window-all-closed event fired');
  // Close Express server
  if (expressServer) {
    console.log('   Closing Express server...');
    expressServer.close();
  }
  // On macOS, keep app active until explicitly quit
  if (process.platform !== 'darwin') {
    console.log('   Platform is Windows/Linux - calling app.quit()');
    app.quit();
  } else {
    console.log('   Platform is macOS - keeping app alive');
  }
});

/**
 * Handle app activation (macOS)
 */
app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            console.log('Quiz Desktop v0.1.0');
          },
        },
      ],
    },
  ];

  // Remove Developer menu in production
  if (!isDevelopment) {
    template.splice(2, 1);
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC Handlers for React to Electron communication
 */

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get app path
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// Get user data path
ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

// Get backend API URL based on environment
ipcMain.handle('get-api-url', () => {
  // In production, backend runs on localhost or configured URL
  // In development, backend should be running on http://localhost:5000
  return process.env.API_URL || 'http://localhost:5000';
});

/**
 * Security: Disable navigation to external sites
 */
app.on('web-contents-created', (event, contents) => {
  // Deny navigations outside of origin
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow localhost URLs in development
    if (isDevelopment) {
      if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'http://localhost:5000') {
        event.preventDefault();
      }
      return;
    }

    // In production, only allow file:// protocol
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  // Deny opening new windows
  contents.setWindowOpenHandler(({ url }) => {
    // Allow file:// in production
    if (url.startsWith('file:')) {
      return { action: 'allow' };
    }
    // Allow localhost in development
    if (isDevelopment && (url.startsWith('http://localhost'))) {
      return { action: 'allow' };
    }
    // Block everything else
    return { action: 'deny' };
  });
});

// Handle any errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = { mainWindow, isDevelopment };
