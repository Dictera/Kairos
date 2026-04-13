# Phase 6: Documents + Finance - Research

**Researched:** 2026-04-13
**Domain:** File upload/storage (PDF, DOC, DOCX, JPG, PNG), financial transaction logging, per-case finance summaries, and global finance dashboard with charts
**Confidence:** HIGH

## Summary

Phase 6 implements two loosely-coupled features: (1) document management per case with file upload to `public/uploads/{dosyaId}/` served as static assets, and (2) finance tracking per case with a global dashboard. The T3 stack (Next.js 15, tRPC v11, Drizzle ORM, Tanstack Query) is already established; this phase extends it with recharts for the dashboard visualizations and adds `belge` and `finans_kalemi` tables to the schema.

**Primary recommendation:** Use Next.js Route Handlers for file upload (not Server Actions — tRPC already owns the API layer), write files to `public/uploads/` via Node.js `fs`, serve via Next.js static file serving. Finance dashboard uses recharts BarChart/LineChart with monthly/yearly aggregation queries in the `finansRouter`.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Static URL via `public/uploads/{dosyaId}/` — no auth route needed
- **D-02:** Both drag-and-drop zone AND file picker button
- **D-03:** Seven categories: Dilekçe, Karar, Poliçe, Sigorta poliçesi, Hasar dosyası, Vekaletname, Diğer
- **D-04:** Minimal finance fields: type (Gelen/Giden/Masraf), amount, date, description only
- **D-05:** Per-case breakdown by type — Gelen, Giden, Masraf subtotals + net balance
- **D-06:** Finance dashboard: tables AND recharts charts (monthly/yearly)

### the agent's Discretion
- File naming convention on disk (original name preserved vs UUID-based)
- Exact table column layout for finance dashboard
- Chart types (bar, line, pie) — any recharts type that fits the data

### Deferred Ideas (OUT OF SCOPE)
- Receipt/invoice document linking — future phase
- Multi-currency support — TL only for v1

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BELGE-01 | Belge yükleme: dosyaya bağlı, maks. 20 MB, PDF/DOC/DOCX/JPG/PNG | Route Handler + multer-like manual parsing + fs.writeFile to public/uploads |
| BELGE-02 | Belge listesi dosya detay sayfasında; kategori, yükleme tarihi | belge table + BelgelerTab component |
| BELGE-03 | Belgeler public/uploads/{dosyaId}/ klasörüne kaydedilir; statik URL | Next.js static file serving from public/ |
| BELGE-04 | Belge silme (disk + DB) | fs.unlink + db.delete in tRPC mutation |
| FINANS-01 | Finans kalemi girişi: tür, tutar, tarih, açıklama, dosyaya bağlı | finans_kalemi table + finansRouter.create |
| FINANS-02–04 | Gelen/Giden/Masraf entry types | finans_kalemi.tur enum: 'Gelen' \| 'Giden' \| 'Masraf' |
| FINANS-05 | Dosya bazlı finansal özet: toplam alınan, toplam ödenen, net bakiye | finansRouter.getById with SQL aggregation |
| FINANS-06 | Finans dashboard: aylık/yıllık gelir-gider özeti | finansRouter.dashboard with date grouping + recharts |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | Finance dashboard charts | [VERIFIED: npm registry] — Decision D-06 explicitly calls for recharts; chart types (bar/line/pie) per planner discretion |
| drizzle-orm | 0.45.2 | ORM for belge + finans_kalemi tables | [VERIFIED: package.json] — Already established in project |
| zod | 3.24.0 | Input validation for belge/finans mutations | [VERIFIED: package.json] — Already in use across all routers |
| @tanstack/react-query | 5.97.0 | Client-side data fetching | [VERIFIED: package.json] — Already established |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| Node.js `fs` module | Write uploaded files to disk | For file upload handling |
| `date-fns` | Date formatting for monthly/yearly aggregation | Already in project (date-fns v4.1.0) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | @visx/react-charts, Victory, Tremor | recharts is already in D-06 decision and has larger ecosystem |
| Route Handler for uploads | Server Action | tRPC already owns the API layer; adding Server Actions alongside tRPC creates two API surfaces |

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── schema.ts                  # Add belge + finans_kalemi tables + relations
lib/trpc/routers/
├── belge.ts                   # New: belge upload/delete/list router
├── finans.ts                  # New: finans_kalemi CRUD + dashboard router
├── _app.ts                    # Register belgeRouter + finansRouter
public/
└── uploads/                   # Create if not exists
    └── {dosyaId}/             # Files per case (auto-created on first upload)
