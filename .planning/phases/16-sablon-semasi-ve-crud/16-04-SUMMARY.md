---
phase: "16"
plan: "04"
subsystem: api
tags: [trpc, drizzle, sidecar, docx, template-crud]

# Dependency graph
requires:
  - phase: "16-01"
    provides: "docxSablon schema + sablonCreateSchema/sablonUpdateSchema validators"
  - phase: "16-02"
    provides: "Python sidecar handle_extract_vars with runSidecarCommand()"
  - phase: "16-03"
    provides: "Upload route returning { filePath, fileName, fileSize }"
provides:
  - "sablonRouter: list/create/delete/update tRPC procedures with sidecar IPC"
  - "appRouter.sablon: registered CRUD entry point for UI"
  - "Integration tests verifying SET NULL FK cascade"
affects:
  - "Phase 16-05 (UI wiring — trpc.sablon.* calls)"
  - "Phase 16-06 (PDF pipeline)"
  - "Phase 18 (audit logging for sablon CRUD)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "safeUnlink: path.resolve guard before any fs.unlinkSync"
    - "DB-first delete then disk — SET NULL FK fires before file removal"
    - "extract-vars on both create and update; cleanup orphan file on sidecar error"
    - "Overwrite pattern: same DB id, replace file on disk, re-extract variables"

key-files:
  created:
    - "lib/trpc/routers/sablon.ts"
    - "tests/16-sablon-router.test.ts"
  modified:
    - "lib/trpc/routers/_app.ts"

key-decisions:
  - "TEMPLATES_BASE_PATH = path.resolve(process.cwd(), 'uploads', 'templates') for absolute path guard"
  - "safeUnlink swallows errors — disk failure does not propagate to tRPC error"
  - "SessionData only requires { isLoggedIn: true } for protectedProcedure mock in tests"
  - "belge.sablon_id ON DELETE SET NULL verified by integration test that re-queries belge row after delete"

patterns-established:
  - "CRUD router pattern: list (query), create/update/delete (mutation), all protectedProcedure"
  - "Sidecar-first create: extract-vars before DB insert; orphan cleanup on error"
  - "Path-traversal guard pattern: resolve + startsWith before unlink"

requirements-completed: [SABLON-01, SABLON-02, SABLON-03, SABLON-05, SABLON-06]

# Metrics
duration: 25min
completed: "2026-04-21"
---

# Phase 16 Plan 04: sablonRouter CRUD with Sidecar IPC — Summary

**sablonRouter with list/create/delete/update procedures, registered in appRouter, verified by integration tests including SET NULL FK cascade**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-21T07:45:00Z
- **Completed:** 2026-04-21T08:10:00Z
- **Tasks:** 3 (1 TDD router + 1 registration + 1 TDD test)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- tRPC sablonRouter with four protectedProcedure CRUD operations
- Sidecar IPC: extract-vars called on both create and update; orphan file cleanup on error
- Path-traversal guard (safeUnlink with TEMPLATES_BASE_PATH) on all disk deletions
- Turkish NOT_FOUND error: 'Şablon bulunamadı.' in delete and update
- appRouter registers `sablon: sablonRouter` key
- Integration tests: 5 passing including SET NULL FK cascade verification

## Task Commits

Each task was committed atomically:

1. **Task 1+2: sablonRouter implementation + appRouter registration** - `e0b4ffe` (feat)
2. **Task 3: sablonRouter integration tests** - `47721e2` (test)

**Plan metadata:** `docs(16-04): complete sablonRouter CRUD plan` (pending)

## Files Created/Modified

- `lib/trpc/routers/sablon.ts` - Full CRUD router: list, create (extract-vars + insert), delete (SET NULL cascade + safeUnlink), update (overwrite + re-extract)
- `lib/trpc/routers/_app.ts` - Added `import { sablonRouter }` and `sablon: sablonRouter` registration
- `tests/16-sablon-router.test.ts` - 5 tests: procedure surface, create with valid fixture, BAD_REQUEST on missing file, SET NULL cascade, NOT_FOUND Turkish message

## Decisions Made

- Used `TEMPLATES_BASE_PATH = path.resolve(process.cwd(), 'uploads', 'templates')` as the canonical base for path-traversal guards
- `safeUnlink` swallows all errors (best-effort disk cleanup after DB delete already committed)
- Mock session context in tests: `{ session: { isLoggedIn: true } }` matching actual `SessionData` interface
- DB delete always before file unlink — ensures SET NULL FK constraint fires even if disk operation fails

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** N/A — no deviations

## Issues Encountered

None — all 5 tests passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- sablonRouter CRUD complete and registered in appRouter
- sablonCreateSchema and sablonUpdateSchema wired as input validators
- SET NULL cascade verified by integration test
- Phase 16-05 (UI wiring) is unblocked

---
*Phase: 16-sablon-semasi-ve-crud*
*Completed: 2026-04-21*
