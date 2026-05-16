<!-- generated-by: gsd-doc-writer -->

# Architecture

## Overview

Sigorta Uyuşmazlık Takip, avukatlar için yerel çalışan (offline-first) Next.js 16 web uygulamasıdır. İnternet bağlantısı gerektirmez; tüm veri yerel SQLite dosyasında tutulur.

```
Tarayıcı
  │
  ├── Next.js 16 App Router (React 19 Server + Client Components)
  │     ├── (auth)/login          — Giriş sayfası
  │     └── (dashboard)/          — Korumalı uygulama sayfaları
  │           ├── page            — Dashboard
  │           ├── dosyalar/       — Dava dosyaları
  │           ├── muvekkiller/    — Müvekkiller
  │           ├── finans/         — Finans takibi
  │           ├── raporlar/       — Raporlar (PDF/Excel)
  │           ├── belgeler/       — Belge yönetimi
  │           ├── takvim/         — Duruşma takvimi
  │           ├── sablon-yonetimi/— Şablon yönetimi
  │           └── ayarlar/        — Ayarlar CRUD
  │
  ├── tRPC v11 (type-safe API katmanı)
  │     └── app/api/trpc/[trpc]/  — tRPC HTTP handler
  │
  ├── REST Handlers (app/api/)
  │     ├── upload/               — Belge ve şablon yükleme
  │     ├── files/                — Statik dosya servisi
  │     ├── raporlar/             — PDF/Excel rapor üretim
  │     └── templates/            — Şablon dosya servisi
  │
  └── SQLite (better-sqlite3 + Drizzle ORM)
        └── ./data/db.sqlite
```

## Data Flow

Tipik bir sayfa isteğinin sistemdeki akışı:

1. **Tarayıcı** Next.js App Router'a istek gönderir.
2. **middleware** (Next.js redirects) `/dilekce/*` rotalarını `/ayarlar`'a yönlendirir.
3. **Layout** (`app/(dashboard)/layout.tsx`) her korumalı sayfa render'ında çalışır; iron-session cookie'sini kontrol eder (session doğrulama layout seviyesinde, auth middleware seviyesinde değil).
4. **Client Component** (`'use client'`) render olduğunda React Query (`@tanstack/react-query`) tRPC client üzerinden sorguları başlatır.
5. **tRPC client** (`lib/trpc/context.ts`) HTTP isteğini `/api/trpc/{router}.{procedure}` endpoint'ine gönderir.
6. **tRPC handler** (`app/api/trpc/[trpc]/route.ts`) `fetchRequestHandler` ile isteği işler, `createTRPCContext` ile session bilgisini `ctx`'e enjekte eder.
7. **tRPC router** (`lib/trpc/routers/_app.ts` → alt router) input'u Zod ile doğrular (`protectedProcedure` yetkisiz erişimde `UNAUTHORIZED` fırlatır).
8. **Business logic** doğrudan router içinde veya `lib/services/` modülleri üzerinden veritabanına erişir.
9. **Drizzle ORM** (`lib/db.ts`) tip güvenli SQL sorgularını `better-sqlite3` üzerinden `./data/db.sqlite`'e gönderir.
10. **superjson** transformer sonucu serialize eder; `Date`, `bigint` gibi tipler istemcide native olarak geri döner.
11. **React Query** sonucu önbelleğe alır ve bileşen yeniden render edilir.

**PDF üretim akışı:** tRPC `pdfRouter.generate` → `lib/services/docx-pipeline.ts` → Python sidecar (`scripts/docx-pipeline/main.py`) stdin/stdout JSON IPC üzerinden → Jinja2 render → LibreOffice .docx→.pdf dönüşümü → `lib/docx/archive.ts` ile transactional PDF arşivleme ve DB insert.

## Layer Breakdown

### 1. Presentation Layer (app/ + components/)

- **Next.js App Router** — Server Components varsayılan; sadece interaktif kısımlar `'use client'` taşır.
- **shadcn/ui + Radix UI** — Bileşen kütüphanesi; `components/` altında sayfa bazlı organize edilmiş.
- **Tailwind CSS v4** — Utility-first stil; `tailwind.config.ts` ile özelleştirilmiş.
- **Layout koruması** — `app/(dashboard)/layout.tsx` her isteği iron-session ile doğrular; yetkisiz istekler `/login`'e yönlendirilir.

### 2. API Layer (tRPC + REST)

- **tRPC v11** — Tüm iş mantığı 17 router girişi üzerinden akar (16 alt router + `health` prosedürü); end-to-end TypeScript tip güvenliği sağlar.
- **superjson** — `Date`, `bigint` gibi tipleri JSON'a encode/decode eder.
- **React Query v5** — İstemci tarafı önbellekleme ve sunucu durum yönetimi.
- **REST handlers** — Dosya yükleme (`/api/upload`), statik dosya servisi (`/api/files`), PDF/Excel üretim (`/api/raporlar`) ve şablon servisi (`/api/templates`) tRPC dışı kaldı çünkü binary payload aktarımı gerektirirler.

