---
phase: 18-arsiv-ve-belge-entegrasyonu
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - drizzle/0005_phase18_belge_turu.sql
  - lib/schema.ts
  - drizzle/meta/_journal.json
  - lib/pipeline/protocol.ts
  - scripts/docx-pipeline/main.py
  - lib/validators/sablon.ts
  - lib/trpc/routers/sablon.ts
  - lib/docx/archive.ts
  - lib/docx/__tests__/archive.test.ts
  - lib/trpc/routers/pdf.ts
  - components/ayarlar/sablon-yonetimi-section.tsx
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-04-21
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 18 introduces archive-based PDF storage (`lib/docx/archive.ts`), a `belge_turu` field on `docx_sablon`, and a Python sidecar `slug` command. The overall design is sound, but two **critical** issues were found:

1. A **race condition** in sequential filename generation that can cause file overwrites and DB inconsistency under concurrent PDF generation.
2. A **shape mismatch** between the Python sidecar response (`{"slug": ...}`) and the TypeScript consumer (`String(result)`), which stringifies the object to `"[object Object]"`, producing garbage filenames.

Additionally, several **warnings** cover path-traversal defense gaps, temp-file leaks, dead validation, and filesystem I/O inside DB transactions.

---

## Critical Issues

### CR-01: Race condition in sequential filename generation (`seq` TOCTOU)

**File:** `lib/docx/archive.ts:120–125`
**Issue:** `seq` is computed as `COUNT(*) + 1` outside any transaction and then used to build a deterministic filename. Two concurrent `generate` mutations for the same `dosyaId` + `sablonId` will read the same count, compute the same `seq`, and both attempt to write to the same path. On Windows, `fs.renameSync` **overwrites** the existing file, causing the first PDF to be lost while both DB rows remain. On Linux, the second rename throws `EEXIST`, but the first row still points to a file that may later be overwritten by a retry.

**Fix:** Replace the sequential counter with a uniqueness guarantee. Options:
- Use a UUID suffix (e.g., `baseName-${uuid}.pdf`) so collisions are impossible.
- Or wrap `COUNT` + `INSERT` in a transaction with a unique composite constraint on `(dosya_id, sablon_id, dosya_adi)` and retry on conflict.

```typescript
// Safer: use a short UUID instead of seq
import { randomUUID } from 'crypto'
const fileName = `${baseName}-${randomUUID().slice(0, 8)}.pdf`
```

---

### CR-02: Sidecar result shape mismatch — slug object stringified to `[object Object]`

**File:** `lib/docx/archive.ts:75–103` (consumer) and `scripts/docx-pipeline/main.py:49–63` (producer)
**Issue:** `handle_slug` in Python returns:
```python
{"status": "success", "result": {"slug": slug}}
```
But `generateSlugs` in TypeScript does:
```typescript
const muvekkilSlug = String(muvekkilResult.result ?? '')
```
Because `muvekkilResult.result` is the object `{"slug": "ali-veli"}`, `String(...)` yields the literal string `"[object Object]"`. Every archived PDF filename would become `[object Object]-1.pdf`. The same bug affects `plakaSlug`.

The test file (`archive.test.ts`) also mocks the wrong shape (`result: 'ali-veli'` string instead of `result: {slug: 'ali-veli'}`), masking the bug in CI.

**Fix:** Align the shapes. Prefer extracting the slug on the TS side so the sidecar contract stays explicit:

```typescript
// lib/docx/archive.ts
const muvekkilSlug = String((muvekkilResult.result as { slug?: string })?.slug ?? '')
if (!muvekkilSlug) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Slug boş döndü.' })
```

And update the test mocks:
```typescript
.mockResolvedValueOnce({ status: 'success', result: { slug: 'ali-veli' } })
```

---

## Warnings

### WR-01: Path traversal bypass via unsafe `startsWith` check

**File:** `lib/docx/archive.ts:19,58` and `lib/trpc/routers/sablon.ts:16`
**Issue:** `path.resolve(filePath).startsWith(ARCHIVE_BASE)` (and the identical pattern in `safeUnlink`) is vulnerable to prefix attacks when `ARCHIVE_BASE` does not end with a path separator. For example, if `ARCHIVE_BASE` is `D:\app\uploads\sablon-pdf`, a resolved path of `D:\app\uploads\sablon-pdf-attack\evil.pdf` passes the check.

**Fix:** Use `path.relative` or append `path.sep`:

```typescript
const resolved = path.resolve(filePath)
const baseResolved = path.resolve(ARCHIVE_BASE)
const rel = path.relative(baseResolved, resolved)
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geçersiz yol.' })
}
```

Apply the same fix to `safeUnlink` in both `archive.ts` and `sablon.ts`.

---

### WR-02: Temp PDF leaked if `generateSlugs` throws

**File:** `lib/trpc/routers/pdf.ts:152–156`
**Issue:** After `convertResult` succeeds, `pdfPath` exists in `tmpdir()`. If `generateSlugs` throws (sidecar error or slug empty), the `catch` block in `pdf.ts` only handles `archivePdfAndCreateBelge` errors. The temp PDF is never deleted, leaking disk space.

