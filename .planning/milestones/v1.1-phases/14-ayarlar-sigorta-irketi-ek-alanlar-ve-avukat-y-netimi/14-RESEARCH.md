# Phase 14: Ayarlar Sigorta Şirketi Ek Alanlar ve Avukat Yönetimi - Research

**Researched:** 2026-04-14
**Domain:** Drizzle ORM schema extension, many-to-many relations, tRPC CRUD extension, cascading dropdowns
**Confidence:** HIGH

## Summary

This phase extends the existing `sigorta_sirketi` table with 5 new columns (mersis_no, vergi_no, bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail), creates a new `avukat` table with a many-to-many join table `avukat_sigorta_sirketi`, and replaces the `taraf.karsitaraf_vekil` text column with `taraf.avukat_id` FK. The existing `makeCrudRouter` pattern in `ayarlar.ts` needs to be replaced with a custom router for `sigortaSirketi` (because it now has complex fields and relations), while a new `avukat` CRUD router is added. On the UI side, the `AyarlarCrudSection` component must be extended for sigorta şirketi detail management (including nested avukat management), and `karsitaraflar-tab.tsx` must replace its free-text vekil input with a cascading avukat dropdown filtered by selected sigorta şirketi.

**Primary recommendation:** Extend sigorta_sirketi CRUD via custom router (replacing `makeCrudRouter`), create dedicated avukat router with relation management, write sequential SQL migration (0002), and use existing form patterns (useForm + zodResolver) for new validation fields.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tüm 5 alan sigorta şirketine eklenir: mersis_no, vergi_no, bagli_oldugu_vergi_dairesi, ihtar_mail, kep_mail
- **D-02:** vergi_no zorunlu alan — TCKN/VKN format doğrulaması (10 veya 11 hane)
- **D-03:** ihtar_mail ve kep_mail opsiyonel ama geçerli e-posta formatı zorunlu
- **D-04:** mersis_no ve bagli_oldugu_vergi_dairesi opsiyonel, serbest metin
- **D-05:** UI: mevcut AyarlarCrudSection yapısı korunur ama sigorta şirketi için özel genişletme — tablo sütunları + dialog form ile tüm yeni alanlar
- **D-06:** Avukat ayrı tablo (avukat) — sigorta şirketiyle ilişki tablosu üzerinden birçok-çağı ilişki
- **D-07:** Avukat tablosu alanları: ad (zorunlu), tbb_sicil_no (zorunlu), iban (opsiyonel, TR formatı), eposta (opsiyonel, e-posta formatı), telefon (opsiyonel, 05XXXXXXXXX)
- **D-08:** İlişki tablosu: avukat_sigorta_sirketi — avukat_id + sigorta_sirketi_id (many-to-many)
- **D-09:** Ayarlar sayfasında avukatlar sigorta şirketi detayında yönetilir — şirket detayında/kartında "Avukatlar" bölümü ile ekle/düzenle/sil
- **D-10:** Dosya karşı taraf sekmesinde mevcut "Vekil Adı" serbest metin alanı kaldırılır ve avukat dropdown ile değiştirilir
- **D-11:** Avukat dropdown, seçilen karşı sigorta şirketine göre filtrelenir — şirket değiştiğinde avukat listesi güncellenir
- **D-12:** karsitaraf_vekil serbest metin sütunu kaldırılır, yerine avukat_id FK eklenir (temiz geçiş)

