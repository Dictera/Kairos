# Phase 18 Validation Report

**Phase:** 18-arsiv-ve-belge-entegrasyonu  
**Date:** 2026-04-21  
**Status:** PLANS REVIEWED — READY FOR EXECUTION WITH NOTES  
**Scope:** Validate 3 execution plans (18-01, 18-02, 18-03) against live codebase, decisions, research, and requirements.

---

## Executive Summary

| Plan | Verdict | Blockers | Risk Level |
|------|---------|----------|------------|
| **18-01** | ✅ PASS | None | LOW |
| **18-02** | ✅ PASS with notes | None | MEDIUM |
| **18-03** | ⚠️ CONDITIONAL PASS | UI form type inference gap | MEDIUM |
| **Overall** | ✅ EXECUTABLE | Review notes before execution | LOW-MEDIUM |

All three plans are internally consistent, reference correct source files, and align with the research-backed compensating-transaction pattern. Three minor implementation notes were identified that should be addressed during execution (not blockers).

---

## 1. Pre-Flight Checks

### 1.1 Decision Consistency

All locked decisions from `18-CONTEXT.md` are covered by at least one plan:

| Decision | Plan | Task | Verified |
|----------|------|------|----------|
| D-01 (archive path) | 18-02 | `buildArchivePath` | ✅ |
| D-02 (filename format) | 18-02 | `buildArchivePath` | ✅ |
| D-03 (müvekkil fallback) | 18-02 | `generateSlugs` | ✅ |
| D-04 (Python slug) | 18-01 | Sidecar slug command | ✅ |
| D-05 (belge_turu schema) | 18-01 | Schema migration | ✅ |
| D-06 (belge.kategori source) | 18-03 | pdfRouter + UI | ✅ |
| D-07 (seq count-based) | 18-02 | `archivePdfAndCreateBelge` | ✅ |
| D-08 (seq in transaction) | 18-02 | `archivePdfAndCreateBelge` | ⚠️ See Note A |
| D-09 (disk first, rollback) | 18-02 | `archivePdfAndCreateBelge` | ✅ |
| D-10 (olay_gunlugu) | 18-02 | `archivePdfAndCreateBelge` | ✅ |
| D-11 (pdfRouter integration) | 18-03 | pdfRouter.generate | ✅ |

### 1.2 Requirement Coverage

| Req ID | Requirement | Plan(s) | Coverage |
|--------|-------------|---------|----------|
| ARSIV-01 | PDF written to `./uploads/sablon-pdf/YYYY/AA/{kategori-slug}/` | 18-02 | ✅ Full |
| ARSIV-02 | Filename `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` | 18-02 | ✅ Full |
| ARSIV-03 | Slugs from `python-slugify` (ASCII-safe) | 18-01, 18-02 | ✅ Full |
| ARSIV-04 | Seq = COUNT(*) + 1 per-(dosya_id, sablon_id) | 18-02 | ⚠️ See Note A |
| ARSIV-05 | Atomic disk write + DB insert | 18-02 | ✅ Full |
| ARSIV-06 | DB failure → PDF deleted from disk | 18-02, 18-03 | ✅ Full |

### 1.3 File Inventory

All referenced files exist in the working directory (verified via live read):

| File | Exists | Role in Phase 18 |
|------|--------|------------------|
| `lib/schema.ts` | ✅ | Schema source; `docxSablon` table, `BELGE_KATEGORILER` |
| `lib/db.ts` | ✅ | Drizzle connection; `db.transaction()` provider |
| `lib/pipeline/protocol.ts` | ✅ | Sidecar command enum |
| `scripts/docx-pipeline/main.py` | ✅ | Sidecar handler dispatcher |
| `scripts/docx-pipeline/requirements.txt` | ✅ | `python-slugify>=8.0` confirmed present |
| `lib/validators/sablon.ts` | ✅ | Zod schemas to extend |
| `lib/trpc/routers/sablon.ts` | ✅ | CRUD mutations to update |
| `lib/trpc/routers/pdf.ts` | ✅ | Integration target for archive logic |
| `lib/trpc/routers/olay.ts` | ✅ | `logOlay` export confirmed |
| `lib/services/docx-pipeline.ts` | ✅ | `runSidecarCommand()` export confirmed |
| `components/ayarlar/sablon-yonetimi-section.tsx` | ✅ | UI target for `belge_turu` dropdown |
| `drizzle/meta/_journal.json` | ✅ | Migration registry (idx 4 currently) |
| `lib/validators/pdf.ts` | ✅ | `pdfGenerateSchema` confirmed simple |

---

## 2. Plan-by-Plan Validation

### Plan 18-01: Schema, Sidecar Slug, Şablon Validator/Router

**Verdict:** ✅ **PASS** — No blockers.

