# Architecture Research: Form Modifications & Tab Restructuring (v1.1)

**Domain:** Turkish insurance dispute case management (Sigorta Uyuşmazlık Takip)
**Project:** v1.1 Milestone — Subsequent milestone
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

This is a **subsequent milestone** targeting three specific changes: removing the email field from client (müvekkil) forms, adding driver info to the counter-party (taraf) section, and tab restructuring/UI improvements. The system uses Next.js 15 + Drizzle ORM + tRPC v11 + shadcn/ui. **No architecture shifts required** — all changes are additive schema extensions, router input updates, and component modifications within existing patterns.

## Current Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Muvekkil   │  │   Dosya    │  │   Ayarlar   │          │
│  │   Forms     │  │   Forms    │  │   Forms     │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
├─────────┴────────────────┴────────────────┴─────────────────┤
│                      tRPC v11 Router                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ muvekkil │  │  dosya   │  │ finans   │  │  ayarlar  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                  Drizzle ORM + SQLite/better-sqlite3          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ muvekkil │  │  dosya   │  │  taraf   │  │  belge   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure (relevant parts)

```
sigorta-takip/
├── lib/
│   ├── schema.ts           # ALL schemas — muvekkil, dosya, taraf, durusma, belge, finans, etc.
│   ├── db.ts               # Drizzle client singleton
│   └── trpc/
│       ├── routers/
│       │   ├── muvekkil.ts  # Client CRUD router
│       │   └── dosya.ts      # Case + taraf upsert router
│       └── init.ts
├── components/
│   ├── muvekkil/
│   │   ├── muvekkil-form.tsx    # Client create/edit form
│   │   ├── muvekkil-list.tsx    # Client list
│   │   └── muvekkil-detail.tsx # Client detail
│   └── dosya/
│       ├── dosya-form.tsx       # Case create/edit form
│       ├── dosya-detail-tabs.tsx # 6-tab case detail shell
│       ├── karsitaraflar-tab.tsx # Counter-party tab
│       └── genel-bilgiler-tab.tsx # Summary tab
├── drizzle/                  # Migration files
└── data/db.sqlite           # SQLite database
```

### Component Responsibilities

| Component | Responsibility | Pattern |
|-----------|----------------|---------|
| `muvekkil-form.tsx` | Client CRUD with react-hook-form + Zod | Client component, tRPC mutations |
| `dosya-form.tsx` | Case CRUD form | Client component, tRPC mutations |
| `dosya-detail-tabs.tsx` | 6-tab case detail shell | Tabs from shadcn/ui, URL hash sync |
| `karsitaraflar-tab.tsx` | Counter-party info with inline edit | Upsert pattern |
| `genel-bilgiler-tab.tsx` | Read-only case summary | Card layout |
| tRPC `muvekkil` router | Client CRUD | Zod input → Drizzle insert/update |
| tRPC `dosya` router | Case + taraf upsert | upsertTaraf mutation |

## Form Integration Pattern

### Standard Form Flow

```
[React Hook Form] → [Zod Resolver] → [Zod Schema]
        ↓ useMutation              ↓ tRPC input validation
[   TanStack Query    ] ← [tRPC Router] → [Drizzle ORM] → [SQLite]
```

### Example: dosya-form.tsx (dosya.ts:86-139)

```typescript
// 1. Zod schema matches tRPC input schema
const formSchema = z.object({
  muvekkil_id: z.number().int(),
  dosya_no: z.string().min(1).max(50),
  tur: z.enum(['STK', 'AT', 'AH']),
  // ...
})

// 2. useForm with zodResolver
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: EMPTY_DEFAULTS,
})

// 3. useMutation wraps tRPC mutation
const createMutation = useMutation(
  trpc.dosya.create.mutationOptions({
    onSuccess: () => { /* invalidate + redirect */ },
    onError: () => { /* handle conflict */ },
  })
)

// 4. onSubmit transforms form values to tRPC input
const onSubmit = (values: FormValues) => {
  createMutation.mutate({ muvekkil_id: values.muvekkil_id, ... })
}
```

### Example: muvekkil-form.tsx (muvekkil.ts:8-16)

```typescript
// Schema in router (lib/trpc/routers/muvekkil.ts)
const muvekkilSchema = z.object({
  ad: z.string().min(1).max(100),
  soyad: z.string().min(1).max(100),
  telefon: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),  // ← REMOVE THIS
  tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
  adres: z.string().max(500).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})
```

## Integration Points

### 1. Remove Email from Müvekkil

**Schema** (`lib/schema.ts:123-134`):
```typescript
export const muvekkil = sqliteTable('muvekkil', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  soyad: text('soyad').notNull(),
  telefon: text('telefon'),
  email: text('email'),  // ← TO BE REMOVED
  tc_vergi_no: text('tc_vergi_no'),
  // ...
})
```

