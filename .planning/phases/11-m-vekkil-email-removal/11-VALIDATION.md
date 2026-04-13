---
phase: 11
slug: muvekkil-email-removal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/02-schema.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/02-schema.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | MUVEK-05 | — | N/A | unit | `npx vitest run tests/02-schema.test.ts` | ✏️ Needs replacement of it.todo | ⬜ pending |
| 11-02-01 | 02 | 1 | MUVEK-05 | — | N/A | integration | `npx vitest run` | ✅ Existing suite | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/02-schema.test.ts` — Replace stale `it.todo` on line 4 with real column-verification test (MUVEK-05)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Müvekkil create/edit form has no email input | MUVEK-05 | UI rendering check | Navigate to /muvekkiller/new, verify form has 5 fields (ad, soyad, telefon, tc_vergi_no, adres, notlar) and no email field |
| Müvekkil list displays without email column | MUVEK-05 | UI rendering check | Navigate to /muvekkiller, verify table columns are Ad Soyad, Telefon, TC/Vergi No, Bağlı Dosya Sayısı, İşlemler — no email column |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending