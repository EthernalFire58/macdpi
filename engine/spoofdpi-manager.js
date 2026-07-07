const { spawn, execSync } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

class SpoofDPIManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.process = null;
    this.config = {
      port: 8080,
      windowSize: 1,
      timeout: 120,
      enableDoh: true,
      dnsAddr: '1.1.1.1',
      // GoodbyeDPI Turkey-inspired parameters
      fragment: true,
      fragmentSize: 2,
      wrongChecksum: true,
      mixHostCase: true,
      blockQUIC: true
    };
    this.restartCount = 0;
    this.maxRestarts = 3;
  }

  /**
   * Check if SpoofDPI is installed on the system
   */
  static isInstalled() {
    try {
      if (process.platform === 'darwin') {
        execSync('which spoof-dpi', { stdio: 'pipe' });
        return true;
      }
      // On Windows (dev), always return false
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Install SpoofDPI via Homebrew
   */
  static async install() {
    return new Promise((resolve, reject) => {
      if (process.platform !== 'darwin') {
        reject(new Error('SpoofDPI kurulumu yalnızca macOS\'ta desteklenir.'));
        return;
      }

      // Check if Homebrew is installed
      try {
        execSync('which brew', { stdio: 'pipe' });
      } catch (e) {
        reject(new Error('Homebrew bulunamadı. Önce Homebrew kurmalısınız: https://brew.sh'));
        return;
      }

      const installProcess = spawn('brew', ['install', 'spoofdpi'], {
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      installProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      installProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Kurulum başarısız (kod: ${code}): ${stderr}`));
        }
      });

      installProcess.on('error', (err) => {
        reject(new Error(`Kurulum başlatılamadı: ${err.message}`));
      });
    });
  }

  /**
   * Get SpoofDPI binary path
   */
  getBinaryPath() {
    if (process.platform === 'darwin') {
      try {
        // Try Homebrew ARM64 path first (Apple Silicon)
        const paths = [
          '/opt/homebrew/bin/spoof-dpi',
          '/usr/local/bin/spoof-dpi'
        ];
        
        for (const p of paths) {
          try {
            require('fs').accessSync(p, require('fs').constants.X_OK);
            return p;
          } catch (e) {
            continue;
          }
        }

        // Fallback to which
        return execSync('which spoof-dpi', { stdio: 'pipe' }).toString().trim();
      } catch (e) {
        throw new Error('SpoofDPI bulunamadı. Lütfen Homebrew ile kurun: brew install spoofdpi');
      }
    }

    throw new Error('Bu platform desteklenmiyor');
  }

  /**
   * Build command arguments from config
   * Translates GoodbyeDPI Turkey parameters to SpoofDPI equivalents
   */
  buildArgs() {
    const args = [];

    // Listen address and port
    args.push('--addr', '127.0.0.1');
    args.push('--port', String(this.config.port || 8080));

    // DNS configuration
    if (this.config.dnsAddr) {
      args.push('--dns-addr', this.config.dnsAddr);
    }

    // DNS port (GoodbyeDPI uses --dns-port)
    args.push('--dns-port', '53');

    // Window size - key DPI bypass parameter from GoodbyeDPI Turkey
    // GoodbyeDPI uses -w for HTTP fragment size, SpoofDPI uses --window-size
    if (this.config.windowSize) {
      args.push('--window-size', String(this.config.windowSize));
    }

    // Timeout
    if (this.config.timeout) {
      args.push('--timeout', String(this.config.timeout));
    }

    // DNS over HTTPS (GoodbyeDPI Turkey redirects DNS, SpoofDPI can use DoH)
    if (this.config.enableDoh) {
      args.push('--enable-doh');
    }

    // Pattern - bypass only specific patterns (optional, for targeted mode)
    if (this.config.pattern) {
      args.push('--pattern', this.config.pattern);
    }

    // No banner
    args.push('--no-banner');

    // Debug mode if needed
    if (this.config.debug) {
      args.push('--debug');
    }

    return args;
  }

  /**
   * Start SpoofDPI process
   */
  async start() {
    if (this.process) {
      this.logger.log('SpoofDPI zaten çalışıyor', 'warning');
      return;
    }

    const binaryPath = this.getBinaryPath();
    const args = this.buildArgs();

    this.logger.log(`SpoofDPI başlatılıyor: ${binaryPath}`);
    this.logger.log(`Parametreler: ${args.join(' ')}`);
    this.logger.log(`DPI Bypass ayarları: Fragment=${this.config.fragment}, WindowSize=${this.config.windowSize}, DoH=${this.config.enableDoh}`);

    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(binaryPath, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env }
        });

        this.process.stdout.on('data', (data) => {
          const message = data.toString().trim();
          if (message) {
            this.logger.log(message);
          }
        });

        this.process.stderr.on('data', (data) => {
          const message = data.toString().trim();
          if (message) {
            this.logger.log(message, 'warning');
          }
        });

        this.process.on('error', (err) => {
          this.logger.log(`SpoofDPI hatası: ${err.message}`, 'error');
          this.process = null;
          reject(err);
        });

        this.process.on('close', (code) => {
          this.logger.log(`SpoofDPI durdu (kod: ${code})`);
          this.process = null;

          // Auto-restart if unexpected exit
          if (code !== 0 && code !== null && this.restartCount < this.maxRestarts) {
            this.restartCount++;
            this.logger.log(`Otomatik yeniden başlatma (${this.restartCount}/${this.maxRestarts})...`, 'warning');
            setTimeout(() => this.start(), 2000);
          }
        });

        // Wait a short time to check if process started successfully
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.restartCount = 0;
            this.logger.log(`SpoofDPI çalışıyor - Port: ${this.config.port}`, 'success');
            resolve();
          } else {
            reject(new Error('SpoofDPI başlatılamadı'));
          }
        }, 1000);

      } catch (error) {
        this.logger.log(`SpoofDPI başlatma hatası: ${error.message}`, 'error');
        reject(error);
      }
    });
  }

  /**
   * Stop SpoofDPI process
   */
  async stop() {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      this.maxRestarts = 0; // Prevent auto-restart

      this.process.on('close', () => {
        this.process = null;
        this.maxRestarts = 3;
        resolve();
      });

      // Graceful shutdown
      this.process.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
          this.process = null;
          this.maxRestarts = 3;
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Get current listening port
   */
  getPort() {
    return this.config.port || 8080;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if process is running
   */
  isRunning() {
    return this.process !== null && !this.process.killed;
  }
}

module.exports = SpoofDPIManager;
