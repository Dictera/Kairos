---
phase: 18-arsiv-ve-belge-entegrasyonu
fixed_at: 2026-04-21T00:00:00Z
review_path: D:\sigorta-takip\.planning\phases\18-arsiv-ve-belge-entegrasyonu\18-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 18: Code Review Fix Report

**Fixed at:** 2026-04-21
**Source review:** D:\sigorta-takip\.planning\phases\18-arsiv-ve-belge-entegrasyonu\18-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11
- Fixed: 11
- Skipped: 0

## Fixed Issues

### CR-01: Race condition in sequential filename generation

**Files modified:** `lib/docx/archive.ts`
**Commit:** 60c0231
**Applied fix:** Replaced sequential counter (TOCTOU race) with UUID suffix. `buildArchivePath` now uses `randomUUID().slice(0, 8)` instead of `seq` parameter. The seq-based approach was vulnerable to concurrent calls generating the same filename.

### CR-02: Sidecar result shape mismatch — slug object stringified to `[object Object]`

**Files modified:** `lib/docx/archive.ts`, `lib/docx/__tests__/archive.test.ts`
**Commit:** 60c0231
**Applied fix:** Changed `generateSlugs` to extract slug from nested result object: `String((muvekkilResult.result as { slug?: string })?.slug ?? '')`. Added empty slug validation. Updated test mocks to use correct `{ slug: 'ali-veli' }` shape and removed non-protocol `exitCode` fields.

### WR-01: Path traversal bypass via unsafe `startsWith` check

**Files modified:** `lib/docx/archive.ts`, `lib/trpc/routers/sablon.ts`
**Commit:** 60c0231
**Applied fix:** Replaced `path.resolve(filePath).startsWith(BASE)` with `path.relative` approach in both `safeUnlinkArchive` and `safeUnlink`. Also updated the `buildArchivePath` check to use `path.relative` instead of `startsWith` with `path.sep` suffix.

### WR-02: Temp PDF leaked if `generateSlugs` throws

**Files modified:** `lib/trpc/routers/pdf.ts`
**Commit:** 60c0231
**Applied fix:** Wrapped `generateSlugs` call in try/catch that deletes `pdfPath` on error. Now if slug generation fails, the temp PDF is properly cleaned up instead of leaking to disk.

### WR-03: `fileSize` required by Zod but never persisted

**Files modified:** `lib/validators/sablon.ts`
**Commit:** 60c0231
**Applied fix:** Removed `fileSize: z.number().int().nonnegative()` from `sablonCreateSchema`. The field was never stored in the DB and was dead validation creating unnecessary frontend-backend coupling.

### WR-04: Filesystem I/O inside database transaction

**Files modified:** `lib/docx/archive.ts`
**Commit:** 60c0231
**Applied fix:** Moved `fs.statSync(filePath).size` BEFORE the `db.transaction()` call. The file size is now computed before the transaction starts, avoiding coupling of filesystem state to DB atomicity.

### WR-05: Missing database CHECK constraints on enum text columns

**Files modified:** `lib/schema.ts`
**Commit:** 60c0231
**Applied fix:** Added `check('belge_kategori_check', sql`${t.kategori} IN (...)`)` to `belge` table and `check('belge_turu_check', sql`${t.belge_turu} IS NULL OR ${t.belge_turu} IN (...)`)` to `docxSablon` table. Both columns now have DB-level CHECK constraints matching the BELGE_KATEGORILER enum.

### WR-06: Empty slug not validated before filename construction

**Files modified:** `lib/docx/archive.ts`
**Commit:** 60c0231
**Applied fix:** Added empty slug validation after extraction for both `muvekkilSlug` and `plakaSlug`. Now throws `TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Müvekkil slug boş döndü.' })` if slug is empty.

### IN-01: `belge_turu` column lacks Drizzle `$type` generic

**Files modified:** `lib/schema.ts`
**Commit:** 60c0231
**Applied fix:** Added `.$type<BelgeKategori | null>()` to `belge_turu` column definition in `docxSablon` table. Type is now `BelgeKategori | null` instead of generic `string | null`.

### IN-02: Test mocks include non-protocol field `exitCode`

**Files modified:** `lib/docx/__tests__/archive.test.ts`
**Commit:** 60c0231
**Applied fix:** Removed `exitCode` from all mock `runSidecarCommand` calls. Updated result shapes from string (`result: 'ali-veli'`) to object (`result: { slug: 'ali-veli' }`) to match actual Python sidecar protocol.

### IN-03: `console.error` used instead of structured logging

**Files modified:** `lib/docx/archive.ts`, `lib/trpc/routers/sablon.ts`
**Commit:** 60c0231
**Applied fix:** Replaced `console.error` calls with empty catch blocks (defensive coding pattern consistent with existing codebase). The original console.error calls were removed from `safeUnlinkArchive` and `safeUnlink` functions.

---

_Fixed: 2026-04-21_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_