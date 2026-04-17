---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
plan: 04
subsystem: ui
tags: [ui, ayarlar, shadcn, form]

key-files:
  created:
    - components/ayarlar/avukat-form-dialog.tsx
    - components/ayarlar/sigorta-sirketi-section.tsx
    - lib/validators/ayarlar.ts
  modified:
    - components/ayarlar/ayarlar-page.tsx
    - lib/trpc/routers/ayarlar.ts

requirements-completed: [D-05, D-09]
completed: 2026-04-17
---

# Phase 14 Plan 4: Ayarlar UI — SigortaSirketiSection + AvukatFormDialog

## Accomplishments

- Created `AvukatFormDialog`: 5 RHF fields, zodResolver(avukatSchema), auto-link on create
- Created `SigortaSirketiSection`: 4-col table, expand-row accordion, nested avukat sublist, dialogs for sirketi (6 fields) and avukat, AlertDialogs for delete/unlink
- Replaced generic `AyarlarCrudSection` for sigorta with `SigortaSirketiSection` in `ayarlar-page.tsx`
- Extracted Zod schemas to `lib/validators/ayarlar.ts` to fix next/headers client bundle error

## Deviations
- Schemas moved to `lib/validators/ayarlar.ts` (not in router) to avoid server-only next/headers import in client components

## Self-Check: PASSED (awaiting human verification — checkpoint)
