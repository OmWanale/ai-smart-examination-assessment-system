const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development' || isDev;
const isPackaged = app.isPackaged;

console.log('🚀 Electron starting...');
console.log('   isDevelopment:', isDevelopment);
console.log('   isPackaged:', isPackaged);

let mainWindow;
let expressServer;
let backendProcess;

// Catch any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit, keep the app running
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, keep the app running
});

// Disable GPU acceleration on Windows to avoid issues
app.disableHardwareAcceleration();

/**
 * Start local Express server to serve React build
 * This fixes the issue with file:// protocol not loading CSS/JS with absolute paths
 */
function startExpressServer() {
  return new Promise((resolve, reject) => {
    const app_express = express();
    
    // Determine frontend build path based on packaging state
    let frontendBuildPath;
    if (isPackaged) {
      // In packaged app, frontend is in resources/frontend-build
      frontendBuildPath = path.join(process.resourcesPath, 'frontend-build');
    } else {
      // In development, use relative path
      frontendBuildPath = path.join(__dirname, '../../frontend/build');
    }
    
    console.log('📁 Frontend build path:', frontendBuildPath);
    console.log('   Path exists:', fs.existsSync(frontendBuildPath));
    
    // Verify build exists
    if (!fs.existsSync(frontendBuildPath)) {
      console.error('❌ Frontend build not found at:', frontendBuildPath);
      reject(new Error('Frontend build not found'));
      return;
    }
    
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
 * Start the backend server (port 5000)
 * In packaged production mode, backend is expected to run externally
 */
function startBackendServer() {
  return new Promise((resolve, reject) => {
    // In packaged mode, don't try to start backend - it should run externally
    if (isPackaged) {
      console.log('📦 Packaged mode - backend should be running externally at http://localhost:5000');
      console.log('   Verifying backend availability...');
      
      // Quick check if backend is running
      const http = require('http');
      const req = http.get('http://localhost:5000/api/health', (res) => {
        console.log('✅ Backend is accessible (status:', res.statusCode, ')');
        resolve();
      });
      req.on('error', (err) => {
        console.warn('⚠️  Backend not accessible at localhost:5000 - app may not work fully');
        console.warn('   Error:', err.message);
        console.warn('   Please ensure backend server is running.');
        // Continue anyway - let user know they need to start backend
        resolve();
      });
      req.setTimeout(3000, () => {
        console.warn('⚠️  Backend check timed out - continuing anyway');
        req.destroy();
        resolve();
      });
      return;
    }
    
    // Development mode - try to start backend
    console.log('🔧 Starting backend server...');
    const backendPath = path.join(__dirname, '../../backend');
    
    // Check if backend directory exists
    const backendServerPath = path.join(backendPath, 'src', 'server.js');
    
    if (!fs.existsSync(backendServerPath)) {
      console.warn('⚠️  Backend server.js not found at:', backendServerPath);
      console.warn('   Assuming backend is running externally');
      resolve();
      return;
    }
    
    // Spawn backend process
    backendProcess = spawn('node', ['src/server.js'], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '5000' },
      shell: true,
    });
    
    let started = false;
    let startupTimeout;
    
    // Set timeout for backend startup
    startupTimeout = setTimeout(() => {
      if (!started) {
        console.warn('⚠️  Backend startup timeout - continuing anyway');
        resolve();
      }
    }, 15000);
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📦 Backend:', output.trim());
      
      // Check if backend started successfully
      if (output.includes('Server running on port') || output.includes('Backend ready')) {
        if (!started) {
          started = true;
          clearTimeout(startupTimeout);
          console.log('✅ Backend server started on port 5000');
          resolve();
        }
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error('📦 Backend Error:', data.toString().trim());
    });
    
    backendProcess.on('error', (err) => {
      console.error('❌ Failed to start backend:', err);
      clearTimeout(startupTimeout);
      // Don't reject - allow app to continue without backend
      resolve();
    });
    
    backendProcess.on('close', (code) => {
      console.log(`📦 Backend process exited with code ${code}`);
      backendProcess = null;
    });
  });
}

/**
 * Create and configure the main application window
 */
function createWindow() {
  console.log('📦 Creating BrowserWindow...');
  // Check for icon (optional)
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const hasIcon = fs.existsSync(iconPath) && fs.statSync(iconPath).size > 100;
  
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
    ...(hasIcon && { icon: iconPath }),
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

  // Open DevTools in development (disabled for now - may cause issues)
  // if (isDevelopment) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('🔴 Window closed - setting mainWindow to null');
    mainWindow = null;
  });

  // Handle any unhandled exceptions
  mainWindow.webContents.on('crashed', () => {
    console.error('🔴 Renderer process crashed');
    mainWindow.reload();
  });

  // Handle renderer process errors and exceptions
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('🔴 Render process gone:', details);
    console.error('   Reason:', details.reason);
    console.error('   Exit code:', details.exitCode);
  });
}

/**
 * Handle app ready event
 */
app.on('ready', async () => {
  console.log('⚙️  App ready, starting servers...');
  try {
    // Start backend first (port 5000)
    await startBackendServer();
    
    // Then start Express server for frontend (port 4000)
    await startExpressServer();
    
    // Finally create the window
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
  
  // Close backend process
  if (backendProcess) {
    console.log('   Stopping backend server...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  
  // Close Express server gracefully
  if (expressServer) {
    console.log('   Closing Express server...');
    expressServer.close();
  }
  
  // Quit on all platforms
  app.quit();
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
 * Handle before-quit to clean up processes
 */
app.on('before-quit', () => {
  console.log('🔴 App is quitting...');
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
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
        ...(isDevelopment ? [{ role: 'toggleDevTools' }] : []),
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
    
    // Allow localhost URLs (Express server at 4000, backend at 5000)
    const allowedOrigins = [
      'http://localhost:4000',  // Express server serving frontend
      'http://localhost:5000',  // Backend API
      'http://localhost:3000',  // Dev server (development only)
    ];
    
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      console.log('🔒 Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  // Deny opening new windows (except localhost)
  contents.setWindowOpenHandler(({ url }) => {
    // Allow localhost URLs
    if (url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    // Block everything else
    console.log('🔒 Blocked window open:', url);
    return { action: 'deny' };
  });
});

// Handle any errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

module.exports = { mainWindow, isDevelopment };
