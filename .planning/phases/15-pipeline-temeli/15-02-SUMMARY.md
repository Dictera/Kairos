---
phase: 15-pipeline-temeli
plan: 02
subsystem: ui
tags: [trpc, react-query, health-check, libreoffice, pipeline-ui]

# Dependency graph
requires:
  - phase: 15-pipeline-temeli
    plan: 01
    provides: tRPC pipeline router with healthCheck and status procedures
provides:
  - HealthBanner component (amber warning on all dashboard pages when Python/LibreOffice missing)
  - PipelineStatus card (Ayarlar page showing Python/LibreOffice path, version, accessibility)
  - Layout-level integration of health banner
  - Settings page integration of pipeline status card
affects:
  - phase-16 (extract-vars handler implementation will use pipeline infrastructure)
  - phase-17 (render handler + PDF production)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useTRPC() + useQuery for client-side tRPC consumption
    - Conditional rendering based on health check accessibility booleans

key-files:
  created:
    - components/pipeline/health-banner.tsx — amber warning banner with dismiss
    - components/pipeline/pipeline-status.tsx — Card with Python/LibreOffice status rows
  modified:
    - app/(dashboard)/layout.tsx — HealthBanner integrated above {children}
    - components/ayarlar/ayarlar-page.tsx — PipelineStatus added as last section

key-decisions:
  - "HealthBanner only renders when python or libreoffice is not accessible (both checked client-side)"
  - "Banner dismissed for session only via useState - reappears on page refresh"
  - "PipelineStatus shows both healthCheck (accessible/version) and status (path) data"

patterns-established:
  - "Client components using useTRPC() hook for tRPC query consumption"
  - "Conditional rendering pattern for accessibility-dependent UI"

requirements-completed: [PIPE-03, PIPE-04]

# Metrics
duration: 8min
completed: 2026-04-20
---

# Phase 15 Plan 02: Pipeline UI Components Summary

**HealthBanner amber warning and PipelineStatus card integrated with tRPC pipeline router from Plan 01**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-20T19:53:01Z
- **Completed:** 2026-04-20T20:01:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- HealthBanner component: amber warning shown on all dashboard pages when Python or LibreOffice is missing, with dismiss button for session
- PipelineStatus card: shows Python/LibreOffice path, version, and green/red accessibility Badge on Ayarlar page
- HealthBanner integrated into dashboard layout above {children}
- PipelineStatus integrated as last section in ayarlar-page.tsx after Şifre Değiştirme
- Both components use useTRPC() with useQuery for tRPC pipeline router consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Health Banner + Pipeline Status Components** - `7962256` (feat)
2. **Task 2: Integrate Banner into Layout + Status Card into Ayarlar Page** - `6edb489` (feat)

**Plan metadata:** `e21d8c3` (docs: mark Phase 15 Plan 01 complete)

## Files Created/Modified

- `components/pipeline/health-banner.tsx` — amber warning banner with AlertTriangle icon, Turkish messages, dismiss button
- `components/pipeline/pipeline-status.tsx` — Card with Python/LibreOffice rows showing path, version, Badge indicators
- `app/(dashboard)/layout.tsx` — HealthBanner imported and placed above {children}
- `components/ayarlar/ayarlar-page.tsx` — PipelineStatus imported and placed after Şifre Değiştirme card

## Decisions Made

None - plan executed exactly as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - no issues during execution.

## User Setup Required

None - no external service configuration required for UI components. The components consume the tRPC pipeline router from Plan 01 and will display appropriate warnings based on whether Python and LibreOffice are accessible on the system.

## Next Phase Readiness

- UI components (HealthBanner, PipelineStatus) are complete and integrated
- tRPC pipeline router is registered and accessible
- Phase 16 (extract-vars handler implementation) can proceed with the UI layer already in place

---

*Phase: 15-pipeline-temeli*
*Completed: 2026-04-20*