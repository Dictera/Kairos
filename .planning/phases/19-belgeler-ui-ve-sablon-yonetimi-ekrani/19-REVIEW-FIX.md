---
status: partial
phase: 19-belgeler-ui-ve-sablon-yonetimi-ekrani
padded_phase: "19"
findings_in_scope: 7
fixed: 4
skipped: 3
iteration: 1
---

# Phase 19 Code Review Fix Report

**Phase:** 19 — Belgeler UI ve Şablon Yönetimi Ekranı  
**Date:** 2026-04-22  
**Fix Scope:** all (--all flag)  

---

## Fix Summary

| Finding | Severity | File | Status |
|---------|----------|------|--------|
| WR-01: Missing React namespace import | warning | `belge-list.tsx` | **Fixed** |
| WR-02: variant="destructive" on AlertDialogAction | warning | `sablon-yonetimi-section.tsx` | **Fixed** |
| WR-03: Non-focusable TableRow with onClick | warning | `sablon-yonetimi-section.tsx` | **Fixed** |
| WR-04: `as number` type assertion hides schema drift | warning | `belge-list.tsx` | **Fixed** |
| IN-01: Explicit inline type for selected | info | `sablondan-uret.tsx` | Skipped |
| IN-02: Non-standard Button size variant | info | `sablon-yonetimi-section.tsx` | Skipped |
| IN-03: Tests verify structure not runtime behavior | info | `tests/*.test.ts` | Skipped |

**Fixed:** 4 of 7  
**Skipped:** 3 (info-level findings require refactoring or design changes)

---

## Fixed Findings

### WR-01: Missing `React` namespace import for `ElementType`

**File:** `components/belge/belge-list.tsx`

**Fix applied:**
- Changed `import { useMemo } from 'react'` → `import { useMemo, type ElementType } from 'react'`
- Changed `Record<string, React.ElementType>` → `Record<string, ElementType>`

### WR-02: `variant="destructive"` on `AlertDialogAction`

**File:** `components/ayarlar/sablon-yonetimi-section.tsx`

**Fix applied:**
- Removed `variant="destructive"` prop
- Added `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"` to match the pattern in `belge-list.tsx`

### WR-03: Non-focusable `TableRow` with `onClick` lacks keyboard accessibility

**File:** `components/ayarlar/sablon-yonetimi-section.tsx`

**Fix applied:**
- Added `tabIndex={0}` to make the row focusable
- Added `onKeyDown` handler for Enter and Space keys to trigger `setCatalogTarget(t)`

### WR-04: `as number` type assertion hides schema drift

**File:** `components/belge/belge-list.tsx`

**Fix applied:**
- Removed `as number` cast: `templateById.get(belge.sablon_id)` — the Map accepts `number | null` without assertion since `null` is handled by Map.get returning `undefined`

---

## Skipped Findings

### IN-01: Explicit inline type for `selected`

**File:** `components/belge/sablondan-uret.tsx`  
**Reason:** Requires investigation of TypeScript circular inference root cause. Needs refactoring of tRPC-generated types.

### IN-02: Non-standard Button size variant

**File:** `components/ayarlar/sablon-yonetimi-section.tsx`  
**Reason:** Requires verification of local Button component extension. May need design decision.

### IN-03: Tests verify structure not runtime behavior

**Files:** `tests/19-*.test.ts`  
**Reason:** Requires architectural change to add React Testing Library or Playwright tests. Not a quick fix.
