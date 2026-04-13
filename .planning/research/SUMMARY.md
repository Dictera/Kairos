# Project Research Summary

**Project:** Sigorta Uyuşmazlık Takip
**Domain:** Turkish insurance dispute case management (legal domain)
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

This is a **v1.1 milestone** for an existing production legal case management system. The changes are targeted: (1) removing the email field from client (müvekkil) forms, (2) adding driver info fields to the counter-party (taraf) section, and (3) UI/UX improvements. No architecture shifts are needed — the existing stack (Next.js 15, Drizzle ORM, tRPC v11, react-hook-form, Zod, shadcn/ui, Tailwind CSS v4) fully supports all requirements. The existing patterns are well-established in the codebase.

**Key risk:** Database migrations. SQLite `DROP COLUMN` permanently deletes data. Email removal must be preceded by a backup, and migrations must be tested on a copy before production. The primary pitfall is applying schema changes without running the corresponding Drizzle migration, causing runtime crashes.

**Recommended approach:** Foundation-first. Complete schema + tRPC router changes BEFORE touching UI components. The build order from ARCHITECTURE.md (Schema → Router → Form) prevents the most common pitfalls (form validation mismatch, missing migration).

## Key Findings

### Recommended Stack

**No new libraries required.** The existing stack handles all v1.1 requirements:

- **react-hook-form 7.72.1** + **Zod 3.24.0** + **@hookform/resolvers 5.2.2** — form handling and validation
- **Drizzle ORM 0.45.2** + **drizzle-kit 0.31.10** — SQLite schema migrations
- **tRPC 11.16.0** — type-safe API layer with Zod input schemas
- **shadcn/ui** + **Tailwind CSS 4.2.2** — UI components (already installed)

**Avoid:** Any new form library (react-hook-form is sufficient), Prisma (would require full rewrite), `drizzle-kit push` on production data.

### Expected Features

**Must have (table stakes):**
- Client name/phone/TC-Vergi number — legal identification, primary contact
- Case party (taraf) fields — counter-party name, insurance company, policy number, plate
- Driver info fields — name, surname, plate, phone, policy number for the OTHER driver in an incident

**Should have (differentiators):**
- Turkish-specific validation for plate (XX XXX XX format) and phone (05XX format)
- Clear visual separation between counter-party company and driver info
- Smooth tab navigation preserving form state

**Defer (v2+):**
- Multiple user/role authentication (single-user app, single .env password is sufficient)
- Cloud sync (conflicts with offline-first value proposition)
- Email field (solo lawyer uses phone primarily, not needed for court filings)

### Architecture Approach

Next.js 15 App Router with tRPC v11 for type-safe API. Drizzle ORM manages SQLite schema. Forms use react-hook-form with Zod resolver. The case detail page uses a 6-tab shell (Genel Bilgiler, Yargılama Süreci, Belgeler, Notlar/Zaman Çizelgesi, Karşı Taraflar, Dosya Finansı) with URL hash sync.

**Critical pattern:** Driver info lives in `taraf` table (NOT `dosya`). All counter-party data (company, driver, plate, policy) goes to the same table. The existing `upsertTaraf` mutation handles both create and update — extend it, don't create a separate mutation.

### Critical Pitfalls

1. **Production data loss during column removal** — Backup `./data/db.sqlite` before ANY migration. Use `drizzle-kit generate` + `drizzle-kit migrate`, never `push` on production.

2. **Form validation schema mismatch** — Remove email systematically in order: (1) Zod schema, (2) defaultValues, (3) JSX field, (4) tRPC router input. Missing any step causes TypeScript errors or runtime crashes.

3. **Missing database migration for new driver fields** — Schema edit alone doesn't update SQLite. Must run `drizzle-kit migrate` before testing form saves.

4. **Tab state reset on restructure** — Use stable `key` props on tab content (based on tab identifier, not index). Changing tab order breaks user muscle memory and may lose form state.

5. **Missing Turkish validation** — Driver phone and plate fields need Turkish-specific patterns: `05XX XXX XX XX` for phone, `XX XXX XX` format for plates.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Schema & Migration Foundation
**Rationale:** All UI changes depend on schema being correct. Database migration must be verified before any code that uses the new fields.

