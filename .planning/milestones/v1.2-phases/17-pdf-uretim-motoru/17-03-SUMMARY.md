---
phase: 17-pdf-uretim-motoru
plan: 03
subsystem: pdf
tags: [trpc, drizzle, jinja2, docx, pdf, sidecar]

# Dependency graph
requires:
  - phase: 17-pdf-uretim-motoru
    provides: "Python sidecar render/convert handlers and CommandEnvelope protocol"
  - phase: 17-pdf-uretim-motoru
    provides: "Variable registry with missing-variable pre-check"
provides:
  - "tRPC pdfRouter.generate procedure orchestrating full PDF generation pipeline"
  - "Drizzle data to nested Jinja2 context mapping via buildJinja2Context"
  - "Missing-variable pre-check with Turkish tab deep-link error messages"
  - "Temp file cleanup in success and all error paths"
affects:
  - "17-04 (archive — consumes pdfPath from generate mutation)"
  - "UI components that invoke trpc.pdf.generate.useMutation()"
  - "Belge tab one-click template-to-PDF generation"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drizzle relational queries (db.query.dosya.findFirst with with:) for eager loading"
    - "Null-to-empty-string sanitization for Jinja2 context to prevent 'None' rendering"
    - "Two-phase sidecar: render (120s) then convert (180s envelope) with per-command timeouts"
    - "Missing-variable gate: blocks generation before expensive sidecar calls"

key-files:
  created:
    - lib/docx/context-builder.ts
    - lib/trpc/routers/pdf.ts
    - lib/validators/pdf.ts
  modified:
    - lib/trpc/routers/_app.ts
    - lib/docx/context-builder.ts (type fix after Task 1)

key-decisions:
  - "Used db.query.dosya.findFirst with Drizzle relational queries instead of manual joins — matches established project pattern"
  - "Kept numbers (talep_tutari, tutar) unsanitized so tr_currency Jinja2 filter receives numeric input"
  - "renderedDocxPath cleaned up in both success and all error paths via fs.unlinkSync before each throw"

patterns-established:
  - "Context builder pattern: isolated lib/docx/context-builder.ts maps DB relations to template variable namespace"
  - "Tab-label helper inside router for Turkish deep-link messages without adding UI dependencies to backend"

requirements-completed: [PDF-01, PDF-02, PDF-10]

# Metrics
duration: 9min
completed: 2026-04-21
---

# Phase 17 Plan 03: tRPC pdfRouter + Jinja2 Context Builder Summary

**tRPC pdfRouter with generate mutation that fetches case data via Drizzle relational queries, builds nested Jinja2 context, runs missing-variable pre-check, and orchestrates Python sidecar render-then-convert with proper temp file cleanup and Turkish error messages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-21T20:52:21Z
- **Completed:** 2026-04-21T21:01:21Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Built `lib/docx/context-builder.ts` with `buildJinja2Context()` mapping all Drizzle relations (muvekkil, dosya, taraf, stk, mahkeme, durusmalar, sureler, finans_kalemleri, notlar) to nested Jinja2-compatible context
- Implemented `sanitizeForJinja2()` recursive helper that converts null/undefined to empty strings while preserving numbers for currency filters
- Created `lib/trpc/routers/pdf.ts` with `pdfRouter.generate` protectedProcedure accepting `dosyaId + sablonId`
- Added missing-variable pre-check via `getMissingVariables()` that blocks generation and returns Turkish deep-link messages referencing the correct tab
- Wired two-phase sidecar: render (120s timeout) then convert (180s envelope timeout, 120s LibreOffice timeout)
- Ensured `renderedDocxPath` is unlinked in success path and all error paths (render failure, convert failure, missing template, missing case)
- Registered `pdfRouter` in `lib/trpc/routers/_app.ts` alongside `sablonRouter`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Jinja2 context builder from Drizzle data** — `ee6b792` (feat)
2. **Type fix: Correct DosyaWithRelations type** — `7b40be8` (fix) — auto-fixed during Task 2 verification
3. **Task 2: Create pdfRouter with generate procedure** — `0068c8b` (feat)
4. **Task 3: Register pdfRouter in app router** — `f3c78d7` (feat)

## Files Created/Modified

- `lib/docx/context-builder.ts` — New: `buildJinja2Context()`, `DosyaWithRelations` interface, `sanitizeForJinja2()` helper
- `lib/trpc/routers/pdf.ts` — New: `pdfRouter` with `generate` mutation, `tabLabel()` helper
- `lib/validators/pdf.ts` — New: `pdfGenerateSchema` Zod validator
- `lib/trpc/routers/_app.ts` — Modified: added `pdf: pdfRouter` registration

## Decisions Made

- Used `db.query.dosya.findFirst` with `with:` syntax instead of manual SQL joins — this is the project's established pattern (seen in dosya.ts, muvekkil.ts)
- Preserved numeric types (`talep_tutari`, `tutar`) in Jinja2 context so the Python `tr_currency` filter receives a number rather than an empty string
- Placed `tabLabel()` helper inside `pdf.ts` (not exported) to keep backend router self-contained without importing UI constants

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DosyaWithRelations type incompatibility with Drizzle output**
- **Found during:** Task 2 (TypeScript compilation of pdf.ts)
- **Issue:** `DosyaWithRelations` interface in Task 1 used optional properties (`muvekkil?`, `sigortaSirketi?`) with `undefined` for missing one-relations, but Drizzle relational queries return `null` for missing one-relations and always include the property
- **Fix:** Changed all relation properties to required with `| null` for one-relations; updated `buildJinja2Context` body to use direct property access instead of optional chaining for array relations
- **Files modified:** `lib/docx/context-builder.ts`
- **Verification:** `npx tsc --noEmit -p tsconfig.json --skipLibCheck` passes with zero new errors
- **Committed in:** `7b40be8`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type correction necessary for compilation. No scope creep.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- pdfRouter.generate is ready for Phase 18 (archive) to consume the returned `pdfPath`
- Phase 18 will need to: copy PDF to `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/`, insert into `belge` table, and clean up temp PDF
- `buildJinja2Context` is extensible — new fields can be added to the context object as the variable registry grows
- No blockers for Phase 18

## Self-Check: PASSED

- [x] `lib/docx/context-builder.ts` exists and exports `buildJinja2Context`
- [x] `lib/trpc/routers/pdf.ts` exists and exports `pdfRouter`
- [x] `lib/validators/pdf.ts` exists and exports `pdfGenerateSchema`
- [x] `lib/trpc/routers/_app.ts` includes `pdf: pdfRouter`
- [x] Commits verified: ee6b792, 7b40be8, 0068c8b, f3c78d7
- [x] `npx tsc --noEmit -p tsconfig.json --skipLibCheck` passes (6 pre-existing test errors only)

---
*Phase: 17-pdf-uretim-motoru*
*Completed: 2026-04-21*
