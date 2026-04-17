# Phase 13: Tab Cleanup & UI/UX - Research

**Researched:** 2026-04-14
**Domain:** Next.js/React UI, Drizzle/SQLite schema, tRPC API, Turkish insurance domain
**Confidence:** HIGH

## Summary

Phase 13 addresses four major areas: (1) replacing the empty "Notlar/Zaman Çizelgesi" tab with a notes CRUD + automatic activity timeline, (2) restructuring the Genel Bilgiler, Yargılama Süreci, and Belgeler tabs with new fields and reorganized process stages, (3) adding an IBAN field to Müvekkil, and (4) general UI/UX improvements across Dosya and Müvekkil pages. The most complex change is the STK/Mahkeme stage restructuring (D-12 through D-15), which requires data migration for existing `surec_detay` JSON values. The notes+timeline feature requires a new database table and a tRPC router. The General Information tab additions require 4 new columns on the `dosya` table and 1 new column on the `muvekkil` table.

**Primary recommendation:** Start with schema migrations (dosya columns, muvekkil IBAN, note/olay tables), then tackle the stage restructuring (data migration critical), then build UI components top-down.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** "Notlar / Zaman Çizelgesi" sekmesi doldurulacak — kaldırılmayacak
- **D-02:** Sekme iki bölümden oluşacak: üstte çoklu not alanı (ayrı varlık/CRUD), altta otomatik kapsamlı olay günlüğü
- **D-03:** Notlar ayrı bir veritabanı varlığı olarak saklanacak — birden fazla not eklenebilir, düzenlenebilir, silinebilir
- **D-04:** Zaman çizelgesi otomatik olay günlüğü olarak çalışacak — dosya oluşturma, durum değişiklikleri, süreç aşama geçişleri, finans kayıtları, belge yüklemeleri vb. tüm değişiklikler loglanacak
- **D-05:** "Poliçe No" etiketi "Müvekkil Poliçe No" olarak değiştirilecek
- **D-06:** Yeni "Hasar Dosya Numarası" alanı eklenecek — manuel giriş, yeni DB alanı
- **D-07:** Yeni "Kaza Tarihi" alanı eklenecek — DatePicker ile
- **D-08:** Yeni "Müvekkil Sigorta/Kasko Şirketi" alanı eklenecek — dropdown ile mevcut sigorta şirketi listesinden seçim
- **D-09:** Kusur oranları eklenecek — "Karşı Taraf Kusur Oranı" (elle girilen %) ve "Müvekkil Kusur Oranı" (otomatik hesaplanan: 100% - karşı taraf kusur oranı)
- **D-10:** Kusur oranı gösterimi: sadece %0 olmayan değerler gösterilecek
- **D-11:** Kusur oranları dosya seviyesinde Genel Bilgiler sekmesinde gösterilecek
- **D-12:** STK aşamaları yeniden yapılandırılacak: İhtar → Arabuluculuk → Başvuru → Ön İnceleme → Bilirkişi → Islah → Karar → İtiraz → Kesinleşme
- **D-13:** STK veri noktaları güncellenecek
- **D-14:** Mahkeme aşamaları yeniden yapılandırılacak
- **D-15:** Mahkeme veri noktaları güncellenecek
- **D-16:** Belge kategorileri genişletilecek
- **D-17:** Yüklenen belgenin dosya adı, seçilen kategori adıyla otomatik değiştirilecek (ör: "1.pdf" + "İhtarname" kategorisi → "İhtarname.pdf" olarak kaydedilecek)
- **D-18:** Müvekkil listesinde sütun düzeni ve genel görünüm/his iyileştirmeleri
- **D-19:** Müvekkil formunda alan gruplandırması, düzen ve UX iyileştirmeleri
- **D-20:** Müvekkil detay sayfasında düzen ve okunaklık iyileştirmeleri
- **D-21:** Yeni "IBAN" alanı müvekkil veritabanına eklenecek
- **D-22:** Dosya listesinde sütun düzeni ve modern görünüm iyileştirmeleri
- **D-23:** Dosya formunda yeni alanlar dahil düzen ve UX iyileştirmeleri
- **D-24:** Dosya detay sayfasında düzen ve okunaklık iyileştirmeleri

### the agent's Discretion
- Not varlığının tam şema tasarımı (alanlar, ilişkiler)
- Zaman çizelgesi olay günlüğü şema tasarımı (hangi olaylar loglanır, format)
- Kusur oranı hesaplama mantığının UI detayları
- UI/UX iyileştirmelerinin tam görsel detayları (renk, boşluk, tipografi)
- Belge kategori genişletmenin tam liste
- STK/Mahkeme aşama ve veri noktası değişikliklerinin mevcut şemayla uyumu

