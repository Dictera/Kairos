---
phase: 3
slug: stk-mahkeme-process-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.4 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | SUREC-01,SUREC-03 | — | N/A | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SUREC-01 | T-03-01 | stkIleriAl advances sequentially, stops at final | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | SUREC-02 | T-03-02 | updateStkData validates all fields via Zod | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | SUREC-03 | T-03-03 | mahkemeIleriAl advances sequentially, stops at final | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | SUREC-04 | T-03-04 | updateMahkemeData validates all fields via Zod | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | SUREC-05 | — | durusma CRUD procedures exist and validate inputs | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | SUREC-01,SUREC-03 | — | parseSurecDetay handles null input without throwing | unit | `npm run test -- tests/03-surec.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-08 | 01 | 1 | SUREC-01,SUREC-05 | — | schema exports durusma table and surec_detay column | unit | `npm run test -- tests/03-schema.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/03-surec.test.ts` — covers SUREC-01 through SUREC-05 procedure existence + stage ordering + parseSurecDetay null safety
- [ ] `tests/03-schema.test.ts` — verifies `durusma` table exists in schema export and `surec_detay` column present on `dosya`

*Framework and shared fixtures already exist — `tests/setup.ts` and `vitest.config.ts` require no changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| STK stepper visually shows 9 stages with correct labels in Turkish | SUREC-01 | Visual rendering cannot be automated | Navigate to case detail → Yargılama Süreci tab → verify stepper shows BAŞVURU through KARAR_KESİNLEŞTİ |
| Mahkeme stepper visually shows 8 stages with correct labels in Turkish | SUREC-03 | Visual rendering cannot be automated | Navigate to case detail → Yargılama Süreci tab → verify stepper shows DAVA_AÇILDI through KESİNLEŞTİ |
| Duruşma list shows chronological ordering | SUREC-05 | UI sort order not covered by unit tests | Add 3 hearings with different dates, verify display order |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
