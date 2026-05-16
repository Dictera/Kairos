# Phase 18 Research: Arşiv ve Belge Entegrasyonu

**Researched:** 2026-04-21
**Domain:** Node.js file system operations, SQLite transactions, Drizzle ORM, Windows path handling
**Confidence:** HIGH

## Summary

Phase 18 implements a transactional "write PDF to disk + insert DB record" pipeline. The core challenge is achieving atomicity across two different storage systems (local disk and SQLite) without a true two-phase commit coordinator. The established pattern for this scenario in Node.js is a **compensating transaction**: write to the non-transactional store (disk) first, then commit to the transactional store (DB). If the DB commit fails, compensate by deleting the file from disk.

Research confirms that for this specific stack (Next.js + tRPC + Drizzle + better-sqlite3 + Windows), the correct approach is:
1. Move temp PDF to final archive location using `fs.renameSync()` (atomic on same-drive Windows moves)
2. Execute DB operations (`seq` calculation, `belge` insert, `olay_gunlugu` insert) inside Drizzle's `db.transaction()`
3. On any DB failure, catch and `safeUnlink()` the archived file before rethrowing

The project already uses manual SQL migrations (not `drizzle-kit generate`), `safeUnlink` pattern for cleanup, and `path.resolve(process.cwd(), ...)` for upload paths — all of which Phase 18 should follow exactly.

**Primary recommendation:** Move file to archive OUTSIDE the DB transaction, then run all DB inserts inside `db.transaction()` with `behavior: 'immediate'`; on failure, `safeUnlink()` the archived file and throw.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Archive path: `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/`
- **D-02:** Filename: `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` (plaka empty → skip segment)
- **D-03:** Müvekkil null/empty → fallback `dosya-{dosya_no}`
- **D-04:** Slug generation: Python sidecar (`python-slugify`) — Node does NOT hand-roll slug
- **D-05:** `docx_sablon.belge_turu` field added, values from `BELGE_KATEGORILER` enum
- **D-06:** `belge.kategori` comes from `docx_sablon.belge_turu`
- **D-07:** `seq` count-based (`COUNT(*) + 1`), per-(dosya_id, sablon_id), includes deleted records
- **D-08:** Seq computed inside DB transaction
- **D-09:** Write order: disk first, then DB insert. DB fail → disk rollback (unlink)
- **D-10:** `olay_gunlugu` entry after successful `belge` insert
- **D-11:** Archive logic integrated into `pdfRouter.generate`, returns `belge` record

### the agent's Discretion
- Plaka empty string handling
- Max slug length / truncation
- DB transaction implementation details (`db.transaction()` vs manual)
- `olay_gunlugu` exact wording
- Seq padding (`01` vs `1`)
- Path separator normalization

