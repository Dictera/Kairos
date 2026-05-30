# Kairos

<!-- generated-by: gsd-doc-writer -->

Sigorta uyuşmazlık davalarını takip eden, avukatlar için tasarlanmış yerel çalışan web uygulaması. Sigorta Tahkim Komisyonu ve mahkeme süreçlerini, duruşma takvimini, kritik süreleri ve dosyaya ait tüm belge ile finans kayıtlarını tek ekrandan yönetir.

## Özellikler

- **Dosya Yönetimi** — Dava dosyası oluşturma/düzenleme, 6 sekme (Genel Bilgiler, Yargılama Süreci, Belgeler, Notlar / Zaman Çizelgesi, Karşı Taraflar, Dosya Finansı)
- **STK Süreç Takibi** — 9 aşamalı STK izleme (İhtar → Kesinleşme), otomatik tarih hesaplama
- **Mahkeme Süreç Takibi** — 12 aşamalı mahkeme izleme, birden fazla duruşma kaydı
- **Otomatik Süre Hesaplama** — STK itiraz (10 gün), istinaf (14 gün), cevap dilekçesi (14 gün); adli tatil uyarıları
- **Belge Yönetimi** — 20 MB'a kadar yükleme/indirme, kategori etiketleri, silme
- **Şablon & PDF Üretimi** — `.docx` şablon yükleme, Jinja2 değişken doldurma, LibreOffice headless PDF dönüşümü
- **Finans Takibi** — Gelen/Giden/Masraf girişleri, net bakiye, finans dashboard
- **Raporlar** — Portföy ve finansal raporlar, PDF dışa aktarım
- **Dashboard & Takvim** — İstatistik kartları, aciliyet rozetleri, günün duruşmaları, aylık takvim görünümü
- **Müvekkil Yönetimi** — Tam CRUD, Türkçe arama, bağlı dosya sayısı
- **Ayarlar** — Sigorta şirketi, mahkeme, sigorta türü, avukat CRUD yönetimi
- **Telegram Bildirimleri** — Opsiyonel bot entegrasyonu; günlük duruşma uyarıları, 7 gün içindeki süre bildirimleri ve haftalık özet

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Veritabanı | SQLite (`better-sqlite3`) + Drizzle ORM |
| API | tRPC v11 + React Query |
| Auth | iron-session (HttpOnly cookie, env tabanlı şifre) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Validation | Zod |
| PDF | pdfmake (raporlar), LibreOffice headless (şablon PDF) |
| Test | Vitest |

## Hızlı Başlangıç

1. **Node.js 18+** kur — [nodejs.org](https://nodejs.org)
2. **pnpm** kur — `npm install -g pnpm`
3. **Python 3.8+** kur — [python.org](https://www.python.org) (PDF şablon özelliği için)
4. **LibreOffice** kur — [libreoffice.org](https://www.libreoffice.org) (PDF dönüşümü için)
5. Bağımlılıkları yükle:
   ```bash
   pnpm install
   ```
6. Ortam değişkenlerini ayarla:
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` dosyasını açıp `SESSION_PASSWORD` ve `APP_PASSWORD` alanlarını doldur.
7. Veritabanı şemasını oluştur:
   ```bash
   pnpm run db:migrate
   ```
8. Python bağımlılıklarını yükle:
   ```bash
   cd scripts/docx-pipeline
   python3 -m venv .venv
   ```
   ```bash
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
   ```bash
   pip install -r requirements.txt
   cd ../..
   ```
9. Uygulamayı başlat:
   ```bash
   pnpm run dev
   ```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın. `.env.local`'daki `APP_PASSWORD` ile giriş yapın.

Detaylı kurulum ve sorun giderme için [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) belgesine bakın.

## Proje Yapısı

```
app/
  (auth)/           # Giriş sayfası
  (dashboard)/      # Ana uygulama (dosyalar, müvekkiller, finans, raporlar, ayarlar…)
  api/              # REST route handlers (upload, files, raporlar, templates)
components/         # React bileşenleri (shadcn/ui tabanlı)
lib/
  schema.ts         # Drizzle ORM şeması (tüm tablolar + relations)
  db.ts             # SQLite bağlantısı (globalThis singleton, WAL modu)
  trpc/routers/     # tRPC router'ları (dosya, müvekkil, finans, belge, şablon…)
  docx/             # Şablon değişken kayıt defteri ve context builder
  pipeline/         # Python sidecar IPC protokolü ve sağlık kontrolü
  services/         # Docx pipeline köprüsü, değişken ikamesi
  telegram/         # Telegram bot bildirimleri (cron, haftalık özet)
data/               # db.sqlite (git dışı)
uploads/            # Yüklenen dosyalar (git dışı)
drizzle/            # Migration SQL dosyaları
tests/              # Vitest test dosyaları
scripts/            # Python sidecar (docx-pipeline, PDF generator)
```

## Belgeler

| Belge | İçerik |
|-------|--------|
| [GETTING-STARTED.md](docs/GETTING-STARTED.md) | İlk kurulum, gereksinimler |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Geliştirme ortamı, mimari kararlar |
| [TESTING.md](docs/TESTING.md) | Test stratejisi, komutlar |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Ortam değişkenleri, yapılandırma |
| [API.md](docs/API.md) | tRPC router'ları ve API endpoint'leri |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Mimari genel bakış |

## Lisans

[MIT](LICENSE) © 2026 Dictera
