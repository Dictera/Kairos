---
phase: 20-eski-sistemler-temizligi
plan: 03
subsystem: legacy-retirement
tags:
  - trpc
  - alertdialog
  - modal
  - retirement
requires:
  - TEMIZ-08
provides: []
affects: []
tech-stack:
  added:
    - tRPC protectedProcedure for retirement router
  patterns:
    - Query + mutation tRPC pattern via queryOptions/mutationOptions
    - One-time flag with localStorage cache + DB backup
    - AlertDialog destructive action styling
key-files:
  created:
    - lib/trpc/routers/retirement.ts (checkLegacyTables query + executeRetirement mutation)
    - components/retirement-modal.tsx (AlertDialog with check/execute flow)
  modified:
    - lib/trpc/routers/_app.ts (retirementRouter registered)
    - app/(dashboard)/layout.tsx (RetirementModal mounted)
key-decisions:
  - Used useQuery + useMutation from @tanstack/react-query with tRPC queryOptions/mutationOptions instead of direct .useQuery()/.useMutation() on the router
  - Used sql template tag from drizzle-orm for raw SQL queries in retirement router
patterns-established:
  - "Query + mutation pattern: useQuery for read operations, useMutation for write operations with proper onSuccess/onError handlers"
requirements-completed:
  - TEMIZ-08
duration: 8 min
completed: 2026-04-22T14:15:45Z
start_time: 2026-04-22T14:07:50Z
---

# Phase 20 Plan 03: Retirement Modal + tRPC API Summary

**Retirement confirmation modal mounted in dashboard layout with one-time execution semantics — client checks DB for legacy tables on mount, shows destructive AlertDialog on confirmation, executes server-side cleanup then reloads.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-22T14:07:50Z
- **Completed:** 2026-04-22T14:15:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `retirementRouter` with `checkLegacyTables` query and `executeRetirement` mutation
- Built `RetirementModal` component with AlertDialog, check/execute flow, and one-time localStorage flag
- Mounted `RetirementModal` in dashboard layout as a sibling to main content

## Task Commits

Each task was committed atomically:

1. **Task 1: Create retirement tRPC router** - `29766a3` (feat)
2. **Task 2: Create retirement modal component and mount in dashboard layout** - `4481398` (feat)

**Plan metadata:** NOT COMMITTED (per instructions — no STATE.md/ROADMAP.md updates)

## Files Created/Modified
- `lib/trpc/routers/retirement.ts` - Check legacy tables query + execute retirement mutation
- `lib/trpc/routers/_app.ts` - Added retirementRouter registration
- `components/retirement-modal.tsx` - AlertDialog-based confirmation modal with localStorage flag
- `app/(dashboard)/layout.tsx` - Mounted RetirementModal as sibling to main content

## Decisions Made

- Used `@tanstack/react-query` `useQuery` + `useMutation` with tRPC's `queryOptions()` / `mutationOptions()` pattern (consistent with existing components like `sablon-yonetimi-section.tsx`)
- Used `sql` template tag from drizzle-orm for raw SQLite queries in the retirement router
- Used `localStorage` as client-side one-time flag cache, with DB upsert as server-side backup

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `Select-String "retirementRouter" lib/trpc/routers/_app.ts` → matches (line 17, 39)
- `Select-String "RetirementModal" app/(dashboard)/layout.tsx` → matches (line 6, 17)
- `Select-String "Eski Sistemleri Temizle" components/retirement-modal.tsx` → matches (line 74)
- `Select-String "bg-destructive" components/retirement-modal.tsx` → matches (line 84)
- `npm run build` → exits 0

## Issues Encountered

**1. `api` import not available in client components**
- **Found during:** Task 2 (retirement-modal.tsx creation)
- **Issue:** `import { api } from '@/lib/trpc/react'` does not exist — `@/lib/trpc/react` path is not configured
- **Fix:** Used `useTRPC()` hook from `@/lib/trpc/context` (same pattern as other client components in the project)
- **Files modified:** `components/retirement-modal.tsx`
- **Verification:** Build passes

**2. tRPC v11 `.useQuery()` method doesn't exist on decorated procedures**
- **Found during:** Task 2 (retirement-modal.tsx type check)
- **Issue:** `trpc.retirement.checkLegacyTables.useQuery()` fails — tRPC v11 returns `DecorateQueryProcedure` without `.useQuery()`
- **Fix:** Used `useQuery(trpc.retirement.checkLegacyTables.queryOptions())` pattern from @tanstack/react-query (same pattern as `trpc.sablon.list.queryOptions()` in sablon-yonetimi-section.tsx)
- **Files modified:** `components/retirement-modal.tsx`
- **Verification:** Build passes

## Next Phase Readiness

Ready for **Plan 20-04** — remaining cleanup tasks (router/file deletion, npm uninstall, import scan).

---
*Phase: 20-eski-sistemler-temizligi*
*Completed: 2026-04-22*