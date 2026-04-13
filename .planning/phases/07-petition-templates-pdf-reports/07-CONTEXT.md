# Phase 7: Petition Templates + PDF + Reports - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Dilekçe şablon sistemi (oluştur/düzenle, Tiptap zengin metin editörü, {{değişken}} yer tutucuları) + PDF oluşturma (dosya verilerinden otomatik doldurma, Türkçe karakterlerle) + portföy ve finansal raporlar (PDF/Excel export) + filtrelenmiş dosya listesi Excel export.

</domain>

<decisions>
## Implementation Decisions

### Template Editor
- **D-01:** Tiptap (rich text editor) — bold, italic, underline, bullet/numbered lists, headings, horizontal rule
- **D-02:** Template create/edit page: title input, Tiptap body editor, category dropdown, variable insertion via dropdown menu
- **D-03:** Template metadata: title, body (rich text HTML), category (named category from D-07), variables JSON (predefined + custom)

### Variable System
- **D-04:** Full DILEKCE-02 variable set: `{{müvekkil_adı}}`, `{{müvekkil_soyadı}}`, `{{dosya_no}}`, `{{dava_no}}`, `{{stk_no}}`, `{{mahkeme}}`, `{{durusma_tarihi}}`, `{{talep_tutari}}`, `{{sigorta_şirketi}}`, `{{karsitaraf}}`, `{{karsitaraf_vekil}}`, `{{police_no}}`, `{{basvuru_tarihi}}`, `{{karar_tarihi}}`, `{{tebligat_tarihi}}`
- **D-05:** Custom variables: users can define additional `{{custom_variable}}` per template — stored in variables JSON
- **D-06:** Variable insertion: dropdown menu in Tiptap toolbar lists all variables — click inserts at cursor position

### PDF Generation
- **D-07:** Library: **pdfmake** — declarative document definition, mature, good Turkish font support
- **D-08:** Font: Times New Roman — named in PDF, no embedding (relies on system installation)
- **D-09:** Turkish character validation: Plan 07-01 spike must verify ş ğ ü ö ç ı İ render correctly with Times New Roman on Windows; if issues found, switch font before planning proceeds

### Template Categories
- **D-10:** Three named categories: İtiraz Dilekçesi (objection), Cevap Dilekçesi (response), Genel (general) — category affects which variables are pre-suggested

### Petition Generation Flow
- **D-11:** Flow: Select template → preview (variables auto-filled from case data) → user can edit variable values → Generate PDF → Preview shown
- **D-12:** After preview: two options — "Kaydet" (save to case's Belgeler list) or "İndir" (download PDF)
- **D-13:** Saved PDF stored at `E:/sigorta-belgeler/{dosyaId}/` with generated filename; belge record created with kategori="Dilekçe"

### Reports — Layout
- **D-14:** Portfolio report (RAPOR-01): summary stats (total active/passive, counts by type/stage) + bar/pie charts for visual breakdown + detail tables — charts + summary stats + tables
- **D-15:** Financial report (RAPOR-02): monthly/yearly income/expense summaries + visual charts + tables — same layout pattern as portfolio report

### Reports — Export
- **D-16:** Portfolio report: PDF export only
- **D-17:** Financial report: PDF and Excel (XLSX) export
- **D-18:** Dosya listesi (filtered view): Excel (XLSX) export — RAPOR-03

### Agent's Discretion
- Exact Tiptap plugin configuration and toolbar layout
- PDF styling (margins, font sizes, header/footer)
- Chart library choice for reports (recharts or similar)
- Excel library choice (xlsx, exceljs)
- Portfolio report: exact chart types (bar/pie for stage breakdown)
- Custom variable UI in template editor (how to add/edit/delete custom variables)
- Variable substitution service exact implementation (regex replacement vs template engine)
- Save-to-belge: exact filename format for generated PDF

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 7 Requirements
- `.planning/REQUIREMENTS.md` §Dilekçe & Şablon Sistemi — DILEKCE-01 through DILEKCE-05
- `.planning/REQUIREMENTS.md` §Raporlar — RAPOR-01, RAPOR-02, RAPOR-03

### Prior Phase Decisions
- `.planning/phases/06-documents-finance/06-CONTEXT.md` §D-01 — storage at `E:/sigorta-belgeler/{dosyaId}/` (same path for generated petitions)
- `.planning/phases/06-documents-finance/06-CONTEXT.md` §D-03 — belge categories (Dilekçe is one of them, used when saving generated petition)
- `.planning/phases/05-calendar-view/05-CONTEXT.md` §D-08 — Turkish locale `dd.MM.yyyy` format (used in PDF date formatting)

### Existing Code
- `lib/schema.ts` — `dosya`, `muvekkil`, `taraf`, `durusma`, `sure` tables and relations; `belge` table already exists (for storing generated petitions)
- `lib/trpc/routers/_app.ts` — router registration pattern
- `lib/trpc/routers/belge.ts` — existing belge router (used when saving petition to Belgeler)
- `app/(dashboard)/dilekce/page.tsx` — stub page to implement as template management page
- `app/(dashboard)/raporlar/page.tsx` — stub page to implement as reports page

### Plan 07-01 (Spike)
- `.planning/phases/07-petition-templates-pdf-reports/07-01-PLAN.md` (not yet created) — spike plan for Turkish font validation

[No external specs or ADRs — requirements fully captured in decisions above]

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `lib/trpc/routers/belge.ts` — existing belge router; used when saving generated petition to case's Belgeler list
- `lib/schema.ts` — `belge` table already exists with `kategori` field ("Dilekçe" used for saved petitions)
- `components/ui/dialog.tsx` — for preview modal
- `components/ui/dropdown-menu.tsx` — for variable insertion menu in Tiptap
- `app/(dashboard)/dilekce/page.tsx` — empty stub, will become template list/create/edit page

### Established Patterns
- tRPC protectedProcedure for all data access
- Drizzle ORM with SQLite
- Storage at `E:/sigorta-belgeler/{dosyaId}/` for all case documents (Phase 6)
- PDF generation via Route Handlers (API routes)
- Navy + Turuncu color palette (Phase 8)

### Integration Points
- New `dilekceRouter` in `lib/trpc/routers/` — template CRUD + variable list + PDF generation
- New `raporRouter` in `lib/trpc/routers/` — portfolio and financial report queries
- `lib/trpc/routers/_app.ts` — register both routers
- `lib/schema.ts` — new `dilekce_sablonu` table
- `app/(dashboard)/dilekce/page.tsx` — template list + create + edit
- `app/(dashboard)/raporlar/page.tsx` — portfolio and financial report UI
- `app/api/dilekce/[id]/pdf/route.ts` — PDF generation endpoint
- Case detail page (via Belgeler tab): "Dilekçe Oluştur" button opens template selection → PDF generation flow

</codebase_context>

<specifics>
## Specific Ideas

- Times New Roman chosen for PDF generation — user prefers standard system fonts, no custom font bundling
- pdfmake preferred over @react-pdf/renderer — declarative model more suitable for legal document generation
- Three template categories: İtiraz Dilekçesi, Cevap Dilekçesi, Genel — affect which variables are pre-suggested per category
- Report layout: charts + summary stats + tables — visual overview first, detail in tables below
- Generated petition save: "Kaydet" button stores to case's Belgeler list with kategori="Dilekçe"

</specifics>

<deferred>
## Deferred Ideas

- Adli tatil automatic calculation in PDF date display — future phase
- Template versioning — user can save multiple versions of same template

---

*Phase: 07-petition-templates-pdf-reports*
*Context gathered: 2026-04-13*