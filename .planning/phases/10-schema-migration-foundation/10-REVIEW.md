---
phase: 10-schema-migration-foundation
reviewed: 2026-04-14T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - tests/lib/schema.test.ts
  - tests/lib/validation.test.ts
  - tests/lib/trpc.test.ts
  - lib/schema.ts
  - lib/trpc/routers/dosya.ts
  - lib/trpc/routers/muvekkil.ts
  - components/muvekkil/muvekkil-detail.tsx
  - components/muvekkil/muvekkil-form.tsx
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---
# Phase 10: Code Review Report

**Reviewed:** 2026-04-14
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

8 files reviewed covering the Drizzle schema definitions, tRPC routers for `dosya`/`muvekkil`, and the React components for muvekkil create/edit/detail. The `taraf` driver fields (`surucu_ad`, `surucu_soyad`, etc.) are properly added to the schema, router validation (`tarafSchema`), and test coverage. One critical SQL injection risk was found in the `dosya.list` procedure. Several consistency gaps between Zod schemas and DB schema defaults, plus a dead UI state variable, are flagged as warnings.

---

## Critical Issues

### CR-01: Raw SQL interpolation in `dosya.list` IN clause

**File:** `lib/trpc/routers/dosya.ts:100`
**Issue:** An IN clause is constructed using `sql.raw(ids.join(','))`:
```ts
.where(sql`${taraf.dosya_id} IN (${sql.raw(ids.join(','))})`)
```
`ids` come from a prior `db.select()` so are integers in practice. However, `sql.raw()` bypasses Drizzle's parameterization entirely. If the `rows` select ever widens (e.g., adding a text column to projection), or if `rows.map(r => r.id)` produces a non-integer, the raw string interpolation could become an injection vector. Defensive code should not rely on implicit type trust across module boundaries.
**Fix:**
```ts
// Use Drizzle's inArray helper instead of raw SQL
import { inArray } from 'drizzle-orm'
const tarafRows = await db
  .select({ dosya_id: taraf.dosya_id, police_no: taraf.police_no })
  .from(taraf)
  .where(inArray(taraf.dosya_id, ids))
```

---

## Warnings

### WR-01: TOCTOU race condition in `upsertTaraf`

**File:** `lib/trpc/routers/dosya.ts:205–217`
**Issue:** The upsert logic reads then writes based on whether a row exists. Two concurrent calls with the same `dosya_id` can both see `existing.length === 0` and attempt `INSERT`, causing either a duplicate-key DB error or (if no unique constraint exists) duplicate rows.
**Fix:** Use a single atomic `INSERT ... ON CONFLICT DO UPDATE` statement via Drizzle's `onConflictDoUpdate`:
```ts
await db.insert(taraf)
  .values({ dosya_id, ...data })
  .onConflictDoUpdate({ target: taraf.dosya_id, set: data })
```

### WR-02: `dosyaSchema` missing `durum` — DB notNull risk on create

**File:** `lib/trpc/routers/dosya.ts:8–17`
**Issue:** The `dosya` table defines `durum: text('durum').notNull().default('aktif')` (`lib/schema.ts:144`), but `dosyaSchema` has no `durum` field. Calling `dosya.create` passes only the schema fields to `db.insert(dosya).values(input)`, so `durum` would be `undefined` — Drizzle should apply the DB default, but the `notNull()` constraint fires before the default in some configurations, risking a constraint violation.
**Fix:** Add `durum: z.enum(['aktif', 'arsiv']).default('aktif').optional()` to `dosyaSchema`.

### WR-03: `telefon` field has no format validation in `muvekkilSchema`

**File:** `lib/trpc/routers/muvekkil.ts:11`
**Issue:** `telefon: z.string().max(20).optional().or(z.literal(''))` — accepts any string. The Turkish phone regex `/^05[0-9]{9}$/` is already defined and used in `tarafSchema` (`surucu_telefon`), but `muvekkil.telefon` has no format enforcement.
**Fix:**
```ts
telefon: z
  .string()
  .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
  .max(20)
  .optional()
  .or(z.literal('')),
```

### WR-04: Zod `min(1)` vs empty-string `defaultValues` mismatch in `MuvekkilForm`

**File:** `components/muvekkil/muvekkil-form.tsx:24–25, 48–49`
**Issue:** `formSchema` defines `ad: z.string().min(1, 'Ad zorunludur')` and `soyad: z.string().min(1, 'Soyad zorunludur')`, but `useForm` initializes with `defaultValues: { ad: '', soyad: '', ... }`. In create mode the form starts with invalid values. Submit would immediately fire a validation error even though no user input occurred. This works in practice only because edit mode always overrides `defaultValues` with fetched data before render.
**Fix:** Either change the schema to `z.string().min(0)` for optional-until-submit, or initialize `defaultValues` with non-empty strings (e.g., `' '` or a placeholder).

---

## Info

### IN-01: Dead `showLinkedError` state in `MuvekkilDetail`

**File:** `components/muvekkil/muvekkil-detail.tsx:78`
**Issue:** `showLinkedError` is declared with `useState` but never used as the rendering condition for the error banner. The banner at line 166 renders `showLinkedError && (...)`, yet `showLinkedError` is only ever `true` immediately after a click if `data.dosyalar.length > 0`. Since `handleDeleteClick` (line 102) directly sets `showLinkedError` based on `data.dosyalar.length`, the state is redundant — the same condition is already available as `data.dosyalar.length > 0` and the state adds no additional control flow.
**Fix:** Remove `showLinkedError` state and use `data.dosyalar.length > 0` directly in JSX, or remove the JSX condition and rely solely on the state variable if future logic requires decoupled control.

---

_Reviewed: 2026-04-14_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
