# Roadmap: Sigorta Uyuşmazlık Takip

**Milestone:** v1.0 — Complete case management system
**Goal:** Deliver a fully offline, localhost-only web app that lets a solo lawyer track 200+ insurance dispute files across STK and court stages, with deadlines, hearings, documents, finance, and petition PDF generation — replacing Excel and paper folders.
**Stack:** Next.js 15, SQLite (better-sqlite3), Drizzle ORM, tRPC v11, shadcn/ui, Tailwind CSS v3, TypeScript strict

---

## Overview

Seven phases build the system from the ground up. Phase 1 lays the technical foundation. Phase 2 delivers core case + client data management. Phase 3 adds the STK/court process tracking that is the app's primary differentiator. Phase 4 wires the deadline engine to a dashboard. Phase 5 adds the calendar view. Phase 6 completes the document and finance modules. Phase 7 caps the milestone with petition PDF generation and reports.

Every phase exits with a working, verifiable capability. No phase is a horizontal technical layer.

---

## Phases

- [ ] **Phase 1: Foundation** — Next.js 15 scaffold with SQLite, tRPC, auth, and base UI wired up
- [ ] **Phase 2: Core Case Management** — Dosya + Müvekkil CRUD, Ayarlar, all with full list/detail/edit flows
- [ ] **Phase 3: STK & Mahkeme Process Tracking** — Süreç aşamaları, duruşma kayıtları, karşı taraf bilgileri
- [ ] **Phase 4: Deadline Engine + Dashboard** — Otomatik süre hesaplama, adli tatil uyarısı, ana panel
- [ ] **Phase 5: Calendar View** — Takvim: duruşma ve sürelerin görsel aylık görünümü
- [ ] **Phase 6: Documents + Finance** — Belge yükleme, finans kalemleri, dosya bazlı finansal özet
- [ ] **Phase 7: Petition Templates + PDF + Reports** — Dilekçe şablon sistemi, PDF çıktı, portföy/finansal raporlar

---

## Phase Details

### Phase 1: Foundation
**Goal**: Working Next.js 15 app with SQLite connection, tRPC route handler, env-based auth, and shadcn/ui base layout — the entire technical skeleton verified before any feature work.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. `next dev` starts without errors; `localhost:3000` redirects to `/login` when unauthenticated
  2. Correct password from `.env` logs the user in and sets a signed HttpOnly cookie; wrong password is rejected
  3. Protected pages redirect to `/login` when the cookie is absent; protected pages load when authenticated
  4. tRPC health-check procedure returns a success response from the browser (confirms fetchRequestHandler, superjson, and protectedProcedure all work)
  5. `drizzle-kit generate` produces a migration file; `drizzle-kit migrate` applies it to `./data/db.sqlite` without errors
**Plans**: 5 plans

Plans:
- [x] 01-01: Project scaffold + next.config.ts (`serverExternalPackages: ['better-sqlite3']`, TypeScript strict, path aliases)
- [x] 01-02: SQLite + Drizzle ORM (connection singleton with WAL pragma, busy_timeout, foreign_keys; `generate`+`migrate` workflow; initial schema stubs)
- [x] 01-03: tRPC v11 route handler (`fetchRequestHandler`, superjson transformer, `createCallerFactory`, `publicProcedure`, `protectedProcedure`, health-check procedure)
- [x] 01-04: Env-based auth (login page, `iron-session` signed HttpOnly cookie, `middleware.ts` guard for all routes except `/login` and `/api/trpc`)
- [x] 01-05: Base layout (sidebar navigation with all top-level route links, shadcn/ui component init, Tailwind theme, TRPCProvider + QueryClientProvider)

**UI hint**: yes

---

### Phase 2: Core Case Management
**Goal**: Users can create, list, search, filter, view, edit, and archive both client records and case files — including counter-party details and settings definitions — giving the lawyer a complete, searchable registry of their practice.
**Depends on**: Phase 1
**Requirements**: MUVEK-01, MUVEK-02, MUVEK-03, MUVEK-04, DOSYA-01, DOSYA-02, DOSYA-03, DOSYA-04, DOSYA-05, AYAR-01, AYAR-02, AYAR-03
**Success Criteria** (what must be TRUE):
  1. User can create a new client record and see it appear immediately in the client list with search working
  2. User can create a new case file (with user-entered dosya no, case type, insurance type, claim amount, and linked client) and see it in the case list
  3. Case list loads in under 1 second with 200+ records; filtering by type/status/date and searching by dosya no or client name works
  4. Case detail page shows all 6 tabs (Genel Bilgiler, Yargılama Süreci, Belgeler, Notlar/Zaman Çizelgesi, Karşı Taraflar, Dosya Finansı) — content in Yargılama Süreci, Belgeler, Notlar, and Dosya Finansı tabs may be empty at this phase
  5. Counter-party fields (sigorta şirketi adı, karşı vekil, poliçe no) are editable on a case and persist correctly
  6. Deleting a client with linked cases shows a warning before allowing deletion; settings definitions (insurance companies, courts) can be added, edited, and deleted