**Delivers:** 
- 5 new columns added to `taraf` table (suruci_ad, suruci_soyad, suruci_plaka, suruci_telefon, suruci_police_no)
- Drizzle migration file generated and applied
- tRPC `tarafSchema` updated with new input fields

**Avoids:** Pitfall #3 (missing DB migration)

---

### Phase 2: Müvekkil Email Removal
**Rationale:** Safe to do in parallel with Phase 1 but logically separate. Removing a field requires systematic order to avoid form validation mismatches.

**Delivers:**
- Email removed from `muvekkil-form.tsx` (Zod schema, defaultValues, JSX)
- Email removed from `muvekkil` tRPC router input schema
- Drizzle migration to drop `email` column

**Avoids:** Pitfall #2 (schema mismatch)

---

### Phase 3: Taraf Tab Driver Info UI
**Rationale:** UI depends on schema (Phase 1) being complete. This is the main feature deliverable.

**Delivers:**
- Driver info fields added to `KarsitaraflarTab` edit form
- InfoRow display for driver fields in view mode
- "Diğer Sürücü Bilgileri" section header
- Turkish validation for phone and plate formats

**Implements:** `upsertTaraf` mutation extended with new fields

**Avoids:** Pitfall #5 (Turkish validation)

---

### Phase 4: Tab Cleanup (Optional)
**Rationale:** The "Notlar/Zaman Çizelgesi" tab (index 3) is empty. Either fill with placeholder or remove with URL hash redirect.

**Delivers:**
- Either: Empty tab filled with basic notes placeholder
- Or: Tab removed with `handleTabChange` redirect for `/#notlar` URLs

**Avoids:** Pitfall #4 (tab state reset)

---

### Phase Ordering Rationale

1. **Schema first** — All code changes depend on correct schema. Migration verification prevents runtime crashes.
2. **Email removal second** — Independent of driver info, but must follow systematic removal order.
3. **Driver UI third** — Depends on schema migration (Phase 1). Uses existing `upsertTaraf` pattern, extends it.
4. **Tab cleanup last** — Independent, only if scope allows.

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema):** Drizzle migration patterns are well-documented and established in codebase
- **Phase 2 (Email removal):** Form field removal is straightforward — follow the systematic removal order from PITFALLS.md
- **Phase 3 (Driver UI):** Uses existing `KarsitaraflarTab` patterns, `upsertTaraf` mutation, and shadcn/ui components

Phases needing validation during planning:
- **Phase 4 (Tab cleanup):** Decision needed: fill empty tab OR remove with redirect? User preference.
- **Turkish validation:** Confirm exact plate format regex with user — Turkish plates have changed formats over time.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies confirmed in package.json, existing codebase patterns |
| Features | HIGH | Schema analysis + domain knowledge, clear rationale for each field |
| Architecture | HIGH | Well-established patterns in codebase, anti-patterns clearly documented |
| Pitfalls | MEDIUM | Based on general patterns applied to this domain, no external sources specifically for Turkish legal case management |

**Overall confidence:** HIGH

### Gaps to Address

- **Turkish plate format:** Verify exact regex pattern with user. Old format (XX XXX XX) vs new format with dash. Document which format(s) to accept.
- **Turkish phone validation:** Confirm mobile format `05XX XXX XX XX` is sufficient, or if landlines need to be supported.
- **Phase 4 scope:** Tab cleanup is optional — depends on whether user wants the empty "Notlar" tab filled or removed.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (`lib/schema.ts`, `components/muvekkil/muvekkil-form.tsx`, `components/dosya/karsitaraflar-tab.tsx`) — confirmed working patterns
- **package.json** — verified installed versions

### Secondary (MEDIUM confidence)
- **Drizzle docs** — `dropColumn`, `addColumn` migration syntax
- **General database migration patterns** — applied to SQLite/Drizzle context

### Tertiary (LOW confidence)
- **Turkish license plate format** — needs user validation for exact format to accept
- **Turkish phone validation** — may need adjustment based on user feedback

---

*Research completed: 2026-04-13*
*Ready for roadmap: yes*