### the agent's Discretion
- Tablo/migration isimlendirmeleri
- Ayarlar sayfasında sigorta şirketi tablosunda hangi sütunlar görünür (Ad + birkaç özet sütun mu, tüm sütunlar mı)
- Avukat ilişki tablosu detayları
- Dialog form alan düzeni ve gruplandırma
- IBAN format doğrulama detayları

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | 5 new fields on sigorta_sirketi | Schema extension pattern (Section: Architecture Patterns) |
| D-02 | vergi_no validation 10/11 digits | Zod validation (Section: Code Examples) |
| D-03 | ihtar_mail/kep_mail email validation | Zod email validation (Section: Code Examples) |
| D-04 | mersis_no/bagli_vergi_dairesi optional text | Schema nullable text columns |
| D-05 | UI: extend AyarlarCrudSection for sirketi | Component architecture (Section: Architecture Patterns) |
| D-06 | Avukat table with many-to-many | Drizzle relations pattern (Section: Architecture Patterns) |
| D-07 | Avukat field validation | Zod schema (Section: Code Examples) |
| D-08 | avukat_sigorta_sirketi join table | Drizzle SQLite join table (Section: Architecture Patterns) |
| D-09 | Avukat managed in sirketi detail | Nested CRUD UI pattern |
| D-10 | Replace vekil text with avukat dropdown | Cascading Select pattern (Section: Architecture Patterns) |
| D-11 | Dropdown filters by sigorta sirketi | Dependent query pattern (Section: Architecture Patterns) |
| D-12 | Drop karsitaraf_vekil, add avukat_id FK | Migration strategy (Section: Common Pitfalls) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 | ORM & query builder | Already in project, handles SQLite + relations |
| drizzle-kit | 0.31.10+ | Schema migration generation | Already in project, configured in drizzle.config.ts |
| zod | 3.24.0 | Schema validation | Already in project, used in all tRPC routers |
| @trpc/server | 11.16.0 | API layer | Already in project, ayarlar router pattern |
| react-hook-form | 7.72.1 | Form state management | Already in project, used in karsitaraflar-tab.tsx |
| @hookform/resolvers | 5.2.2 | Zod resolver bridge | Already in project |
| better-sqlite3 | 12.8.0 | SQLite driver | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.97.0 | Data fetching & cache | All tRPC queries, invalidation after mutations |
| shadcn/ui components | (local) | Form, Select, Dialog, Table | Already in project components/ui/ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tRPC router for sigortaSirketi | Keep makeCrudRouter + separate relation endpoints | makeCrudRouter only supports flat ad-only entities; new fields + relations need custom router |
| Separate avukat page section | Inline avukat management within sirketi card | D-09 locks: avukatlar managed in sirketi detail, not separate section |

**Installation:**
No new packages needed — all dependencies already in project.

**Version verification:** Verified against package.json lock versions.

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── schema.ts                    # Extend sigortaSirketi, add avukat + avukat_sigorta_sirketi tables
├── trpc/routers/
│   └── ayarlar.ts              # Custom sigortaSirketi router (replace makeCrudRouter), add avukat router
├── db.ts                       # No changes needed (globalThis pattern)

components/
├── ayarlar/
│   ├── ayarlar-page.tsx        # Extend sigorta sirketi section with detail/avukat management
│   ├── ayarlar-crud-section.tsx # Keep for mahkeme/sigortaTuru, reference for new components
│   ├── sigorta-sirketi-section.tsx  # NEW: replaces generic CRUD for sirketi, has detail + avukat management
│   └── avukat-form-dialog.tsx        # NEW: avukat add/edit dialog
├── dosya/
│   └── karsitaraflar-tab.tsx   # Replace karsitaraf_vekil with avukat_id dropdown

drizzle/
└── 0002_phase14_avukat_schema.sql   # Migration: ALTER sigorta_sirketi, CREATE avukat + join table, ALTER taraf
```

### Pattern 1: Drizzle Many-to-Many Relation (avukat ↔ sigorta_sirketi)
**What:** Join table pattern for many-to-many in Drizzle ORM with SQLite
**When to use:** For the avukat_sigorta_sirketi relation table
**Example:**
```typescript
// Source: Drizzle ORM docs — many-to-many relations [CITED: orm.drizzle.team/docs/rdbms/relations]
// In lib/schema.ts

