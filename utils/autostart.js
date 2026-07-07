const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * macOS Login Items management for auto-start functionality
 */
class AutoStart {
  static isEnabled() {
    if (process.platform !== 'darwin') {
      return false;
    }

    try {
      const loginSettings = app.getLoginItemSettings();
      return loginSettings.openAtLogin;
    } catch (e) {
      return false;
    }
  }

  static setEnabled(enabled) {
    if (process.platform !== 'darwin') {
      console.log(`[DEV] Otomatik başlatma: ${enabled}`);
      return;
    }

    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true, // Start minimized to tray
        path: app.getPath('exe')
      });
    } catch (e) {
      console.error(`Otomatik başlatma ayarı yapılamadı: ${e.message}`);
    }
  }
}

module.exports = AutoStart;
