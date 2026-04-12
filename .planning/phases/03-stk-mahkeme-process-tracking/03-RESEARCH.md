# Phase 3: STK & Mahkeme Process Tracking - Research

**Researched:** 2026-04-12
**Domain:** Process tracking UI, Drizzle ORM JSON columns, tRPC CRUD, shadcn/ui stepper pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** An STK file tracks both STK tahkim stages AND (if itiraz davası is filed) court stages under the same dosya. `dosya.tur = 'STK'` still allows court process section to be activated. AT/AH files carry only court process. The Yargılama Süreci tab shows two sections: "STK Tahkim Süreci" (for STK files or all files) and "Mahkeme Süreci" (conditionally visible).

**D-02:** `surec_detay` JSON column on dosya holds both STK state and court state under separate keys: `{ stk: { asama, veriler... }, mahkeme: { asama, veriler... } }`. AT/AH files use only the `mahkeme` key; STK files can optionally use both.

**D-03:** User advances stage via a sequential "İleri Al" button. Skipping not allowed — only next stage is supported. Stepper shows completed (●), current (◎), and future (○) stages visually. "İleri Al →" button is positioned next to the current stage.

**D-04:** Stage cannot be reversed (no back-step). If user advances in error, they can edit data fields but cannot revert to a prior stage.

**D-05:** All STK data fields (STK başvuru no, başvuru tarihi, kabul tarihi, raportör adı, bilirkişi, hakem karar tarihi, tebligat tarihi, itiraz tarihi) are always visible in a single form below the stepper. All court data fields (Esas No, Karar No, mahkeme adı, dava tarihi, tebligat tarihleri, karar tarihi) are similarly shown in a single form.

**D-06:** Form fields save independently — user can fill any field at any time regardless of current stage. Stage advancement and data form save are separate actions.

**D-07:** Duruşma add/edit uses a shadcn Dialog (modal). The Yargılama Süreci tab bottom section shows hearings in chronological order. "Duruşma Ekle" button below the list; each row has "Düzenle" and "Sil" actions.

**D-08:** Dialog fields: date (date picker), time (text), mahkeme/kurum (from settings list or free text), hearing type (free text: "esas", "ara karar", "bilirkişi" etc.), notes (textarea). Multiple hearings per dosya supported.

### Claude's Discretion

- Stepper bileşeninin tam görsel tasarımı (shadcn'de built-in Stepper yok — Claude özel CSS veya `cn()` + Badge bileşeni ile yapar)
- Mahkeme süreci bölümünün STK dosyalarında nasıl aktif edileceği ("Mahkeme süreci başlat" butonu mu, yoksa otomatik görünür mü)
- Form validation hata mesajlarının tam metni (Türkçe, kullanıcı dostu)
- Duruşma listesi sütunları (tarih, saat, mahkeme, tür yeterli — notlar tooltip/genişleme ile)

### Deferred Ideas (OUT OF SCOPE)

- Aşama geri alma (önceki aşamaya dönüş) — kasıtlı olarak reddedildi; D-04
- Aşama dropdown ile doğrudan seçim (atlama) — kasıtlı olarak reddedildi; D-03
- İstinaf / Temyiz modülü — REQUIREMENTS.md Out of Scope; v2'ye bırakıldı

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUREC-01 | STK aşamaları: BAŞVURU → KABUL → RAPORTÖR_ATANDI → RAPORTÖR_İNCELEME → HAKEM_KURULU → HAKEM_KARARI → İTİRAZ_SÜRESİ → İTİRAZ_DAVASI → KARAR_KESİNLEŞTİ | Drizzle text enum in surec_detay JSON; stepper component ordered array |
| SUREC-02 | STK veri noktaları: STK başvuru no, başvuru tarihi, kabul tarihi, raportör adı, bilirkişi, hakem karar tarihi, tebligat tarihi, itiraz tarihi | JSON column typed schema; tRPC updateSurecDetay mutation |
| SUREC-03 | Mahkeme aşamaları: DAVA_AÇILDI → TEBLİGAT → CEVAP_DİLEKÇESİ → TAHKİKAT → BİLİRKİŞİ → KARAR → İSTİNAF → KESİNLEŞTİ | Same stepper component, different stage array |
| SUREC-04 | Mahkeme veri noktaları: Esas No, Karar No, mahkeme adı, dava tarihi, tebligat tarihleri, karar tarihi | JSON column typed schema; tRPC updateSurecDetay mutation |
| SUREC-05 | Duruşma kaydı: tarih, saat, mahkeme/kurum, duruşma türü, notlar; multiple per dosya | Separate `durusma` table; full CRUD tRPC procedures + Dialog UI |

</phase_requirements>

---

## Summary

Phase 3 adds process-tracking state to the existing `dosya` entity. The architecture centers on two additions: (1) a `surec_detay` JSON column on the `dosya` table storing both STK and court stage/data state as typed JSON, and (2) a new `durusma` table for hearing records. A `surec` tRPC router provides stage advancement and data-update mutations plus full hearing CRUD. The Yargılama Süreci tab (currently an `EmptyTabContent` placeholder) is replaced with a real component that consumes this router.

The most critical design insight is that shadcn/ui v4 (installed in this project) has no built-in Stepper component — the stepper must be hand-composed using `cn()`, `Badge`, and simple div/flex layout. This is by design per shadcn's philosophy: compose primitives, don't ship pre-built complex patterns. The approach used across the shadcn ecosystem is a horizontal or vertical ordered list with conditionally applied Tailwind classes.

The JSON column approach for `surec_detay` is standard Drizzle ORM practice for polymorphic state that does not need relational querying. Drizzle's `text()` column with manual `JSON.parse`/`JSON.stringify` (or Drizzle's `.$type<T>()` typing hint) is the established pattern since SQLite has no native JSON type. No separate `stk_surec` or `mahkeme_surec` tables are needed because this data is always queried with its parent dosya and never queried in isolation.

