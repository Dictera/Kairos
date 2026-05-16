# Phase 19: Belgeler UI ve Şablon Yönetimi Ekranı — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 8 (5 new, 3 enhancements) + 1 new test file
**Analogs found:** 8 / 8 (all files have exact or role-match analogs in the codebase)

## File Classification

| New/Modified File | Change | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `components/belge/sablondan-uret.tsx` | NEW | client component | request-response (tRPC mutation) | `components/belge/belge-upload.tsx` | exact (same folder, sibling component, same mutation pattern) |
| `components/ayarlar/variable-catalog-modal.tsx` | NEW | client component (modal) | read-only display | Upload Dialog inside `components/ayarlar/sablon-yonetimi-section.tsx` (lines 279–399) | exact (same Dialog primitive, same context) |
| `components/degiskenler/cheat-sheet-page.tsx` | NEW | server component (static) | no data flow (const render) | `app/(dashboard)/takvim/page.tsx` + static section of `components/ayarlar/ayarlar-page.tsx` (lines 84–123 password guide) | role-match (both static content) |
| `app/(dashboard)/ayarlar/degiskenler/page.tsx` | NEW | Next.js route | routing | `app/(dashboard)/ayarlar/page.tsx` | exact (sibling route under same segment) |
| `components/ayarlar/cheat-sheet-summary-card.tsx` | NEW | client/server card | navigation | Password card in `components/ayarlar/ayarlar-page.tsx` (lines 84–123) | role-match (same Card pattern) |
| `components/belge/belge-list.tsx` | ENHANCE | client component (list) | CRUD (read + delete) | itself — enhance in place with new conditional-row pattern | self |
| `components/ayarlar/sablon-yonetimi-section.tsx` | ENHANCE | client component (table CRUD) | CRUD | itself — add row click handler | self |
| `components/ayarlar/ayarlar-page.tsx` | ENHANCE | client orchestrator | composition | itself — add CheatSheetSummaryCard | self |
| `components/dosya/dosya-detail-tabs.tsx` | ENHANCE | client tab container | composition | itself — mount SablondanUret inside belgeler TabsContent (lines 197–201) | self |
| `tests/19-belgeler-ui.test.ts` | NEW | structure test | file read assertions | `tests/16-sablon-yonetimi-section.test.ts` | exact (same structure + copy assertions pattern) |

---

## Pattern Assignments

### `components/belge/sablondan-uret.tsx` (NEW — client component, request-response)

**Primary analog:** `components/belge/belge-upload.tsx`
**Secondary analog (for Dialog):** `components/ayarlar/sablon-yonetimi-section.tsx` lines 279–399

#### Imports pattern (from `belge-upload.tsx` lines 1–11)
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useTRPC } from '@/lib/trpc/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileIcon, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BELGE_KATEGORILER } from '@/lib/schema'
import { toast } from 'sonner'
```
**Apply to Phase 19:** Replace `Select` imports with `Tabs`, `Command` primitives; add `Dialog`, `Loader2`, `cn` utility. Keep `'use client'`, `useTRPC`, `useMutation`, `useQueryClient`, `toast`.

#### tRPC mutation + invalidation pattern (from `belge-upload.tsx` lines 25–42)
```typescript
const trpc = useTRPC()
const queryClient = useQueryClient()

