# Configuration

<!-- GSD:generated -->

## Environment Variables

Tüm yapılandırma `.env.local` dosyasından okunur. `.env.example` şablonu proje kökünde yer alır.

```bash
cp .env.example .env.local
```

### Required Variables

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `SESSION_PASSWORD` | iron-session şifreleme anahtarı — minimum 32 karakter | `my-super-secret-32-char-session-key!!` |
| `APP_PASSWORD` | Uygulamaya giriş şifresi | `gizli-sifre-123` |

### Optional Variables

| Değişken | Varsayılan | Açıklama |
|----------|-----------|----------|
| `SESSION_COOKIE_NAME` | `sigorta-session` | Session cookie adı |
| `PYTHON_PATH` | Otomatik algılanır | Python 3 executable yolu (ör. `/usr/bin/python3`) |
| `LIBREOFFICE_PATH` | Otomatik algılanır | `soffice` yürütülebilir dosyanın yolu |

`PYTHON_PATH` ve `LIBREOFFICE_PATH` ayarlanmazsa uygulama `which python3` / `which soffice` komutuyla otomatik algılamaya çalışır. PDF şablon özelliği kullanılmayacaksa bu değerleri boş bırakabilirsiniz.

### Session Configuration

`SESSION_PASSWORD` değeri iron-session tarafından AES-256 şifreleme için kullanılır. Minimum 32 karakter olmalıdır. Session süresi 7 gündür (`ttl = 604800` saniye). Cookie HTTPS üzerinde `Secure` flag'i alır; `localhost` geliştirmesinde `http` üzerinde çalışır.

## Database

| Parametre | Değer |
|-----------|-------|
| Konum | `./data/db.sqlite` |
| Sürücü | `better-sqlite3` |
| Journal modu | WAL (`PRAGMA journal_mode = WAL`) |
| Busy timeout | 5000 ms (`PRAGMA busy_timeout = 5000`) |
| Foreign keys | Etkin (`PRAGMA foreign_keys = ON`) |
| Özel UDF | `lower_tr()` — Türkçe küçük harf LIKE araması |

`data/` dizini ve `db.sqlite` dosyası git ile takip edilmez. İlk kurulumda `pnpm run db:migrate` komutu dosyayı ve tüm tabloları oluşturur.

### Migration

```bash
pnpm run db:generate  # lib/schema.ts değişikliklerinden SQL üret
pnpm run db:migrate   # Bekleyen migration'ları uygula
pnpm run db:studio    # Drizzle Studio web arayüzü (opsiyonel)
```

Migration dosyaları `./drizzle/*.sql` altındadır ve idempotent yapıdadır (yeniden çalıştırılabilir).

## File Storage

| Tür | Konum |
|-----|-------|
| Müvekkil belgeleri | `./uploads/belge/` veya ad tabanlı klasörler |
| Şablon `.docx` dosyaları | `./uploads/templates/` |

`uploads/` dizini git ile takip edilmez. Maksimum dosya boyutu 20 MB'tır.

## Next.js Configuration

`next.config.ts` içindeki temel ayarlar:

| Ayar | Değer | Neden |
|------|-------|-------|
| `serverExternalPackages` | `['better-sqlite3']` | Native SQLite addon'ı istemci bundle'a dahil etmemek için |
| Yönlendirmeler | `/dilekce*` → `/ayarlar` | Kaldırılan eski dilekçe editörü |

## Python Sidecar (PDF Pipeline)

PDF şablon özelliği için sisteminizde Python 3.8+ ve LibreOffice kurulu olması gerekir. Sidecar `scripts/docx-pipeline/` klasöründe yer alır.

```bash
# Python bağımlılıklarını kurmak için
cd scripts/docx-pipeline
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Sidecar sağlık durumunu kontrol etmek için:

```
GET /api/pipeline/health   # veya tRPC: trpc.pipeline.health.query()
```

Sidecar yanıt vermiyorsa `PYTHON_PATH` ve `LIBREOFFICE_PATH` değişkenlerini kontrol edin.

## Drizzle Studio

```bash
pnpm run db:studio  # http://local.drizzle.studio adresinde açılır
```

Veritabanı içeriğini görsel olarak incelemek ve düzenlemek için kullanılır. Yalnızca geliştirme ortamında çalıştırın.
