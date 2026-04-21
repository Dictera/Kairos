---
phase: 18-arsiv-ve-belge-entegrasyonu
plan: 03
subsystem: archive
autonomous: true
depends_on:
  - 18-01
  - 18-02
---

# Phase 18 Plan 03: Wire Archive into PDF Pipeline + Template belge_turu UI

One-liner: Integrated archive module into pdfRouter.generate so PDFs are permanently stored and catalogued, and added belge_turu dropdown to template upload/overwrite dialogs.

## What Changed

### Task 1: Integrate archive logic into pdfRouter.generate
- **File:** `lib/trpc/routers/pdf.ts`
- Imported `archivePdfAndCreateBelge` and `generateSlugs` from `@/lib/docx/archive`
- After successful DOCX→PDF conversion, the mutation now:
  1. Extracts `muvekkilAd`, `plaka`, and `dosyaNo` from the fetched case row
  2. Generates ASCII-safe slugs via `generateSlugs()` sidecar command
  3. Determines `belgeTuru` from `template.belge_turu` with fallback `'Diğer'`
  4. Determines `kategoriSlug` from `template.kategori.toLowerCase()`
  5. Calls `archivePdfAndCreateBelge()` to atomically move the PDF to `uploads/sablon-pdf/YYYY/AA/...`, insert a `belge` row, and log an `olay_gunlugu` entry
  6. Returns `{ success: true, belge: archivedBelge }`
- Wrapped archive call in `try/catch` that unlinks the temp PDF on failure, preventing disk accumulation
- Preserved all early validation, schema, and temp-file cleanup logic

### Task 2: Add belge_turu dropdown to template upload and overwrite UI
- **File:** `components/ayarlar/sablon-yonetimi-section.tsx`
- Imported `BELGE_KATEGORILER` from `@/lib/schema`
- Extended `sablonFormSchema` with `belge_turu: z.enum(BELGE_KATEGORILER).optional()`
- Added `belge_turu` `<Select>` FormField in the Upload Dialog (after kategori), not required
- Passed `belge_turu: values.belge_turu` to `createSablon.mutateAsync`
- Added local state `overwriteBelgeTuru` in the Overwrite Dialog, initialized from the target template's current `belge_turu`
- Passed `belge_turu: overwriteBelgeTuru` to `updateSablon.mutateAsync`
- Added optional `<Badge variant="secondary">` in the template table to display `belge_turu`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

No new threat flags. Existing mitigations:
- `belgeTuru` is sourced from `template.belge_turu` (DB), never from client input (T-18-09)
- Zod enum validation on both create and update schemas (T-18-11)

## Auth Gates

None.

## Known Stubs

None.

## Commits

- `9370ac8` feat(18-03): integrate archive logic into pdfRouter.generate
- `7d190d4` feat(18-03): add belge_turu dropdown to template upload and overwrite UI

## Self-Check: PASSED

- [x] `lib/trpc/routers/pdf.ts` modified and committed
- [x] `components/ayarlar/sablon-yonetimi-section.tsx` modified and committed
- [x] `npx tsc --noEmit -p tsconfig.json --skipLibCheck` passes with zero new errors
- [x] Commit hashes verified in git log
