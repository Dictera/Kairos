---
phase: 04-deadline-engine-dashboard
plan: 02
subsystem: api
tags: [trpc, drizzle, deadline, dashboard, tdd]

# Dependency graph
requires:
  - phase: 04-deadline-engine-dashboard
    provides: "sure table schema + lib/deadline-service.ts pure calculation functions (Plan 01)"
provides:
  - "sure tRPC router with 4 CRUD procedures (list, createManuel, updateManuel, deleteSure)"
  - "dashboard tRPC router with dashboardStats aggregation query"
  - "Auto-calc deadline upsert/delete wired into surec.updateStkData and surec.updateMahkemeData"
  - "SureList UI component with urgency badges, adli tatil indicator, CRUD dialogs"
  - "Süreler subsection in Yargilama Süreci tab on case detail page"
affects: [04-deadline-engine-dashboard/04-03]

# Tech tracking
tech-stack:
  added: [date-fns/addDays]
  patterns:
    - "Auto-calc trigger pattern: delete + conditional insert after form save (D-07, D-09, D-11)"
    - "Promise.all for parallel dashboard stats aggregation"
    - "Inline form pattern: expand/collapse create form vs dialog-based edit/delete"

key-files:
  created:
    - "lib/trpc/routers/sure.ts - 4-procedure sure router"
    - "lib/trpc/routers/dashboard.ts - dashboardStats router"
    - "components/dosya/sure-list.tsx - Full CRUD UI for deadlines"
  modified:
    - "lib/trpc/routers/surec.ts - Added auto-calc triggers after updateStkData and updateMahkemeData"
    - "lib/trpc/routers/_app.ts - Registered sure and dashboard routers"
    - "components/dosya/yargilama-sureci-tab.tsx - Added Süreler subsection"
    - "tests/04-sure.test.ts - Replaced .todo stubs with real procedure tests"
    - "tests/04-dashboard.test.ts - Replaced .todo stub with real procedure test"

key-decisions:
  - "Used inline form (not dialog) for creating new manual deadlines — keeps user in context"
  - "Edit and delete only available on manuel rows — auto-calc rows are managed by the system"
  - "Auto-calc uses delete-then-insert upsert pattern — avoids duplicates when tebligat/karar date changes"

patterns-established:
  - "Auto-calc trigger: db.delete(sure).where(and(eq(...tur...))) then conditional db.insert"
  - "Urgency badge color: bg-destructive (<3 days), bg-yellow-400 (3-7 days), bg-muted (7-14 days)"
  - "Adli tatil: Badge with bg-amber-100 text-amber-800 border border-amber-300"

requirements-completed: [SURE-04, SURE-01, SURE-02, SURE-03, DASH-01]

# Metrics
duration: 4min
completed: 2026-04-13
---

# Phase 4 Plan 2: Deadline Engine tRPC Routers + SureList UI Summary

**sure and dashboard tRPC routers created with full CRUD; auto-calc wired into surec mutations; SureList component delivers deadline CRUD UI on case detail page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-13T00:14:00Z
- **Completed:** 2026-04-13T00:18:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- `sureRouter` with 4 procedures (list, createManuel, updateManuel, deleteSure) all using `protectedProcedure`
- `dashboardRouter.dashboardStats` aggregates 5 data points (totalDosya, aktivDosya, buAyAcilan, upcomingDeadlines, todaysHearings) in parallel Promise.all
- `surec.updateStkData` now auto-calculates and upserts `stk_itiraz` deadline when `tebligat_tarihi` changes (D-07, D-11)
- `surec.updateMahkemeData` now auto-calculates and upserts `cevap_dilekce` and `istinaf` deadlines (D-09, D-11)
- `SureList` component renders deadline list with urgency badges, adli tatil indicator, inline create form, edit dialog, and delete confirmation
- `YargilamaSureciTab` shows new "Süreler" subsection at bottom of case detail page
- All 18 tests pass (13 deadline-service + 4 sure + 1 dashboard)

## Task Commits

Each task was committed atomically:

1. **Task 1: sure + dashboard routers + auto-calc wiring** - `99ae7ce` (feat)
2. **Task 2: SureList component + YargilamaSureciTab update** - `b0a48ed` (feat)

## Files Created/Modified

- `lib/trpc/routers/sure.ts` - 4-procedure sure router (list, createManuel, updateManuel, deleteSure)
- `lib/trpc/routers/dashboard.ts` - dashboardStats query with Promise.all aggregation
- `lib/trpc/routers/surec.ts` - Auto-calc triggers added to updateStkData and updateMahkemeData
- `lib/trpc/routers/_app.ts` - Registered sure and dashboard routers
- `components/dosya/sure-list.tsx` - Full CRUD UI for manual deadlines
- `components/dosya/yargilama-sureci-tab.tsx` - Added Süreler subsection
- `tests/04-sure.test.ts` - 4 procedure existence tests (was .todo stubs)
- `tests/04-dashboard.test.ts` - 1 procedure existence test (was .todo stub)

## Decisions Made

- Used inline form (not dialog) for creating new manual deadlines — keeps user in context
- Edit and delete only available on manuel rows — auto-calc rows are managed by the system automatically
- Auto-calc uses delete-then-insert upsert pattern — avoids duplicates when tebligat/karar date changes
- `dashboardStats` uses `Promise.all` for parallel stat queries to minimize response latency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 ready: Dashboard page UI with stat cards, upcoming deadlines list, and today's hearings list
- `dashboardRouter.dashboardStats` is ready to be consumed by the dashboard page component
- `SureList` component is ready to be integrated into other tabs if needed

---
*Phase: 04-deadline-engine-dashboard*
*Completed: 2026-04-13*

## Self-Check: PASSED

All claims verified:
- lib/trpc/routers/sure.ts: FOUND (4 procedures: list, createManuel, updateManuel, deleteSure)
- lib/trpc/routers/dashboard.ts: FOUND (dashboardStats with Promise.all)
- lib/trpc/routers/surec.ts: auto-calc triggers FOUND (calcStkItirazSuresi, calcIstinafBasvurusu, calcCevapDilekce)
- lib/trpc/routers/_app.ts: sure and dashboard registered FOUND
- components/dosya/sure-list.tsx: FOUND (urgency badges, adli tatil badge, CRUD dialogs)
- components/dosya/yargilama-sureci-tab.tsx: Süreler subsection FOUND
- tests/04-sure.test.ts: 4 tests PASSED
- tests/04-dashboard.test.ts: 1 test PASSED
- tests/04-deadline-service.test.ts: 13 tests PASSED
- Commit 99ae7ce (Task 1): FOUND
- Commit b0a48ed (Task 2): FOUND