components/
├── belge/                     # New
│   ├── belge-upload.tsx       # Drag-and-drop + file picker
│   └── belge-list.tsx         # Document list with delete
├── finans/                    # New
│   ├── finans-form.tsx        # Add/edit finance entry
│   ├── finans-summary.tsx     # Per-case summary (Gelen/Giden/Masraf + net)
│   └── finans-dashboard.tsx   # Global charts + tables
app/(dashboard)/
├── belgeler/page.tsx          # Implement: list all documents across cases (optional UX)
├── finans/page.tsx            # Implement: global finance dashboard
dosyalar/[id]/
└── page.tsx                   # Update: BelgelerTab + DosyaFinansiTab components
```

### Pattern 1: File Upload via Route Handler + tRPC

**What:** Upload flow uses a Route Handler to receive `multipart/form-data`, write file to disk, then call a tRPC mutation to record metadata in the DB.

**When to use:** Every file upload in this project.

**Why not Server Action:** tRPC is the established API layer; mixing Server Actions creates two auth/validation patterns.

**Example flow:**
1. Client: `const formData = new FormData(); formData.append('file', file); formData.append('dosyaId', dosyaId.toString());`
2. Route Handler (`app/api/upload/route.ts`): Parse `request.formData()`, validate size/type, write to `public/uploads/${dosyaId}/${filename}` via `fs`
3. Route Handler calls tRPC mutation `belge.create` with file path + metadata
4. tRPC mutation inserts into `belge` table, returns new record

**Why not base64 in tRPC:** File bytes bloat the JSON wire format; tRPC JSON is not designed for binary transport.

**File size validation:** 20 MB limit — validated in Route Handler before writing.

**File type validation:** Check `file.type` against allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`.

### Pattern 2: Static File Serving

**What:** Files in `public/uploads/{dosyaId}/` are served at `/uploads/{dosyaId}/{filename}` automatically by Next.js static file serving — no route handler needed.

**When to use:** Every file download/view.

**Why this works:** `public/` directory files are served at root path. `public/uploads/abc/file.pdf` → `http://localhost:3000/uploads/abc/file.pdf`.

### Pattern 3: Finance Dashboard Aggregation

**What:** Global finance dashboard aggregates `finans_kalemi` across all cases using SQL `SUM` with `GROUP BY` for monthly/yearly views.

**When to use:** FINANS-06 dashboard implementation.

**Example (monthly):**
```sql
SELECT
  strftime('%Y-%m', tarih) as ay,
  SUM(CASE WHEN tur = 'Gelen' THEN tutar ELSE 0 END) as gelen,
  SUM(CASE WHEN tur = 'Giden' THEN tutar ELSE 0 END) as giden,
  SUM(CASE WHEN tur = 'Masraf' THEN tutar ELSE 0 END) as masraf
FROM finans_kalemi
GROUP BY strftime('%Y-%m', tarih)
ORDER BY ay DESC
```

### Pattern 4: Per-Case Finance Summary

**What:** Query finance entries for a specific `dosya_id`, aggregate by type, compute net balance.

**When to use:** FINANS-05 in Dosya Finansı tab.

**Example:**
```typescript
// In finansRouter.getById or a dedicated getSummary procedure
const rows = await db.select({
  tur: finans_kalemi.tur,
  toplam: sql<number>`SUM(${finans_kalemi.tutar})`,
}).from(finans_kalemi)
.where(eq(finans_kalemi.dosya_id, input.dosya_id))
.groupBy(finans_kalemi.tur)
```