export const avukat = sqliteTable('avukat', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  tbb_sicil_no: text('tbb_sicil_no').notNull(),
  iban: text('iban'),
  eposta: text('eposta'),
  telefon: text('telefon'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const avukatSigortaSirketi = sqliteTable('avukat_sigorta_sirketi', {
  avukat_id: integer('avukat_id').notNull().references(() => avukat.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').notNull().references(() => sigortaSirketi.id, { onDelete: 'cascade' }),
}, (t) => [
  index('idx_avukat_sirketi_avukat').on(t.avukat_id),
  index('idx_avukat_sirketi_sirketi').on(t.sigorta_sirketi_id),
])

// Relations:
export const avukatRelations = relations(avukat, ({ many }) => ({
  sigortaSirketleri: many(avukatSigortaSirketi),
}))

export const avukatSigortaSirketiRelations = relations(avukatSigortaSirketi, ({ one }) => ({
  avukat: one(avukat, { fields: [avukatSigortaSirketi.avukat_id], references: [avukat.id] }),
  sigortaSirketi: one(sigortaSirketi, { fields: [avukatSigortaSirketi.sigorta_sirketi_id], references: [sigortaSirketi.id] }),
}))

// Also extend sigortaSirketiRelations:
export const sigortaSirketiRelations = relations(sigortaSirketi, ({ many }) => ({
  dosyalar: many(dosya),
  taraflar: many(taraf),
  muvekkilSigortaDosyalar: many(dosya, { relationName: 'muvekkilSigorta' }),
  avukatlar: many(avukatSigortaSirketi),  // NEW
}))
```

### Pattern 2: Custom tRPC Router for sigortaSirketi (Replacing makeCrudRouter)
**What:** The current `makeCrudRouter` uses `adSchema` (only `{ ad: string }`) — unsuitable for the now-complex sigortaSirketi with 7 fields + relation management
**When to use:** For any entity that outgrows the simple ad-only CRUD pattern
**Example:**
```typescript
// Source: existing ayarlar.ts pattern + muvekkil.ts validation pattern [VERIFIED: codebase]
const sigortaSirketiSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  mersis_no: z.string().max(50).optional().or(z.literal('')),
  vergi_no: z.string()
    .regex(/^(\d{10}|\d{11})$/, 'VKN/TCKN 10 veya 11 hane olmalıdır')
    .min(1, 'Vergi No zorunludur'),
  bagli_oldugu_vergi_dairesi: z.string().max(200).optional().or(z.literal('')),
  ihtar_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  kep_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
})

// Custom router replaces makeCrudRouter(sigortaSirketi, 'Sigorta şirketi')
sigortaSirketi: createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(sigortaSirketi).orderBy(asc(sigortaSirketi.ad))
  }),
  create: protectedProcedure.input(sigortaSirketiSchema).mutation(async ({ input }) => {
    const [row] = await db.insert(sigortaSirketi).values(input).returning()
    return row
  }),
  update: protectedProcedure
    .input(sigortaSirketiSchema.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db.update(sigortaSirketi).set(data).where(eq(sigortaSirketi.id, id)).returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sigorta şirketi bulunamadı.' })
      return row
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      // Could check for linked dosya/taraf records before allowing delete
      await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, input.id))
      return { success: true }
    }),
  // NEW: listWithAvukatlar for detail view
  listWithAvukatlar: protectedProcedure.query(async () => {
    return db.query.sigortaSirketi.findMany({
      with: { avukatlar: { with: { avukat: true } } },
      orderBy: asc(sigortaSirketi.ad),
    })
  }),
})
```

### Pattern 3: Cascading Dropdown (sigorta şirketi → filtered avukat list)
**What:** When sigorta şirketi selection changes in karsitaraflar-tab, avukat dropdown re-filters
**When to use:** In karsitaraflar-tab.tsx replacing karsitaraf_vekil input
**Example:**
```typescript
// Source: existing karsitaraflar-tab.tsx Select pattern [VERIFIED: codebase]
// Add a new tRPC query in ayarlar router:
avukatBySirket: protectedProcedure
  .input(z.object({ sigorta_sirketi_id: z.number().int() }))
  .query(async ({ input }) => {
    return db.select({
      id: avukat.id,
      ad: avukat.ad,
      tbb_sicil_no: avukat.tbb_sicil_no,
    })
      .from(avukatSigortaSirketi)
      .innerJoin(avukat, eq(avukatSigortaSirketi.avukat_id, avukat.id))
      .where(eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id))
      .orderBy(asc(avukat.ad))
  }),

