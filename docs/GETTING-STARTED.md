# Getting Started

<!-- generated-by: gsd-doc-writer -->

## Prerequisites

| Gereksinim | Minimum Sürüm | Notlar |
|-----------|--------------|--------|
| Node.js | 18+ | `node --version` ile kontrol edin |
| pnpm | 11.5.0 | `corepack enable` ile etkinleştirin (proje bu sürüme sabitlenmiştir) |
| Python | 3.8+ | PDF şablon özelliği için (opsiyonel) |
| LibreOffice | Herhangi bir güncel sürüm | PDF şablon özelliği için (opsiyonel) — [libreoffice.org](https://www.libreoffice.org) adresinden indirin |

PDF şablon özelliği (`.docx` → PDF) kullanmayacaksanız Python ve LibreOffice gerekmez.

## Installation

### Otomatik Kurulum (Windows — önerilen)

Son kullanıcılar için tek tıkla kurulum. Aşağıdaki manuel adımların tamamını sizin yerinize yapar.

1. Depo klasöründeki **`setup.bat`** dosyasına çift tıklayın.
2. İstendiğinde uygulamaya giriş şifresini (`APP_PASSWORD`) belirleyin ve opsiyonel özellikleri seçin:
   - **Şablondan PDF üretimi** — `.docx → PDF` için Python pipeline'ı kurulsun mu? (Python 3.8+ ve LibreOffice gerektirir.)
   - **Telegram bildirimleri** — kurulacaksa betik sizden `TELEGRAM_BOT_TOKEN` (@BotFather) ve `TELEGRAM_CHAT_ID` (@userinfobot) değerlerini ister; seçmezseniz alanlar boş bırakılır ve bildirimler atlanır.
3. Betik şunları otomatik yürütür:
   - Node.js 18+ kontrolü — kurulu değilse `winget` ile kurar (winget yoksa nodejs.org bağlantısını gösterip durur).
   - `corepack` ile pnpm@11.5.0 etkinleştirme.
   - `pnpm install --frozen-lockfile`.
   - `.env.local` oluşturma — kriptografik olarak güvenli, 48 karakterlik rastgele bir `SESSION_PASSWORD` üretir; `APP_PASSWORD` değerini sizden alır. **Mevcut bir `.env.local` dosyasının üzerine asla yazılmaz.**
   - `pnpm build` ve `pnpm db:migrate`.
   - Şablon-PDF özelliğini seçtiyseniz `.docx → PDF` pipeline'ını kurar (Python yoksa uyarır; uygulama yine de çalışır).
   - Masaüstü ve Başlat menüsünde **Kairos** kısayolu oluşturur.
4. Kurulum bitince masaüstündeki **Kairos** kısayoluna (veya **`start-kairos.bat`**) çift tıklayın; tarayıcı [http://localhost:3000](http://localhost:3000) adresini açar.

> **Güvenlik notu:** `setup.bat`, yerel `installer\install.ps1` betiğini `-ExecutionPolicy Bypass` ile çalıştırır (imzasız yerel betikler için gereklidir). Betik internetten kod indirip çalıştırmaz; yalnızca resmi `winget` paketinden Node.js kurar. Sırlar ekrana yazılmaz veya okunmaz.

Kurulum sırasında "Node.js kuruldu, pencereyi kapatıp `setup.bat`'i tekrar çalıştırın" uyarısı görürseniz bu normaldir — yeni `PATH`'in tanınması içindir.

### Manuel Kurulum

### 1. Bağımlılıkları kurun

```bash
pnpm install
```

### 2. Ortam değişkenlerini yapılandırın

```bash
cp .env.example .env.local
```

`.env.local` dosyasını bir metin editörüyle açın ve şu alanları doldurun:

```env
SESSION_PASSWORD=en-az-32-karakter-uzun-bir-gizli-anahtar-buraya
APP_PASSWORD=uygulamaya-giris-sifreniz
SESSION_COOKIE_NAME=sigorta-session   # isteğe bağlı, varsayılan bu
```

`SESSION_PASSWORD` minimum 32 karakter olmalıdır — kısa değerler iron-session tarafından reddedilir.

### 3. Veritabanını oluşturun

```bash
pnpm run db:migrate
```

Bu komut `./data/db.sqlite` dosyasını oluşturur ve tüm tabloları kurar. `data/` dizini otomatik oluşturulur.

### 4. Uygulamayı başlatın

```bash
pnpm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın. Ayarladığınız `APP_PASSWORD` ile giriş yapın.

## PDF Template Feature (Optional)

Şablon tabanlı PDF üretimi için Python bağımlılıklarını kurun:

### Windows (PowerShell)

```powershell
cd scripts/docx-pipeline
.\setup-venv.ps1
```

### Manuel kurulum

```bash
cd scripts/docx-pipeline
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Python ve LibreOffice yolları otomatik algılanır. Otomatik algılama başarısız olursa `.env.local`'a ekleyin:

```env
PYTHON_PATH=/usr/bin/python3
LIBREOFFICE_PATH=/usr/bin/soffice
```

Sidecar durumunu uygulamadan kontrol etmek için: **Ayarlar** → **Genel** → Pipeline durumu bölümüne bakın.

## First Steps

Uygulamaya girdikten sonra önerilen başlangıç adımları:

1. **Ayarlar** — Sigorta şirketleri, mahkemeler ve sigorta türlerini tanımlayın
2. **Müvekkiller** → **Yeni Müvekkil** — İlk müvekkili ekleyin
3. **Dosyalar** → **Yeni Dosya** — Dava dosyası oluşturun ve bir müvekkile bağlayın
4. **Şablon Yönetimi** — Varsa `.docx` şablonlarınızı yükleyin

## Directory Structure After Setup

```
data/
  db.sqlite             ← tüm uygulama verisi (git dışı)
uploads/
  belge/                ← yüklenen belgeler (git dışı)
  templates/            ← şablon .docx dosyaları (git dışı)
scripts/docx-pipeline/
  .venv/                ← Python sanal ortamı (git dışı)
```

## Troubleshooting

**"SESSION_PASSWORD must be at least 32 characters" hatası**
→ `.env.local` dosyasındaki `SESSION_PASSWORD` değerinin 32+ karakter olduğunu doğrulayın.

**Veritabanı bulunamadı hatası**
→ `pnpm run db:migrate` komutunu çalıştırın.

**PDF üretimi çalışmıyor**
→ Python ve LibreOffice kurulu olduğunu doğrulayın. `PYTHON_PATH` / `LIBREOFFICE_PATH` değişkenlerini ayarlayın.

**Port 3000 kullanımda**
→ `pnpm run dev -- --port 3001` ile farklı port kullanın.

## Next Steps

- [DEVELOPMENT.md](DEVELOPMENT.md) — Geliştirme ortamı kurulumu, build komutları, kod stili
- [TESTING.md](TESTING.md) — Test çerçevesi, test çalıştırma, kapsama oranları
- [CONFIGURATION.md](CONFIGURATION.md) — Tüm ortam değişkenleri ve ayar seçenekleri
- [ARCHITECTURE.md](ARCHITECTURE.md) — Sistem mimarisi ve veri akışı
- [API.md](API.md) — API endpoint'leri, istek/yanıt formatları
