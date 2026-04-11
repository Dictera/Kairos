---
phase: 2
slug: core-case-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DOSYA-01 | — | FK cascade prevents orphaned dosya | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | MUVEK-01 | — | muvekkil CRUD via tRPC | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 2 | AYAR-01 | — | ayarlar tRPC router | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | MUVEK-02 | — | muvekkil list renders with search | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | MUVEK-03 | — | create/edit form validates + saves | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | MUVEK-04 | — | delete warns when linked cases | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | DOSYA-02 | — | dosya list <1s with 200+ rows | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | DOSYA-03 | — | dosya create form saves correctly | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | DOSYA-04 | — | 6-tab shell renders without error | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | DOSYA-05 | — | counter-party fields persist | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 1 | AYAR-02 | — | sigorta şirketi CRUD | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 1 | AYAR-03 | — | mahkeme/kurum tanımları CRUD | integration | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/02-schema.test.ts` — stubs for DOSYA-01, MUVEK-01
- [ ] `tests/02-muvekkil.test.ts` — stubs for MUVEK-02, MUVEK-03, MUVEK-04
- [ ] `tests/02-dosya.test.ts` — stubs for DOSYA-02, DOSYA-03, DOSYA-04, DOSYA-05
- [ ] `tests/02-ayarlar.test.ts` — stubs for AYAR-01, AYAR-02, AYAR-03
- [ ] `tests/setup.ts` — shared db fixtures (Drizzle test client)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Case list loads in <1s with 200+ records (visual timing) | DOSYA-02 | Requires visual browser timing | Open dosya list with seeded 200+ rows; measure network tab |
| Turkish search works correctly (case-insensitive ı/İ) | DOSYA-03 | Turkish locale edge case | Search "istanbul" finds "İstanbul" and vice versa |
| 6-tab UI renders correctly in browser | DOSYA-04 | Visual layout check | Navigate to a case detail page; all 6 tabs visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