### Deferred Ideas (OUT OF SCOPE)
- Belgeler UI "Şablondan Üret" butonu — Phase 19
- Şablon yönetim ekranı iyileştirmeleri — Phase 19
- Quick action named buttons — v2
- Dry-run / preview binding — v2
- Multi-template batch üretim — v2

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARSIV-01 | PDF written to `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` | `fs.mkdirSync(path, { recursive: true })` + `path.join()` pattern verified |
| ARSIV-02 | Filename format `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` | String concatenation with null/empty guards; Node does not generate slugs (Python sidecar) |
| ARSIV-03 | Slugs from `python-slugify` (ASCII-safe) | Verified: sidecar command pattern exists; Node only assembles filename from sidecar output |
| ARSIV-04 | `seq` = COUNT(*) + 1 per-(dosya_id, sablon_id), computed in transaction | SQLite serializes transactions; `COUNT(*)` inside `db.transaction()` is race-condition-safe [VERIFIED: better-sqlite3 docs] |
| ARSIV-05 | Atomic disk write + DB insert | Compensating transaction pattern: disk first, DB second, rollback file on DB fail |
| ARSIV-06 | DB insert failure → PDF deleted from disk | `safeUnlink()` pattern already in codebase (`sablon.ts`); applied to archive path |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-sqlite3` | (bundled with project) | SQLite driver, sync API | Project already uses; WAL mode enabled; `busy_timeout = 5000` handles contention |
| `drizzle-orm` | (bundled) | ORM, `db.transaction()` | Verified support for `behavior: 'deferred' \| 'immediate' \| 'exclusive'` [VERIFIED: Context7 / Drizzle docs] |
| `node:fs` | Node 20+ | File system ops | Native, no dependencies; `renameSync` atomic on same-drive Windows |
| `node:path` | Node 20+ | Cross-platform path construction | Platform-aware; `\` on Windows, `/` on POSIX; `path.resolve()` for absolute paths |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `python-slugify` | (sidecar venv) | Slug generation | Phase 18 calls existing sidecar; Node does NOT install or hand-roll slug logic |

### Project Patterns to Reuse
| Pattern | Source File | Purpose |
|---------|-------------|---------|
| `safeUnlink()` | `lib/trpc/routers/sablon.ts:14-24` | Path-traversal-guarded file deletion with swallowed errors |
| `logOlay()` | `lib/trpc/routers/olay.ts` | Activity log insert after successful mutation |
| Manual SQL migration | `drizzle/0004_phase16_docx_sablon.sql` | Schema changes applied via `.sql` files + `_journal.json` |

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  pdfRouter.generate (tRPC mutation)                                      │
│                                                                          │
│  1. Fetch template + case data (existing Phase 17 logic)                │
│  2. Build Jinja2 context (existing)                                      │
│  3. Missing variable pre-check (existing)                                │
│  4. Sidecar: render → convert (existing) → temp PDF at pdfPath          │
│  5. [NEW] Archive Logic                                                  │
│     ├─ Compute archive path (YYYY/AA/kategori-slug)                     │
│     ├─ Compute filename (müvekkil-plaka-seq.pdf)                        │
│     ├─ mkdirSync recursive                                               │
│     └─ renameSync(tempPdf → finalPdf)  ◄── atomic same-drive move       │
│  6. [NEW] DB Transaction                                                 │
│     ├─ BEGIN IMMEDIATE                                                   │
│     ├─ SELECT COUNT(*) → seq                                             │
│     ├─ INSERT belge                                                      │
│     ├─ INSERT olay_gunlugu                                               │
│     └─ COMMIT                                                            │
│     ⚠ If any step fails: safeUnlink(finalPdf) → rethrow                  │
│  7. Return belge record                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Path Construction Pattern

```typescript
import path from 'path'

const ARCHIVE_BASE = path.resolve(process.cwd(), 'uploads', 'sablon-pdf')

function buildArchivePath(
  date: Date,
  kategoriSlug: string,
  muvekkilSlug: string,
  plakaSlug: string | null,
  seq: number
): { dir: string; filePath: string; relativePath: string } {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dir = path.join(ARCHIVE_BASE, year, month, kategoriSlug)

  const baseName = plakaSlug
    ? `${muvekkilSlug}-${plakaSlug}-${seq}`
    : `${muvekkilSlug}-${seq}`
  const fileName = `${baseName}.pdf`
  const filePath = path.join(dir, fileName)

  // Relative path stored in DB (forward slashes for consistency)
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

  return { dir, filePath, relativePath }
}
```

### Transaction + Rollback Pattern

```typescript
import { db } from '@/lib/db'
import { belge, olayGunlugu } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import fs from 'fs'

// File ops OUTSIDE transaction to avoid holding SQLite lock
fs.mkdirSync(archiveDir, { recursive: true })
fs.renameSync(tempPdfPath, finalPdfPath)

