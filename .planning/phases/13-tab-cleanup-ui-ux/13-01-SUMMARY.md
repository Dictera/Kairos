---
phase: 13-tab-cleanup-ui-ux
plan: 01
subsystem: database
tags: [drizzle, trpc, sqlite, schema-migration, tdd]

requires:
  - TAB-01
  - TAB-02
  - UIUX-01

provides:
  - New dosyaNot table for notes CRUD
  - New olayGunlugu table for activity timeline
  - 4 new columns on dosya (hasar_dosya_no, kaza_tarihi, muvekkil_sigorta_id, kusur_orani_karsi)
  - IBAN column on muvekkil
  - Restructured STK stages (9 new stages) and Mahkeme stages (12 new stages)
  - Expanded BELGE_KATEGORILER (11 categories)
  - notlarRouter and olayRouter tRPC routers
  - Data migration: surec_detay reset, olayGunlugu seed

affects: [13-tab-cleanup-ui-ux]

tech-stack:
  added: []
  patterns: [drizzle-orm, tRPC CRUD, aliased-table join, schema-derived enum]

key-files:
  created:
    - lib/trpc/routers/notlar.ts
    - lib/trpc/routers/olay.ts
    - drizzle/0001_add_phase13_columns.sql
    - tests/13-tab-cleanup.test.ts
  modified:
    - lib/schema.ts
    - lib/trpc/routers/dosya.ts
    - lib/trpc/routers/muvekkil.ts
    - lib/trpc/routers/surec.ts
    - lib/trpc/routers/belge.ts
    - lib/trpc/routers/_app.ts
    - tests/03-surec.test.ts
    - tests/06-belge-finans.test.ts

key-decisions:
  - "Used aliasedTable() for second sigortaSirketi join in dosya.list — avoids ambiguous relation error"
  - "Deadline auto-calc disabled (TODO comment) — new STK/Mahkeme date fields have different names than old tebligat_tarihi-based calc"
  - "Derived belgeKategoriEnum from BELGE_KATEGORILER schema constant — single source of truth"
  - "surec_detay reset to {} — new stage structures incompatible with old field names"

requirements-completed: [TAB-01, TAB-02, UIUX-01]

duration: 11 min
completed: 2026-04-14
---

# Phase 13 Plan 01: Tab Cleanup & UI/UX — Data Foundation Summary

**New database schema with notes/timeline tables, expanded dosya fields, IBAN, restructured STK/Mahkeme stages, and expanded belge categories**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-14T22:17:52Z
- **Completed:** 2026-04-14T22:28:36Z
- **Tasks:** 5
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments
- Created `dosyaNot` table and full CRUD tRPC router for notes
- Created `olayGunlugu` table and query router for activity timeline
- Added 4 new columns to `dosya` table: `hasar_dosya_no`, `kaza_tarihi`, `muvekkil_sigorta_id`, `kusur_orani_karsi`
- Added `iban` column to `muvekkil` table with TR IBAN regex validation
- Restructured STK stages: 9 new stages (İHTAR → KESİNLEŞME) with new `StkSurecData` fields
- Restructured Mahkeme stages: 12 new stages with new `MahkemeSurecData` fields
- Expanded `BELGE_KATEGORILER` from 7 to 11 categories (added İhtarname, Bilirkişi Raporu, Tutanak, Tebliği)
- Registered `notlarRouter` and `olayRouter` in app router
- Applied Drizzle migration to SQLite database
- Migrated data: `surec_detay` reset to `{}`, initial timeline events seeded

## Task Commits

Each task was committed atomically:

1. **Task 0: TDD RED — test scaffolds** - `766b920` (test)
2. **Task 1: Schema changes** - `9cd6f05` (feat)
3. **Task 2: tRPC router updates** - `341342a` (feat)
4. **Task 3: New routers (notlar, olay)** - `97b910b` (feat)
5. **Task 4: Migration and data migration** - `c7f815f` (feat)

**Plan metadata:** (docs commit follows SUMMARY)

## Files Created/Modified

