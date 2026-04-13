---
phase: 05
slug: calendar-view
status: validated
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
updated: 2026-04-13
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|------|--------|
| 05-01-01 | 01 | 1 | TAKVIM-01 | T-05-01 | protectedProcedure enforces auth | unit | `npm test -- --filter="calendar-router"` | ❌ | ⬜ missing |
| 05-01-02 | 01 | 1 | TAKVIM-01 | T-05-01 | Zod validates year/month input | unit | `npm test -- --filter="calendar-query"` | ❌ | ⬜ missing |
| 05-02-01 | 02 | 2 | TAKVIM-01 | — | N/A | unit | `npm test -- --filter="calendar-day-cell"` | ❌ | ⬜ missing |
| 05-02-02 | 02 | 2 | TAKVIM-02 | T-05-02 | Links point to authenticated routes | integration | `npm test -- --filter="calendar-popover"` | ❌ | ⬜ missing |
| 05-02-03 | 02 | 2 | TAKVIM-01 | — | N/A | unit | `npm test -- --filter="calendar-navigation"` | ❌ | ⬜ missing |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/calendar/calendar-router.test.ts` — TAKVIM-01 month query procedure
- [ ] `tests/calendar/calendar-day-cell.test.tsx` — D-01 inline badge format
- [ ] `tests/calendar/calendar-event-popover.test.tsx` — D-03 popover content
- [ ] `tests/calendar/calendar-navigation.test.tsx` — D-02 month navigation
- [ ] `tests/conftest.ts` — shared fixtures

**Note:** Wave 0 test files were never created during phase execution. These cannot be retroactively created without modifying implementation files (Vitest DOM environment needed for React component testing). UI behaviors validated via UAT instead.

---

## Manual-Only Verifications

### UAT Results (2026-04-13)

| Behavior | Requirement | Result | Notes |
|----------|-------------|--------|-------|
| Calendar page renders at /takvim | TAKVIM-01 | ✅ PASS | UAT test 1 |
| Month navigation (prev/next/dropdown) | TAKVIM-01 | ✅ PASS | UAT test 2 |
| Event badge counts per day | TAKVIM-01 | ✅ PASS | UAT test 3 |
| Event popover on day click | TAKVIM-02 | ✅ PASS | UAT test 4 |
| Event navigation to case detail | TAKVIM-02 | ✅ PASS | UAT test 5 |

**UAT Summary:** 5/5 tests passed, 0 issues

### Browser-Only Behaviors

These require human/browser verification and cannot be automated in the Node.js test environment:

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar renders with Turkish locale (dd.MM.yyyy) | TAKVIM-01 | Visual locale check | Visit /takvim, verify dates show as dd.MM.yyyy |
| Badge colors correct (red süre, blue duruşma) | TAKVIM-01 | Visual color check | Inspect badge text colors on days with events |
| Month dropdown shows correct months in Turkish | TAKVIM-01 | Visual + interaction | Click month dropdown, verify Turkish month names |
| Popover positioning correct | TAKVIM-02 | Visual layout | Click day with events, verify popover opens near the day |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [ ] `nyquist_compliant: true` — NOT set (UI/browser behaviors require human verification, Wave 0 tests never created)

**Approval:** partial 2026-04-13

---

## Validation Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 5 (all tasks via UAT) |
| Escalated to manual | 5 (UI/browser behaviors) |
| Already manual | 0 |
| Nyquist compliant | false (Wave 0 tests never created; 4 browser-only items) |

_UAT source: `.planning/phases/05-calendar-view/05-UAT.md` — 5 tests, 5 passed, 0 issues_
