---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
plan: 01
subsystem: database
tags: [schema, drizzle, database, avukat, sigorta-sirketi]

# Dependency graph
requires:
  - phase: 13-tab-cleanup-ui-ux
    provides: "Cleaned up tabs, fixed UI bugs"
provides:
  - Extended sigortaSirketi table with 5 new fields (mersis_no, vergi_no, bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail)
  - New avukat table with 7 fields
  - New avukat_sigorta_sirketi join table for many-to-many relationships
  - taraf.avukat_id FK replacing karsitaraf_vekil
  - Complete Drizzle relations graph for query.with()
affects: [14-02-migration-generation, 14-03-avukat-api-routes, 14-04-avukat-ui, 14-05-sigorta-sirketi-ui]

# Tech tracking
tech-stack:
  added: [drizzle-orm, sqlite tables, foreign keys]
  patterns: [join table with composite index, FK cascade, onDelete set null]

key-files:
  created: []
  modified:
    - lib/schema.ts (extended sigortaSirketi, added avukat + avukatSigortaSirketi tables, updated relations)
    - components/dosya/karsitaraflar-tab.tsx (updated TarafRow type, editSchema)
    - lib/trpc/routers/dosya.ts (updated tarafSchema)

key-decisions:
  - "Used avukat_id FK instead of free-text karsitaraf_vekil for stronger type safety"
  - "vergi_no uses notNull+default('') to protect existing rows from NOT NULL violation"
  - "avukat deletion uses onDelete:set null to preserve taraf records"

patterns-established:
  - "Join table pattern: composite index for uniqueness + cascade delete"
  - "FK replacement: drop free-text column, add proper FK relationship"

requirements-completed: [D-01, D-04, D-06, D-08, D-12]

# Metrics
duration: 8min
completed: 2026-04-17T02:00:00Z
---

# Phase 14 Plan 1: Schema Extension Summary

**Extended sigortaSirketi with 5 new fields, created avukat + avukat_sigorta_sirketi join tables, added taraf.avukat_id FK**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-17T01:52:00Z
- **Completed:** 2026-04-17T02:00:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Extended sigortaSirketi table with 5 new fields: mersis_no, vergi_no (notNull+default ''), bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail
- Created avukat table with full audit timestamps (created_at, updated_at)
- Created avukat_sigorta_sirketi join table with cascade deletes and 3 indexes
- Replaced taraf.karsitaraf_vekil with proper taraf.avukat_id FK (onDelete: set null)
- Updated all relation declarations: avukatRelations, avukatSigortaSirketiRelations, extended sigortaSirketiRelations + tarafRelations
- Fixed TypeScript errors in karsitaraflar-tab.tsx and tarafSchema to use avukat_id

## Task Commits

1. **Task 1: Extend sigortaSirketi with 5 fields + create avukat + avukat_sigorta_sirketi tables** - `bd34e03` (feat)

**Plan metadata:** (to be committed after summary)

## Files Created/Modified
- `lib/schema.ts` - Extended sigortaSirketi (7 columns), added avukat + avukat_sigorta_sirketi tables, updated all relations
- `components/dosya/karsitaraflar-tab.tsx` - Updated TarafRow type (avukat_id, removed karsitaraf_vekil), updated editSchema
- `lib/trpc/routers/dosya.ts` - Updated tarafSchema (avukat_id, removed karsitaraf_vekil)

## Decisions Made
- Used `avukat_id` FK instead of free-text `karsitaraf_vekil` for type safety and referential integrity
- `vergi_no` uses `notNull().default('')` to prevent NOT NULL violations on existing rows
- `avukat` deletion uses `onDelete: set null` so taraf records survive avukat deletion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed TypeScript errors after schema changes**
- **Found during:** Task 1 (verification)
- **Issue:** Removing karsitaraf_vekil from schema broke TarafRow type and tarafSchema — type errors in karsitaraflar-tab.tsx
- **Fix:** Updated TarafRow type to use avukat_id instead of karsitaraf_vekil, updated editSchema, defaultValues, onSubmit, and isEmpty check
- **Files modified:** components/dosya/karsitaraflar-tab.tsx, lib/trpc/routers/dosya.ts
- **Verification:** npx tsc --noEmit passes (1 unrelated test error in 06-belge-finans.test.ts)
- **Committed in:** bd34e03 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- None

## Next Phase Readiness
- Schema is ready for Plan 14-02 (migration generation via `npm run db:generate`)
- tarafSchema now accepts avukat_id — API layer ready for avukat integration
- TarafRow type updated — UI components can access avukat_id for display

---
*Phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi*
*Completed: 2026-04-17*
