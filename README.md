# MacDPI - macOS için DPI Bypass Uygulaması 🚀

Bu proje, Türkiye'deki internet servis sağlayıcılarının (ISS) uyguladığı DNS ve DPI (Derin Paket İnceleme) engellemesini/yavaşlatmasını aşmak amacıyla geliştirilmiş şık, modern ve premium tasarımlı bir macOS masaüstü uygulamasıdır.

Windows tarafındaki popüler **GoodbyeDPI-Turkey** projesinin işlevlerini temel alan bu uygulama, macOS üzerinde sorunsuz çalışan **SpoofDPI** motoru üzerine inşa edilmiştir ve özellikle Apple Silicon (ARM64 - M1, M2, M3, M4, vb.) mimarisine sahip cihazlarla uyumludur.

---

## 🎨 Özellikler

- **🎛️ Tek Tıkla Bağlantı:** Büyük, neon-glow ve glassmorphic tasarımlı toggle butonu ile kolayca açılıp kapatılabilir.
- **🏢 Türkiye ISS Özel Presetleri:**
  - **Türkiye Genel (Varsayılan):** Tüm servis sağlayıcılar için genel ve en uyumlu DPI atlatma modudur.
  - **Türk Telekom / TTNet:** Türk Telekom altyapısına özel fragment boyutu ve sahte TTL ayarları.
  - **Vodafone / Superonline:** Vodafone altyapısına göre optimize edilmiş bypass stratejisi ve Google DNS entegrasyonu.
  - **Turkcell Superonline:** Turkcell fiber altyapısına özel TCP pencere boyutu ayarları.
  - **Agresif Mod:** Diğer modların çalışmadığı durumlarda tüm engelleri zorlayan gelişmiş bypass modudur.
- **🌐 Gelişmiş DNS ve DoH Desteği:**
  - Cloudflare, Google, Quad9 DNS profilleri veya Özel (Custom) DNS tanımlayabilme.
  - **DNS over HTTPS (DoH):** DNS sorgularınızı şifreleyerek ISS seviyesindeki DNS manipülasyonlarını tamamen engeller.
- **📊 Canlı Bağlantı Logları:** Bağlantı durumunu, trafik akışını ve arka planda gerçekleşen işlemleri anlık olarak izleyebileceğiniz görsel terminal alanı.
- **🖥️ macOS Sistem Çubuğu (Tray) Entegrasyonu:** Uygulama kapatıldığında dahi sistem çubuğunda (sağ üst köşede) yaşamaya devam eder, bağlantı durumuna göre renk değiştiren ikonla durum gösterir.
- **🔄 macOS Başlangıçta Otomatik Başlatma:** Uygulamayı sistem açılışında otomatik ve arka planda sessizce başlatabilme desteği.

---

## 🛠️ macOS Kurulumu ve Kullanımı

Uygulamanın çalışabilmesi için macOS'ta **SpoofDPI** motorunun ve **Homebrew** paket yöneticisinin yüklü olması önerilir.

### 1. Ön Gereksinimler (Eğer Yüklü Değilse)

Terminal uygulamanızı açın ve aşağıdaki komutları çalıştırın:

```bash
# Homebrew Kurulumu (Eğer sisteminizde yoksa)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# SpoofDPI Kurulumu
brew install spoofdpi
```

### 2. Uygulamayı İndirme ve Geliştirici Modunda Çalıştırma

Projeyi bilgisayarınıza klonlayıp hemen çalıştırabilirsiniz:

```bash
# Depoyu klonlayın
git clone https://github.com/EthernalFire58/macdpi.git
cd macdpi

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start
```

### 3. macOS Uygulaması (.app) ve Paketleme (.dmg) Oluşturma

Projeyi tek bir macOS uygulama paketi haline getirmek için:

```bash
# Apple Silicon (ARM64 - M1/M2/M3/M4) mimarisi için paketleme
npm run build
```
Bu işlem sonrasında `dist/` klasörü altında arkadaşınıza gönderebileceğiniz `.dmg` kurulum dosyası oluşacaktır.

---

## 🔒 Güvenlik & Sistem İzinleri
Uygulama, sistem genelindeki internet trafiğini yerel bir proxy üzerinden yönlendirerek DPI bypass işlemi gerçekleştirmektedir. macOS üzerinde ilk kez çalıştırdığınızda veya paketlediğinizde Gatekeeper uyarısı alırsanız:
1. Uygulamaya sağ tıklayıp **Aç** diyebilirsiniz.
2. Veya Terminal üzerinden karantina filtresini kaldırabilirsiniz:
   ```bash
   xattr -d -r com.apple.quarantine /Applications/MacDPI.app
   ```

---

## 📜 Lisans
Bu proje Apache 2.0 Lisansı ile korunmaktadır. Detaylar için `LICENSE` dosyasına göz atabilirsiniz.
