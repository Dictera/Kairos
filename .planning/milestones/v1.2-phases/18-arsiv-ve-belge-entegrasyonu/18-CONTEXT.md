# Phase 18: Arşiv ve Belge Entegrasyonu - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Üretilen her PDF kalıcı ve tahmin edilebilir bir yola yazılır ve aynı anda `belge` tablosuna işlenir; iki yazım işlemi atomic olur. PDF render ve convert Phase 17'de tamamlandı — bu fazda sadece "disk'e yaz + DB'ye kaydet + rollback" mekanizması kurulur.

</domain>

<decisions>
## Implementation Decisions

### Archive storage location
- **D-01:** Üretilen PDF'ler `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` dizinine yazılır. Requirements'taki yol literal olarak uygulanır. Şablonlar `./uploads/templates/` altında olduğu için üretilen PDF'ler de aynı `uploads/` ailesinde kalır.

### Filename format
- **D-02:** Dosya adı formatı: `{müvekkil-slug}-{plaka-slug}-{seq}.pdf`. Plaka yoksa segment atlanır (`{müvekkil-slug}-{seq}.pdf`).
- **D-03:** Müvekkil adı null/empty ise slug fallback olarak `dosya-{dosya_no}` kullanılır. Bu garantili non-empty ve unique bir base name üretir.
- **D-04:** Slug üretimi Python sidecar (`python-slugify`) üzerinden yapılır; ASCII-safe, Türkçe karakter normalize edilmiş format.

### Belge kategori (belge_turu)
- **D-05:** `docx_sablon` tablosuna yeni `belge_turu` alanı eklenir. Bu alan `BELGE_KATEGORILER` enum değerlerinden birini alır (`'Dilekçe'`, `'Delil'`, `'Rapor'`, `'Sözleşme'`, `'Tebligat'`, `'Muhbir'`, `'Diğer'`, `'İcra'`).
- **D-06:** PDF üretimi sırasında `belge.kategori`, şablonun `belge_turu` değerinden alınır. Şablon yükleme/edit UI'sına belge türü seçici dropdown eklenir.

### Seq (sequence) numbering
- **D-07:** `seq` numarası count-based (`COUNT(*) + 1`) ve per-(dosya_id, sablon_id) kapsamlıdır. Aynı dosya + aynı şablondan daha önce üretilmiş ve silinmiş PDF'lerin seq numaraları yeniden kullanılır.
- **D-08:** Seq hesaplaması DB transaction içinde yapılır; race condition'dan korunur.

### Transactional atomicity
- **D-09:** Write order: PDF dosyası önce diske yazılır, ardından `belge` tablosuna insert yapılır. DB insert başarısız olursa yazılmış PDF disk'ten silinir (rollback). Bu, Phase 17'den gelen temp PDF'nin final konumuna taşınması şeklinde gerçekleşir.
- **D-10:** `belge` insert başarılı olunca `olay_gunlugu` tablosuna kayıt atılır (`olay_turu='belge'`, açıklama: `{şablon_adı} şablonundan PDF üretildi` veya benzeri).

### Integration with pdfRouter
- **D-11:** Archive mantığı `pdfRouter.generate` procedure'ına eklenir. Phase 17'deki `return { pdfPath }` yerine, PDF final konumuna taşınır, `belge` kaydı oluşturulur, ve `belge` satırı döndürülür (veya `{ success: true, belgeId: ... }`).