**Primary recommendation:** Add `surec_detay text` nullable column to `dosya`, create `durusma` table, generate + run migration, build a `surec` tRPC router with 4 procedures, then build the `YargilamaSureciTab` component consuming them.

---

## Standard Stack

### Core (all already installed — no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.2 | Schema definition, JSON column, durusma table CRUD | Already in use — established in Phase 2 |
| drizzle-kit | ^0.31.10 | `generate` + `migrate` workflow | Locked decision from Phase 1 |
| zod | ^3.24.0 | Zod schemas for tRPC input validation, durusma form | Already in use |
| react-hook-form | ^7.72.1 | Data-point form and duruşma dialog form | Established pattern — used in karsitaraflar-tab |
| @hookform/resolvers | ^5.2.2 | zodResolver for react-hook-form | Already in use |
| @tanstack/react-query | ^5.97.0 | useQuery + useMutation for tRPC calls | Already in use |
| react-day-picker | ^9.14.0 | Calendar component backing shadcn Calendar | Already installed (powers shadcn's calendar.tsx) |
| lucide-react | ^1.8.0 | Icons for stepper (CheckCircle, Circle) and table actions | Already in use |
| date-fns | ^4.1.0 | Date formatting for duruşma list display (tr-TR locale) | Already in use |
| sonner | ^2.0.7 | Toast notifications on save/error | Established pattern |

[VERIFIED: package.json in repo root — all versions confirmed]

### Supporting (already installed shadcn components)

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `components/ui/dialog.tsx` | Duruşma add/edit modal | D-07 decision |
| `components/ui/badge.tsx` | Stage badge styling in stepper | Discretion — stage indicators |
| `components/ui/card.tsx` | Section wrappers (STK section, court section) | Consistent with existing tabs |
| `components/ui/form.tsx` + `input.tsx` + `textarea.tsx` | Data-point forms | Established form pattern |
| `components/ui/button.tsx` | "İleri Al", "Kaydet", "Duruşma Ekle" | All CTAs |
| `components/ui/calendar.tsx` | Date picker popover in duruşma dialog | react-day-picker already installed |
| `components/ui/popover.tsx` | Wraps calendar for date picker pattern | Standard shadcn date-picker |
| `components/ui/select.tsx` | Mahkeme dropdown in duruşma dialog | Already used in Phase 2 |
| `components/ui/separator.tsx` | Visual divider between STK and court sections | Already installed |
| `components/ui/alert-dialog.tsx` | Duruşma delete confirmation | Consistent with dosya delete pattern |

[VERIFIED: `ls D:/sigorta-takip/components/ui/` — all listed components confirmed present]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON column for surec_detay | Separate `stk_surec` + `mahkeme_surec` tables | Tables would be correct for querying across dosyalar but overkill here — Phase 4 deadline queries need date fields from surec_detay; simpler to add indexed columns only when needed |
| Manual JSON in text column | Drizzle `customType` | customType adds complexity; `.$type<T>()` hint gives TypeScript safety without runtime overhead |
| `date-fns` for formatting | `Intl.DateTimeFormat` | Both work; date-fns already installed and used in genelBilgilerTab |

**Installation:** No new packages required. All dependencies are already installed. [VERIFIED: package.json]

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── schema.ts                  # ADD: surec_detay column to dosya + durusma table
├── trpc/routers/
│   ├── surec.ts               # NEW: surec router (stage advance, data update, durusma CRUD)
│   └── _app.ts                # ADD: surec: surecRouter
components/
├── dosya/
│   ├── dosya-detail-tabs.tsx  # MODIFY: replace EmptyTabContent for yargilama-sureci
│   ├── yargilama-sureci-tab.tsx  # NEW: main tab component
│   ├── surec-stepper.tsx         # NEW: reusable stepper (STK stages or court stages)
│   ├── stk-data-form.tsx         # NEW: STK data-point form
│   ├── mahkeme-data-form.tsx     # NEW: court data-point form
│   └── durusma-dialog.tsx        # NEW: add/edit dialog for hearings
drizzle/
├── XXXX_phase3_surec.sql      # Generated by drizzle-kit generate
```

### Pattern 1: JSON Column with TypeScript Typing (Drizzle ORM)

**What:** A `text` column in Drizzle marked with `.$type<T>()` to carry polymorphic JSON state, parsed/serialized manually at the tRPC layer.
**When to use:** When state always loads with its parent row and does not need relational joins or indexed queries across rows.

**Schema definition:**
```typescript
// Source: [VERIFIED: lib/schema.ts — existing pattern; drizzle-orm docs for .$type<T>()]
// In lib/schema.ts — add to existing dosya table:

export type StkSurecData = {
  asama: StkAsama | null
  basvuru_no: string | null
  basvuru_tarihi: string | null   // ISO date string
  kabul_tarihi: string | null
  raportör_adi: string | null
  bilirkisi: string | null
  hakem_karar_tarihi: string | null
  tebligat_tarihi: string | null
  itiraz_tarihi: string | null
}

export type MahkemeSurecData = {
  asama: MahkemeAsama | null
  esas_no: string | null
  karar_no: string | null
  mahkeme_adi: string | null
  dava_tarihi: string | null
  tebligat_tarihi: string | null
  karar_tarihi: string | null
}

export type SurecDetay = {
  stk?: StkSurecData
  mahkeme?: MahkemeSurecData
}

// In the dosya table definition:
surec_detay: text('surec_detay').$type<string>(),  // stored as JSON.stringify(SurecDetay)
```

**tRPC parse/serialize pattern:**
```typescript
// Source: [ASSUMED — standard Drizzle JSON column pattern]
// In surec.ts router — helper functions:
function parseSurecDetay(raw: string | null): SurecDetay {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function serializeSurecDetay(data: SurecDetay): string {
  return JSON.stringify(data)
}
```

### Pattern 2: Stage Enumeration as TypeScript Const Array

**What:** Stage lists are defined as TypeScript const arrays (not database enums) so the stepper can iterate them and compute "next stage" by index.
**When to use:** Sequential pipelines with a fixed ordered set of states.

```typescript
// Source: [ASSUMED — idiomatic TypeScript for ordered string unions]
export const STK_ASAMALAR = [
  'BAŞVURU',
  'KABUL',
  'RAPORTÖR_ATANDI',
  'RAPORTÖR_İNCELEME',
  'HAKEM_KURULU',
  'HAKEM_KARARI',
  'İTİRAZ_SÜRESİ',
  'İTİRAZ_DAVASI',
  'KARAR_KESİNLEŞTİ',
] as const

export type StkAsama = typeof STK_ASAMALAR[number]

export const MAHKEME_ASAMALAR = [
  'DAVA_AÇILDI',
  'TEBLİGAT',
  'CEVAP_DİLEKÇESİ',
  'TAHKİKAT',
  'BİLİRKİŞİ',
  'KARAR',
  'İSTİNAF',
  'KESİNLEŞTİ',
] as const

export type MahkemeAsama = typeof MAHKEME_ASAMALAR[number]

// "Next stage" computation — used in tRPC ileriAl mutation:
function nextAsama<T extends string>(stages: readonly T[], current: T | null): T | null {
  if (!current) return stages[0]       // first stage if not started
  const idx = stages.indexOf(current)
  if (idx === -1 || idx === stages.length - 1) return null  // already final
  return stages[idx + 1]
}
```

### Pattern 3: tRPC Router Structure for surec

**What:** Single `surec` router with 4 procedures covering all phase 3 operations.
**When to use:** Co-locate related mutations; keep procedures granular by concern.

```typescript
// Source: [VERIFIED: established in dosya.ts router — same pattern]
export const surecRouter = createTRPCRouter({
  // Update STK data fields independently of stage — D-06
  updateStkData: protectedProcedure
    .input(z.object({ dosya_id: z.number().int(), data: stkDataSchema }))
    .mutation(async ({ input }) => { /* parse JSON, merge, serialize, db.update */ }),

  // Advance STK stage by one step — D-03, D-04
  stkIleriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => { /* compute nextAsama, throw if final */ }),

  // Update court data fields independently of stage — D-06
  updateMahkemeData: protectedProcedure
    .input(z.object({ dosya_id: z.number().int(), data: mahkemeDataSchema }))
    .mutation(async ({ input }) => { /* same pattern as STK */ }),

  // Advance court stage by one step
  mahkemeIleriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => { /* compute nextAsama */ }),

  // Duruşma CRUD
  durusmaList: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(/* ... */),

  durusmaCreate: protectedProcedure
    .input(durusmaCreateSchema)
    .mutation(/* ... */),

  durusmaUpdate: protectedProcedure
    .input(durusmaUpdateSchema)
    .mutation(/* ... */),

  durusmaDelete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(/* ... */),
})
```

### Pattern 4: Custom Stepper (No Built-in shadcn Component)

**What:** shadcn/ui v4 has no `<Stepper>` component. Compose from `div`, `cn()`, `Badge`, and conditional classes.
**When to use:** All stage progression UI.

```tsx
// Source: [VERIFIED: shadcn v4 component list — no Stepper in any shadcn release]
// [ASSUMED — composition approach is standard community recommendation]
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type StepperProps<T extends string> = {
  stages: readonly T[]
  labels: Record<T, string>      // Turkish display names
  current: T | null
  onAdvance?: () => void
  isPending?: boolean
}

