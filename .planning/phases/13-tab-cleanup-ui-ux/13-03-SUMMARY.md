---
phase: 13-tab-cleanup-ui-ux
plan: 03
subsystem: ui
tags: [dosya, genel-bilgiler, stk, mahkeme, belge, tRPC, shadcn]

# Dependency graph
requires:
  - phase: 13-tab-cleanup-ui-ux
    provides: Context decisions D-05 through D-17, schema types StkSurecData/MahkemeSurecData
provides:
  - Updated genel-bilgiler-tab.tsx with hasar_dosya_no, kaza_tarihi, muvekkil_sigorta, kusur_orani fields
  - Dosya form restructured with grouped layout per D-23
  - STK/Mahkeme data forms using new field names per D-13, D-15
  - Belge categories expanded with category-based file naming
affects: [13-04, future dosya detail phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Field grouping with Separator + h3 headings per UI-SPEC
    - Kusur oranı auto-calculation (100 - karsi)
    - Category-based file naming with safe filename sanitization

key-files:
  created: []
  modified:
    - components/dosya/genel-bilgiler-tab.tsx
    - components/dosya/dosya-form.tsx
    - components/dosya/stk-data-form.tsx
    - components/dosya/mahkeme-data-form.tsx
    - components/belge/belge-upload.tsx
    - lib/trpc/routers/belge.ts
    - app/api/upload/route.ts

key-decisions:
  - "Renamed Poliçe No label to Müvekkil Poliçe No (D-05)"
  - "Kusur oranı display: only shows when > 0, auto-calculates müvekkil as 100-karşı (D-09, D-10)"
  - "Müvekkil Sigorta/Kasko Şirketi dropdown using existing sigortaSirketi list"
  - "STK data form uses free text field names from StkSurecData per D-13"
  - "Mahkeme data form uses free text inputs for mahkeme_adi fields per D-15"
  - "Category-based file naming: kategori + extension when uploading (D-17)"

patterns-established:
  - "Field grouping pattern: Separator + h3 heading for form sections"
  - "Kusur oranı display: conditional rendering with auto-calculation"
  - "Belge upload: category passed to API for category-based naming"

requirements-completed: [TAB-02]

# Metrics
duration: 15min
completed: 2026-04-14
---

# Phase 13 Plan 03: Tab Cleanup UI/UX - Summary

**Genel Bilgiler tab updated with hasar dosya no, kaza tarihi, müvekkil sigorta, kusur oranı fields. Dosya form restructured with grouped layout. STK/Mahkeme data forms use new field names. Belge categories expanded with category-based file naming.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-14T22:30:00Z
- **Completed:** 2026-04-14T22:45:00Z
- **Tasks:** 5
- **Files modified:** 7

## Accomplishments
- Genel Bilgiler tab: renamed Poliçe No → Müvekkil Poliçe No, added Hasar Dosya No, Kaza Tarihi, Müvekkil Sigorta/Kasko Şirketi, Kusur Oranları with conditional display
- Dosya form: restructured into grouped sections (Temel Bilgiler, Sigorta Bilgileri, Kaza Bilgileri, Açıklama) with DatePicker for kaza_tarihi
- Dosya router: verified as already updated with new fields in list/getById queries
- STK data form: updated to use new StkSurecData field names (ihtar_tarihi, stk_esas_no, etc.)
- Mahkeme data form: updated to use new MahkemeSurecData field names (ilk_derece_esas_no, dava_dilekcesi_tebliğ_tarihi, etc.) with free text mahkeme_adi fields
- Belge: expanded categories used, category-based file naming implemented in upload API

## Task Commits

Each task was committed atomically:

1. **Task 1: Update genel-bilgiler-tab.tsx** - `4df9146` (feat)
2. **Task 2: Update dosya-form.tsx** - `fe318d5` (feat)
3. **Task 3: Verify dosya router queries** - `6e7d4f5` (feat)
4. **Task 4: Update STK/Mahkeme data forms** - `73f59e1` (feat)

**Plan metadata:** (docs commit at end)

## Files Created/Modified
- `components/dosya/genel-bilgiler-tab.tsx` - Added hasar_dosya_no, kaza_tarihi, muvekkil_sigorta_id, kusur_orani_karsi fields; renamed Poliçe No label
- `components/dosya/dosya-form.tsx` - Added grouped sections with Separator/h3, new fields, DatePicker for kaza_tarihi, kusur oranı auto-calculation
- `components/dosya/stk-data-form.tsx` - Updated to use new StkSurecData field names (ihtar_tarihi, stk_esas_no, etc.)
- `components/dosya/mahkeme-data-form.tsx` - Updated to use new MahkemeSurecData field names (ilk_derece_esas_no, etc.), free text mahkeme_adi fields
- `components/belge/belge-upload.tsx` - Passes kategori to upload API for category-based naming
- `lib/trpc/routers/belge.ts` - Already using BELGE_KATEGORILER from schema (verified)
- `app/api/upload/route.ts` - Category-based file naming when kategori provided

## Decisions Made

- Renamed Poliçe No label to Müvekkil Poliçe No (D-05)
- Kusur oranı display: only shows when > 0, auto-calculates müvekkil as 100-karşı (D-09, D-10)
- Müvekkil Sigorta/Kasko Şirketi dropdown using existing sigortaSirketi list
- STK data form uses free text field names from StkSurecData per D-13
- Mahkeme data form uses free text inputs for mahkeme_adi fields per D-15
- Category-based file naming: kategori + extension when uploading (D-17)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all acceptance criteria met on first implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Genel Bilgiler tab ready for new fields
- Dosya form ready for new fields with grouped layout
- STK/Mahkeme forms ready with new data point fields
- Belge upload ready with category-based naming

---
*Phase: 13-tab-cleanup-ui-ux*
*Completed: 2026-04-14*