| Task | File(s) | Checks |
|------|---------|--------|
| T1: Schema + migration | `lib/schema.ts`, `drizzle/0005_phase18_belge_turu.sql`, `drizzle/meta/_journal.json` | ✅ `belge_turu` added after `default_aksiyon` (nullable, no default) — matches D-05. ✅ Migration SQL is simple `ALTER TABLE`. ✅ Journal entry idx 5 follows existing idx 4. |
| T2: Sidecar slug command | `lib/pipeline/protocol.ts`, `scripts/docx-pipeline/main.py` | ✅ Enum extended with `'slug'`. ✅ `python-slugify` is in `requirements.txt`. ✅ `handle_slug` implementation is correct. ⚠️ **NOTE:** `handler_map` in `main.py` must also include `"slug": handle_slug` — plan mentions this but verify during execution. |
| T3: Validator + router update | `lib/validators/sablon.ts`, `lib/trpc/routers/sablon.ts` | ✅ `BELGE_KATEGORILER` import path is correct. ✅ `.optional()` allows nulls for backward compat. ✅ `?? null` coalescing in router handles undefined. |

**Threat Model Check:**
- T-18-01 (slug tampering): `allow_unicode=False` guarantees ASCII. ✅
- T-18-02 (belge_turu tampering): `z.enum(BELGE_KATEGORILER)` rejects unknown values. ✅
- T-18-03 (migration PII): DDL only, no PII. ✅

---

### Plan 18-02: Archive Module + Unit Tests

**Verdict:** ✅ **PASS with notes** — Two implementation details to watch.

| Task | File(s) | Checks |
|------|---------|--------|
| T1: `lib/docx/archive.ts` | New file | ✅ Exports all 6 required functions. ✅ `ARCHIVE_BASE` uses `path.resolve(process.cwd(), ...)` pattern. ✅ `buildArchivePath` constructs `YYYY/AA/kategori-slug`. ✅ `isReservedWindowsName` guards against CON/PRN/AUX/NUL/COM/LPT. ✅ `safeUnlinkArchive` mirrors existing `safeUnlink` pattern. ✅ `generateSlugs` uses sidecar with fallback `dosya-{dosyaNo}`. ✅ `archivePdfAndCreateBelge` implements compensating transaction. |
| T2: Unit tests | `lib/docx/__tests__/archive.test.ts` | ✅ Vitest-based. ✅ Mocked sidecar and fs. ✅ Covers path traversal, reserved names, filename format, slug fallback. ❌ **Note A** — Seq computation test strategy should be clarified (see below). |

**Note A: Seq computation timing**
The plan states seq is computed "outside DB tx" via a lightweight `COUNT(*)` read, then disk ops happen, then DB transaction only does inserts. This is the correct pattern per RESEARCH.md Pitfall #1 (don't hold SQLite lock during disk I/O). However, the research also notes that `COUNT(*) + 1` inside `BEGIN IMMEDIATE` is race-safe for single-writer SQLite. The plan's approach (read outside, write inside) is still safe because:
1. The count is only used for filename generation.
2. If a race occurs and two PDFs get the same seq, the second `renameSync` to the same path will throw `EEXIST` (or overwrite if flags allow), which should be caught and handled.

**Recommendation during execution:** Add a fallback in `archivePdfAndCreateBelge` that retries with `seq + 1` if `renameSync` throws `EEXIST`.

**Note B: `EXDEV` (cross-device move) fallback**
The plan correctly identifies the `EXDEV` risk and includes a `copyFileSync + unlinkSync` fallback. This should be verified in execution by checking whether `os.tmpdir()` and `process.cwd()` are on the same drive in the target deployment.

**Threat Model Check:**
- T-18-04 (path traversal): `path.resolve(filePath).startsWith(ARCHIVE_BASE)` guard. ✅
- T-18-05 (reserved filename): `-belge` suffix mutation. ✅
- T-18-06 (orphaned files): `safeUnlinkArchive` in catch block. ✅
- T-18-07 (seq collision): Research confirms single-writer safety. ⚠️ Mitigation noted above.
- T-18-08 (cross-device move): `EXDEV` catch with copy+delete fallback. ✅

---

### Plan 18-03: pdfRouter Integration + Template UI

**Verdict:** ⚠️ **CONDITIONAL PASS** — One UI type-system gap to resolve during execution.