export function SurecStepper<T extends string>({
  stages, labels, current, onAdvance, isPending
}: StepperProps<T>) {
  const currentIdx = current ? stages.indexOf(current) : -1

  return (
    <div className="space-y-1">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx

        return (
          <div key={stage} className="flex items-center gap-3">
            {/* Stage indicator */}
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
              isCompleted && 'bg-primary text-primary-foreground',
              isCurrent && 'ring-2 ring-primary bg-background',
              isFuture && 'bg-muted text-muted-foreground',
            )}>
              {isCompleted ? <Check size={12} /> : idx + 1}
            </span>
            {/* Stage label */}
            <span className={cn(
              'text-sm flex-1',
              isCurrent && 'font-semibold text-foreground',
              isFuture && 'text-muted-foreground',
            )}>
              {labels[stage]}
            </span>
            {/* Advance button — only on current stage */}
            {isCurrent && onAdvance && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAdvance}
                disabled={isPending || idx === stages.length - 1}
              >
                {isPending ? 'İlerletiliyor...' : 'İleri Al →'}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### Pattern 5: Duruşma Table Drizzle Schema

```typescript
// Source: [VERIFIED: established in schema.ts — same column patterns for other tables]
export const durusma = sqliteTable('durusma', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  tarih: text('tarih').notNull(),        // ISO date: 'YYYY-MM-DD'
  saat: text('saat'),                    // free text: '10:30'
  mahkeme_kurum: text('mahkeme_kurum'),  // free text or from mahkeme lookup
  tur: text('tur'),                      // 'esas', 'ara karar', 'bilirkişi', etc.
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_durusma_dosya').on(t.dosya_id),
  index('idx_durusma_tarih').on(t.tarih),
])
```

### Pattern 6: Date Picker in Form (shadcn Calendar + Popover)

**What:** shadcn v4 Calendar component wrapped in a Popover, controlled by react-hook-form.
**When to use:** Date inputs in the duruşma dialog.

```tsx
// Source: [VERIFIED: react-day-picker ^9.14.0 in package.json; calendar.tsx in components/ui/]
// [ASSUMED — pattern follows shadcn docs date-picker example]
<FormField
  control={form.control}
  name="tarih"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Tarih</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" className={cn(!field.value && 'text-muted-foreground')}>
              {field.value
                ? format(parseISO(field.value), 'dd.MM.yyyy')
                : 'Tarih seçin'}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value ? parseISO(field.value) : undefined}
            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            locale={tr}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Note on `date-fns` locale:** `date-fns` v4 ships tree-shakable locales at `date-fns/locale/tr`. Import as `import { tr } from 'date-fns/locale/tr'`. [VERIFIED: date-fns ^4.1.0 in package.json; [ASSUMED] locale import path — verify at implementation]

### Anti-Patterns to Avoid

- **Using `drizzle-kit push`:** Locked decision from Phase 1. Always `drizzle-kit generate` then `drizzle-kit migrate`.
- **Storing stage as separate integer index:** Store the string enum value (`'KABUL'` etc.) — more readable in DB, easier to debug, stable if stage order changes.
- **Deeply nesting surec_detay mutations inside the dosya router:** Create a separate `surec.ts` router. Keeps dosya router focused on core CRUD.
- **Triggering `dosya.getById` cache invalidation from surec mutations:** The surec_detay is on the dosya row. After any surec mutation, invalidate `[['dosya', 'getById']]` so the tab re-fetches fresh data.
- **Using separate API call to fetch surec_detay:** `dosya.getById` already returns the full dosya row including `surec_detay`. Parse the JSON in the component (or in a tRPC query that wraps getById). No extra round-trip needed for reads.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting for duruşma list | Custom date formatter | `date-fns` `format()` | Already installed; handles tr-TR locale edge cases |
| Stage ordering / next-stage logic | Complex switch statements | Simple array index arithmetic on const array | One `indexOf` + `+1` is sufficient and type-safe |
| Confirmation dialog for duruşma delete | Custom modal | `AlertDialog` (already in components/ui) | Consistent UX with existing dosya delete pattern |
| Form state for duruşma | useState objects | react-hook-form + Zod | Already the project pattern; handles reset on dialog close |
| JSON parse/stringify safety | No try/catch | `try { JSON.parse(raw) } catch { return {} }` | SQLite stores exactly what we wrote but corrupted data is possible |

**Key insight:** All required UI primitives already exist in `components/ui/`. The only missing piece is a stepper layout — which is intentionally not provided by shadcn and must be composed. This is simpler than it sounds: a vertical list with conditional class names is sufficient.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Add `surec_detay` to `dosya.getById` Return Shape

**What goes wrong:** The `surec_detay` column is added to the schema but `dosya.getById` uses `db.query.dosya.findFirst()` with `with:` relations — Drizzle returns all columns by default, so this should work. However, if someone adds a `columns:` selector to getById later, `surec_detay` must be included.
**Why it happens:** Column selectors in Drizzle opt-out — if `columns:` key exists, only listed columns return.
**How to avoid:** Do not add `columns:` to the `dosya.getById` query in this phase. Return all columns.
**Warning signs:** `data.surec_detay` is undefined despite the column existing in the DB.

### Pitfall 2: JSON Column Type Safety Gap

**What goes wrong:** `surec_detay` is stored as a raw string. TypeScript's `.$type<string>()` hint does not prevent bad JSON from being written or read.
**Why it happens:** Drizzle does not serialize/deserialize JSON automatically for SQLite text columns (unlike Postgres's jsonb type).
**How to avoid:** Always wrap reads in `parseSurecDetay(raw)` with a try/catch fallback to `{}`. Always write via `serializeSurecDetay(data)`. Never pass the raw string to a component.
**Warning signs:** `JSON.parse` throws at runtime, or TypeScript shows type as `string` rather than `SurecDetay`.

### Pitfall 3: Stale Data After surec Mutations

**What goes wrong:** User clicks "İleri Al", stage advances in DB, but the stepper still shows the old stage because React Query cache is stale.
**Why it happens:** The `surec_detay` column lives on the `dosya` row. `surec.stkIleriAl` mutation updates `dosya`, but the React Query key for `dosya.getById` is not invalidated.
**How to avoid:** In every `surec.*` mutation's `onSuccess`, call:
```typescript
queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
```
**Warning signs:** Toast shows success but stepper does not update until page refresh.

### Pitfall 4: Dialog Form State Not Reset on Close

**What goes wrong:** User opens "Duruşma Ekle" dialog, fills fields, closes without saving, re-opens — old field values are still there.
**Why it happens:** react-hook-form persists state until `reset()` is called.
**How to avoid:** Call `form.reset(defaultValues)` in the Dialog's `onOpenChange` handler when `open` goes to `false`. For edit mode, reset to the record's current values when opening.
**Warning signs:** Dialog shows previous input on reopen.

### Pitfall 5: `date-fns` v4 Import Paths Changed

**What goes wrong:** Importing `import { tr } from 'date-fns/locale'` fails — v4 changed locale export paths.
**Why it happens:** `date-fns` v4 (installed: ^4.1.0) migrated to named exports per locale file.
**How to avoid:** Use `import { tr } from 'date-fns/locale/tr'` (individual locale file). [ASSUMED — verify at implementation with actual import]
**Warning signs:** TypeScript error "Module 'date-fns/locale' has no export named 'tr'".

### Pitfall 6: `surec_detay` Migration Does Not Backfill Existing Rows

**What goes wrong:** Existing `dosya` rows have `surec_detay = NULL`. Component tries to `JSON.parse(null)` and crashes.
**Why it happens:** ALTER TABLE in SQLite adds column as NULL for existing rows by default.
**How to avoid:** Always use the `parseSurecDetay(raw)` helper that handles null: `if (!raw) return {}`. Never assume `surec_detay` is non-null.
**Warning signs:** TypeError on page load for existing dosya records.

### Pitfall 7: Turkish Characters in Stage Enum Values

**What goes wrong:** Stage enum values like `'İTİRAZ_SÜRESİ'` or `'DAVA_AÇILDI'` stored in SQLite cause comparison issues if uppercase normalization is applied.
**Why it happens:** The project uses a custom `lower_tr()` SQLite function for search, but stage comparisons use exact equality (`eq()`), which is fine. The risk is if someone adds a case-insensitive search across stage values.
**How to avoid:** Use exact string equality for stage comparisons. Avoid LIKE queries on stage columns.
**Warning signs:** Stage comparison in WHERE clause returns 0 rows despite data existing.

---

## Code Examples

### Adding surec_detay to dosya Table Migration

```typescript
// lib/schema.ts — add this column to the dosya sqliteTable definition:
surec_detay: text('surec_detay'),  // JSON-encoded SurecDetay; null for new rows

// Also add the durusma table and update relations:
export const durusma = sqliteTable('durusma', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  tarih: text('tarih').notNull(),
  saat: text('saat'),
  mahkeme_kurum: text('mahkeme_kurum'),
  tur: text('tur'),
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_durusma_dosya').on(t.dosya_id),
  index('idx_durusma_tarih').on(t.tarih),
])

