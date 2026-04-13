# Roadmap: Sigorta Uyuşmazlık Takip

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-04-13)
- 🚧 **v1.1** — Phases 8–9 (planned)

## Phase Progress

| Phase | Milestone | Plans | Status |
|-------|----------|-------|--------|
| 1. Foundation | v1.0 | 5/5 | ✅ Complete |
| 2. Core Case Management | v1.0 | 4/4 | ✅ Complete |
| 3. STK & Mahkeme Process Tracking | v1.0 | 3/3 | ✅ Complete |
| 4. Deadline Engine + Dashboard | v1.0 | 4/4 | ✅ Complete |
| 5. Calendar View | v1.0 | 2/2 | ✅ Complete |
| 6. Documents + Finance | v1.0 | 4/4 | ✅ Complete |
| 7. Petition Templates + PDF + Reports | v1.0 | 4/4 | ✅ Complete |
| 8. UI Renewal (Navy + Turuncu) | v1.1 | 3/3 | 🚧 In Progress |
| 9. Calendar Standardization | v1.1 | 2/2 | 📋 Planned |

---

## Current Milestone: v1.1

<details>
<summary>✅ v1.0 MVP — SHIPPED 2026-04-13</summary>

Full milestone details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## Phase 8: UI Renewal (Navy + Turuncu)

**Goal:** Replace the teal palette with Navy + Turuncu (#032539 / #FA991C / #1C768F / #FBF3F2), migrate the sidebar and login page off hardcoded colors, and front-load the 23 shadcn/ui components that Phase 2-7 feature work will consume.

**Depends on:** Phase 7

**Plans:** 3 plans

- [ ] 08-01: Theme tokens — replace globals.css palette with Navy + Turuncu oklch tokens
- [ ] 08-02: Install 23 shadcn components for Phase 2-7 consumption
- [ ] 08-03: Migrate sidebar and login page to new theme

---

## Phase 9: Calendar Standardization

**Goal:** Standardize all calendar/date-picker UI components to match the reference implementation — Turkish locale (dd.MM.yyyy format, Monday week start), Navy + Turuncu color palette, shared DatePickerField component.

**Depends on:** Phase 8

**Plans:** 2 plans

- [ ] 09-01: Extract DatePickerField to shared component
- [ ] 09-02: Update all forms to use shared DatePickerField

---

## v1.0 Definition of Done

1. `next dev` starts; login works with `.env` password
2. 200+ case files with <1s list load; Turkish search works
3. STK 9-stage + Mahkeme 8-stage tracker fully functional
4. Multiple durusma records per case
5. Calendar with clickable event links to case detail
6. Deadline auto-calc (STK 10d, istinaf 14d, cevap 14d)
7. Dashboard with hearings + deadlines + stats
8. Document upload 20MB to E:/sigorta-belgeler/
9. Finance entries + per-case net balance
10. Petition templates with PDF generation (Turkish chars)
11. Portfolio + financial reports (PDF + Excel export)

