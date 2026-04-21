# Phase 16: Şablon Şeması ve CRUD - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 9 (8 new + 1 modified)
**Analogs found:** 9 / 9
**Project conventions:** Caveman skill loaded (terse mode for code comments OK; user-facing text in Turkish)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/schema.ts` (modify: add `docxSablon` + `belge.sablon_id`) | model/schema | DDL | `lib/schema.ts` lines 295-308 (`belge`), lines 370-381 (`dilekceOdtSablonu`) | exact |
| `drizzle/000X_phase16_docx_sablon.sql` (new migration) | migration | DDL | `drizzle/0002_phase14_avukat_schema.sql` | exact |
| `lib/validators/sablon.ts` (new) | validator | request-response | `lib/validators/ayarlar.ts` | exact |
| `lib/trpc/routers/sablon.ts` (new) | controller | CRUD + sidecar IPC | `lib/trpc/routers/dilekce-odt.ts` (closest), `lib/trpc/routers/belge.ts` (delete pattern), `lib/trpc/routers/ayarlar.ts` (CRUD shape) | exact |
| `lib/trpc/routers/_app.ts` (modify: register sablon) | config | wiring | `lib/trpc/routers/_app.ts` lines 12, 33 | exact |
| `app/api/templates/upload/route.ts` (new) | controller | file-I/O multipart | `app/api/upload/route.ts` | exact |
| `scripts/docx-pipeline/main.py` (modify: implement `handle_extract_vars`) | service | request-response | `scripts/docx-pipeline/main.py` lines 88-90 (stub), lines 45-85 (`handle_health_check`) | exact |
| `components/ayarlar/sablon-yonetimi-section.tsx` (new) | component | CRUD UI | `components/ayarlar/sigorta-sirketi-section.tsx` (full form pattern), `components/ayarlar/ayarlar-crud-section.tsx` (table + dialogs pattern) | exact |
| `components/ayarlar/ayarlar-page.tsx` (modify: mount section) | component | wiring | `components/ayarlar/ayarlar-page.tsx` lines 53-128 | exact |
| `tests/16-sablon.test.ts` (new) | test | unit/integration | `tests/06-belge-finans.test.ts` | exact |

## Pattern Assignments

### `lib/schema.ts` — additions (model, DDL)

**Analog:** `lib/schema.ts` (existing `belge` and `dilekceOdtSablonu`)

**Enum + table pattern** (lines 290-308 — copy shape):
```typescript
// Source: lib/schema.ts:292-293 (BELGE_KATEGORILER pattern)
export const BELGE_KATEGORILER = ['Dilekçe', 'Karar', ...] as const
export type BelgeKategori = typeof BELGE_KATEGORILER[number]
```
Apply identically: `SABLON_KATEGORILER = ['STK', 'Mahkeme', 'Genel'] as const`.

**Existing closest table** (lines 370-381 — `dilekceOdtSablonu`):
```typescript
export const dilekceOdtSablonu = sqliteTable('dilekce_odt_sablonu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  baslik: text('baslik').notNull(),
  kategori: text('kategori').notNull(),
  dosya_adi: text('dosya_adi').notNull(),
  dosya_yolu: text('dosya_yolu').notNull(),
  degiskenler: text('degiskenler').notNull().default('[]'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_odt_sablon_kategori').on(t.kategori),
])
```

**Differences for `docx_sablon`:**
- Add `check('kategori_check', sql\`${t.kategori} IN ('STK', 'Mahkeme', 'Genel')\`)` (D-07; needs `check` import from `drizzle-orm/sqlite-core`)
- Use `text('degiskenler', { mode: 'json' }).$type<string[]>().notNull().default(sql\`(json_array())\`)` (per RESEARCH §Pattern 2) — preferred over the legacy `default('[]')` string form used in `dilekceOdtSablonu`
- Add `default_aksiyon: text('default_aksiyon')` nullable
- Use field name `ad` (not `baslik`) per CONTEXT D-03/D-09 mapping to UI label "Şablon Adı"

**Belge FK addition pattern** (existing `taraf.avukat_id` from `drizzle/0002`):
```sql
-- drizzle/0002_phase14_avukat_schema.sql line 34
ALTER TABLE `taraf` ADD `avukat_id` integer REFERENCES `avukat`(`id`) ON DELETE SET NULL;
```
Apply identically for `belge.sablon_id` → `docx_sablon(id)` ON DELETE SET NULL (D-08).

**Index pattern** (lines 305-307):
```typescript
}, (t) => [
  index('idx_belge_dosya').on(t.dosya_id),
  index('idx_belge_tarih').on(t.created_at),
])
```
Add `index('idx_belge_sablon').on(t.sablon_id)` to `belge` table tuple.

---

### `drizzle/000X_phase16_docx_sablon.sql` (migration)

**Analog:** `drizzle/0002_phase14_avukat_schema.sql`

**Multi-step migration with comments + ALTER TABLE + CREATE TABLE** (full file):
```sql
-- Phase 14: Add 5 new columns to sigorta_sirketi, create avukat ...

-- Step 1: Add new columns to sigorta_sirketi
ALTER TABLE `sigorta_sirketi` ADD `mersis_no` text;

-- Step 2: Create avukat table
CREATE TABLE `avukat` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  ...
);

-- Step 4: Add avukat_id to taraf
ALTER TABLE `taraf` ADD `avukat_id` integer REFERENCES `avukat`(`id`) ON DELETE SET NULL;
```

**Apply for Phase 16:**
- Step 1: `CREATE TABLE docx_sablon` with `CHECK (kategori IN ('STK','Mahkeme','Genel'))`
- Step 2: `CREATE INDEX idx_sablon_kategori ON docx_sablon(kategori)`
- Step 3: `ALTER TABLE belge ADD sablon_id integer REFERENCES docx_sablon(id) ON DELETE SET NULL` (must be nullable — RESEARCH Pitfall 5)
- Step 4: `CREATE INDEX idx_belge_sablon ON belge(sablon_id)`

Generation: `npx drizzle-kit generate` (per RESEARCH Pitfall 2 — avoid `push` with check constraints).

---

### `lib/validators/sablon.ts` (validator)

**Analog:** `lib/validators/ayarlar.ts` (full file, 27 lines)

**Imports + schema export pattern** (lines 1-12):
```typescript
import { z } from 'zod'

export const sigortaSirketiSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  ...
})
```

**Apply for `sablonSchema`:**
```typescript
import { z } from 'zod'
import { SABLON_KATEGORILER } from '@/lib/schema'

export const sablonKategoriSchema = z.enum(SABLON_KATEGORILER)

export const sablonCreateSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  kategori: sablonKategoriSchema,
  // server-only filled fields injected by upload route response:
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
})

export const sablonUpdateSchema = z.object({
  id: z.number().int(),
  filePath: z.string().min(1),
  fileName: z.string().min(1),
})
```

---

### `lib/trpc/routers/sablon.ts` (controller, CRUD + sidecar IPC)

**Primary analog:** `lib/trpc/routers/dilekce-odt.ts` (existing template router with same upload + extract-vars + delete pattern)
**Secondary analogs:** `lib/trpc/routers/belge.ts` (path-traversal-safe delete), `lib/trpc/routers/ayarlar.ts` (CRUD shape with `TRPCError`)

**Imports pattern** (`dilekce-odt.ts` lines 1-8 + `belge.ts` lines 1-9):
```typescript
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { docxSablon, SABLON_KATEGORILER } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'
```

**list procedure pattern** (`dilekce-odt.ts` lines 13-15):
```typescript
list: protectedProcedure.query(async () => {
  return db.select().from(dilekceOdtSablonu).orderBy(desc(dilekceOdtSablonu.updated_at))
}),
```
Copy verbatim with `docxSablon` substitution.

**Sidecar variable extraction call** (RESEARCH §Pattern 3 + use existing `lib/services/docx-pipeline.ts:14`):
```typescript
const result = await runSidecarCommand({
  command: 'extract-vars',
  params: { file_path: input.filePath },
})

if (result.status === 'error') {
  // Clean up orphan file (RESEARCH Pitfall 4)
  if (fs.existsSync(input.filePath)) fs.unlinkSync(input.filePath)
  throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
}
const variables = (result.result as { variables: string[] }).variables
```

**Delete with path-traversal guard** (`belge.ts` lines 38-68 — adapt for `./uploads/templates/`):
```typescript
// belge.ts:54-64 — path traversal check pattern
const basePath = path.resolve('E:/sigorta-belgeler')
if (!path.resolve(fullPath).startsWith(basePath)) {
  console.error(`Path traversal attempt: ${fullPath}`)
} else {
  try { fs.unlinkSync(fullPath) }
  catch (e) { console.error(`Failed to delete file from disk: ${fullPath}`, e) }
}
```
Adapt for templates: `basePath = path.resolve(process.cwd(), 'uploads', 'templates')`.

**TRPCError pattern for missing record** (`belge.ts` lines 43-45):
```typescript
const existing = await db.select().from(belge).where(eq(belge.id, input.id))
if (!existing[0]) {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
}
```
Reuse with `'Şablon bulunamadı.'` message.

**Update (overwrite) procedure** — D-06: same ID, replace file. New pattern (no exact analog — combine `dilekce-odt.ts:upload` + `ayarlar.ts:update` shape). Follow RESEARCH §"tRPC Router: sablon CRUD" lines 488-530 of RESEARCH.md as the verified blueprint.

---

### `lib/trpc/routers/_app.ts` (modify — register router)

**Analog:** same file, lines 12 (import) + 33 (registration).

**Import pattern** (line 12):
```typescript
import { dilekceOdtRouter } from './dilekce-odt'
```

**Registration pattern** (line 33):
```typescript
dilekceOdt: dilekceOdtRouter,
```

**Apply:** add `import { sablonRouter } from './sablon'` and `sablon: sablonRouter,` in the appRouter object.

---

### `app/api/templates/upload/route.ts` (controller, file-I/O multipart)

**Analog:** `app/api/upload/route.ts` (full 88 lines)

**Imports + constants pattern** (lines 1-13):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const BASE_PATH = 'E:/sigorta-belgeler'
```

**Apply for templates** — different constants:
```typescript
const ALLOWED_EXTENSIONS = ['.docx'] as const
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB (CONTEXT discretion ~10MB)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates') // D-04
```

**Validation block pattern** (lines 22-39):
```typescript
if (!file) {
  return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
}
if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: 'İzin verilmeyen dosya türü' }, { status: 400 })
}
if (file.size > MAX_SIZE) {
  return NextResponse.json({ error: 'Dosya boyutu 20 MB\'ı aşamaz' }, { status: 400 })
}
```
Copy structure; replace messages: "Sadece .docx dosyaları kabul edilir", "Dosya boyutu 10 MB'ı aşamaz". Validate **both** extension (`path.extname(file.name).toLowerCase() === '.docx'`) **and** MIME (RESEARCH Security threat: Spoofing).

**Path-traversal guard** (lines 42-46):
```typescript
const uploadDir = path.join(BASE_PATH, String(dosyaId))
if (!path.resolve(uploadDir).startsWith(path.resolve(BASE_PATH))) {
  return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 400 })
}
fs.mkdirSync(uploadDir, { recursive: true })
```
Apply identically for templates dir.

**Filename sanitization + write** (lines 49-67) — combine with `dilekce-odt.ts:41-45` pattern:
```typescript
// dilekce-odt.ts:41
const fileName = `${Date.now()}_${input.dosyaAdi.replace(/[^a-zA-Z0-9._-]/g, '_')}`
```
Use timestamp prefix + sanitized original. Return `{ filename, filePath, fileSize, fileName }`.

---

### `scripts/docx-pipeline/main.py` (modify — implement `handle_extract_vars`)

**Analog:** same file, `handle_health_check` (lines 45-85) for handler shape; current stub at lines 88-90.

**Handler return-shape pattern** (lines 77-85):
```python
return {
    "status": "success",
    "result": {
        "python_version": python_version,
        ...
    },
}
```

**Error return pattern** (line 90):
```python
return {"status": "error", "code": 1, "message": "Not implemented in Phase 15"}
```

**Logger usage pattern** (lines 69-75):
```python
logger.info(
    "health-check",
    python_version=python_version,
    ...
)
```

**Apply for `handle_extract_vars`** (use RESEARCH §"Python sidecar extract-vars handler" as blueprint, integrate with existing logger + structlog):
```python
def handle_extract_vars(params: dict[str, Any]) -> dict[str, Any]:
    file_path = params.get("file_path")
    if not file_path:
        return {"status": "error", "code": 1, "message": "file_path param gerekli"}
    try:
        # zipfile + regex extraction (RESEARCH §Code Examples)
        ...
        logger.info("extract-vars", file_path=file_path, var_count=len(variables))
        return {"status": "success", "result": {"variables": variables}}
    except Exception as e:
        logger.error("extract-vars-error", error=str(e))
        return {"status": "error", "code": 2, "message": f"Değişken çıkarma hatası: {e}"}
