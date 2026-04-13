---
phase: 06
slug: documents-finance
status: validated
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-13
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-T1 | 01 | 1 | BELGE-01, FINANS-01 | — | Schema exports belge + finans_kalemi tables with correct structure | unit | `npm run test` | ✅ | ✅ green |
| 06-01-T2 | 01 | 1 | BELGE-04 | T-06-01, T-06-04 | Upload route validates MIME type + 20MB limit; rejects invalid files | unit | `npm run test` | ✅ | ✅ green |
| 06-01-T3 | 01 | 1 | BELGE-01 | T-06-03 | Download route serves files from E: drive with path traversal protection | manual | See Manual-Only | ❌ missing | ⚠️ file missing |
| 06-01-T4 | 01 | 1 | BELGE-03 | — | belge router exposes list/create/delete procedures | unit | `npm run test` | ✅ | ✅ green |
| 06-01-T5 | 01 | 1 | FINANS-01–06 | T-06-09, T-06-12 | finans router exposes all 6 procedures; net = gelen - giden - masraf | unit | `npm run test` | ✅ | ✅ green |
| 06-01-T6 | 01 | 1 | FINANS-01 | — | Drizzle schema push creates belge + finans_kalemi in SQLite | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-02-T1 | 02 | 2 | BELGE-01, BELGE-04 | T-06-06 | BelgeUpload validates file type/size client-side before fetch | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-02-T2 | 02 | 2 | BELGE-02, BELGE-03 | T-06-07 | BelgeList shows category badge; delete requires AlertDialog confirmation | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-02-T3 | 02 | 2 | BELGE-02 | — | Belgeler tab in dosya-detail-tabs renders upload form + document list | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-02-T4 | 02 | 2 | BELGE-02 | — | Global /belgeler page lists all documents with case links | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-03-T1 | 03 | 2 | FINANS-01, FINANS-04 | T-06-09 | FinansForm validates tur enum, tutar positive, tarih YYYY-MM-DD | unit | `npm run test` | ✅ | ✅ green |
| 06-03-T2 | 03 | 2 | FINANS-05 | — | FinansSummary shows 4 cards: Gelen/Giden/Masraf/Net in TRY | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-03-T3 | 03 | 2 | FINANS-02, FINANS-03 | — | FinansEntryList shows entries; edit opens inline form; delete requires confirm | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-03-T4 | 03 | 2 | FINANS-06 | T-06-10, T-06-11 | FinansDashboard renders charts + tables; recharts loads without SSR errors | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-03-T5 | 03 | 2 | FINANS-05, FINANS-06 | — | /finans page renders global dashboard | manual | See Manual-Only | ✅ | ⬜ pending |
| 06-04-T1 | 04 | gap | — | — | DatePickerField used in finans-form (Calendar popover) | unit | `grep -n "DatePickerField" components/finans/finans-form.tsx` | ✅ | ⬜ pending |
| 06-04-T2 | 04 | gap | FINANS-02 | — | Entries sorted by tarih descending (newest first) | unit | `npm run test` | ✅ | ✅ green |
| 06-04-T3 | 04 | gap | — | — | Dashboard uses full Turkish month names (Ocak, Şubat...) | unit | `grep -n "turkishMonthsFull" components/finans/finans-dashboard.tsx` | ✅ | ⬜ pending |
| 06-04-T4 | 04 | gap | BELGE-01 | — | belge-upload X button uses outline variant and is outside drop zone | manual | See Manual-Only | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- `tests/06-belge-finans.test.ts` — 14 tests covering schema, upload validation, router procedures, finans net calc, input validation, entry sorting (created by Nyquist audit 2026-04-13)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Download route serves files with correct Content-Type | BELGE-01 | Requires E:/sigorta-belgeler/ disk access + HTTP request; route file missing from disk | 1. Create `app/api/files/[dosyaId]/[filename]/route.ts` 2. Upload a PDF 3. Click download link, verify PDF opens |
| Drizzle push created belge + finans_kalemi tables | FINANS-01 | Requires live SQLite DB; run `npx drizzle-kit push` | Run `npx drizzle-kit push` then verify tables in drizzle-kit studio |
| BelgeUpload: drag-and-drop + file picker | BELGE-01, BELGE-04 | Client React component; Vitest node env has no DOM | 1. Open case detail → Belgeler tab 2. Drag a PDF onto drop zone, verify file preview shows 3. Click zone, verify file picker opens |
| BelgeUpload: invalid file type shows error | BELGE-04 | Client UI | Drag a .txt file onto drop zone, verify Turkish error message appears |
| BelgeUpload: file > 20MB shows error | BELGE-04 | Client UI | Select a file > 20MB, verify error message appears |
| BelgeList: category badge + upload date displayed | BELGE-02 | Client UI | Upload a file → verify category badge and date appear in list |
| BelgeList: delete requires AlertDialog confirmation | BELGE-03 | Client UI | Click delete icon → verify AlertDialog appears → confirm → verify document removed |
| Belgeler tab visible in dosya detail page | BELGE-02 | Client routing | Open any case → click "Belgeler" tab → verify upload form + list visible |
| Global /belgeler page lists all documents | BELGE-02 | Server component | Navigate to /belgeler → verify all documents shown with case links |
| FinansSummary: 4 cards in TRY format | FINANS-05 | Client UI | Open case with finance entries → verify Gelen/Giden/Masraf/Net Bakiye cards |
| FinansEntryList: inline edit works | FINANS-03 | Client UI | Click edit icon on entry → verify form appears inline with existing values |
| FinansDashboard: charts render without SSR errors | FINANS-06 | recharts requires browser | Navigate to /finans → verify bar chart and line chart render |
| FinansDashboard: year filter updates data | FINANS-06 | Client UI | Select a year in filter → verify chart and table update |
| /finans page shows global dashboard | FINANS-06 | Server routing | Navigate to /finans → verify FinansDashboard component renders |
| X button outside drop zone (no file dialog on click) | BELGE-01 | Client interaction | Select file → click X button → verify dialog does NOT open, selection clears |
| DatePickerField shows Calendar popover | — | Client UI | Click date field in finans form → verify Calendar popover opens (not native picker) |
| Dashboard shows full Turkish month names | — | Client UI | Add entries for multiple months → go to /finans → verify "Ocak", "Şubat" etc. in table |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [ ] `nyquist_compliant: true` — NOT set (17 manual-only verifications remain)

**Approval:** partial 2026-04-13

---

## Validation Audit 2026-04-13

| Metric | Count |
|--------|-------|
| Gaps found | 6 |
| Resolved (automated) | 6 |
| Escalated to manual | 0 |
| Already manual (UI/browser) | 17 |