### Deferred Ideas (OUT OF SCOPE)
- Ayarlar sayfasında sigorta şirketlerine ek alanlar (mersis no, vergi no, bağlı olduğu vergi dairesi, ihtar mail adresi, kep mail adresi)
- Ayarlar sayfasında sigorta şirketlerine avukat bölümü
- Karşı taraf seçiminde avukat dropdown ile ayarlardan seçim
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TAB-01 | Boş "Notlar/Zaman Çizelgesi" sekmesi değerlendirilir — doldurulur veya kaldırılır | New `not` table + `olay_gunlugu` table design; NoteList + Timeline UI components |
| TAB-02 | Sekme içeriklerinde gerekli bölüm ekleme/çıkarma yapılır | Genel Bilgiler new columns; STK/Mahkeme stage restructure + data migration; Belge category expansion + category-based file renaming |
| UIUX-01 | Dosyalar ve Müvekkiller listesi/formlarında genel UI/UX iyileştirmeleri | List column reorder; form field grouping; detail page layout; IBAN field addition |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.3 (project) | App framework | Already installed — project foundation [VERIFIED: package.json] |
| react | 19.1.0 (project) | UI library | Already installed [VERIFIED: package.json] |
| drizzle-orm | 0.45.2 (project) | SQLite ORM | Already installed — all schema via drizzle [VERIFIED: package.json] |
| better-sqlite3 | 12.8.0 (project) | SQLite driver | Already installed [VERIFIED: package.json] |
| @trpc/server + @trpc/client | 11.16.0 (project) | API layer | Already installed [VERIFIED: package.json] |
| zod | 3.24.0 (project) | Validation | Already installed [VERIFIED: package.json] |
| react-hook-form | 7.72.1 (project) | Form state | Already installed [VERIFIED: package.json] |
| @tanstack/react-query | 5.97.0 (project) | Server state | Already installed [VERIFIED: package.json] |
| date-fns | 4.1.0 (project) | Date formatting | Already installed [VERIFIED: package.json] |
| lucide-react | 1.8.0 (project) | Icon library | Already installed [VERIFIED: package.json] |
| shadcn/ui (radix-ui) | 1.4.3 (project) | UI components | Already installed [VERIFIED: package.json] |
| sonner | 2.0.7 (project) | Toast notifications | Already installed [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | 0.31.10 (project) | Schema migration generation | For generating migration SQL files |
| vitest | 4.1.4 (project) | Testing | Schema validation, business logic tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|-----------|-----------|----------|
| Custom timeline component | react-activity-timeline | Custom is better — matches existing Card/Badge pattern, Turkish labels, simpler |
| Activity log table | Computed timeline from existing records | Log table required — stage changes have no individual timestamps in current schema |

**Installation:** No new packages needed. All changes use existing stack.

## Architecture Patterns

### Recommended Project Structure
```
components/
├── dosya/
│   ├── dosya-detail-tabs.tsx       # MODIFY: Replace EmptyTabContent with notes+timeline
│   ├── genel-bilgiler-tab.tsx      # MODIFY: Add new fields (D-06..D-11)
│   ├── yargilama-sureci-tab.tsx    # MODIFY: New stage system (D-12..D-15)
│   ├── stk-data-form.tsx           # MODIFY: New STK data fields
│   ├── mahkeme-data-form.tsx       # MODIFY: New Mahkeme data fields
│   ├── surec-stepper.tsx           # MODIFY: May need UI tuning for longer stage arrays
│   ├── dosya-form.tsx              # MODIFY: New fields + layout improvements (D-23)
│   ├── dosya-list.tsx              # MODIFY: Column reorder + layout (D-22)
│   ├── not-list.tsx                # NEW: Note CRUD component (D-03)
│   ├── not-form.tsx                # NEW: Add/edit note inline form
│   ├── timeline.tsx                # NEW: Activity timeline component (D-04)
│   └── kusur-orani-display.tsx     # NEW: Fault percentage display (D-09, D-10)
├── muvekkil/
│   ├── muvekkil-form.tsx           # MODIFY: Add IBAN, grouping (D-19, D-21)
│   ├── muvekkil-list.tsx            # MODIFY: Column reorder, compact (D-18)
│   └── muvekkil-detail.tsx          # MODIFY: Layout improvement, IBAN (D-20, D-21)
lib/
├── schema.ts                        # MODIFY: New tables + columns
├── trpc/routers/
│   ├── dosya.ts                     # MODIFY: New fields in schemas/queries
│   ├── muvekkil.ts                  # MODIFY: IBAN field
│   ├── notlar.ts                    # NEW: Note CRUD router
│   ├── olay.ts                      # NEW: Activity log query router
│   └── surec.ts                     # MODIFY: New stage enums + data schemas
drizzle/
└── 0001_add_phase13_columns.sql     # NEW: Migration file
```

### Pattern 1: New Entity CRUD (Notes)
**What:** Separate `not` table with full CRUD — create, read, update, delete
**When to use:** For the notes feature in "Notlar/Zaman Çizelgesi" tab
**Example:**
```typescript
// lib/schema.ts — New table
export const dosyaNot = sqliteTable('dosya_not', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  icerik: text('icerik').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_dosya_not_dosya').on(t.dosya_id),
])

// lib/trpc/routers/notlar.ts — CRUD pattern (follows existing durusma pattern)
export const notlarRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(dosyaNot)
        .where(eq(dosyaNot.dosya_id, input.dosya_id))
        .orderBy(desc(dosyaNot.created_at))
    }),
  create: protectedProcedure
    .input(z.object({ dosya_id: z.number().int(), icerik: z.string().min(1).max(5000) }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(dosyaNot).values(input).returning()
      return row
    }),
  // update, delete follow same pattern
})
```

### Pattern 2: Activity Log Table (Timeline)
**What:** `olay_gunlugu` table records all dosya-related events automatically
**When to use:** D-04 requires automatic comprehensive event logging
**Example:**
```typescript
// lib/schema.ts — Activity log table
export const olayGunlugu = sqliteTable('olay_gunlugu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  olay_turu: text('olay_turu').notNull(),  // 'olusturma' | 'durum_degisikligi' | 'surec_asama' | 'finans' | 'belge' | 'not' | 'durusma' | 'sure'
  aciklama: text('aciklama').notNull(),     // Human-readable Turkish description
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_olay_dosya').on(t.dosya_id),
  index('idx_olay_tarih').on(t.created_at),
])
```

**Key design decision:** Activity events should be inserted by tRPC mutations immediately — not computed from existing records. Reason: current `surec_detay` JSON only stores current stage, not history of transitions. A computed approach cannot reconstruct when stage changes occurred.

### Pattern 3: Fault Percentage Display (Kusur Oranı)
**What:** Two fields — manual input for karşı taraf %, auto-calculated for müvekkil %
**When to use:** D-09, D-10, D-11 — Genel Bilgiler tab
**Example:**
```typescript
// In form: only-store karşı taraf kusur oranı
kusur_orani_karsi: z.number().min(0).max(100).nullable().optional(),

// In view: auto-calculate müvekkil kusur oranı
const kusurOraniMuvekkil = dosya.kusur_orani_karsi !== null 
  ? 100 - dosya.kusur_orani_karsi 
  : null

// Display logic (D-10): only show non-zero values
{kusur_orani_karsi > 0 && <Row label="Karşı Taraf Kusur Oranı" value={`${kusur_orani_karsi}%`} />}
{kusurOraniMuvekkil > 0 && <Row label="Müvekkil Kusur Oranı" value={`${kusurOraniMuvekkil}%`} />}
```

### Pattern 4: Stage Restructure with Data Migration
**What:** Changing STK_ASAMALAR and MAHKEME_ASAMALAR enums requires migrating existing `surec_detay` JSON data
**When to use:** D-12, D-14 — redefining process stages
**Critical approach:**
```typescript
// OLD: STK_ASAMALAR = [BAŞVURU, KABUL, RAPORTÖR_ATANDI, RAPORTÖR_İNCELEME, HAKEM_KURULU, HAKEM_KARARI, İTİRAZ_SÜRESİ, İTİRAZ_DAVASI, KARAR_KESİNLEŞTİ]
// NEW: STK_ASAMALAR = [İHTAR, ARABULUCULUK, BAŞVURU, ÖN_İNCELEME, BİLİRKİŞİ, ISLAH, KARAR, İTİRAZ, KESİNLEŞME]

// Migration must map old stage values to new ones, or reset to null
// Since there's no 1:1 mapping, safest approach: reset all dosya surec_detay.stk.asama to null
// Users will re-select appropriate new stage after migration
```

### Anti-Patterns to Avoid
- **Storing müvekkil kusur oranı in DB:** D-09 says auto-calculated (100% - karşı taraf). Don't duplicate — compute at render time. [VERIFIED: CONTEXT.md D-09]
- **Computing timeline from existing records:** Stage transitions aren't timestamped anywhere — `surec_detay` only stores current state. Must use activity log table.
- **Hardcoding new stage enums in UI:** Stage definitions must live in `lib/schema.ts` as they do now — single source of truth for stepper, data forms, and labels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date picking | Custom date input | `DatePickerField` component | Already exists at `components/ui/date-picker.tsx` — Phase 9 standardized [VERIFIED: CONTEXT.md canonical_refs] |
| Form validation | Manual validation | Zod + react-hook-form + zodResolver | Established pattern in all forms [VERIFIED: dosya-form.tsx, muvekkil-form.tsx] |
| Toast notifications | Custom alert | Sonner | Already used throughout [VERIFIED: all mutation handlers] |
| DB migrations | Raw SQL files | Drizzle Kit (`npm run db:generate`) | Established pattern [VERIFIED: package.json scripts] |
| Activity timeline rendering | Complex custom component | Simple Card/Badge list with lucide icons | Matches existing component pattern, minimal complexity |
| Turkish-aware search | Custom string functions | `lower_tr()` registered SQLite function | Already in db.ts [VERIFIED: lib/db.ts] |

**Key insight:** Every UI pattern needed already exists in the codebase — Card/Badge forms, InfoRow grids, edit/view toggles, tRPC query/mutation with queryClient invalidation. No new paradigms needed.

## Runtime State Inventory

> This phase involves schema changes and data migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `dosya.surec_detay` JSON column — stores STK/Mahkeme stages with OLD enum values | Data migration: reset `asama` to null or map old→new |
| Stored data | `dosya` table — will get 4 new columns (hasar_dosya_no, kaza_tarihi, muvekkil_sigorta_id, kusur_orani_karsi) | Schema migration: ALTER TABLE ADD COLUMN |
| Stored data | `muvekkil` table — will get IBAN column | Schema migration: ALTER TABLE ADD COLUMN |
| Stored data | New `dosya_not` table needed | Schema migration: CREATE TABLE |
| Stored data | New `olay_gunlugu` table needed | Schema migration: CREATE TABLE |
| Stored data | `BELGE_KATEGORILER` array — needs expansion | Code change + migration of existing records |
| Stored data | `belge.ts` `belgeKategoriEnum` — Zod enum must match expanded categories | Code change coordinated with UI |
| Live service config | None — all config is in code/git | No action |
| OS-registered state | None | — |
| Secrets/env vars | None for this phase | — |
| Build artifacts | Drizzle migration snapshot meta will need updating | Run `npm run db:generate` after schema changes |

**Nothing found in category:** OS-registered state, secrets/env vars — verified by codebase inspection.

## Common Pitfalls

### Pitfall 1: Stage Enum Migration Breaks Existing Data
**What goes wrong:** Changing `STK_ASAMALAR` and `MAHKEME_ASAMALAR` arrays without migrating `surec_detay` JSON values causes existing dosya records to reference non-existent stage keys, crashing the stepper and data forms.
**Why it happens:** The `surec_detay` column stores JSON with `asama` field matching old enum values like `"BAŞVURU"`, `"KABUL"`, etc.
**How to avoid:** Write a migration script that: (1) reads all dosya records, (2) resets `stk.asama` and `mahkeme.asama` to `null`, (3) retains other data fields. Include a migration SQL statement in the migration file.
**Warning signs:** Any dosya detail page throwing errors on Yargılama Süreci tab after stage changes.

### Pitfall 2: New STK Data Fields Incompatible with Old Stage Labels
**What goes wrong:** The new D-13 STK data points (e.g., `ihtar_tarihi`, `arabuluculuk_son_tutanak_tarihi`) don't map to the old structure. If existing `surec_detay` JSON has old field names, they'll be ignored or cause errors.
**Why it happens:** `StkSurecData` type changes its fields, but existing data has old field names.
**How to avoid:** Redefine `StkSurecData` and `MahkemeSurecData` types completely. The `parseSurecDetay` function already handles missing fields gracefully (returns `{}` on parse error). Reset all `surec_detay` records to `{}` as part of migration, since the field structure is fundamentally changing.
**Warning signs:** TypeScript compilation errors in surec.ts after type changes.

### Pitfall 3: Kusur Oranı Edge Cases
**What goes wrong:** Storing `kusur_orani_karsi` as nullable real (float) can cause decimal precision issues (e.g., 33.33333% → müvekkil 66.66666%). Also, what happens when kusur_orani_karsi is 0 or null vs explicitly set to 0.
**Why it happens:** Float precision and null semantics.
**How to avoid:** Store `kusur_orani_karsi` as `integer` (0-100 range, whole percentages only). Use Zod validation `z.number().int().min(0).max(100).nullable()`. For display: null means "not entered" (show "—"), 0 means "0% fault" (show nothing per D-10). Display only when > 0.
**Warning signs:** Fractional percentages in UI, confusing null vs 0 meaning.

### Pitfall 4: Activity Log Table Not In Use Yet
**What goes wrong:** Creating the `olay_gunlugu` table but not hooking into existing mutations means the timeline starts empty with no historical data for existing records.
**Why it happens:** Existing records were created before the activity log existed — no events logged for them.
**How to avoid:** B) For existing records, create initial "dosya oluşturuldu" events based on `dosya.created_at` as a one-time migration. C) For ongoing: insert activity events in every tRPC mutation that changes a dosya (create, update, archive, stage changes, finans, belge, not).
**Warning signs:** Empty timeline for existing records after deployment.

