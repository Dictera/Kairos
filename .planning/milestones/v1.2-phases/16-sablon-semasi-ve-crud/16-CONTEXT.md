# Phase 16: Şablon Şeması ve CRUD - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Kullanıcı `.docx` şablonlarını kategori ile yükleyebilir, listeler, siler ve değiştirebilir; değişkenler otomatik çıkarılıp şablon kaydında saklanır. `docx_sablon` tablosu Drizzle schema'ya eklenir. `belge` tablosuna nullable `sablon_id` FK alanı eklenir. PDF üretimi, arşivleme ve UI bu fazda DEĞİLDİR — sadece şema + CRUD + variable extraction.

</domain>

<decisions>
## Implementation Decisions

### Upload Mechanism
- **D-01:** API route + filesystem upload — multipart upload → API route validates `.docx` extension → saves to disk → calls sidecar `extract-vars`. Matches existing `belge` upload pattern (`lib/trpc/routers/belge.ts`).

### Variable Extraction
- **D-02:** Synchronous during upload — upload → immediately call sidecar extract-vars → save variables with template record. User waits ~1-2 seconds, sees result right away. No background job complexity.

### Template Management UI Location
- **D-03:** Settings page sub-section — add 'Şablon Yönetimi' section to existing `app/(dashboard)/ayarlar/page.tsx`. Consistent with Phase 14 pattern (sigorta şirketi / avukat management lives in settings).

### Template Storage Path
- **D-04:** `./uploads/templates/` — consistent with existing `./uploads/` pattern. Simple path: `./uploads/templates/{template-id}.{ext}`. Easy to backup with SQLite. NOT under `public/` — templates should not be directly served.

### Variable Detail Level
- **D-05:** Names only — store just variable names: `['muvekkil_ad', 'muvekkil_soyad', ...]`. Simple, sufficient for variable registry matching (BUI-09). No type inference or position tracking.

### Template Overwrite Strategy
- **D-06:** Same template ID, replace file — user re-uploads to same template → file replaced on disk, variables re-extracted, same DB ID preserved. Existing `belge.sablon_id` references stay valid.

### Kategori Enforcement
- **D-07:** Zod enum + DB CHECK — Zod enum on input validation (`z.enum(['STK', 'Mahkeme', 'Genel'])`) + SQLite CHECK constraint on `kategori` column. Double safety, matches existing Drizzle patterns (see `belgeKategoriEnum` in `belge.ts`).

### Delete Cascade
- **D-08:** SET NULL on `belge.sablon_id` — when template deleted, `belge.sablon_id` → NULL. Generated PDFs stay in archive, just lose template reference. Matches SABLON-05 requirement.

### Template List Display
- **D-09:** Table with category filter — sortable table: ad, kategori badge, upload date, variable count, actions (sil/değiştir). Category filter dropdown at top. Matches existing CRUD table patterns from Phase 14 (sigorta şirketi / avukat tables).

### the agent's Discretion
- Exact table column ordering and sort defaults
- Upload progress indicator styling
- Variable extraction error message wording
- File size limit for template uploads (reasonable default ~10MB)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Şablon Requirements
- `.planning/REQUIREMENTS.md` §SABLON-01–SABLON-08 — Şablon Yönetimi gereksinimleri (.docx upload, kategori, değişken çıkarımı, CRUD, docx_sablon tablosu, belge.sablon_id FK)
- `.planning/ROADMAP.md` §Phase 16 — Phase goal ve success criteria

### Pipeline Integration
- `.planning/phases/15-pipeline-temeli/15-CONTEXT.md` — Sidecar subcommand pattern, IPC protocol, `lib/services/docx-pipeline.ts` entry point, exit codes. Phase 16 `extract-vars` command'ı bu altyapıyı kullanır.

### Project Context
- `.planning/PROJECT.md` — Tech stack (Next.js 15, SQLite, Drizzle, tRPC, shadcn/ui), constraints, key decisions
- `.planning/REQUIREMENTS.md` §Out of Scope — In-app template editor yok, cloud template library yok

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/trpc/routers/belge.ts` — Mevcut upload/validation pattern (`zod` enum, file path handling, `logOlay` hook). Template upload router bu pattern'i takip edecek.
- `lib/services/docx-pipeline.ts` — Phase 15'te oluşturulan sidecar entry point. `extract-vars` subcommand'ı buradan çağrılacak.
- `components/ayarlar/ayarlar-page.tsx` — Mevcut Ayarlar sayfası bileşeni. Şablon yönetimi section'ı buraya eklenecek.
- `lib/schema.ts` — Drizzle schema dosyası. `docx_sablon` tablosu ve `belge.sablon_id` FK buraya eklenecek.
- `lib/trpc/routers/_app.ts` — Mevcut router registration. Yeni `sablon` router buraya eklenecek.

### Established Patterns
- tRPC router yapısı: `lib/trpc/routers/{feature}.ts` → `_app.ts`'de register
- Drizzle schema: `lib/schema.ts`'de tanımla → `drizzle/`'de migration
- shadcn/ui components: `components/ui/` dizininde (Table, Badge, Button, Select, Dialog)
- Upload pattern: multipart → tRPC mutation → filesystem → DB record (belge.ts)
- Kategori enum: Zod enum + DB CHECK (belge.ts'te `BELGE_KATEGORILER` pattern'i)

### Integration Points
- `lib/schema.ts` — `docx_sablon` tablosu + `belge.sablon_id` FK (SABLON-07, SABLON-08)
- `lib/trpc/routers/_app.ts` — yeni `sablon` router kaydı
- `app/(dashboard)/ayarlar/page.tsx` — Şablon Yönetimi section'ı
- `lib/services/docx-pipeline.ts` — `extract-vars` subcommand çağrısı
- `./uploads/templates/` — yeni template storage dizini

</code_context>

<specifics>
## Specific Ideas

- "Kullanıcı ad + zorunlu kategori (STK / Mahkeme / Genel) girip `.docx` yükleyebilir; başka formatlar reddedilir" (ROADMAP.md success criteria)
- "Yükleme sırasında `{{ degisken }}` ve `{%p paragraf %}` placeholder'ları otomatik çıkarılıp şablon kaydına JSON olarak işlenir" (ROADMAP.md success criteria)
- "`docx_sablon` tablosu Drizzle schema'ya eklenir (id, ad, kategori NOT NULL CHECK, dosya_yolu, degiskenler JSON, default_aksiyon nullable, timestamps)" (ROADMAP.md success criteria)
- "`belge` tablosuna nullable `sablon_id` FK alanı eklenir (şablon silindiğinde SET NULL)" (ROADMAP.md success criteria)
- Windows-first deployment — kullanıcı Windows'ta çalıştırıyor (D:\sigorta-takip path)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-sablon-semasi-ve-crud*
*Context gathered: 2026-04-20*