```

**Imports to add at top of `main.py`:**
```python
import io
import re
import zipfile
```

No change to handler routing dict (lines 120-125) — `extract-vars` is already registered.

---

### `components/ayarlar/sablon-yonetimi-section.tsx` (component, CRUD UI)

**Primary analog:** `components/ayarlar/sigorta-sirketi-section.tsx` (full form, useForm + zodResolver, mutations, dialogs — closest match for non-trivial CRUD section)
**Secondary analog:** `components/ayarlar/ayarlar-crud-section.tsx` (simpler add/edit/delete dialog scaffold — only if we drop react-hook-form)

**Imports pattern** (`sigorta-sirketi-section.tsx` lines 1-50):
```typescript
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTRPC } from '@/lib/trpc/context'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
```
Add: `Select` from `@/components/ui/select` (kategori dropdown — D-09), `Badge` from `@/components/ui/badge` (kategori badge — D-09).

**Query + invalidate pattern** (lines 78-106):
```typescript
const listOpts = trpc.ayarlar.sigortaSirketi.listWithAvukatlar.queryOptions()
const { data: list, isLoading } = useQuery(listOpts)

const invalidate = () => qc.invalidateQueries({ queryKey: listOpts.queryKey })

const createSirketi = useMutation(
  trpc.ayarlar.sigortaSirketi.create.mutationOptions({
    onSuccess: () => { invalidate(); toast.success('Kaydedildi.') },
    onError: () => toast.error('Kaydedilemedi. Lütfen tekrar deneyin.'),
  })
)
```
Apply for `trpc.sablon.list / .create / .update / .delete`.

**Card + Table layout** (lines 174-353) — copy frame; substitute headers: Ad, Kategori, Yüklenme Tarihi, Değişken Sayısı, İşlemler (per D-09).

**Delete confirmation pattern** (lines 464-492):
```typescript
<AlertDialog open={deleteTarget !== null} onOpenChange={...}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Kaydı Sil</AlertDialogTitle>
      <AlertDialogDescription>...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>İptal</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={...}>Evet, Sil</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