### Pitfall 5: Belge Kategori Enum Mismatch
**What goes wrong:** Expanding `BELGE_KATEGORILER` in schema.ts without updating the Zod enum in `belge.ts` (`belgeKategoriEnum`) causes runtime validation errors when uploading documents with new categories.
**Why it happens:** Two separate enum definitions that must stay in sync.
**How to avoid:** Derive the Zod enum from `BELGE_KATEGORILER` array: `const belgeKategoriEnum = z.enum(BELGE_KATEGORILER)`. Single source of truth in `lib/schema.ts`.
**Warning signs:** Upload failures with "Invalid enum value" for new categories.

### Pitfall 6: Adding Columns to `dosya` Table Without Updating `dosya.list` Query
**What goes wrong:** Adding `hasar_dosya_no`, `kaza_tarihi`, etc. to the schema but forgetting to add them to the `dosya.list` SELECT query causes TypeScript errors or missing data in list view.
**Why it happens:** The list query manually selects specific columns (not `*`).
**How to avoid:** After schema changes, immediately update `dosya.list` query in `lib/trpc/routers/dosya.ts` to include new columns. Same for `getById` and any other queries.
**Warning signs:** TypeScript errors in dosya router, missing fields in UI.

## Code Examples

### Adding New Columns to `dosya` Table (D-06 through D-11)
```typescript
// lib/schema.ts — Add to dosya table definition
export const dosya = sqliteTable('dosya', {
  // ... existing columns ...
  hasar_dosya_no: text('hasar_dosya_no'),                    // D-06
  kaza_tarihi: text('kaza_tarihi'),                          // D-07: YYYY-MM-DD string
  muvekkil_sigorta_id: integer('muvekkil_sigorta_id')        // D-08
    .references(() => sigortaSirketi.id),
  kusur_orani_karsi: integer('kusur_orani_karsi'),           // D-09: 0-100 integer
  // ... rest unchanged ...
})
```

