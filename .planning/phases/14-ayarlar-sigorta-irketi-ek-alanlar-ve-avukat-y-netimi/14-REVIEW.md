---
phase: 14-ayarlar-sigorta-irketi-ek-alanlar-ve-avukat-y-netimi
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - components/ayarlar/avukat-form-dialog.tsx
  - components/ayarlar/ayarlar-page.tsx
  - components/ayarlar/sigorta-sirketi-section.tsx
  - components/dosya/karsitaraflar-tab.tsx
  - drizzle/0002_phase14_avukat_schema.sql
  - drizzle/meta/_journal.json
  - drizzle/meta/0002_snapshot.json
  - lib/schema.ts
  - lib/trpc/routers/ayarlar.ts
  - lib/trpc/routers/dosya.ts
  - lib/validators/ayarlar.ts
  - tests/avukat-relations.test.ts
  - tests/ayarlar-validation.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 14 introduced the `avukat` table, `avukat_sigorta_sirketi` join table, extended `sigortaSirketi` with five new columns, replaced the free-text `karsitaraf_vekil` field on `taraf` with an `avukat_id` FK, and built corresponding tRPC routers and UI components.

The schema, validators, and UI components are generally well-structured. The main critical issue is a pre-existing upsert that now relies on a non-existent UNIQUE constraint on `taraf.dosya_id` — this constraint was never created in any migration and the `onConflictDoUpdate` call will silently insert duplicate rows instead of updating, breaking all taraf saves. There are also four warnings covering an unhandled linkage error in the avukat create flow, a reset-on-sigorta-change side effect that fires on mount, a missing UNIQUE enforcement in the SQL migration (log-only index named `uniq_` but lacking the `UNIQUE` keyword in the join table), and a type-casting escape hatch in the section component.

---

## Critical Issues

### CR-01: `upsertTaraf` uses `onConflictDoUpdate` on a column with no UNIQUE constraint — silently inserts duplicates

**File:** `lib/trpc/routers/dosya.ts:228-233`

**Issue:** The `upsertTaraf` mutation relies on SQLite's conflict resolution to update an existing `taraf` row when one already exists for a `dosya_id`. The target column is `taraf.dosya_id`:

```ts
.onConflictDoUpdate({ target: taraf.dosya_id, set: data })
```

However, `taraf.dosya_id` has **no UNIQUE index** in any migration. The base migration (`0000_narrow_psylocke.sql`) and the new migration (`0002_phase14_avukat_schema.sql`) both confirm that only a regular FK exists on this column — no unique constraint. SQLite's `ON CONFLICT` mechanism requires a unique or primary-key constraint on the target column(s) to fire; without it, every call to `upsertTaraf` **inserts a new row** rather than updating, producing duplicate `taraf` entries per dosya. This was a pre-existing bug, but Phase 14 adds `avukat_id` to the upsert payload, so the impact now extends to the new FK column.

**Fix:** Add a UNIQUE constraint on `taraf.dosya_id` in a new migration (since SQLite cannot add unique constraints via `ALTER TABLE`, the table must be recreated):

