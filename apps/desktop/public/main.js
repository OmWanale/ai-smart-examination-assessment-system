const { app, BrowserWindow, Menu, ipcMain, session } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs');

// ─── Configuration ─────────────────────────────────────────────
const CLOUD_BACKEND = 'https://classyn-ai.onrender.com';
const CLOUD_API     = `${CLOUD_BACKEND}/api`;
const isDevelopment = process.env.NODE_ENV === 'development' || isDev;
const isPackaged    = app.isPackaged;

console.log('🚀 Electron starting...');
console.log('   isDevelopment:', isDevelopment);
console.log('   isPackaged:', isPackaged);
console.log('   Cloud backend:', CLOUD_BACKEND);

let mainWindow;

// ─── Global error handlers ─────────────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Disable GPU acceleration on Windows to avoid rendering issues
app.disableHardwareAcceleration();

// ─── Resolve path to frontend build ────────────────────────────
function getFrontendBuildPath() {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'frontend-build');
  }
  return path.join(__dirname, '../../frontend/build');
}

// ─── Create the main application window ────────────────────────
function createWindow() {
  const frontendBuildPath = getFrontendBuildPath();
  const indexPath = path.join(frontendBuildPath, 'index.html');

  console.log('📁 Frontend build path:', frontendBuildPath);
  console.log('   index.html exists:', fs.existsSync(indexPath));

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Frontend build not found at:', frontendBuildPath);
    console.error('   Run "npm run build" in apps/frontend first.');
    app.quit();
    return;
  }

  // Optional icon
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const hasIcon = fs.existsSync(iconPath) && fs.statSync(iconPath).size > 100;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
    ...(hasIcon && { icon: iconPath }),
    show: false,
  });

  // ── Load the production build using file:// protocol ────────
  console.log('🌐 Loading frontend from:', indexPath);
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('❌ Failed to load index.html:', err);
  });

  // Handle SPA client-side routing
  // When React Router navigates, Electron may try to load a file path.
  // Intercept and redirect back to index.html.
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn('⚠️ did-fail-load:', errorCode, errorDescription, validatedURL);
    // ERR_FILE_NOT_FOUND = -6, happens with client-side routes
    if (errorCode === -6) {
      console.log('   Redirecting to index.html (SPA routing)');
      mainWindow.loadFile(indexPath);
    }
  });

  // Show window once content is ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('📄 Page loaded successfully');
    mainWindow.show();
    console.log('✅ Window is now VISIBLE');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle crashes
  mainWindow.webContents.on('crashed', () => {
    console.error('🔴 Renderer process crashed - reloading');
    mainWindow.loadFile(indexPath);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('🔴 Render process gone:', details.reason, 'exit:', details.exitCode);
  });
}

// ─── App ready ─────────────────────────────────────────────────
app.on('ready', () => {
  console.log('⚙️  App ready');

  // Set CSP to allow cloud backend API calls
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self' file: data:",
            `connect-src 'self' ${CLOUD_BACKEND} ${CLOUD_API}`,
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
          ].join('; '),
        ],
      },
    });
  });

  createWindow();
  createMenu();
});

// ─── App lifecycle ─────────────────────────────────────────────
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─── Application menu ──────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
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
          click: () => console.log('AI Smart Exam System v' + app.getVersion()),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC Handlers ──────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));
ipcMain.handle('get-api-url', () => CLOUD_BACKEND);

// ─── Security ──────────────────────────────────────────────────
app.on('web-contents-created', (_event, contents) => {
  // Block navigation away from the app
  contents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);

      const isAllowed =
        parsedUrl.protocol === 'file:' ||
        navigationUrl.startsWith(CLOUD_BACKEND);

      if (!isAllowed) {
        console.log('🔒 Blocked navigation to:', navigationUrl);
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Block new-window requests except cloud backend
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(CLOUD_BACKEND)) {
      return { action: 'allow' };
    }
    console.log('🔒 Blocked window open:', url);
    return { action: 'deny' };
  });
});