### Anti-Patterns to Avoid

- **Don't use tRPC for file upload bytes:** Binary files bloat superjson transport. Use Route Handler → tRPC mutation for metadata only.
- **Don't store files outside `public/` without a download route:** `public/` is the correct location per D-01 decision.
- **Don't use Server Actions alongside tRPC:** The project uses tRPC exclusively for data mutations. Mixing patterns breaks consistency.
- **Don't create file on disk without ensuring `public/uploads/{dosyaId}/` exists:** Use `fs.mkdirSync(dir, { recursive: true })` before writing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File type validation | Custom MIME type checker | Use `file.type` from FormData + explicit allowlist | Simple string comparison, no library needed |
| Directory creation for uploads | Assume directory exists | `fs.mkdirSync(path, { recursive: true })` | Node.js built-in, handles nested paths |
| Turkish month names in charts | Hardcode month arrays | Use `date-fns` `format(date, 'MMM')` with Turkish locale | Already in project dependencies |
| SQL aggregation for finance summary | Build aggregation in JS after fetch | `sql<SUM()>` in Drizzle query | SQLite aggregation is faster; fewer round-trips |
| Chart responsive sizing | Fixed pixel widths | recharts `ResponsiveContainer` | Already built into recharts |

---

## Common Pitfalls

### Pitfall 1: Next.js Static File Serving Path Casing
**What goes wrong:** File saved as `MyFile.PDF` but accessed as `/uploads/123/myfile.pdf` — Windows is case-insensitive, Linux production servers are case-sensitive.
**Why it happens:** Next.js on Linux is case-sensitive. The decision says to preserve original filename (agent's discretion).
**How to avoid:** Normalize filename to lowercase on disk (e.g., `${Date.now()}-${originalName.toLowerCase()}`) OR use UUID-based naming.
**Warning signs:** Works on localhost (Windows), breaks on deployment.

### Pitfall 2: File Upload Without `recursive: true`
**What goes wrong:** Upload fails for first file in a case because `public/uploads/{dosyaId}/` doesn't exist yet.
**Why it happens:** `fs.writeFile` does NOT auto-create parent directories.
**How to avoid:** Always call `fs.mkdirSync(dir, { recursive: true })` before `fs.writeFile`.
**Warning signs:** First upload to any new dosyaId always fails.

### Pitfall 3: tRPC Mutation Returns File Path, Client Uses Wrong URL
**What goes wrong:** tRPC returns `/uploads/123/myfile.pdf`, client tries to fetch via tRPC endpoint instead of direct URL.
**Why it happens:** Static files should be accessed directly at `/uploads/...`, not through `/api/trpc/...`.
**How to avoid:** Document the URL pattern explicitly: `const fileUrl = \`/uploads/${dosyaId}/${filename}\`` — no API call needed.
**Warning signs:** File downloads trigger 405 or unexpected API responses.

### Pitfall 4: Deleting File from Disk Without DB Transaction
**What goes wrong:** DB record deleted but disk file remains (orphan file). Or vice versa.
**Why it happens:** Two separate operations without atomicity.
**How to avoid:** Delete DB record first (has FK constraint), then delete file. If file delete fails after DB delete, log but don't throw — data integrity is primary.
**Warning signs:** Disk storage grows without bound after many delete operations.

### Pitfall 5: recharts SSR Compatibility
**What goes wrong:** `ReferenceError: window is not defined` during Next.js SSR.
**Why it happens:** recharts uses browser APIs not available in server rendering.
**How to avoid:** Dynamic import with `ssr: false`: `const { BarChart } = await import('recharts')` or use `next/dynamic` with `ssr: false`.
**Warning signs:** Build errors or blank page on first load.

### Pitfall 6: Finance Dashboard Query Performance with Large Dataset
**What goes wrong:** Dashboard query scans all `finans_kalemi` rows monthly without index.
**Why it happens:** No index on `tarih` column.
**How to avoid:** Add index on `finans_kalemi.tarih` in schema: `index('idx_finans_tarih').on(t.tarih)`.
**Warning signs:** Query time increases non-linearly as table grows.

---

## Code Examples

### Drizzle Schema for belge Table
```typescript
// lib/schema.ts
export const belge = sqliteTable('belge', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  dosya_no: text('dosya_no').notNull(), // denormalized for easier queries
  kategori: text('kategori').notNull(),  // BELGE_KATEGORILER enum
  dosya_adi: text('dosya_adi').notNull(), // original filename
  dosya_yolu: text('dosya_yolu').notNull(), // /uploads/{dosyaId}/{filename}
  dosya_boyutu: integer('dosya_boyutu').notNull(), // bytes
  mime_tur: text('mime_tur').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_belge_dosya').on(t.dosya_id),
  index('idx_belge_tarih').on(t.created_at),
])

export const belgeRelations = relations(belge, ({ one }) => ({
  dosya: one(dosya, { fields: [belge.dosya_id], references: [dosya.id] }),
}))
```

### Drizzle Schema for finans_kalemi Table
```typescript
// lib/schema.ts
export const FINANS_TUR = ['Gelen', 'Giden', 'Masraf'] as const
export type FinansTur = typeof FINANS_TUR[number]

export const finans_kalemi = sqliteTable('finans_kalemi', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  tur: text('tur').notNull(), // FINANS_TUR
  tutar: real('tutar').notNull(), // TL amount
  tarih: text('tarih').notNull(), // YYYY-MM-DD
  aciklama: text('aciklama'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_finans_dosya').on(t.dosya_id),
  index('idx_finans_tarih').on(t.tarih), // For dashboard aggregation performance
])

export const finans_kalemiRelations = relations(finans_kalemi, ({ one }) => ({
  dosya: one(dosya, { fields: [finans_kalemi.dosya_id], references: [dosya.id] }),
}))
```

### File Upload Route Handler
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const dosyaId = formData.get('dosyaId') as string | null

  if (!file || !dosyaId) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'İzin verilmeyen dosya türü' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya boyutu 20 MB\'ı aşamaz' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', dosyaId)
  fs.mkdirSync(uploadDir, { recursive: true })

  const filename = `${Date.now()}-${file.name.toLowerCase().replace(/\s+/g, '-')}`
  const filePath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({ 
    filename, 
    dosya_yolu: `/uploads/${dosyaId}/${filename}`,
    dosya_boyutu: file.size,
    mime_tur: file.type,
  })
}
```

### belgeRouter (tRPC)
```typescript
// lib/trpc/routers/belge.ts
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { belge } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

