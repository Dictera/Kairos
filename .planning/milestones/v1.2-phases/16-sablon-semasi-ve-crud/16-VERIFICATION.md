---
phase: "16-sablon-semasi-ve-crud"
verified: "2026-04-21T12:00:00Z"
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
---

# Phase 16: Şablon Şeması ve CRUD — Verification Report

**Phase Goal:** Kullanıcı `.docx` şablonlarını kategori ile yükleyebilir, listeler, siler ve değiştirebilir; değişkenler otomatik çıkarılıp şablon kaydında saklanır.

**Verified:** 2026-04-21T12:00:00Z
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1 | Kullanıcı ad + zorunlu kategori (STK/Mahkeme/Genel) girip .docx yükleyebilir; başka formatlar reddedilir | ✓ VERIFIED | `app/api/templates/upload/route.ts` L5-33: extension AND MIME validation; `sablonCreateSchema` L7-8: `ad` required string, `kategori` enum from `SABLON_KATEGORILER`; UI `handleFileChange` L161-169 rejects non-.docx and >10MB client-side |
| 2 | Yükleme sırasında `{{ degisken }}` ve `{%p paragraf %}` placeholder'ları otomatik çıkarılıp şablon kaydına JSON olarak işlenir | ✓ VERIFIED | `scripts/docx-pipeline/main.py` L127-128: regex `\{\{\s*([^}]+?)\s*\}\}` and `\{%p\s+([^%]+?)%\}`; `normalize_var()` L123-125 removes Word-fragment whitespace; `lib/trpc/routers/sablon.ts` L34-47: sidecar IPC then DB insert with `degiskenler: variables` JSON array |
| 3 | Kullanıcı yüklediği şablonların listesini kategori + ad ile görür; mevcut şablonu silebilir veya yeniden yükleyerek (overwrite) güncelleyebilir | ✓ VERIFIED | `sablon-yonetimi-section.tsx` L64-65: `trpc.sablon.list` query with kategori filter L68,173; delete mutation L103-112 with AlertDialog confirmation L422-448; overwrite mutation L91-101 wired to overwrite dialog L370-420 |
| 4 | `docx_sablon` tablosu Drizzle schema'ya eklenir (id, ad, kategori NOT NULL CHECK, dosya_yolu, degiskenler JSON, default_aksiyon nullable, timestamps) | ✓ VERIFIED | `lib/schema.ts` L359-374: `docxSablon` table with all required columns; `kategori` NOT NULL + CHECK constraint L372; `degiskenler` JSON-mode text L364-367; `default_aksiyon` nullable L368; `created_at`/`updated_at` L369-370 |
| 5 | `belge` tablosuna nullable `sablon_id` FK alanı eklenir (şablon silindiğinde SET NULL) ve üretilmiş PDF'ler etkilenmez | ✓ VERIFIED | `lib/schema.ts` L304: `sablon_id: integer('sablon_id').references(() => docxSablon.id, { onDelete: 'set null' })`; L309 index on `sablon_id`; `sablonRouter.delete` L67: DB delete first (fires FK cascade), then `safeUnlink` disk — verified by integration test |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `lib/schema.ts` | `docxSablon` table + `belge.sablon_id` FK | ✓ VERIFIED | L359-374 `docxSablon`, L304 `sablon_id` with `set null` |
| `lib/validators/sablon.ts` | Zod schemas for CRUD | ✓ VERIFIED | 18-line file with `sablonCreateSchema`, `sablonUpdateSchema`, `sablonKategoriSchema` |
| `app/api/templates/upload/route.ts` | POST multipart handler | ✓ VERIFIED | 65-line file, defense-in-depth extension+MIME+size validation |
| `lib/trpc/routers/sablon.ts` | Full CRUD router | ✓ VERIFIED | 114-line file: list/create/delete/update all `protectedProcedure` |
| `lib/trpc/routers/_app.ts` | Router registration | ✓ VERIFIED | L17 import, L39 `sablon: sablonRouter` |
| `components/ayarlar/sablon-yonetimi-section.tsx` | UI Card | ✓ VERIFIED | 451-line component: table + filter + 3 dialogs + toast |
| `scripts/docx-pipeline/main.py` | `handle_extract_vars` | ✓ VERIFIED | L91-138: zipfile+regex extraction with Word fragmentation normalization |