// Add to dosyaRelations:
export const dosyaRelations = relations(dosya, ({ one, many }) => ({
  muvekkil: one(muvekkil, { fields: [dosya.muvekkil_id], references: [muvekkil.id] }),
  sigortaTuru: one(sigortaTuru, { fields: [dosya.sigorta_turu_id], references: [sigortaTuru.id] }),
  karsitarafSigorta: one(sigortaSirketi, { fields: [dosya.karsitaraf_sigorta_id], references: [sigortaSirketi.id] }),
  taraflar: many(taraf),
  durusmalar: many(durusma),   // NEW
}))
```
[VERIFIED: existing schema.ts pattern — column definition style is identical to other columns]

### Migration Workflow (after schema edit)

```bash
# Run from repo root:
npm run db:generate   # creates new SQL file in drizzle/
npm run db:migrate    # applies to ./data/db.sqlite
```
[VERIFIED: package.json scripts, drizzle.config.ts — confirmed workflow]

### tRPC surec Router: Stage Advance Mutation

```typescript
// lib/trpc/routers/surec.ts
stkIleriAl: protectedProcedure
  .input(z.object({ dosya_id: z.number().int() }))
  .mutation(async ({ input }) => {
    const row = await db.select({ surec_detay: dosya.surec_detay })
      .from(dosya)
      .where(eq(dosya.id, input.dosya_id))
      .then(r => r[0])
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

    const surec = parseSurecDetay(row.surec_detay)
    const currentAsama = surec.stk?.asama ?? null
    const next = nextAsama(STK_ASAMALAR, currentAsama)
    if (!next) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Son aşamaya ulaşıldı.' })

    const updated: SurecDetay = {
      ...surec,
      stk: { ...surec.stk, asama: next },
    }
    await db.update(dosya)
      .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
      .where(eq(dosya.id, input.dosya_id))
    return { asama: next }
  }),
```
[ASSUMED — pattern based on existing dosya router mutations]

### Duruşma Create Mutation (representative)

```typescript
durusmaCreate: protectedProcedure
  .input(z.object({
    dosya_id: z.number().int(),
    tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı'),
    saat: z.string().max(10).optional().or(z.literal('')),
    mahkeme_kurum: z.string().max(200).optional().or(z.literal('')),
    tur: z.string().max(100).optional().or(z.literal('')),
    notlar: z.string().max(2000).optional().or(z.literal('')),
  }))
  .mutation(async ({ input }) => {
    const [row] = await db.insert(durusma).values(input).returning()
    return row
  }),
```
[ASSUMED — pattern follows existing create mutations in dosya.ts]

### Client Component: Invalidate dosya cache after surec mutation

```typescript
// Inside YargilamaSureciTab component
const queryClient = useQueryClient()
const trpc = useTRPC()

const stkIleriAlMutation = useMutation(
  trpc.surec.stkIleriAl.mutationOptions({
    onSuccess: () => {
      // Invalidate dosya.getById so surec_detay re-fetches
      queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })
      toast.success('Aşama ilerletildi.')
    },
    onError: (err) => {
      toast.error(err.message ?? 'İlerletilemedi. Lütfen tekrar deneyin.')
    },
  })
)
```
[VERIFIED: established pattern in dosya-detail-tabs.tsx — same invalidation approach]

### Tab Integration Point

```tsx
// components/dosya/dosya-detail-tabs.tsx — replace EmptyTabContent for yargilama-sureci:
import { YargilamaSureciTab } from './yargilama-sureci-tab'

