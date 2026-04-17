---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
plan: 02
subsystem: database
tags: [migration, drizzle, database, blocking]

# Dependency graph
requires:
  - phase: 14-01
    provides: "Extended schema.ts with avukat table, sigorta_sirketi columns, taraf.avukat_id"
provides:
  - Applied migration: 5 new columns on sigorta_sirketi
  - Applied migration: avukat table created with 8 columns
  - Applied migration: avukat_sigorta_sirketi join table created
  - Applied migration: taraf.avukat_id added, karsitaraf_vekil dropped
  - Live database matches schema.ts declarations
affects: [14-03-avukat-api-routes, 14-04-avukat-ui, 14-05-sigorta-sirketi-ui]

# Tech tracking
tech-stack: [drizzle-kit, sqlite, better-sqlite3]
patterns: [ALTER TABLE ADD COLUMN, CREATE TABLE, DROP COLUMN, FK with cascade]

key-files:
  created:
    - drizzle/0002_phase14_avukat_schema.sql
    - drizzle/meta/0002_snapshot.json
  modified:
    - drizzle/meta/_journal.json (added 0002 entry)
    - data/db.sqlite (migration applied)

key-decisions:
  - "Used manual SQL migration instead of drizzle-kit generate (interactive prompt issue)"
  - "Preserved 3 existing sigorta_sirketi rows with default vergi_no=''"
  - "DROP COLUMN karsitaraf_vekil works (SQLite 3.46+ in better-sqlite3 12.8)"

requirements-completed: [D-01, D-06, D-08, D-12]

# Metrics
duration: 5min
completed: 2026-04-17T03:30:00Z
---

# Phase 14 Plan 2: Drizzle Migration Summary

**Generated and applied Phase 14 migration — 5 new sigorta_sirketi columns, avukat table, join table, taraf.avukat_id FK**

## Performance

- **Duration:** 5 min
- **Tasks:** 1
- **Files created:** 2
- **Files modified:** 2

## Accomplishments

- Created `drizzle/0002_phase14_avukat_schema.sql` with all required schema changes
- Added 5 columns to sigorta_sirketi: mersis_no, vergi_no (default ''), bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail
- Created avukat table with 8 columns (id, ad, tbb_sicil_no, iban, eposta, telefon, created_at, updated_at)
- Created avukat_sigorta_sirketi join table with 3 indexes (2 regular + 1 unique)
- Added avukat_id to taraf, dropped karsitaraf_vekil column
- Updated drizzle/meta/_journal.json with 0002 entry
- Created drizzle/meta/0002_snapshot.json for Drizzle ORM
- Applied migration to live SQLite database

## Verification Results

| Check | Status |
|-------|--------|
| sigorta_sirketi has 7 columns | ✓ |
| avukat table exists with 8 columns | ✓ |
| avukat_sigorta_sirketi has 2 columns | ✓ |
| taraf has avukat_id | ✓ |
| taraf does NOT have karsitaraf_vekil | ✓ |
| 3 existing sirketler preserved | ✓ |

## Task Commits

1. **chore(14-02): generate and apply phase 14 schema migration** - `b19e485`

## Deviations from Plan

None - migration executed exactly as specified.

## Issues Encountered

- drizzle-kit generate failed due to interactive TTY requirement
- Solution: wrote manual migration SQL file following Drizzle pattern

## Next Phase Readiness

- Database is ready for Plan 14-03 (tRPC API routes)
- Plan 03 can now run `db.select().from(avukat)` without errors

---
*Phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi*
*Completed: 2026-04-17*