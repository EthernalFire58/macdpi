const { execSync } = require('child_process');

/**
 * DNS Configuration Manager for macOS
 * GoodbyeDPI Turkey uses --dns-addr to redirect DNS queries to bypass
 * ISS DNS filtering. This module provides equivalent functionality on macOS.
 */
class DnsConfig {
  static DNS_SERVERS = {
    cloudflare: {
      name: 'Cloudflare',
      primary: '1.1.1.1',
      secondary: '1.0.0.1',
      doh: 'https://cloudflare-dns.com/dns-query'
    },
    google: {
      name: 'Google',
      primary: '8.8.8.8',
      secondary: '8.8.4.4',
      doh: 'https://dns.google/dns-query'
    },
    quad9: {
      name: 'Quad9',
      primary: '9.9.9.9',
      secondary: '149.112.112.112',
      doh: 'https://dns.quad9.net/dns-query'
    }
  };

  static currentConfig = {
    provider: 'cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    enableDoh: true,
    originalDns: null
  };

  /**
   * Get current DNS configuration
   */
  static getConfig() {
    return { ...this.currentConfig };
  }

  /**
   * Get the active network service name
   */
  static getActiveService() {
    if (process.platform !== 'darwin') return 'Wi-Fi';
    
    try {
      const route = execSync('route -n get default 2>/dev/null | grep interface', {
        stdio: 'pipe'
      }).toString().trim();
      
      const iface = route.split(':').pop().trim();

      const services = execSync('networksetup -listallhardwareports', {
        stdio: 'pipe'
      }).toString();

      const lines = services.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Device:') && lines[i].includes(iface)) {
          for (let j = i - 1; j >= 0; j--) {
            if (lines[j].includes('Hardware Port:')) {
              return lines[j].split(':').slice(1).join(':').trim();
            }
          }
        }
      }
      return 'Wi-Fi';
    } catch (e) {
      return 'Wi-Fi';
    }
  }

  /**
   * Save current DNS settings before modifying
   */
  static saveOriginalDns() {
    if (process.platform !== 'darwin') return;
    if (this.currentConfig.originalDns) return; // Already saved

    try {
      const service = this.getActiveService();
      const output = execSync(`networksetup -getdnsservers "${service}"`, {
        stdio: 'pipe'
      }).toString().trim();

      if (!output.includes('any DNS Servers')) {
        this.currentConfig.originalDns = output.split('\n').map(s => s.trim());
      } else {
        this.currentConfig.originalDns = ['Empty']; // Mark as "was empty"
      }
    } catch (e) {
      this.currentConfig.originalDns = ['Empty'];
    }
  }

  /**
   * Apply DNS configuration
   * This is the macOS equivalent of GoodbyeDPI's --dns-addr parameter
   */
  static async apply(config) {
    this.currentConfig = { ...this.currentConfig, ...config };

    if (process.platform !== 'darwin') {
      console.log(`[DEV] DNS ayarlandı: ${config.primary} / ${config.secondary}`);
      return;
    }

    // Save original DNS before modifying
    this.saveOriginalDns();

    const service = this.getActiveService();

    try {
      const servers = [config.primary];
      if (config.secondary) {
        servers.push(config.secondary);
      }

      execSync(`networksetup -setdnsservers "${service}" ${servers.join(' ')}`, {
        stdio: 'pipe'
      });

      // Flush DNS cache
      try {
        execSync('dscacheutil -flushcache', { stdio: 'pipe' });
        execSync('sudo killall -HUP mDNSResponder 2>/dev/null', { stdio: 'pipe' });
      } catch (e) {
        // DNS flush might fail without sudo, non-critical
      }

      console.log(`DNS ayarlandı: ${servers.join(', ')} (${service})`);
    } catch (error) {
      throw new Error(`DNS ayarları yapılamadı: ${error.message}`);
    }
  }

  /**
   * Restore original DNS settings
   */
  static async restore() {
    if (process.platform !== 'darwin') return;

    const service = this.getActiveService();

    try {
      if (this.currentConfig.originalDns && 
          this.currentConfig.originalDns[0] !== 'Empty') {
        execSync(
          `networksetup -setdnsservers "${service}" ${this.currentConfig.originalDns.join(' ')}`,
          { stdio: 'pipe' }
        );
      } else {
        // Reset to DHCP
        execSync(`networksetup -setdnsservers "${service}" Empty`, {
          stdio: 'pipe'
        });
      }

      // Flush DNS cache
      try {
        execSync('dscacheutil -flushcache', { stdio: 'pipe' });
      } catch (e) {
        // Non-critical
      }

      this.currentConfig.originalDns = null;
      console.log('DNS ayarları eski haline döndürüldü');
    } catch (error) {
      console.error(`DNS geri yükleme hatası: ${error.message}`);
    }
  }

  /**
   * Get available DNS providers
   */
  static getProviders() {
    return Object.entries(this.DNS_SERVERS).map(([key, server]) => ({
      id: key,
      ...server
    }));
  }
}

module.exports = DnsConfig;