// In the TabsContent:
<TabsContent value="yargilama-sureci" className="mt-4">
  <YargilamaSureciTab
    dosyaId={dosyaId}
    dosyaTur={data.tur}                      // 'STK' | 'AT' | 'AH'
    surecDetayRaw={data.surec_detay ?? null}  // string | null
  />
</TabsContent>
```
[VERIFIED: dosya-detail-tabs.tsx line 189 — exact insertion point confirmed]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shadcn Stepper component (expected by some) | No built-in Stepper — compose from primitives | shadcn has never shipped one (as of 2026) | Must build custom; community composable pattern is standard |
| `date-fns` v2/v3 locale import `from 'date-fns/locale'` | v4: `from 'date-fns/locale/tr'` per-file import | date-fns v4 (2024) | Import path changed — check at implementation |
| drizzle-orm JSON columns with custom serializer | Use `.$type<T>()` hint + manual parse | Drizzle stable (0.45+) | No built-in JSON type for SQLite; type hint only gives TS safety |

**Deprecated/outdated:**
- `drizzle-kit push` — explicitly banned in this project (Phase 1 decision). Use `generate` + `migrate`.
- Shadcn v3 (Radix UI based) patterns — this project uses shadcn v4 with `@base-ui/react`. Radix import paths (`@radix-ui/react-dialog`) are replaced by `@base-ui/react` in the actual component files.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `date-fns` v4 locale import path is `date-fns/locale/tr` | Code Examples (date picker), Pitfall 5 | Import fails at build; easy fix — change import path |
| A2 | tRPC `queryClient.invalidateQueries({ queryKey: [['dosya', 'getById']] })` correctly invalidates all dosya getById queries | Code Examples | Stale UI data after mutations; easy fix — use more specific key |
| A3 | `surec.ts` router procedures follow exact same pattern as existing `dosya.ts` router | Architecture Patterns, Code Examples | Minor API shape differences; low risk given established pattern |
| A4 | `parseSurecDetay` / `serializeSurecDetay` helpers are co-located in `surec.ts` router (not a separate lib file) | Architecture Patterns | No functional impact; purely organizational |

**If this table is empty would apply:** All claims except the 4 above were verified against codebase or package.json.

---

## Open Questions

1. **Where to export stage enums and type definitions**
   - What we know: They are needed by both the tRPC router (surec.ts) and the UI components (stepper, forms)
   - What's unclear: Put them in `lib/schema.ts` alongside the Drizzle schema, or a separate `lib/surec-types.ts`?
   - Recommendation: Put in `lib/schema.ts` since that is the single source of truth for all entity shapes in this project (consistent with existing pattern)

2. **Mahkeme section activation for STK files**
   - What we know: D-01 says court section "can be activated" for STK files; D's discretion says either a button or automatic visibility
   - What's unclear: Should mahkeme section always render (collapsed/empty) for STK files, or only after explicit "Mahkeme Sürecini Başlat" button click?
   - Recommendation: Show a "Mahkeme Sürecini Başlat" button when `dosya.tur === 'STK'` and `surec.mahkeme` is null. After click, set `surec.mahkeme = { asama: null }` to mark it as activated. This makes the activation explicit and reversible at the data level.

3. **Duruşma list sort order**
   - What we know: D-08 says "kronolojik sıralı"; specifics left to Claude
   - Recommendation: Sort ascending by `tarih` (oldest first, most recent last at bottom of list), with `created_at` as tiebreaker. This matches how a lawyer reviews case history — chronological narrative. The "Duruşma Ekle" button stays at the bottom of the list.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 3 adds new Drizzle columns and a new SQLite table. All required tools (Node.js, npm, drizzle-kit) are already confirmed available from prior phases. No new external services or CLI tools are needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

[VERIFIED: vitest.config.ts and package.json scripts]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUREC-01 | STK stage enum has 9 correct values in order | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-02 | updateStkData procedure exists and validates all STK fields | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-03 | Court stage enum has 8 correct values in order | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-04 | updateMahkemeData procedure exists and validates all court fields | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-05 | durusmaCreate, durusmaUpdate, durusmaDelete, durusmaList procedures exist | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-01 | stkIleriAl advances stage sequentially, stops at final | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-03 | mahkemeIleriAl advances stage sequentially, stops at final | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |
| SUREC-02/04 | parseSurecDetay handles null input without throwing | unit | `npm run test -- tests/03-surec.test.ts` | ❌ Wave 0 |

**Note on test pattern:** Existing tests in `tests/02-dosya.test.ts` test router procedure existence via `router._def.procedures`. The same lightweight pattern applies here — no DB connection needed for these unit tests. [VERIFIED: tests/02-dosya.test.ts]

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/03-surec.test.ts` — covers SUREC-01 through SUREC-05 procedure existence + stage ordering + parseSurecDetay null safety
- [ ] `tests/03-schema.test.ts` — verifies `durusma` table exists in schema export and `surec_detay` column present on `dosya`

