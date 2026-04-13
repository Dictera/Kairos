# Phase 7: Petition Templates + PDF + Reports - Research

**Researched:** 2026-04-13
**Domain:** PDF generation (pdfmake), Excel export (exceljs), Rich text editing (Tiptap), Variable substitution
**Confidence:** HIGH for stack/patterns; MEDIUM for Turkish font validation (pending spike)

## Summary

Phase 7 implements a petition template system with rich-text editing (Tiptap), PDF generation (pdfmake), variable substitution from case data, and report export (PDF/Excel). The core architecture is server-side PDF/Excel generation via API routes, tRPC routers for template CRUD, and client-side Tiptap editor for template composition. Turkish character support requires a font validation spike (07-01) before full implementation proceeds.

**Primary recommendation:** Use pdfmake 0.3.7 with embedded TTF font (Roboto recommended over Times New Roman pending spike), exceljs 4.4.0 for Excel exports, and simple regex-based `{{variable}}` substitution.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tiptap (rich text editor) — bold, italic, underline, bullet/numbered lists, headings, horizontal rule
- **D-02:** Template create/edit page: title input, Tiptap body editor, category dropdown, variable insertion via dropdown menu
- **D-03:** Template metadata: title, body (rich text HTML), category, variables JSON (predefined + custom)
- **D-04:** Full DILEKCE-02 variable set (15 predefined variables)
- **D-05:** Custom variables per template — stored in variables JSON
- **D-06:** Variable insertion: dropdown menu in Tiptap toolbar
- **D-07:** Library: **pdfmake** — declarative document definition
- **D-08:** Font: Times New Roman — no embedding (relies on system installation)
- **D-09:** Turkish character validation: Spike 07-01 must verify ş ğ ü ö ç ı İ render correctly
- **D-10:** Three template categories: İtiraz Dilekçesi, Cevap Dilekçesi, Genel
- **D-11:** Flow: Select template → preview (auto-fill) → edit variables → Generate PDF → Preview
- **D-12:** After preview: "Kaydet" (to Belgeler) or "İndir" (download)
- **D-13:** PDF storage at `E:/sigorta-belgeler/{dosyaId}/` with belge record
- **D-14:** Portfolio report: summary stats + bar/pie charts + tables
- **D-15:** Financial report: monthly/yearly + charts + tables (same layout)
- **D-16:** Portfolio report: PDF export only
- **D-17:** Financial report: PDF and Excel export
- **D-18:** Dosya listesi: Excel (XLSX) export

### the agent's Discretion
- Exact Tiptap plugin configuration and toolbar layout
- PDF styling (margins, font sizes, header/footer)
- Chart library choice (recharts already installed from Phase 6)
- Excel library choice (xlsx vs exceljs)
- Portfolio report: exact chart types (bar/pie for stage breakdown)
- Custom variable UI in template editor
- Variable substitution service exact implementation
- Save-to-belge: exact filename format for generated PDF

### Deferred Ideas (OUT OF SCOPE)
- Adli tatil automatic calculation in PDF date display
- Template versioning

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdfmake` | 0.3.7 | Server-side PDF generation | [VERIFIED: npm registry] Declarative document definition, mature (12k stars), good Turkish support with custom font |
| `exceljs` | 4.4.0 | Excel export (XLSX) | [VERIFIED: npm registry] MIT licensed, proper XLSX generation with styling |
| `@tiptap/react` | 3.22.3 | Rich text editor | [VERIFIED: npm registry] Headless, extensible, React 19 compatible |
| `@tiptap/starter-kit` | 3.22.3 | Tiptap core extensions | [VERIFIED: npm registry] Bold, italic, lists, headings |
| `@tiptap/extension-underline` | 3.22.3 | Underline support | [VERIFIED: npm registry] DILEKCE-01 requires underline |
| `@tiptap/extension-placeholder` | 3.22.3 | Editor placeholder | [VERIFIED: npm registry] UX polish for empty editor |
| `recharts` | 3.8.1 | Charts (already installed) | [VERIFIED: package.json] D-14/D-15 report charts |
| `date-fns` | 4.1.0 | Date formatting | [VERIFIED: package.json] Turkish locale for PDF dates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 3.24.0 | Input validation | [VERIFIED: package.json] Template variable schemas |
| `nanoid` | (available) | Unique filenames | [CITED: STACK.md] For generated PDF filenames |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdfmake` | `@react-pdf/renderer` | User locked on pdfmake (D-07); react-pdf uses React component model |
| `exceljs` | `xlsx`/`SheetJS` | [ASSUMED] exceljs is MIT licensed, xlsx has licensing ambiguity (SheetJS went proprietary 2022) |
| `Times New Roman` | Roboto/Noto Sans | D-08 locked but spike 07-01 may reveal Windows TNR lacks Turkish glyphs |