- `lib/schema.ts` — New tables (dosyaNot, olayGunlugu), new columns on dosya/muvekkil, new stage enums/types/labels, expanded BELGE_KATEGORILER
- `lib/trpc/routers/dosya.ts` — New fields in dosyaSchema, aliased join for muvekkilSigorta, muvekkilSigorta in getById
- `lib/trpc/routers/muvekkil.ts` — IBAN field added to muvekkilSchema (exported), iban in list query
- `lib/trpc/routers/surec.ts` — New stkDataSchema and mahkemeDataSchema with restructured fields; all mutations updated; deadline auto-calc disabled (TODO)
- `lib/trpc/routers/belge.ts` — belgeKategoriEnum derived from BELGE_KATEGORILER
- `lib/trpc/routers/notlar.ts` — New CRUD router for dosyaNot
- `lib/trpc/routers/olay.ts` — New query router for olayGunlugu
- `lib/trpc/routers/_app.ts` — Registered notlar and olay routers
- `drizzle/0001_add_phase13_columns.sql` — Migration SQL with dosya_not, olay_gunlugu tables, ALTER TABLE statements
- `tests/13-tab-cleanup.test.ts` — Phase 13 test scaffolds (14 tests covering all requirements)
- `tests/03-surec.test.ts` — Updated stage enum tests to new 9-stage STK and 12-stage Mahkeme
- `tests/06-belge-finans.test.ts` — Updated BELGE_KATEGORILER test to 11 categories

## Decisions Made

- **Aliased table join:** Used `aliasedTable(sigortaSirketi, 'muvekkil_sirketi')` for second FK to sigortaSirketi — avoids ambiguous relation error in Drizzle
- **Deadline auto-calc disabled:** The old `calcStkItirazSuresi`, `calcCevapDilekce`, `calcIstinafBasvurusu` functions depend on old field names (`tebligat_tarihi`, `karar_tarihi`). Since these fields no longer exist in the new structure, deadline calc is disabled with TODO comment for future re-enablement
- **surec_detay reset:** All existing `surec_detay` JSON reset to `{}` because old field names don't map to new structure (no 1:1 mapping possible)
- **Single olay event seed:** "Dosya oluşturuldu" events created from `dosya.created_at` for all existing records

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing tests expected old stage/category values**
- **Found during:** Task 4 (migration verification)
- **Issue:** `tests/03-surec.test.ts` and `tests/06-belge-finans.test.ts` tested for old STK/Mahkeme stage arrays and 7 BELGE_KATEGORILER — failing after our schema changes
- **Fix:** Updated both test files to reflect new 9-stage STK, 12-stage Mahkeme, and 11 BELGE_KATEGORILER
- **Files modified:** tests/03-surec.test.ts, tests/06-belge-finans.test.ts
- **Verification:** `npm test -- --run` passes all 137 tests
- **Committed in:** c7f815f (Task 4 commit)

**2. [Rule 3 - Blocking] `dosyaSchema` not exported — test imports failed**
- **Found during:** Task 1 verification
- **Issue:** `tests/13-tab-cleanup.test.ts` imports `dosyaSchema` from `@/lib/trpc/routers/dosya` but it was not exported
- **Fix:** Added `export` keyword to `const dosyaSchema` declaration
- **Files modified:** lib/trpc/routers/dosya.ts
- **Verification:** All 14 Phase 13 tests pass
- **Committed in:** 341342a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for test suite to pass. No scope creep.

## Issues Encountered

- **Migration file naming:** Drizzle generated `0001_curious_jasper_sitwell.sql` — renamed to `0001_add_phase13_columns.sql` per plan convention
- **PowerShell escaping:** Node scripts with `$` characters run via `node -e` fail in PowerShell — used `.js` file instead for data migration script

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 13 Plan 01 data foundation complete — ready for Plan 02 (TAB-02: UI changes for new fields and tab content)
- Schema changes are applied and tested
- New routers (`notlar`, `olay`) are registered and ready for UI components to consume
- Migration SQL saved at `drizzle/0001_add_phase13_columns.sql` for future reference

---
*Phase: 13-tab-cleanup-ui-ux*
*Completed: 2026-04-14*
