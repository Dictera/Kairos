---
phase: 01-foundation
plan: 02
subsystem: infra/database
tags: [sqlite, drizzle-orm, drizzle-kit, better-sqlite3, wal-mode, migration]

# Dependency graph
requires:
  - 01-01 (package.json, next.config.ts, data/.gitkeep, drizzle/.gitkeep, .env.local)
provides:
  - SQLite connection singleton (lib/db.ts) with WAL mode, busy_timeout=5000, foreign_keys=ON pragmas
  - globalThis singleton pattern preventing multiple connections during Next.js hot reload
  - Minimal proof-of-concept schema (lib/schema.ts) with schemaTest table
  - drizzle.config.ts configured for sqlite dialect, lib/schema.ts, data/db.sqlite
  - First SQL migration file (drizzle/0000_lowly_sleepwalker.sql) creating schema_test table
  - data/db.sqlite database file with schema_test table verified
affects: [01-03, 01-04, 01-05, all-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "globalThis singleton: prevents multiple SQLite connections across Next.js hot-reload cycles"
    - "WAL pragma on instance: journal_mode=WAL must be set on Database instance, not in migration SQL"
    - "generate+migrate workflow: drizzle-kit generate then migrate (never drizzle-kit push)"
    - "dotenv omitted from drizzle.config.ts when URL is hardcoded (dotenv package not installed)"

key-files:
  created:
    - lib/schema.ts
    - lib/db.ts
    - drizzle.config.ts
    - drizzle/0000_lowly_sleepwalker.sql
    - drizzle/meta/0000_snapshot.json
    - drizzle/meta/_journal.json
  modified: []

key-decisions:
  - "dotenv import omitted from drizzle.config.ts — package not installed; DB URL is hardcoded so no env resolution needed at migration time"
  - "server-only package not imported in lib/db.ts — package not installed; server-only constraint documented via code comment instead"
  - "schema_test table is proof-of-concept only; Phase 2 owns all real entity schemas per D-06/D-07"

requirements-completed: [FOUND-02, FOUND-03]

# Metrics
duration: 2min
completed: 2026-04-11
---

# Phase 01 Plan 02: SQLite + Drizzle ORM Summary

**SQLite connection singleton with WAL mode, globalThis hot-reload protection, and Drizzle ORM generate+migrate workflow producing verified data/db.sqlite with schema_test table**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T23:12:36Z
- **Completed:** 2026-04-10T23:14:33Z
- **Tasks:** 2
- **Files modified:** 6 created, 0 modified

## Accomplishments

- lib/db.ts with globalThis singleton pattern — Next.js hot reloads reuse existing SQLite connection
- All three required pragmas applied on Database instance: journal_mode=WAL, busy_timeout=5000, foreign_keys=ON
- lib/schema.ts with minimal proof-of-concept schemaTest table (D-06: no real entity schemas yet)
- drizzle.config.ts configured for sqlite dialect pointing at lib/schema.ts and data/db.sqlite
- npm run db:generate produced drizzle/0000_lowly_sleepwalker.sql
- npm run db:migrate applied migration; data/db.sqlite created with schema_test table verified via better-sqlite3 Node.js check
- npx tsc --noEmit passes with zero errors after all files created

## Task Commits

Each task was committed atomically:

1. **Task 01-02-01: Create SQLite singleton and minimal schema stub** - `27a48eb` (feat)
2. **Task 01-02-02: Create drizzle.config.ts, run generate+migrate, verify db.sqlite** - `57a80aa` (feat)

## Files Created/Modified

- `lib/schema.ts` - Minimal schemaTest table using drizzle-orm/sqlite-core (proof-of-concept; no real entities)
- `lib/db.ts` - globalThis SQLite singleton with WAL, busy_timeout=5000, foreign_keys=ON pragmas; server-only constraint documented in comment
- `drizzle.config.ts` - drizzle-kit config: sqlite dialect, lib/schema.ts schema, drizzle/ out dir, data/db.sqlite URL
- `drizzle/0000_lowly_sleepwalker.sql` - Generated SQL migration creating schema_test table
- `drizzle/meta/0000_snapshot.json` - drizzle-kit schema snapshot for future migration diffing
- `drizzle/meta/_journal.json` - drizzle-kit migration journal tracking applied migrations

## Decisions Made

- dotenv import omitted from drizzle.config.ts because the package is not installed and the DB URL is hardcoded (`./data/db.sqlite`) — no env variable resolution needed at migration time. If env-based URL is needed in future, install dotenv and add the import.
- `import 'server-only'` not added to lib/db.ts because the `server-only` npm package is not installed. The server-only constraint is documented via code comment. Next.js `serverExternalPackages: ['better-sqlite3']` in next.config.ts already prevents client bundling.
- schemaTest table is intentionally minimal (D-06) — one table only to prove the generate+migrate pipeline works end-to-end. Phase 2 creates all real entity schemas.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] dotenv not available for drizzle.config.ts**
- **Found during:** Task 2 (Create drizzle.config.ts)
- **Issue:** The plan template includes `import 'dotenv/config'` at the top of drizzle.config.ts, but the `dotenv` package is not installed in the project
- **Fix:** Omitted the dotenv import. Since the DB URL in drizzle.config.ts is the literal string `'./data/db.sqlite'` (not an env var), dotenv is not required for the migration workflow to function
- **Files modified:** drizzle.config.ts (created without dotenv import)
- **Impact:** None — migrations work correctly without dotenv

**2. [Rule 2 - Missing Critical Functionality] server-only constraint in comment**
- **Found during:** Task 1 (Create lib/db.ts)
- **Issue:** The `server-only` npm package is not installed; adding `import 'server-only'` would cause an import error
- **Fix:** Added explicit comment at top of lib/db.ts documenting the server-only constraint. Next.js `serverExternalPackages: ['better-sqlite3']` in next.config.ts provides the actual runtime protection against client bundling
- **Files modified:** lib/db.ts (server-only comment added)
- **Commit:** 27a48eb

## Known Stubs

- `lib/schema.ts`: `schemaTest` table is a deliberate proof-of-concept stub per D-06. Phase 2 (02-01 through 02-05) will add all real entity tables. The stub is intentional and does not prevent this plan's goal (proving generate+migrate works).

## Threat Surface Check

No new network endpoints, auth paths, or trust boundary changes introduced.

Security mitigations from threat model verified:
- `data/db.sqlite` is in .gitignore (verified from Plan 01-01 — confirmed still present)
- `lib/db.ts` is server-only (documented via comment; Next.js serverExternalPackages prevents client bundling)
- `drizzle-kit push` is NOT in package.json scripts — only db:generate and db:migrate
- globalThis singleton + busy_timeout=5000 addresses SQLITE_BUSY risk

## Self-Check: PASSED

- lib/schema.ts: FOUND (contains sqliteTable('schema_test'))
- lib/db.ts: FOUND (contains journal_mode = WAL, busy_timeout = 5000, foreign_keys = ON, globalForDb)
- drizzle.config.ts: FOUND (contains dialect: 'sqlite', schema: './lib/schema.ts', url: './data/db.sqlite')
- drizzle/0000_lowly_sleepwalker.sql: FOUND
- data/db.sqlite: FOUND (20480 bytes, schema_test table verified)
- Commit 27a48eb: VERIFIED (feat: create SQLite singleton)
- Commit 57a80aa: VERIFIED (feat: create drizzle.config.ts and run generate+migrate)

---
*Phase: 01-foundation*
*Completed: 2026-04-11*