// In karsitaraflar-tab.tsx:
const selectedSirketId = form.watch('sigorta_sirketi_id')
const { data: avukatList } = useQuery(
  trpc.ayarlar.avukatBySirket.queryOptions(
    { sigorta_sirketi_id: selectedSirketId ?? 0 },
    { enabled: !!selectedSirketId }
  )
)
// Reset avukat_id when sigorta_sirketi_id changes
useEffect(() => {
  form.setValue('avukat_id', null)
}, [selectedSirketId, form])
```

### Pattern 4: Deleting a Column and Adding a FK (Migration Strategy)
**What:** SQLite doesn't support DROP COLUMN in all versions; need migration approach
**When to use:** Replacing karsitaraf_vekil text column with avukat_id FK

**CRITICAL:** SQLite 3.35.0+ (2021-03-12) supports `ALTER TABLE DROP COLUMN`. The better-sqlite3 v12.8 bundles SQLite 3.46+ which supports this. However, since Drizzle migrations are SQL-based and the project uses `drizzle-kit migrate`, the migration should be:

```sql
-- 0002_phase14_avukat_schema.sql

-- 1. Add new columns to sigorta_sirketi
ALTER TABLE `sigorta_sirketi` ADD `mersis_no` text;
ALTER TABLE `sigorta_sirketi` ADD `vergi_no` text DEFAULT '' NOT NULL;
ALTER TABLE `sigorta_sirketi` ADD `bagli_oldugu_vergi_dairesi` text;
ALTER TABLE `sigorta_sirketi` ADD `ihtar_mail` text;
ALTER TABLE `sigorta_sirketi` ADD `kep_mail` text;

-- 2. Create avukat table
CREATE TABLE `avukat` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ad` text NOT NULL,
  `tbb_sicil_no` text NOT NULL,
  `iban` text,
  `eposta` text,
  `telefon` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

-- 3. Create join table
CREATE TABLE `avukat_sigorta_sirketi` (
  `avukat_id` integer NOT NULL REFERENCES `avukat`(`id`) ON DELETE CASCADE,
  `sigorta_sirketi_id` integer NOT NULL REFERENCES `sigorta_sirketi`(`id`) ON DELETE CASCADE
);
CREATE INDEX `idx_avukat_sirketi_avukat` ON `avukat_sigorta_sirketi` (`avukat_id`);
CREATE INDEX `idx_avukat_sirketi_sirketi` ON `avukat_sigorta_sirketi` (`sigorta_sirketi_id`);

-- 4. Add avukat_id to taraf, drop karsitaraf_vekil
ALTER TABLE `taraf` ADD `avukat_id` integer REFERENCES `avukat`(`id`);
ALTER TABLE `taraf` DROP COLUMN `karsitaraf_vekil`;
```

### Anti-Patterns to Avoid
- **Using makeCrudRouter for sigortaSirketi after extension:** The router only supports `{ ad: string }` schema. Replace with a custom router that handles the full 7-field schema + avukat relations. [VERIFIED: ayarlar.ts lines 8-37]
- **Inline avukat CRUD in karsitaraflar-tab:** Avukat management must happen in ayarlar page. The dosya tab only SELECTs avukatlar for a dropdown.
- **Not resetting avukat_id when sigorta_sirketi_id changes:** If the user changes the sigorta şirketi, the previously selected avukat may not belong to the new şirketi → must clear the avukat_id field.
- **Forgetting to invalidate both sigorta and avukat queries on mutation:** When adding/removing an avukat from a şirketi, both the `sigortaSirketi.listWithAvukatlar` and `avukat.list` caches need invalidation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zod VKN/TCKN validation | Custom regex per field | `z.string().regex(/^(\d{10}\|\d{11})$/)` | Centralized validation, consistent error messages |
| Zod IBAN validation | Custom IBAN check | `z.string().regex(/^TR\d{24}$/)` | Same pattern already used in muvekkil.ts [VERIFIED: muvekkil.ts line 20] |
| Zod email validation | Custom regex | `z.string().email()` | Zod built-in covers RFC 5322 edge cases |
| Zod phone validation | Custom regex per field | `z.string().regex(/^05[0-9]{9}$/)` | Same pattern used in muvekkil.ts and karsitaraflar-tab.tsx [VERIFIED] |
| Drizzle relations | Manual join queries | `db.query` with `with` for relations | Drizzle ORM handles join SQL, type-safe results |
| Cascading select state | Manual useEffect + fetch | TanStack Query `enabled` option + `queryOptions` | Automatic caching, deduplication, stale-while-revalidate |