### Adding IBAN to `muvekkil` Table (D-21)
```typescript
// lib/schema.ts — Add to muvekkil table definition
export const muvekkil = sqliteTable('muvekkil', {
  // ... existing columns ...
  iban: text('iban'),  // Turkish IBAN: TR + 24 digits
  // ... rest unchanged ...
})

// Zod validation (TR IBAN format)
iban: z.string()
  .regex(/^TR\d{24}$/, 'Geçersiz IBAN formatı (TRXXXXXXXXXXXXXXXXXXXXXXXX)')
  .optional()
  .or(z.literal(''))
```

### Note Entity Schema (D-03)
```typescript
// lib/schema.ts
export const dosyaNot = sqliteTable('dosya_not', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull()
    .references(() => dosya.id, { onDelete: 'cascade' }),
  icerik: text('icerik').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_dosya_not_dosya').on(t.dosya_id),
])

export const dosyaNotRelations = relations(dosyaNot, ({ one }) => ({
  dosya: one(dosya, { fields: [dosyaNot.dosya_id], references: [dosya.id] }),
}))
```

### Activity Log Schema (D-04)
```typescript
// lib/schema.ts
export const OLAY_TURLERI = [
  'olusturma',           // dosya created
  'durum_degisikligi',  // aktif ↔ arsiv
  'surec_asama',        // stage transition (STK or Mahkeme)
  'finans',             // financial record added
  'belge',              // document uploaded
  'not',                // note added
  'durusma',            // hearing added
  'sure',               // deadline added
  'guncelleme',         // general update
] as const
export type OlayTur = typeof OLAY_TURLERI[number]

export const olayGunlugu = sqliteTable('olay_gunlugu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull()
    .references(() => dosya.id, { onDelete: 'cascade' }),
  olay_turu: text('olay_turu').notNull(),  // OlayTur
  aciklama: text('aciklama').notNull(),     // Turkish human-readable
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_olay_dosya').on(t.dosya_id),
  index('idx_olay_tarih').on(t.created_at),
])
```