**Plans**: 4 plans

Plans:
- [x] 02-01: Drizzle schema for `muvekkil`, `dosya`, `taraf` tables with FK cascade rules; tRPC routers for muvekkil and ayarlar CRUD
- [x] 02-02: Müvekkil list, detail, create/edit/delete pages with search and linked-case count
- [x] 02-03: Dosya list page (server-side filtered query, `<1s` for 200+ rows), create/edit form (6-tab detail shell, Genel Bilgiler + Karşı Taraflar tabs filled)
- [x] 02-04: Ayarlar page (sigorta şirketi ve mahkeme/kurum tanımları CRUD; env şifre değiştirme kılavuzu)

**UI hint**: yes

---

### Phase 3: STK & Mahkeme Process Tracking
**Goal**: Users can record and advance STK tahkim and court process stages for each case, log multiple hearings, and see the full process timeline — making per-file stage tracking the core daily workflow.
**Depends on**: Phase 2
**Requirements**: SUREC-01, SUREC-02, SUREC-03, SUREC-04, SUREC-05
**Success Criteria** (what must be TRUE):
  1. For an STK file, the user can set and advance the current stage through all 9 STK aşamaları (BAŞVURU → KARAR_KESİNLEŞTİ) and fill all STK data points (başvuru no, kabul tarihi, raportör adı, hakem karar tarihi, tebligat tarihi, itiraz tarihi)
  2. For a court file, the user can set and advance the current stage through all 8 mahkeme aşamaları (DAVA_AÇILDI → KESİNLEŞTİ) and fill all court data points (Esas No, Karar No, mahkeme adı, karar tarihi)
  3. A case can have multiple hearing records (duruşma); each duruşma shows date, time, venue, type, and notes
  4. The Yargılama Süreci tab on the case detail page shows current stage, a visual stage progression, and a list of all hearings in chronological order
  5. All entered process data persists across page refreshes
**Plans**: 3 plans

Plans:
- [x] 03-01: Drizzle schema for `surec_detay` (JSON column on dosya for type-specific state), `durusma` table; tRPC router procedures for stage advancement and duruşma CRUD
- [x] 03-02: STK process UI — stage stepper, data-point form fields (STK-specific), stage advancement action
- [x] 03-03: Mahkeme process UI — stage stepper, data-point form fields (court-specific), duruşma add/edit/delete list with sorting

**UI hint**: yes

---

### Phase 4: Deadline Engine + Dashboard
**Goal**: Users can see all approaching deadlines and today's hearings on the dashboard — with automatic deadline calculation for STK objection, appeal, and reply periods — so they can never miss a critical legal date.
**Depends on**: Phase 3
**Requirements**: SURE-01, SURE-02, SURE-03, SURE-04, SURE-05, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. Dashboard loads and shows today's hearings, total/active/this-month file counts, and upcoming deadlines within 7 and 14 days
  2. Deadline items are color-coded: red for items due in fewer than 3 days, yellow for fewer than 7 days
  3. When a tebligat date is entered on an STK file, the system automatically calculates the 10-day itiraz süresi deadline and displays it
  4. When a mahkeme kararı tebligat date is entered, the 14-day istinaf başvuru süresi is auto-calculated; when a dava tebligat date is entered, the 14-day cevap dilekçesi süresi is auto-calculated
  5. A manual deadline (with custom name, date, and notes) can be added to any case and appears in the dashboard deadline list
  6. Deadlines falling within the adli tatil period (20 July–31 August) show a visible warning label — the user is prompted to verify manually; no automatic date extension is applied
**Plans**: 4 plans

