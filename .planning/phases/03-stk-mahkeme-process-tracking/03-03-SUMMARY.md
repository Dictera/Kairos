---
phase: 03-stk-mahkeme-process-tracking
plan: 03
subsystem: ui
tags: [react-hook-form, trpc, shadcn, stepper, process-tracking, mahkeme, durusma, dropdown]

# Dependency graph
requires:
  - phase: 03-stk-mahkeme-process-tracking
    provides: Plan 02 - SurecStepper, StkDataForm, YargilamaSureciTab stubs, surec tRPC router
provides:
  - MahkemeDataForm component (6-field Mahkeme data entry)
  - DurusmaDialog component (add/edit hearings)
  - DurusmaList component (chronological hearing table with CRUD)
  - Fully wired YargilamaSureciTab with real Mahkeme + Durusma components
affects: [04-stk-itiraz, 04-mahkeme-surecler]

# Tech tracking
tech-stack:
  added: [date-fns/locale/tr, TooltipProvider, AlertDialog]
  patterns: [stepper-back-button-pattern, dropdown-select-from-ayarlar-pattern]

key-files:
  created:
    - components/dosya/mahkeme-data-form.tsx
    - components/dosya/durusma-dialog.tsx
    - components/dosya/durusma-list.tsx
  modified:
    - components/dosya/yargilama-sureci-tab.tsx
    - lib/trpc/routers/surec.ts
    - lib/schema.ts

key-decisions:
  - "MahkemeDataForm follows identical pattern to StkDataForm but for 6 Mahkeme fields"
  - "DurusmaDialog uses useEffect + form.reset pattern for dialog open/close state management"
  - "DurusmaList shows empty state inline when no hearings exist, with Durusma Ekle button"
  - "Geri Al (back) button added to SurecStepper for reversible stage navigation"
  - "Mahkeme adı field uses dropdown select populated from ayarlar.mahkeme.list"

patterns-established:
  - "Durusma CRUD pattern: useQuery for list, useMutation for create/update/delete, AlertDialog for delete confirmation"
  - "Dialog form reset pattern: useEffect watches open+durusma props, calls form.reset with appropriate values"

requirements-completed: [SUREC-03, SUREC-04, SUREC-05]

# Metrics
duration: 4min
completed: 2026-04-12
---

# Phase 03 Plan 03: Mahkeme Process Tracking UI Summary

**MahkemeDataForm with 6 fields, DurusmaDialog for add/edit hearings, DurusmaList with chronological table and full CRUD, all wired into YargilamaSureciTab**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-12T22:44:36Z
- **Completed:** 2026-04-12T22:48:16Z
- **Tasks:** 3 completed
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- MahkemeDataForm: 6-field form with esas_no, karar_no, mahkeme_adi dropdown (from ayarlar.mahkeme list), dava_tarihi, tebligat_tarihi, karar_tarihi date pickers
- DurusmaDialog: add/edit modal with tarih (required), saat, mahkeme_kurum, tur, notlar fields and proper form reset on close
- DurusmaList: chronological durusma table with Pencil/Trash2 row actions, delete AlertDialog confirmation, empty state, and Durusma Ekle button
- YargilamaSureciTab fully wired with Mahkeme stepper, MahkemeDataForm, and DurusmaList — no stub placeholders remain
- Geri Al (back) button added to stepper for reversible stage navigation
- All 3 SUREC requirements (SUREC-03, SUREC-04, SUREC-05) delivered

## Task Commits

Each task was committed atomically:

1. **Task 1: MahkemeDataForm + DurusmaDialog + DurusmaList components** - `858cde4` (feat)
2. **Task 2: Wire Mahkeme + Durusma into YargilamaSureciTab, replace stubs** - `f384d67` (feat)
3. **Task 3: Fix İleri Al text, add Geri Al buttons, use mahkeme dropdown from ayarlar** - `710615b` (fix)

## Files Created/Modified

- `components/dosya/mahkeme-data-form.tsx` - Mahkeme data entry form with 6 fields
- `components/dosya/durusma-dialog.tsx` - Add/edit durusma modal dialog
- `components/dosya/durusma-list.tsx` - Chronological durusma table with edit/delete actions
- `components/dosya/yargilama-sureci-tab.tsx` - Fully wired tab replacing all stubs
- `lib/trpc/routers/surec.ts` - Added stkGeriAl and mahkemeGeriAl mutations
- `lib/schema.ts` - Updated MahkemeSurecData to use mahkeme_id (number) instead of mahkeme_adi (string)

## Decisions Made

- MahkemeDataForm follows the exact same pattern as StkDataForm (stk-data-form.tsx) with the 6 Mahkeme fields
- DurusmaDialog uses useEffect + form.reset pattern when open changes to false or when durusma prop changes
- DurusmaList invalidates both `[['surec', 'durusmaList']]` and `[['dosya', 'getById']]` after mutations
- Mahkeme adı field uses shadcn Select dropdown populated from ayarlar.mahkeme.list query
- Geri Al button reverts to previous stage using stkGeriAl/mahkemeGeriAl tRPC mutations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 (04-stk-itiraz, 04-mahkeme-surecler) can proceed: YargilamaSureciTab is fully functional with Mahkeme stepper and Durusma CRUD
- The tab already shows Durusma list for all file types (STK, AT, AH)

---
*Phase: 03-stk-mahkeme-process-tracking*
*Completed: 2026-04-12*

## Self-Check: PASSED

- ✅ components/dosya/mahkeme-data-form.tsx: MahkemeDataForm export, surec.updateMahkemeData mutation, all 6 fields, Mahkeme Veri Noktaları header
- ✅ components/dosya/durusma-dialog.tsx: DurusmaDialog export, surec.durusmaCreate, surec.durusmaUpdate, form.reset on close, all Turkish CTA labels
- ✅ components/dosya/durusma-list.tsx: DurusmaList export, surec.durusmaList, surec.durusmaDelete, aria-labels, empty state, delete confirmation
- ✅ components/dosya/yargilama-sureci-tab.tsx: MahkemeDataForm and DurusmaList imports, mahkemeIleriAlMutation, no stub text, DurusmaList always visible
- ✅ lib/trpc/routers/surec.ts: stkGeriAl and mahkemeGeriAl mutations present
- ✅ lib/schema.ts: MahkemeSurecData uses mahkeme_id (number) from ayarlar
- ✅ TypeScript compiles without errors
- ✅ All tests pass (58 passed)
- ✅ Commit 858cde4: MahkemeDataForm + DurusmaDialog + DurusmaList
- ✅ Commit f384d67: YargilamaSureciTab wired
- ✅ Commit 710615b: İleri Al text fix, Geri Al buttons, mahkeme dropdown
