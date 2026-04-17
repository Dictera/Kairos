# Phase 12: Taraf Tab Driver Info UI - Research

**Researched:** 2026-04-14
**Domain:** React/Next.js UI form extension in Turkish insurance tracking app
**Confidence:** HIGH

## Summary

Phase 12 extends the existing `KarsitaraflarTab` component to add a "Diğer Sürücü Bilgileri" (Driver Information) section with 5 new fields. The database schema, tRPC validation, and mutation already exist (Phase 10). This phase is purely UI: extending the existing edit/view pattern, updating the TypeScript `TarafRow` type, and wiring up form fields that already have backend support.

The existing `karsitaraflar-tab.tsx` (240 lines) provides a complete reference pattern: Card-based layout, `useForm` + `zodResolver` + `upsertTaraf` mutation, InfoRow display in view mode, and empty state handling. The driver section follows the exact same pattern in a separate Card below the existing one, sharing one edit toggle.

**Primary recommendation:** Extend `karsitaraflar-tab.tsx` in-place — add driver fields to the existing type, schema, form, and view mode. Do NOT create a separate component for the driver section since the shared edit toggle (D-02) means both cards must share state.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Separate "Diğer Sürücü Bilgileri" Card below the existing "Karşı Taraf Bilgileri" Card — clear visual separation between counter-party info and driver info
- **D-02:** Single shared edit toggle for the whole tab — "Düzenle" / "İptal" button enters/exits edit for both cards simultaneously, matching current pattern
- **D-03:** Driver info section shown below existing info grid only when at least one driver field is filled — completely hidden when all driver fields are empty
- **D-04:** Driver info uses same InfoRow component and 2-column grid layout as existing karşı taraf info
- **D-05:** Phone field shows format hint text below: "Format: 05XXXXXXXXX" — Turkish validation error "Geçersiz telefon formatı (05XXXXXXXXX gerekli)" on invalid input (regex already in tRPC schema from Phase 10 D-01)
- **D-06:** Plate field has placeholder "34 ABC 123" but no format enforcement — user validates manually (Phase 10 D-02)