**tRPC Router** (`lib/trpc/routers/muvekkil.ts:8-16`):
```typescript
const muvekkilSchema = z.object({
  ad: z.string().min(1).max(100),
  soyad: z.string().min(1).max(100),
  telefon: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),  // ← REMOVE
  tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
  // ...
})
```

**Form Component** (`components/muvekkil/muvekkil-form.tsx:147-159`):
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>E-posta</FormLabel>
      <FormControl>
        <Input type="email" placeholder="E-posta adresi" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
// AND remove from formSchema (line 27)
// AND remove from defaultValues email: '' (line 52)
// AND remove from edit mode defaultValues (line 253)
```

**Migration** (run via drizzle-kit):
```sql
-- Safe: column is nullable, can be dropped in separate migration
ALTER TABLE muvekkil DROP COLUMN email;
```

### 2. Add Driver Info to Taraf (Counter-Party)

**Current Schema** (`lib/schema.ts:156-164`):
```typescript
export const taraf = sqliteTable('taraf', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').references(() => sigortaSirketi.id),
  karsitaraf_ad: text('karsitaraf_ad'),        // Karşı vekil adı
  karsitaraf_vekil: text('karsitaraf_vekil'),  // Karşı vekil
  police_no: text('police_no'),
  karsitaraf_plaka: text('karsitaraf_plaka'),  // Karşı taraf plaka
})
```

**Proposed Extension** — Add to `taraf` table:
```typescript
suruci_ad: text('suruci_ad'),           // Sürücü Adı (driver first name)
suruci_soyad: text('suruci_soyad'),     // Sürücü Soyadı (driver last name)
suruci_plaka: text('suruci_plaka'),     // Sürücü Plaka (driver plate)
suruci_telefon: text('suruci_telefon'), // Sürücü Telefon (driver phone)
suruci_police_no: text('suruci_police_no'), // Sürücü Poliçe No (driver policy)
```

**Naming Convention:** `suruci_` prefix (Turkish for "driver"). Uses ASCII-safe naming (`suruci` not `sürücü`) to avoid encoding issues with Drizzle/SQLite. Alternative is full UTF-8 support if verified.

**tRPC Router Extension** (`lib/trpc/routers/dosya.ts:19-26`):
```typescript
const tarafSchema = z.object({
  dosya_id: z.number().int(),
  sigorta_sirketi_id: z.number().int().nullable().optional(),
  karsitaraf_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  karsitaraf_vekil: z.string().max(200).nullable().optional().or(z.literal('')),
  police_no: z.string().max(100).nullable().optional().or(z.literal('')),
  karsitaraf_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  // NEW:
  suruci_ad: z.string().max(100).nullable().optional().or(z.literal('')),
  suruci_soyad: z.string().max(100).nullable().optional().or(z.literal('')),
  suruci_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  suruci_telefon: z.string().max(20).nullable().optional().or(z.literal('')),
  suruci_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
})
```

**KarsitaraflarTab Extension** (`components/dosya/karsitaraflar-tab.tsx`):
- Add new fields to `editSchema` (lines 45-51)
- Add new fields to `InfoRow` display (lines 231-236)
- Add new fields to edit form (after existing fields, lines 116-203)

### 3. Tab Restructuring

**Current 6-Tab Layout** (`dosya-detail-tabs.tsx:182-190`):

| Tab Index | Tab Name | Component | Status |
|-----------|----------|-----------|--------|
| 0 | Genel Bilgiler | GenelBilgilerTab | Active |
| 1 | Yargılama Süreci | YargilamaSureciTab | Active |
| 2 | Belgeler | BelgeUpload + BelgeList | Active |
| 3 | Notlar / Zaman Çizelgesi | EmptyTabContent | **Empty stub** |
| 4 | Karşı Taraflar | KarsitaraflarTab | Active |
| 5 | Dosya Finansı | FinansSummary + FinansForm | Active |

**URL Hash Sync** (`dosya-detail-tabs.tsx:63-71`):
```typescript
useEffect(() => {
  const hash = window.location.hash.slice(1)
  if (hash) setActiveTab(hash)
}, [])

const handleTabChange = (value: string) => {
  setActiveTab(value)
  window.history.replaceState(null, '', '#' + value)
}
```

**Tab Restructuring Options:**

| Option | Impact | Recommendation |
|--------|--------|----------------|
| Remove "Notlar" tab | Breaks bookmarked URLs with `#notlar` | Either keep + fill, or handle hash redirect |
| Merge "Karşı Taraflar" into "Genel Bilgiler" | Adds complexity to already-loaded tab | Keep separate — driver info is distinct concern |
| Reorder tabs | Breaks muscle memory, shifts URLs | Avoid unless UX research suggests |

**For this milestone:** The "Notlar/Zaman Çizelgesi" tab (index 3) is empty. Either fill it with placeholder content or remove it with a URL hash redirect handler.

## Recommended Build Order

### Phase 1: Schema & Router Changes (Foundation)