const createMutation = useMutation(
  trpc.belge.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId }) })
      toast.success('Belge yüklendi')
      setFile(null)
      setKategori('')
      setError(null)
      onUploadComplete?.()
    },
    onError: (err) => {
      toast.error('Belge kaydedilemedi: ' + err.message)
    }
  })
)
```
**Apply to Phase 19:** Replace `trpc.belge.create` with `trpc.pdf.generate`, success toast with `'PDF üretildi.'`, invalidate `trpc.belge.list.queryKey({ dosya_id: dosyaId })`. On success also close progress modal (`setProgressOpen(false)`), reset selection state (`setSelected(null)`, `setStep('idle')`). On error, forward `err.message` directly (backend already returns Turkish `BAD_REQUEST` messages — see pdf.ts:71–76).

#### Template list query pattern (from `sablon-yonetimi-section.tsx` lines 65–66)
```typescript
const listOpts = trpc.sablon.list.queryOptions()
const { data: templates = [], isLoading } = useQuery(listOpts)
```
**Apply to Phase 19:** Same — `sablonRouter.list` returns all templates with `kategori`, `ad`, `id`, `degiskenler`.

#### Client-side category filter pattern (from `sablon-yonetimi-section.tsx` lines 174–176)
```typescript
const filtered = templates.filter(
  (t) => filterKategori === 'all' || t.kategori === filterKategori
)
```
**Apply to Phase 19:** Identical logic. Category is `'all' | 'STK' | 'Mahkeme' | 'Genel'`. Filter feeds the Command list.

#### Primary CTA button pattern (from `belge-upload.tsx` lines 198–204)
```typescript
<Button
  onClick={handleUpload}
  disabled={!file || !kategori || createMutation.isPending}
  className="bg-[var(--accent)] hover:bg-[var(--accent)]/90"
>
  {createMutation.isPending ? 'Yükleniyor...' : 'Belge Yükle'}
</Button>
```
**Apply to Phase 19:** Use **`bg-primary`** (orange) instead of `var(--accent)` per UI-SPEC (orange is primary CTA, accent is secondary/upload). Disabled on `!selected || generateMutation.isPending`. Label: "Şablondan Üret" / "Üretiliyor…".

#### Component props pattern (from `belge-upload.tsx` lines 13–19)
```typescript
interface BelgeUploadProps {
  dosyaId: number
  dosyaNo: string
  onUploadComplete?: () => void
}

export function BelgeUpload({ dosyaId, dosyaNo, onUploadComplete }: BelgeUploadProps) {
```
**Apply to Phase 19:** `SablondanUretProps { dosyaId: number }` — `dosyaNo` not needed (archive uses server-side `rows.dosya_no`).

---

### `components/belge/sablondan-uret.tsx` — Progress Modal Sub-Pattern

**Analog for Dialog structure:** `components/ayarlar/sablon-yonetimi-section.tsx` lines 279–281, 400–405
**Analog for non-dismissible modal:** UI-SPEC `onInteractOutside` + `onEscapeKeyDown` prevention

#### Dialog open/close pattern (from `sablon-yonetimi-section.tsx` line 279)
```typescript
<Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) resetUpload() }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Şablon Yükle</DialogTitle>
    </DialogHeader>
    {/* ... */}
  </DialogContent>
