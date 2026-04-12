---
phase: 04-deadline-engine-dashboard
plan: 01
subsystem: database
tags: [drizzle, date-fns, tdd, sqlite, schema]

# Dependency graph
requires: []
provides:
  - "sure table with FK→dosya cascade, indexes on dosya_id and son_tarih"
  - "Pure deadline calculation service (lib/deadline-service.ts) with 5 exported functions"
  - "Wave 0 test stubs for SURE-01, SURE-02, SURE-03, SURE-05, DASH-01, DASH-02"
affects: [04-deadline-engine-dashboard/04-02]

# Tech tracking
tech-stack:
  added: [date-fns]
  patterns:
    - "Pure functions pattern: deadline-service.ts has zero DB imports, testable in isolation"
    - "TDD cycle: RED failing tests → GREEN implementation → REFACTOR if needed"
    - "Drizzle migration: custom empty migration + manual SQL + migrate workflow"

key-files:
  created:
    - "lib/deadline-service.ts - Pure deadline calculation functions (5 exports)"
    - "lib/schema.ts - sure table added with SURE_TUR constant and SureTur type"
    - "tests/04-deadline-service.test.ts - 13 unit tests for deadline functions"
    - "tests/04-sure.test.ts - Stub tests for sure router procedures"
    - "tests/04-dashboard.test.ts - Stub tests for dashboard router procedures"
    - "tests/04-schema-sure.test.ts - Schema validation tests"
    - "drizzle/0003_chunky_charles_xavier.sql - sure table migration"
  modified:
    - "lib/schema.ts - added SURE_TUR, SureTur, sure table, sureRelations, dosyaRelations updated"

key-decisions:
  - "Used local Date construction (new Date(y, m-1, d)) instead of parseISO to avoid timezone off-by-one errors"
  - "Used drizzle-kit generate --custom (empty migration) + manual SQL + migrate due to non-interactive TTY limitation"
  - "getDaysUntil uses noon (12:00) for both deadline and today to avoid UTC midnight boundary issues"

requirements-completed: [SURE-01, SURE-02, SURE-03, SURE-05]

# Metrics
duration: 9min
completed: 2026-04-13
---

# Phase 4 Plan 1: Deadline Engine + Dashboard Summary

**sure table schema, pure deadline calculation service, Drizzle migration, and Wave 0 test stubs established**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-13T00:02:00Z
- **Completed:** 2026-04-13T00:11:00Z
- **Tasks:** 4 (Task 0 Wave 0 stubs, Task 1 sure schema, Blocking migration, Task 2 deadline service)
- **Files modified:** 11

## Accomplishments
- `sure` table with FK→dosya cascade, indexes on `dosya_id` and `son_tarih`
- `lib/deadline-service.ts` with 5 pure functions (no DB imports): `calcStkItirazSuresi`, `calcIstinafBasvurusu`, `calcCevapDilekce`, `isInAdliTatil`, `getDaysUntil`
- Drizzle migration applied to `./data/db.sqlite` via custom empty migration workflow
- Wave 0 test stubs created for all Phase 4 requirements (SURE-01 through SURE-05, DASH-01, DASH-02)
- TypeScript compiles clean (`npx tsc --noEmit` exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 0 (Wave 0): Test stubs** - `1ff2566` (test)
2. **Task 1: sure table schema** - `5cadc02` (feat)
3. **Task [BLOCKING]: Drizzle migration** - `3c1818f` (feat)
4. **Task 2: deadline-service.ts** - `0ad2bb9` (feat)
5. **Drizzle metadata** - `55a3b8b` (chore)

## Files Created/Modified

- `lib/deadline-service.ts` - Pure deadline calculation functions (5 exports)
- `lib/schema.ts` - Added SURE_TUR, SureTur type, sure table, sureRelations, updated dosyaRelations
- `tests/04-deadline-service.test.ts` - 13 unit tests covering all deadline calculation functions
- `tests/04-sure.test.ts` - 4 stub tests for sure router procedures
- `tests/04-dashboard.test.ts` - 1 stub test for dashboard router
- `tests/04-schema-sure.test.ts` - 4 schema validation tests
- `drizzle/0003_chunky_charles_xavier.sql` - Migration SQL for sure table
- `drizzle/meta/_journal.json` - Updated with migration 0003 entry
- `drizzle/meta/0003_snapshot.json` - Updated snapshot with sure table

## Decisions Made

- Used local Date construction (`new Date(y, m-1, d)`) instead of `parseISO('YYYY-MM-DD')` to avoid timezone off-by-one errors in deadline calculations
- Used `drizzle-kit generate --custom` + manual SQL + `drizzle-kit migrate` due to non-interactive TTY limitation preventing standard `generate` workflow
- `getDaysUntil` uses noon (12:00) for both deadline and today to avoid UTC midnight boundary issues that caused -1 when current time was near local midnight

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit generate fails in non-interactive mode**
- **Found during:** [BLOCKING] Task - Run Drizzle migration
- **Issue:** `drizzle-kit generate` prompts for interactive confirmation even with explicit flags, fails in non-interactive shell
- **Fix:** Used `drizzle-kit generate --custom` to create empty migration file, manually wrote SQL, ran `drizzle-kit migrate`
- **Files modified:** drizzle/0003_chunky_charles_xavier.sql
- **Verification:** sure table exists in ./data/db.sqlite via direct query
- **Committed in:** 3c1818f

**2. [Rule 1 - Bug] Timezone off-by-one errors in deadline calculations**
- **Found during:** Task 2 - lib/deadline-service.ts implementation
- **Issue:** `parseISO('2025-01-01')` treats date as UTC midnight; when converted back to ISO string after `addDays`, timezone offset caused date to shift by one day
- **Fix:** Replaced `parseISO` with local Date construction `new Date(y, m - 1, d)` and `format()` for output
- **Files modified:** lib/deadline-service.ts, tests/04-deadline-service.test.ts
- **Verification:** All 13 unit tests pass
- **Committed in:** 0ad2bb9

**3. [Rule 1 - Bug] getDaysUntil returns -1 for today's date**
- **Found during:** Task 2 - getDaysUntil test
- **Issue:** Test used `new Date().toISOString().split('T')[0]` which returns UTC date; when local time is past midnight UTC but before local midnight, UTC date is yesterday
- **Fix:** Fixed test to use local date string construction: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
- **Files modified:** tests/04-deadline-service.test.ts
- **Verification:** All 13 tests pass
- **Committed in:** 0ad2bb9

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All auto-fixes essential for functionality. No scope creep.

## Issues Encountered

- **Drizzle-kit non-interactive mode limitation:** Standard `generate` workflow requires TTY for schema conflict prompts. Worked around using `--custom` flag to create empty migration, then filled in SQL manually. Next plan should use standard workflow if available or document this limitation.
- **Timezone handling:** date-fns `parseISO` treats 'YYYY-MM-DD' as UTC midnight. Local midnight construction avoids UTC conversion issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 Plan 2 ready to start: will add `sure` tRPC router (list, createManuel, updateManuel, deleteSure) and `dashboard` router (stats query)
- `lib/deadline-service.ts` ready for import by surec router mutations
- `sure` table exists in database, ready for CRUD operations

---
*Phase: 04-deadline-engine-dashboard*
*Completed: 2026-04-13*