### New STK/Mahkeme Stage Definitions (D-12, D-14)
```typescript
// lib/schema.ts — Replace existing STK_ASAMALAR and MAHKEME_ASAMALAR

export const STK_ASAMALAR = [
  'İHTAR', 'ARABULUCULUK', 'BAŞVURU', 'ÖN_İNCELEME',
  'BİLİRKİŞİ', 'ISLAH', 'KARAR', 'İTİRAZ', 'KESİNLEŞME',
] as const

export const MAHKEME_ASAMALAR = [
  'DAVA_DİLEKÇESİ_TEBLİĞ', 'CEVAP_DİLEKÇESİ_TEBLİĞ',
  'REPLİK_DİLEKÇESİ_TEBLİĞ', 'DUPLİK_DİLEKÇESİ_TEBLİĞ',
  'ÖN_İNCELEME', 'BİLİRKİŞİ', 'DURUŞMALAR',
  'KARAR', 'KARAR_TEBLİĞ', 'İSTİNAF', 'TEMYİZ', 'KESİNLEŞME',
] as const

// Corresponding labels (D-12, D-14)
export const STK_ASAMA_LABELS: Record<StkAsama, string> = {
  'İHTAR': 'İhtar',
  'ARABULUCULUK': 'Arabuluculuk',
  'BAŞVURU': 'Başvuru',
  'ÖN_İNCELEME': 'Ön İnceleme',
  'BİLİRKİŞİ': 'Bilirkişi',
  'ISLAH': 'Islah',
  'KARAR': 'Karar',
  'İTİRAZ': 'İtiraz',
  'KESİNLEŞME': 'Kesinleşme',
}

export const MAHKEME_ASAMA_LABELS: Record<MahkemeAsama, string> = {
  'DAVA_DİLEKÇESİ_TEBLİĞ': 'Dava Dilekçesi Tebliğ',
  'CEVAP_DİLEKÇESİ_TEBLİĞ': 'Cevap Dilekçesi Tebliğ',
  'REPLİK_DİLEKÇESİ_TEBLİĞ': 'Replik Dilekçesi Tebliğ',
  'DUPLİK_DİLEKÇESİ_TEBLİĞ': 'Duplik Dilekçesi Tebliğ',
  'ÖN_İNCELEME': 'Ön İnceleme',
  'BİLİRKİŞİ': 'Bilirkişi',
  'DURUŞMALAR': 'Duruşmalar',
  'KARAR': 'Karar',
  'KARAR_TEBLİĞ': 'Karar Tebliğ',
  'İSTİNAF': 'İstinaf',
  'TEMYİZ': 'Temyiz',
  'KESİNLEŞME': 'Kesinleşme',
}
```