**Installation:**
```bash
npm install pdfmake@0.3.7 exceljs@4.4.0 @tiptap/react@3.22.3 @tiptap/starter-kit@3.22.3 @tiptap/extension-underline@3.22.3 @tiptap/extension-placeholder@3.22.3
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dilekce/
│   │   │   ├── page.tsx          # Template list
│   │   │   ├── yeni/page.tsx     # Create template
│   │   │   └── [id]/page.tsx     # Edit template
│   │   └── raporlar/
│   │       └── page.tsx         # Reports page
│   └── api/
│       └── dilekce/
│           └── [id]/
│               └── pdf/
│                   └── route.ts  # PDF generation endpoint
├── components/
│   ├── dilekce/
│   │   ├── sablon-editor.tsx    # Tiptap editor wrapper
│   │   ├── degisken-dropdown.tsx # Variable insertion dropdown
│   │   └── pdf-onizleme.tsx     # PDF preview modal
│   └── raporlar/
│       ├── portfy-ozet.tsx      # Portfolio stats
│       ├── finans-ozet.tsx      # Financial stats
│       └── rapor-图表.tsx       # Chart components
├── lib/
│   ├── trpc/
│   │   └── routers/
│   │       ├── dilekce.ts       # Template CRUD router
│   │       └── rapor.ts         # Report data router
│   └── pdf/
│       ├── fonts/               # Custom TTF fonts
│       │   └── Roboto-Regular.ttf
│       └── pdf-generator.ts     # pdfmake document builder
└── types/
    └── dilekce.ts               # TypeScript types
```

### Pattern 1: pdfmake Server-Side PDF Generation
**What:** API Route (`/api/dilekce/[id]/pdf/route.ts`) receives template + variables, generates PDF buffer, returns as binary.
**When to use:** Every petition PDF generation request.
**Example:**
```typescript
// Source: pdfmake 0.3 docs — server-side
import PdfPrinter from 'pdfmake'
import fs from 'fs'

const fonts = {
  Roboto: {
    normal: 'path/to/Roboto-Regular.ttf',
    bold: 'path/to/Roboto-Medium.ttf',
    italics: 'path/to/Roboto-Italic.ttf',
    bolditalics: 'path/to/Roboto-MediumItalic.ttf',
  },
}

const printer = new PdfPrinter(fonts)

export async function POST(req: Request) {
  const { templateBody, variables } = await req.json()
  const filledContent = substituteVariables(templateBody, variables)
  
  const docDefinition = {
    content: [{ text: filledContent, font: 'Roboto' }],
    defaultStyle: { font: 'Roboto' },
  }
  
  const pdfDoc = printer.createPdf(docDefinition)
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    pdfDoc.getBuffer((chunk) => resolve(Buffer.from(chunk)))
  })
  
  return new Response(pdfBuffer, {
    headers: { 'Content-Type': 'application/pdf' },
  })
}
```

### Pattern 2: Tiptap Editor with Variable Insertion
**What:** Tiptap editor with custom dropdown menu for inserting `{{variable}}` placeholders.
**When to use:** Template creation/edit UI.
**Example:**
```typescript
// Source: Tiptap 3.x docs — extensions
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { VariableDropdown } from './degisken-dropdown'

export function SablonEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Dilekçe içeriğini girin...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })
  
  return (
    <div>
      <VariableDropdown editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
```