### 3. Business Logic (lib/)

```
lib/
  schema.ts              — Drizzle tablo şemaları ve relations
  db.ts                  — SQLite bağlantısı (globalThis singleton)
  trpc/
    init.ts              — tRPC context + middleware
    routers/             — 16 router (muvekkil, dosya, surec, sure, belge, finans…)
    context.ts           — React Query tRPC client bağlamı
  docx/
    variable-registry.ts — Şablon değişken tanım kataloğu (kaynak doğrusu)
    context-builder.ts   — Drizzle relations → Jinja2 context mapping
    archive.ts           — Transactional PDF arşiv + DB insert
  pipeline/
    protocol.ts          — Python sidecar IPC tip tanımları (CommandEnvelope, CommandResult)
    config.ts            — Python/LibreOffice yol çözümleme
    error-codes.ts       — Pipeline hata kodu eşlemeleri
    health-check.ts      — Sidecar sağlık kontrolü (2 saatlik TTL önbellek)
  services/
    docx-pipeline.ts     — Python sidecar köprüsü (stdin/stdout JSON IPC)
    degisken-substitution.ts — Değişken yer değiştirme yardımcısı
  validators/            — Zod input doğrulama şemaları
  deadline-service.ts    — Türk takvim kurallı süre hesaplama fonksiyonları
  session.ts             — iron-session yapılandırması
  utils.ts               — cn() yardımcısı, varSyntax()
  belgeler-storage.ts    — Belge dosya sistemi yol mantığı
```

### 4. Data Layer (SQLite + Drizzle ORM)

- **Veritabanı:** `./data/db.sqlite` (WAL modu, `busy_timeout = 5000`, `foreign_keys = ON`)
- **ORM:** Drizzle ORM — tip güvenli sorgular, migration yönetimi (`drizzle-kit`)
- **Özel SQLite fonksiyonu:** `lower_tr()` — Türkçe karakterleri (`ş,ğ,ü,ö,ç,ı,İ`) karşılaştıran LIKE araması için
- **Migration dosyaları:** `./drizzle/*.sql` — idempotent, yeniden çalıştırılabilir

### 5. PDF Pipeline (Python Sidecar)

Şablon tabanlı PDF üretimi için Node.js'in dışında ayrı bir Python sidecar süreci çalışır:

```
tRPC pdfRouter
  → lib/services/docx-pipeline.ts  (Node köprüsü)
    → scripts/docx-pipeline/       (Python sidecar)
      ├── main.py                  (JSON stdin/stdout IPC, pydantic v2 CommandEnvelope;
      │                               tüm komutlar bu dosyada yönetilir)
      ├── convert.py               (LibreOffice headless .docx → .pdf)
      ├── filters.py               (Jinja2 TR filtreleri: tr_currency, tarih, upper_tr, lower_tr)
      └── requirements.txt         (Python bağımlılıkları)
```

- **Render mantığı:** `main.py` içinde `handle_render()`; `docxtpl` kullanarak Jinja2 ile şablon doldurur. Ayrı bir `render.py` dosyası yoktur.
- **Arşiv mantığı:** Node tarafında `lib/docx/archive.ts`; PDF'i diske yazar ve `belge` + `olay_gunlugu` tablolarına atomik olarak INSERT yapar.
- **IPC protokolü:** JSON `CommandEnvelope` stdin/stdout üzerinden; komutlar: `extract-vars`, `render`, `convert`, `health-check`, `slug`
- **Exit kodları:** 0=başarı, 1=validation, 2=render, 3=convert, 4=arşiv (Node-side), 99=internal
- **LibreOffice yalıtımı:** Her çağrı için benzersiz `UserInstallation` profili (`-env:UserInstallation=file:///TEMP/lo-{uuid}`) → SingletonLock engellenmez
- **Health check önbelleği:** 2 saatlik TTL, modül seviyesi singleton

## Key Abstractions

