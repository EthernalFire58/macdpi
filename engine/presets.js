/**
 * GoodbyeDPI Turkey - ISS Presetleri
 * 
 * Bu preset'ler GoodbyeDPI-Turkey projesindeki DPI bypass parametrelerinden
 * türetilmiştir. GoodbyeDPI'ın Windows'ta kullandığı teknikler:
 * 
 * - Paket fragmentasyonu (--fragment-size, -w window-size)
 * - Hatalı TCP checksum (--wrong-chksum) 
 * - Sahte TTL değeri (--set-ttl)
 * - Otomatik TTL (--auto-ttl)
 * - Host header case mixing
 * - QUIC engelleme
 * - DNS yönlendirme (--dns-addr)
 * 
 * SpoofDPI bu tekniklerin bir kısmını TLS ClientHello fragmentasyonu
 * üzerinden gerçekleştirir. Bu preset'ler, Türk ISS'lerinin DPI
 * davranışlarına göre optimize edilmiştir.
 */

const PRESETS = {
  'turkiye-genel': {
    id: 'turkiye-genel',
    name: 'Türkiye - Genel',
    description: 'Tüm Türk ISS\'leri için optimize edilmiş genel ayarlar. GoodbyeDPI Turkey\'nin varsayılan yapılandırmasına eşdeğer.',
    badge: 'Önerilen',
    badgeClass: 'recommended',
    config: {
      port: 8080,
      windowSize: 1,          // GoodbyeDPI: -w 1 (fragment window)
      timeout: 120,
      enableDoh: true,         // DNS over HTTPS - ISS DNS engellemesini bypass
      dnsAddr: '1.1.1.1',     // GoodbyeDPI: --dns-addr 1.1.1.1
      // GoodbyeDPI Turkey parametreleri (SpoofDPI karşılıkları)
      fragment: true,          // GoodbyeDPI: -f (enable fragment)
      fragmentSize: 2,         // GoodbyeDPI: -e 2 (fragment size)
      wrongChecksum: true,     // GoodbyeDPI: --wrong-chksum
      mixHostCase: true,       // GoodbyeDPI: Host header case mixing
      blockQUIC: true,         // GoodbyeDPI: QUIC/HTTP3 engelleme
      // SpoofDPI'ya özel
      pattern: ''              // Tüm trafik
    }
  },

  'turk-telekom': {
    id: 'turk-telekom',
    name: 'Türk Telekom',
    description: 'Türk Telekom / TTNet altyapısı. GoodbyeDPI Turkey\'de service_install_turkey_dnsaddr moduna eşdeğer.',
    badge: 'Alternatif',
    badgeClass: 'alternative',
    config: {
      port: 8080,
      windowSize: 1,
      timeout: 120,
      enableDoh: true,
      dnsAddr: '1.1.1.1',
      fragment: true,
      fragmentSize: 2,
      wrongChecksum: true,
      setTtl: 3,              // GoodbyeDPI: --set-ttl 3 (fake TTL)
      mixHostCase: true,
      blockQUIC: true,
      pattern: ''
    }
  },

  'vodafone': {
    id: 'vodafone',
    name: 'Vodafone / Superonline',
    description: 'Vodafone ve Superonline fiber altyapıları. Daha yumuşak DPI bypass stratejisi.',
    badge: 'Alternatif',
    badgeClass: 'alternative',
    config: {
      port: 8080,
      windowSize: 1,
      timeout: 120,
      enableDoh: true,
      dnsAddr: '8.8.8.8',     // Google DNS - Vodafone ile daha iyi çalışır
      fragment: true,
      fragmentSize: 1,
      wrongChecksum: false,    // Vodafone bazı durumlarda checksum kontrolü yapıyor
      autoTtl: true,           // GoodbyeDPI: --auto-ttl
      mixHostCase: true,
      blockQUIC: true,
      pattern: ''
    }
  },

  'turkcell': {
    id: 'turkcell',
    name: 'Turkcell Superonline',
    description: 'Turkcell Superonline fiber altyapısı. İkili fragment boyutu ile DPI bypass.',
    badge: 'Alternatif',
    badgeClass: 'alternative',
    config: {
      port: 8080,
      windowSize: 2,           // Turkcell için daha büyük pencere
      timeout: 120,
      enableDoh: true,
      dnsAddr: '9.9.9.9',     // Quad9 - güvenlik odaklı
      fragment: true,
      fragmentSize: 2,
      wrongChecksum: true,
      mixHostCase: true,
      blockQUIC: true,
      pattern: ''
    }
  },

  'agresif': {
    id: 'agresif',
    name: 'Agresif Mod',
    description: 'Tüm DPI bypass teknikleri aktif. Diğer preset\'ler çalışmadığında kullanın. GoodbyeDPI Turkey\'nin tüm parametreleri.',
    badge: 'Agresif',
    badgeClass: 'aggressive',
    config: {
      port: 8080,
      windowSize: 1,
      timeout: 120,
      enableDoh: true,
      dnsAddr: '1.1.1.1',
      fragment: true,
      fragmentSize: 1,        // Minimum fragment boyutu
      wrongChecksum: true,
      setTtl: 2,              // Düşük TTL
      autoTtl: true,          // Otomatik TTL ayarlama
      wrongSeq: true,         // GoodbyeDPI: --wrong-seq
      nativeFrag: true,       // GoodbyeDPI: --native-frag
      reverseFrag: true,      // GoodbyeDPI: --reverse-frag
      mixHostCase: true,
      blockQUIC: true,
      pattern: ''
    }
  }
};

module.exports = {
  /**
   * Get all presets
   */
  getAll() {
    return Object.values(PRESETS);
  },

  /**
   * Get a specific preset by ID
   */
  get(id) {
    return PRESETS[id] || null;
  },

  /**
   * Get the default preset
   */
  getDefault() {
    return PRESETS['turkiye-genel'];
  },

  /**
   * Get preset IDs
   */
  getIds() {
    return Object.keys(PRESETS);
  }
};
