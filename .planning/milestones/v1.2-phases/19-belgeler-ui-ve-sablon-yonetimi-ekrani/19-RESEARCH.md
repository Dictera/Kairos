# Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı - Research

**Researched:** 2026-04-22
**Domain:** React UI integration (Next.js 14 App Router, tRPC, React Query, shadcn/ui)
**Confidence:** HIGH

## Summary

Phase 19 is a pure UI/integration phase that wires the completed PDF pipeline (Phases 15–18) into the case detail view and settings. All backend infrastructure — Python sidecar IPC, template CRUD (`sablonRouter`), PDF generation (`pdfRouter.generate`), archive with transactional `belge` insert, and variable registry — is already implemented and tested. The remaining work consists of:

1. **Belgeler tab "Şablondan Üret" flow**: A category-filtered template selector + generation button mounted above `BelgeUpload` inside `DosyaDetailTabs`, with a progress modal showing pipeline steps.
2. **Enhanced `BelgeList`**: Visually distinguish generated PDF rows (from `sablon_id`) with `FileText` icon, accent border, and template name + seq subtitle.
3. **Template variable catalog**: Modal triggered from `SablonYonetimiSection` row clicks, showing extracted variables with known/unknown badges.
4. **Variable cheat-sheet**: Full reference page (`/ayarlar/degiskenler`) auto-generated from `VARIABLE_REGISTRY`, plus a compact summary card on the Ayarlar page.
5. **Missing-variable pre-check UX**: Display text-only guidance when `pdfRouter.generate` throws `BAD_REQUEST` for missing variables.

**Primary recommendation:** Build 5 new UI components, enhance 2 existing ones, add 1 new route, and wire mutations with standard React Query invalidation. No new npm packages are required; all UI primitives (Dialog, Badge, Command, Tabs, Button, Skeleton, Select) are already installed via shadcn/ui.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template selection & generation trigger | Browser / Client | — | Pure UI state + tRPC mutation call |
| Generation progress display | Browser / Client | — | Local React state tracking `isPending` + step labels |
| Generated PDF visual distinction | Browser / Client | — | Conditional rendering based on `sablon_id` |
| Variable catalog display | Browser / Client | — | Reads `degiskenler` from `sablon.list` query, matches against `VARIABLE_REGISTRY` |
| Cheat-sheet generation | Browser / Client | — | Static rendering of `VARIABLE_REGISTRY` const |
| Missing-variable error UX | Browser / Client | API / Backend | Backend throws `TRPCError(BAD_REQUEST)`; client surfaces Turkish tab label |
| Belge list refresh after generation | Browser / Client | API / Backend | `queryClient.invalidateQueries(trpc.belge.list.queryKey(...))` |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** "Şablondan Üret" UI sits **above** `BelgeUpload` in the Belgeler tab.
- **D-02:** Generation progress shown in a **modal dialog with step indicators**; blocks interaction, closes automatically on success.
- **D-03:** After successful generation: **toast success + manual list refresh**; no auto-scroll, no preview/download modal.
- **D-04:** Template selector is a **category filter + searchable dropdown** — STK / Mahkeme / Genel / Tümü filter tabs above a searchable template list.
- **D-05:** Variable catalog accessed by **clicking a template row → modal dialog**.
- **D-06:** Catalog shows **simple flat list with known/unknown badges** — alphabetical list, "✓ Bilinen" (green) or "⚠ Bilinmeyen" (amber).
- **D-07:** Unknown variables show **just the badge** — no copy button, no "add to registry" action.
- **D-08:** Cheat-sheet lives **both** as a compact card on Ayarlar AND a dedicated full page.
- **D-09:** Full cheat-sheet page uses **copy-paste friendly reference** format — monospace-friendly, `{{ variable }}` syntax.
- **D-10:** Compact summary card on Ayarlar shows **just a link to full page** ("Tüm değişkenleri gör" button).
- **D-11:** Generated PDF rows get **FileText icon + accent-colored left border**.
- **D-12:** Template name and seq number shown in row subtitle (e.g., "Şablon: İhtarname • #2").
- **D-13:** Available filters (`tr_currency`, `tarih`, `upper_tr`, `lower_tr`) documented **inline with each variable**.
- **D-14:** Pre-check errors show **text-only guidance** — no clickable tab links, no modal with tab-switch buttons.

