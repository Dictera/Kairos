---
phase: 20-eski-sistemler-temizligi
plan: 04
subsystem: legacy-retirement
tags:
  - drizzle
  - migration
  - npm
  - cleanup
requires:
  - TEMIZ-05
  - TEMIZ-06
  - TEMIZ-04
provides: []
affects: []
tech-stack:
  added: []
  patterns:
    - DROP TABLE IF EXISTS migration pattern for legacy table cleanup
    - Sequential migration numbering (000X_pattern)
key-files:
  created:
    - drizzle/0006_drop_legacy_dilekce_tables.sql
  modified:
    - package.json
    - package-lock.json
key-decisions:
  - Used sequential migration number 0006 (following existing 0000-0005 pattern)
  - Used DROP TABLE IF EXISTS for safe idempotent migrations
patterns-established:
  - "DROP TABLE IF EXISTS for safe table removal without errors if table doesn't exist"
requirements-completed:
  - TEMIZ-05
  - TEMIZ-06
  - TEMIZ-04
duration: 3 min
completed: 2026-04-22T14:20:58Z
start_time: 2026-04-22T14:17:48Z
---

# Phase 20 Plan 04: Final Cleanup - Migration, File Deletion, npm Uninstall Summary

**Drizzle migration created to DROP legacy tables, uploads/odt-templates folder deleted, and legacy npm packages uninstalled — build passes cleanly.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-22T14:17:48Z
- **Completed:** 2026-04-22T14:20:58Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 2 modified, 1 deleted)

## Accomplishments
- Created Drizzle migration `drizzle/0006_drop_legacy_dilekce_tables.sql` with DROP TABLE IF EXISTS for both legacy tables
- Deleted `uploads/odt-templates` folder permanently
- Uninstalled 63 packages: jspdf, adm-zip, @xmldom/xmldom, @types/adm-zip, and 4 Tiptap extension packages
- `npm run build` passes with exit 0 (1 expected warning about archive.ts dynamic path, not an error)
- Import scan confirms no stale references to removed packages in lib/

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Drizzle migration and delete uploads/odt-templates folder** - `7c6e030` (feat)
2. **Task 2: Uninstall unused npm packages** - `122c608` (feat)
3. **Task 3: Final build validation and stale import scan** - included in `122c608` commit

## Files Created/Modified
- `drizzle/0006_drop_legacy_dilekce_tables.sql` - DROP TABLE IF EXISTS migration for dilekce_sablonu and dilekce_odt_sablonu
- `package.json` - 8 packages removed (jspdf, adm-zip, @xmldom/xmldom, @types/adm-zip, 4x @tiptap/extension-*)
- `package-lock.json` - updated after npm uninstall
- `uploads/odt-templates/` - deleted (was a folder with .odt template files)

## Decisions Made

None - followed plan exactly as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Migration file exists with correct content: `grep 'DROP TABLE IF EXISTS' drizzle/0006_drop_legacy_dilekce_tables.sql` → OK
- uploads/odt-templates folder deleted: `Test-Path` → folder no longer exists
- No stale imports in lib/: All grep searches for jspdf, adm-zip, @xmldom/xmldom, pdf-generator, odt-to-pdf return "CLEAN"
- `npm run build` exits 0 with successful compilation (21 routes generated)
- `npm test` shows 289 tests passing, 2 failing (pre-existing failures in 16-sablon-router.test.ts and 16-sidecar-extract-vars.test.ts related to variable naming conventions — not related to this cleanup)

## Issues Encountered

None - all tasks completed as specified in the plan.

## Next Phase Readiness

Phase 20 Plans 01-04 complete. All legacy Tiptap + ODT cleanup tasks finished:
- Router unregistration (Plan 01)
- Route deletion + sidebar nav update (Plan 02)
- Retirement modal + tRPC API (Plan 03)
- Migration, file deletion, npm uninstall (Plan 04)

Ready for any verification or wrap-up activities.

---
*Phase: 20-eski-sistemler-temizligi*
*Completed: 2026-04-22*