---
phase: 9
slug: projedeki-b-t-n-takvim-g-r-n-mlerinin-dosyalar-dosya-detay-y
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (installed: vitest 4.1.4) |
| **Config file** | vitest.config.ts (if exists) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | D-01 (DatePickerField extraction) | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | D-01 (SureList date inputs) | — | N/A | smoke | visual | ✅ | ⬜ pending |
| 9-01-03 | 01 | 1 | D-02 (Turkish date format) | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 9-01-04 | 01 | 2 | D-03 (weekStartsOn=1) | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | D-04 (Turuncu selected day) | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 2 | D-01 (DosyaList date filters) | — | N/A | smoke | visual | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/components/date-picker.test.tsx` — DatePickerField Turkish locale and format tests
- [ ] `tests/components/calendar.test.tsx` — Calendar weekStartsOn=1 verification
- [ ] `vitest.config.ts` — if not already present (Vitest already installed)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual: DatePickerField button styling matches Turuncu palette | D-04 | Color verification requires human eye | Open any form with DatePickerField in browser |
| Visual: Calendar week starts Monday | D-03 | Visual confirmation of week layout | Open DatePickerField popover, verify "Pzt" is first day |
| Visual: DosyaList filter inputs updated | D-01 | Smoke test for filter section | Navigate to dosya-list, verify date filter shows calendar popup |

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