### New StkSurecData and MahkemeSurecData Types (D-13, D-15)
```typescript
// lib/schema.ts — Replace existing type definitions

export type StkSurecData = {
  asama: StkAsama | null
  ihtar_tarihi: string | null
  arabuluculuk_son_tutanak_tarihi: string | null
  basvuru_tarihi: string | null
  stk_esas_no: string | null
  stk_karar_no: string | null
  stk_itiraz_esas_no: string | null
  stk_itiraz_karar_no: string | null
  bilirkisi_ucret_talep_tarihi: string | null
  bilirkisi_raporu_tebliğ_tarihi: string | null
  islah_tarihi: string | null
  karar_tarihi: string | null
  kesinlesme_tarihi: string | null
}

export type MahkemeSurecData = {
  asama: MahkemeAsama | null
  ilk_derece_esas_no: string | null
  ilk_derece_karar_no: string | null
  ilk_derece_mahkeme_adi: string | null
  istinaf_esas_no: string | null
  istinaf_karar_no: string | null
  istinaf_mahkeme_adi: string | null
  temyiz_esas_no: string | null
  temyiz_karar_no: string | null
  temyiz_mahkeme_adi: string | null
  dava_dilekcesi_tebliğ_tarihi: string | null
  cevap_dilekcesi_tebliğ_tarihi: string | null
  replik_dilekcesi_tebliğ_tarihi: string | null
  duplik_dilekcesi_tebliğ_tarihi: string | null
  bilirkisi_ucret_talep_tarihi: string | null
  bilirkisi_raporu_tebliğ_tarihi: string | null
  karar_tebliğ_tarihi: string | null
  istinaf_dilekcesi_tebliğ_tarihi: string | null
  istinaf_karar_tebliğ_tarihi: string | null
  temyiz_dilekcesi_tebliğ_tarihi: string | null
  temyiz_karar_tebliğ_tarihi: string | null
  kesinlesme_tarihi: string | null
}
```

### Expanding Belge Kategorileri (D-16)
```typescript
// lib/schema.ts — Expand BELGE_KATEGORILER
export const BELGE_KATEGORILER = [
  'Dilekçe', 'Karar', 'Poliçe', 'Sigorta poliçesi',
  'Hasar dosyası', 'Vekaletname',
  // New categories (D-16):
  'İhtarname', 'Bilirkişi Raporu', 'Tutanak', 'Tebliği', 'Diğer'
] as const

// lib/trpc/routers/belge.ts — Derive from schema instead of redefining
import { BELGE_KATEGORILER } from '@/lib/schema'
const belgeKategoriEnum = z.enum(BELGE_KATEGORILER)
// Remove old hardcoded enum definition
```

