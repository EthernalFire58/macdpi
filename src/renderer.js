// ============================================
// MacDPI - Renderer Process
// ============================================

class MacDPI {
  constructor() {
    this.isConnected = false;
    this.isConnecting = false;
    this.activePreset = 'turkiye-genel';
    this.logs = [];

    this.init();
  }

  async init() {
    this.bindEvents();
    this.loadPresets();
    this.checkEngineStatus();
    this.loadSettings();

    // Subscribe to log events
    window.api.subscribeLogs();

    // Listen for connection status updates
    window.api.onConnectionStatus((data) => {
      this.updateConnectionUI(data.connected);
    });

    window.api.onConnectionError((error) => {
      this.showToast(`Hata: ${error}`, 'error');
      this.updateConnectionUI(false);
    });

    window.api.onNewLog((entry) => {
      this.addLogEntry(entry);
    });

    // Load existing logs
    try {
      const logs = await window.api.getLogs();
      if (logs && logs.length > 0) {
        logs.forEach(entry => this.addLogEntry(entry, false));
      }
    } catch (e) {
      // Initial log load, non-critical
    }

    // Check initial status
    try {
      const status = await window.api.getStatus();
      this.updateConnectionUI(status.connected);
    } catch (e) {
      // Status check, non-critical
    }
  }

