# Phase 17: PDF Üretim Motoru - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Kullanıcı bir dosya + şablon seçtiğinde, dosya detayındaki tüm veri ile Türkçe-doğru doldurulmuş bir PDF üretilir; hatalar erkenden ve anlaşılır şekilde raporlanır. docxtpl render, TR filtreler, LibreOffice headless convert, tenacity retry, missing-var pre-check. Arşivleme (dosya yazımı + belge tablosu insert) Phase 18'dedir — bu fazda sadece render + convert + hata yönetimi.

</domain>

<decisions>
## Implementation Decisions

### Context Shape
- **D-01:** Nested objects — case data grouped by entity: `{{ muvekkil.ad }}`, `{{ dosya.dosya_no }}`, `{{ taraf.karsitaraf_ad }}`, `{{ durusmalar[0].tarih }}`. Matches variable-registry.ts pattern, no naming collisions, scalable for future data sources. Arrays for multi-record entities (durusmalar, finans_kalemleri, notlar).

### TR Filter Implementation
- **D-02:** Jinja2 Environment custom filters — `tr_currency`, `tarih`, `upper_tr`, `lower_tr` registered as custom filters in Python sidecar's Jinja2 Environment. Templates use `{{ tutar | tr_currency }}`, `{{ tarih | tarih }}`. Standard Jinja2 pattern, docxtpl RichText supports it. `tr_currency` uses Babel `tr_TR` locale for `150.000,00 ₺` format. `tarih` outputs `dd.MM.yyyy`. `upper_tr`/`lower_tr` handle Turkish character mapping (`ı→I`, `İ→i`).

### tRPC Router Location
- **D-03:** New `pdfRouter` at `lib/trpc/routers/pdf.ts` — separate router with `generate` procedure. Clean separation from `sablonRouter` (CRUD) and `belgeRouter` (document management). Matches existing pattern of feature-specific routers.

### Missing Variable Pre-check
- **D-04:** Variable-to-tab mapping table — each template variable maps to a tab slug (e.g., `stk_esas_no` → `surec`, `muvekkil_ad` → `genel`, `karsitaraf_ad` → `taraflar`). Pre-check compares template variables against case data before calling sidecar, returns missing vars with deep-links (e.g., "Mahkeme esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin"). Blocks render if required vars are missing.

### Sidecar Command Timeout
- **D-05:** Render command gets extended timeout (120s default, configurable via env) vs current 30s default in `docx-pipeline.ts`. LibreOffice convert may need even longer. Use per-command timeout override in the command envelope params.

### LibreOffice Convert Strategy
- **D-06:** Per-invocation temp profile — every `soffice --headless --convert-to pdf` call uses `-env:UserInstallation=file:///TEMP/lo-{uuid}` and cleans up after. Prevents SingletonLock hangs. Already decided in Phase 15 context, confirmed for Phase 17.

### Retry Strategy
- **D-07:** Tenacity retry only for LibreOffice convert (timeout/deterministic failures) — 3 attempts with exponential backoff. docxtpl render errors are NOT retried (deterministic — bad template = bad template). Missing binary errors are NOT retried (configuration issue).

### Error Reporting
- **D-08:** Exit code mapping — sidecar returns exit code 2 for render errors, 3 for convert errors. tRPC maps to Turkish toast messages. Structured error response includes which step failed (render vs convert) and human-readable message.

### the agent's Discretion
- Exact variable-to-tab mapping table structure (can be inline const or separate module)
- Jinja2 filter implementation details (Babel import style, Turkish char map)
- PDF temp file handling before handoff to Phase 18 archive
- Exact timeout values (planner can tune based on testing)
- Progress reporting granularity during render/convert steps

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF Üretim Requirements
- `.planning/REQUIREMENTS.md` §PDF-01–PDF-10 — PDF Üretim gereksinimleri (dosya veri context, TR filtreler, docxtpl render, LibreOffice convert, tenacity retry, missing-var pre-check)
- `.planning/ROADMAP.md` §Phase 17 — Phase goal ve success criteria

### Pipeline Infrastructure
- `.planning/phases/15-pipeline-temeli/15-CONTEXT.md` — Sidecar architecture, IPC protocol, exit codes, health check, `lib/services/docx-pipeline.ts` entry point
- `.planning/phases/16-sablon-semasi-ve-crud/16-CONTEXT.md` — Template CRUD, variable extraction, `sablonRouter`, `docx_sablon` table

### Pipeline Code
- `lib/services/docx-pipeline.ts` — Sidecar command runner (needs timeout adjustment for render)
- `lib/pipeline/protocol.ts` — Command envelope + result schemas
- `lib/pipeline/config.ts` — Sidecar path + env configuration
- `scripts/docx-pipeline/main.py` — Python sidecar (handle_render and handle_convert need implementation)

