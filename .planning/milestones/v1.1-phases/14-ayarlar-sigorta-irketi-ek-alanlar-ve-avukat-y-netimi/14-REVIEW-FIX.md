---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
fixed_at: 2026-04-17T00:00:00Z
review_path: .planning/phases/14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi/14-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-04-17T00:00:00Z
**Source review:** .planning/phases/14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 Critical + 4 Warning)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: `upsertTaraf` uses `onConflictDoUpdate` on a column with no UNIQUE constraint

**Files modified:** `lib/schema.ts`, `drizzle/0003_taraf_unique_dosya_id.sql`, `drizzle/meta/_journal.json`
**Commit:** ba19b38
**Applied fix:** Added `.unique()` to `taraf.dosya_id` in the Drizzle schema. Created new migration `0003_taraf_unique_dosya_id.sql` that recreates the `taraf` table with `dosya_id NOT NULL UNIQUE`, preserving data by keeping the first row per `dosya_id` (MIN(id) group-by). Registered the migration in `drizzle/meta/_journal.json`. This ensures SQLite's `ON CONFLICT` mechanism fires correctly for all future `upsertTaraf` calls.

### WR-01: `linkMutation` failure silently swallowed in `AvukatFormDialog` create flow

**Files modified:** `components/ayarlar/avukat-form-dialog.tsx`
**Commit:** 028373f
**Applied fix:** Wrapped the `linkMutation.mutateAsync(...)` call in `createMutation.onSuccess` with a `try/catch`. On success the existing `toast.success` / `onSuccess` / `onOpenChange` flow runs normally. On catch, a specific error toast is shown: "Avukat oluşturuldu fakat şirkete bağlanamadı. Lütfen tekrar deneyin."

### WR-02: `avukat_id` reset `useEffect` fires on mount, wiping edit-mode pre-populated value

**Files modified:** `components/dosya/karsitaraflar-tab.tsx`
**Commit:** 7d9b132
**Applied fix:** Added `useRef` to the React import. Declared `const isMounted = useRef(false)` before the effect. Added a mount guard inside the effect: on first run, sets `isMounted.current = true` and returns early without clearing `avukat_id`. Subsequent runs (triggered by actual user changes to `selectedSirketId`) proceed normally and reset the field.

### WR-03: `avukat_sigorta_sirketi` join table uses plain `index()` instead of `uniqueIndex()`

**Files modified:** `lib/schema.ts`
**Commit:** a27160d
**Applied fix:** Added `uniqueIndex` to the `drizzle-orm/sqlite-core` import. Changed `index('uniq_avukat_sirketi')` to `uniqueIndex('uniq_avukat_sirketi')` in the `avukatSigortaSirketi` table definition. The Drizzle schema now stays in sync with the hand-written SQL migration (which already used `CREATE UNIQUE INDEX`), preventing a future `drizzle-kit generate` run from silently downgrading the constraint to a plain index.

### WR-04: Unused `SigortaSirketiRow` fragile type inference in `SigortaSirketiSection`

**Files modified:** `components/ayarlar/sigorta-sirketi-section.tsx`
**Commit:** 0a5fa43
**Applied fix:** Removed the unused `SigortaSirketiRow` type (lines 52-55 in the original file) entirely. The `ListItem` type defined immediately below it is already used throughout the component and is the correct, stable type definition.

---

_Fixed: 2026-04-17T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
