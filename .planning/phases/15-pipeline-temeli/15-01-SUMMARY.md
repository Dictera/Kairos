---
phase: 15-pipeline-temeli
plan: 01
subsystem: infra
tags: [python, subprocess, ipc, libreoffice, execa, trpc, health-check]

# Dependency graph
requires:
  - phase: []
    provides: []
provides:
  - Python sidecar with JSON stdin/stdout protocol (main.py entry point)
  - TypeScript pipeline module (config, protocol, error-codes, health-check, execa bridge)
  - tRPC pipeline router with healthCheck and status procedures
  - Platform-aware path detection for Python and LibreOffice
  - 5-minute TTL health check cache
  - Test infrastructure for all pipeline components
affects:
  - phase-16 (extract-vars handler implementation)
  - phase-17 (render handler + PDF production)
  - phase-18 (archive handler)

# Tech tracking
tech-stack:
  added: [execa, which, @types/which, pydantic>=2.0, docxtpl, jinja2, babel, python-slugify, structlog, tenacity]
  patterns:
    - JSON stdin/stdout IPC protocol with pydantic CommandEnvelope
    - Module-level singleton cache with TTL for health check
    - execa bridge with reject:false for exit code capture
    - Platform-aware path detection with env var override

key-files:
  created:
    - scripts/docx-pipeline/main.py — Python sidecar entry point
    - scripts/docx-pipeline/requirements.txt — pinned Python deps
    - scripts/docx-pipeline/setup-venv.ps1 — PowerShell venv setup
    - scripts/docx-pipeline/__test__/echo_sidecar.py — minimal mock
    - lib/pipeline/protocol.ts — IPC envelope types
    - lib/pipeline/error-codes.ts — exit code to Turkish message mapping
    - lib/pipeline/config.ts — platform-aware path detection
    - lib/pipeline/health-check.ts — health status with 5-min cache
    - lib/services/docx-pipeline.ts — execa bridge for sidecar
    - lib/trpc/routers/pipeline.ts — tRPC pipeline router
  modified:
    - lib/trpc/routers/_app.ts — registered pipelineRouter
    - package.json — added execa, which, @types/which
    - .env.example — added PYTHON_PATH, LIBREOFFICE_PATH

key-decisions:
  - "JSON stdin/stdout IPC over named pipes or socket — simpler debugging, works across platforms"
  - "5-minute cache TTL for health checks — avoids repeated sidecar spawns on page loads"
  - "reject:false on execa to capture exit codes 1-4 without throwing — enables proper error mapping"
  - "Venv python preferred over system python if .venv exists — isolated environment per D-11"

patterns-established:
  - "Module-level singleton pattern for health cache (same as db.ts singleton pattern)"
  - "Static vi.mock with object return for named exports"
  - "Health check runs both Python sidecar check AND LibreOffice binary check"

requirements-completed: [PIPE-01, PIPE-02, PIPE-05, PIPE-06, PIPE-07, PIPE-08, PIPE-09, PIPE-10]

# Metrics
duration: 21min
completed: 2026-04-20
---

# Phase 15 Plan 01: Pipeline Temeli Summary

**Python sidecar with JSON stdin/stdout IPC protocol, TypeScript config/protocol/error-codes/health-check module, and tRPC pipeline router**

## Performance

- **Duration:** 21 min
- **Started:** 2026-04-20T19:28:59Z
- **Completed:** 2026-04-20T19:50:00Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Python sidecar (`main.py`) with pydantic v2 CommandEnvelope parsing and structlog JSONL stderr
- TypeScript pipeline infrastructure: protocol types, error codes (0-4 Turkish mapping), platform-aware config, health-check with 5-min cache, execa bridge
- tRPC pipeline router with `healthCheck` and `status` procedures registered in `_app.ts`
- Tests for config, error-codes, health-check, docx-pipeline service, and pipeline router (22 passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Python Sidecar + TypeScript Config/Protocol/Error-Types** - `548d7a1` (feat)
2. **Task 2: Health Check Service + execa Bridge + tRPC Router** - `548d7a1` (feat, combined into single commit)

**Plan metadata:** `f958518` (docs: create phase plan for Pipeline Temeli)

## Files Created/Modified

- `scripts/docx-pipeline/main.py` — Python sidecar entry point with JSON stdin/stdout
- `scripts/docx-pipeline/requirements.txt` — pinned Python dependencies
- `scripts/docx-pipeline/setup-venv.ps1` — PowerShell venv setup script
- `scripts/docx-pipeline/__test__/echo_sidecar.py` — minimal mock for tests
- `lib/pipeline/protocol.ts` — CommandEnvelope and CommandResult Zod schemas
- `lib/pipeline/error-codes.ts` — PIPELINE_EXIT_CODES + getTurkishErrorMessage
- `lib/pipeline/config.ts` — getPythonPath, getLibreOfficePath, getSidecarPythonPath, SIDECAR_DIR
- `lib/pipeline/health-check.ts` — getHealthStatus, invalidateHealthCache, runHealthChecks
- `lib/services/docx-pipeline.ts` — runSidecarCommand using execa bridge
- `lib/trpc/routers/pipeline.ts` — pipelineRouter with healthCheck + status procedures
- `lib/trpc/routers/_app.ts` — registered pipelineRouter
- `package.json` — added execa, which, @types/which
- `.env.example` — added PYTHON_PATH, LIBREOFFICE_PATH
- `tests/lib/pipeline/config.test.ts` — 10 tests for path detection
- `tests/lib/pipeline/error-codes.test.ts` — 7 tests for exit code mapping
- `tests/lib/pipeline/health-check.test.ts` — 2 tests for health status
- `tests/lib/services/docx-pipeline.test.ts` — 1 test for error handling
- `tests/lib/trpc/routers/pipeline.test.ts` — 2 tests for tRPC router

## Decisions Made

- Used pydantic v2 `CommandEnvelope` model with `Literal` command type for type-safe IPC
- Health check cache uses module-level singleton pattern (same as `lib/db.ts`)
- `execa` with `reject: false` to capture exit codes 1-4 without throwing
- Platform defaults for LibreOffice: Windows `C:\Program Files\LibreOffice\program\soffice.exe`, Linux `/usr/bin/soffice`, macOS `/Applications/LibreOffice.app/Contents/MacOS/soffice`
- PYTHON_PATH/LIBREOFFICE_PATH env vars override platform defaults when set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **vitest module mocking complexity:** vi.mock with async factories and named exports required careful ordering. Mocked the module, then used vi.mocked() on the imported reference rather than a pre-declared mock variable.
- **PowerShell pipe syntax:** PowerShell doesn't support `|` with `echo` in the same way as bash. Python sidecar testing requires venv to be set up first.
- **Tests location:** Project vitest config includes `tests/**/*.test.ts` so test files were moved from `lib/` to `tests/lib/` to match existing project structure.

## User Setup Required

**Python and dependencies must be installed for health-check to succeed.** After cloning:

1. Run `scripts/docx-pipeline/setup-venv.ps1` to create the Python venv and install dependencies
2. Optionally set `PYTHON_PATH` and `LIBREOFFICE_PATH` in `.env.local` if auto-detection fails
3. Verify with `npx vitest run -t pipeline` or by visiting the tRPC pipeline.healthCheck endpoint

## Next Phase Readiness

- Python sidecar infrastructure ready for Phase 16 (extract-vars handler implementation)
- tRPC pipeline router registered and accessible at `/api/trpc/pipeline.healthCheck` and `/api/trpc/pipeline.status`
- Health check cache pattern established — can be used for other expensive operations

---
*Phase: 15-pipeline-temeli*
*Completed: 2026-04-20*