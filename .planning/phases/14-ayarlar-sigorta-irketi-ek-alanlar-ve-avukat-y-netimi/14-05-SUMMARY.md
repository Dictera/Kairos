---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
plan: 05
subsystem: ui
tags: [ui, dosya, karsitaraf, cascading-dropdown]

key-files:
  modified:
    - components/dosya/karsitaraflar-tab.tsx

requirements-completed: [D-10, D-11, D-12]
completed: 2026-04-17
---

# Phase 14 Plan 5: Cascading Avukat Dropdown in Karşıtaraflar Tab

## Accomplishments

- Added `avukat: { id, ad, tbb_sicil_no } | null` to `TarafRow` interface
- Added `selectedSirketId = form.watch('sigorta_sirketi_id')` watcher
- Added `bySirket` query with `enabled: !!selectedSirketId` guard
- Added `useEffect` resetting `avukat_id` to null on sigorta şirketi change (Pitfall 5 mitigation)
- Added avukat FormField Select (disabled when no sirketi, placeholder "Önce sigorta şirketi seçin")
- Added "Karşı Taraf Avukatı" InfoRow in view mode fed from `taraf.avukat.ad`
- `karsitaraf_vekil` was already absent from the file (cleaned in Plan 01)

## Self-Check: PASSED
- `npx tsc --noEmit` passes (0 errors)
- All acceptance criteria satisfied
