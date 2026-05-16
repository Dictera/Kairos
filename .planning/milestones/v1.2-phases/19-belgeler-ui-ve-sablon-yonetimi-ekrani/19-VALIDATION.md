---
phase: 19
slug: belgeler-ui-ve-sablon-yonetimi-ekrani
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- tests/19-*.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~8 seconds (three file-read structural suites, no DOM) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/19-*.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | BUI-01, BUI-02, BUI-03, BUI-04, BUI-05 | — | N/A (structure scaffolding) | unit | `npm test -- tests/19-sablondan-uret.test.ts` | ✅ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | BUI-01, BUI-02, BUI-03, BUI-04 | — | Zod schema on tRPC input; no user HTML rendered | unit | `npm test -- tests/19-sablondan-uret.test.ts --run -t "SablondanUret component"` | ✅ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | BUI-05 | — | `belge.sablon_id` conditional styling; server-controlled `dosya_yolu` | unit | `npm test -- tests/19-sablondan-uret.test.ts --run -t "BelgeList generated-PDF row"` | ✅ W0 | ⬜ pending |
| 19-01-04 | 01 | 1 | BUI-01 | — | Mount point above `BelgeUpload` in belgeler tab | unit | `npm test -- tests/19-sablondan-uret.test.ts --run -t "DosyaDetailTabs mount"` | ✅ W0 | ⬜ pending |
| 19-02-01 | 02 | 1 | BUI-06, BUI-07, BUI-09 | — | N/A (structure scaffolding) | unit | `npm test -- tests/19-variable-catalog.test.ts` | ✅ W0 | ⬜ pending |
| 19-02-02 | 02 | 1 | BUI-07, BUI-09 | — | Variable names rendered in `<code>` (XSS-safe); `VARIABLE_REGISTRY` single source of truth | unit | `npm test -- tests/19-variable-catalog.test.ts --run -t "VariableCatalogModal"` | ✅ W0 | ⬜ pending |
| 19-02-03 | 02 | 1 | BUI-06 | — | Row click → modal; no inline HTML | unit | `npm test -- tests/19-variable-catalog.test.ts --run -t "SablonYonetimiSection row-click catalog"` | ✅ W0 | ⬜ pending |
| 19-03-01 | 03 | 1 | BUI-08, BUI-09 | — | N/A (structure scaffolding) | unit | `npm test -- tests/19-cheat-sheet.test.ts` | ✅ W0 | ⬜ pending |
| 19-03-02 | 03 | 1 | BUI-08, BUI-09 | — | Server Component (no `'use client'`); static registry render | unit | `npm test -- tests/19-cheat-sheet.test.ts --run -t "CheatSheetPage"` | ✅ W0 | ⬜ pending |
| 19-03-03 | 03 | 1 | BUI-08 | — | Summary card link-only (D-10); no inline variable list | unit | `npm test -- tests/19-cheat-sheet.test.ts --run -t "CheatSheetSummaryCard"` | ✅ W0 | ⬜ pending |
| 19-03-04 | 03 | 1 | BUI-08 | — | Next.js route mounts Server Component | unit | `npm test -- tests/19-cheat-sheet.test.ts --run -t "Cheat-sheet route"` | ✅ W0 | ⬜ pending |
| 19-03-05 | 03 | 1 | BUI-08 | — | Card mounted on Ayarlar page without regressing existing sections | unit | `npm test -- tests/19-cheat-sheet.test.ts --run -t "AyarlarPage summary card mount"` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*File-exists legend: `✅ W0` means the test file is created by the first task of each plan (Wave 0 scaffolding) and exists before any implementation task runs.*

---

## Wave 0 Requirements

- [x] `tests/19-sablondan-uret.test.ts` — covers BUI-01, BUI-02, BUI-03, BUI-04, BUI-05 (created by plan 19-01 task 1)
- [x] `tests/19-variable-catalog.test.ts` — covers BUI-06, BUI-07, BUI-09 (created by plan 19-02 task 1)
- [x] `tests/19-cheat-sheet.test.ts` — covers BUI-08, BUI-09, D-13 (created by plan 19-03 task 1)
- [x] No framework install needed — Vitest 4.1.4 already configured via `vitest.config.ts`

---

## Manual-Only Verifications

*All phase behaviors have automated file-read structure verification. Visual/UX review (spacing, copy tone, toast timing) is handled by the `/gsd-verify-work` checkpoint, not blocking sampling.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (three test files created before implementation)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-22
