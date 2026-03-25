const { app, BrowserWindow, Menu, ipcMain, session } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs');

// ─── Configuration ─────────────────────────────────────────────
const isDevelopment = process.env.NODE_ENV === 'development' || isDev;
const CLOUD_BACKEND = isDevelopment ? 'http://localhost:5000' : 'https://classyn-ai.onrender.com';
const CLOUD_API     = `${CLOUD_BACKEND}/api`;
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
      sandbox: false,
      spellcheck: true,
      webSecurity: false,
      nativeWindowOpen: true,
      partition: 'persist:classynai',
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

  // Grant camera/microphone permissions for Jitsi Meet
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'display-capture', 'notifications', 'geolocation'];
    console.log('[PERMISSION REQUEST]', permission, '->', allowed.includes(permission) ? 'GRANTED' : 'DENIED');
    callback(allowed.includes(permission));
  });

  // Also handle permission checks (Electron needs both handlers)
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ['media', 'mediaKeySystem', 'display-capture', 'notifications', 'geolocation'];
    return allowed.includes(permission);
  });

  // Relax response headers only for Jitsi resources used in lecture view
  // The app uses file:// protocol where CSP response headers don't apply correctly
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const url = details.url || '';
    const isJitsi =
      url.startsWith('https://meet.jit.si') ||
      url.includes('.jitsi.net') ||
      url.startsWith('https://8x8.vc') ||
      url.includes('.8x8.vc');

    if (!isJitsi) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    const headers = { ...details.responseHeaders };
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    callback({ responseHeaders: headers });
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

      // INTERCEPT OAUTH CALLBACK!
      if (navigationUrl.includes('oauth_redirect=true') && navigationUrl.includes('token=')) {
        event.preventDefault();
        try {
          console.log('🔄 Intercepted Client-side OAuth Redirect! Bridging to file://...');
          const urlParams = new URL(navigationUrl);
          const token = urlParams.searchParams.get('token') || '';
          
          const frontendBuildPath = getFrontendBuildPath();
          const indexPath = path.join(frontendBuildPath, 'index.html');
          const localUrl = `file:///${indexPath.replace(/\\/g, '/')}#/auth/callback?token=${token}`;
          mainWindow.loadURL(localUrl);
        } catch (err) {}
        return;
      }

      const isAllowed =
        parsedUrl.protocol === 'file:' ||
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        navigationUrl.startsWith(CLOUD_BACKEND) ||
        navigationUrl.startsWith('https://meet.jit.si') ||
        parsedUrl.hostname.endsWith('.jitsi.net') ||
        navigationUrl.startsWith('https://8x8.vc') ||
        parsedUrl.hostname.endsWith('.8x8.vc') ||
        // Allow OAuth provider redirects inside the popup
        parsedUrl.hostname.endsWith('google.com') ||
        parsedUrl.hostname.endsWith('github.com') ||
        parsedUrl.hostname.endsWith('firebaseapp.com') ||
        parsedUrl.hostname.endsWith('firebaseapp.net') ||
        parsedUrl.hostname.endsWith('firebaseio.com') ||
        parsedUrl.hostname.endsWith('googleusercontent.com');

      if (!isAllowed) {
        console.log('🔒 Blocked navigation to:', navigationUrl);
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Intercept the Backend's 302 OAuth redirect to bring the browser back to local file://
  contents.on('will-redirect', (event, navigationUrl) => {
    if (navigationUrl.includes('oauth_redirect=true') && navigationUrl.includes('token=')) {
      event.preventDefault();
      try {
        console.log('🔄 Intercepted Backend OAuth Redirect! Bridging to file://...');
        const urlParams = new URL(navigationUrl);
        const token = urlParams.searchParams.get('token') || '';
        
        const frontendBuildPath = getFrontendBuildPath();
        const indexPath = path.join(frontendBuildPath, 'index.html');
        // Format local file URL manually to include the HashRouter's query params
        const localUrl = `file:///${indexPath.replace(/\\/g, '/')}#/auth/callback?token=${token}`;
        
        console.log('🚀 Loading Local Access Token Route:', localUrl);
        mainWindow.loadURL(localUrl);
      } catch (err) {
        console.error('Failed to parse OAuth redirect:', err);
      }
    }
  });

  // Block new-window requests except cloud backend
  contents.setWindowOpenHandler(({ url }) => {
    const allow = (
      url === 'about:blank' ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1') ||
      url.startsWith(CLOUD_BACKEND) ||
      url.startsWith('https://meet.jit.si') ||
      url.includes('.jitsi.net') ||
      url.startsWith('https://8x8.vc') ||
      url.includes('.8x8.vc') ||
      // Allow OAuth provider popups (Google/GitHub/Firebase) for Jitsi auth
      url.includes('accounts.google.com') ||
      url.includes('github.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('firebaseapp.net') ||
      url.includes('firebaseio.com') ||
      url.includes('googleusercontent.com')
    );

    if (allow) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            partition: 'persist:classynai',
            nativeWindowOpen: true,
          },
        },
      };
    }

    console.log('🔒 Blocked window open:', url);
    return { action: 'deny' };
  });
});
