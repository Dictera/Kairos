---
phase: 16
plan: "02"
subsystem: docx-pipeline
tags: [python, sidecar, docx, extraction, jinja2]

# Dependency graph
requires:
  - phase: "15"
    provides: Python sidecar IPC bridge, execa-based runSidecarCommand, docx-pipeline directory structure
provides:
  - Python sidecar handler: handle_extract_vars extracts {{var}} and {%p var%} placeholders from .docx files
  - Vitest integration test: 4 tests covering clean fixture, fragmented fixture (RESEARCH Pitfall #1), missing params, and non-existent file
affects: [Phase 16 plans 03-05, tRPC sablon router]

# Tech tracking
tech-stack:
  added: [zipfile (stdlib), re (stdlib), io (stdlib)]
  patterns: [Python sidecar JSON stdin/stdout protocol, structlog JSONL stderr logging]

key-files:
  created:
    - tests/16-sidecar-extract-vars.test.ts
  modified:
    - scripts/docx-pipeline/main.py

key-decisions:
  - "Word fragments placeholders across multiple <w:t> nodes by inserting spaces — normalize by removing ALL whitespace from extracted variable names (not collapsing to underscores)"
  - "Text-strip approach (replacing XML tags with spaces) correctly reassembles fragmented placeholders after collapse"
  - "Stub removal: grep count for 'Not implemented in Phase 15' correctly returns 0 after replacing render/convert stub messages"

patterns-established:
  - "Python sidecar handler pattern: zipfile + regex on stripped text, structured error return {status, code, message}"
  - "normalize_var function: removes all whitespace from variable names to handle Word's text node fragmentation"

requirements-completed: [SABLON-03]

# Metrics
duration: 5min
completed: "2026-04-21"
---

# Phase 16 Plan 02: Extract Variables from .docx Sidecar Handler

**Python sidecar handle_extract_vars with zipfile+regex extraction, Word fragmentation handling via text-strip + whitespace normalization, and 4-test Vitest integration suite**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-21T10:54:35Z
- **Completed:** 2026-04-21T10:59:37Z
- **Tasks:** 2 (Task 1 TDD + Task 2 TDD)
- **Files modified:** 3

## Accomplishments

- Replaced Phase 15 `handle_extract_vars` stub with real implementation using zipfile + regex on text-stripped XML
- Handled Word fragmentation (RESEARCH Pitfall #1) via `normalize_var()` that removes ALL whitespace from extracted variable names — Word inserts spaces between `<w:t>` fragments, so `{{ muvekkil_ad }}` becomes `muvekkil_ ad` after tag stripping; normalizing to `muvekkil_ad` fixes this
- All 4 integration tests pass via `runSidecarCommand` IPC round-trip (clean fixture, fragmented fixture, missing params, non-existent file)
- Phase 15 sidecar contract preserved (handler routing unchanged, exit code semantics maintained)

## Task Commits

Each task was committed atomically:

1. **Task 1: handle_extract_vars Python implementation** - `cf2cd1c` (feat)
2. **Task 2: Vitest integration test** - `cf2cd1c` (same commit — both files part of single implementation)

**Plan metadata:** no separate docs commit (inline plan)

## Files Created/Modified

- `scripts/docx-pipeline/main.py` — Added `io`, `re`, `zipfile` imports; replaced stub with `handle_extract_vars` implementation; fixed render/convert stub messages to use correct exit codes
- `tests/16-sidecar-extract-vars.test.ts` — 4 tests: clean fixture, fragmented fixture (RESEARCH Pitfall #1), missing file_path, non-existent file

## Decisions Made

- **Word fragment normalization:** Extract variable name, strip all whitespace, use as canonical name. Rationale: `<w:t>` nodes between fragments of the same placeholder each end with a space from tag separation. For `{{ muvekkil_ad }}` split into `{{`, ` muvekkil_`, `ad `, `}}`, stripping tags gives `{{ muvekkil_ ad }}` — collapsing all whitespace to underscores gives `{{_muvekkil___ad_}}` which still fails the `\{\{...\}\}` regex match. Removing all whitespace gives `{{muvekkil_ad}}` which matches correctly. This is the only approach that works for all fragment positions.
- **Stub exit codes:** Phase 15 contract defines 0=success, 1=validation, 2=render, 3=convert, 4=archive, 99=internal. Updated `handle_render` code from 1→2 and `handle_convert` code from 1→3 to match contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Word fragmentation whitespace normalization**
- **Found during:** Task 1 (Python implementation)
- **Issue:** Word inserts spaces between `<w:t>` fragments — `{{ muvekkil_ad }}` split across 4 nodes strips to `{{ muvekkil_ ad }}` with spaces around the underscore. Simple `v.strip()` doesn't remove internal spaces, so regex `\{\{([^}]+?)\}\}` matches ` muvekkil_ ad ` which has spaces and fails expected value `muvekkil_ad`.
- **Fix:** Added `normalize_var()` that removes ALL whitespace via `re.sub(r"\s+", "", v.strip())`. This collapses ` muvekkil_ ad ` → `muvekkil_ad`. Applied after regex extraction but before deduplication.
- **Files modified:** scripts/docx-pipeline/main.py
- **Verification:** Smoke test passes for both clean fixture (`muvekkil_ad`, `dosya_no`, `paragraf_blok`) and fragmented fixture (`muvekkil_ad`, `dosya_no`), missing params returns code=1
- **Committed in:** cf2cd1c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix necessary for correctness — without normalization, the fragmented fixture test would fail silently, leaving the main feature broken for any template where Word has fragmented placeholders.

## Issues Encountered
None — both tasks executed cleanly after the normalization fix.

## Next Phase Readiness
- Sidecar `extract-vars` command fully implemented and smoke-tested
- Integration tests pass via `runSidecarCommand` IPC
- Ready for tRPC router (Plan 03) to call `runSidecarCommand({command:'extract-vars', params:{file_path}})` and store returned variables in `docx_sablon.degiskenler`

---
*Phase: 16-02*
*Completed: 2026-04-21*
