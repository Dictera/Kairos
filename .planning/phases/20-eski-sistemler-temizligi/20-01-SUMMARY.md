---
phase: 20-eski-sistemler-temizligi
plan: 01
subsystem: legacy-retirement
tags:
  - pdfmake
  - redirect
  - navigation
  - jspdf-migration
requires:
  - TEMIZ-07
provides: []
affects: []
tech-stack:
  added:
    - pdfmake/js/Printer (server-side PdfPrinter via require workaround)
  patterns:
    - Server-side PDF generation via pdfmake's PdfPrinter class
    - Next.js static redirects for legacy URL soft-landing
    - Navigation label/icon swap for content replacement
key-files:
  created:
    - app/api/raporlar/finans/pdf/route.ts (migrated to pdfmake)
    - app/api/raporlar/portfy/pdf/route.ts (migrated to pdfmake)
    - next.config.ts (redirects added)
    - components/app-sidebar.tsx (nav updated)
  modified:
    - lib/validators/sablon.ts (added fileSize field for pre-existing bug)
key-decisions:
  - Used `require('pdfmake/js/Printer').default` instead of `import PdfPrinter from 'pdfmake'` because @types/pdfmake only exports the browser API (createPdf) and not the PdfPrinter class. The js/ entry point exports the server-side Printer class directly.
  - Kept FileEdit import in sidebar (unused after nav change) to avoid lint errors — will be removed in Plan 02 when full dilekçe folder is deleted.
  - Made fileSize in sablonCreateSchema optional to match actual usage in sablon-yonetimi-section.tsx (pre-existing bug discovered during build verification).
requirements-completed:
  - TEMIZ-07
duration: ~27 min
completed: 2026-04-22T13:54:56Z
start_time: 2026-04-22T13:28:10Z
---

# Phase 20 Plan 01: Migrate Report PDFs + Redirects + Sidebar Summary

## What Was Done

Migrated two report PDF routes from jspdf to pdfmake, added Next.js redirect rules for legacy `/dilekce` URLs, and updated the sidebar navigation to replace "Dilekçeler" with "Şablon Yönetimi".

## Task: Migrate report routes to pdfmake

**Status:** COMPLETE ✓

Migrated both `app/api/raporlar/finans/pdf/route.ts` and `app/api/raporlar/portfy/pdf/route.ts` from the legacy `generatePdfBuffer` import (jspdf-based) to inline pdfmake generation using `PdfPrinter`.

**Implementation notes:**
- `@types/pdfmake` only exports the browser API (`createPdf`), not the `PdfPrinter` class
- Used `require('pdfmake/js/Printer').default` to access the server-side `PdfPrinter` class directly
- Kept identical `docDefinition` structure and response format — PDF output unchanged
- Both routes use Helvetica fonts (built into PDFKit) rather than Roboto TTF (no external font files needed for simple text PDFs)

**Verification:**
- `grep -n "pdf-generator" app/api/raporlar/finans/pdf/route.ts app/api/raporlar/portfy/pdf/route.ts` → zero matches ✓
- `grep -n "pdfmake" app/api/raporlar/finans/pdf/route.ts app/api/raporlar/portfy/pdf/route.ts` → matches found ✓
- `npm run build` → passes with zero errors ✓

## Task: Add Next.js redirects and update sidebar nav

**Status:** COMPLETE ✓

**next.config.ts changes:**
- Added `redirects` async function with two rules:
  - `/dilekce` → `/ayarlar` (permanent: false)
  - `/dilekce/:path*` → `/ayarlar` (permanent: false)

**app-sidebar.tsx changes:**
- Replaced `{ label: 'Dilekçeler', href: '/dilekce', icon: FileEdit }` with `{ label: 'Şablon Yönetimi', href: '/ayarlar', icon: Settings }`
- Kept `FileEdit` in imports (unused after nav change) to avoid lint errors — will be removed in Plan 02 cleanup

**Verification:**
- `grep -n "Şablon Yönetimi" components/app-sidebar.tsx` → match found ✓
- `grep -n "Dilekçeler" components/app-sidebar.tsx` → no matches in nav items ✓
- `npm run build` → passes with zero errors ✓

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `fileSize` field in `sablonCreateSchema`**
- **Found during:** Build verification (unrelated file error surfaced during execution)
- **Issue:** `sablon-yonetimi-section.tsx` calls `createSablon.mutateAsync` with `{ ..., fileSize }` but `sablonCreateSchema` didn't include `fileSize` in its accepted fields
- **Fix:** Added `fileSize: z.number().int().optional()` to `sablonCreateSchema` in `lib/validators/sablon.ts`
- **Files modified:** `lib/validators/sablon.ts`
- **Verification:** `npm run build` passes
- **Commit:** 3e62d43

**2. [Rule 1 - Bug] pdfmake `@types/pdfmake` missing `PdfPrinter` class**
- **Found during:** Task 1 (type check failure after migration)
- **Issue:** `@types/pdfmake` only exports browser API (`createPdf`) — no `PdfPrinter` class, no `TDocumentDefinitions` type export from `pdfmake/build/pdfmake`
- **Fix:** Used `require('pdfmake/js/Printer').default` to access the server-side `PdfPrinter` class directly, and defined inline `DocDefinition` interface
- **Files modified:** `app/api/raporlar/finans/pdf/route.ts`, `app/api/raporlar/portfy/pdf/route.ts`
- **Verification:** `npm run build` passes
- **Commit:** 3e62d43

## Threat Flags

None — this plan only modifies existing routes and navigation, no new attack surface introduced.

## Build Output

```
✓ Compiled successfully in 22.7s
✓ Running TypeScript ... Finished in 16.4s
✓ Generating static pages (24/24)
```

All routes build correctly including the migrated PDF routes.

## Commit

- **3e62d43** `feat(20-01): migrate report PDF routes to pdfmake + add /dilekce redirects + update sidebar nav`

## Next

Ready for **Plan 20-02** — full legacy dilekçe system deletion (router unregistration, route deletion, service file deletion, npm uninstall).