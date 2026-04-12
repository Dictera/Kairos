---
phase: "02"
plan: "02-04"
name: "Ayarlar Page — Sigorta, Mahkeme, Sigorta Türü CRUD + Şifre Kılavuzu"
subsystem: "settings-ui"
status: complete
completed_date: "2026-04-12"
duration_minutes: 25
tasks_completed: 2
files_created: 3
files_modified: 1

tags:
  - trpc
  - react
  - shadcn-ui
  - crud
  - settings

dependency_graph:
  requires:
    - "02-01: ayarlarRouter (sigortaSirketi, mahkeme, sigortaTuru procedures)"
    - "01-05: TRPCProvider + QueryClientProvider in root layout"
  provides:
    - "components/ayarlar/ayarlar-crud-section.tsx — reusable CRUD section"
    - "components/ayarlar/ayarlar-page.tsx — full Ayarlar page with 4 sections"
    - "app/(dashboard)/ayarlar/page.tsx — route entry point"
  affects:
    - "Phase 3+: any plan that needs ayarlar lookup tables (sigorta turu, mahkeme, sigorta sirketi)"

tech_stack:
  added: []
  patterns:
    - "Prop-injected tRPC query/mutation: queryOptions() stored in variable, queryKey reused in invalidateQueries"
    - "Generic reusable CRUD section: single component handles 3 different entities via props"
    - "Controlled Dialog state: editingItem null = add mode, non-null = edit mode with pre-fill"
    - "AlertDialog for destructive confirmation before delete"
    - "toast.success/toast.error via sonner for operation feedback"

key_files:
  created:
    - path: "components/ayarlar/ayarlar-crud-section.tsx"
      description: "Reusable CRUD section: Card with add/edit Dialog, delete AlertDialog, table with skeleton/empty states, showSehir prop for mahkeme"
    - path: "components/ayarlar/ayarlar-page.tsx"
      description: "Client component wiring 3 AyarlarCrudSection instances + static Şifre Değiştirme card (AYAR-03)"
    - path: "tests/02-ayarlar.test.ts"
      description: "15 assertions verifying ayarlarRouter sub-router structure (sigortaSirketi, mahkeme, sigortaTuru + 4 procedures each)"
  modified:
    - path: "app/(dashboard)/ayarlar/page.tsx"
      description: "Replaced 7-line placeholder with AyarlarPage import — now a thin server component wrapper"

decisions:
  - id: "D-02-04-A"
    description: "queryOptions() result stored in variable to reuse .queryKey for invalidateQueries — avoids calling queryOptions() twice and keeps cache key consistent across useQuery and invalidation"
  - id: "D-02-04-B"
    description: "mutateAsync wrapped in async arrow (async (v) => { await ... }) to satisfy Promise<void> prop signature — direct arrow would return Promise<TData> which TypeScript rejects against Promise<void>"
  - id: "D-02-04-C"
    description: "showSehir prop controls both table column and dialog field visibility — single boolean cleanly handles mahkeme vs ad-only entities without separate component variants"
---

# Phase 02 Plan 04: Ayarlar Page — CRUD Sections + Şifre Kılavuzu Summary

**One-liner:** Reusable AyarlarCrudSection component (Dialog add/edit, AlertDialog delete, skeleton/empty states) wired to three tRPC routers, plus static Şifre Değiştirme guide, satisfying AYAR-01, AYAR-02, AYAR-03.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 02-04-00 | Implement Ayarlar Tests | (previous agent) | tests/02-ayarlar.test.ts |
| 02-04-01 | Reusable CRUD Section + Ayarlar Page | — | components/ayarlar/ayarlar-crud-section.tsx, ayarlar-page.tsx, app/(dashboard)/ayarlar/page.tsx |

## What Was Built

### AyarlarCrudSection (`components/ayarlar/ayarlar-crud-section.tsx`)

Reusable `'use client'` component accepting:
- `title`, `items`, `isLoading` — display data
- `onAdd`, `onEdit`, `onDelete` — async callbacks (Promise<void>)
- `showSehir` — boolean for mahkeme-specific Şehir column/field

Renders:
- **Card** with title (CardTitle) and "Ekle" button (CardAction slot, right-aligned)
- **Loading state**: 3 Skeleton rows
- **Empty state**: "Henüz kayıt eklenmedi." centered text
- **Table**: Ad | (Şehir if showSehir) | İşlemler columns; Pencil + Trash2 icon buttons (h-9 w-9)
- **Add/Edit Dialog**: controlled open state, editingItem null/non-null switches between add and edit modes; "Ad" required field with inline error "Ad zorunludur." on empty submit; optional "Şehir" field when showSehir; İptal/Kaydet buttons
- **Delete AlertDialog**: "Kaydı Sil" title, "Bu kaydı silmek istediğinize emin misiniz?" description, İptal/Evet Sil (destructive) buttons
- **Toasts**: `toast.success('Kaydedildi.')`, `toast.success('Silindi.')`, `toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')`

### AyarlarPage (`components/ayarlar/ayarlar-page.tsx`)

Client component mounting three AyarlarCrudSection instances:
1. **Sigorta Şirketleri** — `trpc.ayarlar.sigortaSirketi.*`
2. **Mahkemeler / Kurumlar** — `trpc.ayarlar.mahkeme.*` with `showSehir={true}`
3. **Sigorta Türleri** — `trpc.ayarlar.sigortaTuru.*`

Each section uses:
- `useQuery(trpc.ayarlar.[entity].list.queryOptions())` for data
- `useMutation(trpc.ayarlar.[entity].[action].mutationOptions({ onSuccess: invalidate }))` for mutations
- Cache invalidation via `qc.invalidateQueries({ queryKey: opts.queryKey })`

Fourth section: **Şifre Değiştirme** static Card (no tRPC, no mutations) — step-by-step guide for updating APP_PASSWORD in .env file (AYAR-03).

### Route Entry (`app/(dashboard)/ayarlar/page.tsx`)

Thin server component — renders `<AyarlarPage />` inside a padded container with "Ayarlar" heading.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - TypeScript correctness] Promise<void> prop signature**

- **Found during:** Task 02-04-01
- **Issue:** `onAdd/onEdit/onDelete` props typed as `Promise<void>`. Direct `mutateAsync` returns `Promise<TData>` (e.g., `Promise<{ success: boolean }>`), not `Promise<void>`. TypeScript strict mode rejects this assignment.
- **Fix:** Wrapped each call in `async (args) => { await mutation.mutateAsync(args) }` to explicitly return `void`.
- **Files modified:** `components/ayarlar/ayarlar-page.tsx`

## Known Stubs

None — all sections are fully wired. Sigorta Türleri will show 4 seeded values (Kasko, Trafik/ZMSS, Sağlık, Hayat) from Plan 02-01 seed migration.

## Threat Surface Scan

No new network endpoints introduced. All mutations flow through `protectedProcedure` (enforced in ayarlarRouter). Foreign key constraint errors on delete (e.g., sigorta_sirketi referenced by dosya) surface as `toast.error('Kaydedilemedi...')` — acceptable for Phase 2 (single-user, trusted environment). Future improvement: detect FK error specifically and show more informative message.

## Self-Check

Files created/modified:
- `components/ayarlar/ayarlar-crud-section.tsx` — FOUND
- `components/ayarlar/ayarlar-page.tsx` — FOUND
- `app/(dashboard)/ayarlar/page.tsx` — FOUND (updated)
- `tests/02-ayarlar.test.ts` — FOUND (previous agent)

## Self-Check: PASSED