*(Framework and shared fixtures already exist — `tests/setup.ts` and `vitest.config.ts` require no changes)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not touched — existing iron-session auth unchanged |
| V3 Session Management | no | Not touched |
| V4 Access Control | yes | All 8 `surec` procedures use `protectedProcedure` — consistent with existing pattern |
| V5 Input Validation | yes | Zod schemas on all tRPC inputs; date format regex on `durusma.tarih` |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stage advance for wrong dosya | Tampering | `protectedProcedure` + `NOT_FOUND` throw if dosya_id doesn't exist |
| JSON injection via surec_detay | Tampering | Zod validates all input fields before serialization; no raw user-controlled JSON accepted |
| Duruşma creation for unowned dosya | Elevation of Privilege | Single-user app — all procedures behind protectedProcedure; dosya_id FK enforced by SQLite |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: lib/schema.ts] — existing Drizzle schema patterns (column types, index syntax, relations)
- [VERIFIED: lib/trpc/routers/dosya.ts] — tRPC router pattern (protectedProcedure, z.object input, TRPCError, db operations)
- [VERIFIED: components/dosya/karsitaraflar-tab.tsx] — react-hook-form + shadcn Form + useMutation pattern
- [VERIFIED: components/dosya/dosya-detail-tabs.tsx] — tab structure, QueryClient invalidation, integration point
- [VERIFIED: package.json] — all dependency versions
- [VERIFIED: vitest.config.ts + tests/02-dosya.test.ts] — test framework and existing test pattern
- [VERIFIED: components/ui/ directory listing] — confirmed all shadcn components available (including calendar, popover, dialog, alert-dialog)

### Secondary (MEDIUM confidence)
- [CITED: shadcn.com component list] — No Stepper component exists in shadcn/ui (confirmed by absence from components/ui/ in this codebase and community documentation)

### Tertiary (LOW confidence — see Assumptions Log)
- date-fns v4 locale import path — training knowledge; verify at implementation
- tRPC queryClient invalidation key format — inferred from existing code pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new packages needed
- Architecture: HIGH — patterns directly verified from existing router and component files
- Pitfalls: MEDIUM-HIGH — pitfalls 1-4 verified from codebase; pitfalls 5-7 are ASSUMED from date-fns/SQLite knowledge
- Test architecture: HIGH — vitest config and existing test files verified

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable stack — no fast-moving libraries)