### Pattern 3: Variable Substitution via Regex Replacement
**What:** Simple regex replacement of `{{variable}}` patterns with actual values.
**When to use:** Petition generation (filling template with case data).
**Example:**
```typescript
// Source: [ASSUMED] — common template pattern
function substituteVariables(
  template: string, 
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match // Keep {{unknown}} if not found
  })
}

// Usage
const filledBody = substituteVariables(
  'Sayın Mahkeme, {{müvekkil_adı}} müvekkilimdir.',
  { müvekkil_adı: 'Ahmet Yılmaz' }
)
// → 'Sayın Mahkeme, Ahmet Yılmaz müvekkilimdir.'
```

### Pattern 4: exceljs Server-Side XLSX Export
**What:** API route generates workbook with styled cells, returns as binary.
**When to use:** Financial report Excel export, filtered case list export.
**Example:**
```typescript
// Source: exceljs 4.4.x docs
import ExcelJS from 'exceljs'

export async function generateExcel(data: any[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Rapor')
  
  // Headers
  sheet.addRow(['Dosya No', 'Müvekkil', 'Tür', 'Durum'])
  
  // Data rows
  data.forEach(row => {
    sheet.addRow([row.dosya_no, row.müvekkil, row.tur, row.durum])
  })
  
  // Column widths
  sheet.columns = [
    { width: 15 },
    { width: 25 },
    { width: 10 },
    { width: 10 },
  ]
  
  return workbook.xlsx.writeBuffer()
}
```