### Category-Based File Renaming (D-17)
```typescript
// When user selects a category, rename uploaded file to match category name
// Example: upload "1.pdf" + select "İhtarname" → saved as "İhtarname.pdf"

// lib/trpc/routers/belge.ts — In upload mutation, derive stored filename from category
import { BELGE_KATEGORILER } from '@/lib/schema'
import { extname } from 'path'

function getCategoryFilename(originalFilename: string, kategori: string): string {
  const ext = extname(originalFilename) // ".pdf", ".jpg", ".docx" etc.
  const sanitized = kategori.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '').trim()
  return `${sanitized}${ext}` // e.g. "İhtarname.pdf"
}

// In create mutation:
create: protectedProcedure
  .input(z.object({
    dosya_id: z.number().int(),
    kategori: z.enum(BELGE_KATEGORILER),
    file: z.custom<File>(),
  }))
  .mutation(async ({ input }) => {
    const storedName = getCategoryFilename(input.file.name, input.kategori)
    // Write file to disk with storedName, save storedName in DB
    // ...
  })

// Edge case: multiple files with same category (e.g. 2 İhtarname)
// Solution: append counter suffix — "İhtarname.pdf", "İhtarname-2.pdf"
async function getUniqueFilename(dir: string, baseName: string): Promise<string> {
  const ext = extname(baseName)
  const stem = baseName.slice(0, -ext.length)
  let candidate = baseName
  let counter = 2
  while (existsSync(path.join(dir, candidate))) {
    candidate = `${stem}-${counter}${ext}`
    counter++
  }
  return candidate
}
```

