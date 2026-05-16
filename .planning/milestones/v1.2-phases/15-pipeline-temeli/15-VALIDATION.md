---
phase: 15
slug: pipeline-temeli
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | None — use project root vitest config |
| **Quick run command** | `npx vitest run -t "pipeline" --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run -t "pipeline" --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | PIPE-01, PIPE-02, PIPE-08, PIPE-09, PIPE-10 | T-15-02 | Path validation prevents injection | unit | `npx vitest run lib/pipeline/config.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-01-01 | 01 | 1 | PIPE-05, PIPE-12 | — | venv existence check | unit | `npx vitest run lib/pipeline/config.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-01-01 | 01 | 1 | PIPE-07 | — | Exit code mapping completeness | unit | `npx vitest run lib/pipeline/error-codes.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | PIPE-06 | T-15-01 | execa reject:false, no shell mode | unit | `npx vitest run lib/services/docx-pipeline.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | PIPE-03 | — | Health check caching behavior | unit | `npx vitest run lib/pipeline/health-check.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | PIPE-04 | — | Status endpoint returns version info | unit | `npx vitest run lib/trpc/routers/pipeline.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 2 | PIPE-03 | — | Banner visibility on missing deps | integration | `npx vitest run components/pipeline/ --reporter=verbose` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | PIPE-04 | — | Status card renders versions | integration | manual | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/pipeline/config.test.ts` — covers PIPE-01, PIPE-02, PIPE-05, PIPE-08, PIPE-09, PIPE-10
- [ ] `lib/pipeline/error-codes.test.ts` — covers PIPE-07
- [ ] `lib/pipeline/health-check.test.ts` — covers PIPE-03
- [ ] `lib/services/docx-pipeline.test.ts` — covers PIPE-06 (needs mock Python script)
- [ ] `lib/trpc/routers/pipeline.test.ts` — covers PIPE-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner visible on all dashboard pages when Python missing | PIPE-03 | Requires visual DOM inspection | 1. Set PYTHON_PATH to invalid path in .env.local, 2. Restart dev server, 3. Verify banner appears on every dashboard page |
| Banner visible when LibreOffice missing | PIPE-03 | Requires visual DOM inspection | 1. Set LIBREOFFICE_PATH to invalid path, 2. Verify banner appears with Turkish text |
| Pipeline Status card shows real version numbers | PIPE-04 | Requires actual Python/LibreOffice installed | 1. Navigate to Ayarlar, 2. Verify version numbers display, 3. Verify green/red status indicators |
| Python venv setup script works on Windows | PIPE-05 | Requires Windows environment | 1. Run `powershell -ExecutionPolicy Bypass -File scripts/docx-pipeline/setup-venv.ps1`, 2. Verify .venv directory created, 3. Verify pip packages installed |
| Health banner disappears when deps available | PIPE-03 | Requires full stack running | 1. Start with valid PYTHON_PATH and LIBREOFFICE_PATH, 2. Verify banner is hidden |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending