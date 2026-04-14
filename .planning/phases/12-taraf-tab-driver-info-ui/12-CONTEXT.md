# Phase 12: Taraf Tab Driver Info UI - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Counter-party (Karşı Taraflar) tab displays and captures driver information (sürücü bilgileri). Five new fields — surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no — already exist in the database schema and tRPC validation (Phase 10). This phase adds the UI: form inputs in edit mode, InfoRow display in view mode, and validation feedback. Schema/DB/tRPC changes are out of scope (already done).

</domain>

<decisions>
## Implementation Decisions

### Form layout & sectioning
- **D-01:** Separate "Diğer Sürücü Bilgileri" Card below the existing "Karşı Taraf Bilgileri" Card — clear visual separation between counter-party info and driver info
- **D-02:** Single shared edit toggle for the whole tab — "Düzenle" / "İptal" button enters/exits edit for both cards simultaneously, matching current pattern

### View mode display
- **D-03:** Driver info section shown below existing info grid only when at least one driver field is filled — completely hidden when all driver fields are empty
- **D-04:** Driver info uses same InfoRow component and 2-column grid layout as existing karşı taraf info

### Validation & UX
- **D-05:** Phone field shows format hint text below: "Format: 05XXXXXXXXX" — Turkish validation error "Geçersiz telefon formatı (05XXXXXXXXX gerekli)" on invalid input (regex already in tRPC schema from Phase 10 D-01)
- **D-06:** Plate field has placeholder "34 ABC 123" but no format enforcement — user validates manually (Phase 10 D-02)

### the agent's Discretion
- Exact field order within driver section
- Empty edit-mode card styling details
- Whether to add field labels in Turkish or use English field names as labels

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Taraf / driver info schema and validation
- `lib/schema.ts` §155-168 — Taraf table with 5 driver columns (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no), all nullable
- `lib/trpc/routers/dosya.ts` §19-35 — tarafSchema Zod validation with surucu_telefon regex and all 5 driver fields
- `components/dosya/karsitaraflar-tab.tsx` — Current Karşı Taraflar tab component (240 lines, edit/view mode, InfoRow pattern, upsertTaraf mutation)
- `components/dosya/dosya-detail-tabs.tsx` §214-220 — KarsitaraflarTab integration with primaryTaraf prop

### Phase 10 decisions (locked)
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — D-01 phone regex, D-02 no plate validation, D-03 nullable fields, D-05 migration approach

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/dosya/karsitaraflar-tab.tsx`: Full edit/view mode pattern with Card, Form, InfoRow, mutation — can be extended or duplicated for driver section
- `InfoRow` component: Already defined in karsitaraflar-tab.tsx (line 55-62) — simple label/value display, reuse for driver fields
- `tarafSchema` in `lib/trpc/routers/dosya.ts`: Zod validation already includes all 5 driver fields with surucu_telefon regex

### Established Patterns
- Card-based edit/view toggle pattern (KarsitaraflarTab)
- Empty state handling: show message + "Düzenle" button when no data
- Form uses `useForm` + `zodResolver` + `upsertTaraf` mutation
- InfoRow grid: 2-column `grid grid-cols-1 md:grid-cols-2 gap-4` layout

### Integration Points
- `upsertTaraf` mutation in `dosya.ts` already accepts all 5 surucu fields
- `getById` query already returns `taraflar` with all fields (including driver fields)
- PrimaryTaraf passed to KarsitaraflarTab via `dosya-detail-tabs.tsx` line 217

</code_context>

<specifics>
## Specific Ideas

- Driver section should feel like a natural extension of the existing Karşı Taraf tab — same visual language, just separated by heading
- Empty driver info = invisible in view mode (clean, no visual clutter)
- Turkish labels for all fields (Sürücü Adı, Sürücü Soyadı, Plaka, Telefon, Poliçe No)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-taraf-tab-driver-info-ui*
*Context gathered: 2026-04-14*