# Deferred Items — Phase 08

## Pre-existing TypeScript Errors (Out of Scope for 08-01)

**File:** `components/app-sidebar.tsx`

**Errors:**
- Line 106: `Property 'render' does not exist on type` — SidebarMenuButton prop type mismatch
- Line 145: Same error on second SidebarMenuButton usage

**Context:** These errors existed before 08-01 changes. They are not caused by the globals.css or layout.tsx edits. Plan 08-02 covers `components/app-sidebar.tsx` updates (D-05) and should fix these as part of the hardcoded teal color removal.

**Discovered during:** Task 2 (`npx tsc --noEmit`)
**Scope:** 08-02-PLAN.md (app-sidebar.tsx changes)
