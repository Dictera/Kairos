---
phase: 18-arsiv-ve-belge-entegrasyonu
plan: 01
subsystem: database
 tags:
  - drizzle
  - sqlite
  - zod
  - trpc
  - python-slugify
  - sidecar

# Dependency graph
requires:
  - phase: 17-pdf-uretim-motoru
    provides: docx pipeline sidecar infrastructure
provides:
  - docxSablon.belge_turu nullable column for document categorization
  - Sidecar slug command for ASCII-safe slug generation
  - sablon CRUD mutations persist belge_turu
affects:
  - belge table categorization
  - template management UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod enum validation for document categories crossing API boundary"
    - "Python sidecar command extension pattern"
    - "Nullable enum columns in Drizzle ORM for optional categorization"

key-files:
  created:
    - drizzle/0005_phase18_belge_turu.sql
  modified:
    - lib/schema.ts
    - drizzle/meta/_journal.json
    - lib/pipeline/protocol.ts
    - scripts/docx-pipeline/main.py
    - lib/validators/sablon.ts
    - lib/trpc/routers/sablon.ts

key-decisions:
  - "Pre-transliterate Turkish chars before python-slugify to ensure consistent ASCII output across environments"
  - "Use nullable text column for belge_turu rather than enum constraint at DB level to avoid migration complexity"

patterns-established:
  - "Sidecar command addition: extend both TypeScript enum and Python Literal, add handler, wire into dispatcher map"
  - "Optional enum validation: Zod .optional() with enum(BELGE_KATEGORILER) for type-safe optional categorization"

requirements-completed:
  - ARSIV-03
  - ARSIV-05

# Metrics
duration: 20min
completed: 2026-04-21
---

# Phase 18 Plan 01: Arşiv ve Belge Entegrasyonu — Schema & Sidecar Extension Summary

**Extended docxSablon schema with nullable belge_turu column, added slug command to Python sidecar with Turkish-safe transliteration, and wired belge_turu through Zod validators into tRPC CRUD mutations.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-21T19:15:00Z
- **Completed:** 2026-04-21T19:35:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added `belge_turu` nullable text column to `docxSablon` table with migration and journal entry
- Extended sidecar protocol with `slug` command for ASCII-safe slug generation
- Implemented `handle_slug` in Python sidecar using `python-slugify` with Turkish char pre-transliteration
- Updated Zod validators (`sablonCreateSchema`, `sablonUpdateSchema`) with optional `belge_turu` enum validation
- Wired `belge_turu` persistence into tRPC `sablonRouter.create` and `sablonRouter.update` mutations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add belge_turu to docxSablon schema and create migration** - `522d262` (feat)
2. **Task 2: Add slug command to sidecar protocol and Python main.py** - `8898274` (feat)
3. **Task 3: Update sablon validators and router to support belge_turu** - `4055c9d` (feat)

**Additional fix:** `8d1191c` (fix) — Added Turkish char pre-transliteration to `handle_slug` per plan requirement for defensive correctness with python-slugify 8.0.4.

## Files Created/Modified
- `lib/schema.ts` — Added `belge_turu: text('belge_turu')` to `docxSablon` table definition
- `drizzle/0005_phase18_belge_turu.sql` — Migration SQL: `ALTER TABLE docx_sablon ADD belge_turu text`
- `drizzle/meta/_journal.json` — Added idx 5 entry with tag `0005_phase18_belge_turu`
- `lib/pipeline/protocol.ts` — Extended `CommandEnvelopeSchema.command` enum to include `'slug'`
- `scripts/docx-pipeline/main.py` — Added `handle_slug` with Turkish pre-transliteration and wired into dispatcher
- `lib/validators/sablon.ts` — Added optional `belge_turu: z.enum(BELGE_KATEGORILER).optional()` to create/update schemas
- `lib/trpc/routers/sablon.ts` — Persist `belge_turu: input.belge_turu ?? null` in create and update mutations

## Decisions Made
- **Pre-transliterate Turkish chars before slugify:** Added explicit `str.maketrans` mapping for Turkish characters (`İ→I`, `Ş→S`, `Ç→C`, `Ö→O`, `Ü→U`, `Ğ→G` and lowercase variants) before calling `python-slugify`. While direct testing showed python-slugify 8.0.4 handles these correctly in this environment, the pre-transliteration ensures consistent behavior across different platforms and guards against any edge cases in the library.
- **Nullable with no default for belge_turu:** Chose nullable text column with no default so existing rows remain NULL, avoiding data migration complexity for existing templates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added Turkish char pre-transliteration to handle_slug**
- **Found during:** Task 2 (slug command implementation)
- **Issue:** Plan explicitly required pre-transliteration of Turkish chars before calling slugify. Initial implementation called slugify directly without pre-transliteration.
- **Fix:** Added `str.maketrans` with explicit Turkish-to-ASCII character mapping before `slugify()` call.
- **Files modified:** `scripts/docx-pipeline/main.py`
- **Verification:** Python direct test confirmed `İstanbul Şirket` → `istanbul-sirket`
- **Committed in:** `8d1191c`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Defensive fix for cross-platform consistency. No scope creep.

## Issues Encountered
- **Windows stdin encoding in verification:** Node.js `execSync` passing Turkish characters to Python via stdin on Windows produced invalid Unicode (lone surrogates), causing Pydantic validation errors. This is an environment-specific issue with Windows console encoding, not a code bug. Direct Python testing (`python -c`) confirmed the `handle_slug` implementation works correctly when receiving properly encoded UTF-8 input. The actual production code uses `execa` which handles UTF-8 encoding correctly.
- **Pre-existing TypeScript errors:** `npx tsc --noEmit` reported 6 errors, all in test files (`tests/06-belge-finans.test.ts`, `tests/16-sidecar-extract-vars.test.ts`, `tests/lib/pipeline/config.test.ts`, `tests/lib/trpc/routers/pipeline.test.ts`). None were introduced by this plan's changes and all are out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema and sidecar foundation ready for Phase 18 UI work (template belge_turu selection)
- Slug command available for generating ASCII-safe filenames for archived PDFs
- No blockers

## Self-Check: PASSED

- [x] `lib/schema.ts` contains `belge_turu: text('belge_turu')` inside `docxSablon`
- [x] `drizzle/0005_phase18_belge_turu.sql` exists with ALTER TABLE statement
- [x] `drizzle/meta/_journal.json` has idx 5 entry with tag `0005_phase18_belge_turu`
- [x] `lib/pipeline/protocol.ts` includes `'slug'` in command enum
- [x] `scripts/docx-pipeline/main.py` has `handle_slug` with Turkish pre-transliteration
- [x] `lib/validators/sablon.ts` includes `belge_turu` in create/update schemas
- [x] `lib/trpc/routers/sablon.ts` persists `belge_turu` in create/update mutations
- [x] All commits exist: `522d262`, `8898274`, `4055c9d`, `8d1191c`

---
*Phase: 18-arsiv-ve-belge-entegrasyonu*
*Completed: 2026-04-21*