</Dialog>
```
**Apply to Phase 19:** Progress Dialog takes `open={progressOpen}` only (no close handler during pending), uses `onInteractOutside={(e) => e.preventDefault()}` and `onEscapeKeyDown={(e) => e.preventDefault()}` to block dismissal. Title: "PDF Üretiliyor". Inside: `Loader2` + numbered step list (see UI-SPEC §2 for exact JSX).

---

### `components/belge/belge-list.tsx` (ENHANCE — client list, CRUD read)

**Primary analog:** itself (in-place enhancement)
**Supporting query analog:** `sablon-yonetimi-section.tsx` line 65 for `sablon.list` query

#### Existing imports block to extend (lines 1–12)
```typescript
'use client'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FileIcon, Download, Trash2, FileText, Scale, Shield, Briefcase, Users, MoreHorizontal } from 'lucide-react'
// ...
```
**Apply to Phase 19:** `FileText` already imported. Add `cn` from `@/lib/utils` (needed for conditional className). No new library imports.

#### Existing row render (lines 81–103) — extend with conditional styling
```typescript
{belgeler.map((belge) => {
  const Icon = kategoriIcons[belge.kategori] || FileIcon
  const colorClass = kategoriColors[belge.kategori] || 'bg-gray-100 text-gray-800'
  const fileUrl = belge.dosya_yolu

  return (
    <div
      key={belge.id}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium truncate">{belge.dosya_adi}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge className={colorClass} variant="secondary">
              {belge.kategori}
            </Badge>
            <span>{format(new Date(belge.created_at), 'dd MMM yyyy', { locale: tr })}</span>
            <span>{(belge.dosya_boyutu / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
      {/* actions ... */}
    </div>
  )
})}
```
**Apply to Phase 19 (per UI-SPEC §3 + D-11, D-12):**
1. Add `sablon.list` query alongside existing `belge.list` query:
   ```typescript
   const { data: templates = [] } = useQuery(trpc.sablon.list.queryOptions())
   const templateById = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates])
   ```
2. Inside `.map()`, compute `isGenerated`:
   ```typescript
   const isGenerated = belge.sablon_id != null
   const sablonAdi = isGenerated ? templateById.get(belge.sablon_id!)?.ad : undefined
   const seqMatch = belge.dosya_adi.match(/-(\d+)\.pdf$/i)
   const seq = seqMatch?.[1]
   const Icon = isGenerated ? FileText : (kategoriIcons[belge.kategori] || FileIcon)
   ```
3. Add `cn` for left border:
   ```typescript
   className={cn(
     "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors",
     isGenerated && "border-l-4 border-l-[var(--accent)]"
   )}
   ```
4. Add subtitle span inside the existing muted row:
   ```typescript
   {isGenerated && sablonAdi && (
     <span className="text-[var(--accent)]">
       Şablon: {sablonAdi}{seq ? ` • #${seq}` : ''}
     </span>
   )}
   ```

---

### `components/ayarlar/variable-catalog-modal.tsx` (NEW — client modal, read-only)

**Primary analog (Dialog shell):** `components/ayarlar/sablon-yonetimi-section.tsx` lines 279–399 (Upload Dialog)
**Primary analog (variable registry consumption):** `lib/docx/variable-registry.ts` `VARIABLE_REGISTRY.find()` usage in `getMissingVariables` (lines 138–157)

#### Imports pattern
```typescript
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { VARIABLE_REGISTRY } from '@/lib/docx/variable-registry'
```
**Apply to Phase 19:** Uses shadcn Dialog (same as sablon-yonetimi-section), Badge (same as belge-list `<Badge className={colorClass} variant="secondary">`), imports registry directly.

#### Registry lookup pattern (from `variable-registry.ts` line 147)
```typescript
const info = VARIABLE_REGISTRY.find((v) => v.path === varPath)
```
**Apply to Phase 19:** Iterate `sablon.degiskenler` (array of variable paths), look up each in `VARIABLE_REGISTRY`. If found → known (green badge); else → unknown (amber outline badge). See UI-SPEC §4 for JSX.

#### Turkish locale sort pattern (new, required per D-06 alphabetical order)
```typescript
const sorted = [...variables].sort((a, b) => a.localeCompare(b, 'tr'))
```
**Source:** UI-SPEC §4 — no existing analog, but pattern aligns with Turkish display conventions used elsewhere (e.g., `date-fns/locale/tr` in belge-list).

#### Props pattern
```typescript
interface VariableCatalogModalProps {
  sablon: { id: number; ad: string; degiskenler: string[] } | null
  onOpenChange: (open: boolean) => void
}
```
**Apply to Phase 19:** Parent `sablon-yonetimi-section.tsx` manages open state via `selectedCatalogSablon` state (analogous to existing `deleteTarget` / `overwriteTarget` pattern, lines 73–74).

---

### `components/ayarlar/sablon-yonetimi-section.tsx` (ENHANCE — add row click → catalog modal)

**Primary analog:** itself (in-place enhancement following its own established modal-target state pattern)

#### Existing modal-target state pattern to copy (lines 71–73)
```typescript
const [overwriteTarget, setOverwriteTarget] = useState<(typeof templates)[number] | null>(null)
const [overwriteBelgeTuru, setOverwriteBelgeTuru] = useState<(typeof BELGE_KATEGORILER)[number] | undefined>(undefined)
const [deleteTarget, setDeleteTarget] = useState<(typeof templates)[number] | null>(null)
```
**Apply to Phase 19:** Add sibling:
```typescript
const [catalogTarget, setCatalogTarget] = useState<(typeof templates)[number] | null>(null)
```

#### Row click handler pattern (follow existing `onClick={() => setDeleteTarget(t)}` style on line 264)
```typescript
<Button
  variant="ghost"
  size="icon-sm"
  className="h-9 w-9 text-destructive hover:text-destructive"
  aria-label="Şablonu sil"
  onClick={() => setDeleteTarget(t)}