1. **Add new taraf columns** to `lib/schema.ts` — suruci_ad, suruci_soyad, suruci_plaka, suruci_telefon, suruci_police_no
2. **Run drizzle-kit generate** — creates migration file
3. **Update tRPC tarafSchema** in `lib/trpc/routers/dosya.ts` — add new input fields
4. **Update dosya.getById** return type if needed — TypeScript will flag if taraf type is used

### Phase 2: Müvekkil Email Removal (Safe - Cosmetic First)

5. **Remove email from muvekkil-form.tsx** — UI field, Zod schema, defaultValues
6. **Remove email from tRPC muvekkilSchema** — optional (column can stay nullable in DB)
7. **Database migration** — run `drizzle-kit migrate` OR keep column nullable and drop in separate migration

### Phase 3: Taraf Tab UI Enhancement

8. **Update KarsitaraflarTab** — add driver fields to edit form and InfoRow display
9. **Test upsert flow** — verify driver info saves/updates correctly via existing upsertTaraf mutation
10. **Add driver section header** — "Diğer Sürücü Bilgileri" to visually separate from counter-party info

### Phase 4: Tab Cleanup (If Scope Allows)

11. **Handle empty "Notlar" tab** — either fill with basic notes placeholder OR remove tab and add hash redirect
12. **Test URL hash deep links** — verify no broken bookmarks

## Anti-Patterns to Avoid

### Anti-Pattern: Adding driver fields to `dosya` table

**Wrong:** Adding sürücü_ad, sürücü_soyad, etc. directly to `dosya` table
**Why:** Violates normalization — driver info is counter-party data, should live in `taraf` table
**Correct:** Add to `taraf` table where other counter-party data (police_no, karsitaraf_plaka) already lives

### Anti-Pattern: Separate mutation for driver info

**Wrong:** Creating new `upsertDriver` or `updateDriver` mutation
**Why:** Driver info is part of counter-party; existing `upsertTaraf` pattern handles create/edit
**Correct:** Extend existing `upsertTaraf` mutation — same upsert pattern, just more fields

### Anti-Pattern: Removing tab without URL redirect

**Wrong:** Removing "Notlar" tab from TabsList without handling existing URLs
**Why:** Users with bookmarked `/#notlar` URLs get empty content or 404 behavior
**Correct:** Either keep tab with placeholder content, or add redirect logic in `handleTabChange`

### Anti-Pattern: Two separate form submissions for counter-party + driver

**Wrong:** Saving counter-party info, then driver info in separate submissions
**Why:** Same entity (taraf), same upsert pattern, atomic save
**Correct:** Single form submission via existing upsertTaraf mutation

## Scaling Considerations

This is an offline-first single-user app with 200+ files. Scaling is not a concern for these changes.

| Scale | Adjustment |
|-------|------------|
| 0-200 files | Current architecture sufficient |
| 200-2000 files | Add pagination (already exists), consider query optimization |

## Data Flow for Key Changes

### Driver Info Upsert Flow

```
[KarsitaraflarTab — Edit Form]
    ↓ form.handleSubmit(onSubmit)
    ↓ upsertMutation.mutate({ dosya_id, suruci_ad, suruci_soyad, ... })
[ tRPC upsertTaraf mutation ]
    ↓ checks existing taraf row for dosya_id
    ↓ if exists: UPDATE with new driver fields
    ↓ if not: INSERT with all fields
[ Drizzle ORM ]
    ↓ .update(taraf).set({ suruci_ad, suruci_soyad, ... })
    ↓ WHERE eq(taraf.dosya_id, dosya_id)
[ SQLite taraf table ]
```

### Email Removal Flow

```
[muvekkil-form.tsx — submit]
    ↓ form values (NO email field)
    ↓ createMutation.mutate({ ad, soyad, telefon, tc_vergi_no, ... })
[ tRPC muvekkil.create mutation ]
    ↓ Zod validates (email field NOT in schema)
    ↓ INSERT into muvekkil (email column receives NULL or DEFAULT)
[ SQLite muvekkil table ]
    ↓ email column: NULL for new records, preserved for existing
```

## Sources

- Schema definition: `D:\sigorta-takip\lib\schema.ts` (lines 123-134 muvekkil, 156-164 taraf)
- tRPC routers: `D:\sigorta-takip\lib\trpc\routers\dosya.ts`, `D:\sigorta-takip\lib\trpc\routers\muvekkil.ts`
- Forms: `D:\sigorta-takip\components\muvekkil\muvekkil-form.tsx`, `D:\sigorta-takip\components\dosya\dosya-form.tsx`
- Tabs: `D:\sigorta-takip\components\dosya\dosya-detail-tabs.tsx`
- Counter-party tab: `D:\sigorta-takip\components\dosya\karsitaraflar-tab.tsx`

---

*Architecture research for: Sigorta Uyuşmazlık Takip — v1.1 milestone*
