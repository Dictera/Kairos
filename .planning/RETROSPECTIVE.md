# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.2 Şablon Belgeler

**Shipped:** 2026-04-22
**Phases:** 6 | **Plans:** 21 | **Sessions:** ~5 days

### What Was Built

- Python sidecar pipeline with pydantic v2 IPC (JSON stdin/stdout), TR custom Jinja2 filters (tr_currency, tarih, upper_tr, lower_tr)
- LibreOffice headless PDF conversion with tenacity retry, per-invocation temp profiles
- .docx template system: upload, variable extraction, CRUD UI, Şablon Yönetimi
- SablondanUret component with category tabs, searchable dropdown, progress modal
- VariableCatalogModal with known/unknown badges; CheatSheetPage auto-generated from registry
- Transactional PDF archive with compensating transaction; UUID-based filename collision prevention
- Full retirement of Tiptap/ODT system: routers, routes, tables, 63 npm packages removed
- Clean npm build: 21 routes, 289 tests passing

### What Worked

- Phase plans with explicit must_haves and Success Criteria — clear acceptance criteria prevented scope creep
- Python sidecar IPC protocol with fixed exit codes — Turkish error messages map cleanly to exit codes
- UUID over sequential counter for filenames — eliminates race condition without complex locking
- DROP TABLE IF EXISTS for legacy cleanup — idempotent, safe to re-run
- Pre-transliteration of Turkish chars before slugify — defensive correctness for cross-platform consistency

### What Was Inefficient

- Windows stdin encoding issue — Python subprocess with Turkish chars on Windows console produces invalid Unicode; worked around with execa which handles encoding correctly
- Phase 18 UAT partially incomplete (0 pending scenarios but not formally closed)
- Stale traceability table in REQUIREMENTS.md not updated during execution — archival revealed gap

### Patterns Established

- Python sidecar command extension: extend TS enum + Python Literal + add handler + wire dispatcher
- Non-dismissible Dialog: onInteractOutside + onEscapeKeyDown preventDefault pattern
- Progress modal with step timer: visual feedback during blocking mutation call
- Variable registry as single source of truth: TypeScript const consumed by both UI and pre-check

### Key Lessons

1. Explicit Turkish char pre-transliteration before external library calls prevents subtle cross-platform bugs
2. Phase plan Success Criteria must be updated as work progresses — not just at summary
3. Stale requirements traceability masks completion status — update during execution, not just at milestone

### Cost Observations

- Model mix: Unknown (agent session data not tracked)
- Sessions: ~5 active development days
- Notable: 104 files changed, +9841/-2839 LOC — focused delivery of single feature area

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-13
**Phases:** 7 | **Plans:** 27 | **Sessions:** ~3

### What Was Built

- Next.js 15 App Router project with SQLite/Drizzle ORM + tRPC v11 stack
- Client and case file management with Turkish search, filters, 6-tab detail shell
- STK 9-stage + Mahkeme 8-stage process trackers with all data points
- Automatic deadline calculation (STK 10d, istinaf 14d, cevap 14d) with adli tatil warnings
- Dashboard with urgency-coded deadlines, today's hearings, and portfolio stats
- Monthly calendar view with clickable event links to case detail
- Document upload (20MB, PDF/DOC/DOCX/JPG/PNG) stored at E:/sigorta-belgeler/
- Finance tracking: Gelen/Giden/Masraf entries with per-case net balance and global dashboard
- Petition templates with Tiptap rich-text editor, variable substitution, and Turkish PDF generation (Arial TTF)
- Portfolio and financial reports with PDF and Excel export

### What Worked

- tRPC v11 with protectedProcedure — clean auth boundary throughout all routers
- Pure deadline calculation functions (no DB imports) — 13 unit tests, timezone-safe
- Phase plans with must_haves truths + artifacts — clear acceptance criteria
- UAT process — user testing caught 8 issues in Phase 2, 4 issues in Phase 6, all fixed
- Iron-session env-based auth — simple and sufficient for solo lawyer use case
- shadcn/ui component library — consistent UI without custom design work
- Milestone audits — identified missing VERIFICATION.md files across all phases

### What Was Inefficient

- Phase 6 had 3 plans absorbed into one SUMMARY (gap closure) — no separate documentation for 06-01, 06-02, 06-03
- VERIFICATION.md created during planning but never updated as implementation progressed — validation retroactively reconstructed
- Phase 7 had no VERIFICATION.md and no UAT — only self-check in SUMMARYs
- Some tests in tests/02-schema.test.ts are `.todo()` stubs from Wave 0 that were never fully implemented
- Several `||` operators in PowerShell scripts caused parse errors when running bash commands

### Patterns Established

- Pure functions for business logic (deadline-service.ts) — easily testable, no DB dependency
- `<Toaster richColors />` must be added to app/layout.tsx for sonner toasts to work
- DatePickerField shared component needed for Turkish locale standardization (deferred to Phase 9)
- All phases need VERIFICATION.md before implementation starts — not after
- UAT should be run and documented during phase execution, not retroactively

### Key Lessons

1. Add `<Toaster>` to layout early — sonner toasts silently fail without it
2. Wave 0 test stubs must be converted to real tests before implementation, not after
3. VERIFICATION.md must be living document, not retrospective
4. Phase gap closures (like 06-04) should still produce per-plan SUMMARYs for traceability
5. Date picker and calendar components need standardization planning upfront — retroactively fixing is expensive

### Cost Observations

- Model mix: Unknown (agent session data not tracked)
- Sessions: ~3 active development days
- Notable: 818 files changed, 194,450 lines added — fast velocity for 3-day milestone

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~3 | 7 | Initial build — all phases executed in sequence |
| v1.1 | ~2 | 5 | Cleanup + refinement — schema migrations, UI polish |
| v1.2 | ~5 | 6 | Python sidecar + .docx pipeline — new external service integration |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 18 vitest | partial | 51 requirements shipped |
| v1.1 | ~20 vitest | partial | 15 requirements shipped |
| v1.2 | ~289 vitest | improved | 48 requirements shipped |

### Top Lessons (Verified Across Milestones)

1. Pure functions + unit tests = reliable business logic (deadline engine)
2. VERIFICATION.md must be living document, not retrospective
3. UAT during execution catches real user issues (8 in Phase 2 alone)
4. Phase plan Success Criteria must be updated as work progresses
5. Explicit pre-transliteration before external library calls prevents cross-platform bugs
