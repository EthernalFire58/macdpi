const { execSync } = require('child_process');

/**
 * macOS System Proxy Configuration
 * Uses `networksetup` command to manage system HTTP/HTTPS proxy settings.
 * This is analogous to how GoodbyeDPI Turkey modifies Windows DNS/proxy settings.
 */
class ProxyConfig {
  /**
   * Get the active network service name (Wi-Fi, Ethernet, etc.)
   */
  static getActiveNetworkService() {
    if (process.platform !== 'darwin') {
      return 'Wi-Fi'; // Default fallback for dev
    }

    try {
      // Get the primary network interface
      const route = execSync('route -n get default 2>/dev/null | grep interface', {
        stdio: 'pipe'
      }).toString().trim();
      
      const iface = route.split(':').pop().trim();

      // Map interface to network service name
      const services = execSync('networksetup -listallhardwareports', {
        stdio: 'pipe'
      }).toString();

      const lines = services.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Device:') && lines[i].includes(iface)) {
          // Service name is on the line above
          for (let j = i - 1; j >= 0; j--) {
            if (lines[j].includes('Hardware Port:')) {
              return lines[j].split(':').slice(1).join(':').trim();
            }
          }
        }
      }

      // Default to Wi-Fi
      return 'Wi-Fi';
    } catch (e) {
      return 'Wi-Fi';
    }
  }

  /**
   * Enable system HTTP/HTTPS proxy
   * Routes traffic through SpoofDPI's local proxy
   */
  static async enableProxy(port = 8080, host = '127.0.0.1') {
    if (process.platform !== 'darwin') {
      console.log(`[DEV] Proxy etkinleştirildi: ${host}:${port}`);
      return;
    }

    const service = this.getActiveNetworkService();

    try {
      // Set HTTP proxy
      execSync(`networksetup -setwebproxy "${service}" ${host} ${port}`, {
        stdio: 'pipe'
      });

      // Set HTTPS proxy
      execSync(`networksetup -setsecurewebproxy "${service}" ${host} ${port}`, {
        stdio: 'pipe'
      });

      // Enable proxies
      execSync(`networksetup -setwebproxystate "${service}" on`, {
        stdio: 'pipe'
      });
      execSync(`networksetup -setsecurewebproxystate "${service}" on`, {
        stdio: 'pipe'
      });

      console.log(`Proxy etkinleştirildi: ${service} -> ${host}:${port}`);
    } catch (error) {
      throw new Error(`Proxy ayarları yapılamadı: ${error.message}. Yönetici izni gerekebilir.`);
    }
  }

  /**
   * Disable system HTTP/HTTPS proxy
   */
  static async disableProxy() {
    if (process.platform !== 'darwin') {
      console.log('[DEV] Proxy devre dışı bırakıldı');
      return;
    }

    const service = this.getActiveNetworkService();

    try {
      // Disable HTTP proxy
      execSync(`networksetup -setwebproxystate "${service}" off`, {
        stdio: 'pipe'
      });

      // Disable HTTPS proxy
      execSync(`networksetup -setsecurewebproxystate "${service}" off`, {
        stdio: 'pipe'
      });

      console.log(`Proxy devre dışı: ${service}`);
    } catch (error) {
      console.error(`Proxy kapatma hatası: ${error.message}`);
    }
  }

  /**
   * Get current proxy status
   */
  static getProxyStatus() {
    if (process.platform !== 'darwin') {
      return { enabled: false, host: '', port: 0 };
    }

    const service = this.getActiveNetworkService();

    try {
      const output = execSync(`networksetup -getwebproxy "${service}"`, {
        stdio: 'pipe'
      }).toString();

      const enabled = output.includes('Enabled: Yes');
      const serverMatch = output.match(/Server:\s*(.+)/);
      const portMatch = output.match(/Port:\s*(\d+)/);

      return {
        enabled,
        host: serverMatch ? serverMatch[1].trim() : '',
        port: portMatch ? parseInt(portMatch[1]) : 0
      };
    } catch (e) {
      return { enabled: false, host: '', port: 0 };
    }
  }
}

module.exports = ProxyConfig;