| Task | File(s) | Checks |
|------|---------|--------|
| T1: pdfRouter.generate integration | `lib/trpc/routers/pdf.ts` | ✅ Imports `archivePdfAndCreateBelge` and `generateSlugs`. ✅ `muvekkilAd` extracted from `rows.muvekkil`. ✅ `plaka` from `rows.muvekkil_plaka`. ✅ `belgeTuru` fallback to `'Diğer'` if template has no type. ✅ Temp PDF cleanup on archive failure via `try/catch`. ✅ Return type changed from `{ pdfPath }` to `{ success: true, belge }`. |
| T2: Template UI belge_turu | `components/ayarlar/sablon-yonetimi-section.tsx` | ✅ `BELGE_KATEGORILER` import added. ✅ `belge_turu` added to `sablonFormSchema` as `.optional()`. ✅ Upload dialog gets a `<Select>` dropdown. ✅ Overwrite dialog gets a local state `overwriteBelgeTuru`. ✅ `createSablon.mutateAsync` passes `belge_turu`. ✅ `updateSablon.mutateAsync` passes `belge_turu`. ⚠️ **Note C** — Type inference for `SablonFormValues` and mutation inputs must be verified after schema change. |

**Note C: UI Type Inference**
The current `sablonFormSchema` is:
```typescript
const sablonFormSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  kategori: z.enum(SABLON_KATEGORILER),
})
```
After adding `belge_turu: z.enum(BELGE_KATEGORILER).optional()`, the inferred type will have `belge_turu?: 'Dilekçe' | 'Karar' | ...`. The form's `defaultValues` currently only sets `{ ad: '', kategori: 'STK' }`. During execution, ensure `defaultValues` includes `belge_turu: undefined` to satisfy React Hook Form's type expectations. Also, the `onCreateSubmit` destructures `values: SablonFormValues` — after schema change, `values.belge_turu` may be `undefined`, which is fine because the router uses `?? null`.

Similarly, the `overwriteTarget` state is typed as `(typeof templates)[number]`. After the schema adds `belge_turu`, this field will appear in the template list query result type. The `overwriteBelgeTuru` state initialization from `overwriteTarget.belge_turu` is correct, but ensure the component re-renders properly when a new overwrite target is selected.

**Threat Model Check:**
- T-18-09 (archive tampering): `belgeTuru` sourced from DB template, not client. ✅
- T-18-10 (info disclosure): Returning full `belge` record is intentional. ✅
- T-18-11 (UI tampering): Zod enum validation on both create and update. ✅

---

## 3. Cross-Reference Integrity

### 3.1 Plan Dependencies

```
18-01 (Wave 1) ──┬──→ 18-02 (Wave 2)
                 └──→ 18-03 (Wave 3)
```

- ✅ 18-02 depends on 18-01: `docxSablon.belge_turu` must exist before `archivePdfAndCreateBelge` reads `template.belge_turu`.
- ✅ 18-03 depends on 18-01: `createSablon.mutateAsync` must accept `belge_turu`.
- ✅ 18-03 depends on 18-02: `pdfRouter.generate` must import `archivePdfAndCreateBelge`.

### 3.2 Key Links (Plan ↔ Codebase)

| From | To | Via | Pattern | Verified |
|------|-----|-----|---------|----------|
| `lib/docx/archive.ts` | `lib/services/docx-pipeline.ts` | `runSidecarCommand` | `import { runSidecarCommand }` | ✅ File exists, export confirmed |
| `lib/docx/archive.ts` | `lib/db.ts` | `db.transaction` | `import { db } from '@/lib/db'` | ✅ File exists, export confirmed |
| `lib/docx/archive.ts` | `lib/trpc/routers/olay.ts` | `logOlay` | `import { logOlay }` | ✅ File exists, export confirmed |
| `lib/trpc/routers/pdf.ts` | `lib/docx/archive.ts` | `archivePdfAndCreateBelge` | `import { archivePdfAndCreateBelge }` | ⚠️ Will exist after 18-02 |
| `lib/trpc/routers/pdf.ts` | `lib/schema.ts` | `belge` row return | `return { belge: insertedBelge }` | ✅ Schema has `belge` table |
| `components/.../sablon-yonetimi-section.tsx` | `lib/trpc/routers/sablon.ts` | `createSablon` mutation | `trpc.sablon.create.useMutation()` | ✅ Router exists, will accept new field after 18-01 |

### 3.3 Interface Contracts

**Sidecar protocol contract:**
- Request: `{ command: 'slug', params: { text: string } }`
- Success response: `{ status: 'success', result: { slug: string } }`
- Error response: `{ status: 'error', code: 1, message: string }`
- Verified against `lib/pipeline/protocol.ts` — `CommandResultSchema` supports this shape. ✅

**Archive module contract:**
```typescript
export function generateSlugs(
  muvekkilAd: string | null,
  dosyaNo: string,
  plaka: string | null
): Promise<{ muvekkilSlug: string; plakaSlug: string | null }>

export function archivePdfAndCreateBelge(
  tempPdfPath: string,
  dosyaId: number,
  dosyaNo: string,
  sablonId: number,
  sablonAdi: string,
  belgeTuru: string,
  muvekkilSlug: string,
  plakaSlug: string | null,
  kategoriSlug: string
): Promise<typeof belge.$inferSelect>
```
- Caller (`pdfRouter.generate`) will provide all required args. ✅
- Return type matches `pdfRouter.generate`'s new return shape. ✅