### Schema & Data
- `lib/schema.ts` — All entity tables (muvekkil, dosya, taraf, durusma, sure, finans_kalemi, dosyaNot, docxSablon, belge) — data sources for Jinja2 context
- `lib/trpc/routers/_app.ts` — Router registration (new pdfRouter needs to be added)

### Project Context
- `.planning/PROJECT.md` — Tech stack, constraints, key decisions (Arial TTF for Turkish PDF, Navy+Turuncu palette)
- `.planning/STATE.md` §Accumulated Context — Sidecar boundary, protocol, exit codes, variable registry decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/services/docx-pipeline.ts` — `runSidecarCommand()` function, needs timeout param support for render/convert
- `lib/pipeline/protocol.ts` — `CommandEnvelope` + `CommandResult` Zod schemas (extend with `render`/`convert` params)
- `lib/trpc/routers/sablon.ts` — Pattern for sidecar integration, error handling, TRPCError usage
- `lib/trpc/routers/belge.ts` — Upload pattern, file path handling, `logOlay` hook
- `scripts/docx-pipeline/main.py` — `handle_health_check()` and `handle_extract_vars()` already implemented; `handle_render()` and `handle_convert()` return "Not yet implemented" stubs

### Established Patterns
- tRPC router: `lib/trpc/routers/{feature}.ts` → `_app.ts` registration
- Sidecar: JSON stdin/stdout via `execa`, pydantic v2 validation, structlog JSONL stderr
- Exit codes: 0=success, 1=validation, 2=render, 3=convert, 4=archive, 99=internal
- Error handling: `TRPCError` with Turkish messages, `safeUnlink` for cleanup
- Drizzle: `lib/schema.ts` single file, `db` from `lib/db.ts`
- Turkish locale: `dd.MM.yyyy` date format, Babel `tr_TR` for currency

### Integration Points
- `scripts/docx-pipeline/main.py` — Implement `handle_render()` (docxtpl + Jinja2 filters) and `handle_convert()` (LibreOffice + tenacity)
- `lib/services/docx-pipeline.ts` — Add per-command timeout override
- `lib/trpc/routers/pdf.ts` — New `pdfRouter` with `generate` procedure
- `lib/trpc/routers/_app.ts` — Register `pdfRouter`
- `lib/schema.ts` — Existing relations graph for eager-loading case data (dosyaRelations already has muvekkil, taraflar, durusmalar, sureler, belgeler, finans_kalemleri, notlar, olaylar)
- Variable-to-tab mapping — new module or inline const for pre-check deep-links

</code_context>

<specifics>
## Specific Ideas

- "Dosyanın tüm verisi (müvekkil, taraflar, sürücü, STK/mahkeme süreç, duruşmalar, süre, finans, notlar) Jinja2 context'ine beslenir" (ROADMAP.md success criteria)
- "`tr_currency`, `tarih`, `upper_tr`, `lower_tr` filtreleri Türkçe karakter + Babel `tr_TR` locale ile doğru sonuç üretir" (ROADMAP.md success criteria)
- "Jinja2 koşullu bloklar (`{% if %}`, `{% for %}`, `{%p %}`, `{%tr %}`, `{%tc %}`) docxtpl üzerinden çalışır" (ROADMAP.md success criteria)
- "LibreOffice timeout (varsayılan 120 sn) aşılırsa `tenacity` ile 3 denemeye kadar exponential backoff ile yeniden denenir" (ROADMAP.md success criteria)
- "Eksik değişken varsa üretim başlamadan client-side pre-check hata verir ve eksik alanın bulunduğu sekmeye deep-link gösterir" (ROADMAP.md success criteria)
- Windows-first deployment — kullanıcı Windows'ta çalıştırıyor (D:\sigorta-takip path)
- Turkish character rendering is critical — verified via Playwright in STATE.md research flags

</specifics>

<deferred>
## Deferred Ideas

- PDF arşivleme (dosya yazımı + belge tablosu insert) — Phase 18
- Belgeler UI "Şablondan Üret" butonu — Phase 19
- Şablon yönetim ekranı iyileştirmeleri — Phase 19
- Quick action named buttons (örn. "İhtarname Üret") — v2 (QUICK-01)
- Dry-run / preview binding — v2 (QUICK-02)
- Multi-template batch üretim — v2 (QUICK-03)

### Reviewed Todos (not folded)
None — analysis stayed within phase scope

</deferred>

---

*Phase: 17-pdf-uretim-motoru*
*Context gathered: 2026-04-21*
