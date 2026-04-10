---
phase: 01-foundation
plan: 05
subsystem: ui
tags: [shadcn, tailwind, trpc, react-query, sidebar, layout, next-app-router]

# Dependency graph
requires:
  - 01-04 (auth middleware and login route must exist before layout wiring)
  - 01-03 (lib/trpc/init.ts: AppRouter type used in TRPCProvider generic)
provides:
  - components/ui/sidebar.tsx: shadcn v4 Sidebar component suite
  - components/ui/button.tsx: shadcn v4 Button component
  - components/ui/input.tsx: shadcn v4 Input component
  - components/ui/label.tsx: shadcn v4 Label component
  - components/ui/separator.tsx: shadcn v4 Separator component
  - components/ui/tooltip.tsx: shadcn v4 Tooltip component
  - components/ui/sheet.tsx: shadcn v4 Sheet (mobile sidebar drawer)
  - components/app-sidebar.tsx: AppSidebar with 9 nav links, teal theme, collapsible icon rail
  - components/providers.tsx: client boundary wrapping TRPCProvider + QueryClientProvider
  - lib/trpc/context.ts: createTRPCContext<AppRouter>() exports TRPCProvider + useTRPC
  - app/layout.tsx: root layout with Inter font, lang=tr, Providers wrapper
  - app/(dashboard)/layout.tsx: dashboard shell with SidebarProvider + AppSidebar
  - app/(auth)/layout.tsx: auth shell (no sidebar)
  - app/(auth)/login/page.tsx: login page (moved from app/login/)
  - app/(dashboard)/page.tsx + 8 other placeholder pages
affects: [all-phases, phase-02, phase-03]

# Tech tracking
tech-stack:
  added:
    - shadcn v4 (base-nova style, @base-ui/react components)
    - tailwindcss v4 + @tailwindcss/postcss (upgraded from v3 — shadcn v4 requires v4)
    - tw-animate-css v1.4.0 (shadcn v4 animation dependency)
    - @base-ui/react v1.3.0 (shadcn v4 component primitives, replaces Radix UI)
  patterns:
    - "shadcn v4 with Tailwind v4: globals.css uses @import tailwindcss + @import shadcn/tailwind.css"
    - "tRPC v11 context pattern: createTRPCContext<AppRouter>() in lib/trpc/context.ts, imports TRPCProvider from there"
    - "Route groups for layout isolation: (dashboard) gets sidebar, (auth) does not"
    - "Sidebar CSS variables: --sidebar set to #134e4a directly in globals.css :root"
    - "SidebarMenuButton render prop: shadcn v4 uses render= instead of asChild for Link integration"

key-files:
  created:
    - components/app-sidebar.tsx
    - components/providers.tsx
    - components/ui/sidebar.tsx
    - components/ui/button.tsx
    - components/ui/input.tsx
    - components/ui/label.tsx
    - components/ui/separator.tsx
    - components/ui/tooltip.tsx
    - components/ui/sheet.tsx
    - components/ui/skeleton.tsx
    - hooks/use-mobile.ts
    - lib/trpc/context.ts
    - lib/utils.ts
    - app/(dashboard)/layout.tsx
    - app/(dashboard)/page.tsx
    - app/(dashboard)/dosyalar/page.tsx
    - app/(dashboard)/muvekkiller/page.tsx
    - app/(dashboard)/takvim/page.tsx
    - app/(dashboard)/belgeler/page.tsx
    - app/(dashboard)/finans/page.tsx
    - app/(dashboard)/dilekçeler/page.tsx
    - app/(dashboard)/raporlar/page.tsx
    - app/(dashboard)/ayarlar/page.tsx
    - app/(auth)/layout.tsx
    - app/(auth)/login/page.tsx
  modified:
    - app/layout.tsx (root layout — now just Providers wrapper; sidebar moved to dashboard layout)
    - app/globals.css (Tailwind v4 syntax, teal sidebar CSS variables)
    - postcss.config.mjs (switched from tailwindcss to @tailwindcss/postcss)
    - package.json (tailwindcss ^4.2.2, @tailwindcss/postcss, @base-ui/react, tw-animate-css)

key-decisions:
  - "shadcn v4 installed (not v2) — uses @base-ui/react instead of Radix UI; requires Tailwind v4"
  - "Tailwind upgraded from v3 to v4 — shadcn v4 generates @theme/@custom-variant syntax incompatible with v3"
  - "tRPC v11 TRPCProvider: not directly exported from @trpc/tanstack-react-query; must call createTRPCContext<AppRouter>() to get it"
  - "lib/trpc/context.ts created as intermediate module: createTRPCContext<AppRouter>() exports TRPCProvider + useTRPC + useTRPCClient"
  - "Route groups used for layout isolation: (dashboard) gets sidebar+SidebarProvider, (auth) gets no-sidebar passthrough"
  - "Sidebar CSS variable --sidebar set to #134e4a in globals.css :root (not via tailwind.config.ts)"
  - "SidebarMenuButton uses render= prop (not asChild) for Next.js Link integration — shadcn v4/@base-ui API"

