<!-- generated-by: gsd-doc-writer -->

# Configuration

## Environment Variables

Tüm yapılandırma `.env.local` dosyasından okunur (Next.js tarafından otomatik yüklenir). `.env.example` şablonu proje kökünde yer alır.

```bash
cp .env.example .env.local
```

### Required Variables

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `SESSION_PASSWORD` | iron-session şifreleme anahtarı — minimum 32 karakter | `my-super-secret-32-char-session-key!!` |
| `APP_PASSWORD` | Uygulamaya giriş şifresi | `gizli-sifre-123` |

Bu değişkenler tanımlanmazsa uygulama başlatılamaz: `SESSION_PASSWORD` olmadan iron-session başlatılamaz, `APP_PASSWORD` olmadan giriş yapılamaz.

### Optional Variables

| Değişken | Varsayılan | Açıklama |
|----------|-----------|----------|
| `SESSION_COOKIE_NAME` | `sigorta-session` | Session cookie adı |
| `PYTHON_PATH` | Otomatik algılanır | Python 3 executable yolu (ör. `/usr/bin/python3`) |
| `LIBREOFFICE_PATH` | Otomatik algılanır | `soffice` yürütülebilir dosyanın yolu |

`PYTHON_PATH` ayarlanmazsa uygulama `which python3` ve `which python` komutlarıyla otomatik algılamaya çalışır. `LIBREOFFICE_PATH` ayarlanmazsa işletim sistemine göre varsayılan konum kontrol edilir:
- **Linux:** `/usr/bin/soffice`
- **macOS:** `/Applications/LibreOffice.app/Contents/MacOS/soffice`
- **Windows:** `C:\Program Files\LibreOffice\program\soffice.exe`

PDF şablon özelliği kullanılmayacaksa bu iki değeri boş bırakabilirsiniz.

### Session Configuration

`SESSION_PASSWORD` değeri iron-session tarafından AES-256 şifreleme için kullanılır. Minimum 32 karakter olmalıdır. Session süresi 7 gündür (`ttl = 604800` saniye). Cookie ayarları (`lib/session.ts`):

| Parametre | Değer |
|-----------|-------|
| `httpOnly` | `true` |
| `secure` | `true` yalnızca production (`NODE_ENV === 'production'`) |
| `sameSite` | `lax` |
| `path` | `/` |

### Per-Environment Overrides

