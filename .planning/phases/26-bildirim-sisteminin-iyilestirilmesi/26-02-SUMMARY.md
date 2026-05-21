---
phase: 26-bildirim-sisteminin-iyilestirilmesi
plan: "02"
subsystem: telegram
tags: [telegram, notifications, toggles, trpc, settings, refactor]

# Dependency graph
requires:
  - phase: 26-bildirim-sisteminin-iyilestirilmesi
    plan: "01"
    provides: "lib/telegram/settings-helper.ts with exported readSettings/writeSettings"
provides:
  - "lib/trpc/routers/telegram.ts with getToggles + updateToggles procedures"
  - "telegram.ts migrated from inline settings helpers to shared settings-helper import"
affects:
  - 26-03-ui-toggles

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "togglesSchema: z.object({ ...3x z.boolean() }) — rejects non-boolean values at tRPC boundary"
    - "getToggles ?? true default: (settings.key as boolean | undefined) ?? true — NOT || true"
    - "Object.assign merge: preserves unrelated settings.json keys while writing only validated toggles"
    - "protectedProcedure on all toggle procedures — unauthenticated callers receive 401"

key-files:
  created: []
  modified:
    - lib/trpc/routers/telegram.ts

key-decisions:
  - "Inline readSettings/writeSettings removed from telegram.ts — shared settings-helper used instead (DRY, atomic rename now consistent across all callers)"
  - "togglesSchema defined as module-level const above router — mirrors timeSchema placement pattern"
  - "updateToggles uses Object.assign to merge only 3 validated keys — preserves belgelerPath, telegram_bildirim_saatleri, etc."
  - "No try/catch in getToggles or updateToggles — matches getSchedule pattern; settings-helper handles read errors silently; write errors surface as tRPC 500"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-05-21
---

# Phase 26 Plan 02: API Layer — getToggles + updateToggles tRPC Procedures

**getToggles and updateToggles added to telegramRouter; telegram.ts migrated from inline settings helpers to shared settings-helper; BLD-08 GREEN; all 317 tests pass**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-21T13:00:00Z
- **Completed:** 2026-05-21T13:10:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Migrated `lib/trpc/routers/telegram.ts` from inline `SETTINGS_PATH`/`readSettings`/`writeSettings` declarations to `import { readSettings, writeSettings } from '@/lib/telegram/settings-helper'`
- Removed direct `fs` and `path` imports from telegram.ts (no longer needed after migration)
- Added `togglesSchema` const with 3 `z.boolean()` fields (T-26-02-01: input validation)
- Added `getToggles` protectedProcedure: reads 3 toggle states with `?? true` defaults (never `|| true`)
- Added `updateToggles` protectedProcedure: validates via togglesSchema, uses Object.assign to preserve all other settings.json keys
- BLD-08 GREEN: both `telegramRouter._def.record.getToggles` and `telegramRouter._def.record.updateToggles` exist
- Full suite: 317 tests pass (up from 315 in Wave 1 — BLD-08's 2 new tests now GREEN)
- pnpm typecheck: 0 errors

## Task Commits

1. **Task 1: Add getToggles + updateToggles; migrate to shared settings-helper** — `c580e7a` (feat)

## Files Created/Modified

- `lib/trpc/routers/telegram.ts` — MODIFIED: inline helpers removed, shared import added, togglesSchema + 2 new procedures added

## Decisions Made

- Inline `readSettings`/`writeSettings` removed from telegram.ts — Wave 1 created the shared helper specifically for this migration; DRY + atomic rename now consistent across all 4 callers
- `togglesSchema` placed at module level above the router declaration, mirroring `timeSchema` placement pattern
- `updateToggles` uses `Object.assign(settings, input)` — merges only the 3 validated boolean keys, preserving all other settings.json keys (`belgelerPath`, `telegram_bildirim_saatleri`, etc.) unchanged (T-26-02-03: accept disposition)
- No try/catch in either procedure — matches existing `getSchedule` pattern; settings-helper handles read errors silently; write errors (rare) surface as tRPC 500

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all implemented functionality is fully wired. Wave 3 (Plan 26-03) will add the UI Switch toggles that call these endpoints.

## Threat Flags

No new security-relevant surface beyond what is already in the plan's threat model. All threat mitigations confirmed in place:
- T-26-02-01: Zod `z.boolean()` validation on all 3 input fields in togglesSchema
- T-26-02-02: Both getToggles and updateToggles use `protectedProcedure`
- T-26-02-03: Object.assign preserves unrelated settings.json keys — only 3 validated booleans written

## Self-Check: PASSED

- `lib/trpc/routers/telegram.ts` modified: CONFIRMED
- Commit c580e7a: FOUND in git log
- `grep "function readSettings" lib/trpc/routers/telegram.ts` — 0 matches (inline removed): CONFIRMED
- `grep "from '@/lib/telegram/settings-helper'" lib/trpc/routers/telegram.ts` — 1 match: CONFIRMED
- `grep "getToggles" lib/trpc/routers/telegram.ts` — present: CONFIRMED
- `grep "updateToggles" lib/trpc/routers/telegram.ts` — present: CONFIRMED
- BLD-08 GREEN: 10/10 BLD tests pass
- Full suite: 317 passed, 0 failed
- pnpm typecheck: 0 errors
