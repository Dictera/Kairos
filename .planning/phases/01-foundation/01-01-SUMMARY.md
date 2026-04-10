---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, typescript, tailwindcss, better-sqlite3, drizzle-orm, trpc, iron-session, zod, react-query]

# Dependency graph
requires: []
provides:
  - Next.js 15.5.15 App Router project scaffold with TypeScript strict mode
  - All Phase 1 npm dependencies installed and pinned
  - next.config.ts with serverExternalPackages: ['better-sqlite3']
  - tsconfig.json with strict: true and @/* path alias
  - .env.local with SESSION_PASSWORD, SESSION_COOKIE_NAME, APP_PASSWORD env vars
  - data/ and drizzle/ directories for SQLite and migrations
  - .gitignore excluding node_modules, .env.local, SQLite database files
affects: [01-02, 01-03, 01-04, 01-05, all-phases]

# Tech tracking
tech-stack:
  added:
    - next@15.5.15
    - react@19.1.0
    - react-dom@19.1.0
    - typescript@^5
    - better-sqlite3@12.8.0
    - drizzle-orm@0.45.2
    - drizzle-kit@0.31.10
    - "@trpc/server@11.16.0"
    - "@trpc/client@11.16.0"
    - "@trpc/tanstack-react-query@11.16.0"
    - "@tanstack/react-query@5.97.0"
    - superjson@2.2.6
    - iron-session@8.0.4
    - zod@3.24.0
    - tailwindcss@^3.4.19
    - postcss
    - autoprefixer
    - lucide-react
    - class-variance-authority
    - clsx
    - tailwind-merge
    - eslint + eslint-config-next@15.5.15
  patterns:
    - Manual project bootstrap (create-next-app refused non-empty dir; packages installed individually for version control)
    - Tailwind v3 explicit pin (shadcn/ui incompatible with v4)
    - tRPC @trpc/tanstack-react-query adapter (not legacy @trpc/react-query)

key-files:
  created:
    - package.json
    - next.config.ts
    - tsconfig.json
    - tailwind.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - .env.example
    - .gitignore
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
    - data/.gitkeep
    - drizzle/.gitkeep
  modified: []

key-decisions:
  - "Bootstrapped manually (not via create-next-app) because project dir was non-empty; packages installed individually to ensure exact version pinning"
  - "tailwindcss pinned to ^3 (not v4) — shadcn/ui requires Tailwind v3"
  - "next pinned to ^15.5.15 — npm latest now resolves to Next.js 16 which has breaking API changes"
  - "eslint-config-next@15.5.15 installed to match Next.js version"

patterns-established:
  - "Pattern 1: All environment secrets go in .env.local (gitignored); .env.example shows required keys with no real values"
  - "Pattern 2: data/ directory holds SQLite DB file (gitignored); drizzle/ holds migration SQL files"

requirements-completed: [FOUND-01]

# Metrics
duration: 7min
completed: 2026-04-11
---

# Phase 01 Plan 01: Project Scaffold + next.config.ts Summary

**Next.js 15.5.15 App Router project bootstrapped with all Phase 1 dependencies, serverExternalPackages: ['better-sqlite3'] configured, TypeScript strict mode enabled, and environment variable template created**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-10T23:03:22Z
- **Completed:** 2026-04-10T23:09:31Z
- **Tasks:** 2
- **Files modified:** 13 created, 0 modified

## Accomplishments
- All Phase 1 npm packages installed and pinned to exact versions (next@15.5.15, better-sqlite3@12.8.0, tRPC v11 suite, iron-session@8.0.4, tailwindcss@^3)
- next.config.ts with critical `serverExternalPackages: ['better-sqlite3']` setting (without this the native SQLite addon fails at runtime)
- TypeScript strict mode enabled; `npx tsc --noEmit` passes with zero errors
- data/ and drizzle/ directories created; .gitignore prevents accidental commit of SQLite DB and .env.local secrets

## Task Commits

Each task was committed atomically:

1. **Task 01-01-01: Initialize Next.js 15 project and install all Phase 1 dependencies** - `510c550` (feat)
2. **Task 01-01-02: Configure next.config.ts, tsconfig.json, .env.local, and .gitignore** - `4ab73bb` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `package.json` - All Phase 1 dependencies with pinned versions; db:generate, db:migrate, db:studio scripts
- `next.config.ts` - serverExternalPackages: ['better-sqlite3'] — critical for native SQLite addon
- `tsconfig.json` - strict: true, ES2017 target, @/* path alias for Next.js App Router
- `tailwind.config.ts` - Tailwind v3 config targeting app/ and components/ directories
- `postcss.config.mjs` - PostCSS with tailwindcss and autoprefixer plugins
- `eslint.config.mjs` - ESLint with next/core-web-vitals and next/typescript
- `.env.example` - Safe-to-commit template showing required env var names (no real values)
- `.gitignore` - Excludes node_modules, .env.local, data/db.sqlite (and WAL/SHM files)
- `app/layout.tsx` - Minimal root layout with Turkish locale metadata
- `app/page.tsx` - Placeholder home page
- `app/globals.css` - Tailwind base imports + CSS variables
- `data/.gitkeep` - Ensures data/ directory tracked by git (SQLite DB will live here)
- `drizzle/.gitkeep` - Ensures drizzle/ directory tracked by git (migrations will live here)

## Decisions Made
- Bootstrapped manually (not via create-next-app) because the project directory was non-empty (.claude/, .planning/ already existed) — create-next-app refuses to run in non-empty directories
- Tailwind CSS pinned to `^3` explicitly — shadcn/ui is incompatible with Tailwind v4
- Next.js pinned to `^15.5.15` — npm `latest` now resolves to Next.js 16 which has breaking API changes
- eslint-config-next@15.5.15 installed to match the pinned Next.js version

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual project bootstrap instead of create-next-app**
- **Found during:** Task 1 (Initialize Next.js 15 project)
- **Issue:** `create-next-app` refused to run in D:/sigorta-takip because the directory already contained `.claude/` and `.planning/` subdirectories
- **Fix:** Created package.json manually, then ran `npm install` for each dependency group individually to ensure exact version pinning. Created app/ directory structure, tsconfig.json, and other scaffold files manually (copying best practices from the generated scaffold to /tmp/next-scaffold for reference).
- **Files modified:** package.json (created manually), all scaffold files created directly
- **Verification:** `npx tsc --noEmit` passes with zero errors; all acceptance criteria checked via node assertions
- **Committed in:** 510c550 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — create-next-app refusal)
**Impact on plan:** Auto-fix was necessary to proceed. Manual bootstrap achieved identical outcome to create-next-app with additional benefit of precise version control.

## Issues Encountered
- create-next-app@15 refused to initialize in a non-empty directory. Resolved by scaffolding the project manually with individual npm install commands per dependency group.

## User Setup Required
Update `.env.local` with real values before running the application:
- `SESSION_PASSWORD` — replace with a random 32+ character secret key (iron-session requirement)
- `APP_PASSWORD` — replace with your desired login password for single-user auth
- `SESSION_COOKIE_NAME` — can keep default `sigorta-session` or customize

Run `npx tsc --noEmit` to verify TypeScript after any changes.

## Next Phase Readiness
- Project scaffold complete — ready for Phase 1 Plan 02 (SQLite + Drizzle ORM setup)
- All Phase 1 dependencies are installed and available
- Directory structure matches what subsequent plans expect (data/, drizzle/, app/)
- No blockers for 01-02 (SQLite connection + schema) or any other Phase 1 plan

## Self-Check: PASSED

- package.json: FOUND
- next.config.ts: FOUND (contains serverExternalPackages: ['better-sqlite3'])
- tsconfig.json: FOUND (strict: true, @/* path alias)
- .env.example: FOUND
- .gitignore: FOUND (data/db.sqlite and .env.local excluded)
- data/.gitkeep: FOUND
- drizzle/.gitkeep: FOUND
- 01-01-SUMMARY.md: FOUND
- Commit 510c550: VERIFIED (feat: initialize Next.js 15 project)
- Commit 4ab73bb: VERIFIED (feat: configure next.config.ts)
- Commit 0ddd925: VERIFIED (docs: complete plan metadata)

---
*Phase: 01-foundation*
*Completed: 2026-04-11*
