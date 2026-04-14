# Roadmap: Sigorta Uyuşmazlık Takip

## Milestones

- ✅ **v1.0 MVP** — Phases 1–9 (shipped 2026-04-13)
- 🚧 **v1.1** — Phases 10–13 (planned)

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
| 8. UI Renewal (Navy + Turuncu) | v1.1 | 3/3 | ✅ Complete |
| 9. Calendar Standardization | v1.1 | 2/2 | ✅ Complete |
| 10. Schema & Migration Foundation | 3/3 | Complete    | 2026-04-13 |
| 11. Müvekkil Email Removal | 2/2 | Complete    | 2026-04-13 |
| 12. Taraf Tab Driver Info UI | 1/1 | Complete    | 2026-04-14 |
| 13. Tab Cleanup & UI/UX | v1.1 | TBD | 📋 Planned |

---

## Current Milestone: v1.1

**Goal:** Müvekkil ve dosya yönetiminde temizlik ve iyileştirme — gereksiz alan çıkarma, yeni alan ekleme, sekme düzeni ve UI/UX.

### Phase 10: Schema & Migration Foundation

**Goal**: Database schema supports new driver fields and email removal is prepared

**Depends on**: Phase 9 (v1.0 last phase)

**Requirements**: TARAF-06, TARAF-09, TARAF-10, MUVEK-06

**Success Criteria** (what must be TRUE):
1. `taraf` table has 5 new columns: surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no
2. Drizzle migration generated and applied to development database
3. tRPC `tarafSchema` accepts all 5 new fields with Turkish phone validation (05XX XXX XX XX)
4. tRPC `tarafSchema` accepts plaka field without format validation (per D-02: user validates manually)
5. Müvekkil email column dropped via Drizzle migration (no backup per D-04: emails unused)

**Plans**: 3 plans

- [x] 10-01-PLAN.md — Add 5 driver columns to taraf + tRPC validation + migration
- [x] 10-02-PLAN.md — Drop email column from muvekkil + migration
- [x] 10-03-PLAN.md — Gap closure: Remove email from muvekkil-form.tsx

**UI hint**: no

---

### Phase 11: Müvekkil Email Removal

**Goal**: Email field completely removed from müvekkil forms

**Depends on**: Phase 10

**Requirements**: MUVEK-05

**Success Criteria** (what must be TRUE):
1. Müvekkil create/edit form has no email input field
2. tRPC `muvekkilRouter` create/update procedures accept no email field
3. Existing müvekkil records display correctly without email
4. Müvekkil list displays without email column

**Plans**: 2 plans

- [x] 11-01-PLAN.md — Regenerate drizzle metadata (nuclear approach)
- [x] 11-02-PLAN.md — Schema verification test + visual verification

**UI hint**: yes

---

### Phase 12: Taraf Tab Driver Info UI

**Goal**: Counter-party tab displays and captures driver information

**Depends on**: Phase 10

**Requirements**: TARAF-07, TARAF-08

**Success Criteria** (what must be TRUE):
1. "Diğer Sürücü Bilgileri" section visible in Taraf edit form with 5 fields
2. Driver info displays in InfoRow format in view mode
3. Form saves driver info via existing upsertTaraf mutation
4. Turkish phone format (05XX XXX XX XX) validated on submit
5. Turkish plate format (XX XXX XX) validated on submit

**Plans**: 1 plan

- [x] 12-01-PLAN.md — Extend karsitaraflar-tab.tsx with driver info type/schema/form/view-mode

**UI hint**: yes

---

### Phase 13: Tab Cleanup & UI/UX

**Goal**: Empty tab resolved, Dosyalar and Müvekkiller UI/UX improved

**Depends on**: Phase 12

**Requirements**: TAB-01, TAB-02, UIUX-01

**Success Criteria** (what must be TRUE):
1. "Notlar/Zaman Çizelgesi" tab either filled with notes placeholder OR removed with URL redirect
2. Dosya detail tabs have required sections added/removed per TAB-02
3. Müvekkil list and form pages show measurable UI/UX improvements
4. Dosya list and form pages show measurable UI/UX improvements

**Plans**: TBD

**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 10. Schema & Migration Foundation | 0/2 | 📋 Planned | - |
| 11. Müvekkil Email Removal | 0/4 | Not started | - |
| 12. Taraf Tab Driver Info UI | 0/5 | Not started | - |
| 13. Tab Cleanup & UI/UX | 0/4 | Not started | - |

---

*Roadmap created: 2026-04-13*
*Phases: 10-13 (v1.1 milestone)*