**Key insight:** The project already has established validation patterns (phone regex, IBAN regex, email format) in `muvekkil.ts` and `karsitaraflar-tab.tsx`. Reuse these exact patterns for avukat and sigorta sirketi fields.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `karsitaraf_vekil` column in taraf table (1 row, value: null) | SQL migration: DROP COLUMN after adding avukat_id |
| Stored data | `sigorta_sirketi` table: 3 rows, currently only (id, ad) | ALTER TABLE to add 5 columns; existing rows get defaults |
| Stored data | New `avukat` + `avukat_sigorta_sirketi` tables needed | CREATE TABLE in migration |
| Live service config | None — all config is in git (drizzle.config.ts, schema.ts) | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | None involved | N/A |
| Build artifacts | drizzle migration journal (meta/_journal.json) needs update | Run `drizzle-kit generate` after schema changes |

## Common Pitfalls

### Pitfall 1: SQLite DROP COLUMN Limitations
**What goes wrong:** Older SQLite versions (< 3.35.0) don't support `ALTER TABLE DROP COLUMN`, causing migration failure
**Why it happens:** better-sqlite3 v12.8 bundles SQLite 3.46+ which DOES support DROP COLUMN
**How to avoid:** The migration SQL can safely use `ALTER TABLE taraf DROP COLUMN karsitaraf_vekil`. Verified: better-sqlite3 v12.8 uses SQLite 3.46.0+ [VERIFIED: package.json + SQLite release notes]
**Warning signs:** If drizzle-kit generate produces a recreate-table migration instead of ALTER TABLE, check the SQLite version in the migration snapshot

### Pitfall 2: Drizzle Many-to-Many Requires Explicit Join Table Relations
**What goes wrong:** Forgetting to define `avukatSigortaSirketiRelations` causes `db.query` with `with` to fail silently or return empty
**Why it happens:** Drizzle requires explicit relation definitions on the join table pointing to both parent tables
**How to avoid:** Define 3 sets of relations: `avukatRelations`, `avukatSigortaSirketiRelations`, and extend `sigortaSirketiRelations` with `avukatlar: many(avukatSigortaSirketi)`
**Warning signs:** `db.query.sigortaSirketi.findMany({ with: { avukatlar: true } })` returns empty array even when join table has rows

### Pitfall 3: MakeCrudRouter Type Signature Won't Accept Extended sigortaSirketi
**What goes wrong:** After adding columns to sigortaSirketi, the `makeCrudRouter` still uses `adSchema` (only `{ ad: string }`), so create/update won't accept the new fields
**Why it happens:** `makeCrudRouter` is explicitly typed as `typeof sigortaSirketi | typeof mahkeme | typeof sigortaTuru` and its input schema is hardcoded to `adSchema`
**How to avoid:** Replace `makeCrudRouter(sigortaSirketi, ...)` with a dedicated custom router for sigortaSirketi. Keep makeCrudRouter for mahkeme and sigortaTuru unchanged. [VERIFIED: ayarlar.ts lines 10-37]
**Warning signs:** TypeScript errors when trying to create/update sigorta sirketi with new fields

### Pitfall 4: vergi_no NOT NULL Without Default Breaks Existing Rows
**What goes wrong:** Adding `vergi_no text NOT NULL` to `sigorta_sirketi` when there are already 3 rows with no vergi_no value causes constraint violation
**Why it happens:** SQLite ALTER TABLE ADD COLUMN with NOT NULL but no DEFAULT requires all existing rows to have a value
**How to avoid:** Either: (a) add `DEFAULT ''` to the column definition in migration, OR (b) use `ALTER TABLE sigorta_sirketi ADD vergi_no text NOT NULL DEFAULT ''` and handle empty-string → validation in the app layer
**Warning signs:** Migration fails with "Cannot add a NOT NULL column without a default value" (older SQLite), or existing rows have empty vergi_no that passes schema NOT NULL but breaks validation