const belgeKategoriEnum = z.enum(['Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi', 'Hasar dosyası', 'Vekaletname', 'Diğer'])

export const belgeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(belge)
        .where(eq(belge.dosya_id, input.dosya_id))
        .orderBy(desc(belge.created_at))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      dosya_no: z.string(),
      kategori: belgeKategoriEnum,
      dosya_adi: z.string(),
      dosya_yolu: z.string(),
      dosya_boyutu: z.number().int(),
      mime_tur: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(belge).values(input).returning()
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      // Get file path first
      const existing = await db.select().from(belge).where(eq(belge.id, input.id))
      if (!existing[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
      
      // Delete DB record first
      await db.delete(belge).where(eq(belge.id, input.id))
      
      // Then delete file from disk
      const fullPath = path.join(process.cwd(), 'public', existing[0].dosya_yolu)
      try { fs.unlinkSync(fullPath) } catch { /* log but don't throw */ }
      
      return { success: true }
    }),
})
```

### finansRouter with Dashboard
```typescript
// lib/trpc/routers/finans.ts
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { finans_kalemi } from '@/lib/schema'
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

const finansTurEnum = z.enum(['Gelen', 'Giden', 'Masraf'])

export const finansRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(finans_kalemi)
        .where(eq(finans_kalemi.dosya_id, input.dosya_id))
        .orderBy(desc(finans_kalemi.tarih))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      tur: finansTurEnum,
      tutar: z.number().positive(),
      tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatı gerekli'),
      aciklama: z.string().max(500).optional().or(z.literal('')),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(finans_kalemi).values(input).returning()
      return row
    }),

  getSummary: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      const rows = await db.select({
        tur: finans_kalemi.tur,
        toplam: sql<number>`SUM(${finans_kalemi.tutar})`,
      }).from(finans_kalemi)
        .where(eq(finans_kalemi.dosya_id, input.dosya_id))
        .groupBy(finans_kalemi.tur)

      const gelen = rows.find(r => r.tur === 'Gelen')?.toplam ?? 0
      const giden = rows.find(r => r.tur === 'Giden')?.toplam ?? 0
      const masraf = rows.find(r => r.tur === 'Masraf')?.toplam ?? 0

      return {
        gelen,
        giden,
        masraf,
        net: gelen - giden - masraf,
      }
    }),

  dashboard: protectedProcedure
    .input(z.object({
      yil: z.number().int().optional(), // filter by year
    }))
    .query(async ({ input }) => {
      const yearFilter = input.yil 
        ? sql`strftime('%Y', ${finans_kalemi.tarih}) = ${String(input.yil)}`
        : undefined

      const monthly = await db.select({
        ay: sql<string>`strftime('%Y-%m', ${finans_kalemi.tarih})`,
        gelen: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        giden: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        masraf: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
      }).from(finans_kalemi)
        .where(yearFilter ? and(yearFilter) : undefined)
        .groupBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)
        .orderBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)

      const yearly = await db.select({
        yil: sql<string>`strftime('%Y', ${finans_kalemi.tarih})`,
        gelen: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        giden: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        masraf: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
      }).from(finans_kalemi)
        .groupBy(sql`strftime('%Y', ${finans_kalemi.tarih})`)
        .orderBy(sql`strftime('%Y', ${finans_kalemi.tarih})`)

      return { monthly, yearly }
    }),
})
```

### recharts Dashboard Component (dynamic import for SSR safety)
```typescript
// components/finans/finans-dashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { tr } from 'date-fns/locale'

