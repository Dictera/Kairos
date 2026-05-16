---
phase: 16
plan: "03"
subsystem: api
tags: [nextjs, file-upload, multipart, docx, template]

# Dependency graph
requires:
  - phase: "16-sablon-semasi-ve-crud"
    provides: docx_sablon schema (SABLON-01 foundation)
provides:
  - POST /api/templates/upload multipart handler with .docx validation
  - Regression test suite for upload route SABLON-01 enforcement
affects: [16-04-PLAN, sablon router]

# Tech tracking
tech-stack:
  added: []
  patterns: [multipart upload, defense-in-depth validation (extension + MIME + size), path-traversal guard]

key-files:
  created:
    - app/api/templates/upload/route.ts
    - tests/16-templates-upload-route.test.ts
  modified: []

key-decisions:
  - "Separate /api/templates/upload route vs reusing /api/upload — clean separation with distinct storage path (./uploads/templates/) and .docx-only validation"

patterns-established:
  - "Pattern: timestamp-prefixed sanitized filename — `${Date.now()}_${sanitized}`"
  - "Pattern: path-traversal guard via `path.resolve(filePath).startsWith(basePath)`"
  - "Pattern: defense-in-depth — validate BOTH extension AND MIME type"

requirements-completed: [SABLON-01]

# Metrics
duration: ~2min
completed: 2026-04-21
---

# Phase 16 Plan 03: Multipart Upload API Route Summary

**POST /api/templates/upload multipart handler with .docx validation, 10MB cap, path-traversal guard, and Turkish error messages**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-21T10:54:42Z
- **Completed:** 2026-04-21T10:56:41Z
- **Tasks:** 2 (2 completed)
- **Files modified:** 2

## Accomplishments

- Upload route at `app/api/templates/upload/route.ts` implements the full SABLON-01 contract:
  - Validates `.docx` extension AND MIME type (defense in depth against spoofing)
  - Enforces 10MB file size cap
  - Sanitizes filenames via `replace(/[^a-zA-Z0-9._-]/g, '_')` removing path separators
  - Path-traversal guard verifies `path.resolve(filePath).startsWith(basePath)` before disk write
  - Auto-creates `./uploads/templates/` directory if missing
  - Returns `{ filename, filePath, fileSize, fileName }` JSON
  - Turkish error messages: "Sadece .docx dosyaları kabul edilir", "Dosya boyutu 10 MB'ı aşamaz"
- Regression test suite (8 tests) covers source-string constants and runtime behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Create upload route** - `348aeea` (feat)
2. **Task 2: Add regression test** - `348aeea` (feat, same commit as Task 1)

**Plan metadata:** `348aeea` (docs: complete plan)

## Files Created/Modified

- `app/api/templates/upload/route.ts` - Multipart upload handler for .docx templates
- `tests/16-templates-upload-route.test.ts` - Regression test for upload route validation

## Decisions Made

- Separate `/api/templates/upload` route (not reusing `/api/upload`) — clean separation with distinct storage path and .docx-only validation rules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all acceptance criteria passed on first run.

## Next Phase Readiness

- Upload route ready; tRPC `sablon` router (Plan 16-04) can now call the upload endpoint and record metadata in `docx_sablon` table
- Template storage directory `./uploads/templates/` is automatically created by the route

---
*Phase: 16-sablon-semasi-ve-crud*
*Completed: 2026-04-21*