---

## 4. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation (in plans) |
|----|------|------------|--------|----------------------|
| R-01 | `renameSync` throws `EXDEV` (cross-device) | Low | High | Catch `EXDEV`, fallback to `copyFileSync + unlinkSync` (18-02) |
| R-02 | Seq collision under hypothetical multi-writer | Very Low | Medium | SQLite single-writer + `BEGIN IMMEDIATE`; add `EEXIST` retry if concerned (18-02) |
| R-03 | Windows reserved filename (e.g., client named "AUX") | Low | Medium | `isReservedWindowsName` appends `-belge` suffix (18-02) |
| R-04 | UI type error after `belge_turu` schema change | Medium | Low | Update `defaultValues` and verify `SablonFormValues` inference (18-03 Note C) |
| R-05 | Existing templates have `NULL` belge_turu; PDF generation fails | Low | Medium | Fallback to `'Diğer'` in `pdfRouter.generate` (18-03) |
| R-06 | Sidecar slug command not wired in `handler_map` | Low | High | Verify `"slug": handle_slug` in `main.py` dispatcher (18-01) |
| R-07 | Migration journal JSON malformed | Low | Medium | Validate JSON after edit; ensure trailing commas removed (18-01) |

---

## 5. Test Strategy Validation

### 5.1 Unit Tests (Plan 18-02)

The unit test plan covers:
- ✅ Path construction with/without plaka
- ✅ Reserved Windows names
- ✅ Path traversal guard
- ✅ Slug generation (mocked sidecar)
- ✅ Slug fallback (`dosya-{dosyaNo}`)
- ✅ Filename format validation

**Gap identified:** No explicit test for `EXDEV` fallback path (`copyFileSync + unlinkSync`). This is acceptable if the fallback is a simple catch block, but ideally covered.

### 5.2 Integration / E2E Tests

The verification section of Plan 18-03 recommends:
- Invoke `pdf.generate` with valid `dosyaId` + `sablonId`
- Verify PDF exists in `./uploads/sablon-pdf/YYYY/AA/...`
- Verify `belge` row exists with matching `dosya_yolu`
- Verify `olay_gunlugu` row exists with `olay_turu='belge'`

**Recommendation:** After all three plans are executed, run a manual E2E test through the UI (upload template with `belge_turu`, generate PDF for a case, check belge list and file system).

### 5.3 TypeScript Compilation

All three plans list `npx tsc --noEmit -p tsconfig.json --skipLibCheck` as a verification step. This is the correct single-command gate. Run it after each wave.

---

## 6. Execution Order Validation

### Recommended Wave Order

```
Wave 1: 18-01
  → Schema migration first (no runtime impact until used)
  → Sidecar slug command (independent, testable)
  → Validator/router update (enables UI and archive)

Wave 2: 18-02
  → Archive module (depends on schema + sidecar slug)
  → Unit tests (validate archive logic in isolation)

Wave 3: 18-03
  → pdfRouter integration (depends on archive module)
  → Template UI update (depends on router accepting belge_turu)
```

This order matches the plan dependencies and minimizes integration risk.

---

## 7. Open Questions from Research

| Question | Resolution | Status |
|----------|-----------|--------|
| Is `os.tmpdir()` on the same drive as project root? | Check at runtime in `archivePdfAndCreateBelge`; fall back to copy+delete if different | Resolved in plan |
| Should `belge_turu` be nullable or have default? | Plan makes it nullable in schema, enforces optional in Zod | Resolved in plan |
| Should seq be padded? | Plan uses no padding (`1`, `2`, `3`) | Resolved in plan |

---

## 8. Final Checklist Before Execution

- [x] All decisions mapped to tasks
- [x] All requirements mapped to tasks
- [x] All referenced files exist in codebase
- [x] All dependencies between plans are explicit and valid
- [x] Threat model reviewed for each plan
- [x] Research pitfalls addressed in plan tasks
- [x] TypeScript compilation gate defined for each wave
- [x] Test strategy covers core logic (unit) and integration (E2E)
- [x] Risk register reviewed — no HIGH-risk unmitigated items
- [ ] **During execution, address Note A (seq retry on EEXIST)**
- [ ] **During execution, address Note C (UI type inference / defaultValues)**

---

## 9. Artifacts Produced by This Validation

- This file: `.planning/phases/18-arsiv-ve-belge-entegrasyonu/18-VALIDATION.md`

---

*Validator: GSD Executor Agent*  
*Date: 2026-04-21*  
*Next Step: `/gsd-execute-phase 18` (after `/clear` for fresh context)*
