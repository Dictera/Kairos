---
status: all_fixed
findings_in_scope: 7
fixed: 7
skipped: 0
iteration: 1
phase: 15-pipeline-temeli
fix_date: 2026-04-20
---

# Code Review Fix Report: Phase 15 — Pipeline Temeli

## Summary

All 7 Critical and Warning findings have been fixed. Info findings (IN-01 to IN-05) were not in scope (critical_warning mode).

## Fixes Applied

### CR-01: Missing `logging` import in `main.py` — FIXED

**File:** `scripts/docx-pipeline/main.py:9`

Added `import logging` to the imports. The `logging.INFO` reference on line 24 now resolves correctly.

### CR-02: Health check uses hardcoded `soffice` instead of platform-aware path — FIXED

**Files:** `scripts/docx-pipeline/main.py:52-55`, `lib/pipeline/health-check.ts:58`

- Python sidecar now accepts `libreoffice_path` parameter from the health-check command params
- Falls back to `"soffice"` only if no path is provided
- Node.js health check now passes the platform-aware `libreoffice_path` (computed via `getLibreOfficePath()`) to the sidecar

### WR-01: `SIDECAR_DIR` uses `process.cwd()` — FIXED

**File:** `lib/pipeline/config.ts:6`

Changed from `resolve(process.cwd(), 'scripts/docx-pipeline')` to `resolve(__dirname, '../../scripts/docx-pipeline')` for a stable path relative to the module file.

### WR-02: LibreOffice version display prepends "v" to non-semver string — FIXED

**File:** `components/pipeline/pipeline-status.tsx:49`

Removed the `"v"` prefix. Now displays the raw version string (e.g., `LibreOffice 24.2.1.2`) directly.

### WR-03: Health check cache is not concurrency-safe — FIXED

**File:** `lib/pipeline/health-check.ts:26-44`

Added `healthPending` promise pattern. Concurrent callers now share the same in-flight `runHealthChecks()` promise instead of spawning redundant checks.

### WR-04: `runSidecarCommand` uses `main.py` without full path — FIXED

**File:** `lib/services/docx-pipeline.ts:22`

Changed from `['main.py']` to `[join(SIDECAR_DIR, 'main.py')]` for an explicit absolute path to the sidecar script.

### WR-05: `main.py` health check logs `python_accessible=True` hardcoded — FIXED

**File:** `scripts/docx-pipeline/main.py:65-71`

Removed the hardcoded `python_accessible` field from both the log output and the result dict. The sidecar running at all implies Python is accessible, making this field redundant.

## Skipped Findings

None. All findings in scope (Critical + Warning) were fixed.

## Notes

- Info findings (IN-01 to IN-05) were not addressed as they are informational only and were outside the `critical_warning` fix scope.
- All fixes are minimal and targeted — no refactoring or feature changes beyond what was needed to resolve review findings.
