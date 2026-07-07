# macOS (ARM / Apple Silicon) Kurulum ve Çalıştırma Kılavuzu 

Bu kılavuz, Windows ortamında geliştirilen **MacDPI** uygulamasını, Apple Silicon (M1, M2, M3, M4 vb. ARM tabanlı) işlemcili bir Mac bilgisayarda nasıl sıfırdan kurup çalıştıracağınızı ve paketleyeceğinizi detaylıca açıklamaktadır.

---

## 📋 1. Adım: Ön Gereksinimlerin Kurulması

Uygulamanın çalışması için Mac cihazında bazı temel geliştirici araçlarının yüklü olması gerekir. Terminal'i (Uygulamalar -> İzlenceler -> Terminal) açıp sırasıyla aşağıdaki komutları çalıştırın:

### A. Xcode Komut Satırı Araçlarını Kurun
Derleme işlemlerinin ve temel Unix araçlarının düzgün çalışması için gereklidir:
```bash
xcode-select --install
```
*(Ekrana gelen onay penceresinde "Yükle" seçeneğine tıklayın ve işlemin tamamlanmasını bekleyin).*

### B. Homebrew (Paket Yöneticisi) Kurun
Mac üzerindeki en popüler paket yöneticisidir. SpoofDPI motorunu kurmak için kullanacağız:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
*Not: Kurulum bittikten sonra terminal ekranında çıkan "Next steps" (Sonraki adımlar) altındaki `echo ...` ve `eval ...` ile başlayan 2 komutu kopyalayıp terminale yapıştırarak çalıştırın.*

### C. Node.js ve NPM Kurun
Uygulamanın çalıştırılacağı JavaScript çalışma ortamıdır:
```bash
brew install node
```
Yüklemenin başarılı olduğunu doğrulamak için:
```bash
node -v
npm -v
```

### D. SpoofDPI Motorunu Kurun
DPI bypass işlemlerini arka planda gerçekleştirecek ana motoru kurun:
```bash
brew install spoofdpi
```

---

## 🚀 2. Adım: Uygulamayı Klonlama ve Çalıştırma

Ön gereksinimler tamamlandıktan sonra uygulamayı bilgisayarınıza indirip çalıştırabilirsiniz:

```bash
# 1. Depoyu klonlayın
git clone https://github.com/EthernalFire58/macdpi.git

# 2. Proje dizinine gidin
cd macdpi

# 3. Gerekli NPM paketlerini yükleyin
npm install

# 4. Uygulamayı geliştirme modunda başlatın
npm start
```
Bu komutla birlikte MacDPI uygulaması ekranda belirecek ve sistem çubuğunuza yerleşecektir.

---

## 📦 3. Adım: Standart macOS Uygulaması (.app) veya Kurulum Dosyası (.dmg) Oluşturma

Uygulamayı kod çalıştırmadan, normal bir macOS programı gibi çift tıklayarak açılacak şekilde paketlemek istiyorsanız:

```bash
# ARM64 (Apple Silicon M1/M2/M3/M4) işlemciler için derleme yapar
npm run build
```

Derleme işlemi bittiğinde, proje klasörünüzde `dist/` adında yeni bir klasör oluşacaktır:
* **`dist/MacDPI.dmg`**: Arkadaşınızla paylaşabileceğiniz kurulum dosyası.
* **`dist/mac-arm64/MacDPI.app`**: Doğrudan çalıştırılabilir macOS uygulama dosyası.

---

## 🔒 4. Adım: Güvenlik ve macOS Gatekeeper İzinleri (Önemli)

Apple, dışarıdan indirilen ve Apple Geliştirici Sertifikası ile imzalanmamış uygulamaları varsayılan olarak engeller. `.dmg` dosyasını kurup uygulamayı açmaya çalıştığınızda **"Geliştirici doğrulanamadığı için açılamıyor"** uyarısı alırsanız aşağıdaki adımları uygulayın:

### Kolay Yöntem (Finder):
1. **Finder** uygulamasını açın ve `/Uygulamalar` (Applications) klasörüne gidin.
2. **MacDPI** uygulamasına bulun, klavyeden **Control (Ctrl)** tuşuna basılı tutarak uygulamaya tıklayın ve açılan menüden **Aç (Open)** seçeneğini seçin.
3. Çıkan diyalog kutusunda tekrar **Aç** butonuna tıklayın. Uygulama artık güvenli olarak işaretlenecek ve bir daha bu uyarıyı vermeyecektir.

### Terminal Yöntemi:
Eğer yukarıdaki yöntem çalışmazsa veya uygulama arka planda proxy komutlarını çalıştırırken engellenirse, Terminal'e şu komutu yazarak karantina filtresini tamamen kaldırabilirsiniz:
```bash
xattr -d -r com.apple.quarantine /Applications/MacDPI.app
```

---

## 🛠️ Sorun Giderme

* **Bağlantı Aktif Ama Siteler Açılmıyor:** 
  Uygulama arayüzündeki **DNS** sekmesine gelin, **DoH (DNS over HTTPS)** seçeneğinin açık olduğundan emin olun ve farklı bir DNS sağlayıcısı (örn. Cloudflare veya Google) seçerek bağlantıyı kesip tekrar kurun.
* **SpoofDPI Bulunamadı Hatası:**
  Uygulama ayarlarında motorun kurulu olmadığı görünüyorsa, SpoofDPI'ın `/opt/homebrew/bin/spoof-dpi` dizininde olduğundan emin olun. Gerekirse terminalde `brew link spoofdpi` komutunu çalıştırın.