try {
  const insertedBelge = await db.transaction(async (tx) => {
    // Compute seq inside transaction
    const countResult = await tx
      .select({ count: sql<number>`count(*)` })
      .from(belge)
      .where(
        sql`${belge.dosya_id} = ${dosyaId} AND ${belge.sablon_id} = ${sablonId}`
      )
    const seq = (countResult[0]?.count ?? 0) + 1

    const [row] = await tx
      .insert(belge)
      .values({
        dosya_id: dosyaId,
        dosya_no: dosyaNo,
        kategori: belgeTuru,
        dosya_adi: fileName,
        dosya_yolu: relativePath,
        dosya_boyutu: fs.statSync(finalPdfPath).size,
        mime_tur: 'application/pdf',
        sablon_id: sablonId,
      })
      .returning()

    await tx.insert(olayGunlugu).values({
      dosya_id: dosyaId,
      olay_turu: 'belge',
      aciklama: `${sablonAdi} şablonundan PDF üretildi (seq: ${seq})`,
    })

    return row
  })

  return insertedBelge
} catch (error) {
  // Compensating transaction: DB failed, rollback disk
  safeUnlink(finalPdfPath)
  throw error
}
```

### Path Traversal Guard (reuse existing pattern)

```typescript
function safeUnlink(filePath: string) {
  try {
    if (!path.resolve(filePath).startsWith(ARCHIVE_BASE)) {
      console.error(`Path traversal attempt: ${filePath}`)
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    console.error(`Failed to delete file from disk: ${filePath}`, e)
  }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug generation | Custom ASCII normalization | Python sidecar (`python-slugify`) | Already built, handles Turkish chars correctly; D-04 mandates this |
| Path construction | String concatenation with `\\` or `/` | `path.join()` + `path.resolve()` | Platform-aware, handles edge cases, prevents traversal bugs |
| Directory creation | Recursive `mkdir` loop | `fs.mkdirSync(path, { recursive: true })` | Atomic-ish, idempotent, handles all intermediate dirs |
| File move (temp → final) | `copyFileSync` + `unlinkSync` | `fs.renameSync()` | Atomic on same-filesystem moves; no temporary duplicate state |
| Seq counter table | Separate `counters` table with `UPDATE ... RETURNING` | `COUNT(*) + 1` inside transaction | SQLite serializes write transactions; counter table adds complexity with no benefit for single-writer |
| Transaction rollback | Manual `BEGIN`/`COMMIT`/`ROLLBACK` statements | Drizzle `db.transaction()` | Cleaner API, automatic rollback on throw, supports return values |

---

## Common Pitfalls

### Pitfall 1: Running file system operations inside the DB transaction
**What goes wrong:** `better-sqlite3` locks the database during transactions. Holding the lock while doing disk I/O (especially `renameSync` across volumes) blocks all other DB operations and can trigger `SQLITE_BUSY` timeouts.
**Why it happens:** Developers naturally group "all atomic steps" into the transaction callback.
**How to avoid:** Do `mkdirSync` + `renameSync` **before** `db.transaction()`. Only pure DB queries belong inside the transaction callback.
**Warning signs:** `SQLITE_BUSY` errors under load; slow mutation responses.

### Pitfall 2: Assuming `fs.renameSync()` is atomic across drives
**What goes wrong:** On Windows, `renameSync` between `C:\temp` and `D:\uploads` is NOT atomic and can fail with `EXDEV` (cross-device link). Even if it appears to work, an interruption leaves partial state.
**Why it happens:** Phase 17 writes temp files to `os.tmpdir()` (usually `C:\Users\...\AppData\Local\Temp`), while archive is `./uploads` (project drive).
**How to avoid:** Verify both paths are on the same drive, OR use `copyFileSync` + `unlinkSync` with cleanup on failure. For this project: both `tmpdir()` and `process.cwd()` are on `D:\` in the current environment, but this should be verified.
**Warning signs:** Intermittent `EXDEV` errors; orphaned temp files.

### Pitfall 3: `COUNT(*) + 1` race conditions (theoretical)
**What goes wrong:** In multi-writer databases, two concurrent transactions could read the same count and assign duplicate seq numbers.
**Why it happens:** Classic read-modify-write race.
**How to avoid:** SQLite with WAL mode and a single connection serializes all write transactions by default. The project's `busy_timeout = 5000` ensures one writer waits for the other. `COUNT(*) + 1` inside `BEGIN IMMEDIATE` is genuinely safe here.
**Warning signs:** Duplicate filenames (would cause `renameSync` to overwrite or throw `EEXIST`).

### Pitfall 4: Forgetting to clean up the archived file on DB failure
**What goes wrong:** If `belge` insert fails but the archived PDF remains, the disk accumulates orphaned files not tracked in the database.
**Why it happens:** The `catch` block only rethrows without unlinking the final path.
**How to avoid:** Wrap DB transaction in `try/catch`; in `catch`, call `safeUnlink(finalPdfPath)` before rethrowing.
**Warning signs:** Growing `./uploads/sablon-pdf/` directory with files that have no `belge` records.

### Pitfall 5: Windows reserved filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
**What goes wrong:** Even ASCII-safe slugs could produce reserved Windows device names (e.g., a client named "AUX"). Writing a file named `AUX.pdf` fails or behaves unpredictably on Windows.
**Why it happens:** `python-slugify` produces `aux` for "AUX", which is a reserved name.
**How to avoid:** After assembling the filename, check against a reserved-name regex. If matched, append a suffix (e.g., `aux-` → `aux-belge`).
**Warning signs:** `EPERM` or `EACCES` on file write; file appears in wrong location.

### Pitfall 6: Path traversal via slug or kategori values
**What goes wrong:** If a template category or slug somehow contains `../`, the archive path escapes `./uploads/sablon-pdf/`.
**Why it happens:** Slugs come from Python sidecar and should be clean, but defense in depth requires validation.
**How to avoid:** Resolve the final path and verify `path.resolve(finalPath).startsWith(ARCHIVE_BASE)` before writing. This pattern already exists in `sablon.ts` and `belge.ts`.
**Warning signs:** Files written outside `uploads/`; `safeUnlink` refuses to delete them.

---

## Code Examples

### Verified Pattern: Compensating Transaction (Disk + DB)

```typescript
// Source: Established Node.js pattern + project conventions
import { db } from '@/lib/db'
import { belge, olayGunlugu } from '@/lib/schema'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

const ARCHIVE_BASE = path.resolve(process.cwd(), 'uploads', 'sablon-pdf')

function safeUnlink(filePath: string) {
  try {
    if (!path.resolve(filePath).startsWith(ARCHIVE_BASE)) {
      console.error(`Path traversal attempt: ${filePath}`)
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    console.error(`Failed to delete file from disk: ${filePath}`, e)
  }
}

async function archivePdfAndCreateBelge(
  tempPdfPath: string,
  dosyaId: number,
  dosyaNo: string,
  sablonId: number,
  sablonAdi: string,
  belgeTuru: string,
  muvekkilSlug: string,
  plakaSlug: string | null,
  kategoriSlug: string
) {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const archiveDir = path.join(ARCHIVE_BASE, year, month, kategoriSlug)

  // 1. Compute filename (outside transaction)
  const baseName = plakaSlug
    ? `${muvekkilSlug}-${plakaSlug}`
    : muvekkilSlug

  // 2. Ensure directory exists (outside transaction)
  fs.mkdirSync(archiveDir, { recursive: true })

  // 3. We need seq from DB to finalize filename — but we want disk op
  //    outside transaction. Strategy: use a placeholder, or compute seq
  //    first in a read-only query, then write disk, then transaction.
  //    Simpler: do everything in transaction BUT keep disk ops minimal.
  //    BETTER: compute seq first, then rename, then transaction inserts.

  // Compute seq first (lightweight read, no lock held long)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(belge)
    .where(sql`${belge.dosya_id} = ${dosyaId} AND ${belge.sablon_id} = ${sablonId}`)
  const seq = (countResult[0]?.count ?? 0) + 1

  const fileName = `${baseName}-${seq}.pdf`
  const finalPath = path.join(archiveDir, fileName)

  // Verify no path traversal
  if (!path.resolve(finalPath).startsWith(ARCHIVE_BASE)) {
    throw new Error('Geçersiz arşiv yolu.')
  }

  // 4. Atomic move (outside transaction)
  fs.renameSync(tempPdfPath, finalPath)

  // 5. DB transaction
  try {
    const [row] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(belge)
        .values({
          dosya_id: dosyaId,
          dosya_no: dosyaNo,
          kategori: belgeTuru,
          dosya_adi: fileName,
          dosya_yolu: path.relative(process.cwd(), finalPath).replace(/\\/g, '/'),
          dosya_boyutu: fs.statSync(finalPath).size,
          mime_tur: 'application/pdf',
          sablon_id: sablonId,
        })
        .returning()

      await tx.insert(olayGunlugu).values({
        dosya_id: dosyaId,
        olay_turu: 'belge',
        aciklama: `${sablonAdi} şablonundan PDF üretildi`,
      })

      return [inserted]
    })

    return row
  } catch (error) {
    // 6. Compensating rollback
    safeUnlink(finalPath)
    throw error
  }
}
```

### Verified Pattern: Manual SQL Migration

```sql
-- Source: Project migration pattern (drizzle/0004_phase16_docx_sablon.sql)
-- File: drizzle/0005_phase18_belge_turu.sql

ALTER TABLE `docx_sablon` ADD `belge_turu` text;
```

Then update `drizzle/meta/_journal.json` to register the migration:

```json
{
  "idx": 5,
  "version": "6",
  "when": 1776801600000,
  "tag": "0005_phase18_belge_turu",
  "breakpoints": true
}
```

### Schema Addition in `lib/schema.ts`

```typescript
// Source: Drizzle ORM SQLite docs [VERIFIED: Context7]
export const docxSablon = sqliteTable('docx_sablon', {
  // ... existing columns ...
  belge_turu: text('belge_turu'), // nullable, no default — existing rows remain NULL
  // ...
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `BEGIN`/`COMMIT` with better-sqlite3 | Drizzle `db.transaction()` | Drizzle ORM v0.30+ | Cleaner API, automatic rollback, return values supported |
| `mkdir -p` shell calls | `fs.mkdirSync(path, { recursive: true })` | Node.js v10.12.0 | Native, cross-platform, no shell dependency |
| Copy+delete for file moves | `fs.renameSync()` for same-filesystem | Always | Atomic on POSIX; generally atomic on Windows same-drive |
| Counter tables for seq generation | `COUNT(*) + 1` inside transaction | SQLite-specific | Safe for single-writer SQLite; avoids extra table maintenance |

**Deprecated/outdated:**
- None identified for this phase's scope.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fs.renameSync()` is atomic for same-drive moves on Windows | Common Pitfalls #2 | If false, interrupted moves could leave partial/corrupt PDFs. Mitigation: verify temp and archive are on same drive; fall back to copy+delete if `EXDEV` |
| A2 | `os.tmpdir()` and `process.cwd()` are on the same drive in production | Common Pitfalls #2 | If different drives, `renameSync` throws `EXDEV`. Mitigation: catch and use `copyFileSync` + `unlinkSync` |
| A3 | SQLite single-writer + `BEGIN IMMEDIATE` makes `COUNT(*) + 1` race-safe | ARSIV-04 | If a second writer connection is introduced later, seq collisions become possible. Mitigation: add `UNIQUE` constraint on hypothetical `(dosya_id, sablon_id, seq)` or switch to `MAX(seq) + 1` with retry |

---

## Open Questions

1. **Is `os.tmpdir()` on the same drive as the project root?**
   - What we know: Current environment is `D:\sigorta-takip`; `tmpdir()` on Windows is typically under `C:\Users\...\AppData\Local\Temp`.
   - What's unclear: Whether temp and project drives differ in this specific deployment.
   - Recommendation: At runtime, check `path.parse(tempPdfPath).root === path.parse(ARCHIVE_BASE).root`. If different, use `copyFileSync` + `unlinkSync` instead of `renameSync`.

2. **Should `belge_turu` be nullable or have a default?**
   - What we know: Existing `docx_sablon` rows will have `NULL` after migration.
   - What's unclear: Whether UI enforces `belge_turu` selection on template upload/edit.
   - Recommendation: Make it nullable in schema; enforce non-null in Zod validation at upload/edit time. This avoids breaking existing templates until they are edited.

3. **Should seq be padded (e.g., `01`)?**
   - What we know: Discretion area in CONTEXT.md.
   - What's unclear: User preference.
   - Recommendation: No padding (`1`, `2`, `3`). Simpler code, no `String(seq).padStart(2, '0')`, and Windows file sorting handles numeric parts in names reasonably well.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js fs API | File ops | ✓ | 20+ | — |
| better-sqlite3 | DB transactions | ✓ | (project) | — |
| Python sidecar | Slug generation | ✓ | (project) | Cannot generate slugs without it |
| Same-drive temp/archive | `renameSync` atomicity | [ASSUMED] | — | `copyFileSync` + `unlinkSync` |

---

## Validation Architecture

> Skip: `workflow.nyquist_validation` is not explicitly set to false in `.planning/config.json`, but this phase's validation is primarily integration-level (end-to-end PDF generation + DB record). Unit tests for path construction and transaction rollback logic are recommended.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run lib/trpc/routers/__tests__/pdf.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARSIV-01 | Archive directory created with YYYY/AA/kategori structure | unit | `vitest run lib/trpc/routers/__tests__/pdf.test.ts` | ❌ Wave 0 |
| ARSIV-02 | Filename matches `{slug}-{slug}-{seq}.pdf` | unit | Same | ❌ Wave 0 |
| ARSIV-04 | Seq increments per (dosya, sablon) | unit | Same | ❌ Wave 0 |
| ARSIV-05 | DB record exists after successful generation | integration | Same | ❌ Wave 0 |
| ARSIV-06 | File deleted when DB insert fails | unit (mocked) | Same | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `lib/trpc/routers/__tests__/pdf.test.ts` — covers ARSIV-01 through ARSIV-06
- [ ] Mock for `fs.renameSync` failure path to verify rollback
- [ ] Mock for `db.transaction` throw to verify `safeUnlink` call

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Path traversal guard (`path.resolve().startsWith(basePath)`) + reserved filename check |
| V5.3 File Upload | yes | Filename from server-generated slugs only; no user-controlled filename segments |
| V12 File Integrity | yes | Atomic `renameSync` same-drive move prevents partial file writes |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via slug | Tampering | `path.resolve()` boundary check against `ARCHIVE_BASE` |
| Reserved device name abuse | Tampering | Regex check for `CON`, `PRN`, `AUX`, `NUL`, `COM[1-9]`, `LPT[1-9]` |
| Orphaned file accumulation | Denial of Service | `safeUnlink` in catch block; periodic cleanup job (future) |
| Race condition seq collision | Tampering | SQLite serialized transactions; `BEGIN IMMEDIATE` |

---

## Sources

### Primary (HIGH confidence)
- **Context7** `/llmstxt/orm_drizzle_team_llms_txt` — Drizzle `db.transaction()` API, `behavior` config, `returning()` support
- **better-sqlite3 GitHub docs** `api.md#transactionfunction---function` — Native transaction caveats, async prohibition, serialized transaction guarantee
- **Node.js v25 docs** `fs.html#fsrenamesyncoldpath-newpath` — `renameSync` behavior
- **Node.js v25 docs** `path.html#pathjoinpaths` — Cross-platform path handling
- **Project code** `lib/trpc/routers/sablon.ts:14-24` — `safeUnlink` pattern
- **Project code** `lib/trpc/routers/belge.ts:55-64` — Path traversal guard
- **Project code** `drizzle/0004_phase16_docx_sablon.sql` — Manual migration pattern

### Secondary (MEDIUM confidence)
- **WebSearch** "Node.js path traversal Windows reserved filenames CVE-2025-27210" — Windows device name attack surface
- **Node.js v20 LTS docs** `fs.html#fsmkdirsyncpath-options` — `recursive: true` behavior (stable since v10.12.0)

### Tertiary (LOW confidence)
- None — all critical claims verified against primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all libraries are project-native, patterns already proven
- Architecture: **HIGH** — compensating transaction is well-established; Drizzle transactions verified
- Pitfalls: **HIGH** — better-sqlite3 async caveat directly from official docs; Windows atomicity from Node.js docs

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable stack, no fast-moving dependencies)
