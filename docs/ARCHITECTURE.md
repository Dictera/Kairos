# Architecture

<!-- GSD:generated -->

## Overview

Sigorta Uyuşmazlık Takip, solo avukat için yerel çalışan (offline-first) Next.js 15 web uygulamasıdır. İnternet bağlantısı gerektirmez; tüm veri yerel SQLite dosyasında tutulur.

```
Tarayıcı
  │
  ├── Next.js App Router (React 19 Server + Client Components)
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

## Layer Breakdown

### 1. Presentation Layer (app/ + components/)

- **Next.js App Router** — Server Components varsayılan; sadece interaktif kısımlar `'use client'` taşır.
- **shadcn/ui + Radix UI** — Bileşen kütüphanesi; `components/` altında sayfa bazlı organize edilmiş.
- **Tailwind CSS v4** — Utility-first stil; `tailwind.config.ts` ile özelleştirilmiş.
- **Layout koruması** — `app/(dashboard)/layout.tsx` her isteği iron-session ile doğrular; yetkisiz istekler `/login`'e yönlendirilir.

### 2. API Layer (tRPC + REST)

- **tRPC v11** — Tüm iş mantığı 17 router üzerinden aktar; end-to-end TypeScript tip güvenliği sağlar.
- **superjson** — `Date`, `bigint` gibi tipleri JSON'a encode/decode eder.
- **React Query v5** — İstemci tarafı önbellekleme ve sunucu durum yönetimi.
- **REST handlers** — Dosya yükleme (`/api/upload`), statik dosya servisi (`/api/files`), PDF/Excel üretim (`/api/raporlar`) ve şablon servisi (`/api/templates`) tRPC dışı kaldı çünkü binary payload aktarımı gerektirirler.

### 3. Business Logic (lib/)

```
lib/
  schema.ts          — Drizzle tablo şemaları ve relations
  db.ts              — SQLite bağlantısı (globalThis singleton)
  trpc/
    init.ts          — tRPC context + middleware
    routers/         — 17 router (muvekkil, dosya, surec, sure, belge, finans…)
  docx/
    variable-registry.ts  — Şablon değişken tanım kataloğu (kaynak doğrusu)
    context-builder.ts    — Drizzle relations → Jinja2 context mapping
  services/
    docx-pipeline.ts      — Python sidecar köprüsü (extract-vars, render, convert)
  deadline.ts        — Türk takvim kurallı süre hesaplama fonksiyonları
  session.ts         — iron-session yapılandırması
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
      ├── main.py                  (JSON stdin/stdout IPC, pydantic v2 CommandEnvelope)
      ├── render.py                (docxtpl Jinja2 render, TR filtreleri)
      ├── convert.py               (LibreOffice headless .docx → .pdf)
      └── archive.py               (Transactional PDF arşiv + DB insert)
```

- **IPC protokolü:** JSON `CommandEnvelope` stdin/stdout üzerinden; komutlar: `extract-vars`, `render`, `convert`, `health-check`
- **Exit kodları:** 0=başarı, 1=validation, 2=render, 3=convert, 4=arşiv, 99=internal
- **LibreOffice yalıtımı:** Her çağrı için benzersiz `UserInstallation` profili (`-env:UserInstallation=file:///TEMP/lo-{uuid}`) → SingletonLock engellenmez
- **Health check cache:** 5 dakikalık TTL, modül seviyesi singleton

## Key Data Model

```
muvekkil ──< dosya >── taraf
                   │
                   ├──< sure          (süreler/deadlines)
                   ├──< durusma       (duruşmalar)
                   ├──< belge         (yüklenen dosyalar)
                   ├──< finans_kaydi  (gelir/gider/masraf)
                   ├──< not_kaydi     (notlar)
                   └──< olay_gunlugu  (aktivite zaman çizelgesi)

dosya.surec_detay ← JSON (StkSurecData | MahkemeSurecData)

sigorta_sirketi ──< avukat_sigorta_sirketi >── avukat
sigorta_sirketi ──< dosya (karsitaraf_sigorta_id)
avukat          ──< taraf (avukat_id)

docx_sablon ← şablon .docx dosyaları (uploads/templates/)
belge       ← yüklenen belgeler (uploads/belge/ veya ad-only klasörler)
```

## Authentication

- **Strateji:** Tek kullanıcı; şifre `.env.local`'daki `APP_PASSWORD` değeriyle karşılaştırılır
- **Session:** iron-session HttpOnly cookie (`SESSION_COOKIE_NAME`)
- **Koruma:** `(dashboard)/layout.tsx` her sayfa render'ında session kontrolü yapar

## Cross-Cutting Concerns

| Konu | Yaklaşım |
|------|----------|
| Tip güvenliği | TypeScript strict mode, Zod input validation |
| Türkçe arama | `lower_tr()` SQLite UDF, `LIKE lower_tr(pattern)` |
| Tarih formatı | `dd.MM.yyyy` (Türk), `YYYY-MM-DD` DB depolama |
| Dosya isimlendirme | UUID suffix, Türkçe char pre-transliteration, path traversal guard |
| Transactional arşiv | PDF disk yazma + belge DB insert atomik; DB hatası disk rollback'i tetikler |
| Test | Vitest, deadline fonksiyonları ve tRPC router'ları için birim testleri |
