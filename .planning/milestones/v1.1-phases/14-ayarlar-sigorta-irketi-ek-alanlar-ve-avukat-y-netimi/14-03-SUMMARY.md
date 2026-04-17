---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
plan: 03
subsystem: api
tags: [trpc, zod, validation, test, router]

# Dependency graph
requires:
  - phase: 14-02
    provides: "Applied migration with avukat table, join table, taraf.avukat_id FK"
provides:
  - tRPC router: ayarlarRouter.sigortaSirketi with 5 endpoints
  - tRPC router: ayarlarRouter.avukat with 7 endpoints
  - Exported Zod schemas for validation tests
  - Updated dosya.getById query with taraf.avukat relation
affects: [14-04-avukat-ui, 14-05-sigorta-sirketi-ui]

# Tech tracking
tech-stack:
  added: [zod schemas, tRPC procedures]
  patterns: [custom CRUD router, nested router, relation queries, many-to-many]

key-files:
  created:
    - tests/ayarlar-validation.test.ts (12 test cases)
    - tests/avukat-relations.test.ts (5 integration tests)
  modified:
    - lib/trpc/routers/ayarlar.ts (custom sigortaSirketi router, new avukat router)
    - lib/trpc/routers/dosya.ts (updated getById with taraf.avukat relation)

key-decisions:
  - "Replaced makeCrudRouter(sigortaSirketi) with custom router for 7-field schema"
  - "Used makeCrudRouter only for mahkeme | sigortaTuru (type narrowed)"
  - "Extended dosya.getById taraflar.with to include sigortaSirketi + avukat"

patterns-established:
  - "Custom router pattern: individual Zod schema + CRUD procs"
  - "Nested router pattern: avukat under ayarlarRouter"
  - "Relation query pattern: join via db.query.with nested objects"

requirements-completed: [D-02, D-03, D-05, D-06, D-07, D-08, D-10, D-11, D-12]

# Metrics
duration: 10min
completed: 2026-04-17T13:08:00+03:00
---

# Phase 14 Plan 3: tRPC Router Build Summary

**Custom tRPC router for sigortaSirketi + avukat with Zod validation, exported schemas for testing, dosya.getById extended with taraf.avukat**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-17T13:03:00+03:00
- **Completed:** 2026-04-17T13:08:00+03:00
- **Tasks:** 2
- **Files modified:** 4 (2 new test files, 2 routers)

## Accomplishments

- **Task 1:** Created custom `sigortaSirketi` router (replacing `makeCrudRouter`) with:
  - `list`: all sigorta_sirketi rows
  - `listWithAvukatlar`: with nested avukatlar + avukat (Plan 04 UI uses this)
  - `create/update/delete`: with `sigortaSirketiSchema` (7 fields)
  - Exported `sigortaSirketiSchema` + `avukatSchema` for tests

- **Task 2:** Created `avukat` nested router under `ayarlarRouter` with:
  - `list`: all avukat rows
  - `bySirket`: filtered by sigorta_sirketi_id (cascading dropdown for Plan 05)
  - `create/update/delete`: with `avukatSchema`
  - `addSirket`: link avukat ↔ sigorta_sirketi (many-to-many)
  - `removeSirket`: unlink

- **Updated `dosya.getById`:** Extended `taraflar` with relation:
  - `taraflar.with.sigortaSirketi` (Plan 05 uses)
  - `taraflar.with.avukat` (Plan 05 uses to show Karşı Taraf Avukatı)

## Task Commits

1. **Task 1: Replace sigortaSirketi makeCrudRouter with custom router + add avukat router** - Test-first (RED), then implementation (GREEN)
2. **Task 2: Update tarafSchema + dosya.getById to replace karsitaraf_vekil with avukat_id + integration test** - Test-first (RED), then implementation (GREEN)

**Plan metadata:** `91de61f` (docs: complete plan - 4 files)

## Verification Results

| Check | Status |
|-------|--------|
| sigortaSirketiSchema exported | ✓ |
| avukatSchema exported | ✓ |
| VKN/TCKN 10-11 digits regex | ✓ |
| IBAN TR24 regex | ✓ |
| Phone 05XXXXXXXXX regex | ✓ |
| 3 email() validations | ✓ |
| listWithAvukatlar endpoint | ✓ |
| avukat router with all 7 procs | ✓ |
| makeCrudRouter(sigortaSirketi) removed | ✓ |
| 17 Vitest tests pass | ✓ |

## Files Created/Modified

- `lib/trpc/routers/ayarlar.ts` - Custom router for sigortaSirketi + new avukat router with all endpoints
- `lib/trpc/routers/dosya.ts` - Updated getById with taraflar.avukat relation
- `tests/ayarlar-validation.test.ts` - 12 unit tests for Zod schemas
- `tests/avukat-relations.test.ts` - 5 integration tests for many-to-many + cascades

## Decisions Made

- Replaced `makeCrudRouter(sigortaSirketi)` with dedicated custom router (now has full 7-field schema support)
- Kept `makeCrudRouter` for mahkeme + sigortaTuru only (narrowed type union)
- Used `onConflictDoNothing()` on join table inserts to prevent duplicates
- Extended `getById` not `list` — detail view needs full relation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test imports failed before implementation**
- **Found during:** Task 1 RED phase
- **Issue:** Tests imported undefined schemas — not yet exported
- **Fix:** Added implementation that exports sigortaSirketiSchema/avukatSchema
- **Files modified:** lib/trpc/routers/ayarlar.ts
- **Verification:** 17 tests pass (12 unit + 5 integration)
- **Committed in:** 91de61f (part of task commit)

---

**Total deviations:** 1 auto-fixed (implementation preceded export)
**Impact on plan:** Minor correction — exports existed in plan action, just needed to implement.

## Issues Encountered

- TypeScript errors in ayarlar-page.tsx: These are out of scope (UI code — Plans 04/05 will fix)

## Next Phase Readiness

- tRPC router ready for Plans 04/05 UI consumption
- `listWithAvukatlar` endpoint available for Plan 04
- `avukat.bySirket` endpoint available for Plan 05 cascading dropdown
- `taraf.avukat` in dosya.getById for Plan 05 view mode

---
*Phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi*
*Completed: 2026-04-17*