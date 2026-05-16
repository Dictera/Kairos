# Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

UI that wires the PDF pipeline into the case detail view and settings. The user generates PDFs from templates within a case (Belgeler tab), views template variable catalogs, and consults a variable cheat-sheet. All backend infrastructure (pipeline, template CRUD, PDF engine, archive) is complete from Phases 15–18 — this phase is purely UI and integration.

</domain>

<decisions>
## Implementation Decisions

### Belgeler Tab "Şablondan Üret" Flow
- **D-01:** "Şablondan Üret" UI sits **above** `BelgeUpload` in the Belgeler tab. Template generation is the primary action.
- **D-02:** Generation progress shown in a **modal dialog with step indicators** (e.g., "Şablon dolduruluyor…" → "PDF oluşturuluyor…"). Blocks interaction but gives clear status; closes automatically on success.
- **D-03:** After successful generation: **toast success + manual list refresh**. No auto-scroll, no preview/download modal. The user sees the new PDF when the list next refreshes.
- **D-04:** Template selector is a **category filter + searchable dropdown** — STK / Mahkeme / Genel / Tümü filter tabs above a searchable template list. Best for 10+ templates.

### Template Variable Catalog
- **D-05:** Variable catalog accessed by **clicking a template row → modal dialog**. Familiar pattern, clean separation from the list.
- **D-06:** Catalog shows **simple flat list with known/unknown badges** — alphabetical list of all extracted variables. Each shows "✓ Bilinen" (green) or "⚠ Bilinmeyen" (amber) badge.
- **D-07:** Unknown variables show **just the badge** — no copy button, no "add to registry" action. Purely informational.

### Variable Cheat-Sheet
- **D-08:** Cheat-sheet lives **both** as a compact card on Ayarlar AND a dedicated full page. Summary card links to full page.
- **D-09:** Full cheat-sheet page uses **copy-paste friendly reference** format — monospace-friendly layout optimized for lawyers editing Word templates. Organized as a clean list showing `{{ variable }}` syntax.
- **D-10:** Compact summary card on Ayarlar shows **just a link to full page** ("Tüm değişkenleri gör" button). No inline list duplication.

### Generated PDF Appearance in BelgeList
- **D-11:** Generated PDF rows get **FileText icon + accent-colored left border** to visually distinguish from manually uploaded documents.
- **D-12:** Template name and seq number shown in row subtitle (e.g., "Şablon: İhtarname • #2").

### Jinja2 Filters Documentation
- **D-13:** Available filters (`tr_currency`, `tarih`, `upper_tr`, `lower_tr`) documented **inline with each variable** — showing which filters can be applied to which variables (e.g., "talep_tutari — `tr_currency` uygulanabilir").

### Missing-Variable Error UX
- **D-14:** Pre-check errors show **text-only guidance** — e.g., "STK esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin." No clickable tab links, no modal with tab-switch buttons. Simplest implementation.

### the agent's Discretion
- Exact modal width and padding for generation progress
- Step indicator styling (dots, progress bar, or text-only)
- Search placeholder text and empty-state message for template dropdown
- Cheat-sheet page route path (`/ayarlar/yardim` vs `/ayarlar/degiskenler`)
- Exact accent color shade for generated PDF row border
- Modal size for variable catalog
- Badge styling (outline vs solid) for known/unknown variables

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 19 Requirements
- `.planning/REQUIREMENTS.md` §BUI-01–BUI-09 — Belgeler UI ve Şablon Yönetimi Ekranı gereksinimleri
- `.planning/ROADMAP.md` §Phase 19 — Phase goal ve success criteria

### Pipeline Infrastructure (completed)
- `.planning/phases/15-pipeline-temeli/15-CONTEXT.md` — Sidecar architecture, IPC protocol, health check
- `.planning/phases/16-sablon-semasi-ve-crud/16-CONTEXT.md` — Template CRUD, `docx_sablon` table, variable extraction
- `.planning/phases/17-pdf-uretim-motoru/17-CONTEXT.md` — PDF render, Jinja2 context, missing-var pre-check
- `.planning/phases/18-arsiv-ve-belge-entegrasyonu/18-CONTEXT.md` — Archive, slug+seq filename, transactional insert