### the agent's Discretion
- Exact modal width and padding for generation progress
- Step indicator styling (dots, progress bar, or text-only)
- Search placeholder text and empty-state message for template dropdown
- Cheat-sheet page route path (`/ayarlar/yardim` vs `/ayarlar/degiskenler`)
- Exact accent color shade for generated PDF row border
- Modal size for variable catalog
- Badge styling (outline vs solid) for known/unknown variables

### Deferred Ideas (OUT OF SCOPE)
- Quick action named buttons (e.g., "İhtarname Üret") — v2 (QUICK-01)
- Dry-run / preview binding — v2 (QUICK-02)
- Multi-template batch generation — v2 (QUICK-03)
- Template-to-dosya generation history view — v2 (QUICK-04)
- Fuzzy-match typo warning during template upload — v2 (QUICK-05)
- In-app template editor — Out of Scope
- Live DOCX preview — Out of Scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUI-01 | Dosya detayı Belgeler sekmesinde "Şablondan Üret" butonu + şablon seçici dropdown | New `SablondanUret` component; `Command` for searchable dropdown; `Tabs` for category filter |
| BUI-02 | Dropdown şablonları kategoriye göre gruplar (STK / Mahkeme / Genel) | Filter `sablon.list` data client-side by `kategori`; render grouped `CommandItem`s or filtered list |
| BUI-03 | Üretim sırasında spinner + Türkçe durum mesajı gösterilir | `Dialog` + `Skeleton` or custom step UI; `mutation.isPending` drives step labels |
| BUI-04 | Üretim başarılı olunca Belgeler listesi yenilenir | `queryClient.invalidateQueries(trpc.belge.list.queryKey({ dosya_id }))` + `toast.success` |
| BUI-05 | Belgeler listesinde üretilmiş PDF satırları şablon adını ve seq numarasını gösterir | Enhance `BelgeList` to read `sablon_id`; conditionally render subtitle with template name + seq |
| BUI-06 | Ayarlar altında "Şablon Yönetimi" ekranı: şablon listesi, yükleme formu, sil/değiştir aksiyonları | Already exists in `sablon-yonetimi-section.tsx`; add row-click → catalog modal |
| BUI-07 | Şablon detayında değişken katalog görünümü: çıkarılan değişkenler + bilinen/bilinmeyen badge | New `VariableCatalogModal` component; compare `degiskenler` against `VARIABLE_REGISTRY` |
| BUI-08 | Ayarlar > Yardım altında "Değişken Listesi" cheat-sheet sayfası | New route `/ayarlar/degiskenler`; render `VARIABLE_REGISTRY` grouped by `tab` |
| BUI-09 | Variable registry tüm desteklenen değişkenleri TypeScript const olarak tanımlar | Already exists in `lib/docx/variable-registry.ts`; consume for catalog + cheat-sheet |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.1.0 | UI framework | Project standard |
| Next.js | ^16.2.3 | App Router, SSR | Project standard |
| TypeScript | ^5.9.3 | Type safety | Project standard |
| tRPC | ^11.16.0 | Type-safe API | Project standard |
| @tanstack/react-query | ^5.97.0 | Server state management | Project standard |
| shadcn/ui | ^4.2.0 | UI primitives | Project standard |
| sonner | ^2.0.7 | Toast notifications | Project standard |
| lucide-react | ^1.8.0 | Icons | Project standard |
| Zod | ^3.24.0 | Schema validation | Project standard |
| Tailwind CSS | ^4.2.2 | Styling | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cmdk | ^1.1.1 | Command palette / combobox | Template searchable dropdown (shadcn Command depends on this) |
| date-fns | ^4.1.0 | Date formatting | Belge list dates (already used) |
| react-hook-form | ^7.72.1 | Form state | Not needed for this phase (no new forms) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Command | Custom filtered Select | Command provides search + keyboard nav; already installed |
| shadcn Dialog | Custom modal | Dialog is battle-tested, accessible, already installed |