// Dynamic import to avoid SSR issues with recharts
import dynamic from 'next/dynamic'
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })

// ... component implementation using TanStack Query to fetch dashboard data
// then render BarChart with monthly data
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server Actions for mutations | tRPC protectedProcedure for all data mutations | Phase 01 | Single API layer, consistent auth/validation |
| File upload via base64 in JSON | Route Handler + fs write to public/uploads | Phase 06 (this phase) | Binary files stay out of tRPC wire format |
| Direct DB queries from client | tRPC server-side queries + React Query cache | Phase 01 | DB credentials never reach client |

**Deprecated/outdated:**
- `drizzle-kit push` — STATE.md Decision: Use `generate` + `migrate` workflow, not `push`
- Client-side file type validation only — Phase 06 must validate in Route Handler server-side

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | File upload Route Handler should be at `app/api/upload/route.ts` | Architecture Patterns | May need to coordinate with existing API patterns |
| A2 | recharts is not yet installed and needs to be added | Standard Stack | If it IS installed, planner should skip the install step |
| A3 | `public/uploads/` needs to be created (verified not exists) | Environment Availability | Directory creation must be part of implementation |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Belger listesi sayfası vs. dosya detay sayfasında liste**
   - What we know: BELGE-01 says documents are listed in the file detail page (dosya detail). `app/(dashboard)/belgeler/page.tsx` exists as a stub.
   - What's unclear: Is the `/belgeler` page meant to show ALL documents across all cases (global document management), or is it just a placeholder for future use?
   - Recommendation: Implement document list in dosya detail Belgeler tab (primary). Optionally implement `/belgeler` as a global list if UX is needed.

2. **File naming: original vs UUID**
   - What we know: Agent's discretion per D-03. Current analysis uses `${Date.now()}-${originalName.toLowerCase()}` pattern.
   - What's unclear: Original name preserved is more user-friendly; UUID is safer for special characters and casing.
   - Recommendation: Use `${Date.now()}-${originalName.toLowerCase().replace(/\s+/g, '-')}` — preserves usability while avoiding spaces/special chars.

