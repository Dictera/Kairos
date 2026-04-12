---
phase: 04-deadline-engine-dashboard
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - lib/deadline-service.ts
  - lib/trpc/routers/sure.ts
  - lib/trpc/routers/dashboard.ts
  - lib/trpc/routers/surec.ts
  - components/dosya/sure-list.tsx
  - components/dashboard/stat-cards.tsx
  - components/dashboard/upcoming-deadlines.tsx
  - components/dashboard/todays-hearings.tsx
  - app/(dashboard)/page.tsx
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 4 implements a deadline engine and dashboard for a Turkish legal case management system. The code implements deadline calculations (STK itiraz, istinaf, cevap dilekçe), a tRPC CRUD router for manual deadlines, a dashboard aggregation router, and React UI components for the dashboard and deadline management.

One critical bug was found: a timezone handling error in `dashboard.ts` causes the `today` and `in14Days` date boundaries to be calculated incorrectly near local midnight, potentially excluding today's deadlines from the dashboard query. One unused import was also found.

## Critical Issues

### CR-01: Timezone off-by-one error in dashboard date boundaries

**File:** `lib/trpc/routers/dashboard.ts:10-11`
**Issue:** The dashboard query uses `new Date().toISOString().split('T')[0]` to get today's date for the deadline filter. This converts to UTC midnight, which can be off by one day from the local date near local midnight. For example, at 01:00 local time on April 14 in UTC+3 timezone, `new Date().toISOString()` returns `"2026-04-13T22:00:00.000Z"`, so `today` becomes `"2026-04-13"` instead of the correct `"2026-04-14"`. Similarly, `in14Days` will be off by one day.

This causes the `upcomingDeadlines` query to potentially exclude deadlines due today and include deadlines from the day after the intended range.

**Impact:** Users may not see deadlines due today in the Yaklaşan Süreler widget. The same issue affected `getDaysUntil` in Plan 01 and was documented as auto-fixed — but the same pattern was reintroduced in `dashboard.ts`.

**Fix:**
```typescript
// Replace lines 10-11:
const today = new Date().toISOString().split('T')[0]
const in14Days = addDays(new Date(), 14).toISOString().split('T')[0]

// With local date construction (matching deadline-service.ts pattern):
function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const today = toLocalDateString(new Date())
const in14Days = toLocalDateString(addDays(new Date(), 14))
```

## Warnings

### WR-01: Unused import in deadline-service.ts

**File:** `lib/deadline-service.ts:1`
**Issue:** `parseISO` is imported from `date-fns` but never used. The deadline functions use manual date string parsing (`new Date(y, m - 1, d)`) instead of `parseISO` to avoid timezone off-by-one errors (as documented in the 04-01-SUMMARY.md).

**Fix:**
```typescript
// Remove parseISO from the import:
import { addDays, isWithinInterval, differenceInCalendarDays, format } from 'date-fns'
```

## Info

### IN-01: deleteSure mutation silently succeeds for non-existent ID

**File:** `lib/trpc/routers/sure.ts:58-63`
**Issue:** The `deleteSure` mutation calls `db.delete()` without checking if any rows were affected. If the ID does not exist, the mutation returns `{ success: true }` without indication that nothing was deleted. This is arguably correct idempotent REST semantics, but worth noting.

**Fix:** Consider using `.returning()` to verify deletion:
```typescript
deleteSure: protectedProcedure
  .input(z.object({ id: z.number().int() }))
  .mutation(async ({ input }) => {
    const result = await db.delete(sure).where(eq(sure.id, input.id)).returning()
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Süre bulunamadı.' })
    }
    return { success: true }
  }),
```

## Findings by File

### lib/deadline-service.ts ✅
- Correctly uses local date construction to avoid timezone off-by-one errors
- Pure functions with no DB imports — correctly isolated
- `getDaysUntil` uses noon normalization for both dates — correct
- Exports all 5 required functions: `calcStkItirazSuresi`, `calcIstinafBasvurusu`, `calcCevapDilekce`, `isInAdliTatil`, `getDaysUntil`

### lib/trpc/routers/sure.ts ✅
- All 4 procedures use `protectedProcedure` — correct
- Zod validation with date regex `/^\d{4}-\d{2}-\d{2}$/` — correct
- Input length limits enforced (ad: max 100, notlar: max 500) — correct
- `updateManuel` correctly throws NOT_FOUND when row doesn't exist
- No SQL injection risk — uses drizzle-orm parameterized queries

### lib/trpc/routers/dashboard.ts ⚠️
- **CRITICAL**: Timezone bug in date boundary calculation (see CR-01)
- Uses `protectedProcedure` — correct
- `Promise.all` for parallel queries — good performance pattern
- SQL joins correctly use `innerJoin` for required relationships

### lib/trpc/routers/surec.ts ✅
- Auto-calc triggers correctly wired after `updateStkData` and `updateMahkemeData`
- Delete-then-insert pattern prevents duplicate deadlines — correct
- Uses `and()` from drizzle-orm for compound WHERE clauses — correct
- `protectedProcedure` on all procedures — correct

### components/dosya/sure-list.tsx ✅
- Client-side deadline functions (`urgencyBadgeClass`, `daysLabel`, `formatDate`) correctly delegate to `deadline-service.ts`
- React Hook Form + Zod validation matches server-side schema — correct
- Mutation callbacks invalidate correct query keys — correct
- Edit/delete only shown for `tur === 'manuel'` rows — correct per spec
- Loading, error, and empty states handled — correct

### components/dashboard/stat-cards.tsx ✅
- Simple presentational component, no logic issues
- Correct props destructuring

### components/dashboard/upcoming-deadlines.tsx ✅
- Urgency badge colors match UI spec: `bg-destructive` (<3 days), `bg-yellow-400` (3-7 days), `bg-muted` (7-14 days)
- Adli tatil badge: `bg-amber-100 text-amber-800 border border-amber-300` — correct
- Empty state text matches spec — correct
- Uses `getDaysUntil` and `isInAdliTatil` from deadline-service — correct

### components/dashboard/todays-hearings.tsx ✅
- Mahkeme truncation at 20 chars with tooltip — correct per spec
- TooltipProvider wrapping for multiple tooltips — correct
- Empty state text matches spec — correct

### app/(dashboard)/page.tsx ✅
- Uses `trpc.dashboard.dashboardStats.queryOptions()` — correct pattern
- Skeleton loading state with correct dimensions — correct
- Error state with user-friendly message — correct
- No forms or mutations (read-only dashboard) — correct per D-02 requirement
- Separator between sections — correct

---

_Reviewed: 2026-04-13_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
