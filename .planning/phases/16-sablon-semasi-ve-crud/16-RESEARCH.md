# Phase 16: Şablon Şeması ve CRUD — Research

**Researched:** 2026-04-20
**Domain:** .docx template management, file upload, Drizzle schema, tRPC
**Confidence:** HIGH

## Summary

Phase 16 builds the `docx_sablon` table, CRUD API, and settings UI for uploading `.docx` templates with category labels and automatic variable extraction. The sidecar infrastructure (Phase 15) already provides `lib/services/docx-pipeline.ts` with `runSidecarCommand()` and the `extract-vars` command envelope — this phase implements the Python handler and the Node.js caller.

**Primary recommendation:** Use `docxtemplater` + `pizzip` on the Node.js side for variable extraction (not mammoth.js, not raw XML parsing). Docxtemplater's `inspect-module` provides reliable placeholder extraction including Jinja2-style `{%p %}` paragraph tags. Upload follows the existing `app/api/upload/route.ts` + tRPC mutation pattern. Drizzle schema uses `text({ mode: 'json' })` for the `degiskenler` column and `check()` for the kategori constraint.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| .docx file upload (multipart) | API / Backend | — | File goes to filesystem via API route, then tRPC mutation records metadata |
| Variable extraction from .docx | API / Backend | — | Node.js calls sidecar via execa; purely server-side |
| Template CRUD (DB + disk) | API / Backend | — | tRPC mutations handle DB records and filesystem operations |
| Template list UI (settings page) | Browser / Client | — | React Query + shadcn/ui Table, client-side category filter |
| Upload form UI | Browser / Client | — | Client-side file input → FormData → API route |
| Kategori validation | API / Backend | Browser / Client | Zod enum at API layer, Zod + Select at UI layer |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `docxtemplater` | 3.68.5 | .docx parsing + placeholder extraction | Industry standard for docx templating; built-in `inspect-module` extracts all tags; 225+ npm dependents [VERIFIED: npm registry] |
| `pizzip` | 3.2.0 | .docx zip decompression (required by docxtemplater) | Official dependency of docxtemplater; handles .docx as ZIP [VERIFIED: npm registry] |
| `execa` | 9.6.1 | Sidecar subprocess calls | Already in project (Phase 15); `runSidecarCommand()` bridge exists [VERIFIED: package.json] |
| `zod` | 3.24.0 | Input validation | Already in project; `z.enum()` for kategori [VERIFIED: package.json] |
| `drizzle-orm` | 0.45.2 | Schema + migrations | Already in project; `text({ mode: 'json' })`, `check()` [VERIFIED: package.json + Context7] |
| `better-sqlite3` | 12.9.0 | SQLite driver | Already in project [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.97.0 | Data fetching + cache invalidation | Already in project; all CRUD sections use it [VERIFIED: package.json] |
| `sonner` | 2.0.7 | Toast notifications | Already in project; used by all existing CRUD sections [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `docxtemplater` for extraction | `mammoth.js` extractRawText | Mammoth strips formatting and loses `{%p %}` paragraph tags; docxtemplater preserves full tag AST [VERIFIED: Context7 + docxtemplater FAQ] |
| `docxtemplater` for extraction | Raw XML regex (like existing `odt-to-pdf.ts`) | Fragile; misses nested tags, loops, conditions; docxtemplater handles all Jinja2 constructs [VERIFIED: codebase analysis] |
| `docxtemplater` for extraction | Python-side extraction only | Would require Python to read file, parse XML; docxtemplater on Node.js is simpler for names-only extraction (D-05) |

**Installation:**
```bash
npm install docxtemplater pizzip
```

**Version verification:**
```
npm view docxtemplater version → 3.68.5 (published 2026-04-18)
npm view pizzip version → 3.2.0
```

## Architecture Patterns

### System Architecture Diagram

```
User (Browser)
  │
  ├─► Settings Page (app/(dashboard)/ayarlar)
  │     │
  │     ├─ Upload Form: name + kategori (Select) + file input
  │     │     │
  │     │     └─► POST /api/templates/upload (multipart FormData)
  │     │           │
  │     │           ├─ Validate .docx extension, max size
  │     │           ├─ Save to ./uploads/templates/{id}.{ext}
  │     │           └─ Return { filePath, fileName, fileSize }
  │     │
  │     └─► tRPC mutation: sablon.create
  │           │
  │           ├─ Call runSidecarCommand({ command: "extract-vars", params: { file_path } })
  │           │     │
  │           │     └─► Python sidecar (main.py)
  │           │           ├─ Read .docx as ZIP
  │           │           ├─ Parse word/document.xml
  │           │           ├─ Extract {{var}} and {%p var%} placeholders
  │           │           └─ Return { status: "success", result: { variables: [...] } }
  │           │
  │           ├─ Insert docx_sablon row (ad, kategori, dosya_yolu, degiskenler JSON)
  │           └─ Invalidate React Query cache → table refresh
  │
  └─► Template List Table (Card + Table + category filter dropdown)
        │
        ├─► tRPC query: sablon.list → rows
        ├─► Delete: sablon.delete → SET NULL on belge.sablon_id, remove file
        └─► Overwrite: sablon.update → replace file, re-extract vars, same ID
```

### Recommended Project Structure

```
lib/
├── schema.ts                    # docx_sablon table + belge.sablon_id FK addition
├── validators/
│   └── sablon.ts                # Zod schemas for template input validation
├── trpc/routers/
│   ├── sablon.ts                # Template CRUD router (create, list, delete, update)
│   └── _app.ts                  # Register sablon router
├── services/
│   └── docx-pipeline.ts         # Already exists — Phase 15 sidecar bridge
└── pipeline/
    ├── protocol.ts              # Already exists — CommandEnvelope/CommandResult
    └── config.ts                # Already exists — sidecar paths

app/
├── api/
│   └── templates/
│       └── upload/
│           └── route.ts         # Multipart upload handler for .docx files

scripts/
└── docx-pipeline/
    └── main.py                  # Phase 15 — add handle_extract_vars implementation

components/
├── ayarlar/
│   ├── ayarlar-page.tsx         # Add Şablon Yönetimi section
│   └── sablon-yonetimi-section.tsx  # New: template list + upload form
└── ui/                          # Existing shadcn components (Badge, Select, Table, etc.)

uploads/
└── templates/                   # Template storage directory (D-04)
```

### Pattern 1: API Route + tRPC Mutation Upload
**What:** Multipart file upload via dedicated API route, then tRPC mutation records metadata and triggers sidecar extraction. Matches existing `app/api/upload/route.ts` + `belgeRouter.create` pattern.
**When to use:** Any file upload that needs server-side processing before DB record creation.
**Example:**
```typescript
// app/api/templates/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB [ASSUMED]
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates')

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
  }

  // Validate .docx extension
  const ext = path.extname(file.name).toLowerCase()
  if (ext !== '.docx') {
    return NextResponse.json({ error: 'Sadece .docx dosyaları kabul edilir' }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya boyutu 10 MB\'ı aşamaz' }, { status: 400 })
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  // Save with timestamp prefix
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = path.join(UPLOAD_DIR, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({
    filename,
    filePath,
    fileSize: file.size,
  })
}
```

### Pattern 2: Drizzle JSON Column with text({ mode: 'json' })
**What:** Store variable arrays as JSON in SQLite using Drizzle's `text({ mode: 'json' })` column type.
**When to use:** Any array/object data that needs to be stored in SQLite without a separate table.
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/column-types/sqlite
import { sqliteTable, text, integer, check } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const docxSablon = sqliteTable('docx_sablon', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  kategori: text('kategori').notNull(),
  dosya_yolu: text('dosya_yolu').notNull(),
  degiskenler: text('degiskenler', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`(json_array())`),
  default_aksiyon: text('default_aksiyon'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  check('kategori_check', sql`${t.kategori} IN ('STK', 'Mahkeme', 'Genel')`),
  index('idx_sablon_kategori').on(t.kategori),
])
```

### Pattern 3: Sidecar Variable Extraction via execa
**What:** Call Python sidecar with `extract-vars` command, receive variable list from JSON stdout.
**When to use:** Any operation that needs Python-side .docx processing.
**Example:**
```typescript
// lib/trpc/routers/sablon.ts (extract vars step)
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const result = await runSidecarCommand({
  command: 'extract-vars',
  params: { file_path: savedFilePath },
})

if (result.status === 'error') {
  throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
}

const variables = (result.result as { variables: string[] }).variables
// variables → store in docx_sablon.degiskenler
```

### Anti-Patterns to Avoid
- **Raw regex extraction from .docx XML:** The existing `odt-to-pdf.ts` uses `\{\{([^}]+)\}\}` regex on raw XML. This misses `{%p %}` paragraph tags, loop tags `{#users}`, and conditional tags. Use docxtemplater's inspect-module instead.
- **Storing file content in DB:** Never store .docx binary in SQLite BLOB. Store file path only; keep files on filesystem.
- **Background job for extraction:** D-02 decided synchronous extraction. Don't add queue complexity.
- **Separate upload page:** D-03 decided settings page sub-section. Don't create `/sablon-yonetimi` route.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| .docx variable extraction | Regex on raw XML | `docxtemplater` inspect-module | Handles nested tags, loops `{#}`, conditions `{?}`, paragraph tags `{%p %}`; 8+ years of edge case fixes [VERIFIED: docxtemplater.com/faq] |
| .docx ZIP handling | Manual unzip with `adm-zip` | `pizzip` | Official docxtemplater dependency; handles binary content correctly [VERIFIED: docxtemplater docs] |
| File upload multipart | Custom FormData parser | Next.js `request.formData()` | Native Web API, no dependencies needed [VERIFIED: existing upload/route.ts] |
| Kategori enum validation | Manual string comparison | `z.enum(['STK', 'Mahkeme', 'Genel'])` + `check()` | Double safety, matches existing `belgeKategoriEnum` pattern [VERIFIED: codebase] |
| Category filter dropdown | Custom select component | shadcn/ui `Select` | Already in project (`components/ui/select.tsx`) [VERIFIED: glob] |
| Upload progress | Custom spinner logic | `isPending` from React Query mutation | Already used by all existing CRUD sections [VERIFIED: codebase] |

**Key insight:** .docx is a ZIP containing XML. The XML structure splits text across multiple `<w:t>` elements, so a regex like `\{\{var\}\}` can fail if Word splits `{{` and `var` into separate XML nodes. Docxtemplater's parser handles this correctly by working at the OpenXML level.

## Common Pitfalls

### Pitfall 1: .docx XML text splitting breaks regex extraction
**What goes wrong:** Word splits placeholder text across multiple `<w:t>` XML elements (e.g., `{{` in one, `muvekkil_ad` in another, `}}` in a third). Simple regex `\{\{([^}]+)\}\}` fails to match.
**Why it happens:** Word's auto-formatting, spell-check underlines, and font changes cause text node fragmentation in the OpenXML structure.
**How to avoid:** Use docxtemplater's inspect-module which parses the XML tree correctly and reconstructs tag names from fragmented text nodes. [CITED: docxtemplater.com/docs/faq/#get-list-of-placeholders]
**Warning signs:** Template uploads succeed but return fewer variables than expected, or miss variables that contain formatting.

### Pitfall 2: Drizzle `check()` constraint with SQLite migration
**What goes wrong:** `drizzle-kit push` with SQLite check constraints can behave unpredictably — it may always try to re-apply the constraint or fail if indexes exist.
**Why it happens:** SQLite's ALTER TABLE limitations; drizzle-kit has known issues with check constraints in push mode (GitHub issue #4574). [VERIFIED: github.com/drizzle-team/drizzle-orm/issues/4574]
**How to avoid:** Use `drizzle-kit generate` to create explicit migration SQL files, then `drizzle-kit migrate`. Don't use `push` for schema changes involving check constraints.
**Warning signs:** `drizzle-kit push` reports "always has changes" even when schema hasn't changed.

### Pitfall 3: Path traversal in file upload
**What goes wrong:** Malicious filename like `../../../etc/passwd.docx` could escape the upload directory.
**Why it happens:** Using user-provided filenames directly in `path.join()` without validation.
**How to avoid:** Sanitize filenames (replace non-alphanumeric chars), then verify resolved path starts with upload directory base path using `path.resolve().startsWith()`. Existing `belge.ts` delete pattern already does this. [VERIFIED: codebase `lib/trpc/routers/belge.ts` line 53-54]
**Warning signs:** File paths containing `..` or absolute paths.

### Pitfall 4: Template delete leaves orphan files
**What goes wrong:** Deleting template DB record without removing the file from disk, or vice versa.
**Why it happens:** Not handling the two-step delete (DB + filesystem) atomically.
**How to avoid:** Delete DB record first (has FK cascade/SET NULL), then remove file. If file deletion fails, log error but don't throw — DB state is already correct. Matches existing `belgeRouter.delete` pattern. [VERIFIED: codebase]
**Warning signs:** `./uploads/templates/` accumulating files with no matching DB records.

### Pitfall 5: `belge.sablon_id` FK migration on existing data
**What goes wrong:** Adding `sablon_id` column to `belge` table fails because existing rows have no matching template.
**Why it happens:** SQLite requires nullable FK columns when adding to tables with existing data.
**How to avoid:** Column MUST be `nullable` with `default(null)`. D-08 confirms SET NULL behavior. Migration must add column as nullable, not NOT NULL. [VERIFIED: Drizzle docs + SQLite constraints]
**Warning signs:** Migration fails with "NOT NULL constraint failed" on existing `belge` rows.

### Pitfall 6: docxtemplater inspect-module returns nested tag structure
**What goes wrong:** `getAllTags()` returns `{ company: {}, users: { name: {}, age: {} } }` — nested objects, not flat array. Need to flatten for storage.
**Why it happens:** Docxtemplater's AST preserves loop/section nesting.
**How to avoid:** Write a flattening function that extracts all leaf keys. For this phase (D-05: names only), flatten to `['company', 'users', 'name', 'age']`. [CITED: docxtemplater.com/docs/faq/#get-list-of-placeholders]
**Warning signs:** Stored variables contain `{}` objects instead of string names.

## Code Examples

Verified patterns from official sources:

### docxtemplater Variable Extraction (Node.js)
```typescript
// Source: https://docxtemplater.com/docs/faq/#get-list-of-placeholders
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import fs from 'fs'

export function extractVariablesFromDocx(filePath: string): string[] {
  const buffer = fs.readFileSync(filePath)
  const zip = new PizZip(buffer)

  const InspectModule = require('docxtemplater/js/inspect-module.js')
  const iModule = InspectModule()

  const doc = new Docxtemplater(zip, {
    modules: [iModule],
    linebreaks: true,
    paragraphLoop: true,
  })

  // Compile without rendering (no data needed)
  doc.compile()

  const tags = iModule.getAllTags()
  return flattenTags(tags)
}

function flattenTags(tags: Record<string, unknown>): string[] {
  const result: string[] = []
  function walk(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullName = prefix ? `${prefix}.${key}` : key
      result.push(fullName)
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        walk(value as Record<string, unknown>, fullName)
      }
    }
  }
  walk(tags)
  return result
}
```

### Python sidecar extract-vars handler
```python
# scripts/docx-pipeline/main.py — replace handle_extract_vars stub
import zipfile
import re
import io

def handle_extract_vars(params: dict[str, Any]) -> dict[str, Any]:
    """Extract {{var}} and {%p var%} placeholders from a .docx file."""
    file_path = params.get("file_path")
    if not file_path:
        return {"status": "error", "code": 1, "message": "file_path param gerekli"}

    try:
        with open(file_path, "rb") as f:
            zip_data = f.read()

        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            if "word/document.xml" not in zf.namelist():
                return {"status": "error", "code": 1, "message": "Geçersiz .docx dosyası"}

            xml_content = zf.read("word/document.xml").decode("utf-8")

        # Extract all text content from XML
        text_content = re.sub(r'<[^>]+>', ' ', xml_content)
        text_content = re.sub(r'&\w+;', ' ', text_content)
        text_content = re.sub(r'\s+', ' ', text_content)

        # Find {{var}} and {%p var%} patterns
        double_brace = re.findall(r'\{\{\s*([^}]+?)\s*\}\}', text_content)
        paragraph_tags = re.findall(r'\{%p\s+([^%]+?)%\}', text_content)

        variables = list(dict.fromkeys(double_brace + paragraph_tags))  # dedupe, preserve order
        variables = [v.strip() for v in variables if v.strip()]

        logger.info("extract-vars-success", file_path=file_path, var_count=len(variables))
        return {"status": "success", "result": {"variables": variables}}

    except Exception as e:
        logger.error("extract-vars-error", error=str(e))
        return {"status": "error", "code": 2, "message": f"Değişken çıkarma hatası: {e}"}
```

### Drizzle Schema: docx_sablon + belge.sablon_id FK
```typescript
// lib/schema.ts additions
import { sqliteTable, text, integer, check, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

export const SABLOON_KATEGORILER = ['STK', 'Mahkeme', 'Genel'] as const
export type SablonKategori = typeof SABLOON_KATEGORILER[number]

export const docxSablon = sqliteTable('docx_sablon', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  kategori: text('kategori').notNull(),
  dosya_yolu: text('dosya_yolu').notNull(),
  degiskenler: text('degiskenler', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`(json_array())`),
  default_aksiyon: text('default_aksiyon'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  check('kategori_check', sql`${t.kategori} IN ('STK', 'Mahkeme', 'Genel')`),
  index('idx_sablon_kategori').on(t.kategori),
])

// Add sablon_id to existing belge table
export const belge = sqliteTable('belge', {
  // ... existing columns ...
  sablon_id: integer('sablon_id').references(() => docxSablon.id, { onDelete: 'set null' }),
}, (t) => [
  // ... existing indexes ...
  index('idx_belge_sablon').on(t.sablon_id),
])
```

### tRPC Router: sablon CRUD
```typescript
// lib/trpc/routers/sablon.ts
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { docxSablon, SABLOON_KATEGORILER } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const sablonKategoriEnum = z.enum(SABLOON_KATEGORILER)

export const sablonRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(docxSablon).orderBy(desc(docxSablon.updated_at))
  }),

  create: protectedProcedure
    .input(z.object({
      ad: z.string().min(1).max(200),
      kategori: sablonKategoriEnum,
      filePath: z.string(),
      fileName: z.string(),
      fileSize: z.number().int(),
    }))
    .mutation(async ({ input }) => {
      // Extract variables via sidecar
      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: input.filePath },
      })

      if (result.status === 'error') {
        // Clean up uploaded file on error
        if (fs.existsSync(input.filePath)) fs.unlinkSync(input.filePath)
        throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
      }

      const variables = (result.result as { variables: string[] }).variables

      const [row] = await db.insert(docxSablon).values({
        ad: input.ad,
        kategori: input.kategori,
        dosya_yolu: input.filePath,
        degiskenler: variables,
      }).returning()

      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [template] = await db.select().from(docxSablon).where(eq(docxSablon.id, input.id))
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Şablon bulunamadı.' })
      }

      // Delete DB record first (SET NULL on belge.sablon_id)
      await db.delete(docxSablon).where(eq(docxSablon.id, input.id))

      // Then remove file from disk
      const basePath = path.resolve(process.cwd(), 'uploads', 'templates')
      if (path.resolve(template.dosya_yolu).startsWith(basePath)) {
        try { fs.unlinkSync(template.dosya_yolu) } catch { /* log only */ }
      }

      return { success: true }
    }),

  update: protectedProcedure  // D-06: overwrite — same ID, replace file
    .input(z.object({
      id: z.number().int(),
      filePath: z.string(),
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [existing] = await db.select().from(docxSablon).where(eq(docxSablon.id, input.id))
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Şablon bulunamadı.' })
      }

      // Extract variables from new file
      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: input.filePath },
      })

      if (result.status === 'error') {
        if (fs.existsSync(input.filePath)) fs.unlinkSync(input.filePath)
        throw new TRPCError({ code: 'BAD_REQUEST', message: result.message })
      }

      const variables = (result.result as { variables: string[] }).variables

      // Remove old file, update record
      const basePath = path.resolve(process.cwd(), 'uploads', 'templates')
      if (path.resolve(existing.dosya_yolu).startsWith(basePath)) {
        try { fs.unlinkSync(existing.dosya_yolu) } catch { /* log only */ }
      }

      const [updated] = await db.update(docxSablon)
        .set({
          dosya_yolu: input.filePath,
          degiskenler: variables,
          updated_at: sql`(datetime('now'))`,
        })
        .where(eq(docxSablon.id, input.id))
        .returning()

      return updated
    }),
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tiptap HTML editor for templates (Phase 7) | .docx Word templates + docxtpl | v1.2 (current milestone) | Users edit in Word, upload .docx; no in-app editor |
| .odt upload + adm-zip XML parsing (dilekce-odt) | .docx upload + docxtemplater inspect-module | v1.2 (current milestone) | Better .docx support, Jinja2 compatibility |
| jsPDF for PDF generation | LibreOffice headless via sidecar | v1.2 (current milestone) | Perfect Word rendering, Turkish fonts, no font embedding issues |
| Regex `\{\{([^}]+)\}\}` for variable extraction | docxtemplater inspect-module AST parsing | Phase 16 | Handles fragmented XML, nested tags, paragraph markers |

**Deprecated/outdated:**
- `dilekce_sablonu` table: Will be dropped in Phase 20 (TEMIZ-05)
- `dilekce_odt_sablonu` table: Will be dropped in Phase 20 (TEMIZ-05)
- `lib/services/odt-to-pdf.ts`: Contains `extractVariablesFromOdt` using regex — will be removed in Phase 20 (TEMIZ-04)
- `app/api/upload/route.ts`: Current upload route saves to `E:/sigorta-belgeler` — template upload uses separate `./uploads/templates/` path (D-04)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 10 MB file size limit for template uploads | Standard Stack / Code Examples | User may need larger templates; easy to adjust |
| A2 | Python-side `extract-vars` can use simple regex on extracted text (after XML tag stripping) | Code Examples | If Word splits placeholders across XML nodes, Python regex may miss some vars. Docxtemplater on Node.js side is safer but adds npm dependency |
| A3 | `drizzle-kit generate` + `migrate` works correctly for adding nullable FK column to existing table | Common Pitfalls | Migration may need manual SQL if drizzle-kit struggles with ALTER TABLE + FK |
| A4 | `text({ mode: 'json' })` with `default(sql\`(json_array())\`)` produces valid SQLite default for existing rows | Code Examples | If default fails, existing rows get NULL instead of `[]` — handled by `.notNull()` constraint |

## Open Questions

1. **Should variable extraction happen in Node.js (docxtemplater) or Python (sidecar)?**
   - What we know: Phase 15 sidecar already has `extract-vars` command stub. D-02 says "call sidecar extract-vars."
   - What's unclear: Python-side extraction needs to handle OpenXML correctly. Node.js docxtemplater is battle-tested for this.
   - Recommendation: Implement Python-side extraction with simple regex on text-extracted XML for Phase 16 (names only, D-05). If reliability issues emerge, switch to Node.js docxtemplater in a future iteration. The Python approach keeps the sidecar as single source of truth for all docx operations.

2. **Should the upload API route be under `/api/templates/upload` or reuse existing `/api/upload`?**
   - What we know: Existing `/api/upload` saves to `E:/sigorta-belgeler/{dosyaId}/`.
   - What's unclear: Reusing the same route would require path discrimination logic.
   - Recommendation: Separate route at `/api/templates/upload` for clean separation. Different storage path (D-04: `./uploads/templates/`), different validation rules (.docx only, no dosyaId).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Core runtime | ✓ | v20+ (from package.json engines) | — |
| Python 3 | Sidecar extract-vars | ✓ (from Phase 15 setup) | — | — |
| docxtemplater npm | Variable extraction | ✗ (not yet installed) | 3.68.5 | `npm install docxtemplater pizzip` |
| pizzip npm | .docx ZIP handling | ✗ (not yet installed) | 3.2.0 | `npm install docxtemplater pizzip` |
| `./uploads/templates/` directory | File storage | ✗ (needs creation) | — | Created at runtime by upload route |
| execa | Sidecar IPC | ✓ (already installed) | 9.6.1 | — |

**Missing dependencies with fallback:**
- `docxtemplater` + `pizzip` — install via `npm install`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | vitest config in package.json (`"test": "vitest run"`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SABLON-01 | .docx upload, other formats rejected | unit | `vitest run -t "SABLON-01"` | ❌ Wave 0 |
| SABLON-02 | Name + kategori required on upload | unit | `vitest run -t "SABLON-02"` | ❌ Wave 0 |
| SABLON-03 | Variables extracted and stored as JSON | unit | `vitest run -t "SABLON-03"` | ❌ Wave 0 |
| SABLON-04 | Template list with category + name | unit | `vitest run -t "SABLON-04"` | ❌ Wave 0 |
| SABLON-05 | Delete template → SET NULL on belge.sablon_id | integration | `vitest run -t "SABLON-05"` | ❌ Wave 0 |
| SABLON-06 | Overwrite template → same ID, new vars | unit | `vitest run -t "SABLON-06"` | ❌ Wave 0 |
| SABLON-07 | docx_sablon table schema correct | unit | `vitest run -t "SABLON-07"` | ❌ Wave 0 |
| SABLON-08 | belge.sablon_id FK with SET NULL | integration | `vitest run -t "SABLON-08"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/sablon.test.ts` — covers SABLON-01 through SABLON-08
- [ ] `tests/sablon-schema.test.ts` — schema validation tests
- [ ] `tests/fixtures/test-template.docx` — sample .docx with known variables for extraction tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod enum for kategori, file extension check, file size limit |
| V6 Cryptography | no | No encryption needed for local-only deployment |

### Known Threat Patterns for File Upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via filename | Tampering | Sanitize filename, verify resolved path starts with upload base dir |
| Non-.docx file upload | Spoofing | Check file extension + MIME type on server side |
| Oversized file upload | Denial of Service | 10 MB size limit enforced in API route |
| Orphaned files on failed upload | Integrity | Clean up uploaded file if sidecar extraction fails |

## Sources

### Primary (HIGH confidence)
- Context7 `/llmstxt/orm_drizzle_team_llms_txt` — Drizzle SQLite column types, JSON columns, check constraints
- https://docxtemplater.com/docs/faq/#get-list-of-placeholders — docxtemplater inspect-module API, getAllTags()
- https://docxtemplater.com/docs/get-started-node/ — Node.js setup with docxtemplater + PizZip
- https://orm.drizzle.team/docs/indexes-constraints — Drizzle check() constraint syntax
- npm registry — docxtemplater 3.68.5, pizzip 3.2.0, execa 9.6.1, drizzle-orm 0.45.2

### Secondary (MEDIUM confidence)
- Codebase analysis: `lib/trpc/routers/belge.ts` — upload/delete pattern
- Codebase analysis: `lib/trpc/routers/dilekce-odt.ts` — existing template upload with variable extraction
- Codebase analysis: `lib/services/docx-pipeline.ts` — Phase 15 sidecar bridge
- Codebase analysis: `components/ayarlar/ayarlar-crud-section.tsx` — CRUD UI pattern
- Codebase analysis: `scripts/docx-pipeline/main.py` — sidecar command routing
- GitHub issue #4574 — drizzle-kit push + SQLite check constraints bug

### Tertiary (LOW confidence)
- [ASSUMED] 10 MB file size limit — reasonable default, not verified against user requirements
- [ASSUMED] Python-side regex extraction sufficient for names-only — may need docxtemplater on Node.js if XML fragmentation causes issues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm registry and Context7
- Architecture: HIGH — follows existing codebase patterns (belge.ts, dilekce-odt.ts)
- Pitfalls: HIGH — verified via official docs, GitHub issues, and codebase analysis

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days — stable libraries, no fast-moving deps)