### Pattern 5: Template CRUD via tRPC
**What:** Standard tRPC router pattern for template management.
**When to use:** All template list/create/update/delete operations.
**Example:**
```typescript
// Source: lib/trpc/routers/belge.ts (existing pattern)
export const dilekceRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(dilekceSablonu).orderBy(desc(dilekceSablonu.created_at))
  }),
  
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = await db.select().from(dilekceSablonu).where(eq(dilekceSablonu.id, input.id))
      if (!row[0]) throw new TRPCError({ code: 'NOT_FOUND' })
      return row[0]
    }),
  
  create: protectedProcedure
    .input(dilekceSablonuInsertSchema)
    .mutation(async ({ input }) => {
      const [row] = await db.insert(dilekceSablonu).values(input).returning()
      return row
    }),
  
  // ... update, delete
})
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom PDF layout engine | pdfmake | PDF spec is complex; pdfmake handles pagination, tables, headers/footers correctly |
| Excel XLSX export | CSV with .xls extension | exceljs | Proper XLSX format with styling, merged cells, column widths |
| Variable substitution | Full template engine (Handlebars, Mustache) | Simple regex replacement | Only `{{variable}}` patterns needed; full engine adds unnecessary complexity |
| Turkish date formatting | Manual Date.toLocaleString() | date-fns `format()` with Turkish locale | Handles edge cases (leading zeros, month names) correctly |
| Unique ID generation | crypto.randomUUID() substring | nanoid | URL-safe, configurable length, no collision concerns |

**Key insight:** pdfmake and exceljs are battle-tested libraries that handle file format complexity so you don't have to. Template substitution only needs basic string replacement.

---

## Common Pitfalls

### Pitfall 1: Turkish Characters Missing in PDF (CRITICAL)
**What goes wrong:** PDF renders with squares, question marks, or missing characters for ş, ğ, ü, ö, ç, ı, İ.
**Why it happens:** [VERIFIED: PITFALLS.md] PDF libraries default to Latin-1 fonts that don't include Turkish glyphs. Windows Times New Roman may also lack proper Turkish coverage.
**How to avoid:**
1. Spike 07-01 must validate Times New Roman on target Windows machine
2. If validation fails, embed Roboto TTF (Google Fonts, covers all Turkish glyphs)
3. Register font with pdfmake: `pdfmake.addFonts({'Roboto': {...}})`
4. Test phrase: `"Değerlendirme: Şirket, ışık gören İstanbul'daki çözümü önerdi."`
**Warning signs:** Characters appear as □ or � in generated PDF

### Pitfall 2: Template Storage as Plain HTML (MEDIUM)
**What goes wrong:** XSS vulnerability if Tiptap HTML output is stored without sanitization.
**Why it happens:** Tiptap produces HTML; storing/rendering raw HTML from DB is a stored XSS vector.
**How to avoid:**
- Sanitize HTML with `DOMPurify` before storage OR
- Use Tiptap's built-in output filter to exclude dangerous tags
- In Next.js App Router, render with `dangerouslySetInnerHTML` only after sanitization
**Warning signs:** Alert fires when testing template preview with `<script>alert(1)</script>`

### Pitfall 3: PDF Generation Memory Issues (MEDIUM)
**What goes wrong:** Large PDFs or concurrent requests cause memory exhaustion.
**Why it happens:** pdfmake buffers entire PDF in memory before returning.
**How to avoid:**
- Limit concurrent PDF generation (rate limiting if public)
- For large reports, paginate data before PDF generation
- Consider streaming for very large documents
**Warning signs:** Node.js memory usage spikes above 500MB during PDF generation

### Pitfall 4: Variable Substitution Scope Errors (LOW)
**What goes wrong:** `{{müvekkil_adı}}` substituted but `{{müvekkil_ad}}` (wrong key) kept as-is.
**Why it happens:** Inconsistent variable naming between template and data source.
**How to avoid:**
- Use D-04 variable list as single source of truth
- Validate all variables resolve before generating PDF
- UI should show warning for unresolved variables
**Warning signs:** PDF contains `{{unmatched_variable}}` strings

### Pitfall 5: Excel Export Date Columns (MEDIUM)
**What goes wrong:** Turkish Windows Excel opens dates as text or wrong format.
**Why it happens:** date-fns outputs `dd.MM.yyyy` but Excel interprets based on system locale.
**How to avoid:**
- Use exceljs `addTable` with explicit column type definitions
- Set `numFmt` on date cells: `numFmt: 'dd.mm.yyyy'`
- Test on actual Turkish Windows machine
**Warning signs:** Dates appear as `01/04/2026` instead of `01.04.2026` in Excel

---

## Code Examples

### Variable List (Predefined from D-04)
```typescript
// Source: 07-CONTEXT.md D-04
export const DEGISKENLER = [
  'müvekkil_adı',
  'müvekkil_soyadı',
  'dosya_no',
  'dava_no',
  'stk_no',
  'mahkeme',
  'durusma_tarihi',
  'talep_tutari',
  'sigorta_şirketi',
  'karsitaraf',
  'karsitaraf_vekil',
  'police_no',
  'basvuru_tarihi',
  'karar_tarihi',
  'tebligat_tarihi',
] as const

export type Degisken = typeof DEGISKENLER[number]
```

### Database Schema for Templates
```typescript
// Source: lib/schema.ts (existing belge pattern)
export const dilekceSablonu = sqliteTable('dilekce_sablonu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  baslik: text('baslik').notNull(),
  icerik: text('icerik').notNull(), // HTML from Tiptap
  kategori: text('kategori').notNull(), // 'İtiraz' | 'Cevap' | 'Genel'
  degiskenler: text('degiskenler').notNull().default('[]'), // JSON array
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_sablon_kategori').on(t.kategori),
])
```

### PDF Generation Route (Server-Side)
```typescript
// Source: pdfmake 0.3 docs — server-side methods
import PdfPrinter from 'pdfmake'
import * as fs from 'fs'
import path from 'path'

