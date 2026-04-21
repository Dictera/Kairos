---
phase: 18-arsiv-ve-belge-entegrasyonu
plan: 02
subsystem: api
tags: [archive, pdf, compensating-transaction, drizzle, sqlite, vitest, path-traversal]

requires:
  - phase: 18-01
    provides: "belge_turu column on docx_sablon, slug sidecar command"

provides:
  - "lib/docx/archive.ts — core archive module with path builders, slug helpers, and compensating transaction"
  - "lib/docx/__tests__/archive.test.ts — unit tests for archive logic"

affects:
  - "18-03 (pdfRouter integration — will call archivePdfAndCreateBelge)"
  - "18-04 (end-to-end verification)"

tech-stack:
  added: []
  patterns:
    - "Compensating transaction: disk write first, DB tx second, disk cleanup on DB failure"
    - "Path traversal defense in depth: early .. rejection + post-join path.resolve guard"
    - "Windows reserved name sanitization before filename construction"

key-files:
  created:
    - lib/docx/archive.ts
    - lib/docx/__tests__/archive.test.ts
  modified: []

key-decisions:
  - "Added early .. segment rejection in buildArchivePath as defense-in-depth beyond the path.resolve guard specified in the plan, because path.join treats ../ embedded inside dash-joined slug segments as literal characters rather than path navigation operators"

patterns-established:
  - "Compensating transaction pattern for file+DB atomicity: compute seq → mkdir+rename → db.transaction → safeUnlink rollback on failure"
  - "Windows reserved name guard: check final baseName against /^CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9]$/i and append -belge if matched"

requirements-completed:
  - ARSIV-01
  - ARSIV-02
  - ARSIV-03
  - ARSIV-04
  - ARSIV-05
  - ARSIV-06

# Metrics
duration: ~8min
completed: 2026-04-21
---

# Phase 18 Plan 02: Arşiv ve Belge Entegrasyonu — Archive Module Summary

**Core archive module with compensating transaction pattern: PDFs moved to YYYY/AA/kategori-slug directories and atomically tracked in `belge` + `olay_gunlugu` tables with automatic disk rollback on DB failure.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-21T22:42:00Z
- **Completed:** 2026-04-21T22:47:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `lib/docx/archive.ts` with full archive logic including path builders, slug helpers, and compensating transaction
- Implemented `archivePdfAndCreateBelge` with seq computation via COUNT query, atomic file move with EXDEV fallback, and `db.transaction` with `behavior: 'immediate'`
- Added defense-in-depth path traversal guard (`..` segment rejection + `path.resolve` boundary check)
- Added Windows reserved name sanitization (`isReservedWindowsName`)
- Created comprehensive unit tests (29 tests, all passing) covering path construction, filename format, reserved names, path traversal, and slug fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/docx/archive.ts with full archive logic** - `ef15d85` (feat)
2. **Task 2: Unit tests for archive logic** - `bcc49fe` (test)

**Plan metadata:** *(pending final commit)*

## Files Created/Modified
- `lib/docx/archive.ts` — Core archive module: path construction, slug generation, compensating transaction for PDF archival
- `lib/docx/__tests__/archive.test.ts` — Unit tests for archive logic (29 tests)

## Decisions Made
- Followed plan-specified compensating transaction pattern: disk ops outside DB tx, DB ops inside `db.transaction` with `behavior: 'immediate'`, `safeUnlinkArchive` rollback on failure
- Used direct `tx.insert(olayGunlugu)` inside transaction rather than `logOlay` helper to maintain atomicity (logOlay uses `db` not `tx`)
- Added early `..` segment rejection as defense-in-depth after discovering that `path.join` does not normalize `../` when embedded inside dash-joined slug segments

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added early `..` segment rejection in buildArchivePath**
- **Found during:** Task 2 (writing unit tests)
- **Issue:** The `path.resolve(filePath).startsWith(ARCHIVE_BASE)` guard specified in the plan did not catch path traversal when `../` was embedded inside a slug segment joined with dashes (e.g., `muvekkil-../../../../etc`). `path.join` treats `../` inside a filename string as literal characters, not path navigation operators.
- **Fix:** Added a loop that rejects any slug segment containing `..` before path construction, as defense-in-depth alongside the existing `path.resolve` guard.
- **Files modified:** `lib/docx/archive.ts`
- **Verification:** Unit test `throws TRPCError for path traversal via plakaSlug` passes
- **Committed in:** `ef15d85` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed test expectation for reserved Windows names with plaka**
- **Found during:** Task 2 (running tests)
- **Issue:** Test expected `COM1-belge-LPT1-belge-2.pdf`, but the combined baseName `COM1-LPT1` does not match the reserved name regex `/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i`.
- **Fix:** Updated test expectation to `COM1-LPT1-2.pdf` to match the spec behavior (only exact matches trigger mutation).
- **Files modified:** `lib/docx/__tests__/archive.test.ts`
- **Verification:** All 29 tests pass
- **Committed in:** `bcc49fe` (Task 2 commit)

**3. [Rule 1 - Bug] Fixed path traversal test inputs to actually escape ARCHIVE_BASE**
- **Found during:** Task 2 (running tests)
- **Issue:** Initial test inputs (`../etc`, `../../../etc`) did not actually escape `ARCHIVE_BASE` after `path.join` normalization because the directory depth absorbs some `../` segments.
- **Fix:** Updated test inputs to `../../../etc` for kategoriSlug and `../../../../etc` for muvekkilSlug to ensure resolved path escapes `ARCHIVE_BASE`.
- **Files modified:** `lib/docx/__tests__/archive.test.ts`
- **Verification:** Path traversal tests pass
- **Committed in:** `bcc49fe` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 bugs)
**Impact on plan:** All auto-fixes necessary for correctness and security. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in unrelated test files (`tests/06-belge-finans.test.ts`, `tests/16-sidecar-extract-vars.test.ts`, `tests/lib/pipeline/config.test.ts`, `tests/lib/trpc/routers/pipeline.test.ts`) — out of scope for this plan
- No issues in newly created files; TypeScript compilation clean for `lib/docx/archive.ts` and `lib/docx/__tests__/archive.test.ts`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Archive module ready for integration into pdfRouter (Phase 18-03)
- All exported functions tested and verified
- Compensating transaction pattern established and documented

## Self-Check: PASSED

- [x] `lib/docx/archive.ts` exists and exports all 6 functions
- [x] `lib/docx/__tests__/archive.test.ts` exists with 29 passing tests
- [x] Commit `ef15d85` exists (`git log --oneline | grep ef15d85`)
- [x] Commit `bcc49fe` exists (`git log --oneline | grep bcc49fe`)

---
*Phase: 18-arsiv-ve-belge-entegrasyonu*
*Completed: 2026-04-21*