### Schema & Data
- `lib/schema.ts` — `belge`, `docx_sablon`, `BELGE_KATEGORILER`, `SABLON_KATEGORILER` tanımları
- `lib/docx/variable-registry.ts` — Variable registry (single source of truth for known variables)
- `lib/trpc/routers/pdf.ts` — `pdfRouter.generate` procedure (backend for generation)
- `lib/trpc/routers/sablon.ts` — `sablonRouter.list` procedure (backend for template list)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/belge/belge-list.tsx` — Existing document list component. Needs enhancement to show template name + seq for generated PDFs, and distinct styling (FileText icon + accent border).
- `components/belge/belge-upload.tsx` — Existing upload component. "Şablondan Üret" UI sits above this.
- `components/dosya/dosya-detail-tabs.tsx` — Tab container with Belgeler tab. New generation UI mounts inside the `belgeler` TabsContent.
- `components/ayarlar/sablon-yonetimi-section.tsx` — Existing template management in Ayarlar. Needs "Detay" click handler to open variable catalog modal.
- `components/ayarlar/ayarlar-page.tsx` — Settings page. Needs cheat-sheet summary card and link to full page.
- `lib/docx/variable-registry.ts` — `VARIABLE_REGISTRY` array and `getMissingVariables()` function. Variable catalog and cheat-sheet both consume this.

### Established Patterns
- tRPC router: `lib/trpc/routers/{feature}.ts` → `_app.ts` registration
- React Query: `useQuery` + `useMutation` with `useTRPC()` hook
- shadcn/ui: Dialog, Select, Table, Badge, Button, Skeleton, AlertDialog, Tabs
- File upload: multipart → API route → tRPC mutation pattern (BelgeUpload)
- Toast notifications: `sonner` toast for success/error
- Query invalidation: `queryClient.invalidateQueries()` after mutation

### Integration Points
- `components/dosya/dosya-detail-tabs.tsx` — Mount "Şablondan Üret" component above `<BelgeUpload>` inside the `belgeler` TabsContent
- `components/belge/belge-list.tsx` — Enhance row rendering to detect `sablon_id` and show template metadata
- `components/ayarlar/sablon-yonetimi-section.tsx` — Add row click handler → variable catalog modal
- `app/(dashboard)/ayarlar/page.tsx` — Add cheat-sheet summary card with navigation link
- New route: `app/(dashboard)/ayarlar/degiskenler/page.tsx` (or similar) for full cheat-sheet page
- `lib/trpc/routers/pdf.ts` — `pdfRouter.generate` already returns `{ success, belge }`; frontend calls this mutation
- `lib/trpc/routers/sablon.ts` — `sablonRouter.list` already returns all templates with `degiskenler` array

</code_context>

<specifics>
## Specific Ideas

- "Şablondan Üret" UI should be the primary action in the Belgeler tab — above manual upload
- Generation progress modal with step indicators (render → convert → archive) gives the user confidence during the multi-second process
- Template dropdown with category filter tabs (STK / Mahkeme / Genel / Tümü) scales well as template library grows
- Variable catalog modal: simple flat alphabetical list keeps cognitive load low
- Cheat-sheet page should feel like a reference doc — monospace, copy-friendly, not a dense table
- Generated PDFs should be visually distinct in the list so the user can spot them instantly
- Inline filter hints per variable help lawyers learn which formatting filters to use

</specifics>

<deferred>
## Deferred Ideas

- Quick action named buttons (e.g., "İhtarname Üret") — v2 (QUICK-01)
- Dry-run / preview binding — v2 (QUICK-02)
- Multi-template batch generation — v2 (QUICK-03)
- Template-to-dosya generation history view — v2 (QUICK-04)
- Fuzzy-match typo warning during template upload — v2 (QUICK-05)
- In-app template editor — Out of Scope (Word is vastly better)
- Live DOCX preview — Out of Scope (unreliable rendering)

### Reviewed Todos (not folded)
None — analysis stayed within phase scope

</deferred>

---

*Phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani*
*Context gathered: 2026-04-22*