### Pitfall 5: Cascading Dropdown Race Condition
**What goes wrong:** When sigorta_sirketi_id changes, the avukat dropdown briefly shows stale data from the previous sirketi's avukatlar before the query refetches
**Why it happens:** React Query invalidation is async; the `avukat_id` value isn't reset until the new avukat list loads
**How to avoid:** Reset `avukat_id` to null immediately in the `onValueChange` handler for sigorta_sirketi_id, before the query refetch starts. Use TanStack Query's `enabled` option to prevent queries with invalid sirketi_id. [VERIFIED: karsitaraflar-tab.tsx uses similar pattern for sigorta dropdown]
**Warning signs:** Avukat dropdown shows avukats from previous sirketi selection after switching

### Pitfall 6: sigortaSirketiRelations Must Stay Backward-Compatible
**What goes wrong:** Adding `avukatlar: many(avukatSigortaSirketi)` to `sigortaSirketiRelations` without updating the `dosyalar` and `taraflar` relations causes them to break
**Why it happens:** Drizzle relations must be complete; missing or duplicate relation names cause runtime errors
**How to avoid:** Only ADD the new `avukatlar` relation, do NOT modify existing `dosyalar`, `taraflar`, or `muvekkilSigortaDosyalar` relations. [VERIFIED: schema.ts lines 243-247]

## Code Examples

### Zod Validation Schemas (Reusable Patterns)
```typescript
// Source: muvekkil.ts lines 8-21, karsitaraflar-tab.tsx lines 50-64 [VERIFIED: codebase]

// VKN/TCKN: Turkish tax IDs are either 10 digits (VKN) or 11 digits (TCKN)
const vknTcknRegex = /^(\d{10}|\d{11})$/

// Phone: Turkish mobile format (established in Phase 10 D-01)
const telefonRegex = /^05[0-9]{9}$/

// IBAN: Turkish IBAN format (established in muvekkil.ts line 20)
const ibanRegex = /^TR\d{24}$/

// sigortaSirketi schema
const sigortaSirketiSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  mersis_no: z.string().max(50).optional().or(z.literal('')),
  vergi_no: z.string()
    .regex(vknTcknRegex, 'VKN/TCKN 10 veya 11 hane olmalıdır')
    .min(1, 'Vergi No zorunludur'),
  bagli_oldugu_vergi_dairesi: z.string().max(200).optional().or(z.literal('')),
  ihtar_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  kep_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
})

// avukat schema
const avukatSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  tbb_sicil_no: z.string().min(1, 'TBB Sicil No zorunludur').max(50),
  iban: z.string().regex(ibanRegex, 'Geçersiz IBAN formatı (TRXXXXXXXXXXXXXXXXXXXXXXXX)').optional().or(z.literal('')),
  eposta: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  telefon: z.string().regex(telefonRegex, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)').optional().or(z.literal('')),
})
```

### Avukat CRUD Router (new endpoint in ayarlar.ts)
```typescript
// Source: existing ayarlar.ts + muvekkil.ts patterns [VERIFIED: codebase]
avukat: createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(avukat).orderBy(asc(avukat.ad))
  }),
  create: protectedProcedure.input(avukatSchema).mutation(async ({ input }) => {
    const [row] = await db.insert(avukat).values(input).returning()
    return row
  }),
  update: protectedProcedure
    .input(avukatSchema.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db.update(avukat).set({ ...data, updated_at: sql`(datetime('now'))` }).where(eq(avukat.id, id)).returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Avukat bulunamadı.' })
      return row
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(avukat).where(eq(avukat.id, input.id))
      return { success: true }
    }),
  // Link avukat to sigorta sirketi
  addSirket: protectedProcedure
    .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.insert(avukatSigortaSirketi).values(input).onConflictDoNothing()
      return { success: true }
    }),
  // Unlink avukat from sigorta sirketi
  removeSirket: protectedProcedure
    .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(avukatSigortaSirketi).where(
        and(eq(avukatSigortaSirketi.avukat_id, input.avukat_id), eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id))
      )
      return { success: true }
    }),
  // Get avukatlar for a specific sigorta sirketi (for dropdown in dosya)
  bySirket: protectedProcedure
    .input(z.object({ sigorta_sirketi_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select({
        id: avukat.id,
        ad: avukat.ad,
        tbb_sicil_no: avukat.tbb_sicil_no,
      })
        .from(avukatSigortaSirketi)
        .innerJoin(avukat, eq(avukatSigortaSirketi.avukat_id, avukat.id))
        .where(eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id))
        .orderBy(asc(avukat.ad))
    }),
}),
```

