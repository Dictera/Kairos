# Phase 6: Documents + Finance - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Document upload/management (PDF, DOC, DOCX, JPG, PNG up to 20MB per case) + Finance entries per case (Gelen/Giden/Masraf) + Per-case financial summary + Global finance dashboard with monthly/yearly summaries.

</domain>

<decisions>
## Implementation Decisions

### Storage Access
- **D-01:** Belgeler E: sürücüsünde ayrı bir klasörde saklanacak (`E:/sigorta-belgeler/{dosyaId}/`). Proje içinde değil. Statik URL erişimi — localhost için auth gerekmiyor.

### Upload UX
- **D-02:** Both drag-and-drop zone AND file picker button — maximum flexibility. User can drag files onto the drop zone or click the button to browse.

### Document Categories
- **D-03:** Seven categories: Dilekçe (Petition), Karar (Ruling), Poliçe (Policy), Sigorta poliçesi (Insurance Policy), Hasar dosyası (Claim File), Vekaletname (Power of Attorney), Diğer (Other)

### Finance Entry Fields
- **D-04:** Minimal fields: type (Gelen/Giden/Masraf), amount, date, description only. No receipt number, no payment method — keeps the UI simple.

### Per-Case Finance Summary
- **D-05:** Breakdown by type — show subtotals for each: Gelen (total incoming), Giden (total outgoing), Masraf (total expenses) + overall net balance.

### Finance Dashboard Views
- **D-06:** Both tables AND visual charts using recharts library — monthly/yearly income/expense summaries with charts for visual overview and tables for detailed numbers.

### Agent's Discretion
- File naming convention on disk (original name preserved vs UUID-based)
- Exact table column layout for finance dashboard
- Chart types (bar, line, pie) — any recharts type that fits the data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Belge Yönetimi — BELGE-01 through BELGE-04
- `.planning/REQUIREMENTS.md` §Finans Takibi — FINANS-01 through FINANS-06

### Phase 2 Schema (foundation for new tables)
- `lib/schema.ts` — existing Drizzle schema patterns, dosya table structure for FK relationships

### Existing UI Patterns
- `components/dosya/dosya-detail-tabs.tsx` — tabs structure showing where Belgeler and Dosya Finansı tabs appear
- `app/(dashboard)/belgeler/page.tsx` — stub page that needs implementation
- `app/(dashboard)/finans/page.tsx` — stub page that needs implementation

### tRPC Patterns
- `lib/trpc/routers/_app.ts` — router registration pattern
- `lib/trpc/init.ts` — protectedProcedure pattern

### Upload Storage
- `public/uploads/` — directory where files will be stored (needs to be created)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/tabs.tsx` — Tabs component for dosya detail tabs
- `components/ui/dropdown-menu.tsx` — existing UI components
- Existing stub pages: `belgeler/page.tsx` and `finans/page.tsx` ready for implementation

### Established Patterns
- tRPC protectedProcedure for all data access
- Drizzle ORM with SQLite, dates as YYYY-MM-DD text
- React Query (Tanstack Query) for client-side data fetching
- shadcn/ui components for all UI elements

### Integration Points
- New `belge` and `finans_kalemi` tables in `lib/schema.ts`
- New `belgeRouter` and `finansRouter` in `lib/trpc/routers/`
- Register routers in `lib/trpc/routers/_app.ts`
- Belgeler tab: `components/dosya/dosya-detail-tabs.tsx` TabsContent for "belgeler"
- Dosya Finansı tab: same file TabsContent for "dosya-finansi"
- New pages: `app/(dashboard)/belgeler/page.tsx` and `app/(dashboard)/finans/page.tsx`

</code_context>

<specifics>
## Specific Ideas

- Finance dashboard charts using recharts library (https://recharts.github.io/en-US/)
- Document categories: Dilekçe, Karar, Poliçe, Sigorta poliçesi, Hasar dosyası, Vekaletname, Diğer

</specifics>

<deferred>
## Deferred Ideas

- Receipt/invoice document linking — future phase (finance entries can reference uploaded documents as receipts)
- Multi-currency support — TL only for v1

</deferred>

---

*Phase: 06-documents-finance*
*Context gathered: 2026-04-13*
