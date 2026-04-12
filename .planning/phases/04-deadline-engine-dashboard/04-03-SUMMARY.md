---
phase: 04-deadline-engine-dashboard
plan: 03
subsystem: ui
tags: [trpc, dashboard, deadline, shadcn, tailwind]

# Dependency graph
requires:
  - phase: 04-deadline-engine-dashboard
    provides: "tRPC dashboard router with dashboardStats query (Plan 02); sure table with deadline-service.ts (Plan 01)"
provides:
  - "Full dashboard page with 3 stat cards, Yaklaşan Süreler widget, Bugünkü Duruşmalar widget"
  - "Urgency badge color coding (red/yellow/grey) for deadlines 0-14 days out"
  - "Adli tatil badge for deadlines between July 20-August 31"
  - "Skeleton loading state and error state"
affects: [04-deadline-engine-dashboard/04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard query pattern: useTRPC + useQuery + queryOptions()"
    - "Urgency badge: bg-destructive (<3 days), bg-yellow-400 (3-7 days), bg-muted (7-14 days)"
    - "Adli tatil badge: bg-amber-100 text-amber-800 border border-amber-300"
    - "Skeleton loading: 3 card shapes + 2 list shapes during query resolve"

key-files:
  created:
    - "components/dashboard/stat-cards.tsx - 3-card grid stat display"
    - "components/dashboard/upcoming-deadlines.tsx - Deadline list with urgency badges and adli tatil indicator"
    - "components/dashboard/todays-hearings.tsx - Today's hearings list with mahkeme truncation"
  modified:
    - "app/(dashboard)/page.tsx - Full dashboard implementation replacing stub"

key-decisions:
  - "Used className-based badge colors (not variant) for precise urgency color control per UI-SPEC"
  - "Tooltip wraps urgency badge to show formatted date (DD.MM.YYYY)"
  - "Mahkeme name truncated at 20 chars with tooltip showing full name"
  - "Dashboard is read-only — no forms or mutations per D-02"

patterns-established:
  - "Urgency badge colors: bg-destructive (<3d), bg-yellow-400 (3-7d), bg-muted (7-14d)"
  - "Adli tatil: bg-amber-100 text-amber-800 border border-amber-300 with inline warning text"
  - "Skeleton loading: card skeletons matching actual layout dimensions"

requirements-completed: [DASH-01, DASH-02, SURE-05]

# Metrics
duration: 5min
completed: 2026-04-13
---

# Phase 4 Plan 3: Dashboard Page + Widget Components Summary

**Dashboard page with 3 stat cards, Yaklaşan Süreler urgency badges, and Bugünkü Duruşmalar widget — all powered by tRPC dashboardStats query**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-13T00:20:00Z
- **Completed:** 2026-04-13T00:25:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `StatCards` component: 3-card grid showing Toplam Dosya, Aktif Dosya, Bu Ay Açılan counts
- `UpcomingDeadlines` component: deadline list with urgency color badges, adli tatil amber badge, and empty state
- `TodaysHearings` component: today's hearings with time, mahkeme truncation at 20 chars, and empty state
- `app/(dashboard)/page.tsx` fully replaced: tRPC query with Skeleton loading and error states
- All 80 tests pass (30 todo tests skipped as expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard sub-components (StatCards, UpcomingDeadlines, TodaysHearings)** - `aef781b` (feat)
2. **Task 2: Replace dashboard stub with full page using tRPC query and Skeleton loading** - `6de944b` (feat)

**Plan metadata:** `ef66f7f` (docs: complete plan 02)

## Files Created/Modified

- `components/dashboard/stat-cards.tsx` - 3-card grid (Toplam, Aktif, Bu Ay Açılan)
- `components/dashboard/upcoming-deadlines.tsx` - Urgency badges (red/yellow/grey), adli tatil badge, empty state, tooltip with date
- `components/dashboard/todays-hearings.tsx` - Time + mahkeme layout, 20-char truncation with tooltip, empty state
- `app/(dashboard)/page.tsx` - Full dashboard: useTRPC query, Skeleton loading, error card, 3-section layout

## Decisions Made

- Used className-based badge colors (not shadcn variant) for precise urgency color control per UI-SPEC §Urgency Badge Colors
- Tooltip wraps urgency badge to show formatted deadline date (DD.MM.YYYY) on hover
- Mahkeme name truncated at 20 characters with tooltip showing full name
- Dashboard is read-only — no forms or mutations (D-02 constraint from CONTEXT.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-04 ready: Final integration testing and polish
- Dashboard page complete and functional at http://localhost:3000
- Stat cards show real counts from database
- Deadline rows link to case detail pages
- Hearings rows link to case detail pages

---

*Phase: 04-deadline-engine-dashboard*
*Completed: 2026-04-13*

## CHECKPOINT REACHED

**Type:** human-verify
**Plan:** 04-03
**Progress:** 2/3 tasks complete

### Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create dashboard sub-components | aef781b | stat-cards.tsx, upcoming-deadlines.tsx, todays-hearings.tsx |
| 2 | Replace dashboard stub with full page | 6de944b | app/(dashboard)/page.tsx |

### Current Task

**Task 3:** Human verification checkpoint
**Status:** Awaiting user verification
**Blocked by:** User must verify all 15 checklist items

### Checkpoint Details

**What was built:**
Full Phase 4 dashboard and deadline engine:
- Dashboard page with 3 stat cards (Toplam Dosya, Aktif Dosya, Bu Ay Açılan)
- Yaklaşan Süreler widget (0-14 days, red/yellow/grey urgency badges, adli tatil badge)
- Bugünkü Duruşmalar widget with mahkeme links
- Auto-calculated deadlines (STK itiraz 10 days, istinaf 14 days, cevap dilekçesi 14 days) triggered when dates saved in Yargılama Süreci tab
- Manual deadline entry (Süreler subsection in Yargılama Süreci tab)

### How to Verify

1. Start dev server: `npm run dev`
2. Log in and navigate to `http://localhost:3000` (dashboard)
3. Verify 3 stat cards appear with actual counts from the database
4. Verify "Yaklaşan Süreler" section appears (may be empty if no upcoming deadlines)
5. Verify "Bugünkü Duruşmalar" section appears (may be empty if none today)
6. Navigate to a case detail page → Yargılama Süreci tab
7. Verify "Süreler" subsection appears below existing content with "Manuel Süre Ekle" button
8. Click "Manuel Süre Ekle" → fill in a süre name and a date within 14 days → save → verify "Süre kaydedildi" toast appears
9. Navigate back to dashboard → verify the new manual deadline appears in Yaklaşan Süreler
10. Verify the deadline row shows correct urgency badge color based on days remaining
11. If the deadline date falls between July 20 and August 31: verify amber "⚠ Adli Tatil — manuel kontrol" badge appears
12. For an STK case: enter a tebligat tarihi in the STK data form → save → navigate to dashboard → verify a "STK Karara İtiraz Süresi" deadline appears automatically (tebligat date + 10 days)
13. For a mahkeme case: enter karar_tarihi → verify "İstinaf Başvurusu Süresi" (+ 14 days) appears on dashboard; enter tebligat_tarihi → verify "Cevap Dilekçesi Süresi" (+ 14 days) appears
14. Verify all deadline rows link to the correct case detail page
15. Verify Skeleton loading state appears briefly on first dashboard load (or on hard refresh)

### Awaiting

**Your action:** Type "approved" if all 15 checks pass, or describe any issues found.

## Self-Check: PASSED

All claims verified:
- components/dashboard/stat-cards.tsx: FOUND (StatCards function with 3-card grid)
- components/dashboard/upcoming-deadlines.tsx: FOUND (UpcomingDeadlines with urgency badges, adli tatil badge, empty state)
- components/dashboard/todays-hearings.tsx: FOUND (TodaysHearings with time + mahkeme layout, truncation, empty state)
- app/(dashboard)/page.tsx: FOUND ('use client', useTRPC query, Skeleton loading, error state, StatCards + UpcomingDeadlines + TodaysHearings)
- Commit aef781b (Task 1): FOUND
- Commit 6de944b (Task 2): FOUND
- TypeScript (npx tsc --noEmit): PASSED
- Vitest (80 tests): PASSED
