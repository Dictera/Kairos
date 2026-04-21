---
phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani
plan: 01
subsystem: ui
tags: [ui, belgeler, pdf-generation, react, trpc]

# Dependency graph
requires: []
provides:
  - SablondanUret component with category filter + searchable Command dropdown + progress modal
  - BelgeList enhancement with FileText icon + accent left border for generated PDFs
  - DosyaDetailTabs mount with SablondanUret above BelgeUpload in belgeler tab
  - tRPC wires: pdf.generate mutation, sablon.list query, belge.list invalidation
affects: [phase-19-02, phase-19-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Non-dismissible Dialog via onInteractOutside + onEscapeKeyDown preventDefault
    - Step-timer visual progression via setTimeout ticks during isPending mutation
    - Client-side template name resolution via useMemo Map from sablon.list query
    - Seq extraction via /-(\d+)\.pdf$/i regex from generated filename

key-files:
  created:
    - components/belge/sablondan-uret.tsx
    - tests/19-sablondan-uret.test.ts
  modified:
    - components/belge/belge-list.tsx
    - components/dosya/dosya-detail-tabs.tsx

key-decisions:
  - "Step timer visual progression (render→1200ms→convert→1200ms→archive) while mutation isPending — backend is a single blocking call"
  - "selected state uses explicit template type instead of queryOptions return type to avoid TypeScript circular inference error"
  - "CommandItem onSelect callback calls setSelected directly — not onClick — per Command component API"
  - "cn() utility used for conditional border-l-4 class in BelgeList row"

patterns-established:
  - "Progress modal: non-dismissible Dialog with Loader2 spinner + numbered step list, active step gets font-medium text-foreground"
  - "Generated PDF row: isGenerated ? FileText : kategoriIcon + border-l-4 accent left border + Şablon: {ad} • #{seq} subtitle"
  - "tRPC invalidation uses same queryKey shape as consuming query: trpc.belge.list.queryKey({ dosya_id: dosyaId })"

requirements-completed: [BUI-01, BUI-02, BUI-03, BUI-04, BUI-05]

# Metrics
duration: 5min
completed: 2026-04-22
---

# Phase 19 Plan 01: SablondanUret + BelgeList Enhancement Summary

**Şablondan Üret UI: category-filtered template dropdown, non-dismissible progress modal, generated-PDF row distinction with accent border + FileText icon**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-22T00:52:00Z
- **Completed:** 2026-04-22T00:58:00Z
- **Tasks:** 4
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- SablondanUret component: 'use client', category Tabs (Tümü/STK/Mahkeme/Genel), searchable Command dropdown, bg-primary CTA
- Non-dismissible progress modal with step labels: "Şablon dolduruluyor…", "PDF oluşturuluyor…", "Arşivleniyor…"
- tRPC wires: trpc.pdf.generate mutation, trpc.sablon.list query, trpc.belge.list.queryKey invalidation on success
- toast.success('PDF üretildi.') on success; toast.error(err.message) on error (forwards Turkish BAD_REQUEST message verbatim)
- BelgeList enhancement: isGenerated branch with FileText icon, border-l-4 border-l-[var(--accent)], "Şablon: {ad} • #{seq}" subtitle
- SablondanUret mounted above BelgeUpload in belgeler TabsContent via import + JSX placement

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD RED test + SablondanUret** - `8e77ede` (feat)
2. **Task 2: SablondanUret component** - `8e77ede` (feat)
3. **Task 3: BelgeList enhancement** - `4efe2d7` (feat)
4. **Task 4: DosyaDetailTabs mount** - `4efe2d7` (feat)
5. **Fix: selected state type** - `0986a46` (fix) — inline fix applied to SablondanUret

**Plan metadata:** `0986a46` (fix: complete plan)

## Files Created/Modified

- `components/belge/sablondan-uret.tsx` — New: Şablondan Üret component with category filter, Command dropdown, progress modal
- `components/belge/belge-list.tsx` — Enhanced: isGenerated branch with FileText icon, accent border, template subtitle
- `components/dosya/dosya-detail-tabs.tsx` — Enhanced: SablondanUret import + mount above BelgeUpload in belgeler tab
- `tests/19-sablondan-uret.test.ts` — New: 3-suite structure test (15 assertions) for copy, tRPC wires, mount order

## Decisions Made

- Used explicit inline type for selected state to avoid TypeScript circular inference with queryOptions return type
- Step timer uses 1200ms ticks to give visual feedback during single blocking mutation call
- Command onSelect callback pattern used (not onClick) per Command component API
- Seq regex uses /-(\d+)\.pdf$/i to extract sequence number from generated filenames

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **TypeScript error on selected state type** — queryOptions return type caused circular inference error. Fixed by using explicit inline interface type `{ id: number; ad: string; ... } | null` instead of `Awaited<ReturnType<typeof trpc.sablon.list.queryOptions>>[number]`.
2. **Missing "Şablon seçin…" string** — placeholder text used "Şablon seçin:" with colon. Fixed to "Şablon seçin…" per UI-SPEC copy contract.

## Next Phase Readiness

- SablondanUret component ready for Phase 19 Plan 02 (VariableCatalogModal) integration
- All 3 Vitest suites green (15/15 assertions)
- Pre-existing tsc errors in other files (archive.test.ts, pipeline.test.ts, config.test.ts) are unrelated to this plan

---
*Phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani*
*Completed: 2026-04-22*