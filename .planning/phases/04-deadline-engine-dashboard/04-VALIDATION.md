---
phase: 4
slug: deadline-engine-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.4 |
| **Config file** | `vitest.config.ts` (present, configured) |
| **Quick run command** | `npx vitest run tests/04-deadline-service.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/04-deadline-service.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | SURE-01 | — | N/A | unit | `npx vitest run tests/04-deadline-service.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | SURE-02 | — | N/A | unit | `npx vitest run tests/04-deadline-service.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | SURE-03 | — | N/A | unit | `npx vitest run tests/04-deadline-service.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 1 | SURE-05 | — | N/A | unit | `npx vitest run tests/04-deadline-service.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-05 | 01 | 1 | DASH-02 | — | N/A | unit | `npx vitest run tests/04-deadline-service.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | SURE-04 | T-4-01 | Zod validates son_tarih; protectedProcedure on all mutations | unit | `npx vitest run tests/04-sure.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | DASH-01 | T-4-01 | protectedProcedure on dashboard.stats | unit | `npx vitest run tests/04-dashboard.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | DASH-01 | — | N/A | manual | — | N/A | ⬜ pending |
| 4-03-02 | 03 | 3 | DASH-02 | — | N/A | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/04-deadline-service.test.ts` — stubs for SURE-01, SURE-02, SURE-03, SURE-05, DASH-02
- [ ] `tests/04-sure.test.ts` — stubs for SURE-04 (router procedure existence)
- [ ] `tests/04-dashboard.test.ts` — stubs for DASH-01 (router procedure existence)

*No framework install needed — Vitest already configured and working.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard renders 3-section layout with stat cards, deadline list, today's hearings | DASH-01 | UI rendering requires browser | Navigate to `/`, verify 3 sections visible: stat cards (Toplam Dosya, Aktif Dosya, Bu Ay Açılan), Yaklaşan Süreler list, Bugünkü Duruşmalar list |
| Color coding: red < 3 days, yellow < 7 days, neutral 7–14 days | DASH-02 | CSS class application in browser | Create test deadlines at +1, +5, +10 days; verify red/yellow/neutral badges render correctly |
| Adli tatil badge appears on deadline during July 20–Aug 31 | SURE-05 | Visual badge requires browser | Create deadline with son_tarih in July 20–Aug 31 range; verify `⚠ Adli Tatil — manuel kontrol` badge visible in dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