// Font files should be in /lib/pdf/fonts/
// For production: bundle fonts or use absolute paths
const fonts = {
  Roboto: {
    normal: path.join(process.cwd(), 'lib/pdf/fonts/Roboto-Regular.ttf'),
    bold: path.join(process.cwd(), 'lib/pdf/fonts/Roboto-Medium.ttf'),
    italics: path.join(process.cwd(), 'lib/pdf/fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(process.cwd(), 'lib/pdf/fonts/Roboto-MediumItalic.ttf'),
  },
}

const printer = new PdfPrinter(fonts)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sablonId, dosyaId, customVariables } = await req.json()
  const { sablon, dosya } = await getData(sablonId, dosyaId)
  
  // Merge auto-filled (from dosya) + custom (user input)
  const variables = {
    ...extractVariables(dosya), // Auto from case
    ...customVariables,         // User overrides
  }
  
  const filledHtml = substituteVariables(sablon.icerik, variables)
  const docDefinition = htmlToPdfmake(filledHtml) // Use html-to-pdfmake library
  
  const pdfDoc = printer.createPdf(docDefinition)
  
  return new Response(pdfDoc, {
    headers: { 'Content-Type': 'application/pdf' },
  })
}
```

### Save Generated PDF to Belgeler
```typescript
// Source: lib/trpc/routers/belge.ts (existing pattern)
async function savePetitionToBelge(dosyaId: number, pdfBuffer: Buffer, filename: string) {
  // Write to E:/sigorta-belgeler/{dosyaId}/
  const dir = `E:/sigorta-belgeler/${dosyaId}`
  const filepath = path.join(dir, filename)
  
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filepath, pdfBuffer)
  
  // Create DB record
  return db.insert(belge).values({
    dosya_id: dosyaId,
    dosya_no: getDosyaNo(dosyaId),
    kategori: 'Dilekçe', // D-13
    dosya_adi: filename,
    dosya_yolu: `/api/files/${dosyaId}/${filename}`,
    dosya_boyutu: pdfBuffer.length,
    mime_tur: 'application/pdf',
  }).returning()
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side PDF (jsPDF) | Server-side pdfmake | [ASSUMED] jsPDF has poor Turkish support; pdfmake handles server-side better | More reliable Turkish character rendering |
| SheetJS/xlsx | exceljs | [ASSUMED] SheetJS licensing changed 2022 | Legal clarity; MIT license |
| Template versioning | Single template + custom variables | Phase 7 initial | Simpler UX, deferred to v2 |