>
```
**Apply to Phase 19 (per D-05):** Add `onClick={() => setCatalogTarget(t)}` to the `<TableRow>` itself (line 236) with `className="cursor-pointer"`. Stop propagation on existing action buttons so clicks on Upload/Trash don't also open catalog:
```typescript
<TableRow key={t.id} className="cursor-pointer" onClick={() => setCatalogTarget(t)}>
  {/* ... cells ... */}
  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
    {/* action buttons */}
  </TableCell>
</TableRow>
```

#### Modal mount pattern (follow existing delete modal, lines 473–498)
```typescript
<AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
  {/* ... */}
</AlertDialog>
```
**Apply to Phase 19:** Mount `<VariableCatalogModal sablon={catalogTarget} onOpenChange={(open) => { if (!open) setCatalogTarget(null) }} />` near the end of the JSX tree, alongside other modals.

---

### `app/(dashboard)/ayarlar/degiskenler/page.tsx` (NEW — Next.js route)

**Primary analog:** `app/(dashboard)/ayarlar/page.tsx`

#### Route shell pattern (from `ayarlar/page.tsx` lines 1–10)
```typescript
import { AyarlarPage } from '@/components/ayarlar/ayarlar-page'

export default function AyarlarRoutePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Ayarlar</h1>
      <AyarlarPage />
    </div>
  )
}
```
**Apply to Phase 19 (per UI-SPEC §6 — no `'use client'` directive; Server Component):**
```typescript
import { CheatSheetPage } from '@/components/degiskenler/cheat-sheet-page'

export default function DegiskenlerRoutePage() {
  return <CheatSheetPage />
}
```
The heading + container is owned by `CheatSheetPage` itself (it controls its own `p-6 space-y-8 max-w-4xl` — see UI-SPEC §6).

---

### `components/degiskenler/cheat-sheet-page.tsx` (NEW — server component, static)

**Primary analog:** Static password-guide section in `components/ayarlar/ayarlar-page.tsx` lines 84–123 (same visual vocabulary: code in muted boxes, ordered lists).
**Secondary analog (page container):** `app/(dashboard)/takvim/page.tsx` lines 6–19 for Card + page heading layout.

#### Heading + container pattern (from `ayarlar/page.tsx` lines 1–10 + UI-SPEC §6)
```typescript
// NO 'use client' — Server Component
import { VARIABLE_REGISTRY } from '@/lib/docx/variable-registry'

export function CheatSheetPage() {
  const grouped = groupByTab(VARIABLE_REGISTRY)
  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Değişken Listesi</h1>
        <p className="text-sm text-muted-foreground">
          Şablonlarda kullanılabilen tüm değişkenler ve açıklamaları.
        </p>
      </div>
      {/* grouped sections */}
    </div>
  )
}
```

#### Code snippet styling pattern (from `ayarlar-page.tsx` lines 91–94)
```typescript
<code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
  APP_PASSWORD
</code>
```
**Apply to Phase 19:** Use identical styling for `{{ variable }}` display. Per UI-SPEC §6 the variable line uses `text-sm font-mono bg-muted px-1.5 py-0.5 rounded`.

#### Group-by helper (new utility, inline)
No existing `groupBy` helper in the codebase. Inline a tiny helper:
```typescript
function groupByTab(vars: VariableInfo[]): Record<string, VariableInfo[]> {
  return vars.reduce((acc, v) => {
    (acc[v.tab] ||= []).push(v)
    return acc
  }, {} as Record<string, VariableInfo[]>)
}
```

---

### `components/ayarlar/cheat-sheet-summary-card.tsx` (NEW — card with nav link)

**Primary analog:** Password-guide Card in `components/ayarlar/ayarlar-page.tsx` lines 84–123

#### Card structure pattern (from `ayarlar-page.tsx` lines 84–88)
```typescript
<Card>
  <CardHeader>
    <CardTitle className="text-base font-semibold">Şifre Değiştirme</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3 text-sm text-muted-foreground">
    {/* content */}
  </CardContent>
