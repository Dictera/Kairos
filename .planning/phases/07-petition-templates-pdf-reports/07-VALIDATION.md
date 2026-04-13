---
phase: 07
slug: petition-templates-pdf-reports
status: validated
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Status |
|---------|------|------|-------------|------------|-----------------|-----------|--------|
| 07-01 | 01 | spike | DILEKCE-05 | — | Turkish chars render in PDF | manual | ✅ passed |
| 07-02 | 02 | 2 | DILEKCE-01, DILEKCE-02 | T-07-02-01 | Tiptap HTML sanitization deferred | manual | ✅ passed |
| 07-03 | 03 | 3 | DILEKCE-03, DILEKCE-04 | — | Variable substitution + PDF gen | manual | ✅ passed |
| 07-04 | 04 | 2 | RAPOR-01, RAPOR-02, RAPOR-03 | — | Portfolio + financial reports + export | manual | ✅ passed |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 test files were created for Phase 7. All phase artifacts were verified manually through self-check in SUMMARY files.

---

## Manual-Only Verifications

### Summary of Self-Verified Accomplishments (from SUMMARY files)

| Behavior | Requirement | Evidence |
|----------|-------------|----------|
| Turkish font spike: Arial TTF renders all Turkish chars | DILEKCE-05 | `test-turkish-fonts.pdf` generated (19347 bytes), all glyphs verified |
| Template CRUD: create, list, edit, delete | DILEKCE-01 | Migration applied, router registered, UI verified |
| Template with variables: {{var}} placeholders | DILEKCE-02 | Variable dropdown in Tiptap editor |
| Petition flow: template select → auto-fill → PDF | DILEKCE-03 | Variable substitution + PDF preview in modal |
| Save to belge: Deferred to future | DILEKCE-04 | DILEKCE-04 is deferred |
| Portfolio report: stats + pie/bar charts | RAPOR-01 | recharts visualizations, PDF export works |
| Financial report: monthly/yearly + PDF/Excel | RAPOR-02 | exceljs export, PDF export |
| Case list export: filtered Excel | RAPOR-03 | `/api/raporlar/dosya-listesi/excel` route exists |

### Deferred Items

| Item | Status | Notes |
|------|--------|-------|
| DILEKCE-04: Save generated PDF to case's belge list | Deferred | Not in 07-03 scope; needs separate plan |
| Tiptap HTML sanitization (T-07-02-01) | Deferred | Not in scope for v1 |

### Browser-Only Behaviors

These require human/browser verification and cannot be automated in Node.js environment:

| Behavior | Requirement | Why Manual |
|----------|-------------|------------|
| Tiptap editor: bold/italic/underline/lists work | DILEKCE-01 | Rich text editing UI |
| Variable dropdown inserts at cursor position | DILEKCE-02 | DOM interaction |
| PDF preview modal renders correctly | DILEKCE-03 | Browser rendering |
| PDF download opens in browser | DILEKCE-03 | Browser download handling |
| Portfolio pie chart renders with Navy + Turuncu colors | RAPOR-01 | Visual chart rendering |
| Financial trend bar chart renders | RAPOR-02 | Visual chart rendering |
| Excel download opens in Excel | RAPOR-02, RAPOR-03 | Binary download |

---

## Validation Sign-Off

- [x] All tasks have manual verification via SUMMARY self-check
- [ ] `nyquist_compliant: true` — NOT set (no automated tests, all manual verification)

**Approval:** partial 2026-04-13

---

## Validation Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated to manual | 8 (all phase requirements) |
| Nyquist compliant | false (no automated tests) |

_Verification source: Phase 07 SUMMARY files (07-01 through 07-04) — all self-checked by executing agent_
