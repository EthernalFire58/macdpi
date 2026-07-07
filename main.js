const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, nativeTheme } = require('electron');
const path = require('path');
const SpoofDPIManager = require('./engine/spoofdpi-manager');
const ProxyConfig = require('./engine/proxy-config');
const DnsConfig = require('./engine/dns-config');
const Logger = require('./utils/logger');
const AutoStart = require('./utils/autostart');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let spoofManager = null;
let logger = null;
let isConnected = false;

// Force dark mode
nativeTheme.themeSource = 'dark';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    minWidth: 420,
    minHeight: 580,
    resizable: true,
    frame: false,
    transparent: true,
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false,
    icon: path.join(__dirname, 'src', 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon (circle indicator)
  const iconSize = 18;
  const canvas = nativeImage.createEmpty();
  
  tray = new Tray(getTrayIcon(false));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'MacDPI',
      enabled: false,
      icon: getTrayIcon(false)
    },
    { type: 'separator' },
    {
      label: 'Pencereyi Göster',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Bağlantı Durumu: Kapalı',
      id: 'status',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Bağlan',
      id: 'connect',
      click: () => handleConnect()
    },
    {
      label: 'Bağlantıyı Kes',
      id: 'disconnect',
      click: () => handleDisconnect(),
      visible: false
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        app.isQuiting = true;
        handleDisconnect().then(() => {
          app.quit();
        });
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('MacDPI - DPI Bypass');

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function getTrayIcon(connected) {
  // Create a 32x32 icon using data URL
  const size = 32;
  // Return a simple native image - on macOS this would use template images
  // For now, use a colored circle indicator
  const color = connected ? '#00ff88' : '#666666';
  
  // Create a simple SVG-based icon
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" opacity="0.9"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" fill="#1a1a2e" opacity="0.8"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="${color}" opacity="0.7"/>
  </svg>`;
  
  const icon = nativeImage.createFromBuffer(
    Buffer.from(svg),
    { width: size, height: size }
  );
  
  return icon;
}

function updateTrayStatus(connected) {
  isConnected = connected;
  
  if (tray) {
    try {
      tray.setImage(getTrayIcon(connected));
      const menu = tray.getContextMenu?.() || Menu.getApplicationMenu();
    } catch (e) {
      // Tray update error, non-critical
    }
  }
}

async function handleConnect() {
  if (!spoofManager) {
    spoofManager = new SpoofDPIManager(logger);
  }

  try {
    await spoofManager.start();
    await ProxyConfig.enableProxy(spoofManager.getPort());
    updateTrayStatus(true);
    
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', {
        connected: true,
        port: spoofManager.getPort()
      });
    }
    
    logger.log('Bağlantı başarıyla kuruldu');
  } catch (error) {
    logger.log(`Bağlantı hatası: ${error.message}`, 'error');
    if (mainWindow) {
      mainWindow.webContents.send('connection-error', error.message);
    }
  }
}

async function handleDisconnect() {
  try {
    if (spoofManager) {
      await spoofManager.stop();
    }
    await ProxyConfig.disableProxy();
    updateTrayStatus(false);
    
    if (mainWindow) {
      mainWindow.webContents.send('connection-status', {
        connected: false,
        port: null
      });
    }
    
    logger.log('Bağlantı kesildi');
  } catch (error) {
    logger.log(`Bağlantı kesme hatası: ${error.message}`, 'error');
  }
}

// IPC Handlers
function setupIPC() {
  ipcMain.handle('connect', async () => {
    await handleConnect();
    return { success: true };
  });

  ipcMain.handle('disconnect', async () => {
    await handleDisconnect();
    return { success: true };
  });

  ipcMain.handle('get-status', () => {
    return {
      connected: isConnected,
      port: spoofManager?.getPort() || null,
      spoofDPIInstalled: SpoofDPIManager.isInstalled()
    };
  });

  ipcMain.handle('install-spoofdpi', async () => {
    try {
      await SpoofDPIManager.install();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-presets', () => {
    const presets = require('./engine/presets');
    return presets.getAll();
  });

  ipcMain.handle('apply-preset', async (event, presetId) => {
    const presets = require('./engine/presets');
    const preset = presets.get(presetId);
    if (preset && spoofManager) {
      spoofManager.setConfig(preset.config);
      if (isConnected) {
        await handleDisconnect();
        await handleConnect();
      }
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('get-settings', () => {
    return spoofManager?.getConfig() || require('./engine/presets').getDefault().config;
  });

  ipcMain.handle('update-settings', async (event, settings) => {
    if (spoofManager) {
      spoofManager.setConfig(settings);
    }
    return { success: true };
  });

  ipcMain.handle('get-logs', () => {
    return logger.getLogs();
  });

  ipcMain.handle('clear-logs', () => {
    logger.clear();
    return { success: true };
  });

  ipcMain.handle('get-dns-config', () => {
    return DnsConfig.getConfig();
  });

  ipcMain.handle('update-dns', async (event, config) => {
    try {
      await DnsConfig.apply(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-autostart', async (event, enabled) => {
    AutoStart.setEnabled(enabled);
    return { success: true };
  });

  ipcMain.handle('get-autostart', () => {
    return AutoStart.isEnabled();
  });

  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('close-window', () => {
    mainWindow?.hide();
  });

  // Forward logs to renderer
  ipcMain.on('subscribe-logs', (event) => {
    if (logger) {
      logger.on('log', (entry) => {
        event.sender.send('new-log', entry);
      });
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  logger = new Logger();
  logger.log('MacDPI başlatılıyor...');

  setupIPC();
  createWindow();
  createTray();

  // macOS dock visibility
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'src', 'assets', 'icon.png'));
  }
});

app.on('window-all-closed', () => {
  // Don't quit on macOS - keep running in tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', async () => {
  app.isQuiting = true;
  await handleDisconnect();
});

// Handle second instance
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});
