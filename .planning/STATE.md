---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: GitHub Open Source Yol Haritası
status: completed
last_updated: "2026-05-16T19:06:54.482Z"
last_activity: "2026-05-17 - Completed quick task 260517-pdf: PDF dosya adını şablon türü veya şablon adından türet"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

**Project:** Sigorta Uyuşmazlık Takip
**Core value:** Her dosyanın STK ve mahkeme süreç aşamalarını, duruşma tarihlerini ve kritik süreleri tek ekrandan görebilmek.
**Current focus:** Phase 24 — kalite-ci

## Current Position

Phase: 24 — COMPLETE
Plan: 2 of 2
Next: Phase 23 - GitHub Repo Yayını
Status: Phase 24 complete
Last activity: 2026-05-16 - Completed quick task 260516-tmp: ayarlardan şablon yönetimi ve değişken listesini kaldır

Progress: [██████████] 100%

## Session Continuity

Last session: 2026-05-16T19:06:54.438Z
Previous milestone: v1.2 Şablon Belgeler shipped 2026-04-22
Current milestone: v1.3 GitHub Open Source Yol Haritası (phases 21–24 planned)
Roadmap file: .planning/ROADMAP.md
Phase 21 context: .planning/phases/21-g-venlik-temizlik/21-CONTEXT.md

## Performance Metrics

**Velocity:**

- Total plans completed (v1.0): 31
- Total plans completed (v1.1): 15
- Total plans completed (v1.2): 21
- Average duration: —
- Total execution time: v1.0 + v1.1 + v1.2 tracked separately

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 4 | - | - |
| 03 | 3 | - | - |
| 04 | 4 | - | - |
| 05 | 2 | - | - |
| 06 | 4 | - | - |
| 07 | 4 | - | - |
| 08 | 3 | - | - |
| 09 | 2 | - | - |
| 10 | 3 | - | - |
| 11 | 2 | - | - |
| 12 | 1 | - | - |
| 13 | 4 | - | - |
| 14 | 5 | - | - |
| 15 | 2/2 | 2 | 14.5min |
| 16 | 5/5 | 5 | - |
| 17 | 4/4 | - | 7.5min |
| 18     | 3/3 | - | ~5.8min |
| 19 | 1/3 | 1 | 3min |
| 20 | 4/4 | 4 | 3min |
| 21 | 0/TBD | - | - |
| 22 | 2/2 | 2 | - |
| 23 | 0/TBD | - | - |
| 24 | 0/TBD | - | - |
| Phase 24-kalite-ci P01 | 3min | 2 tasks | 2 files |
| Phase 24-kalite-ci P02 | ~2min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

- **Sidecar boundary:** All Python subprocess calls funnel through `lib/services/docx-pipeline.ts`; tRPC routers never spawn directly
- **Sidecar protocol:** JSON stdin/stdout with pydantic v2 `CommandEnvelope` — commands: extract-vars, render, convert, health-check
- **Exit codes:** 0=success, 1=validation, 2=render, 3=convert, 4=archive, 99=internal — mapped to Turkish messages via `getTurkishErrorMessage()`
- **Health check cache:** 5-minute TTL, module-level singleton pattern, exposed via `getHealthStatus()` and `invalidateHealthCache()`
- **Per-invocation LibreOffice profile:** Every `soffice` call uses `-env:UserInstallation=file:///TEMP/lo-{uuid}` to avoid SingletonLock hang
- **Variable registry as TS const:** `lib/docx/variable-registry.ts` is the single source of truth; cheat-sheet + unknown-var detection both consume it
- **Co-located tests in lib/**/__tests__:** `vitest.config.ts` extended to include `lib/**/__tests__/**/*.test.ts` alongside `tests/` for unit tests that live next to their source modules
- **Transactional archive:** PDF write and `belge` insert are atomic — DB failure triggers disk rollback
- **No data export on retirement:** User pre-approved deletion of Tiptap + `.odt` data; only DB backup (`.pre-v1.2.bak`) retained as safety
- **Retirement last:** Phase 20 executes only after Phase 19 is user-validated end-to-end so rollback stays possible
- **Jinja2 context builder isolation:** `lib/docx/context-builder.ts` is the single mapping layer between Drizzle relations and template variable namespace; new fields extend here
- **Numeric preservation in Jinja2 context:** `talep_tutari` and `tutar` remain numbers (not sanitized to empty string) so Python `tr_currency` filter receives numeric input
- **Temp file lifecycle in pdfRouter:** `renderedDocxPath` is unlinked via `fs.unlinkSync` in success path and before every error throw to prevent disk accumulation
- **Turkish char pre-transliteration in slugify:** `handle_slug` maps Turkish chars (`İ→I`, `Ş→S`, `Ç→C`, `Ö→O`, `Ü→U`, `Ğ→G` and lowercase variants) via `str.maketrans` before calling `python-slugify` for consistent ASCII output across environments
- **Optional belge_turu on templates:** `docxSablon.belge_turu` is nullable text with Zod enum validation (`BELGE_KATEGORILER`) crossing the tRPC API boundary; stored as NULL when undefined
- **Defense-in-depth path traversal guard:** `buildArchivePath` rejects any slug segment containing `..` before path construction, in addition to the post-join `path.resolve` guard, because `path.join` treats `../` inside dash-joined filename segments as literal characters
- **v1.3 Phase 23 manual steps:** GitHub repo creation, visibility change, release tag, and topics/description are manual browser/CLI actions performed by the user — not automated code tasks
- [Phase ?]: GitHub Actions CI uses pnpm exclusively (D-03) — pnpm/action-setup@v4, pnpm run build, pnpm test, zero npm references
- [Phase ?]: Dependabot covers npm (root), pip (/scripts/docx-pipeline), github-actions (root) all on weekly schedule with chore(deps) prefix

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260516-a1 | Belgeler dosyaya git butonu | 2026-05-16 | be31a3e | [260516-a1-belgeler-dosya-git-butonu](./quick/260516-a1-belgeler-dosya-git-butonu/) |
| 260516-t4t | şablon unselect + değişken kopyalama + jinja2 örnekler | 2026-05-16 | 9eaa074 | [260516-t4t-sablon-yonetimi-unselect-copy-jinja2-orn](./quick/260516-t4t-sablon-yonetimi-unselect-copy-jinja2-orn/) |
| 260516-tmp | ayarlardan şablon yönetimi ve değişken listesini kaldır | 2026-05-16 | c7343f2 | [260516-tmp-settings-remove-sablon](./quick/260516-tmp-settings-remove-sablon/) |
| 260517-pdf | PDF dosya adını şablon türü veya şablon adından türet | 2026-05-17 | 441a13e | [260517-pdf-sablon-turu-dosya-adi](./quick/260517-pdf-sablon-turu-dosya-adi/) |

