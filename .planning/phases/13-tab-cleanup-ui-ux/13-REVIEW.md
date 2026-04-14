---
phase: 13-tab-cleanup-ui-ux
reviewed: 2026-04-14T23:15:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - app/api/upload/route.ts
  - components/belge/belge-upload.tsx
  - components/dosya/dosya-detail-tabs.tsx
  - components/dosya/dosya-form.tsx
  - components/dosya/genel-bilgiler-tab.tsx
  - components/dosya/mahkeme-data-form.tsx
  - components/dosya/not-form.tsx
  - components/dosya/not-list.tsx
  - components/dosya/stk-data-form.tsx
  - components/dosya/timeline.tsx
  - components/muvekkil/muvekkil-detail.tsx
  - components/muvekkil/muvekkil-form.tsx
  - components/muvekkil/muvekkil-list.tsx
  - drizzle/0001_add_phase13_columns.sql
  - lib/schema.ts
  - lib/trpc/routers/_app.ts
  - lib/trpc/routers/belge.ts
  - lib/trpc/routers/dosya.ts
  - lib/trpc/routers/muvekkil.ts
  - lib/trpc/routers/notlar.ts
  - lib/trpc/routers/olay.ts
  - lib/trpc/routers/surec.ts
  - tests/03-surec.test.ts
  - tests/06-belge-finans.test.ts
  - tests/13-tab-cleanup.test.ts
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-14T23:15:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Reviewed 25 files spanning API routes, React components, tRPC routers, database schema, migrations, and tests for Phase 13 (Tab Cleanup UI/UX). Found **2 critical security vulnerabilities** (path traversal in file upload/delete), **5 warnings** (validation mismatches, query key inconsistency, `as any` usage, SQL raw injection risk), and **4 informational items** (hardcoded path, sync I/O, verbose defaults, minor test issue).

## Critical Issues

### CR-01: Path Traversal in File Upload Route

**File:** `app/api/upload/route.ts:17-18,37`
**Issue:** `dosyaId` is accepted as an unvalidated `string | null` from `formData` and used directly in `path.join(BASE_PATH, dosyaId)` without verifying it's a numeric ID. An attacker can send `dosyaId=../../etc` to write files outside `E:/sigorta-belgeler/`. `path.join` normalizes but does not prevent directory traversal — `path.join('E:/sigorta-belgeler', '../../etc')` resolves to `E:/etc` on Windows.
**Fix:**
```typescript
const dosyaIdRaw = formData.get('dosyaId') as string | null
const dosyaId = parseInt(dosyaIdRaw ?? '', 10)
if (isNaN(dosyaId)) {
  return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })
}
// Use numeric dosyaId for path construction
const uploadDir = path.join(BASE_PATH, String(dosyaId))
fs.mkdirSync(uploadDir, { recursive: true })
```
Also validate that the resolved path starts with `BASE_PATH`:
```typescript
const uploadDir = path.join(BASE_PATH, String(dosyaId))
if (!path.resolve(uploadDir).startsWith(path.resolve(BASE_PATH))) {
  return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 400 })
}
```

### CR-02: Path Traversal in Document Delete Route

**File:** `lib/trpc/routers/belge.ts:49-56`
**Issue:** The `dosya_yolu` stored in DB is parsed into a filesystem path for deletion. An attacker who can control or inject a `dosya_yolu` with `..` segments (e.g., `/api/files/../../etc/important`) can cause arbitrary file deletion. The `replace('/api/files/', '')` + `split('/')` + `path.join()` sequence resolves `..` segments, enabling traversal outside `E:/sigorta-belgeler/`.
**Fix:**
```typescript
const filePathParts = existing[0].dosya_yolu.replace('/api/files/', '').split('/')
const fullPath = path.join('E:/sigorta-belgeler', ...filePathParts)
const basePath = path.resolve('E:/sigorta-belgeler')
if (!path.resolve(fullPath).startsWith(basePath)) {
  console.error(`Path traversal attempt: ${fullPath}`)
  return { success: true } // Don't throw — DB record already deleted
}
try { 
  fs.unlinkSync(fullPath) 
} catch (e) {
  console.error(`Failed to delete file from disk: ${fullPath}`, e)
}
```

## Warnings

### WR-01: `as any` Type Assertions Bypass Type Safety

**File:** `components/dosya/dosya-form.tsx:110,113,114,115`
**Issue:** Four `as any` type casts on `dosyaData` fields (`muvekkil_sigorta_id`, `hasar_dosya_no`, `kaza_tarihi`, `kusur_orani_karsi`) bypass TypeScript's type checking. If the API response shape changes, these will silently accept incorrect data instead of surfacing type errors at compile time.
**Fix:** Add the missing fields to the `getById` query return type, or define an explicit type for the form data:
```typescript
// In the dosya router getById, ensure these columns are returned:
// muvekkil_sigorta_id, hasar_dosya_no, kaza_tarihi, kusur_orani_karsi
// Then remove `as any` casts and use properly typed values:
muvekkil_sigorta_id: dosyaData.muvekkil_sigorta_id ?? null,
hasar_dosya_no: dosyaData.hasar_dosya_no ?? '',
kaza_tarihi: dosyaData.kaza_tarihi ?? '',
kusur_orani_karsi: dosyaData.kusur_orani_karsi ?? null,
```

### WR-02: EditForm Bypasses Zod Max-Length Validation