</Card>
```
**Apply to Phase 19 (per UI-SPEC §5):** Same Card shell; title "Değişken Listesi"; content is one paragraph + `<Button variant="outline" size="sm" asChild><Link href="/ayarlar/degiskenler">Tüm değişkenleri gör</Link></Button>`. `Link` import from `next/link` (pattern already used in `dosya-detail-tabs.tsx` line 29).

---

### `components/ayarlar/ayarlar-page.tsx` (ENHANCE — mount summary card)

**Primary analog:** itself (lines 54–134 layout with `<Separator />` between sections)

#### Existing composition pattern (lines 54–133)
```typescript
return (
  <div className="space-y-8">
    <SigortaSirketiSection />
    <Separator />
    <AyarlarCrudSection title="Mahkemeler / Kurumlar" {...} />
    <Separator />
    {/* ... */}
    <SablonYonetimiSection />
    <Separator />
    <PipelineStatus />
  </div>
)
```
**Apply to Phase 19:** Insert `<CheatSheetSummaryCard />` + `<Separator />` after `SablonYonetimiSection` (or adjacent to it — natural grouping). Import mirrors existing imports at lines 1–10.

---

### `components/dosya/dosya-detail-tabs.tsx` (ENHANCE — mount SablondanUret)

**Primary analog:** itself — existing belgeler TabsContent (lines 197–201)

#### Current mount pattern (lines 197–201)
```typescript
<TabsContent value="belgeler" className="mt-4 space-y-4">
  <BelgeUpload dosyaId={dosyaId} dosyaNo={data.dosya_no} />
  <Separator />
  <BelgeList dosyaId={dosyaId} />
</TabsContent>
```
**Apply to Phase 19 (per D-01 — SablondanUret ABOVE BelgeUpload):**
```typescript
<TabsContent value="belgeler" className="mt-4 space-y-4">
  <SablondanUret dosyaId={dosyaId} />
  <Separator />
  <BelgeUpload dosyaId={dosyaId} dosyaNo={data.dosya_no} />
  <Separator />
  <BelgeList dosyaId={dosyaId} />
</TabsContent>
```
Add import alongside existing `BelgeUpload` / `BelgeList` imports (lines 33–34).

---

### `tests/19-belgeler-ui.test.ts` (NEW — structure + copy tests)

**Primary analog:** `tests/16-sablon-yonetimi-section.test.ts`

#### File-read assertion pattern (from `16-sablon-yonetimi-section.test.ts` lines 1–32)
```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const SECTION_PATH = 'components/ayarlar/sablon-yonetimi-section.tsx'

describe('Şablon Yönetimi section: copy + structure (SABLON-02, SABLON-04)', () => {
  const src = readFileSync(SECTION_PATH, 'utf-8')

  it('uses client directive', () => { expect(src.startsWith("'use client'")).toBe(true) })
  it('renders required Turkish copy strings (UI-SPEC contract)', () => {
    expect(src).toContain('Şablon Yönetimi')
    expect(src).toContain('Şablon Yükle')
    // ...
  })
  it('wires all four tRPC procedures', () => {
    expect(src).toMatch(/trpc\.sablon\.list/)
    expect(src).toMatch(/trpc\.sablon\.create/)
    // ...
  })
})

