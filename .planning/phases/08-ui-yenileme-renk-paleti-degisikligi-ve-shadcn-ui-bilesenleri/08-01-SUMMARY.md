---
phase: 08-ui-yenileme-renk-paleti-degisikligi-ve-shadcn-ui-bilesenleri
plan: "01"
subsystem: ui-theme
tags: [css-tokens, tailwind, shadcn, palette, navy-orange]
dependency_graph:
  requires: []
  provides:
    - Navy + Turuncu oklch CSS tokens in globals.css
    - Dashboard layout consuming theme background token
  affects:
    - All shadcn/ui components (read from --primary, --background, --sidebar tokens)
    - app/(dashboard)/layout.tsx main content area
tech_stack:
  added: []
  patterns:
    - oklch color format for all CSS custom properties
    - CSS custom property token system via @layer base :root
key_files:
  created: []
  modified:
    - app/globals.css
    - app/(dashboard)/layout.tsx
decisions:
  - "Both @layer base :root and outer :root blocks updated to keep shadcn token cascade consistent"
  - ".dark block preserved unchanged — dark mode remains deferred per 08-CONTEXT.md"
  - "Pre-existing TypeScript errors in app-sidebar.tsx logged as deferred (scope: 08-02)"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 08 Plan 01: CSS Token Palette Replacement Summary

Navy + Turuncu oklch token paletini globals.css'te tanımladı; dashboard layout hardcoded bg-white'ı bg-background theme token ile değiştirdi.

## What Was Built

Two targeted file edits that propagate the entire Navy + Turuncu palette across the app via shadcn's CSS custom property system:

1. **globals.css token replacement** — Both `:root` blocks (inside `@layer base` and the outer block) updated with exact oklch values from the plan's palette reference table. Teal values completely removed.

2. **Dashboard layout background token** — `app/(dashboard)/layout.tsx` `<main>` element changed from `bg-white` to `bg-background text-foreground`, decoupling the layout shell from any hardcoded color.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace globals.css CSS tokens | `34f2bee` | `app/globals.css` |
| 2 | Replace dashboard layout bg-white | `270d5c2` | `app/(dashboard)/layout.tsx` |

## Key Token Values Committed

| Token | oklch | Hex equivalent |
|-------|-------|----------------|
| `--background` | `oklch(0.969 0.008 20)` | #FBF3F2 warm white |
| `--foreground` | `oklch(0.219 0.044 240)` | #032539 navy |
| `--primary` | `oklch(0.746 0.174 57)` | #FA991C orange |
| `--primary-foreground` | `oklch(0.219 0.044 240)` | #032539 navy |
| `--accent` | `oklch(0.527 0.089 230)` | #1C768F steel blue |
| `--sidebar` | `oklch(0.219 0.044 240)` | #032539 navy |
| `--sidebar-foreground` | `oklch(0.969 0.008 20)` | #FBF3F2 warm white |
| `--sidebar-accent` | `oklch(0.746 0.174 57 / 0.15)` | orange 15% alpha |
| `--sidebar-border` | `oklch(0.3 0.04 240)` | dark navy |
| `--ring` | `oklch(0.746 0.174 57)` | #FA991C orange |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written with one structural observation:

**Structural observation (not a deviation):** `app/globals.css` contained TWO `:root` blocks — one inside `@layer base` (lines 13-46, with legacy teal hex values) and one outside at the root level (lines 106-139, with shadcn defaults). Both were updated to the Navy + Turuncu palette to maintain consistency. The plan's instruction to "replace the `:root { ... }` block" was applied to both, as either one could override the other depending on CSS cascade order.

## Known Stubs

None — this plan only modifies CSS tokens and a single className. No data stubs.

## Threat Flags

None — CSS token and Tailwind class changes introduce no new network endpoints, auth paths, or trust boundary surface.

## Deferred Items

- **Pre-existing TypeScript errors in `components/app-sidebar.tsx`** (lines 106, 145): `Property 'render' does not exist` on SidebarMenuButton. These pre-date 08-01 and are out of scope. Logged in `deferred-items.md`. Expected to be resolved in 08-02 (app-sidebar.tsx hardcoded color cleanup).

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `app/globals.css` exists | FOUND |
| `app/(dashboard)/layout.tsx` exists | FOUND |
| `08-01-SUMMARY.md` exists | FOUND |
| Commit `34f2bee` exists | FOUND |
| Commit `270d5c2` exists | FOUND |
