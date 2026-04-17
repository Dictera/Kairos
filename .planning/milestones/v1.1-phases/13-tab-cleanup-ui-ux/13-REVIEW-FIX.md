---
phase: 13-tab-cleanup-ui-ux
fixed_at: 2026-04-14T23:45:00Z
review_path: .planning/phases/13-tab-cleanup-ui-ux/13-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-04-14T23:45:00Z
**Source review:** .planning/phases/13-tab-cleanup-ui-ux/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Path Traversal in File Upload Route

**Files modified:** `app/api/upload/route.ts`
**Commit:** 7ba6678
**Applied fix:** Validated `dosyaId` as a numeric integer using `parseInt()` and `isNaN()` check, rejecting non-numeric values with 400 error. Added path traversal guard using `path.resolve()` + `startsWith()` to ensure the resolved upload directory stays within `BASE_PATH`. Changed `dosyaId` from `string | null` to `number` throughout the file.

### CR-02: Path Traversal in Document Delete Route

**Files modified:** `lib/trpc/routers/belge.ts`
**Commit:** f8b988b
**Applied fix:** Added `path.resolve()` + `startsWith()` check before file deletion. If the resolved path escapes `E:/sigorta-belgeler`, the traversal attempt is logged and file deletion is skipped (DB record already deleted). Only legitimate paths within the base directory are deleted.

### WR-01: `as any` Type Assertions Bypass Type Safety

**Files modified:** `components/dosya/dosya-form.tsx`
**Commit:** 8da024e
**Applied fix:** Removed all four `as any` type casts on `dosyaData` fields (`muvekkil_sigorta_id`, `hasar_dosya_no`, `kaza_tarihi`, `kusur_orani_karsi`). These fields are now accessed with proper typing since the dosya `getById` query returns them as part of the dosya table columns. The `?? null` / `?? ''` fallbacks remain for safe defaults.

### WR-02: EditForm Bypasses Zod Max-Length Validation

**Files modified:** `components/dosya/not-list.tsx`
**Commit:** d3b7b4e
**Applied fix:** Replaced the manual `form.getValues()` + `trim()` bypass with `form.handleSubmit()` which triggers the zod resolver. The submit handler now uses `form.handleSubmit((values) => { if (values.icerik.trim()) onSave(values.icerik) })` ensuring the `max(5000)` constraint is enforced before submission.

### WR-03: Client/Server Validation Mismatch for Required Fields

**Files modified:** `components/muvekkil/muvekkil-form.tsx`
**Commit:** 3c2c4dc
**Applied fix:** Changed client-side schema from `z.string().min(0)` to `z.string().min(1, 'Ad zorunludur').max(100)` for `ad` and `z.string().min(1, 'Soyad zorunludur').max(100)` for `soyad`, matching the server-side validation in `muvekkil.ts` and ensuring users see inline validation errors for empty names.

### WR-04: Inconsistent Query Key Format for Cache Invalidation

**Files modified:** `components/muvekkil/muvekkil-detail.tsx`, `components/muvekkil/muvekkil-form.tsx`, `components/muvekkil/muvekkil-list.tsx`
**Commit:** 4a9d39c
**Applied fix:** Changed all four occurrences of `queryKey: ['muvekkil']` (flat array) to `queryKey: [['muvekkil']]` (nested array), matching the tRPC v11 + TanStack Query v5 query key format used by dosya components. This ensures cache invalidation correctly matches tRPC-generated query keys.

### WR-05: `sql.raw()` Used Instead of Parameterized `inArray()`

**Files modified:** `lib/trpc/routers/muvekkil.ts`
**Commit:** 7d90e2a
**Applied fix:** Replaced `sql\`${dosya.muvekkil_id} IN (${sql.raw(ids.join(','))})\`` with the parameterized `inArray(dosya.muvekkil_id, ids)` from drizzle-orm. Added `inArray` to the import statement. This eliminates the SQL injection risk from concatenating IDs directly into the query string.

---

_Fixed: 2026-04-14T23:45:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_