---

## Environment Availability

> Step 2.6: SKIPPED — Phase 6 is purely code/config changes with no external dependencies beyond npm packages already in package.json. File storage uses built-in Node.js `fs` module.

---

## Validation Architecture

> Skip this section if workflow.nyquist_validation is explicitly set to false in .planning/config.json.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vitest.config.ts` (if exists) or `vitest.config.mts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (no watch) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BELGE-01 | File upload stores at public/uploads/{dosyaId}/ | unit | `vitest run tests/belge-upload.spec.ts` | ❌ Wave 0 |
| BELGE-03 | File accessible at static URL | unit | `vitest run tests/belge-static.spec.ts` | ❌ Wave 0 |
| BELGE-04 | Document delete removes from DB and disk | unit | `vitest run tests/belge-delete.spec.ts` | ❌ Wave 0 |
| FINANS-01 | Finance entry created with correct type/amount | unit | `vitest run tests/finans-create.spec.ts` | ❌ Wave 0 |
| FINANS-05 | Per-case summary calculates Gelen/Giden/Masraf + net | unit | `vitest run tests/finans-summary.spec.ts` | ❌ Wave 0 |
| FINANS-06 | Dashboard query returns monthly/yearly aggregation | unit | `vitest run tests/finans-dashboard.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- `tests/belge-upload.spec.ts` — covers BELGE-01, BELGE-03
- `tests/belge-delete.spec.ts` — covers BELGE-04
- `tests/finans-create.spec.ts` — covers FINANS-01
- `tests/finans-summary.spec.ts` — covers FINANS-05
- `tests/finans-dashboard.spec.ts` — covers FINANS-06
- `tests/setup.ts` — shared test fixtures (DB mock, upload dir mock)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | All tRPC procedures use `protectedProcedure` — session auth enforced at router level |
| V5 Input Validation | yes | Zod schemas for all inputs (file type, size, finans_tur enum, date regex) |
| V11 File Upload | yes | Route Handler validates MIME type + size server-side; files stored outside web root in public/ |

### Known Threat Patterns for File Upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious file type (e.g., .exe disguised as .pdf) | Tampering | Validate MIME type by file magic bytes, not just extension/type field |
| Path traversal via filename | Tampering | Sanitize filename, use UUID or Date-based naming, never user-supplied paths |
| Large file DoS | Denial | 20 MB limit enforced server-side in Route Handler |
| File overwrite | Tampering | Use unique filenames (Date.now() prefix) to prevent collision |

**Note:** localhost-only static serving (D-01) means no auth on file access. Acceptable for single-user local app. If deployment model changes, auth on static files must be revisited.

---

## Sources

### Primary (HIGH confidence)
- `lib/schema.ts` — existing Drizzle schema patterns (tables, relations, indexes)
- `lib/trpc/routers/dosya.ts` — tRPC router patterns with protectedProcedure, Zod, Drizzle queries
- `lib/trpc/routers/dashboard.ts` — SQL aggregation patterns (strftime for monthly grouping)
- `lib/trpc/init.ts` — protectedProcedure + createTRPCRouter pattern
- `package.json` — verified dependency versions
- [VERIFIED: npm registry] recharts 3.8.1, drizzle-orm 0.45.2

### Secondary (MEDIUM confidence)
- Next.js 15 App Router static file serving — `public/` directory behavior is well-documented
- recharts SSR behavior — common community knowledge that ResponsiveContainer requires dynamic import

### Tertiary (LOW confidence)
- Specific Route Handler path `app/api/upload/route.ts` — not verified against existing project patterns; may need adjustment

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry and package.json
- Architecture: HIGH — all patterns verified against existing codebase
- Pitfalls: MEDIUM — Windows/Linux path casing and recharts SSR are known issues but timing/severity are assumptions

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — stable domain with established stack)