**File:** `components/dosya/not-list.tsx:204-209`
**Issue:** The `EditForm` component uses `form.getValues()` with a manual `trim()` check instead of `form.handleSubmit()`, bypassing the zod resolver that validates `max(5000)`. A user can submit a note exceeding 5000 characters through the edit form. The server-side validation will reject it, but the client UX will be poor — no inline validation feedback.
**Fix:**
```tsx
<form
  onSubmit={form.handleSubmit((values) => {
    if (values.icerik.trim()) onSave(values.icerik)
  })}
  className="space-y-3"
>
```

### WR-03: Client/Server Validation Mismatch for Required Fields

**File:** `components/muvekkil/muvekkil-form.tsx:24-25`
**Issue:** Client-side schema defines `ad: z.string().min(0)` and `soyad: z.string().min(0)`, which allows empty strings. The server-side schema (`lib/trpc/routers/muvekkil.ts:9-10`) defines `ad: z.string().min(1, 'Ad zorunludur')` and `soyad: z.string().min(1, 'Soyad zorunludur')`. Users can submit empty names, which the server rejects — but they see no inline validation error until the server responds.
**Fix:**
```typescript
// muvekkil-form.tsx — match server validation
const formSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(100),
  soyad: z.string().min(1, 'Soyad zorunludur').max(100),
  // ... rest unchanged
})
```

### WR-04: Inconsistent Query Key Format for Cache Invalidation

**File:** `components/muvekkil/muvekkil-detail.tsx:88`, `components/muvekkil/muvekkil-form.tsx:65,78`, `components/muvekkil/muvekkil-list.tsx:75`
**Issue:** Muvekkil components invalidate queries using `queryKey: ['muvekkil']` (flat array), while dosya components use `queryKey: [['dosya']]` (nested array). tRPC v11 + TanStack Query v5 uses `[['routerName', 'procedureName'], input]` format for query keys. The flat `['muvekkil']` key may not match the tRPC-generated keys `[['muvekkil', 'list'], ...]`, causing cache invalidation to silently fail. Muvekkil list/detail pages may show stale data after mutations.
**Fix:** Use tRPC's query key helpers for exact matching or use the nested array format:
```typescript
// Option A: Use tRPC helper (preferred)
queryClient.invalidateQueries({ queryKey: trpc.muvekkil.list.queryKey() })

// Option B: Use nested array for prefix matching (matches all muvekkil queries)
queryClient.invalidateQueries({ queryKey: [['muvekkil']] })
```

### WR-05: `sql.raw()` Used Instead of Parameterized `inArray()`

**File:** `lib/trpc/routers/muvekkil.ts:64`
**Issue:** `sql\`${dosya.muvekkil_id} IN (${sql.raw(ids.join(','))})\`` uses `sql.raw()` to concatenate IDs directly into the SQL string, bypassing parameterization. While the current data flow (IDs from DB integers) is safe, this pattern is fragile — if the data source changes to include user input, it becomes a SQL injection vector. Drizzle provides `inArray()` for this exact purpose.
**Fix:**
```typescript
import { inArray } from 'drizzle-orm'

// Replace raw SQL with:
const counts = await db
  .select({ muvekkil_id: dosya.muvekkil_id, cnt: count() })
  .from(dosya)
  .where(inArray(dosya.muvekkil_id, ids))
  .groupBy(dosya.muvekkil_id)
```

## Info

### IN-01: Hardcoded Upload Base Path

**File:** `app/api/upload/route.ts:13` and `lib/trpc/routers/belge.ts:51`
**Issue:** `BASE_PATH = 'E:/sigorta-belgeler'` is hardcoded. This should be an environment variable for portability across environments (dev/staging/prod, Windows/Linux).
**Fix:** Use `process.env.UPLOAD_BASE_PATH || 'E:/sigorta-belgeler'` and document the env var.

### IN-02: Synchronous File I/O in Next.js API Route

**File:** `app/api/upload/route.ts:38,51,69`
**Issue:** Uses `fs.mkdirSync` and `fs.writeFileSync` which block the Node.js event loop. In a Next.js API route (serverless context), async file operations (`fs.promises.mkdir`, `fs.promises.writeFile`) are preferred.
**Fix:** Replace with `await fs.promises.mkdir(...)`, `await fs.promises.writeFile(...)`.

### IN-03: Verbose Inline Default Objects in surec.ts

**File:** `lib/trpc/routers/surec.ts:104,131,177,203`
**Issue:** The default fallback objects for `surec.stk` and `surec.mahkeme` when they're null are long inline objects with ~12 fields each, repeated 4 times. This is a code smell — extracting to a constant would improve readability and reduce duplication.
**Fix:** Extract to constants:
```typescript
const DEFAULT_STK_DATA: StkSurecData = {
  asama: null, ihtar_tarihi: null, arabuluculuk_son_tutanak_tarihi: null, /* ... */
}
const DEFAULT_MAHKEME_DATA: MahkemeSurecData = {
  asama: null, ilk_derece_esas_no: null, /* ... */
}
// Then use: ...(surec.stk ?? DEFAULT_STK_DATA)
```

### IN-04: Query Invalidation Uses Divergent Patterns Across Codebase

**File:** Multiple components
**Issue:** Some components use tRPC-generated query keys (`trpc.notlar.list.queryKey(...)`) while others use manual keys (`[['dosya']]` or `['muvekkil']`). The tRPC helper approach is safer and self-documenting. Standardizing on tRPC-helpers would prevent key format mismatches.
**Fix:** Prefer `trpc.router.procedure.queryKey()` or `trpc.router.procedure.queryFilter()` for invalidation across all components.

---

_Reviewed: 2026-04-14T23:15:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_