**Installation:** None required — all packages already in `package.json`.

**Version verification:**
- `lucide-react`: 1.8.0 (matches package.json) [VERIFIED: npm registry]
- `@tanstack/react-query`: 5.99.2 installed vs 5.97.0 in package.json (patch update, compatible) [VERIFIED: npm registry]
- `sonner`: 2.0.7 (matches package.json) [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────────────┐   │
│  │  DosyaDetailTabs    │     │     AyarlarPage             │   │
│  │  (belgeler tab)     │     │                             │   │
│  │                     │     │  ┌───────────────────────┐  │   │
│  │  ┌───────────────┐  │     │  │ SablonYonetimiSection │  │   │
│  │  │SablondanUret  │  │     │  │  + row click handler  │  │   │
│  │  │ - CategoryTabs│  │     │  └──────────┬────────────┘  │   │
│  │  │ - Command     │  │     │             │               │   │
│  │  │ - Generate btn│  │     │             ▼               │   │
│  │  └───────┬───────┘  │     │  ┌───────────────────────┐  │   │
│  │          │ mutate   │     │  │ VariableCatalogModal  │  │   │
│  │          ▼          │     │  └───────────────────────┘  │   │
│  │  ┌───────────────┐  │     │                             │   │
│  │  │ProgressModal  │  │     │  ┌───────────────────────┐  │   │
│  │  │ (step labels) │  │     │  │ CheatSheetSummaryCard │  │   │
│  │  └───────────────┘  │     │  │  → /ayarlar/degiskenler│  │   │
│  │          │          │     │  └───────────────────────┘  │   │
│  │          ▼          │     └─────────────────────────────┘   │
│  │  ┌───────────────┐  │                                       │
│  │  │  BelgeList    │  │         ┌───────────────────────┐     │
│  │  │  (enhanced)   │  │         │ /ayarlar/degiskenler  │     │
│  │  │  sablon_id?   │  │         │   CheatSheetPage      │     │
│  │  └───────────────┘  │         └───────────────────────┘     │
│  └─────────────────────┘                                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ tRPC over HTTP
┌────────────────────────────▼─────────────────────────────────────┐
│                         API / Backend                            │
│                                                                  │
│  pdfRouter.generate ──► sidecar render ──► convert ──► archive  │
│         │                                                        │
│         └── TRPCError(BAD_REQUEST) for missing variables         │
│                                                                  │
│  sablonRouter.list ──► db.select(docxSablon)                     │
│                                                                  │
│  belgeRouter.list ──► db.select(belge)                           │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
components/
├── belge/
│   ├── belge-list.tsx              # ENHANCE: add sablon_id styling + subtitle
│   ├── belge-upload.tsx            # EXISTING (no change)
│   └── sablondan-uret.tsx          # NEW: category filter + selector + generate button
├── dosya/
│   └── dosya-detail-tabs.tsx       # ENHANCE: mount SablondanUret above BelgeUpload
├── ayarlar/
│   ├── sablon-yonetimi-section.tsx # ENHANCE: add row click → VariableCatalogModal
│   ├── ayarlar-page.tsx            # ENHANCE: add CheatSheetSummaryCard
│   └── variable-catalog-modal.tsx  # NEW: template variable list with badges
├── degiskenler/
│   └── cheat-sheet-page.tsx        # NEW: full variable reference page
└── ui/                             # shadcn components (existing)

app/(dashboard)/
├── dosyalar/[id]/
│   └── page.tsx                    # EXISTING (no change)
└── ayarlar/
    ├── page.tsx                    # EXISTING (no change)
    └── degiskenler/
        └── page.tsx                # NEW: mounts CheatSheetPage
```

### Pattern 1: tRPC Mutation with React Query Invalidation
**What:** Standard pattern for triggering backend operations and refreshing UI state.
**When to use:** PDF generation, any mutation that affects displayed lists.
**Example:**
```typescript
// Source: established codebase pattern (components/belge/belge-upload.tsx, etc.)
const trpc = useTRPC()
const queryClient = useQueryClient()

const generateMutation = useMutation(
  trpc.pdf.generate.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId })
      })
      toast.success('PDF üretildi.')
      setProgressOpen(false)
    },
    onError: (err) => {
      toast.error(err.message)
      setProgressOpen(false)
    }
  })
)
```

### Pattern 2: Conditional Row Rendering Based on Foreign Key
**What:** Distinguish generated PDFs from uploaded documents by checking `sablon_id`.
**When to use:** Any list where rows have different origins/types.
**Example:**
```typescript
// Source: established codebase pattern (belge-list.tsx enhancement)
const isGenerated = belge.sablon_id != null
const Icon = isGenerated ? FileText : (kategoriIcons[belge.kategori] || FileIcon)

