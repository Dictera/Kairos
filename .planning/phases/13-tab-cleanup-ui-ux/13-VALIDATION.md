---
phase: 13
slug: tab-cleanup-ui-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | TAB-01 | T-13-01 | React auto-escaping on note display | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "note"` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | TAB-01 | — | N/A | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "timeline"` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | TAB-02 | T-13-02 | Zod validates all new fields | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "genel-bilgiler"` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | TAB-02 | — | N/A | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "surec"` | ❌ W0 | ⬜ pending |
| 13-02-03 | 02 | 1 | TAB-02 | T-13-03 | Zod enum derived from schema constant | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "belge"` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | UIUX-01 | — | N/A | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "iban"` | ❌ W0 | ⬜ pending |
| 13-03-02 | 03 | 2 | UIUX-01 | — | N/A | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "kusur"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/13-tab-cleanup.test.ts` — stubs for TAB-01, TAB-02, UIUX-01
- [ ] Test setup must handle new schema tables (dosyaNot, olayGunlugu)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Notes CRUD inline edit/delete UX | TAB-01 | Interactive UI verification | Open dosya detail, Notlar tab, add/edit/delete a note |
| Timeline visual rendering | TAB-01 | Visual component check | Open dosya detail, Notlar tab, verify timeline dots and events |
| Kusur oranı auto-calc display | UIUX-01 | Visual calculation display | Edit dosya, set karşı taraf kusur 75%, verify müvekkil shows 25% |
| Form field grouping layout | UIUX-01 | Visual layout check | Open dosya form, verify group headings and separators |
| Belge category file renaming | TAB-02 | Upload integration test | Upload document, select category, verify filename changes |
| Stage stepper with new stages | TAB-02 | Visual stepper check | Open Yargılama Süreci tab, verify STK (9) and Mahkeme (12) stages |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