### Replacing EmptyTabContent with Notes + Timeline (D-01, D-02)
```typescript
// components/dosya/dosya-detail-tabs.tsx — Replace line 210-211
// OLD:
<TabsContent value="notlar" className="mt-4">
  <EmptyTabContent />
</TabsContent>

// NEW:
<TabsContent value="notlar" className="mt-4 space-y-6">
  <NotList dosyaId={dosyaId} />
  <Separator />
  <Timeline dosyaId={dosyaId} />
</TabsContent>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Computed timeline from records | Activity log table | D-04 decision | Must insert events in mutation handlers |
| Old STK stages (9 stages, different names) | New STK stages (9 stages, new names) | D-12 decision | Breaking: existing `surec_detay` JSON migration required |
| Old Mahkeme stages (8 stages) | New Mahkeme stages (12 stages) | D-14 decision | Breaking: same migration issue; adds duplicate stages with "Tebliğ" suffix |
| Hardcoded belge kategori Zod enum | Schema-derived enum | D-16 | Must update both schema.ts and belge.ts in sync |
| Single-field kusur oranı | Two-field display (karşı +	auto) | D-09 | Store only kusur_orani_karsi; compute müvekkil value |

**Deprecated/outdated:**
- Old `StkSurecData` type (fields: basvuru_no, basvuru_tarihi, kabul_tarihi, raportor_adi, bilirkisi, hakem_karar_tarihi, tebligat_tarihi, itiraz_tarihi) → Replace entirely with D-13 fields
- Old `MahkemeSurecData` type (fields: esas_no, karar_no, mahkeme_id, dava_tarihi, tebligat_tarihi, karar_tarihi) → Replace entirely with D-15 fields
- Old `stkDataSchema` and `mahkemeDataSchema` in surec.ts → Replace entirely

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Activity log events should be stored in a separate table rather than computed from existing records | Architecture Patterns | Medium — if approach changes, timeline component needs rewrite |
| A2 | Existing dosya records should have their `surec_detay.stk.asama` and `surec_detay.mahkeme.asama` reset to `null` during migration (since old→new mapping is not 1:1) | Runtime State Inventory | High — data loss risk if alternative mapping exists |
| A3 | `kusur_orani_karsi` should be stored as integer (0-100) not real/float to avoid precision issues | Architecture Patterns | Low — user can only enter whole percentages |
| A4 | `muvekkil_sigorta_id` references the existing `sigortaSirketi` table (same dropdown as karşı taraf sigorta) | D-08 | Low — confirmed by domain logic (both are insurance companies) |
| A5 | Note content (`icerik`) max length 5000 chars is sufficient for insurance case notes | D-03 | Low — adjust if users need more |
| A6 | Activity log descriptions (`aciklama`) stored as Turkish human-readable text, not structured JSON | D-04 | Low — simpler to render, harder to i18n (but app is Turkish-only) |
| A7 | Timeline events should be generated by tRPC mutations, not database triggers | D-04 | Medium — requires adding event insertion to every relevant mutation |

## Open Questions

1. **STK/Mahkeme data migration strategy**
   - What we know: Old stage values have no 1:1 mapping to new ones. Old fields (basvuru_no, kabul_tarihi, etc.) don't map to new fields.
   - What's unclear: Whether users prefer (a) complete reset of all surec_detay JSON to `{}`, or (b) best-effort mapping of some fields (e.g., `basvuru_no` → keep as `stk_esas_no`).
   - Recommendation: Reset to `{}` (clean slate) since the new field structures are fundamentally different. Add a one-time migration that also creates an activity log entry "Dosya oluşturuldu" for each existing dosya.

2. **Belge category expansion — exact new categories**
   - What we know: D-16 says categories should be expanded. Current list: Dilekçe, Karar, Poliçe, Sigorta poliçesi, Hasar dosyası, Vekaletname, Diğer.
   - What's unclear: The exact new category list is at agent's discretion.
   - Recommendation: Add İhtarname, Bilirkişi Raporu, Tutanak, Tebliği to cover the most common insurance dispute document types. Keep "Diğer" as catch-all.

3. **Activity log event insertion points**
   - What we know: Must log from dosya create, archive, stage changes, financial records, document uploads, notes, hearings, deadlines.
   - What's unclear: Whether to create events retroactively for existing data.
   - Recommendation: Create "dosya oluşturuldu" events retroactively from dosya.created_at in migration. Going forward, insert in all relevant mutations.

4. **Muvekkil Sigorta/Kasko Şirketi (D-08) — separate reference or shared dropdown**
   - What we know: The existing `sigortaSirketi` table is used for karşı taraf insurance. D-08 says to use "dropdown ile mevcut sigorta şirketi listesinden seçim."
   - What's unclear: Same dropdown or a separate one for müvekkil's insurance.
   - Recommendation: Use the same `sigortaSirketi` table — it's a shared reference of all insurance companies. Both fields query the same list.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/runtime | ✓ | — | — |
| SQLite | Data layer | ✓ | better-sqlite3 12.8.0 | — |
| Drizzle Kit | Migration generation | ✓ | 0.31.10 | — |
| Vitest | Testing | ✓ | 4.1.4 | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAB-01 | Notes CRUD creates/reads/updates/deletes per dosya | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "note"` | ❌ Wave 0 |
| TAB-01 | Timeline events created on dosya mutations | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "timeline"` | ❌ Wave 0 |
| TAB-02 | New dosya fields stored and retrieved | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "genel-bilgiler"` | ❌ Wave 0 |
| TAB-02 | New STK/Mahkeme stage enums accepted | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "surec"` | ❌ Wave 0 |
| TAB-02 | Belge kategori enum covers new values | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "belge"` | ❌ Wave 0 |
| UIUX-01 | IBAN field in muvekkil CRUD | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "iban"` | ❌ Wave 0 |
| UIUX-01 | Kusur oranı calculation (100 - karsi = muvekkil) | unit | `npx vitest run tests/13-tab-cleanup.test.ts -t "kusur"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/13-tab-cleanup.test.ts` — covers all phase requirements
- [ ] `tests/setup.ts` — may need updates for new schema tables

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | iron-session (existing) |
| V3 Session Management | no | iron-session (existing) |
| V4 Access Control | no | Single-user app |
| V5 Input Validation | yes | Zod schemas on all tRPC inputs |
| V6 Cryptography | no | Not applicable for this phase |

### Known Threat Patterns for Next.js/tRPC/SQLite Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS in note content | Tampering | React auto-escaping; use `whitespace-pre-wrap` for display, never `dangerouslySetInnerHTML` |
| SQL injection | Tampering | Drizzle parameterized queries (automatic) |
| Zod enum mismatch (belge kategori) | Tampering | Derive Zod enum from schema constant — single source of truth |
| Activity log injection | Tampering | Event descriptions generated server-side from known enums, never from user input |

## Sources

### Primary (HIGH confidence)
- `lib/schema.ts` — Full database schema, all types, enums, relations [VERIFIED: codebase]
- `lib/trpc/routers/*.ts` — All tRPC routers, mutation patterns, validation schemas [VERIFIED: codebase]
- `components/dosya/*.tsx` — All dosya UI components [VERIFIED: codebase]
- `components/muvekkil/*.tsx` — All müvekkil UI components [VERIFIED: codebase]
- `drizzle/0000_narrow_psylocke.sql` — Migration patterns [VERIFIED: codebase]
- `package.json` — Dependency versions [VERIFIED: codebase]
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — Locked Phase 10 decisions [VERIFIED: project files]
- `.planning/phases/12-taraf-tab-driver-info-ui/12-CONTEXT.md` — Locked Phase 12 decisions [VERIFIED: project files]

### Secondary (MEDIUM confidence)
- npm registry — verified drizzle-orm@0.45.2, zod@4.3.6 (latest) [VERIFIED: npm view]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in use
- Architecture: HIGH — patterns established in codebase, just extending them
- Pitfalls: HIGH — stage migration is the critical risk, well-documented above

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable stack, slow-moving dependencies)