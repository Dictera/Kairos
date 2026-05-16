---
status: issues_found
phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani
depth: standard
files_reviewed: 12
date: 2026-04-22
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
---

# Phase 19 Code Review Report

**Depth:** standard  
**Files Reviewed:** 12  
**Date:** 2026-04-22  

---

## Summary

No critical issues found. Four warnings and three informational items were identified across the reviewed files. The most significant concern is a missing `React` namespace import in `belge-list.tsx` that will cause a TypeScript compilation error, and an invalid `variant` prop passed to `AlertDialogAction` in `sablon-yonetimi-section.tsx`.

---

## Findings

### WR-01: Missing `React` namespace import for `ElementType`

- **Severity:** warning
- **File:** `components/belge/belge-list.tsx`
- **Line:** 17

The `kategoriIcons` constant is typed as `Record<string, React.ElementType>`, but `React` is not imported into the module. Only `useMemo` is imported from `'react'`. With the automatic JSX runtime, the `React` namespace is not implicitly available, so this will produce a TypeScript error: `Cannot find name 'React'`.

**Remediation:** Add `import type { ElementType } from 'react'` and change the type to `Record<string, ElementType>`.

---

### WR-02: `variant="destructive"` on `AlertDialogAction`

- **Severity:** warning
- **File:** `components/ayarlar/sablon-yonetimi-section.tsx`
- **Line:** 489

`AlertDialogAction` is passed `variant="destructive"`. The standard shadcn/ui `AlertDialogAction` wrapper does not accept a `variant` prop; it hard-codes `buttonVariants()` (primary style). The `variant` prop is forwarded to the underlying primitive and eventually to the DOM, where React will emit a development warning about an unrecognized prop. Styling should be applied via `className` instead.

**Remediation:** Replace `variant="destructive"` with `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"` to match the pattern used in `belge-list.tsx` (line 148).

---

### WR-03: Non-focusable `TableRow` with `onClick` lacks keyboard accessibility

- **Severity:** warning
- **File:** `components/ayarlar/sablon-yonetimi-section.tsx`
- **Line:** 238

The `TableRow` element has `onClick={() => setCatalogTarget(t)}` but is not focusable or keyboard-interactive. Screen-reader and keyboard-only users cannot trigger the row click to open the variable catalog. While the action buttons inside the row remain accessible, the row-click shortcut is inaccessible.

**Remediation:** Either add `tabIndex={0}` and an `onKeyDown` handler (Enter/Space) to the row, or render the row content inside a semantic interactive element (e.g., a button or anchor) that handles both click and keyboard activation.

---

### WR-04: `as number` type assertion hides schema drift

- **Severity:** warning
- **File:** `components/belge/belge-list.tsx`
- **Line:** 91

The expression `belge.sablon_id as number` assumes `sablon_id` is a `number` at runtime. If the database schema or tRPC output type changes (e.g., to `string` or `bigint`), the assertion suppresses the TypeScript error and the `templateById.get(...)` lookup will silently fail at runtime.

**Remediation:** Remove the `as number` cast and rely on the inferred tRPC type. If `sablon_id` is typed as `number | null`, the Map lookup will work without a cast; if the type is wrong, fix it at the schema/router level.

---

### IN-01: Explicit inline type for `selected` indicates type-system brittleness

- **Severity:** info
- **File:** `components/belge/sablondan-uret.tsx`
- **Lines:** 30–37

The `selected` state uses an explicit inline interface instead of deriving the type from `trpc.sablon.list.queryOptions()`. The SUMMARY notes this was done to avoid a TypeScript circular inference error. While functional, it creates a maintenance burden: if the sablon schema changes, this inline type must be updated manually.

**Remediation:** Investigate the root cause of the circular inference and refactor so the tRPC-generated type can be used directly, or extract the inline interface into a named type that is shared with the backend schema.

---

### IN-02: Non-standard Button size variant

- **Severity:** info
- **File:** `components/ayarlar/sablon-yonetimi-section.tsx`
- **Lines:** 254, 263

`size="icon-sm"` is used on `<Button>` components. Standard shadcn/ui Button sizes are `default`, `sm`, `lg`, and `icon`. If the local `Button` component has not been extended to support `icon-sm`, the prop is ignored and the button renders at the default size, which may cause layout inconsistencies.

**Remediation:** Verify that the local `Button` variant supports `icon-sm`, or switch to `size="icon"` with an explicit `className="h-9 w-9"`.

---

### IN-03: Tests verify structure but not runtime behavior

- **Severity:** info
- **Files:** `tests/19-sablondan-uret.test.ts`, `tests/19-variable-catalog.test.ts`, `tests/19-cheat-sheet.test.ts`

All three test suites use `readFileSync` and regex/string assertions to verify that source files contain expected strings, imports, and copy. These structure tests are valuable for preventing regressions, but they do not exercise component rendering, user interaction, or mutation logic. No runtime bugs in the progress timer, tRPC invalidation, or modal state transitions are covered.

**Remediation:** Consider adding at least one React Testing Library or Playwright test per interactive component (`SablondanUret`, `VariableCatalogModal`) to verify actual user flows (e.g., selecting a template, triggering generation, observing progress steps).

---

## Files Reviewed

1. `components/belge/sablondan-uret.tsx`
2. `components/belge/belge-list.tsx`
3. `components/dosya/dosya-detail-tabs.tsx`
4. `components/ayarlar/variable-catalog-modal.tsx`
5. `components/ayarlar/sablon-yonetimi-section.tsx`
6. `components/degiskenler/cheat-sheet-page.tsx`
7. `components/ayarlar/cheat-sheet-summary-card.tsx`
8. `app/(dashboard)/ayarlar/degiskenler/page.tsx`
9. `components/ayarlar/ayarlar-page.tsx`
10. `tests/19-sablondan-uret.test.ts`
11. `tests/19-variable-catalog.test.ts`
12. `tests/19-cheat-sheet.test.ts`