| Soyutlama | Konum | Açıklama |
|-----------|-------|----------|
| `appRouter` (type `AppRouter`) | `lib/trpc/routers/_app.ts` | Kök tRPC router; tüm alt router'ları ve `health` prosedürünü birleştirir. |
| `protectedProcedure` | `lib/trpc/init.ts` | Yetkilendirme kontrollü tRPC prosedür fabrikası; `session.isLoggedIn` false ise `UNAUTHORIZED` fırlatır. |
| `SurecDetay` / `StkSurecData` / `MahkemeSurecData` | `lib/schema.ts` | Dosya süreç durumunu JSON olarak DB'de saklayan tip ailesi; `parseSurecDetay()` / `serializeSurecDetay()` yardımcılarıyla. |
| `DosyaWithRelations` | `lib/docx/context-builder.ts` | Tüm ilişkileri join edilmiş dosya tipi; Jinja2 context oluşturma için girdi. |
| `VARIABLE_REGISTRY` (type `VariableInfo`) | `lib/docx/variable-registry.ts` | 161 şablon değişkeninin path, sekme ve etiket tanım kataloğu. |
| `buildJinja2Context()` | `lib/docx/context-builder.ts` | `DosyaWithRelations` → Jinja2 `{{ }}` context sözlüğüne dönüştürür. |
| `CommandEnvelope` / `CommandResult` | `lib/pipeline/protocol.ts` | Python sidecar ile stdin/stdout JSON IPC protokolünün Zod şemaları. |
| `runSidecarCommand()` | `lib/services/docx-pipeline.ts` | Python sidecar'ı `execa` ile çağıran Node.js köprü fonksiyonu; `reject: false` ile exit kodlarını yakalar. |
| `calcStkItirazSuresi()`, `calcIstinafBasvurusu()` | `lib/deadline-service.ts` | Saf süre hesaplama fonksiyonları (DB bağlantısı yok); birim test edilebilir. |
| `db` (globalThis singleton) | `lib/db.ts` | `better-sqlite3` → `drizzle()` bağlantısı; `lower_tr()` UDF kaydı, pragma yapılandırması. |

## Directory Structure Rationale

| Dizin | Amaç |
|-------|------|
| `app/` | Next.js 16 App Router sayfaları, layout'lar ve API rotaları. `(auth)` ve `(dashboard)` route grupları ile layout paylaşımı. |
| `components/` | shadcn/ui + Radix UI bileşenleri; sayfa (`dosya/`, `muvekkil/`, `finans/`) ve shared (`ui/`) alt dizinlerine ayrılmış. |
| `lib/` | Sunucu tarafı iş mantığı, tRPC router'ları, Drizzle şeması, pipeline protokolü, validators. İstemciden izole; `better-sqlite3` native modülü sadece burada import edilir. |
| `scripts/` | Python sidecar (`docx-pipeline/`) ve yardımcı betikler. Node.js runtime'ından bağımsız süreçler. |
| `drizzle/` | Drizzle ORM migration SQL dosyaları (`*.sql`) ve metadata. `drizzle-kit generate` ile üretilir. |
| `tests/` | Vitest birim ve entegrasyon testleri; şema, router ve servis fonksiyonları kapsanır. |
| `data/` | SQLite veritabanı dosyası (`db.sqlite`). `.gitignore` ile dışlanmıştır. |
| `uploads/` | Yüklenen belgeler ve şablon dosyaları; UUID suffix ile adlandırılır. |
| `docs/` | Proje dokümantasyonu (ARCHITECTURE, GETTING-STARTED, DEVELOPMENT, TESTING, API, CONFIGURATION). |
| `.github/` | CI workflow'ları; `ci.yml` lint, build ve test aşamalarını çalıştırır. |

## Key Data Model

```
muvekkil ──< dosya >── taraf
                   │
                   ├──< sure          (süreler/deadlines)
                   ├──< durusma       (duruşmalar)
                   ├──< belge         (yüklenen dosyalar)
                   ├──< finans_kalemi (gelir/gider/masraf)
                   ├──< dosya_not     (notlar)
                   └──< olay_gunlugu  (aktivite zaman çizelgesi)

dosya.surec_detay ← JSON (StkSurecData | MahkemeSurecData)

sigorta_sirketi ──< avukat_sigorta_sirketi >── avukat
sigorta_sirketi ──< dosya (karsitaraf_sigorta_id)
avukat          ──< taraf (avukat_id)

docx_sablon ← şablon .docx dosyaları (uploads/templates/)
belge       ← yüklenen belgeler (uploads/belge/ veya ad-only klasörler)
bildirim    ← sistem tarafından senkronize edilen duruşma/süre bildirimleri
```

## Authentication

- **Strateji:** Tek kullanıcı; şifre `.env.local`'daki `APP_PASSWORD` değeriyle karşılaştırılır
- **Session:** iron-session HttpOnly cookie (`SESSION_COOKIE_NAME`, varsayılan: `sigorta-session`), 7 gün TTL
- **Koruma:** `(dashboard)/layout.tsx` her sayfa render'ında session kontrolü yapar; tRPC `protectedProcedure` yetkisiz API çağrılarını engeller

## Cross-Cutting Concerns

| Konu | Yaklaşım |
|------|----------|
| Tip güvenliği | TypeScript strict mode, Zod input validation |
| Türkçe arama | `lower_tr()` SQLite UDF, `LIKE lower_tr(pattern)` |
| Tarih formatı | `dd.MM.yyyy` (Türk), `YYYY-MM-DD` DB depolama |
| Dosya isimlendirme | UUID suffix, Türkçe char pre-transliteration, path traversal guard |
| Transactional arşiv | PDF disk yazma + belge DB insert atomik; DB hatası disk rollback'i tetikler |
| Test | Vitest, deadline fonksiyonları ve tRPC router'ları için birim testleri |