```sql
-- New migration: recreate taraf with UNIQUE(dosya_id)
CREATE TABLE `taraf_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `dosya_id` integer NOT NULL UNIQUE,
  `sigorta_sirketi_id` integer REFERENCES `sigorta_sirketi`(`id`),
  `avukat_id` integer REFERENCES `avukat`(`id`) ON DELETE SET NULL,
  `karsitaraf_ad` text,
  `police_no` text,
  `karsitaraf_plaka` text,
  `surucu_ad` text,
  `surucu_soyad` text,
  `surucu_plaka` text,
  `surucu_telefon` text,
  `surucu_police_no` text,
  FOREIGN KEY (`dosya_id`) REFERENCES `dosya`(`id`) ON DELETE CASCADE
);
INSERT INTO `taraf_new` SELECT DISTINCT ON (`dosya_id`) * FROM `taraf`;
DROP TABLE `taraf`;
ALTER TABLE `taraf_new` RENAME TO `taraf`;
```

Also update the Drizzle schema to declare `dosya_id` with `unique()`:

```ts
// lib/schema.ts — taraf table
dosya_id: integer('dosya_id').notNull().unique().references(() => dosya.id, { onDelete: 'cascade' }),
```

---

## Warnings

### WR-01: `linkMutation` failure in `AvukatFormDialog` create flow is silently swallowed — avukat is created but not linked

**File:** `components/ayarlar/avukat-form-dialog.tsx:83-95`

**Issue:** When creating a new avukat, `createMutation.onSuccess` calls `await linkMutation.mutateAsync(...)`. If the `addSirket` tRPC call fails (e.g., network error), `mutateAsync` throws, but there is no `try/catch` around it. React Query's `useMutation` wraps `onSuccess` callback errors, meaning the `onError` callback of `createMutation` will NOT fire — the error is swallowed. The avukat record will exist in the database without being linked to the sigorta şirketi, and no error toast is shown to the user.

**Fix:** Wrap the `linkMutation` call in a try/catch so the user gets feedback and can retry:

```ts
onSuccess: async (row) => {
  try {
    await linkMutation.mutateAsync({
      avukat_id: row.id,
      sigorta_sirketi_id: sigortaSirketiId,
    })
    toast.success('Kaydedildi.')
    onSuccess?.()
    onOpenChange(false)
  } catch {
    toast.error('Avukat oluşturuldu fakat şirkete bağlanamadı. Lütfen tekrar deneyin.')
  }
},
```

---

### WR-02: `avukat_id` reset `useEffect` fires on mount with `selectedSirketId = null`, unconditionally clearing `avukat_id` during edit mode

**File:** `components/dosya/karsitaraflar-tab.tsx:109-111`

**Issue:** The effect that resets `avukat_id` to `null` when `selectedSirketId` changes has no guard:

```ts
useEffect(() => {
  form.setValue('avukat_id', null)
}, [selectedSirketId, form])
```

When the component mounts in edit mode with an existing `taraf` that has both `sigorta_sirketi_id` and `avukat_id` pre-populated (via `defaultValues`), this effect fires immediately on mount (React runs all effects after first render). At mount time, `selectedSirketId` equals `taraf.sigorta_sirketi_id` (from `defaultValues`), so the effect wipes the `avukat_id` that was just set from `defaultValues` before the user has done anything. The displayed form will show the correct sigorta şirketi but an empty avukat select, losing the saved avukat association on every edit open.

**Fix:** Track the previous value or skip the reset on initial mount using a ref:

```ts
const isMounted = useRef(false)
useEffect(() => {
  if (!isMounted.current) {
    isMounted.current = true
    return
  }
  form.setValue('avukat_id', null)
}, [selectedSirketId, form])
```

---

### WR-03: `avukat_sigorta_sirketi` join table index named `uniq_avukat_sirketi` is a plain index in the SQL migration, not a `UNIQUE INDEX`

**File:** `drizzle/0002_phase14_avukat_schema.sql:31`

**Issue:** The SQL migration creates:

```sql
CREATE UNIQUE INDEX `uniq_avukat_sirketi` ON `avukat_sigorta_sirketi` (`avukat_id`, `sigorta_sirketi_id`);
```

Wait — re-reading line 31 confirms it does say `UNIQUE INDEX`. However, the Drizzle schema definition uses a regular `index()` call, not `uniqueIndex()`, which means the Drizzle-generated migration would produce a plain index, not a unique one. The hand-written SQL migration is correct, but if `drizzle-kit generate` is re-run, it will overwrite the migration with a non-unique index, breaking the deduplication guarantee relied on by `onConflictDoNothing` in `addSirket`.

**File:** `lib/schema.ts:33`

```ts
// Current — plain index, not unique:
index('uniq_avukat_sirketi').on(t.avukat_id, t.sigorta_sirketi_id),
```

**Fix:** Use `uniqueIndex` from `drizzle-orm/sqlite-core` so the Drizzle schema stays in sync with the SQL migration:

```ts
import { integer, text, real, sqliteTable, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// In avukatSigortaSirketi table definition:
}, (t) => [
  index('idx_avukat_sirketi_avukat').on(t.avukat_id),
  index('idx_avukat_sirketi_sirketi').on(t.sigorta_sirketi_id),
  uniqueIndex('uniq_avukat_sirketi').on(t.avukat_id, t.sigorta_sirketi_id),
])
```

---

### WR-04: `SigortaSirketiRow` type extraction uses an overly complex inference that will silently produce `never` if the tRPC path changes

**File:** `components/ayarlar/sigorta-sirketi-section.tsx:52-55`

**Issue:** The type derivation:

```ts
type SigortaSirketiRow = NonNullable<
  Awaited<ReturnType<ReturnType<typeof useTRPC>['ayarlar']['sigortaSirketi']['listWithAvukatlar']['queryOptions']>>
