const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script for secure IPC communication
 * Only expose safe APIs to the renderer process (React app)
 * This prevents XSS attacks from injecting malicious code with Node.js access
 */

// Create safe API object to expose to React
const electronAPI = {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // API configuration
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  
  // Platform information
  platform: process.platform,
  arch: process.arch,
  
  // Node version
  nodeVersion: process.versions.node,
  
  // Chrome version
  chromeVersion: process.versions.chrome,
  
  // Electron version
  electronVersion: process.versions.electron,

  // Example: System information
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    electronVersion: process.versions.electron,
  }),
};

// Expose the API to React via window.electron
contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * Example: Listen for IPC messages from main process
 */
ipcRenderer.on('app-notification', (event, message) => {
  console.log('Notification from main:', message);
});