### Blockers

| Blocker | Phase | Resolution |
|---------|-------|------------|
| None currently | - | - |

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-22 (v1.2 Şablon Belgeler):

| Category | Item | Status |
|----------|------|--------|
| debug | dilekce-odt-olustur-pdf-onizleme | superseded by v1.2 retirement (Phase 20) |
| quick_task | 260411-505-fix-git-tree-10000-uncommitted-files-vis | missing — no fix needed |
| uat_gap | Phase 15 UAT [testing] | 0 pending scenarios, not re-run |
| uat_gap | Phase 18 UAT [partial] | 0 pending scenarios, not re-run |
| tech_debt | belge-olay-turu-mismatch | open |
| tech_debt | karsitaraf-vekil-stale-reference | open |
| tech_debt | drizzle-journal-tag-mismatch | open |

**Note:** Items from previous milestone close (2026-04-17) remain as previously recorded above.

### Roadmap Evolution

- v1.2 milestone opened: 6 phases (15–20) covering 48 requirements across PIPE / SABLON / PDF / ARSIV / BUI / TEMIZ categories
- v1.3 milestone opened: 4 phases (21–24) covering 18 requirements across GUVENLIK / DOKUM / GITHUB / KALITE categories

### Research Flags

- Re-verify `docxtpl`, `tenacity`, `structlog`, `python-slugify`, Drizzle `onConflictDoUpdate`, LibreOffice filter data JSON via Context7 before implementation (per CLAUDE.md policy)
- Confirm exact package upper bounds with `pip index versions` + `npm view execa versions --json` before writing `requirements.txt` / `package.json`
- Verify Turkish character rendering end-to-end via Playwright on a canary template (`çÇğĞıİöÖşŞüÜ İstanbul şirket müvekkil`) — Phase 17 verification gate

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260422-001 | Dashboard UI güncelleme — yeni layout, delta kartları, Son Dosyalar tablosu | 2026-04-22 | 3b482d1 | [260422-001-dashboard-ui-guncelleme](./quick/260422-001-dashboard-ui-guncelleme/) |
| 260423-001 | Finans sayfası mock datadan kurtarıldı — sirket/tur/dosyaTur tRPC endpointleri | 2026-04-23 | 8dec237 | [260423-001-finans-mock-datadan-kurtul](./quick/260423-001-finans-mock-datadan-kurtul/) |
| 260424-001 | Dosya no otomatik atama — YYYY/N formatı, yılbaşında sıfırla | 2026-04-24 | 0d43135 | [260424-001-dosya-no-otomatik-atama](./quick/260424-001-dosya-no-otomatik-atama/) |
| 260425-001 | Finans ödeme aşaması kategorisi — İhtar, Arabulucu, Bilirkişi, İcra | 2026-04-25 | b980cd8 | [260425-001-finans-odeme-asamasi-ihtar-icra](./quick/260425-001-finans-odeme-asamasi-ihtar-icra/) |
| 260425-002 | Karşı taraf sigorta şirketi ve avukat bilgilerinin tamamı görüntüleniyor | 2026-04-25 | 220cf8f | [260425-002-karsitaraf-sigorta-avukat-detay](./quick/260425-002-karsitaraf-sigorta-avukat-detay/) |
| 260425-003 | Raporlar sayfası 10 raporla yeniden yazıldı — DB migration + Recharts bileşenleri | 2026-04-25 | b1fdc88 | [260425-003-raporlar-sayfasi-10-rapor-recharts](./quick/260425-003-raporlar-sayfasi-10-rapor-recharts/) |

---
*State managed by GSD workflow*