### the agent's Discretion
- Exact field order within driver section
- Empty edit-mode card styling details
- Whether to add field labels in Turkish or use English field names as labels

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TARAF-07 | Taraf formunda "Diğer Sürücü Bilgileri" bölümü oluşturulur — yukarıdaki 5 alan ile | Form pattern in karsitaraflar-tab.tsx; extend editSchema + TarafRow type; add driver Card section |
| TARAF-08 | Sürücü bilgileri görüntüleme modunda gösterilir — InfoRow bileşeni ile | Reuse InfoRow component (lines 55-62); 2-column grid; conditional visibility (D-03) |
| TARAF-09 | Türkçe telefon formatı doğrulaması eklenir — 05XX XXX XX XX formatı | Zod regex already in tRPC tarafSchema; client-side schema mirrors server validation; hint text (D-05) |
| TARAF-10 | Plaka formatı doğrulaması eklenir — XX XXX XX formatı | No validation enforced (D-06); placeholder only; server accepts any string |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.72.1 | Form state management | Already used in karsitaraflar-tab.tsx; handles controlled inputs, validation, submission [VERIFIED: npm registry] |
| zod | 3.24.0+ (project) | Schema validation | Already used for editSchema and tRPC validation; zodResolver integration [VERIFIED: project package.json] |
| @hookform/resolvers | 5.2.2 | Zod ↔ react-hook-form bridge | Already used with zodResolver in existing form [VERIFIED: npm registry] |
| @tanstack/react-query | 5.97.0+ (project) | Server state management | Already used for mutation and query invalidation [VERIFIED: project package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/components/ui/card | local (shadcn) | Card layout component | Already used in karsitaraflar-tab.tsx for view/edit cards |
| @/components/ui/input | local (shadcn) | Text input fields | Already used for form fields |
| @/components/ui/form | local (shadcn) | FormField, FormItem, FormLabel, FormMessage | Already used — standard shadcn form pattern |
| @/components/ui/button | local (shadcn) | Buttons | Already used for edit/save/cancel |
| sonner | 2.0.7 (project) | Toast notifications | Already used for success/error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending existing editSchema | Separate driver-only schema | Separate schema adds complexity for no gain — D-02 requires shared toggle so forms submit together |
| Separate DriverInfoCard component | Monolithic extension of KarsitaraflarTab | Separate component viable but requires lifting edit state; since D-02 says shared toggle, extending in-place keeps state management simple |

**Installation:** No new packages needed. All dependencies already in project.

**Version verification:** react-hook-form 7.72.1 confirmed current (latest) [VERIFIED: npm registry]. zod project uses ^3.24.0 (latest is 4.3.6 but project is pinned to v3 line — do NOT upgrade mid-phase).

## Architecture Patterns

### Recommended Project Structure
```
components/dosya/
├── karsitaraflar-tab.tsx    # EDIT IN-PLACE — add driver Card + fields
├── dosya-detail-tabs.tsx    # MINOR UPDATE — extend TarafRow type if needed here
├── genel-bilgiler-tab.tsx  # NO CHANGE
└── ...
```

### Pattern 1: Card-Based Edit/View Toggle (Existing — Extend)
**What:** Single `isEditing` state controls both Cards simultaneously (per D-02). In view mode, Cards show InfoRow grid. In edit mode, Cards show form fields. Empty state shows message + "Düzenle" button.
**When to use:** Always — this is the established pattern, locked by D-02.
**Example:**
```tsx
// Existing pattern from karsitaraflar-tab.tsx — extend this
const [isEditing, setIsEditing] = useState(false)

// View mode: InfoRow grid
if (!isEditing && !isEmpty) {
  return <Card>...<InfoRow label="X" value={taraf?.x} />...</Card>
}

// Edit mode: Form fields  
if (isEditing) {
  return <Card>...<FormField name="x" />...</Card>
}
```

### Pattern 2: InfoRow Display (Existing — Reuse)
**What:** Simple label/value display component with `—` fallback for null values.
**Example:**
```tsx
// Already defined at line 55-62 in karsitaraflar-tab.tsx
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}
```

### Pattern 3: Zod Edit Schema (Existing — Extend)
**What:** Client-side Zod schema mirrors server validation. Empty strings treated as `undefined` via `.or(z.literal(''))` pattern.
**Example:**
```tsx
// Existing editSchema — extend with 5 driver fields
const editSchema = z.object({
  // ... existing fields ...
  surucu_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_soyad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  surucu_telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .nullable()
    .optional()
    .or(z.literal('')),
  surucu_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
})
```

### Pattern 4: Conditional Visibility (D-03)
**What:** Driver info Card in view mode only rendered when at least one driver field has data. Completely hidden otherwise — no empty Card with dashed borders.
**Example:**
```tsx
const hasDriverInfo = !!(
  taraf?.surucu_ad || taraf?.surucu_soyad || 
  taraf?.surucu_plaka || taraf?.surucu_telefon || taraf?.surucu_police_no
)

// In view mode JSX (after existing Card):
{hasDriverInfo && (
  <Card>
    <CardHeader><CardTitle>Diğer Sürücü Bilgileri</CardTitle></CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Sürücü Adı" value={taraf?.surucu_ad} />
        ...
      </div>
    </CardContent>
  </Card>
)}
```

### Anti-Patterns to Avoid
- **Separate edit toggle for driver Card:** D-02 locks shared toggle — do NOT add a second `isEditingDriver` state
- **Creating a new component file for driver section:** Shared toggle means both cards need the same `isEditing` state; splitting into separate files requires prop drilling or context — keep in one file
- **Phone format with spaces in stored value:** The regex `/^05[0-9]{9}$/` validates digits only. Do NOT store formatted "05XX XXX XX XX" — store raw "05XXXXXXXXX" and format only for display if needed
- **Omitting driver fields from TarafRow type:** The `primaryTaraf` from `getById` already returns all columns via `taraflar: true` — the TypeScript type MUST include all 5 surucu fields to prevent runtime undefined issues

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone validation regex | Custom validator | Zod `.regex(/^05[0-9]{9}$/, ...)` from tarafSchema | Already defined server-side; mirror it client-side exactly |
| Form state management | Manual useState per field | react-hook-form `useForm` | Already used in existing component; handles dirty state, validation, submission |
| Form validation | Manual if/else checks | zodResolver + Zod schema | Already used; provides FormMessage integration and error display |
| Toast notifications | Custom alert/toast | `sonner` toast | Already used in existing success/error handlers |
| Mutation/cache invalidation | Manual fetch + state update | react-query `useMutation` + `invalidateQueries` | Already used; handles loading states, cache busting, error handling |
| Card/UI components | Custom card divs | shadcn Card, CardHeader, CardTitle, CardContent | Already used; consistent styling with rest of app |

**Key insight:** Every piece of infrastructure this phase needs already exists in the codebase. The task is purely additive — extending types, schemas, forms, and rendering.

## Runtime State Inventory

> This is a UI-only phase — no database migrations, no service configs, no OS registrations, no secrets, no build artifacts.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — driver columns already exist in DB (Phase 10) | None |
| Live service config | None — no services modified | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None | None |

## Common Pitfalls

### Pitfall 1: TarafRow Type Missing Driver Fields
**What goes wrong:** The `TarafRow` type in `karsitaraflar-tab.tsx` (lines 29-37) currently excludes driver fields. TypeScript won't error on missing fields, but runtime access like `taraf?.surucu_ad` will be `undefined` despite data being present.
**Why it happens:** Drizzle query returns all columns with `taraflar: true`, but the component's local type doesn't include new fields.
**How to avoid:** Update `TarafRow` type to include all 5 driver fields (`surucu_ad`, `surucu_soyad`, `surucu_plaka`, `surucu_telefon`, `surucu_police_no`) as `string | null`.
**Warning signs:** Driver InfoRows show `—` even when data exists in the database.

### Pitfall 2: Phone Validation Mismatch Between Client and Server
**What goes wrong:** Client-side editSchema uses a different regex than server-side tarafSchema, causing form submission failures.
**Why it happens:** Copy-paste error or forgetting to mirror exactly.
**How to avoid:** Use EXACTLY the same regex `/^05[0-9]{9}$/` and error message from `lib/trpc/routers/dosya.ts` lines 29-31. Copy the Zod definition verbatim.
**Warning signs:** Form passes client validation but tRPC rejects the value, or vice versa.

### Pitfall 3: Empty String vs Null Handling
**What goes wrong:** The form sends empty strings `""` instead of `null`/`undefined` for empty driver fields, causing the server to store empty strings rather than NULLs.
**Why it happens:** HTML input fields default to empty string; the `|| undefined` conversion in `onSubmit` must cover ALL fields.
**How to avoid:** Mirror the existing pattern exactly: `values.surucu_ad || undefined` for all 5 driver fields in `onSubmit`.
**Warning signs:** Database shows empty strings `""` instead of NULL for driver fields; `hasDriverInfo` check fails (empty string is truthy).

### Pitfall 4: Form Default Values Not Including New Fields
**What goes wrong:** `useForm` defaultValues doesn't include driver fields, causing controlled/uncontrolled input warnings or stale values.
**Why it happens:** Adding FormFields without adding defaults to useForm configuration.
**How to avoid:** Add all 5 driver fields to `defaultValues` in the `useForm` call, using `taraf?.surucu_ad ?? ''` pattern.
**Warning signs:** React console warnings about changing controlled/uncontrolled inputs; form values not resetting on cancel.

### Pitfall 5: Shared Edit Toggle But Separate Save Button
**What goes wrong:** Two separate save buttons (one per Card) that submit independently — user saves counter-party info but not driver info, or vice versa.
**Why it happens:** Copying the existing Card's save button into the new driver Card without considering the shared toggle.
**How to avoid:** Per D-02, both Cards share ONE form with ONE submit handler. The save/cancel buttons go at the bottom of the ENTIRE edit view, below both Cards.
**Warning signs:** Two separate `<form>` elements or two separate `onSubmit` handlers.

### Pitfall 6: Driver Card Shown Empty in View Mode
**What goes wrong:** A completely empty "Diğer Sürücü Bilgileri" Card visible in view mode, making the UI look cluttered.
**Why it happens:** Rendering the driver Card unconditionally instead of checking if any driver fields are filled.
**How to avoid:** Use `hasDriverInfo` guard (pattern in Pattern 4) — only render driver Card when at least one field has data.
**Warning signs:** Empty Card with `—` placeholders visible for records with no driver info.

## Code Examples

### Extending TarafRow Type
```tsx
// Source: Existing karsitaraflar-tab.tsx lines 29-37 — EXTEND with driver fields
type TarafRow = {
  id: number
  dosya_id: number
  sigorta_sirketi_id: number | null
  karsitaraf_ad: string | null
  karsitaraf_vekil: string | null
  police_no: string | null
  karsitaraf_plaka: string | null
  // ↓ NEW — driver fields from Phase 10 schema
  surucu_ad: string | null
  surucu_soyad: string | null
  surucu_plaka: string | null
  surucu_telefon: string | null
  surucu_police_no: string | null
}
```

### Extending Edit Schema with Phone Validation
```tsx
// Source: Existing editSchema + tRPC tarafSchema — mirror exact phone validation
const editSchema = z.object({
  // ... existing fields ...
  surucu_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_soyad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  surucu_telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .nullable()
    .optional()
    .or(z.literal('')),
  surucu_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
})
```

### Phone Field with Format Hint
```tsx
// Source: CONTEXT.md D-05 — format hint below phone field
<FormField
  control={form.control}
  name="surucu_telefon"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Telefon</FormLabel>
      <FormControl>
        <Input placeholder="05XXXXXXXXX" {...field} />
      </FormControl>
      <p className="text-xs text-muted-foreground">Format: 05XXXXXXXXX</p>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Plate Field with Placeholder Only (No Validation)
```tsx
// Source: CONTEXT.md D-06 — placeholder only, no format enforcement
<FormField
  control={form.control}
  name="surucu_plaka"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Plaka</FormLabel>
      <FormControl>
        <Input placeholder="34 ABC 123" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Driver Info View Mode (Conditional Visibility)
```tsx
// Source: CONTEXT.md D-03, D-04 — hidden when all empty, InfoRow pattern
const hasDriverInfo = !!(
  taraf?.surucu_ad || taraf?.surucu_soyad || 
  taraf?.surucu_plaka || taraf?.surucu_telefon || taraf?.surucu_police_no
)

// In JSX (after existing Card in view mode return):
{hasDriverInfo && (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Diğer Sürücü Bilgileri</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Sürücü Adı" value={taraf?.surucu_ad} />
        <InfoRow label="Sürücü Soyadı" value={taraf?.surucu_soyad} />
        <InfoRow label="Plaka" value={taraf?.surucu_plaka} />
        <InfoRow label="Telefon" value={taraf?.surucu_telefon} />
        <InfoRow label="Poliçe No" value={taraf?.surucu_police_no} />
      </div>
    </CardContent>
  </Card>
)}
```

### Submit Handler Extension
```tsx
// Source: Existing onSubmit pattern lines 96-104 — extend with || undefined pattern
const onSubmit = (values: EditValues) => {
  upsertMutation.mutate({
    dosya_id: dosyaId,
    ...existing fields...,
    surucu_ad: values.surucu_ad || undefined,
    surucu_soyad: values.surucu_soyad || undefined,
    surucu_plaka: values.surucu_plaka || undefined,
    surucu_telefon: values.surucu_telefon || undefined,
    surucu_police_no: values.surucu_police_no || undefined,
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| zod v3 transforms for phone | zod `.regex()` with `.or(z.literal(''))` | Phase 10 (current) | Allows empty string OR valid phone format — pattern to mirror exactly |
| Separate form per Card | Shared form with shared toggle | Established in Phase 4-8 | D-02 locks this decision — single form for both Cards |

**Deprecated/outdated:**
- None relevant to this phase — using established patterns from existing codebase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getById` query returns all `taraf` columns including driver fields via `taraflar: true` | Architecture Patterns | Low — verified in code: `db.query.dosya.findFirst({ with: { taraflar: true } })` returns all columns by default |
| A2 | `primaryTaraf` type from `getById` response automatically includes driver fields at runtime | Architecture Patterns | Medium — TypeScript type inference from Drizzle should include all columns, but component's `TarafRow` type must be updated manually |
| A3 | No CSS/styling changes needed for the new Card — existing Card + InfoRow styles are sufficient | Architecture Patterns | Low — existing patterns are well-established |

**No assumptions flagged as `[ASSUMED]` in research** — all claims verified from codebase review.

## Open Questions

1. **TarafRow type source: Should it come from Drizzle inference or stay manual?**
   - What we know: The TarafRow type is manually defined (lines 29-37) rather than imported from schema
   - What's unclear: Whether the planner should import the type from `lib/schema.ts` or extend the manual type
   - Recommendation: Extend the manual type in-place for consistency with current pattern — the existing TarafRow omits some columns already (e.g., `created_at`), so a full Drizzle type import would be overkill

2. **Edit mode layout: Should driver Card show at all when empty?**
   - What we know: D-02 says shared toggle, D-03 says driver section hidden in view mode when empty
   - What's unclear: Whether the empty-state driver Card in edit mode should show an explicit "no data" message or just the empty form fields
   - Recommendation: Show the driver Card with empty form fields in edit mode (since user is there to fill them in), matching how existing Card shows empty-state with "Düzenle" button in view mode

## Environment Availability

Step 2.6: SKIPPED — no external dependencies identified. This is a UI-only phase extending existing React components with existing dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TARAF-07 | Driver info form section renders 5 fields in edit mode | unit | `npm test -- --run tests/lib/trpc.test.ts` | ✅ (existing — extend) |
| TARAF-07 | Form validates phone format on submit | unit | `npm test -- --run tests/lib/trpc.test.ts` | ✅ (existing — extend) |
| TARAF-08 | Driver info displays in InfoRow format in view mode | manual | Visual inspection in browser | ❌ (component test) |
| TARAF-09 | Turkish phone format (05XXXXXXXXX) validation | unit | `npm test -- --run tests/lib/validation.test.ts` | ✅ (existing) |
| TARAF-10 | Plate placeholder visible, no format enforcement | unit | `npm test -- --run tests/lib/trpc.test.ts` | ✅ (existing) |

**Note:** UI rendering tests (TARAF-08) are best verified via visual inspection since the project has no component testing infrastructure (no React Testing Library, no jsdom environment). Schema/validation tests are well-covered with existing vitest suite.

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No component rendering tests exist — TARAF-08 verification is manual (browser inspection)
- [ ] No jsdom environment configured — vitest.config.ts sets `environment: 'node'`

*(If adding component testing infrastructure is out of scope — which it is — visual browser testing is the standard approach for this project.)*

## Security Domain

> This phase presents minimal security surface — it extends an existing form with UI fields that already have server-side validation (Phase 10's tRPC schema). No new attack vectors are introduced.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no auth changes |
| V3 Session Management | no | N/A — no session changes |
| V4 Access Control | no | N/A — no permission changes |
| V5 Input Validation | yes | Zod schema validation (client + server) |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for React Form Extension

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Phone regex bypass (client-side) | Tampering | Server-side Zod validation mirrors client — double enforcement |
| Empty string stored as non-NULL | Spoofing | `|| undefined` pattern ensures empty strings become undefined before mutation |

## Sources

### Primary (HIGH confidence)
- `lib/schema.ts` lines 155-168 — taraf table with 5 driver columns
- `lib/trpc/routers/dosya.ts` lines 19-35 — tarafSchema Zod validation with surucu_telefon regex
- `components/dosya/karsitaraflar-tab.tsx` — full 240-line existing component (edit/view pattern reference)
- `tests/lib/trpc.test.ts` — existing test coverage for tarafSchema including driver fields
- `tests/lib/validation.test.ts` — phone regex test coverage
- CONTEXT.md — locked decisions D-01 through D-06

### Secondary (MEDIUM confidence)
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — Phase 10 decisions that this phase depends on

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, versions verified
- Architecture: HIGH — extending existing well-defined pattern; no new patterns needed
- Pitfalls: HIGH — identified from direct codebase analysis of type definitions and form handling

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable — no fast-moving dependencies)