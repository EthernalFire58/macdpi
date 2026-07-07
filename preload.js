const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Connection
  connect: () => ipcRenderer.invoke('connect'),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  installSpoofDPI: () => ipcRenderer.invoke('install-spoofdpi'),

  // Presets
  getPresets: () => ipcRenderer.invoke('get-presets'),
  applyPreset: (presetId) => ipcRenderer.invoke('apply-preset', presetId),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // DNS
  getDnsConfig: () => ipcRenderer.invoke('get-dns-config'),
  updateDns: (config) => ipcRenderer.invoke('update-dns', config),

  // Logs
  getLogs: () => ipcRenderer.invoke('get-logs'),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),

  // Autostart
  setAutostart: (enabled) => ipcRenderer.invoke('set-autostart', enabled),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Events
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, data) => callback(data));
  },
  onConnectionError: (callback) => {
    ipcRenderer.on('connection-error', (event, error) => callback(error));
  },
  onNewLog: (callback) => {
    ipcRenderer.on('new-log', (event, entry) => callback(entry));
  },
  subscribeLogs: () => {
    ipcRenderer.send('subscribe-logs');
  }
});