Reuse verbatim. Description: "Bu şablonu silmek istediğinize emin misiniz? Şablona bağlı belgelerin şablon referansı kaldırılacak (belge dosyaları korunur)."

**Upload form** — no exact analog. New pattern: file input + name input + kategori Select. Use `<Form>` + react-hook-form (matches `sigorta-sirketi-section.tsx` lines 363-460). For the file field use plain `<input type="file" accept=".docx">` ref'd manually (since shadcn `<Input>` works for type=file but isn't bound by RHF directly; use `register` + `onChange` with FileList).

**Submission flow** — two-step: (1) `fetch('/api/templates/upload', { method: 'POST', body: formData })` to get `{ filePath, fileName, fileSize }`, (2) `createSablon.mutateAsync({ ad, kategori, filePath, fileName, fileSize })`. The upload-then-mutate flow exists implicitly in `app/api/upload/route.ts` callers — search `components/dosya/...` for an exact reference if needed during implementation.

---

### `components/ayarlar/ayarlar-page.tsx` (modify — mount section)

**Analog:** same file, lines 53-128.

**Section composition pattern** (lines 54-78):
```tsx
<div className="space-y-8">
  <SigortaSirketiSection />
  <Separator />
  <AyarlarCrudSection title="Mahkemeler / Kurumlar" ... />
  <Separator />
  <AyarlarCrudSection title="Sigorta Türleri" ... />
  <Separator />
  ...
  <PipelineStatus />
</div>
```