Plans:
- [x] 04-01: Drizzle schema for `sure` (deadlines) table; deadline calculation service (STK 10-day, istinaf 14-day, cevap 14-day rules; adli tatil overlap detection)
- [x] 04-02: tRPC procedures for deadline read/write; auto-calculation triggers when process dates are saved; manual deadline entry form on case detail
- [x] 04-03: Dashboard page (upcoming deadlines widget, today's hearings list, summary stats, color-coded urgency badges)
- [x] 04-04: Fix review findings — CR-01 timezone off-by-one (dashboard.ts), WR-01 unused parseISO import (deadline-service.ts), IN-01 silent deleteSure (sure.ts)

**UI hint**: yes

---

### Phase 5: Calendar View
**Goal**: Users can see all hearings and deadlines laid out on a monthly calendar and navigate to any case directly from a calendar event — giving a spatial, at-a-glance view of the month's workload.
**Depends on**: Phase 4
**Requirements**: TAKVIM-01, TAKVIM-02
**Success Criteria** (what must be TRUE):
  1. Calendar page renders a full monthly grid with all hearing dates and deadline dates visually marked
  2. Clicking on a hearing event on the calendar navigates to the corresponding case detail page
  3. Clicking on a deadline event on the calendar navigates to the corresponding case detail page
  4. User can navigate to previous and next months; events for those months load correctly
**Plans**: 2 plans

Plans:
- [x] 05-01: tRPC calendar query (fetch all duruşma + sure records for a given month range, keyed by date); Turkish locale configuration for shadcn Calendar (`tr` locale, Monday week start)
- [x] 05-02: Calendar page UI — monthly grid with event dots/badges per day, event popover on click showing case link, prev/next month navigation

**UI hint**: yes

---

### Phase 6: Documents + Finance
**Goal**: Users can upload case documents (PDFs, images, Word files) and log all financial transactions per case — incoming payments, outgoing payments, and expenses — with a per-case financial summary and a finance dashboard.
**Depends on**: Phase 2
**Requirements**: BELGE-01, BELGE-02, BELGE-03, BELGE-04, FINANS-01, FINANS-02, FINANS-03, FINANS-04, FINANS-05, FINANS-06
**Success Criteria** (what must be TRUE):
  1. User can upload a file (PDF, DOC, DOCX, JPG, PNG up to 20 MB) to a case; it appears in the Belgeler tab with category label and upload date
  2. Uploaded files are stored at `public/uploads/{dosyaId}/` and accessible via static URL (no auth route needed for localhost)
  3. User can delete a document; it is removed from disk and from the database
  4. User can log a finance entry (type: Gelen/Giden/Masraf, amount, date, description) against a case; it appears in the Dosya Finansı tab
  5. Dosya Finansı tab shows total received, total paid out, and net balance for the case
  6. The finance dashboard page shows monthly and yearly income/expense summaries across all cases
**Plans**: 3 plans

Plans:
- [ ] 06-01: Drizzle schema for `belge` and `finans_kalemi` tables; file upload route handler (multipart `Request.formData()`, 20 MB limit, disk write to `public/uploads/{dosyaId}/`); document delete (disk + DB)
- [ ] 06-02: Belgeler tab UI (upload form, document list with category/date, delete action); BELGE tRPC router
- [ ] 06-03: Finans CRUD (tRPC router covering Gelen/Giden/Masraf types), Dosya Finansı tab UI (entry list + per-case summary), finance dashboard page (aylık/yıllık overview)

**UI hint**: yes

---

### Phase 7: Petition Templates + PDF + Reports
**Goal**: Users can create petition templates with named variables, generate a filled PDF from any case's data, optionally save the generated PDF back to the case's document list, and export portfolio and financial reports as PDF or Excel.
**Depends on**: Phase 6
**Requirements**: DILEKCE-01, DILEKCE-02, DILEKCE-03, DILEKCE-04, DILEKCE-05, RAPOR-01, RAPOR-02, RAPOR-03
**Success Criteria** (what must be TRUE):
  1. User can create a petition template with a rich-text body containing `{{variable}}` placeholders and save it
  2. From any case, user can select a template, see all variables auto-filled from case data, preview the result, and download a PDF
  3. The generated PDF renders all Turkish characters correctly — ş, ğ, ü, ö, ç, ı, İ are all visible and ungarbled (Roboto or DejaVu TTF embedded)
  4. User can save the generated PDF back to the case's Belgeler list with a single action
  5. Portfolio report shows active/passive case counts and breakdown by type and process stage; can be exported as PDF
  6. Financial report shows monthly and yearly income/expense summary; can be exported as PDF or Excel
  7. Filtered case list can be exported as Excel (XLSX)
**Plans**: 4 plans

Plans:
- [ ] 07-01: Turkish font validation spike — generate a test PDF with Roboto/DejaVu TTF embedded, verify all Turkish glyphs render correctly; select and lock in PDF library choice (`pdfmake` or `@react-pdf/renderer`)
- [ ] 07-02: Petition template system — Drizzle schema for `dilekce_sablonu`; template create/edit UI with variable insertion helper; DILEKCE tRPC router
- [ ] 07-03: PDF generation flow — variable substitution service (pulls case data into template), PDF preview route, download endpoint, optional save-to-belge action
- [ ] 07-04: Reports page — portföy raporu and finansal rapor with PDF export; filtered dosya listesi Excel (XLSX) export

**UI hint**: yes

---

## Coverage Matrix

| Phase | Requirements | Count |
|-------|-------------|-------|
| Phase 1 | FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06 | 6 |
| Phase 2 | MUVEK-01, MUVEK-02, MUVEK-03, MUVEK-04, DOSYA-01, DOSYA-02, DOSYA-03, DOSYA-04, DOSYA-05, AYAR-01, AYAR-02, AYAR-03 | 12 |
| Phase 3 | SUREC-01, SUREC-02, SUREC-03, SUREC-04, SUREC-05 | 5 |
| Phase 4 | SURE-01, SURE-02, SURE-03, SURE-04, SURE-05, DASH-01, DASH-02 | 7 |
| Phase 5 | TAKVIM-01, TAKVIM-02 | 2 |
| Phase 6 | BELGE-01, BELGE-02, BELGE-03, BELGE-04, FINANS-01, FINANS-02, FINANS-03, FINANS-04, FINANS-05, FINANS-06 | 10 |
| Phase 7 | DILEKCE-01, DILEKCE-02, DILEKCE-03, DILEKCE-04, DILEKCE-05, RAPOR-01, RAPOR-02, RAPOR-03 | 8 |

**Total v1 requirements:** 51
**Mapped:** 51
**Gap:** 0 ✓

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/5 | In Progress|  |
| 2. Core Case Management | 0/4 | Not started | - |
| 3. STK & Mahkeme Process Tracking | 0/3 | Not started | - |
| 4. Deadline Engine + Dashboard | 0/3 | Not started | - |
| 5. Calendar View | 2/2 | Ready to execute | - |
| 6. Documents + Finance | 0/3 | Not started | - |
| 7. Petition Templates + PDF + Reports | 0/4 | Not started | - |

**Total plans:** 24

### Phase 8: UI Yenileme: renk paleti degisikligi ve shadcn-ui bilesenleri

**Goal:** Replace the teal palette with Navy + Turuncu (#032539 / #FA991C / #1C768F / #FBF3F2), migrate the sidebar and login page off hardcoded colors, and front-load the 23 shadcn/ui components that Phase 2-7 feature work will consume — a pure theme + component infrastructure refresh with zero feature page changes.
**Requirements**: none (infrastructure-only phase; no v1 functional requirements)
**Depends on:** Phase 7
**Plans:** 3 plans

Plans:
- [ ] 08-01-PLAN.md — Theme tokens: replace globals.css palette with Navy + Turuncu oklch tokens and switch dashboard layout to bg-background
- [ ] 08-02-PLAN.md — Install 23 shadcn components (form group, layout/data, modals/notifications, advanced) for Phase 2-7 consumption
- [ ] 08-03-PLAN.md — Migrate app-sidebar.tsx off teal hardcodes, rewrite login page with shadcn Card+Button+Input+Label, human-verify checkpoint

### Phase 9: Projedeki bütün takvim görünümlerinin dosyalar/dosya detayı/yargılama sürecinde bulunan takvimler gibi olmasını istiyorum

**Goal:** Standardize all calendar/date-picker UI components to match the reference implementation in dosyalar/dosya detayı/yargılama süreci — Turkish locale (dd.MM.yyyy format, Monday week start), Navy + Turuncu color palette, shared DatePickerField component.
**Requirements**: none (UI standardization only)
**Depends on:** Phase 8
**Plans:** 2 plans

Plans:
- [x] 09-01-PLAN.md — Extract DatePickerField to shared component and update SureList date inputs
- [x] 09-02-PLAN.md — Update reference forms to use shared DatePickerField and update DosyaList filters

---

## Milestone Success Criteria

When all 7 phases are complete and ALL of the following are true, v1.0 is done:

1. The app starts with `next dev` on localhost:3000 with no errors; login with `.env` password grants access
2. A lawyer can create client records and 200+ case files; the case list loads in under 1 second with functional search and filters
3. Each STK case has a complete 9-stage process tracker with all STK data points filled; each court case has an 8-stage tracker with all court data points
4. Every case can hold multiple hearing records; all hearing dates appear on the monthly calendar with clickable links to case detail
5. The deadline engine auto-calculates STK itiraz (10 days), istinaf başvuru (14 days), and cevap dilekçesi (14 days) periods from their trigger dates; deadlines in adli tatil show a warning badge
6. The dashboard shows today's hearings, approaching deadlines color-coded by urgency, and portfolio summary stats
7. Documents (PDF, Word, images) up to 20 MB can be uploaded to a case, stored in `public/uploads/`, and deleted
8. Finance entries covering incoming payments, outgoing payments, and expenses can be logged per case; each case shows net balance; the finance dashboard shows monthly/yearly totals
9. Petition templates with `{{variable}}` placeholders can be created; a filled PDF can be generated from any case's data; all Turkish characters (ş, ğ, ü, ö, ç, ı, İ) render correctly in the PDF output
10. Portfolio and financial reports can be exported as PDF; the filtered case list can be exported as Excel