requirements-completed: [FOUND-06]

# Metrics
duration: ~25min
completed: 2026-04-11
---

# Phase 01 Plan 05: Base Layout + shadcn/ui Summary

**shadcn v4 initialized with teal theme, collapsible icon-rail sidebar (9 nav links), TRPCProvider+QueryClientProvider client boundary, route-group layout isolation for login page, and 9 placeholder dashboard pages — full Phase 1 skeleton complete**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-11T00:00:00Z
- **Completed:** 2026-04-11
- **Tasks:** 2
- **Files modified:** 4 modified, 25 created, 2 deleted (old app/page.tsx + app/login/page.tsx)

## Accomplishments

- Installed shadcn v4 (`npx shadcn@latest init --defaults`) + upgraded Tailwind to v4 (required by shadcn v4)
- Created `components/app-sidebar.tsx`: full collapsible sidebar with 9 nav links in D-02 order, teal palette (#134e4a/#14b8a6/#f0fdfa/#99f6e4), localStorage persistence, `collapsible="icon"` icon-only rail
- Created `lib/trpc/context.ts` + `components/providers.tsx`: client boundary with TRPCProvider (createTRPCContext pattern from tRPC v11) + QueryClientProvider
- Route group layout isolation: `(dashboard)` layout has SidebarProvider+AppSidebar; `(auth)` layout is passthrough — login page `/login` has no sidebar
- 9 placeholder pages created: Dashboard, Dosyalar, Müvekkiller, Takvim, Belgeler, Finans, Dilekçeler, Raporlar, Ayarlar — all behind auth middleware
- `npm run build` exits 0 (14 routes), `npx tsc --noEmit` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 01-05-01: Initialize shadcn/ui and create Providers + AppSidebar** - `fdf75a2` (feat)
2. **Task 01-05-02: Create root layout and all 9 placeholder route pages** - `a28e54e` (feat)

## Files Created/Modified

- `components/app-sidebar.tsx` - AppSidebar: collapsible="icon", 9 nav links D-02 order, teal theme, usePathname active state, localStorage collapse persistence
- `components/providers.tsx` - Client boundary: TRPCProvider (from lib/trpc/context) + QueryClientProvider; httpBatchLink to /api/trpc
- `lib/trpc/context.ts` - createTRPCContext<AppRouter>() — exports TRPCProvider, useTRPC, useTRPCClient for use throughout the app
- `lib/utils.ts` - cn() utility (clsx + tailwind-merge) from shadcn init
- `components/ui/sidebar.tsx` - Full shadcn v4 sidebar suite (SidebarProvider, Sidebar, SidebarMenu, SidebarMenuButton, etc.)
- `components/ui/button.tsx` - shadcn v4 Button (@base-ui/react)
- `components/ui/input.tsx, label.tsx, separator.tsx, tooltip.tsx, sheet.tsx, skeleton.tsx` - shadcn v4 components
- `hooks/use-mobile.ts` - useIsMobile hook (used by sidebar for mobile Sheet mode)
- `app/layout.tsx` - Root layout: Inter font, lang=tr, Providers wrapper only (no sidebar here)
- `app/(dashboard)/layout.tsx` - Dashboard shell: SidebarProvider + AppSidebar + main content
- `app/(auth)/layout.tsx` - Auth shell: passthrough (no sidebar for login)
- `app/(auth)/login/page.tsx` - Login page moved from app/login/page.tsx (no sidebar in (auth) group)
- `app/(dashboard)/page.tsx` through `app/(dashboard)/ayarlar/page.tsx` - 9 placeholder pages
- `app/globals.css` - Tailwind v4 syntax: @import tailwindcss + @import shadcn/tailwind.css; teal sidebar CSS variables
- `postcss.config.mjs` - Updated to use @tailwindcss/postcss plugin (Tailwind v4 requirement)

## Decisions Made

- Tailwind CSS upgraded from v3 to v4: shadcn v4 (installed as `shadcn@latest`) generates globals.css using `@theme`, `@custom-variant`, and `@apply border-border` syntax that only works with Tailwind v4. Upgrading to v4 was the correct fix — the previous Tailwind v3 pin was based on shadcn v2 requirements from the research phase.
- `lib/trpc/context.ts` created as intermediate module: tRPC v11's `@trpc/tanstack-react-query` does not directly export `TRPCProvider`. Instead, `createTRPCContext<AppRouter>()` must be called once at module level, and it returns `{ TRPCProvider, useTRPC, useTRPCClient }`. This file is the single source of truth for all tRPC client hooks.
- Route groups used for sidebar isolation: `app/(dashboard)/layout.tsx` has SidebarProvider+AppSidebar; `app/(auth)/layout.tsx` is a passthrough. This is cleaner than conditional pathname checking in the root layout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded Tailwind CSS from v3 to v4**
- **Found during:** Task 01-05-01 (shadcn init)
- **Issue:** `npx shadcn@latest init` installed shadcn v4 which generates globals.css using Tailwind v4 syntax (`@import "shadcn/tailwind.css"`, `@apply border-border`, `@theme inline`, `@custom-variant`). These are incompatible with Tailwind v3. Build failed with "Cannot apply unknown utility class border-border".
- **Fix:** `npm install tailwindcss@latest @tailwindcss/postcss`; updated postcss.config.mjs to use `@tailwindcss/postcss`; rewrote globals.css to use `@import "tailwindcss"` (v4 syntax); set teal sidebar CSS variables in `:root`
- **Files modified:** package.json, package-lock.json, postcss.config.mjs, app/globals.css
- **Verification:** `npm run build` exits 0 after fix
- **Committed in:** fdf75a2 (Task 01-05-01 commit)

**2. [Rule 1 - Bug] Fixed TRPCProvider import path for tRPC v11**
- **Found during:** Task 01-05-01 (providers.tsx creation)
- **Issue:** Plan specified `import { TRPCProvider } from '@trpc/tanstack-react-query'` but tRPC v11 does not export `TRPCProvider` directly from that package. `npx tsc --noEmit` reported "Module has no exported member TRPCProvider".
- **Fix:** Created `lib/trpc/context.ts` that calls `createTRPCContext<AppRouter>()` and exports the result. `providers.tsx` now imports `TRPCProvider` from `@/lib/trpc/context`.
- **Files modified:** lib/trpc/context.ts (new), components/providers.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** fdf75a2 (Task 01-05-01 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes essential. Tailwind v4 upgrade required by shadcn v4; tRPC context fix required by tRPC v11 API. Neither adds scope beyond the plan's intent.

## Issues Encountered

- shadcn v4 installed (not v2/v3 which the research phase documented) — the `shadcn@latest` npm tag now resolves to v4. This caused two cascading issues: Tailwind v3 incompatibility and @base-ui/react component primitives (not Radix UI). Both were handled automatically.
- The `tailwind.config.ts` file is still present but is largely unused by Tailwind v4 (which reads config from CSS). This is not an issue — the file is harmless and `components.json` references it.

## Known Stubs

All 8 dashboard sub-pages (dosyalar, muvekkiller, takvim, belgeler, finans, dilekçeler, raporlar, ayarlar) are intentional stubs with a single `<h1>` heading. These are placeholder pages per the plan spec — real content will be built in Phase 2+. The dashboard `page.tsx` is also a stub.

These stubs do NOT prevent this plan's goal (Phase 1 skeleton) from being achieved. All routes are accessible post-authentication and the sidebar wires correctly to each.

## Threat Surface Check

No new network endpoints introduced. All new files are UI components and page layouts. The `(dashboard)` route group is covered by the existing `middleware.ts` auth guard — no special auth exemption needed for placeholder pages (as noted in the threat model). No threat flags.

## Next Phase Readiness

- Full Phase 1 skeleton is live: authenticated users see sidebar with 9 nav links; unauthenticated users redirected to /login
- All shadcn UI primitives installed and ready for Phase 2 feature development
- `lib/trpc/context.ts` exports `useTRPC` and `useTRPCClient` for future tRPC query hooks
- `npm run build` exits 0, `npx tsc --noEmit` exits 0 — clean base for Phase 2

## Self-Check: PASSED

- components/ui/sidebar.tsx: FOUND
- components/app-sidebar.tsx: FOUND (contains collapsible="icon", all 9 nav items, sidebar_collapsed, #134e4a)
- components/providers.tsx: FOUND (contains 'use client', TRPCProvider, QueryClientProvider, /api/trpc)
- lib/trpc/context.ts: FOUND (contains createTRPCContext<AppRouter>)
- app/(dashboard)/layout.tsx: FOUND (contains SidebarProvider + AppSidebar)
- app/(auth)/login/page.tsx: FOUND (login page without sidebar)
- All 9 placeholder pages: FOUND
- Commit fdf75a2: VERIFIED (feat(01-05): initialize shadcn/ui and create Providers + AppSidebar)
- Commit a28e54e: VERIFIED (feat(01-05): create root layout and all 9 placeholder route pages)
- npm run build: PASSED (14 routes, exit 0)
- npx tsc --noEmit: PASSED (zero errors)

---
*Phase: 01-foundation*
*Completed: 2026-04-11*
