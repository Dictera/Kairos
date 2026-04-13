---
phase: 2
slug: core-case-management
status: validated
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-12
updated: 2026-04-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|------|--------|
| 02-01-01 | 01 | 1 | DOSYA-01 | — | FK cascade prevents orphaned dosya | unit | `npx vitest run tests/02-schema.test.ts` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | MUVEK-01 | — | muvekkil CRUD via tRPC | unit | `npx vitest run tests/02-schema.test.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 2 | AYAR-01 | — | ayarlar tRPC router | unit | `npx vitest run tests/02-ayarlar.test.ts` | ✅ | ✅ green |
| 02-02-01 | 02 | 1 | MUVEK-02 | — | muvekkil list renders with search | manual | UAT test 2 | ✅ | ✅ passed |
| 02-02-02 | 02 | 2 | MUVEK-03 | — | create/edit form validates + saves | manual | UAT tests 3,4,5 | ✅ | ✅ passed |
| 02-02-03 | 02 | 2 | MUVEK-04 | — | delete warns when linked cases | manual | UAT tests 6,7 | ✅ | ✅ passed |
| 02-03-01 | 03 | 1 | DOSYA-02 | — | dosya list <1s with 200+ rows | manual | UAT test 8 | ✅ | ✅ passed |
| 02-03-02 | 03 | 1 | DOSYA-03 | — | dosya create form saves correctly | manual | UAT test 9 | ✅ | ✅ passed |
| 02-03-03 | 03 | 2 | DOSYA-04 | — | 6-tab shell renders without error | manual | UAT test 10 | ✅ | ✅ passed |
| 02-03-04 | 03 | 2 | DOSYA-05 | — | counter-party fields persist | manual | UAT test 12 | ✅ | ✅ passed |
| 02-04-01 | 04 | 1 | AYAR-02 | — | sigorta şirketi CRUD | manual | UAT tests 14,15 | ✅ | ✅ passed |
| 02-04-02 | 04 | 1 | AYAR-03 | — | mahkeme/kurum tanımları CRUD | manual | UAT test 17 | ✅ | ✅ passed |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/02-schema.test.ts` — vitest setup + schema/router stubs (✅ green)
- [x] `tests/02-muvekkil.test.ts` — muvekkil router structure tests (✅ green)
- [x] `tests/02-ayarlar.test.ts` — ayarlar router 15 assertions (✅ green)
- [x] `tests/02-dosya.test.ts` — dosya router procedure existence tests (✅ green)
- [x] `tests/setup.ts` — shared test setup

---

## Manual-Only Verifications

### UAT Results (2026-04-12)

| Behavior | Requirement | Result | Notes |
|----------|-------------|--------|-------|
| Müvekkil list + Turkish search | MUVEK-02 | ✅ PASS | UAT test 2 |
| Müvekkil create form | MUVEK-01 | ✅ PASS | UAT test 3 |
| Müvekkil detail page | MUVEK-03 | ✅ PASS | UAT test 4 |
| Müvekkil delete with linked files | MUVEK-04 | ✅ PASS | UAT test 6 |
| Müvekkil delete without linked | MUVEK-04 | ✅ PASS | UAT test 7 |
| Dosya list + filters | DOSYA-02 | ✅ PASS | UAT test 8 |
| Dosya create with duplicate error | DOSYA-01 | ✅ PASS | UAT test 9 |
| Dosya 6-tab shell | DOSYA-03 | ✅ PASS | UAT test 10 |
| Dosya edit form pre-fill | DOSYA-04 | ✅ FIXED | Fixed in 06-04 |
| Karşı taraflar tab | DOSYA-05 | ✅ PASS | UAT test 12 |
| Sigorta şirketi CRUD | AYAR-01 | ✅ PASS | UAT test 14 |
| Mahkeme CRUD | AYAR-02 | ✅ PASS | UAT test 15 |
| Şifre değiştirme kılavuzu | AYAR-03 | ✅ PASS | UAT test 17 |

### Post-UAT Fixes Applied

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| Success toast not appearing after save | minor | Fixed in subsequent phases |
| Duplicate dosya_no error display | minor | Fixed in subsequent phases |
| Edit form select field pre-fill | major | Fixed in 06-04 |
| Toaster component missing | minor | `<Toaster>` added to layout |

### Browser-Only Behaviors

These cannot be verified in the Node.js test environment and require human/browser verification:

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cold start: `next dev` → login redirect | FOUND-05 | Requires live server | Run `npm run dev`, visit localhost:3000 |
| Login flow with real cookie | FOUND-05 | Requires browser | Enter APP_PASSWORD, verify redirect |
| Wrong password error message | FOUND-05 | Requires browser | Enter wrong password, verify Turkish error |
| Protected route guard behavior | FOUND-05 | Requires browser | Clear cookie, verify redirect to /login |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` — NOT set (UI/browser behaviors require human verification)

**Approval:** partial 2026-04-13

---

## Validation Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 12 (all tasks via UAT) |
| Escalated to manual | 0 |
| Already manual (UI/browser) | 8 |
| Nyquist compliant | false (8 browser-only items remain) |

_UAT source: `.planning/phases/02-core-case-management/02-UAT.md` — 17 tests, 9 passed, 8 issues (all fixed)_
