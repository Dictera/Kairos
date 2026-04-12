---
phase: 05
slug: calendar-view
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | TAKVIM-01 | T-05-01 | protectedProcedure enforces auth | unit | `npm test -- --filter="calendar-router"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | TAKVIM-01 | T-05-01 | Zod validates year/month input | unit | `npm test -- --filter="calendar-query"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | TAKVIM-01 | — | N/A | unit | `npm test -- --filter="calendar-day-cell"` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | TAKVIM-02 | T-05-02 | Links point to authenticated routes | integration | `npm test -- --filter="calendar-popover"` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | TAKVIM-01 | — | N/A | unit | `npm test -- --filter="calendar-navigation"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/calendar/calendar-router.test.ts` — TAKVIM-01 month query procedure
- [ ] `tests/calendar/calendar-day-cell.test.tsx` — D-01 inline badge format
- [ ] `tests/calendar/calendar-event-popover.test.tsx` — D-03 popover content
- [ ] `tests/calendar/calendar-navigation.test.tsx` — D-02 month navigation
- [ ] `tests/conftest.ts` — shared fixtures (mock data, test DB setup)
- [ ] Framework already installed: Vitest in devDependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual calendar rendering with event dots | TAKVIM-01 | Visual verification of dot placement | Visit `/takvim` and verify dots appear on correct days |
| Turkish locale formatting (dd.MM.yyyy) | D-08 | Locale formatting verification | Verify date format matches Turkish standard |
| Popover click navigates to case detail | TAKVIM-02 | End-to-end navigation | Click event in popover, verify `/dosyalar/{id}` loads |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