**Apply:** add `<Separator />` then `<SablonYonetimiSection />` before or after `<PipelineStatus />` (per CONTEXT D-03).

---

### `tests/16-sablon.test.ts` (test, unit + integration)

**Analog:** `tests/06-belge-finans.test.ts` (full file — same shape: schema export checks + router procedure existence checks + route file source-string checks)

**Schema export check pattern** (lines 8-23):
```typescript
import { describe, it, expect } from 'vitest'
import { belge, finans_kalemi, BELGE_KATEGORILER, FINANS_TUR } from '@/lib/schema'
import { belgeRouter } from '@/lib/trpc/routers/belge'
import { readFileSync } from 'fs'

describe('Schema: belge + finans_kalemi tables', () => {
  it('belge table is exported from lib/schema.ts', () => {
    expect(belge).toBeDefined()
  })
  it('BELGE_KATEGORILER has exactly 11 categories ...', () => {
    expect(BELGE_KATEGORILER).toHaveLength(11)
    expect(BELGE_KATEGORILER).toContain('İhtarname')
  })
})
```

**Apply for SABLON-01..08:** export checks for `docxSablon`, `SABLON_KATEGORILER` (length 3, contains 'STK'/'Mahkeme'/'Genel'), `belge.sablon_id` column existence.

**Route source-string check pattern** (lines 34-52):
```typescript
describe('Upload route: ALLOWED_TYPES and MAX_SIZE', () => {
  it('ALLOWED_TYPES blocks non-PDF/...', () => {
    const routeContent = readFileSync('app/api/upload/route.ts', 'utf-8')
    expect(routeContent).toContain("'application/pdf'")
  })
})
```
Apply for `app/api/templates/upload/route.ts` — assert `.docx` extension check, 10MB limit, `uploads/templates` path.

