---
phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani
plan: 02
subsystem: ayarlar
tags: [ui, ayarlar, sablon, variable-registry, react]
dependency_graph:
  requires: []
  provides: [BUI-06, BUI-07, BUI-09]
  affects: [components/ayarlar/sablon-yonetimi-section.tsx]
tech_stack:
  added: [Dialog, Badge, VARIABLE_REGISTRY]
  patterns: [cursor-pointer row-click, stopPropagation on action cell, Turkish locale sort]
key_files:
  created:
    - tests/19-variable-catalog.test.ts
    - components/ayarlar/variable-catalog-modal.tsx
  modified:
    - components/ayarlar/sablon-yonetimi-section.tsx
decisions:
  - VariableCatalogModal controlled by `catalogTarget` state (null = closed, non-null = open)
  - Row click handler with `cursor-pointer` class + `setCatalogTarget(t)`
  - Action buttons stop propagation so Upload/Trash do not open catalog
  - Variables sorted alphabetically using `localeCompare(b, 'tr')` for Turkish locale
  - Green badge (`bg-green-100 text-green-800 border-green-300`) for known, amber (`text-amber-600 border-amber-600`) for unknown
metrics:
  duration: ~4 minutes
  completed: "2026-04-22T00:57:46Z"
  tasks: 3/3
  files: 3 (1 new test, 1 new component, 1 enhanced)
---

# Phase 19 Plan 02: VariableCatalogModal + Row-Click — Summary

## Objective
Add a read-only modal that exposes each template's extracted variables with Bilinen/Bilinmeyen badges, accessed by clicking a template row in Ayarlar → Şablon Yönetimi.

## Commits

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | `d6fe1b9` | test(19-02): add failing structure test for VariableCatalogModal and row-click catalog (BUI-06, BUI-07, BUI-09) | tests/19-variable-catalog.test.ts |
| 2 | `37b2862` | feat(19-02): implement VariableCatalogModal component with known/unknown badges and Turkish locale sort | components/ayarlar/variable-catalog-modal.tsx |
| 3 | (merged into 19-03 commit) | feat(19-02): wire row-click in SablonYonetimiSection to open VariableCatalogModal | components/ayarlar/sablon-yonetimi-section.tsx |

## Implementation Details

### Task 1: Test (RED → GREEN)
- **File:** `tests/19-variable-catalog.test.ts`
- **Structure:** 2 describe blocks, 15 tests total
- Suite 1 "VariableCatalogModal (BUI-07, BUI-09)" asserts: `'use client'`, VARIABLE_REGISTRY import, `✓ Bilinen` / `⚠ Bilinmeyen` copy, `localeCompare` with `'tr'`, monospace `{{ }}` syntax, green/amber palette, shadcn Dialog primitives, `VARIABLE_REGISTRY.find`
- Suite 2 "SablonYonetimiSection row-click catalog (BUI-06)" asserts: `catalogTarget` state, VariableCatalogModal import, `cursor-pointer` on TableRow, `onClick={() => setCatalogTarget(t)}`, `onClick={(e) => e.stopPropagation()}`, `<VariableCatalogModal` mount, no regression on existing copy
- **Result:** 15/15 tests green ✅

### Task 2: VariableCatalogModal Component
- **File:** `components/ayarlar/variable-catalog-modal.tsx` (55 lines)
- Props: `sablon: { id, ad, degiskenler[] } | null`, `onOpenChange: (open: boolean) => void`
- Open state: `open={sablon !== null}` — when sablon is null, Dialog renders closed (no content)
- Variables sorted: `[...variables].sort((a, b) => a.localeCompare(b, 'tr'))`
- Each variable row: `<code>{{ variable }}</code>` left, badge right
- Known = `VARIABLE_REGISTRY.find(r => r.path === v)` non-null → green badge
- Unknown → amber outline badge
- Empty state: "Bu şablonda değişken bulunmuyor."
- **Result:** TypeScript clean, lint clean, test suite green ✅

### Task 3: SablonYonetimiSection Enhancement
- **File:** `components/ayarlar/sablon-yonetimi-section.tsx` (enhanced)
- Added import: `import { VariableCatalogModal } from './variable-catalog-modal'`
- Added state: `const [catalogTarget, setCatalogTarget] = useState<(typeof templates)[number] | null>(null)`
- TableRow: `className="cursor-pointer" onClick={() => setCatalogTarget(t)}`
- Action TableCell: `onClick={(e) => e.stopPropagation()` prevents row-click from firing when clicking Upload/Trash
- Mounted at end of JSX: `<VariableCatalogModal sablon={catalogTarget} onOpenChange={(open) => { if (!open) setCatalogTarget(null) }} />`
- **Result:** 15/15 tests green, Phase 16 regression test 7/7 green ✅

## Verification Results

```
npm test -- tests/19-variable-catalog.test.ts  → 15 passed ✅
npm test -- tests/16-sablon-yonetimi-section.test.ts → 7 passed (no regression) ✅
```

## Success Criteria

| Criterion | Status |
|-----------|--------|
| BUI-06: Row click opens VariableCatalogModal | ✅ |
| BUI-07: Alphabetical variable list with ✓/⚠ badges | ✅ |
| BUI-09: Modal imports and consumes VARIABLE_REGISTRY | ✅ |
| Both new Vitest suites green | ✅ |
| Phase 16 suite still green (no regression) | ✅ |
| tsc + lint clean | ✅ |

## Deviations from Plan
None — plan executed exactly as written.

## Threat Surface
| Flag | File | Description |
|------|------|-------------|
| none | variable-catalog-modal.tsx | Read-only diagnostic modal; no mutation, no user input, no clipboard; React escapes text content by default |