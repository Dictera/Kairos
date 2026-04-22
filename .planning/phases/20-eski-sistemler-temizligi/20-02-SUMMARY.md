---
phase: 20-eski-sistemler-temizligi
plan: 02
subsystem: legacy-retirement
tags:
  - dilekce-deletion
  - odt-deletion
  - triptap-removal
requires:
  - TEMIZ-01
  - TEMIZ-02
  - TEMIZ-03
  - TEMIZ-04
provides: []
affects: []
tech-stack:
  added: []
  patterns:
    - Import removal before file deletion
    - tRPC router unregistration pattern
    - Drizzle schema table removal
key-files:
  created: []
  modified:
    - lib/trpc/routers/_app.ts (dilekceRouter + dilekceOdtRouter removed)
    - lib/schema.ts (dilekceSablonu + dilekceOdtSablonu tables removed)
  deleted:
    - lib/trpc/routers/dilekce.ts
    - lib/trpc/routers/dilekce-odt.ts
    - app/(dashboard)/dilekce/page.tsx
    - app/(dashboard)/dilekce/yeni/page.tsx
    - app/(dashboard)/dilekce/[id]/page.tsx
    - app/(dashboard)/dilekce/[id]/olustur/page.tsx
    - app/(dashboard)/dilekce/odt-yukle/page.tsx
    - app/(dashboard)/dilekce/odt/[id]/olustur/page.tsx
    - app/api/dilekce/[id]/pdf/route.ts
    - app/api/dilekce-odt/[id]/pdf/route.ts
    - lib/services/odt-to-pdf.ts
    - lib/pdf/pdf-generator.ts
    - components/dilekce/sablon-editor.tsx
    - components/dilekce/pdf-onizleme.tsx
key-decisions:
  - Cleared .next cache (stale Turbopack type references to deleted /dilekce routes caused type-check failures after file deletion)
  - Deleted entire dilekce/dilekce-odt API folders as atomic units rather than individual files (PowerShell `Remove-Item -Recurse -Force` on folder roots)
requirements-completed:
  - TEMIZ-01
  - TEMIZ-02
  - TEMIZ-03
  - TEMIZ-04
duration: ~10 min
completed: 2026-04-22T14:06:07Z
start_time: 2026-04-22T13:56:39Z
---

# Phase 20 Plan 02: Delete Legacy Tiptap/ODT Codebase Summary

## What Was Done

Deleted all legacy dilekçe (Tiptap) and ODT petition pipeline code — routers, routes, API handlers, services, components, and schema exports — in the correct dependency order.

## Task 1: Unregister routers and remove schema exports

**Status:** COMPLETE ✓

- Removed `import { dilekceRouter } from './dilekce'` and `import { dilekceOdtRouter } from './dilekce-odt'` from `lib/trpc/routers/_app.ts`
- Removed `dilekce: dilekceRouter` and `dilekceOdt: dilekceOdtRouter` keys from `appRouter` object
- Removed `dilekceSablonu` table definition and relations from `lib/schema.ts`
- Removed `dilekceOdtSablonu` table definition and relations from `lib/schema.ts`

## Task 2: Delete all legacy files

**Status:** COMPLETE ✓

- Deleted 14 files across routers, routes, services, and components
- Verified empty parent directories (all cleaned up)
- Cleared `.next` cache to remove stale Turbopack type references to deleted `/dilekce` routes

## Task 3: Final import scan and build verification

**Status:** COMPLETE ✓

- `rg "dilekceRouter|dilekceOdtRouter"` → zero matches
- `rg "dilekceSablonu|dilekceOdtSablonu"` → zero matches
- `rg "odt-to-pdf|pdf-generator"` → zero matches
- `npm run build` → passes with zero errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Stale Turbopack type cache referencing deleted routes**
- **Found during:** Task 1 build verification
- **Issue:** After removing imports and schema exports, `npm run build` failed with type errors referencing `../../../app/(dashboard)/dilekce/[id]/olustur/page.js` — a file that no longer exists on disk
- **Fix:** Cleared `.next/` cache (`Remove-Item -Recurse -Force ".next"`) before rebuilding. Next.js Turbopack maintains generated type files for all routes even after file deletion
- **Files modified:** `.next/` (cleared)
- **Verification:** `npm run build` passes cleanly
- **Commit:** 3fdbff3

## Build Output

```
✓ Compiled successfully in 18.4s
✓ Running TypeScript ... Finished in 16.3s
✓ Generating static pages (21/21)
```

## Commit

- **3fdbff3** `feat(20-02): unregister dilekce routers and delete legacy Tiptap/ODT codebase`

## Verification Checklist

| Check | Result |
|-------|--------|
| `rg "dilekceRouter\|dilekceOdtRouter" lib/` | 0 matches ✓ |
| `rg "dilekceSablonu\|dilekceOdtSablonu" lib/schema.ts` | 0 matches ✓ |
| `test -d app/\(dashboard\)/dilekce` | false ✓ |
| `test -f lib/pdf/pdf-generator.ts` | false ✓ |
| `test -f lib/services/odt-to-pdf.ts` | false ✓ |
| `npm run build` | exits 0 ✓ |

## Next

Ready for **Plan 20-03** — DB migration dropping legacy tables + npm uninstall of unused packages (jspdf, adm-zip, @xmldom/xmldom, Tiptap extensions).
