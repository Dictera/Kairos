---
phase: 03-stk-mahkeme-process-tracking
plan: 02
subsystem: ui
tags: [react-hook-form, trpc, shadcn, stepper, process-tracking, stk]

# Dependency graph
requires:
  - phase: 03-stk-mahkeme-process-tracking
    provides: Plan 01 - STK/Mahkeme stage enums, SurecDetay types, tRPC procedures (stkIleriAl, updateStkData, initMahkemeSurec)
provides:
  - SurecStepper component (reusable for STK and Mahkeme stages)
  - StkDataForm component (8-field STK data entry with date pickers)
  - YargilamaSureciTab orchestrator component
  - Integrated YargilamaSureciTab into dosya-detail-tabs replacing EmptyTabContent
affects: [03-03]

# Tech tracking
tech-stack:
  added: [react-hook-form, @hookform/resolvers, zod, date-fns]
  patterns: [stepper-pattern, date-picker-pattern, tRPC-mutation-form-pattern]

key-files:
  created:
    - components/dosya/surec-stepper.tsx
    - components/dosya/stk-data-form.tsx
    - components/dosya/yargilama-sureci-tab.tsx
  modified:
    - components/dosya/dosya-detail-tabs.tsx

key-decisions:
  - "SurecStepper is a generic component accepting any string union type for stages - reusable for STK and Mahkeme"
  - "StkDataForm uses Calendar+Popover pattern with Turkish locale (tr-TR) for date fields"
  - "All 8 STK data fields are optional - no required validation per D-06"

patterns-established:
  - "Stepper pattern: stages array + labels record + current stage + onAdvance callback + isPending state"
  - "Date picker pattern: Popover + Calendar + date-fns format with tr locale"
  - "Form mutation pattern: useMutation with queryClient.invalidateQueries and toast notifications"

requirements-completed: [SUREC-01, SUREC-02]

# Metrics
duration: 3min
completed: 2026-04-12
---

# Phase 03 Plan 02: STK Process Tracking UI Summary

**SurecStepper generic stage stepper with 9 STK stages, StkDataForm with 8 data fields and date pickers, YargilamaSureciTab orchestrator integrated into dosya detail tabs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-12T22:38:52Z
- **Completed:** 2026-04-12T22:41:43Z
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- SurecStepper: generic reusable stepper component with completed (steel blue fill), current (ring style), and future (gray) visual states
- StkDataForm: 8-field form with date pickers using shadcn Calendar+Popover pattern, Turkish locale formatting
- YargilamaSureciTab: orchestrator that shows STK section for STK files, Mahkeme activation button, and Durusma stub placeholder
- Integrated into dosya-detail-tabs replacing EmptyTabContent in yargilama-sureci TabsContent

## Task Commits

Each task was committed atomically:

1. **Task 1: SurecStepper component + StkDataForm component** - `ebc0073` (feat)
2. **Task 2: YargilamaSureciTab + integrate into dosya-detail-tabs** - `f43874d` (feat)

## Files Created/Modified

- `components/dosya/surec-stepper.tsx` - Generic SurecStepper component for STK and Mahkeme stages
- `components/dosya/stk-data-form.tsx` - STK data form with 8 fields and date pickers
- `components/dosya/yargilama-sureci-tab.tsx` - Main Yargilama Süreci tab orchestrator
- `components/dosya/dosya-detail-tabs.tsx` - Updated to use YargilamaSureciTab

## Decisions Made

- **SurecStepper generic design**: Component accepts any string union type for stages, making it reusable for both STK_ASAMALAR and MAHKEME_ASAMALAR
- **Date picker locale**: Uses date-fns with Turkish locale (tr) and displays dates in dd.MM.yyyy format
- **All fields optional**: STK data fields have no required validation per D-06, allowing independent field saving

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 (03-03) can proceed: SurecStepper and StkDataForm are ready to be used with Mahkeme data
- YargilamaSureciTab stubs for Mahkeme section and Durusma list are in place for Plan 03 to replace

---
*Phase: 03-stk-mahkeme-process-tracking*
*Completed: 2026-04-12*

## Self-Check: PASSED

- ✅ components/dosya/surec-stepper.tsx: SurecStepper export, bg-accent completed state, border-2 border-accent current state, İleri Al button, Süreç Tamamlandı label
- ✅ components/dosya/stk-data-form.tsx: StkDataForm export, surec.updateStkData mutation, Bilgiler kaydedildi toast, all 8 STK fields present, STK Veri Noktaları header, Kaydet button
- ✅ components/dosya/yargilama-sureci-tab.tsx: YargilamaSureciTab export, parseSurecDetay, STK Tahkim Süreci, Mahkeme Süreci, Duruşmalar, Mahkeme Sürecini Başlat, surec.stkIleriAl, surec.initMahkemeSurec, Aşama güncellendi toast
- ✅ components/dosya/dosya-detail-tabs.tsx: YargilamaSureciTab import, YargilamaSureciTab usage, surecDetayRaw prop, EmptyTabContent removed from yargilama-sureci tab
- ✅ TypeScript compiles without errors
- ✅ All tests pass (58 passed)
- ✅ Commit ebc0073: SurecStepper and StkDataForm
- ✅ Commit f43874d: YargilamaSureciTab and integration
