---
phase: 12
slug: taraf-tab-driver-info-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TARAF-07 | T-12-01 | Phone regex mirrors server-side | unit | `npm test -- --run tests/lib/trpc.test.ts` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | TARAF-08 | — | N/A | manual | Visual browser inspection | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test scaffolding needed.

- Schema validation tests already exist in `tests/lib/trpc.test.ts` (cover TARAF-07 phone/field validation)
- Phone regex tests already exist in `tests/lib/validation.test.ts`
- UI rendering tests (TARAF-08) are manual — project has no component testing infrastructure (no React Testing Library, no jsdom environment)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Driver info Card renders 5 InfoRows in view mode | TARAF-08 | No component testing infrastructure | Navigate to dosya detail → Karsitaraflar tab → verify "Diğer Sürücü Bilgileri" Card with 5 rows visible when data exists |
| Driver info Card hidden when all fields empty | TARAF-08 | No component testing infrastructure | Navigate to dosya detail → Karsitaraflar tab → verify no driver Card when all surucu fields are null |
| Edit mode shows 5 driver form fields | TARAF-07 | No component testing infrastructure | Click "Düzenle" → verify 5 driver fields visible in second Card |
| Phone format hint "Format: 05XXXXXXXXX" shown | TARAF-07 / D-05 | No component testing infrastructure | Edit mode → check text below Telefon input |
| Plate placeholder "34 ABC 123" shown | TARAF-07 / D-06 | No component testing infrastructure | Edit mode → check Plaka input placeholder |
| Save persists driver fields | TARAF-07 | End-to-end flow | Fill driver fields → Kaydet → refresh → verify data persists |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