Next.js ortam değişkeni öncelik sırasına göre şu dosyaları yükler:
1. `.env` (tüm ortamlar)
2. `.env.local` (tüm ortamlar, yerel override — gitignore'da)
3. `.env.{NODE_ENV}` (ortama özel, ör. `.env.development`, `.env.production`)
4. `.env.{NODE_ENV}.local` (ortama özel yerel override)

Projede şu anda yalnızca `.env.example` ve `.env.local` dosyaları bulunur. Farklı ortamlar için `.env.development` veya `.env.production` dosyaları oluşturarak ortama özel değişkenler tanımlayabilirsiniz.

`NODE_ENV` değeri session cookie `secure` flag'ini kontrol eder: production'da `true`, development'ta `false`.

## Config Files

Proje kökünde bulunan yapılandırma dosyaları:

| Dosya | Amaç |
|-------|------|
| `next.config.ts` | Next.js yapılandırması (yönlendirmeler, external packages) |
| `drizzle.config.ts` | Drizzle ORM ve migration ayarları |
| `tailwind.config.ts` | Tailwind CSS tema ve içerik ayarları |
| `postcss.config.mjs` | PostCSS eklentileri |
| `eslint.config.mjs` | ESLint kuralları |

### Next.js Configuration (`next.config.ts`)

| Ayar | Değer | Neden |
|------|-------|-------|
| `serverExternalPackages` | `['better-sqlite3']` | Native SQLite addon'ı istemci bundle'a dahil etmemek için |
| Yönlendirmeler | `/dilekce` → `/ayarlar`, `/dilekce/:path*` → `/ayarlar` | Kaldırılan eski dilekçe editörü |

### Drizzle Configuration (`drizzle.config.ts`)

| Parametre | Değer |
|-----------|-------|
| Dialect | `sqlite` |
| Schema dosyası | `./lib/schema.ts` |
| Migration çıktı dizini | `./drizzle` |
| Veritabanı URL'i | `./data/db.sqlite` |

## Database

| Parametre | Değer |
|-----------|-------|
| Konum | `./data/db.sqlite` |
| Sürücü | `better-sqlite3` |
| Journal modu | WAL (`PRAGMA journal_mode = WAL`) |
| Busy timeout | 5000 ms (`PRAGMA busy_timeout = 5000`) |
| Foreign keys | Etkin (`PRAGMA foreign_keys = ON`) |
| Özel UDF | `lower_tr()` — Türkçe küçük harf (ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i, İ→i) LIKE araması için |

`data/` dizini ve `db.sqlite` dosyası git ile takip edilmez. İlk kurulumda `pnpm run db:migrate` komutu dosyayı ve tüm tabloları oluşturur. Veritabanı bağlantısı `globalThis` singleton ile Next.js hot reload sırasında çoklu bağlantı oluşmasını engeller (`lib/db.ts`).

### Migration

```bash
pnpm run db:generate  # lib/schema.ts değişikliklerinden SQL üret (./drizzle/*.sql)
pnpm run db:migrate   # Bekleyen migration'ları uygula
pnpm run db:studio    # Drizzle Studio web arayüzü (opsiyonel)
```

Migration dosyaları `./drizzle/*.sql` altındadır ve her biri bir önceki migration durumuna bağlı olarak çalışır. Aynı migration'ı iki kez çalıştırmak `CREATE TABLE` hatalarına yol açar — Drizzle Kit migration durumunu `drizzle.__drizzle_migrations` tablosunda takip eder.

## File Storage

| Tür | Konum | Maks. Boyut |
|-----|-------|-------------|
| Müvekkil belgeleri | `E:/sigorta-belgeler/{tur}/{sigortaTuru}/{muvekkilAd}/` | 20 MB |
| Şablon `.docx` dosyaları | `./uploads/templates/` | 10 MB |

`uploads/` dizini git ile takip edilmez. Müvekkil belgeleri `E:/sigorta-belgeler` sabit yolunda, dosya türüne (STK / Asliye Ticaret / Asliye Hukuk), sigorta türüne ve müvekkil adına göre hiyerarşik klasör yapısında saklanır (`lib/belgeler-storage.ts`).

İzin verilen belge türleri: PDF, DOC, DOCX, JPEG, PNG. Şablon yüklemelerinde yalnızca `.docx` uzantısı kabul edilir.

## Python Sidecar (PDF Pipeline)

PDF şablon özelliği için sisteminizde Python 3.8+ ve LibreOffice kurulu olması gerekir. Sidecar `scripts/docx-pipeline/` klasöründe yer alır.

```bash
# Python bağımlılıklarını kurmak için
cd scripts/docx-pipeline
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Bağımlılıklar (`requirements.txt`): `pydantic`, `docxtpl`, `Jinja2`, `Babel`, `python-slugify`, `structlog`, `tenacity`.

Sidecar `.venv` dizini algılanırsa uygulama otomatik olarak venv Python'unu kullanır (`lib/pipeline/config.ts` → `getSidecarPythonPath()`).

Sidecar sağlık durumunu kontrol etmek için:

```
tRPC: trpc.pipeline.healthCheck.query()
# veya alternatif: trpc.pipeline.status.query() (basitleştirilmiş durum)
```

Sağlık sonucu 2 saat boyunca cache'lenir. Sidecar yanıt vermiyorsa `PYTHON_PATH` ve `LIBREOFFICE_PATH` değişkenlerini kontrol edin.

## Drizzle Studio

```bash
pnpm run db:studio  # Varsayılan adreste açılır
```

<!-- VERIFY: Drizzle Studio tam URL (varsayılan: https://local.drizzle.studio) — sürüme göre değişebilir -->
Veritabanı içeriğini görsel olarak incelemek ve düzenlemek için kullanılır. Yalnızca geliştirme ortamında çalıştırın.
