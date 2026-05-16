---
status: testing
phase: 15-pipeline-temeli
source: 15-01-SUMMARY.md, 15-02-SUMMARY.md
started: 2026-04-20T20:05:00.000Z
updated: 2026-04-20T20:05:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Server boots without errors, migrations complete, health check or homepage returns live data
result: pass

### 2. tRPC Pipeline Health Check Endpoint
expected: Calling /api/trpc/pipeline.healthCheck returns health status with python and libreoffice accessibility booleans, versions, and paths
result: issue
reported: "endpoint çalışıyor ama python accessible: false gösteriyor - 'python u görmüyor'"
severity: major
fixed: true
fix: "Added 'python_accessible': True to health-check result dict in main.py:77-84"

### 3. tRPC Pipeline Status Endpoint
expected: Calling /api/trpc/pipeline.status returns current pipeline status with Python/LibreOffice configuration details
result: pass

### 4. HealthBanner Visibility on Dashboard
expected: When Python or LibreOffice is not accessible, an amber warning banner with AlertTriangle icon appears at the top of all dashboard pages. Banner has a dismiss button that hides it for the current session.
result: pass

### 5. HealthBanner Dismiss Behavior
expected: Clicking dismiss on the HealthBanner hides it for the current session. On page refresh, banner reappears if Python/LibreOffice still not accessible.
result: pass

### 6. PipelineStatus Card on Ayarlar Page
expected: Ayarlar (Settings) page shows a PipelineStatus card as the last section (after Şifre Değiştirme). Card displays Python and LibreOffice rows with path, version, and green/red accessibility Badge indicators.
result: pass

### 7. PipelineStatus Badge Colors
expected: When Python/LibreOffice is accessible, Badge shows green. When not accessible, Badge shows red. Badge color matches the actual health check result.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Health check returns python accessible: true when Python is installed"
  status: failed
  reason: "User reported: endpoint çalışıyor ama python accessible: false gösteriyor - 'python u görmüyor'"
  severity: major
  test: 2
  root_cause: "main.py health-check handler returns python_version but never includes python_accessible boolean in result dict. TypeScript at health-check.ts:68 reads r.python_accessible ?? false, always defaulting to false."
  artifacts:
    - path: "scripts/docx-pipeline/main.py"
      issue: "health-check result dict missing python_accessible key"
    - path: "lib/pipeline/health-check.ts:68"
      issue: "reads python_accessible from sidecar response, defaults to false when missing"
  missing:
    - "Add 'python_accessible': True to health-check result dict in main.py"
  debug_session: ""
