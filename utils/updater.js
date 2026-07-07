const https = require('https');
const { app, dialog } = require('electron');

/**
 * Simple update checker that compares against GitHub releases
 */
class Updater {
  static REPO_URL = 'https://api.github.com/repos/macdpi/macdpi/releases/latest';
  
  static async checkForUpdates(silent = true) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/macdpi/macdpi/releases/latest',
        headers: {
          'User-Agent': 'MacDPI-App',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';
            const currentVersion = app.getVersion();

            if (this.isNewerVersion(latestVersion, currentVersion)) {
              if (!silent) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Güncelleme Mevcut',
                  message: `Yeni sürüm mevcut: v${latestVersion}`,
                  detail: `Mevcut sürüm: v${currentVersion}\n\n${release.body || ''}`,
                  buttons: ['İndir', 'Sonra'],
                  defaultId: 0
                }).then(({ response }) => {
                  if (response === 0) {
                    require('electron').shell.openExternal(release.html_url);
                  }
                });
              }
              resolve({ available: true, version: latestVersion, url: release.html_url });
            } else {
              resolve({ available: false });
            }
          } catch (e) {
            resolve({ available: false, error: e.message });
          }
        });
      }).on('error', (e) => {
        resolve({ available: false, error: e.message });
      });
    });
  }

  static isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }
}

module.exports = Updater;