**Fix:** Wrap the post-convert logic in a `try/finally` (or extend the existing `try/catch`) so `pdfPath` is always unlinked on any error:

```typescript
let pdfPath: string
// ... convert logic ...
pdfPath = (convertResult.result as { output_path: string }).output_path

try {
  const { muvekkilSlug, plakaSlug } = await generateSlugs(...)
  // ... archive ...
} catch (e) {
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
  throw e
}
```

---

### WR-03: `fileSize` required by Zod but never persisted

**File:** `lib/validators/sablon.ts:11` and `lib/trpc/routers/sablon.ts:49–57`
**Issue:** `sablonCreateSchema` requires `fileSize: z.number().int().nonnegative()`, and the frontend dutifully passes it, but the `create` mutation ignores the field entirely (`docxSablon` has no `fileSize` column). This is dead validation that adds coupling between frontend and backend for no benefit.

**Fix:** Either add a `dosya_boyutu` column to `docxSablon` and store it, or remove `fileSize` from `sablonCreateSchema` (and the frontend payload) to eliminate the dead parameter.

---

### WR-04: Filesystem I/O inside database transaction

**File:** `lib/docx/archive.ts:166`
**Issue:** `fs.statSync(filePath).size` is called inside `db.transaction`. This extends the SQLite transaction duration and couples filesystem state to DB atomicity. If the filesystem is slow or the file disappears between `renameSync` and `statSync`, the transaction rolls back even though the file is already moved.

**Fix:** Stat the file **before** the transaction and pass the size in:

```typescript
const fileSize = fs.statSync(filePath).size

const insertedBelge = await db.transaction(async (tx) => {
  const [row] = await tx.insert(belge).values({
    // ...
    dosya_boyutu: fileSize,
    // ...
  }).returning()
  // ...
})
```

---

### WR-05: Missing database CHECK constraints on enum text columns

**File:** `lib/schema.ts:295–310, 359–375`
**Issue:** `belge.kategori` and `docxSablon.belge_turu` are stored as plain `text` with no `CHECK` constraint. Application-level Zod validation protects the happy path, but direct DB inserts, migrations, or future code paths can store invalid values. By contrast, `docxSablon.kategori` already has a `check('kategori_check', ...)`.

**Fix:** Add CHECK constraints:

```typescript
// docxSablon table
belge_turu: text('belge_turu'),
// ...
check('belge_turu_check', sql`${t.belge_turu} IS NULL OR ${t.belge_turu} IN ('Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer')`),

// belge table
check('belge_kategori_check', sql`${t.kategori} IN ('Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer')`),
```

---

### WR-06: Empty slug not validated before filename construction

**File:** `lib/docx/archive.ts:87,103`
**Issue:** If `slugify` returns an empty string (e.g., input is all non-ASCII punctuation after Turkish mapping), `muvekkilSlug` or `plakaSlug` becomes `""`. `buildArchivePath` then produces filenames like `-1.pdf` or `--1.pdf`, which are invalid or confusing.

**Fix:** Validate slugs after extraction:

```typescript
const muvekkilSlug = String((muvekkilResult.result as { slug?: string })?.slug ?? '')
if (!muvekkilSlug) {
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Müvekkil slug boş döndü.' })
}
```

---

## Info

### IN-01: `belge_turu` column lacks Drizzle `$type` generic

**File:** `lib/schema.ts:369`
**Issue:** `belge_turu: text('belge_turu')` is typed as generic `string | null`. The project already uses `$type<string[]>()` for `degiskenler`. Applying the same pattern here would eliminate the `as` casts in the frontend (`sablon-yonetimi-section.tsx:255`).

**Fix:**
```typescript
belge_turu: text('belge_turu').$type<BelgeKategori | null>(),
```

---

### IN-02: Test mocks include non-protocol field `exitCode`

**File:** `lib/docx/__tests__/archive.test.ts:166,185,199,209,219,229,239`
**Issue:** Mocked `runSidecarCommand` results include `exitCode: 0` (or `1`), which is not part of `CommandResultSchema`. While Vitest doesn't enforce the contract, mismatched mocks hide real shape bugs (as seen in CR-02).

**Fix:** Remove `exitCode` from mocks and align `result` shapes with the actual protocol:
```typescript
.mockResolvedValueOnce({ status: 'success', result: { slug: 'ali-veli' } })
```

---

### IN-03: `console.error` used instead of structured logging in TypeScript

**File:** `lib/docx/archive.ts:20,25` and `lib/trpc/routers/sablon.ts:17,22`
**Issue:** Python sidecar uses `structlog` for structured JSONL logging, but the TS layer falls back to `console.error`. This creates inconsistent observability and makes log aggregation harder.

**Fix:** Replace `console.error` calls with the project's TS logger (e.g., `pino`, `winston`, or a custom wrapper) if one exists; otherwise, consider standardizing on a single logging approach.

---

_Reviewed: 2026-04-21_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