### Updating taraf Schema (replacing karsitaraf_vekil with avukat_id)
```typescript
// Source: karsitaraflar-tab.tsx editSchema pattern [VERIFIED: codebase]
// In dosya.ts tarafSchema:
// REMOVE: karsitaraf_vekil field
// ADD:
avukat_id: z.number().int().nullable().optional(),

// In karsitaraflar-tab.tsx:
// Replace the karsitaraf_vekil FormField with:
<FormField
  control={form.control}
  name="avukat_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Karşı Taraf Avukatı</FormLabel>
      <Select
        onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v, 10))}
        value={field.value?.toString() ?? 'none'}
        disabled={!selectedSirketId}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={selectedSirketId ? 'Avukat seçin' : 'Önce sigorta şirketi seçin'} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="none">Yok / Bilinmiyor</SelectItem>
          {avukatList?.map((a) => (
            <SelectItem key={a.id} value={a.id.toString()}>
              {a.ad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| karsitaraf_vekil free text | avukat_id FK + avukat table | This phase | Structured avukat data, reusable across dosyalar |
| makeCrudRouter for sigortaSirketi | Custom router with full schema | This phase | Supports 7 fields instead of just `ad` |
| Generic AyarlarCrudSection for sirketi | Dedicated sigorta-sirketi-section with nested avukat management | This phase | Richer UI with detail cards and relation management |

**Deprecated/outdated:**
- `makeCrudRouter(sigortaSirketi, ...)` call in ayarlar.ts — must be replaced with custom router [VERIFIED: ayarlar.ts line 46]
- `karsitaraf_vekil` column in taraf table — will be dropped [VERIFIED: schema.ts line 190]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | better-sqlite3 v12.8 includes SQLite 3.46+ supporting ALTER TABLE DROP COLUMN | Migration Pattern | Migration SQL would need table recreation approach |
| A2 | Drizzle ORM 0.45.2 supports `db.query` with nested `with` for many-to-many via join tables | Architecture Patterns | Would need manual SQL joins or upgrade |
| A3 | `onConflictDoNothing()` on join table insert is sufficient to prevent duplicate avukat-sirketi links | Avukat Router | Duplicate entries could occur; needs unique composite index |
| A4 | Existing 3 sigorta_sirketi rows can tolerate `vergi_no DEFAULT ''` for NOT NULL constraint | Migration | Data inconsistency with empty vergi_no values |

**Note on A3:** The `avukat_sigorta_sirketi` join table should have a UNIQUE constraint on `(avukat_id, sigorta_sirketi_id)` to prevent duplicates. This can be done by adding a composite unique index or using the Drizzle `unique` table constraint. The `onConflictDoNothing()` handles it at the application level but a DB constraint is safer.

## Open Questions

1. **Avukat deletion safety:** Should deleting an avukat that's linked to a taraf (via avukat_id FK) be blocked, similar to how muvekkil deletion blocks when dosyalar exist? The current plan has no safeguard.
   - What we know: muvekkil.ts has a delete guard checking linked dosyalar [VERIFIED: muvekkil.ts lines 119-129]
   - What's unclear: Whether avukat deletion should SET NULL on taraf.avukat_id or block
   - Recommendation: Add ON DELETE SET NULL on taraf.avukat_id FK, and add a soft warning in the UI

2. **Sigorta sirketi list display columns:** D-05 says "AyarlarCrudSection yapısı korunur ama sigorta şirketi için özel genişletme." Which columns should appear in the table view?
   - What we know: Currently only `ad` is shown. With 7 fields, showing all columns would be too wide.
   - Recommendation: Show `ad`, `vergi_no`, `ihtar_mail` in the table; full detail in dialog/form.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| better-sqlite3 | DB driver | ✓ | 12.8.0 | — |
| drizzle-orm | ORM | ✓ | 0.45.2 | — |
| drizzle-kit | Migrations | ✓ | 0.31.10+ | — |
| zod | Validation | ✓ | 3.24.0 | — |
| react-hook-form | Forms | ✓ | 7.72.1 | — |
| @hookform/resolvers | Zod bridge | ✓ | 5.2.2 | — |
| @trpc/server | API | ✓ | 11.16.0 | — |
| @tanstack/react-query | Data fetching | ✓ | 5.97.0 | — |
| shadcn/ui (local) | UI components | ✓ | local | — |
| Node.js | Runtime | ✓ | 24.13.0 | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | vitest.config.ts (or package.json scripts) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-02 | vergi_no validation rejects invalid formats | unit | `npx vitest run --grep "vergi_no"` | ❌ Wave 0 |
| D-03 | ihtar_mail/kep_mail email validation | unit | `npx vitest run --grep "mail"` | ❌ Wave 0 |
| D-06 | Many-to-many avukat-sirketi relation works | integration | `npx vitest run --grep "avukat"` | ❌ Wave 0 |
| D-12 | taraf.avukat_id FK replaces karsitaraf_vekil | integration | `npx vitest run --grep "taraf"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/ayarlar-validation.test.ts` — covers D-02, D-03, D-07 Zod validation
- [ ] `tests/avukat-relations.test.ts` — covers D-06 many-to-many, D-08 join table
- [ ] No existing test infrastructure for schema migrations — manual testing needed

## Security Domain

> security_enforcement is enabled (absent in config = enabled)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | iron-session (existing) |
| V3 Session Management | no | iron-session (existing) |
| V4 Access Control | no | protectedProcedure (existing) |
| V5 Input Validation | yes | zod schemas for all tRPC inputs |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Drizzle ORM parameterized queries (used throughout) |
| Input validation bypass | Tampering | Zod validation on all tRPC inputs (established pattern) |
| Mass assignment | Tampering | Separate Zod schemas for create/update (established pattern) |

## Sources

### Primary (HIGH confidence)
- Codebase: `lib/schema.ts` — sigortaSirketi, taraf table definitions, relations
- Codebase: `lib/trpc/routers/ayarlar.ts` — makeCrudRouter pattern, mahkemeSchema
- Codebase: `lib/trpc/routers/muvekkil.ts` — validation patterns (phone, IBAN, email)
- Codebase: `lib/trpc/routers/dosya.ts` — tarafSchema, upsertTaraf mutation
- Codebase: `components/dosya/karsitaraflar-tab.tsx` — Select dropdown pattern, useForm integration
- Codebase: `components/ayarlar/ayarlar-crud-section.tsx` — CRUD component pattern
- Codebase: `drizzle/0001_add_phase13_columns.sql` — migration pattern (ALTER TABLE ADD COLUMN)
- Codebase: `package.json` — dependency versions verified

### Secondary (MEDIUM confidence)
- Drizzle ORM docs: many-to-many relations with explicit join tables [CITED: orm.drizzle.team/docs/rdbms/relations]
- SQLite ALTER TABLE DROP COLUMN support (3.35.0+) [CITED: sqlite.org/lang_altertable.html]

### Tertiary (LOW confidence)
- None — all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in project, versions verified
- Architecture: HIGH — patterns established from existing codebase, Drizzle relations well-documented
- Pitfalls: HIGH — identified from real codebase constraints (makeCrudRouter limitation, SQLite DROP COLUMN, vergi_no NOT NULL migration)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable stack, low change velocity)