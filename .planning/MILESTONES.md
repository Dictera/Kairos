# Milestones

## v1.2 Şablon Belgeler (Shipped: 2026-04-22)

**Phases completed:** 6 phases (15–20), 21 plans
**Requirements:** 48 (PIPE 7 + SABLON 8 + PDF 10 + ARSIV 6 + BUI 9 + TEMIZ 8)
**Known deferred items at close:** 4 (see STATE.md Deferred Items)

**Key accomplishments:**

- Python sidecar (`scripts/docx-pipeline/`) with pydantic v2 IPC, JSON stdin/stdout protocol, execa bridge, health-check with 5-min TTL cache, and 7 Python packages (docxtpl, jinja2, babel, python-slugify, structlog, tenacity)
- TR custom Jinja2 filters: `tr_currency` (150.000,00 TL format), `tarih` (dd.MM.yyyy), `upper_tr`/`lower_tr` (Turkish i↔İ)
- LibreOffice headless PDF conversion with tenacity retry (3 attempts, exponential backoff), per-invocation temp profile to avoid SingletonLock
- `docx_sablon` schema + `belge.sablon_id` FK, Zod validators, 10MB .docx-only upload route with path-traversal guard
- `handle_extract_vars` in Python sidecar using python-docx XML parsing for automatic `{{ degisken }}` extraction
- `handle_slug` command with Turkish char pre-transliteration (İ→I, Ş→S, Ç→C, Ö→O, Ü→U, Ğ→G)
- Transactional PDF archive: `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/{müvekkil-slug}-{plaka-slug}-{seq}.pdf` + `belge` insert atomically; rollback on DB failure
- SablondanUret component: category-tabs (Tümü/STK/Mahkeme/Genel), searchable Command dropdown, non-dismissible progress modal with step labels
- VariableCatalogModal with "✓ Bilinen" / "⚠ Bilinmeyen" badges, Turkish locale sort
- CheatSheetPage at /ayarlar/degiskenler auto-generated from variable registry
- Şablon Yönetimi page in Ayarlar with full CRUD (create, list, delete, overwrite)
- Variable registry (`lib/docx/variable-registry.ts`) as single source of truth for all supported template variables
- Report PDF routes migrated from Tiptap to pdfmake; `/dilekce` redirects for compatibility
- Tiptap/ODT routers, routes, services, tables, and uploads/odt-templates/ folder deleted
- 63 npm packages uninstalled (jspdf, adm-zip, @xmldom/xmldom, 4x @tiptap/extension-*)
- DROP TABLE IF EXISTS migration for `dilekce_sablonu` and `dilekce_odt_sablonu`
- Sidebar nav: "Dilekçeler" removed, "Şablon Yönetimi" added
- Retirement modal with user confirmation before cleanup
- npm build passes (21 routes, 289 tests passing)

---

## v1.1 Temizlik ve İyileştirme (Shipped: 2026-04-17)

**Phases completed:** 5 phases, 15 plans, 32 tasks

**Key accomplishments:**

- None
- Email column removed from muvekkil table, tRPC schemas updated, and Drizzle migration generated and applied
- Email field removed from muvekkil-form.tsx to align with backend schema
- Drizzle metadata regenerated via nuclear approach — single clean migration matching current schema, muvekkil table without email column
- Replace stale `it.todo` with real column-verification test asserting 9 expected columns and explicit no-email negative assertion
- Diğer Sürücü Bilgileri Card added to KarsitaraflarTab with 5 driver fields (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no), phone format validation, and conditional view mode display
- New database schema with notes/timeline tables, expanded dosya fields, IBAN, restructured STK/Mahkeme stages, and expanded belge categories
- NotForm + NotList + Timeline components created and integrated, activity log hooks in tRPC mutations
- Genel Bilgiler tab updated with hasar dosya no, kaza tarihi, müvekkil sigorta, kusur oranı fields. Dosya form restructured with grouped layout. STK/Mahkeme data forms use new field names. Belge categories expanded with category-based file naming.
- IBAN field added to müvekkil with TR regex validation, form restructured into grouped sections using Separator component
- Extended sigortaSirketi with 5 new fields, created avukat + avukat_sigorta_sirketi join tables, added taraf.avukat_id FK
- Generated and applied Phase 14 migration — 5 new sigorta_sirketi columns, avukat table, join table, taraf.avukat_id FK
- Custom tRPC router for sigortaSirketi + avukat with Zod validation, exported schemas for testing, dosya.getById extended with taraf.avukat

---

## v1.0 MVP (Shipped: 2026-04-13)

**Phases completed:** 9 phases, 31 plans, 52 tasks

**Key accomplishments:**

- Next.js 15.5.15 App Router project bootstrapped with all Phase 1 dependencies, serverExternalPackages: ['better-sqlite3'] configured, TypeScript strict mode enabled, and environment variable template created
- SQLite connection singleton with WAL mode, globalThis hot-reload protection, and Drizzle ORM generate+migrate workflow producing verified data/db.sqlite with schema_test table
- Full tRPC v11 stack wired: initTRPC with superjson transformer, async iron-session context, publicProcedure/protectedProcedure with UNAUTHORIZED guard, health procedure, and fetchRequestHandler route handler at /api/trpc
- Env-based single-user auth: POST login route validates APP_PASSWORD against iron-session cookie, middleware.ts guards all routes except /login and /api/trpc, standalone login page with exact Turkish copy per UI-SPEC.md
- shadcn v4 initialized with teal theme, collapsible icon-rail sidebar (9 nav links), TRPCProvider+QueryClientProvider client boundary, route-group layout isolation for login page, and 9 placeholder dashboard pages — full Phase 1 skeleton complete
- One-liner:
- Drizzle schema with STK/Mahkeme stage enums, SurecDetay JSON column, durusma table, and tRPC router with 9 procedures for process tracking
- SurecStepper generic stage stepper with 9 STK stages, StkDataForm with 8 data fields and date pickers, YargilamaSureciTab orchestrator integrated into dosya detail tabs
- MahkemeDataForm with 6 fields, DurusmaDialog for add/edit hearings, DurusmaList with chronological table and full CRUD, all wired into YargilamaSureciTab
- sure table schema, pure deadline calculation service, Drizzle migration, and Wave 0 test stubs established
- sure and dashboard tRPC routers created with full CRUD; auto-calc wired into surec mutations; SureList component delivers deadline CRUD UI on case detail page
- Dashboard page with 3 stat cards, Yaklaşan Süreler urgency badges, and Bugünkü Duruşmalar widget — all powered by tRPC dashboardStats query
- Fixed 3 code review findings: timezone off-by-one, unused import, silent delete
- tRPC calendar.getMonthEvents procedure with Zod validation, querying durusma and sure tables for monthly view
- Calendar page UI with monthly grid, inline event badge counts per day, and popover event list linking to case detail pages
- Phase 6 UAT gap closures applied - multiple UI fixes
- Plan:
- Plan:
- Plan:
- Plan:
- Shared DatePickerField component with Turkish locale (dd.MM.yyyy, Monday week start) extracted and applied to SureList create and edit forms
- Reference forms import shared DatePickerField from components/ui/date-picker.tsx, dosya-list filter inputs updated to use DatePickerField with Turkish locale and Monday-first calendar

---