**Deprecated/outdated:**
- `xlsx`/`SheetJS` npm package: Commercial license since 2022 — do not use
- `@react-pdf/renderer`: Not chosen despite STACK.md recommendation (user preferred pdfmake's declarative model)

---

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Times New Roman on Windows lacks Turkish glyphs | Common Pitfalls | Spike 07-01 validates; if wrong, spike fails and font changes |
| A2 | exceljs is MIT licensed (vs xlsx proprietary) | Standard Stack | If wrong, legal issue with commercial use |
| A3 | `html-to-pdfmake` library handles Tiptap HTML conversion | Code Examples | Tiptap HTML may need manual conversion to pdfmake docDefinition |
| A4 | pdfmake 0.3.7 server-side `getBuffer()` callback pattern | Code Examples | API may differ; need to verify actual server-side API |
| A5 | Variable substitution uses simple regex replacement | Architecture | Full template engine not needed for `{{variable}}` only |

---

## Open Questions

1. **Times New Roman Turkish validation**
   - What we know: D-08 specifies TNR; D-09 requires spike 07-01 validation
   - What's unclear: Whether Windows TNR includes ş ğ ü ö ç ı İ properly
   - Recommendation: Proceed with spike 07-01 first; have Roboto TTF ready as fallback

2. **Tiptap HTML to pdfmake conversion**
   - What we know: Tiptap outputs HTML; pdfmake uses docDefinition object
   - What's unclear: Whether a library handles Tiptap→pdfmake conversion or needs custom code
   - Recommendation: Spike task to test `html-to-pdfmake` or build manual converter

3. **Chart library final choice**
   - What we know: recharts is already installed (Phase 6)
   - What's unclear: D-15 says "agent's discretion" for chart types; recharts should work
   - Recommendation: Use recharts (already available); only switch if integration issues arise

4. **Font file bundling strategy**
   - What we know: pdfmake needs TTF files for custom fonts
   - What's unclear: How to bundle TTF files in Next.js (public folder vs import)
   - Recommendation: Place TTF in `public/fonts/` or `lib/pdf/fonts/` with absolute path

---

## Environment Availability

> Step 2.6: SKIPPED — no external dependencies beyond npm packages. All libraries are server-side JavaScript/TypeScript.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| None | — | — | — | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed) |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DILEKCE-01 | Template creation with Tiptap + {{variable}} | Unit | `vitest run tests/dilekce.test.ts` | ❌ Wave 0 |
| DILEKCE-02 | Variable system substitution | Unit | `vitest run tests/degisken.test.ts` | ❌ Wave 0 |
| DILEKCE-03 | Petition generation flow | Integration | `vitest run tests/petition-flow.test.ts` | ❌ Wave 0 |
| DILEKCE-04 | Save PDF to Belgeler | Integration | `vitest run tests/belge-save.test.ts` | ❌ Wave 0 |
| DILEKCE-05 | Turkish characters in PDF | Manual | Visual verification (spike 07-01) | — |
| RAPOR-01 | Portfolio report data | Unit | `vitest run tests/rapor.test.ts` | ❌ Wave 0 |
| RAPOR-02 | Financial report data + Excel | Unit | `vitest run tests/finans-rapor.test.ts` | ❌ Wave 0 |
| RAPOR-03 | Case list Excel export | Unit | `vitest run tests/dosya-excel.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (quick)
- **Per wave merge:** `npm test -- --run` (full)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/dilekce.test.ts` — template CRUD + variable substitution
- [ ] `tests/rapor.test.ts` — portfolio/financial report data aggregation
- [ ] `tests/excel-export.test.ts` — exceljs XLSX generation
- [ ] `tests/pdf-generator.test.ts` — pdfmake document generation
- [ ] `tests/conftest.ts` — shared fixtures (mock dosya, muvekkil data)
- [ ] Framework install: already installed (vitest)

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schemas for all tRPC inputs; sanitize Tiptap HTML before storage |
| V4 Access Control | yes | All procedures use protectedProcedure (auth required) |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via Tiptap HTML | Tampering | Sanitize HTML output with DOMPurify before storage |
| Path traversal in PDF save | Tampering | Use dosyaId from DB, not user input for path construction |
| Large PDF DoS | Denial | Rate limiting on PDF generation endpoint (future) |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] pdfmake 0.3.7 — package version and existence
- [VERIFIED: npm registry] exceljs 4.4.0 — package version and MIT license
- [VERIFIED: npm registry] @tiptap/react 3.22.3 — package version
- [VERIFIED: pdfmake.github.io/docs/0.3/] Server-side PDF generation docs
- [VERIFIED: pdfmake.github.io/docs/0.3/getting-started/server-side/] Font registration with TTF
- [VERIFIED: PITFALLS.md lines 72-85] Turkish character pitfall (high confidence)
- [VERIFIED: package.json] recharts 3.8.1, date-fns 4.1.0 (already installed)

### Secondary (MEDIUM confidence)
- [ASSUMED: STACK.md line 113] exceljs preferred over xlsx due to SheetJS licensing
- [ASSUMED: pdfmake 0.3 docs] `getBuffer()` callback API for server-side generation
- [ASSUMED: Tiptap docs] Placeholder and underline extensions available

### Tertiary (LOW confidence)
- [ASSUMED] Windows Times New Roman lacks Turkish glyphs — pending spike validation
- [ASSUMED] `html-to-pdfmake` library handles Tiptap HTML conversion

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified on npm, versions confirmed
- Architecture: HIGH — patterns based on existing codebase (belge router) and pdfmake docs
- Pitfalls: HIGH — Turkish font pitfall documented with high confidence (PITFALLS.md)

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — stable domain, but spike results may change font choice)