return (
  <div className={cn(
    "flex items-center justify-between p-3 border rounded-lg",
    isGenerated && "border-l-4 border-l-[var(--accent)]"
  )}>
    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
    {/* ... */}
    {isGenerated && (
      <p className="text-xs text-muted-foreground">
        Şablon: {belge.sablon_adi} • #{belge.seq}
      </p>
    )}
  </div>
)
```

### Pattern 3: Command Component for Searchable Dropdown
**What:** shadcn/ui Command provides a filterable list with keyboard navigation.
**When to use:** Template selector with 10+ items and category filtering.
**Example:**
```typescript
// Source: shadcn/ui Command primitive (components/ui/command.tsx)
<Command>
  <CommandInput placeholder="Şablon ara..." />
  <CommandEmpty>Şablon bulunamadı.</CommandEmpty>
  <CommandGroup heading="STK">
    {stkSablonlari.map(s => (
      <CommandItem key={s.id} onSelect={() => setSelected(s)}>
        {s.ad}
      </CommandItem>
    ))}
  </CommandGroup>
</Command>
```

### Pattern 4: Missing Variable Error Handling
**What:** Catch `TRPCError` with `BAD_REQUEST` code from `pdfRouter.generate` and display Turkish guidance.
**When to use:** Pre-check failures before PDF generation.
**Example:**
```typescript
// Source: pdf.ts router lines 71-76
onError: (err) => {
  if (err.data?.code === 'BAD_REQUEST') {
    // Message already in Turkish from backend: "STK esas numarası henüz girilmemiş — Süreç sekmesinden ekleyin."
    toast.error(err.message)
  } else {
    toast.error('PDF üretilemedi: ' + err.message)
  }
}
```

### Anti-Patterns to Avoid
- **Custom modal instead of Dialog:** Don't build a custom modal — shadcn Dialog is accessible, traps focus, and handles Escape/click-outside.
- **Manual query cache updates after generation:** Don't use `setQueryData` to prepend the new belge; `invalidateQueries` is simpler and the list is small.
- **Client-side seq calculation:** Don't compute sequence numbers in the browser; the backend (`archivePdfAndCreateBelge`) handles this transactionally.
- **Deep-link tab switching on error:** Per D-14, errors are text-only. Don't implement `router.push('#surec')` or similar — it adds complexity without clear UX benefit.
- **Duplicating variable registry data:** Don't create a second source of truth for variable metadata; import `VARIABLE_REGISTRY` from `lib/docx/variable-registry.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdown | Custom `<input>` + filtered `<ul>` | shadcn `Command` (built on `cmdk`) | Keyboard nav, fuzzy search, accessibility already handled |
| Modal/dialog | Custom overlay + portal | shadcn `Dialog` (Radix Dialog) | Focus trap, scroll lock, a11y, Escape handling |
| Step/progress indicator | Custom SVG/progress bar | `Skeleton` + text labels, or shadcn `Progress` | Simpler, consistent with design system |
| Toast notifications | Custom toast stack | `sonner` | Already installed, used throughout app |
| Copy-to-clipboard | Custom execCommand fallback | `navigator.clipboard.writeText()` | Modern API, works in all supported browsers |
| Variable matching | Regex or string splitting | `VARIABLE_REGISTRY.find(v => v.path === varPath)` | Single source of truth, type-safe |

**Key insight:** This phase is 100% integration of existing primitives. The risk is not in missing libraries but in inconsistent application of established patterns (query invalidation, toast handling, modal state cleanup).