  bindEvents() {
    // Window controls
    document.getElementById('btn-minimize').addEventListener('click', () => {
      window.api.minimizeWindow();
    });

    document.getElementById('btn-close').addEventListener('click', () => {
      window.api.closeWindow();
    });

    // Toggle button
    document.getElementById('toggle-button').addEventListener('click', () => {
      this.toggleConnection();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.currentTarget.dataset.tab);
      });
    });

    // DNS radio buttons
    document.querySelectorAll('input[name="dns"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handleDnsChange(e.target.value);
      });
    });

    // DoH toggle
    document.getElementById('doh-toggle').addEventListener('change', (e) => {
      this.updateDnsConfig();
    });

    // Custom DNS input
    document.getElementById('custom-dns-input').addEventListener('input', (e) => {
      this.updateDnsConfig();
    });

    // Settings inputs
    ['setting-port', 'setting-window-size', 'setting-timeout'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        this.saveSettings();
      });
    });

    // Autostart toggle
    document.getElementById('autostart-toggle').addEventListener('change', (e) => {
      window.api.setAutostart(e.target.checked);
    });

    // Clear logs
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
      this.clearLogs();
    });

    // Install engine button
    document.getElementById('btn-install-engine').addEventListener('click', () => {
      this.installEngine();
    });
  }

  // ============================================
  // Connection Management
  // ============================================

  async toggleConnection() {
    if (this.isConnecting) return;

    if (this.isConnected) {
      this.isConnecting = true;
      this.setConnectingUI();
      
      try {
        await window.api.disconnect();
        this.updateConnectionUI(false);
        this.showToast('Bağlantı kesildi', 'success');
      } catch (error) {
        this.showToast(`Hata: ${error}`, 'error');
      }
      
      this.isConnecting = false;
    } else {
      this.isConnecting = true;
      this.setConnectingUI();
      
      try {
        await this.saveSettings();
        await window.api.connect();
        this.updateConnectionUI(true);
        this.showToast('Bağlantı kuruldu!', 'success');
      } catch (error) {
        this.showToast(`Bağlantı hatası: ${error}`, 'error');
        this.updateConnectionUI(false);
      }
      
      this.isConnecting = false;
    }
  }

  setConnectingUI() {
    const ring = document.getElementById('toggle-ring');
    ring.className = 'toggle-ring connecting';
    document.getElementById('toggle-label').textContent = 'Bağlanıyor...';
  }

  updateConnectionUI(connected) {
    this.isConnected = connected;
    this.isConnecting = false;

    const ring = document.getElementById('toggle-ring');
    const badge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const label = document.getElementById('toggle-label');

    if (connected) {
      ring.className = 'toggle-ring active';
      badge.className = 'status-badge connected';
      statusText.textContent = 'Bağlı';
      label.textContent = 'Kesmek için dokunun';
    } else {
      ring.className = 'toggle-ring';
      badge.className = 'status-badge';
      statusText.textContent = 'Bağlı Değil';
      label.textContent = 'Bağlanmak için dokunun';
    }
  }

  // ============================================
  // Presets
  // ============================================

  loadPresets() {
    const presets = [
      {
        id: 'turkiye-genel',
        name: 'Türkiye - Genel',
        desc: 'Tüm ISS\'ler için optimize edilmiş ayarlar',
        badge: 'Önerilen',
        badgeClass: 'recommended',
        config: {
          windowSize: 1,
          timeout: 120,
          enableDoh: true,
          dnsAddr: '1.1.1.1',
          // GoodbyeDPI Turkey parametreleri: fragment + wrong-chksum
          fragment: true,
          fragmentSize: 2,
          wrongChecksum: true,
          mixHostCase: true,
          blockQUIC: true
        }
      },
      {
        id: 'turk-telekom',
        name: 'Türk Telekom',
        desc: 'Türk Telekom / TTNet altyapısı',
        badge: 'Alternatif',
        badgeClass: 'alternative',
        config: {
          windowSize: 1,
          timeout: 120,
          enableDoh: true,
          dnsAddr: '1.1.1.1',
          fragment: true,
          fragmentSize: 2,
          wrongChecksum: true,
          setTtl: 3,
          mixHostCase: true,
          blockQUIC: true
        }
      },
      {
        id: 'vodafone',
        name: 'Vodafone / Superonline',
        desc: 'Vodafone ve Superonline altyapıları',
        badge: 'Alternatif',
        badgeClass: 'alternative',
        config: {
          windowSize: 1,
          timeout: 120,
          enableDoh: true,
          dnsAddr: '8.8.8.8',
          fragment: true,
          fragmentSize: 1,
          wrongChecksum: false,
          autoTtl: true,
          mixHostCase: true,
          blockQUIC: true
        }
      },
      {
        id: 'turkcell',
        name: 'Turkcell Superonline',
        desc: 'Turkcell fiber altyapısı',
        badge: 'Alternatif',
        badgeClass: 'alternative',
        config: {
          windowSize: 2,
          timeout: 120,
          enableDoh: true,
          dnsAddr: '9.9.9.9',
          fragment: true,
          fragmentSize: 2,
          wrongChecksum: true,
          mixHostCase: true,
          blockQUIC: true
        }
      },
      {
        id: 'agresif',
        name: 'Agresif Mod',
        desc: 'Hiçbiri çalışmazsa bu modu deneyin',
        badge: 'Agresif',
        badgeClass: 'aggressive',
        config: {
          windowSize: 1,
          timeout: 120,
          enableDoh: true,
          dnsAddr: '1.1.1.1',
          fragment: true,
          fragmentSize: 1,
          wrongChecksum: true,
          setTtl: 2,
          autoTtl: true,
          wrongSeq: true,
          nativeFrag: true,
          reverseFrag: true,
          mixHostCase: true,
          blockQUIC: true
        }
      }
    ];

    const grid = document.getElementById('preset-grid');
    grid.innerHTML = '';

    presets.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card${preset.id === this.activePreset ? ' active' : ''}`;
      card.dataset.presetId = preset.id;
      card.innerHTML = `
        <div class="preset-info">
          <span class="preset-name">${preset.name}</span>
          <span class="preset-desc">${preset.desc}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="preset-badge ${preset.badgeClass}">${preset.badge}</span>
          <div class="preset-check"></div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectPreset(preset.id, preset.config);
      });

      grid.appendChild(card);
    });
  }

  selectPreset(presetId, config) {
    this.activePreset = presetId;

    // Update UI
    document.querySelectorAll('.preset-card').forEach(card => {
      card.classList.toggle('active', card.dataset.presetId === presetId);
    });

    // Apply config to settings UI
    if (config) {
      document.getElementById('setting-window-size').value = config.windowSize || 1;
      document.getElementById('setting-timeout').value = config.timeout || 120;
      document.getElementById('doh-toggle').checked = config.enableDoh !== false;

      // Set DNS
      if (config.dnsAddr) {
        const dnsMap = {
          '1.1.1.1': 'cloudflare',
          '8.8.8.8': 'google',
          '9.9.9.9': 'quad9'
        };
        const dnsKey = dnsMap[config.dnsAddr] || 'custom';
        const radio = document.querySelector(`input[name="dns"][value="${dnsKey}"]`);
        if (radio) radio.checked = true;
        if (dnsKey === 'custom') {
          document.getElementById('custom-dns-input').value = config.dnsAddr;
          document.getElementById('custom-dns-input').disabled = false;
        }
      }
    }

    // Apply preset via IPC
    window.api.applyPreset(presetId).catch(() => {});

    this.showToast(`Preset değiştirildi: ${presetId.replace(/-/g, ' ')}`, 'success');
  }

  // ============================================
  // Tab Navigation
  // ============================================

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });
  }

  // ============================================
  // DNS Configuration
  // ============================================

  handleDnsChange(value) {
    const customInput = document.getElementById('custom-dns-input');
    customInput.disabled = value !== 'custom';
    
    if (value === 'custom') {
      customInput.focus();
    }
    
    this.updateDnsConfig();
  }

  updateDnsConfig() {
    const selectedDns = document.querySelector('input[name="dns"]:checked').value;
    const doh = document.getElementById('doh-toggle').checked;
    const customAddr = document.getElementById('custom-dns-input').value;

    const dnsMap = {
      cloudflare: { primary: '1.1.1.1', secondary: '1.0.0.1' },
      google: { primary: '8.8.8.8', secondary: '8.8.4.4' },
      quad9: { primary: '9.9.9.9', secondary: '149.112.112.112' },
      custom: { primary: customAddr || '1.1.1.1', secondary: '' }
    };

    const config = {
      provider: selectedDns,
      ...dnsMap[selectedDns],
      enableDoh: doh
    };

    window.api.updateDns(config).catch(() => {});
  }

  // ============================================
  // Settings
  // ============================================

  async loadSettings() {
    try {
      const settings = await window.api.getSettings();
      if (settings) {
        document.getElementById('setting-port').value = settings.port || 8080;
        document.getElementById('setting-window-size').value = settings.windowSize || 1;
        document.getElementById('setting-timeout').value = settings.timeout || 120;
      }
    } catch (e) {
      // Settings load, non-critical
    }

    try {
      const autostart = await window.api.getAutostart();
      document.getElementById('autostart-toggle').checked = autostart;
    } catch (e) {
      // Autostart check, non-critical
    }
  }

  async saveSettings() {
    const settings = {
      port: parseInt(document.getElementById('setting-port').value) || 8080,
      windowSize: parseInt(document.getElementById('setting-window-size').value) || 1,
      timeout: parseInt(document.getElementById('setting-timeout').value) || 120
    };

    try {
      await window.api.updateSettings(settings);
    } catch (e) {
      // Settings save, non-critical
    }
  }

  // ============================================
  // Engine Status
  // ============================================

  async checkEngineStatus() {
    try {
      const status = await window.api.getStatus();
      const label = document.getElementById('engine-label');
      const desc = document.getElementById('engine-desc');
      const installBtn = document.getElementById('btn-install-engine');

      if (status.spoofDPIInstalled) {
        label.textContent = 'SpoofDPI Kurulu ✓';
        desc.textContent = 'Motor çalışmaya hazır';
        label.style.color = 'var(--accent)';
        installBtn.style.display = 'none';
      } else {
        label.textContent = 'SpoofDPI Bulunamadı';
        desc.textContent = 'Homebrew ile kurulum gerekli';
        label.style.color = 'var(--warning)';
        installBtn.style.display = 'flex';
      }
    } catch (e) {
      document.getElementById('engine-label').textContent = 'Durum kontrol edilemiyor';
      document.getElementById('engine-desc').textContent = 'macOS üzerinde kontrol edilecek';
    }
  }

  async installEngine() {
    const btn = document.getElementById('btn-install-engine');
    btn.textContent = 'Kuruluyor...';
    btn.disabled = true;

    try {
      const result = await window.api.installSpoofDPI();
      if (result.success) {
        this.showToast('SpoofDPI başarıyla kuruldu!', 'success');
        this.checkEngineStatus();
      } else {
        this.showToast(`Kurulum hatası: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showToast('Kurulum başarısız oldu', 'error');
    }

    btn.textContent = 'Kur';
    btn.disabled = false;
  }

  // ============================================
  // Logs
  // ============================================

  addLogEntry(entry, scroll = true) {
    const container = document.getElementById('logs-container');
    
    // Remove empty message
    const emptyMsg = container.querySelector('.log-empty');
    if (emptyMsg) emptyMsg.remove();

    const div = document.createElement('div');
    const level = entry.level || 'info';
    div.className = `log-entry ${level}`;
    
    const time = entry.time ? new Date(entry.time).toLocaleTimeString('tr-TR') : 
                 new Date().toLocaleTimeString('tr-TR');
    
    div.innerHTML = `<span class="log-time">[${time}]</span>${entry.message || entry}`;
    container.appendChild(div);

    // Keep only last 200 logs
    while (container.children.length > 200) {
      container.removeChild(container.firstChild);
    }

    if (scroll) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async clearLogs() {
    const container = document.getElementById('logs-container');
    container.innerHTML = `
      <div class="log-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>Henüz log bulunmuyor</p>
      </div>
    `;
    
    try {
      await window.api.clearLogs();
    } catch (e) {
      // Clear logs, non-critical
    }
  }

  // ============================================
  // Toast Notifications
  // ============================================

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.macDPI = new MacDPI();
});