> extends { queryFn: () => Promise<infer T> } ? T extends Array<infer U> ? U : never : never
```

This multi-level conditional inference is fragile. If the `queryOptions` return shape from `@trpc/tanstack-query` changes (e.g., `queryFn` is renamed or wrapped), this resolves to `never`, making `list as ListItem[]` on line 212 a runtime type lie. The author acknowledges this by defining a duplicate inline `ListItem` type immediately below (lines 57-75) and using that instead. The `SigortaSirketiRow` type is declared but never used.

**Fix:** Remove the unused `SigortaSirketiRow` type entirely (lines 52-55). The `ListItem` type below is sufficient and correct.

---

## Info

### IN-01: `avukatSchema` IBAN regex expects exactly 24 digits after `TR`, but valid Turkish IBANs are 24 digits total (TR + 24 = 26 chars), making the regex correct only for `TR` + 24 chars — verify intent

**File:** `lib/validators/ayarlar.ts:17-20`

**Issue:** The regex `/^TR\d{24}$/` requires the string to start with `TR` followed by exactly 24 digits, giving a 26-character IBAN total. A Turkish IBAN is structured as `TR` (2) + 2 check digits + 5-digit bank code + 1 reserved digit + 16-digit account number = 26 characters total. The regex is technically correct. However, the IBAN placeholder in the UI (`avukat-form-dialog.tsx:177`) shows `TR00 0000 0000 0000 0000 0000 00` (formatted with spaces), which users may try to enter. The validator will reject the spaced format with a confusing error since it only accepts unspaced IBANs.

**Fix:** Either strip spaces before validation or update the placeholder to make clear that spaces are not accepted:

```ts
iban: z.string()
  .transform(v => v.replace(/\s/g, ''))
  .pipe(z.string().regex(/^TR\d{24}$/, 'Geçersiz IBAN formatı (TRXXXXXXXXXXXXXXXXXXXXXXXX gerekli)'))
  .optional()
  .or(z.literal('')),
```

---

### IN-02: `avukat.delete` router procedure does not cascade-check `taraf.avukat_id` linked rows before deletion

**File:** `lib/trpc/routers/ayarlar.ts:143-147`

**Issue:** The delete procedure for avukat simply runs `db.delete(avukat)`. The FK `taraf.avukat_id` is defined with `ON DELETE SET NULL`, so the DB handles nullification automatically. However, there is no user-facing warning or count returned when active dosyalar reference this avukat. A user deleting an avukat from the settings page will silently lose all `taraf.avukat_id` associations across open cases with no undo. This is a UX concern that also masks data integrity risks.

**Fix (minimal):** Return a count of affected taraf rows in the delete response so the UI can show a confirmation count:

```ts
delete: protectedProcedure
  .input(z.object({ id: z.number().int() }))
  .mutation(async ({ input }) => {
    const affected = await db
      .select({ count: count() })
      .from(taraf)
      .where(eq(taraf.avukat_id, input.id))
    await db.delete(avukat).where(eq(avukat.id, input.id))
    return { success: true, affected_taraf_count: affected[0]?.count ?? 0 }
  }),
```

---

### IN-03: `karsitaraflar-tab` does not reset `defaultValues` when `taraf` prop changes (e.g., after a successful save)

**File:** `components/dosya/karsitaraflar-tab.tsx:85-99`

**Issue:** `useForm` is initialized with `defaultValues` derived from the `taraf` prop at mount time. After a successful `upsertTaraf` mutation, `setIsEditing(false)` is called, which hides the form. But if the parent component re-renders with an updated `taraf` prop (e.g., after query invalidation), the form's internal state is not reset — `useForm` does not auto-sync on prop changes. The next time the user opens editing, the form will show stale values until the page is refreshed. This was present before Phase 14 but the addition of `avukat_id` makes it more visible (the newly saved avukat selection won't reappear correctly).

**Fix:** Add a `useEffect` to reset the form when `taraf` changes:

```ts
useEffect(() => {
  form.reset({
    sigorta_sirketi_id: taraf?.sigorta_sirketi_id ?? null,
    avukat_id: taraf?.avukat_id ?? null,
    karsitaraf_ad: taraf?.karsitaraf_ad ?? '',
    // ... remaining fields
  })
}, [taraf])
```

---

_Reviewed: 2026-04-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