## Common Pitfalls

### Pitfall 1: Query Key Mismatch After Generation
**What goes wrong:** Belge list doesn't refresh after PDF generation because `queryKey` doesn't match.
**Why it happens:** `trpc.belge.list.queryKey({ dosya_id: dosyaId })` must match exactly what `BelgeList` uses. Extra/missing properties break invalidation.
**How to avoid:** Use the exact same input shape: `{ dosya_id: dosyaId }`. Reference `trpc.belge.list.queryKey({ dosya_id: dosyaId })` directly.
**Warning signs:** Toast says success but new PDF doesn't appear until page reload.

### Pitfall 2: Modal State Not Reset on Close
**What goes wrong:** Opening the generation modal again shows the previous step/stuck state.
**Why it happens:** Step index and selected template aren't reset when modal closes.
**How to avoid:** Use `useEffect` on `open` change or reset in `onOpenChange` / `onSuccess` / `onError` handlers. Keep modal state co-located with the mutation.
**Warning signs:** Second generation starts at "PDF oluşturuluyor…" instead of "Şablon dolduruluyor…".

### Pitfall 3: Missing `use client` Directive
**What goes wrong:** Component fails to render with "useState is not defined" or similar.
**Why it happens:** Any component using hooks (`useState`, `useMutation`, etc.) must be a Client Component in App Router.
**How to avoid:** All new components in `components/` that use hooks need `'use client'` at the top.
**Warning signs:** Build-time or runtime error mentioning hooks in Server Component.

### Pitfall 4: `sablon_id` Not Included in Belge List Query
**What goes wrong:** Can't distinguish generated PDFs because `sablon_id` is missing from query results.
**Why it happens:** `belgeRouter.list` currently selects all columns from `belge` table, which includes `sablon_id`. But if frontend types don't include it, TS complains.
**How to avoid:** Verify `sablon_id` is in the Drizzle schema (it is, line 304) and ensure inferred tRPC types propagate.
**Warning signs:** TypeScript error: `Property 'sablon_id' does not exist on type...`

### Pitfall 5: Command Dropdown Closes on Category Filter Change
**What goes wrong:** User clicks a category tab and the template dropdown/command closes.
**Why it happens:** Tabs and Command/Popover both manage their own open state; focus loss can trigger close.
**How to avoid:** Keep category filter tabs **outside** the Command component, as sibling controls. Filter the `templates` array before passing to Command, don't use Command's internal grouping for categories.
**Warning signs:** Category tab click causes dropdown to disappear.

### Pitfall 6: Template Name + Seq Subtitle Requires Join
**What goes wrong:** `BelgeList` can't show template name because `belge.list` returns raw `belge` rows without joining `docx_sablon`.
**Why it happens:** `belgeRouter.list` does `db.select().from(belge)` without `.with()` or join.
**How to avoid:** Two options: (a) Enhance `belgeRouter.list` to join `docx_sablon` and return `sablon_ad`, or (b) fetch `sablon.list` separately and do a client-side lookup by `sablon_id`. Option (b) is simpler for this phase; option (a) is cleaner long-term. Given existing patterns, option (b) with a `Map<sablon_id, sablon_ad>` is lower risk.
**Warning signs:** Template name shows as empty or "undefined" in subtitle.

## Code Examples

### Verified patterns from official sources:

### Example 1: Category-Filtered Command Dropdown
```typescript
// Source: shadcn/ui Command docs + established project patterns
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

function TemplateSelector({ templates, onSelect }: { templates: Sablon[], onSelect: (s: Sablon) => void }) {
  const [filter, setFilter] = useState<string>('all')
  const filtered = templates.filter(t => filter === 'all' || t.kategori === filter)

  return (
    <div className="space-y-2">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="STK">STK</TabsTrigger>
          <TabsTrigger value="Mahkeme">Mahkeme</TabsTrigger>
          <TabsTrigger value="Genel">Genel</TabsTrigger>
        </TabsList>
      </Tabs>
      <Command className="border rounded-md">
        <CommandInput placeholder="Şablon ara..." />
        <CommandList>
          <CommandEmpty>Şablon bulunamadı.</CommandEmpty>
          {filtered.map(t => (
            <CommandItem key={t.id} onSelect={() => onSelect(t)}>
              {t.ad}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </div>
  )
}
```