describe('Ayarlar page mount (SABLON-04)', () => {
  const page = readFileSync(PAGE_PATH, 'utf-8')
  it('imports SablonYonetimiSection', () => {
    expect(page).toMatch(/import\s+SablonYonetimiSection\s+from\s+['"]\.\/sablon-yonetimi-section['"]/)
  })
  it('renders SablonYonetimiSection in JSX', () => {
    expect(page).toMatch(/<SablonYonetimiSection\s*\/>/)
  })
})
```
**Apply to Phase 19 (one suite per BUI-0X requirement):**
- `SablondanUret` component path read → assert `'use client'`, Turkish copy ("Şablondan Üret", "Şablon seçin…", "Şablon ara…", "Şablon bulunamadı.", "PDF Üretiliyor", "Şablon dolduruluyor…", "PDF oluşturuluyor…", "Arşivleniyor…"), tRPC wires (`trpc.pdf.generate`, `trpc.sablon.list`), invalidation (`trpc.belge.list.queryKey`). [BUI-01, BUI-02, BUI-03, BUI-04]
- `belge-list.tsx` read → assert `sablon_id` reference, `FileText`, `border-l-4 border-l-[var(--accent)]`, `Şablon: ` substring, `trpc.sablon.list`. [BUI-05]
- `sablon-yonetimi-section.tsx` read → assert `catalogTarget` or `VariableCatalogModal` presence, row `cursor-pointer`. [BUI-06]
- `variable-catalog-modal.tsx` read → assert `VARIABLE_REGISTRY` import, `✓ Bilinen`, `⚠ Bilinmeyen`, `localeCompare`. [BUI-07]
- Route file `app/(dashboard)/ayarlar/degiskenler/page.tsx` and `cheat-sheet-page.tsx` reads → assert `VARIABLE_REGISTRY` import, `Değişken Listesi` heading, Jinja2 filter section headings (`tr_currency`, `tarih`, `upper_tr`, `lower_tr`). [BUI-08, BUI-09, D-13]
- `dosya-detail-tabs.tsx` read → assert `SablondanUret` imported and rendered before `BelgeUpload` inside belgeler TabsContent. [D-01]
- `ayarlar-page.tsx` read → assert `CheatSheetSummaryCard` imported and rendered. [BUI-08 entry point]

---

## Shared Patterns

### Authentication
**Source:** Not applicable at component layer. tRPC `protectedProcedure` in `lib/trpc/init` (already enforced on `sablonRouter`, `pdfRouter`, `belgeRouter`).
**Apply to:** All new components — no extra work; mutations automatically inherit auth via tRPC.

### Error Handling
**Source:** `components/belge/belge-upload.tsx` lines 38–40 + `components/belge/belge-list.tsx` lines 54–57 (standard onError pattern)
```typescript
onError: (err) => {
  toast.error('Belge kaydedilemedi: ' + err.message)
}
```
**Apply to:**
- `SablondanUret` generate mutation — forward backend Turkish message directly for BAD_REQUEST (missing var pre-check already returns "X henüz girilmemiş — Y sekmesinden ekleyin"); generic prefix "PDF üretilemedi: " for other codes. Close progress modal + reset `step` state.
- `VariableCatalogModal` — read-only, no mutation, no error handling needed.

### Query Invalidation After Mutation
**Source:** `components/belge/belge-upload.tsx` line 31 + `components/belge/belge-list.tsx` line 51
```typescript
queryClient.invalidateQueries({ queryKey: trpc.belge.list.queryKey({ dosya_id: dosyaId }) })
```
**Apply to:** `SablondanUret.onSuccess` — identical call. Query-key shape **must match** what `BelgeList` uses (Pitfall 1 in RESEARCH.md) — both use `{ dosya_id: dosyaId }`.

### Toast Notifications
**Source:** `components/belge/belge-upload.tsx` line 32 + `components/ayarlar/sablon-yonetimi-section.tsx` line 86
```typescript
import { toast } from 'sonner'
// ...
toast.success('Şablon yüklendi.')
toast.error('Yükleme başarısız. Lütfen tekrar deneyin.')
```
**Apply to:** `SablondanUret` — success `toast.success('PDF üretildi.')`; error passthrough from backend message.

### Modal State Reset on Close
**Source:** `components/ayarlar/sablon-yonetimi-section.tsx` lines 116–120
```typescript
function resetUpload() {
  setUploadOpen(false)
  setFile(null)
  form.reset({ ad: '', kategori: 'STK', belge_turu: undefined })
}
```
**Apply to:** `SablondanUret` — `resetProgress()` helper resets `progressOpen`, `step`, `selected`, so the next generation doesn't start mid-flow (Pitfall 2 in RESEARCH.md). Called from `onSuccess`, `onError`, and manual cancel (if any).

### `'use client'` Directive
**Source:** First line of `belge-upload.tsx`, `belge-list.tsx`, `sablon-yonetimi-section.tsx`, `dosya-detail-tabs.tsx`, `ayarlar-page.tsx`.
**Apply to:** `SablondanUret`, `VariableCatalogModal`, `CheatSheetSummaryCard` (if using `<Link>` only, can stay server; add directive only if using hooks).
**Do NOT apply to:** `cheat-sheet-page.tsx`, `app/(dashboard)/ayarlar/degiskenler/page.tsx` — both are Server Components per UI-SPEC §6 (static const render, no hooks).

### Loading State
**Source:** `components/belge/belge-list.tsx` lines 60–68 + `sablon-yonetimi-section.tsx` lines 207–213
```typescript
if (isLoading) {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
```
**Apply to:** `SablondanUret` — Skeleton rows while `sablon.list` loads; "Henüz şablon eklenmedi." empty state (from UI-SPEC copy contract).

### Badge Styling
**Source:** `components/belge/belge-list.tsx` lines 25–34, 96–98
```typescript
<Badge className={colorClass} variant="secondary">
  {belge.kategori}
</Badge>
```
**Apply to:** `VariableCatalogModal` known badge uses `className="bg-green-100 text-green-800 border-green-300"` `variant="outline"`; unknown badge `className="text-amber-600 border-amber-600"` `variant="outline"` (per UI-SPEC §4).

---

## No Analog Found

All planned files have at least a role-match analog in the codebase. The most novel piece is the **progress modal with step indicators** — no existing file has a multi-step progress dialog. Use the UI-SPEC §2 JSX as the source of truth (it is already derived from shadcn Dialog conventions + `Loader2` from `lucide-react`, both well-established in this codebase).

| File | Role | Novel Part | Guidance |
|------|------|-----------|----------|
| `sablondan-uret.tsx` | progress modal | Step indicator UI | Copy UI-SPEC §2 verbatim. Spinner = `Loader2 className="h-8 w-8 animate-spin text-primary"`. |
| `variable-catalog-modal.tsx` | green/amber badge pair | No exact color analog | Follow UI-SPEC §4 classes. |

---

## Metadata

**Analog search scope:**
- `components/belge/*` — BelgeUpload (primary), BelgeList (primary for enhance)
- `components/ayarlar/*` — SablonYonetimiSection (primary for Dialog + state pattern), AyarlarPage (primary for Card + composition)
- `components/dosya/dosya-detail-tabs.tsx` — primary for mount point
- `components/ui/command.tsx`, `components/ui/dialog.tsx`, `components/ui/tabs.tsx`, `components/ui/badge.tsx` — confirmed all installed
- `lib/docx/variable-registry.ts` — registry consumer patterns
- `lib/trpc/routers/pdf.ts`, `lib/trpc/routers/sablon.ts`, `lib/trpc/routers/belge.ts` — backend contract shapes
- `app/(dashboard)/ayarlar/page.tsx`, `app/(dashboard)/takvim/page.tsx` — route shell patterns
- `tests/16-sablon-yonetimi-section.test.ts` — Wave 0 structure-test pattern

**Files scanned:** 12 source + 1 test analog

**Pattern extraction date:** 2026-04-22

**Key architectural invariants confirmed:**
1. All tRPC list queries use `trpc.X.list.queryOptions()` destructured into `{ data, isLoading }`.
2. All mutations use `trpc.X.action.mutationOptions({ onSuccess, onError })` with `queryClient.invalidateQueries({ queryKey: ... })` on success.
3. All client components start with `'use client'`; all static content pages omit it.
4. All modals use shadcn `Dialog` (not custom overlay); all confirmations use `AlertDialog`.
5. Turkish copy is inlined in JSX (no i18n layer); tests assert copy as substring matches.
6. Toast messages use `sonner` and are short Turkish sentences ending with period.
7. `cn` from `@/lib/utils` is the canonical class-merging util for conditional styling.