**Router procedure existence pattern** (lines 55-67):
```typescript
describe('belge router: procedure existence', () => {
  it('has list procedure', () => {
    expect(belgeRouter._def.procedures).toHaveProperty('list')
  })
})
```
Apply: assert `sablonRouter` has `list`, `create`, `delete`, `update`.

Wave 0 fixture needed: `tests/fixtures/test-template.docx` with known variables (per RESEARCH §Wave 0 Gaps).

---

## Shared Patterns

### Authentication
**Source:** `lib/trpc/init.ts` via `protectedProcedure`
**Apply to:** All `sablonRouter` procedures (list, create, update, delete) — never use `publicProcedure`. Match every existing CRUD router (`belge.ts:13`, `dilekce-odt.ts:12`, `ayarlar.ts:27`).

### Error Handling (tRPC)
**Source:** `lib/trpc/routers/belge.ts` lines 43-45, `lib/trpc/routers/ayarlar.ts` lines 39, 73
**Apply to:** All `sablonRouter` mutations
```typescript
import { TRPCError } from '@trpc/server'
if (!existing[0]) {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Şablon bulunamadı.' })
}
```
Use `'BAD_REQUEST'` for sidecar errors, `'NOT_FOUND'` for missing rows. All messages in Turkish.

### Path-Traversal Guard
**Source:** `lib/trpc/routers/belge.ts` lines 53-64, `app/api/upload/route.ts` lines 42-46
**Apply to:** `lib/trpc/routers/sablon.ts` (delete + update file removal), `app/api/templates/upload/route.ts` (write target)
```typescript
const basePath = path.resolve(process.cwd(), 'uploads', 'templates')
if (!path.resolve(fullPath).startsWith(basePath)) {
  console.error(`Path traversal attempt: ${fullPath}`)
} else {
  try { fs.unlinkSync(fullPath) } catch (e) { console.error(...) }
}
```