### Example 2: Generation Progress Modal
```typescript
// Source: established Dialog + mutation patterns
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

function GenerationProgressModal({ open, step }: { open: boolean; step: 'render' | 'convert' | 'archive' | 'idle' }) {
  const steps = [
    { key: 'render', label: 'Şablon dolduruluyor…' },
    { key: 'convert', label: 'PDF oluşturuluyor…' },
    { key: 'archive', label: 'Arşivleniyor…' },
  ]
  const activeIndex = steps.findIndex(s => s.key === step)

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>PDF Üretiliyor</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <div className="space-y-2 text-center">
            {steps.map((s, i) => (
              <p key={s.key} className={cn(
                'text-sm',
                i === activeIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
                {i + 1}. {s.label}
              </p>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Example 3: Variable Catalog with Known/Unknown Badges
```typescript
// Source: variable-registry.ts + shadcn Badge patterns
import { VARIABLE_REGISTRY } from '@/lib/docx/variable-registry'
import { Badge } from '@/components/ui/badge'

function VariableCatalog({ variables }: { variables: string[] }) {
  const sorted = [...variables].sort((a, b) => a.localeCompare(b, 'tr'))

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {sorted.map(v => {
        const known = VARIABLE_REGISTRY.find(r => r.path === v)
        return (
          <div key={v} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
            <code className="text-sm font-mono">{'{{ '}{v}{' }}'}</code>
            {known ? (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">✓ Bilinen</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-600">⚠ Bilinmeyen</Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom `useFetch` hook | tRPC + React Query | v1.0 Phase 1 | Type-safe, caching, devtools |
| Manual form state | react-hook-form + Zod | v1.0 Phase 2 | Validation co-location |
| Raw `<button>` + CSS | shadcn/ui primitives | v1.0 Phase 1 | Consistent design system |
| `react-hot-toast` | `sonner` | v1.1 Phase 10 | Simpler API, better styling |

**Deprecated/outdated:**
- `dilekceRouter` and `dilekceOdtRouter`: Being retired in Phase 20; do NOT add new dependencies on them.
- `@tiptap/*` packages: Will be removed in Phase 20; do NOT use for any new UI.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `belge.list` returns `sablon_id` field (Drizzle schema has it, router selects all columns) | Common Pitfalls | If `sablon_id` is omitted, generated PDF distinction fails |
| A2 | `sablon.list` returns `degiskenler` as `string[]` (Drizzle JSON mode) | Pattern 3 | If type is wrong, variable catalog breaks |
| A3 | `pdfRouter.generate` throws `TRPCError` with `code: 'BAD_REQUEST'` for missing variables | Pattern 4 | If code differs, error handling won't match |
| A4 | No new shadcn components need installation — `Dialog`, `Command`, `Tabs`, `Badge`, `Skeleton`, `Progress` all exist | Standard Stack | If a component is missing, plan needs `npx shadcn add` step |
| A5 | Seq number is not directly available on `belge` row; it must be parsed from `dosya_adi` (e.g., `{slug}-{seq}.pdf`) | Pattern 2 | If seq is stored separately, parsing logic changes |

## Open Questions (RESOLVED)

1. **Should `belgeRouter.list` join `docx_sablon` to return `sablon_ad`?**
   - What we know: Currently returns raw `belge` rows. Template name is needed for BUI-05 subtitle.
   - What's unclear: Whether to modify the router (backend change) or do client-side lookup.
   - **RESOLVED:** Client-side lookup via `sablon.list` query is lower risk and stays within Phase 19 scope. If performance becomes an issue with 100+ templates, enhance the router later.

2. **Should the cheat-sheet page be a static route or a client component?**
   - What we know: `VARIABLE_REGISTRY` is a static const; no server data needed.
   - What's unclear: Whether to use Server Component for faster initial load.
   - **RESOLVED:** Server Component (no `'use client'`) since it only renders static data. The Ayarlas summary card links to it via `<Link>`.

3. **How should seq number be displayed in `BelgeList`?**
   - What we know: Filename format is `{muvekkil-slug}-{plaka-slug}-{seq}.pdf` (or without plaka).
   - What's unclear: Whether seq is embedded in filename or available as a separate column.
   - **RESOLVED:** Parse seq from `dosya_adi` using regex `/-(\d+)\.pdf$/` or similar. Document the parsing assumption.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | 20+ | — |
| Next.js dev server | UI development | ✓ | 16.2.3 | — |
| Python sidecar | PDF generation (integration test) | ✓ | venv in `./scripts/docx-pipeline/` | Skip e2e verification |
| LibreOffice | PDF conversion (integration test) | ✓ | System default or `.env` path | Skip e2e verification |
| SQLite | Data layer | ✓ | better-sqlite3 ^12.8.0 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUI-01 | "Şablondan Üret" component mounts above BelgeUpload | structure (file read) | `vitest run tests/19-belgeler-ui.test.ts` | ❌ Wave 0 |
| BUI-02 | Category filter tabs exist (STK/Mahkeme/Genel/Tümü) | structure | same | ❌ Wave 0 |
| BUI-03 | Progress modal contains Turkish step labels | copy + structure | same | ❌ Wave 0 |
| BUI-04 | Mutation invalidates belge.list queryKey | structure | same | ❌ Wave 0 |
| BUI-05 | BelgeList renders sablon_id conditional styling | structure | same | ❌ Wave 0 |
| BUI-06 | SablonYonetimiSection has row click → catalog modal | structure | same | ❌ Wave 0 |
| BUI-07 | Variable catalog shows known/unknown badges | structure | same | ❌ Wave 0 |
| BUI-08 | Cheat-sheet page exists at `/ayarlar/degiskenler` | structure | same | ❌ Wave 0 |
| BUI-09 | Variable registry consumed in catalog and cheat-sheet | structure | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- tests/19-belgeler-ui.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/19-belgeler-ui.test.ts` — covers BUI-01 through BUI-09
- [ ] `tests/19-variable-catalog.test.ts` — optional: deeper catalog logic tests
- [ ] No framework install needed (vitest already configured)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not in scope for this UI phase |
| V3 Session Management | No | Not in scope |
| V4 Access Control | No | tRPC `protectedProcedure` already enforces auth |
| V5 Input Validation | Yes | Zod schemas on tRPC inputs (`pdfGenerateSchema`); no user-generated HTML rendered |
| V6 Cryptography | No | No crypto in this phase |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in file URLs | Tampering | `belge.dosya_yolu` is server-controlled; no user input reaches fs path |
| XSS via template variable names | Tampering | Variable names rendered in `<code>` tags, not as HTML; React escapes by default |
| Open redirect via `href={fileUrl}` | Spoofing | `fileUrl` is server-generated `/api/files/...` path |

## Sources

### Primary (HIGH confidence)
- Codebase files (`components/belge/belge-list.tsx`, `components/belge/belge-upload.tsx`, `components/dosya/dosya-detail-tabs.tsx`, `components/ayarlar/sablon-yonetimi-section.tsx`, `components/ayarlar/ayarlar-page.tsx`, `lib/trpc/routers/pdf.ts`, `lib/trpc/routers/sablon.ts`, `lib/trpc/routers/belge.ts`, `lib/docx/variable-registry.ts`, `lib/docx/archive.ts`, `lib/schema.ts`) — verified by direct read
- `package.json` — dependency versions verified
- `vitest.config.ts` — test configuration verified

### Secondary (MEDIUM confidence)
- shadcn/ui Command component patterns — inferred from installed `cmdk` + `components/ui/command.tsx`
- npm registry version checks — `lucide-react@1.8.0`, `@tanstack/react-query@5.99.2`, `sonner@2.0.7`

### Tertiary (LOW confidence)
- None — all claims verified against codebase or registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed and versions verified
- Architecture: HIGH — all integration points exist and patterns are established
- Pitfalls: HIGH — derived from direct analysis of existing code and tRPC routers

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable stack, no fast-moving dependencies)
