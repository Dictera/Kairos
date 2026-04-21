---
phase: 17-pdf-uretim-motoru
plan: 02
subsystem: pdf
tags: [zod, typescript, vitest, ipc, docx, sidecar]

# Dependency graph
requires:
  - phase: 17-pdf-uretim-motoru
    provides: "Sidecar health-check infrastructure and CommandEnvelope protocol"
provides:
  - "Zod schemas for render and convert command params"
  - "Timeout-aware sidecar runner with per-command override"
  - "Flat variable registry array mapping all known template variables to tabs and Turkish labels"
  - "Missing-variable pre-check with deep-link tab info"
affects:
  - "17-03 (pdfRouter — consumes schemas and registry)"
  - "17-04 (archive — consumes timeout-aware runner)"
  - "Any UI component that displays missing-variable warnings with tab deep-links"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Flat variable registry array: simple .find() lookup instead of nested maps"
    - "Dot-notation path resolver with optional array indexing (arr[0].x)"
    - "TDD with co-located tests in lib/**/__tests__/"

key-files:
  created:
    - lib/docx/variable-registry.ts
    - lib/docx/__tests__/variable-registry.test.ts
  modified:
    - lib/pipeline/protocol.ts
    - lib/services/docx-pipeline.ts
    - vitest.config.ts

key-decisions:
  - "Extended vitest.config.ts include pattern to lib/**/__tests__/**/*.test.ts so co-located unit tests are discovered alongside tests/ integration tests"

patterns-established:
  - "Variable registry as flat VariableInfo[]: lookup is O(n) but source-of-truth is trivial to maintain and audit"
  - "Missing-variable fallback: unknown vars map to tab: 'genel' and label: varPath — graceful degradation, no hard errors"

requirements-completed: [PDF-10]

# Metrics
duration: 6min
completed: 2026-04-21
---

# Phase 17 Plan 02: IPC Protocol + Variable Registry Summary

**Type-safe Zod schemas for render/convert commands, per-command timeout overrides in sidecar runner, and a comprehensive variable registry with missing-variable pre-check and tab deep-links**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-21T20:35:19Z
- **Completed:** 2026-04-21T20:41:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Extended `lib/pipeline/protocol.ts` with `RenderParamsSchema` and `ConvertParamsSchema` for type-safe command params
- Made `runSidecarCommand` timeout-configurable while preserving the 30s default
- Built `lib/docx/variable-registry.ts` covering all known template variable paths across muvekkil, dosya, taraf, stk, mahkeme, durusmalar, sureler, finans_kalemleri, and notlar
- Implemented `getNestedValue` with dot-notation and array-index resolution
- Implemented `getMissingVariables` that returns structured missing-variable data with tab slug and Turkish label for UI deep-links
- Added 13 Vitest tests covering happy path, missing values, null/empty detection, unknown-variable fallback, and registry metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend protocol and pipeline for render/convert** — `1b625fb` (feat)
2. **Task 2 RED: Add failing tests for variable registry** — `212044c` (test)
3. **Task 2 GREEN: Implement variable registry** — `d5e80e9` (feat)

**Plan metadata:** `TBD` (docs: complete plan)

## Files Created/Modified

- `lib/pipeline/protocol.ts` — Added `RenderParamsSchema`, `ConvertParamsSchema`, and their inferred types
- `lib/services/docx-pipeline.ts` — Added optional `timeout` parameter to `runSidecarCommand`; replaced hardcoded `30_000` with `timeout ?? 30_000`
- `lib/docx/variable-registry.ts` — New: `VariableInfo` interface, `VARIABLE_REGISTRY`, `getNestedValue`, `getMissingVariables`
- `lib/docx/__tests__/variable-registry.test.ts` — New: 13 Vitest tests for registry and pre-check logic
- `vitest.config.ts` — Added `lib/**/__tests__/**/*.test.ts` to `include` pattern

## Decisions Made

- Updated `vitest.config.ts` to discover co-located tests in `lib/**/__tests__/` so the planned test file would be picked up by `npm test` without requiring a custom path argument.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated vitest.config.ts include pattern**
- **Found during:** Task 2 (writing variable-registry tests)
- **Issue:** The project's `vitest.config.ts` only included `tests/**/*.test.ts`. The planned test file at `lib/docx/__tests__/variable-registry.test.ts` was not discoverable, causing `npm test` to exit with "No test files found."
- **Fix:** Added `lib/**/__tests__/**/*.test.ts` to the `include` array in `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npm test -- lib/docx/__tests__/variable-registry.test.ts` passes; full suite `npm test` passes (28 files, 216 tests)
- **Committed in:** `212044c` (Task 2 RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary configuration fix to enable planned test discovery. No scope creep.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `pdfRouter` (Plan 03) can now import `RenderParamsSchema`, `ConvertParamsSchema`, `runSidecarCommand`, and `getMissingVariables`
- `getMissingVariables` output format (`{ var, tab, label }`) is ready for UI consumption with tab deep-links
- No blockers for Plan 03

---
*Phase: 17-pdf-uretim-motoru*
*Completed: 2026-04-21*