### Filename Sanitization
**Source:** `lib/trpc/routers/dilekce-odt.ts` line 41
```typescript
const fileName = `${Date.now()}_${input.dosyaAdi.replace(/[^a-zA-Z0-9._-]/g, '_')}`
```
Apply in `app/api/templates/upload/route.ts` for write filename.

### Sidecar Invocation
**Source:** `lib/services/docx-pipeline.ts:14` (`runSidecarCommand`)
**Apply to:** `lib/trpc/routers/sablon.ts` create + update mutations
```typescript
const result = await runSidecarCommand({ command: 'extract-vars', params: { file_path } })
if (result.status === 'error') {
  if (fs.existsSync(file_path)) fs.unlinkSync(file_path)
  throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
}
```
Already implemented in Phase 15; do not re-implement. The Python `extract-vars` handler is the only sidecar code Phase 16 writes.

### React Query Mutation + Toast + Invalidate
**Source:** `components/ayarlar/sigorta-sirketi-section.tsx` lines 83-106
```typescript
const create = useMutation(
  trpc.X.create.mutationOptions({
    onSuccess: () => { invalidate(); toast.success('Kaydedildi.') },
    onError: () => toast.error('Kaydedilemedi. Lütfen tekrar deneyin.'),
  })
)
```
Apply to all four `sablon` mutations in `sablon-yonetimi-section.tsx`.

### Drizzle JSON Column
**Source:** RESEARCH §Pattern 2 (verified via Context7 Drizzle docs)
**Apply to:** `docx_sablon.degiskenler`
```typescript
degiskenler: text('degiskenler', { mode: 'json' })
  .$type<string[]>()
  .notNull()
  .default(sql`(json_array())`),
```
Note: existing `dilekceOdtSablonu` uses the legacy `text('degiskenler').notNull().default('[]')` form. New table uses the typed JSON form per RESEARCH recommendation.

### Turkish User-Facing Messages
**Source:** All existing routers + components (`'Kaydedildi.'`, `'Silindi.'`, `'Bulunamadı.'`, `'Geçerli ... giriniz'`)
**Apply to:** All toast messages, TRPCError messages, validation messages, dialog titles. CLAUDE.md project convention.

---

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| (none) | — | All Phase 16 files have direct or near-direct analogs in the codebase |

The only **partially novel** patterns are:
1. Drizzle `check()` constraint usage — no existing table uses `check()`. Use Context7 Drizzle docs (RESEARCH verifies syntax).
2. Drizzle typed JSON column (`text({ mode: 'json' }).$type<...>()`) — no existing usage. Use RESEARCH §Pattern 2.
3. File `<input type="file">` + react-hook-form integration — existing `dilekce-odt` upload uses base64 string, not multipart. New file uses multipart per CONTEXT D-01; planner should reference `app/api/upload/route.ts` callers for multipart submission flow.

## Metadata

**Analog search scope:**
- `lib/schema.ts` — schema patterns
- `lib/trpc/routers/` — all CRUD routers (belge, dilekce-odt, ayarlar, pipeline)
- `lib/validators/` — zod schema files
- `lib/services/docx-pipeline.ts` — sidecar bridge (Phase 15)
- `app/api/upload/route.ts` — multipart upload route
- `components/ayarlar/` — settings page sections
- `scripts/docx-pipeline/main.py` — sidecar handlers
- `tests/06-belge-finans.test.ts` — closest test analog
- `drizzle/0002_phase14_avukat_schema.sql` — migration analog

**Files scanned:** 14
**Pattern extraction date:** 2026-04-20