---

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| Upload route | Disk | `fs.writeFileSync` | ✓ WIRED | L57 `fs.writeFileSync(filePath, buffer)` after path-traversal guard L52 |
| Upload route | tRPC create | `fetch('/api/templates/upload')` | ✓ WIRED | `sablon-yonetimi-section.tsx` L123-128 `uploadFileAndGetPath` then L136 `createSablon.mutateAsync` |
| tRPC create | Sidecar | `runSidecarCommand` | ✓ WIRED | `sablon.ts` L34-37: `{command:'extract-vars', params:{file_path: input.filePath}}` |
| Sidecar | DB insert | `db.insert(docxSablon)` | ✓ WIRED | `sablon.ts` L49-54: `degiskenler` from sidecar result stored in JSON column |
| tRPC delete | DB cascade | `db.delete` then `safeUnlink` | ✓ WIRED | `sablon.ts` L68 DB delete first (fires SET NULL), L71 disk cleanup |
| tRPC update | Re-extract | `runSidecarCommand` then `db.update` | ✓ WIRED | `sablon.ts` L84-110: same pattern as create, `safeUnlink` old file L101 |
| UI list | tRPC | `trpc.sablon.list.queryOptions()` | ✓ WIRED | `sablon-yonetimi-section.tsx` L64-65 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| ------- | ------------ | ------ | ------------------ | ------ |
| `docxSablon` table | `degiskenler` (JSON) | Python sidecar `handle_extract_vars` | ✓ Yes — regex on real `word/document.xml` inside uploaded `.docx` | ✓ FLOWING |
| UI table | `templates[]` | `trpc.sablon.list` query | ✓ Yes — `db.select().from(docxSablon).orderBy(desc(updated_at))` | ✓ FLOWING |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SABLON-01 | 16-03 | .docx upload, non-.docx rejected | ✓ SATISFIED | Upload route L20-33: extension + MIME + size checks |
| SABLON-02 | 16-03 | ad + kategori required on upload | ✓ SATISFIED | `sablonCreateSchema` L7-8: `ad` string.min(1), `kategori` enum; UI dialog L290-327 |
| SABLON-03 | 16-02 | {{var}} and {%p var%} extraction | ✓ SATISFIED | `main.py` L127-128 regex; `normalize_var` L123-125 for Word fragmentation |
| SABLON-04 | 16-05 | List by kategori + ad | ✓ SATISFIED | UI table L222-268 with kategori filter L68,190-202 |
| SABLON-05 | 16-04 | Delete DB + disk, SET NULL cascade | ✓ SATISFIED | `sablon.ts` L59-74, FK with `set null` in schema L304 |
| SABLON-06 | 16-04 | Overwrite + re-extract variables | ✓ SATISFIED | `sablon.ts` L76-113 `update` mutation |
| SABLON-07 | 16-01 | `docx_sablon` Drizzle table | ✓ SATISFIED | `lib/schema.ts` L359-374: all specified columns present |
| SABLON-08 | 16-01 | `belge.sablon_id` FK SET NULL | ✓ SATISFIED | `lib/schema.ts` L304 with `onDelete: 'set null'` |

---

### Anti-Patterns Found

None. The implementation is clean:

- No `TODO`/`FIXME`/`PLACEHOLDER` in any of the 7 key files
- No stub implementations — every handler has real logic
- No hardcoded empty arrays or null returns for data paths
- `handle_render` and `handle_convert` correctly return proper error codes (not stubs that silently succeed)

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Upload route rejects .pdf | — | Verified by code: MIME check L28-32 returns 400 | ✓ PASS |
| Upload route rejects >10MB | — | Verified by code: size check L34-38 returns 400 | ✓ PASS |
| `handle_extract_vars` returns variables array | — | Verified by code: L135 `return {"status":"success","result":{"variables":variables}}` | ✓ PASS |
| `docxSablon` has NOT NULL + CHECK on kategori | — | Verified by code: L362 `.notNull()` + L372 `check('kategori_check', sql\`...\`) | ✓ PASS |
| `belge.sablon_id` has `ON DELETE SET NULL` | — | Verified by code: L304 `{ onDelete: 'set null' }` | ✓ PASS |
| tRPC router registered in appRouter | — | `lib/trpc/routers/_app.ts` L39: `sablon: sablonRouter` | ✓ PASS |

---

## Gaps Summary

None. All 5 observable truths verified, all 8 requirement IDs satisfied, all key links wired, all artifacts substantive and data-flowing.

---

_Verified: 2026-04-21T12:00:00Z_
_Verifier: gsd-verifier_