### the agent's Discretion
- Plaka empty string (`""`) handling — skip segment veya dash inclusion (standart uygulama)
- Max slug length — truncate veya full slug (plaka zaten kısa, müvekkil slug'ı uzunsa truncate edilebilir)
- DB transaction implementation detayları (`db.transaction()` vs manual rollback)
- `olay_gunlugu` açıklamasının exact wording'i
- Dosya adında seq padding (e.g., `01` vs `1`)
- Path separator normalization (Windows path handling)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Arşiv Requirements
- `.planning/REQUIREMENTS.md` §ARSIV-01–ARSIV-06 — Arşiv ve Belge Entegrasyonu gereksinimleri (yol, dosya adı, slug, seq, transactional insert, rollback)
- `.planning/ROADMAP.md` §Phase 18 — Phase goal ve success criteria

### Pipeline Infrastructure
- `.planning/phases/15-pipeline-temeli/15-CONTEXT.md` — Sidecar architecture, IPC protocol, exit codes, `lib/services/docx-pipeline.ts` entry point
- `.planning/phases/16-sablon-semasi-ve-crud/16-CONTEXT.md` — Template CRUD, `docx_sablon` table, `belge.sablon_id` FK, template storage path
- `.planning/phases/17-pdf-uretim-motoru/17-CONTEXT.md` — PDF render, Jinja2 context, missing-var pre-check, temp file handling

### State & Project Decisions
- `.planning/STATE.md` §Accumulated Context — Transactional archive kararı, temp file lifecycle, numeric preservation, Jinja2 context builder isolation
- `.planning/PROJECT.md` — Tech stack, constraints, key decisions

### Schema
- `lib/schema.ts` — `belge`, `docx_sablon`, `olay_gunlugu`, `BELGE_KATEGORILER`, `SABLON_KATEGORILER` tanımları
- `lib/db.ts` — `better-sqlite3` Drizzle connection, WAL mode, transaction support

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/trpc/routers/pdf.ts` — `pdfRouter.generate` procedure. Phase 18'de `return { pdfPath }` kısmı archive mantığı ile değiştirilecek. Temp PDF `pdfPath`'i final konumuna taşınacak.
- `lib/trpc/routers/belge.ts` — `belgeRouter.create` pattern'i (DB insert + `logOlay`). Archive, doğrudan DB insert yapabilir veya bu pattern'i takip edebilir.
- `lib/services/docx-pipeline.ts` — `runSidecarCommand()` fonksiyonu (timeout desteği var).
- `lib/docx/context-builder.ts` — `buildJinja2Context()` — müvekkil, dosya_no, plaka gibi alanlara erişim için.
- `lib/schema.ts` — `belge` tablosu (sablon_id FK zaten var), `docx_sablon` tablosu (belge_turu eklenecek).
- `lib/db.ts` — `better-sqlite3` ile Drizzle; `db.transaction()` kullanılabilir.

### Established Patterns
- tRPC router: `lib/trpc/routers/{feature}.ts` → `_app.ts` registration
- Drizzle schema: `lib/schema.ts`'de tanımla → `drizzle/`'de migration
- File upload/storage: `./uploads/` dizininde, path'ler DB'de relative saklanır
- `logOlay` pattern: mutation sonrası activity log insert
- Error handling: `TRPCError` + Türkçe mesaj, `safeUnlink` tarzı cleanup
- Belge kategori: `BELGE_KATEGORILER` enum + Zod validation

### Integration Points
- `lib/trpc/routers/pdf.ts` — Archive mantığı buraya eklenecek (render + convert sonrası)
- `lib/schema.ts` — `docx_sablon.belge_turu` alanı eklenecek; migration gerekli
- `./uploads/sablon-pdf/` — Yeni dizin, yıl/ay/kategori alt klasörleri otomatik oluşturulacak
- `lib/trpc/routers/belge.ts` — Archive sonrası belge listesi bu router üzerinden sorgulanacak
- `app/(dashboard)/ayarlar/page.tsx` — Şablon yönetimi UI'sına `belge_turu` dropdown eklenecek (Phase 16 UI'ye extension)

</code_context>

<specifics>
## Specific Ideas

- "Müvekkil null/empty ise dosya_no fallback kullan" — kullanıcı, garantili unique filename base istiyor
- "belge_turu ekle, Üretilen Belge diye bir kategori olmasın" — kullanıcı, anlamlı kategoriler istiyor; şablonun belge türü belge kaydına yansımalı
- "seq count-based olsun, silinenlerin numarası tekrar kullanılsın" — kullanıcı, simple count semantics tercih ediyor
- Windows-first deployment — kullanıcı Windows'ta çalıştırıyor (D:\sigorta-takip path); path separator'lar Windows-aware olmalı

</specifics>

<deferred>
## Deferred Ideas

- Belgeler UI "Şablondan Üret" butonu — Phase 19
- Şablon yönetim ekranı iyileştirmeleri (değişken katalog, cheat-sheet) — Phase 19
- Quick action named buttons (örn. "İhtarname Üret") — v2 (QUICK-01)
- Dry-run / preview binding — v2 (QUICK-02)
- Multi-template batch üretim — v2 (QUICK-03)

</deferred>

---

*Phase: 18-arsiv-ve-belge-entegrasyonu*
*Context gathered: 2026-04-21*
