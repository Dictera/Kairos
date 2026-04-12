# Phase 4: Deadline Engine + Dashboard - Research

**Researched:** 2026-04-12
**Domain:** Date arithmetic, SQLite schema extension, tRPC CRUD, Next.js dashboard UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Dashboard 3-section vertical layout: (1) top — 3 summary stat cards (Toplam Dosya, Aktif Dosya, Bu Ay Açılan), (2) middle — Yaklaşan Süreler list, (3) bottom — Bugünkü Duruşmalar list.
- **D-02:** Dashboard is read-only — no data entry from dashboard. Deadline and hearing rows link to their case detail page.
- **D-03:** Yaklaşan Süreler widget shows all deadlines in the 0–14 day range in a single list. Color code: red < 3 days, yellow < 7 days, neutral/grey 7–14 days. No separate "this week / upcoming" section.
- **D-04:** Each deadline item: süre adı + müvekkil adı + dosya no (link) + kaç gün kaldığı. Same format for auto-calculated and manual deadlines.
- **D-05:** Adli tatil (20 July–31 August) badge: `⚠ Adli Tatil — manuel kontrol`. Inline, non-blocking. No automatic date extension.
- **D-06:** Manual deadline (custom name, date, notes) added ONLY from the case detail page — Yargılama Süreci tab or a dedicated "Süreler" subsection. Dashboard is display-only.
- **D-07:** When a tebligat/karar date is saved in the Yargılama Süreci tab, deadline is silently calculated and written to `sure` table. No separate "calculated" toast — the save form toast is enough.
- **D-08:** STK itiraz süresi: `stk_tebligat_tarihi + 10 calendar days`
- **D-09:** İstinaf başvurusu: `mahkeme_karar_tebligat_tarihi + 14 calendar days`
- **D-10:** Cevap dilekçesi: `dava_tebligat_tarihi + 14 calendar days`
- **D-11:** Tebligat/karar tarihi silindiğinde (null'a dönünce) ilgili `sure` satırı da silinir. Aynı mutation bloğunda `if (!input.data.tebligat_tarihi)` guard'ı ile temizlenir.
- **D-12:** Manuel süreler düzenlenebilir. `sureRouter.updateManuel` prosedürü eklenir (ad, son_tarih, notlar). Düzenleme UI'ı case detail sayfasındaki Süreler subsection'ında yer alır.

### Claude's Discretion

- `sure` table full schema structure (id, dosya_id, ad, son_tarih, tur: 'otomatik'|'manuel', notlar, created_at)
- Exact visual design of summary stat cards (shadcn Card component recommended)
- How to abbreviate saat + mahkeme info in hearing list
- Empty state text when there are no today's hearings

### Deferred Ideas (OUT OF SCOPE)

- Adli tatil automatic date extension (HMK 93) — v2 requirement (SURE-V2-01)
- Public holiday (resmi tatil) calculation — v2 requirement (SURE-V2-02)
- Adding deadlines directly from the dashboard — explicitly rejected (D-06)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SURE-01 | STK itiraz süresi otomatik hesaplama: tebligat tarihi + 10 takvim günü | `date-fns` `addDays` + `parseISO`; trigger in `surec.updateStkData` mutation |
| SURE-02 | İstinaf başvuru süresi otomatik hesaplama: mahkeme karar tebligatı + 14 takvim günü | Same pattern as SURE-01 |
| SURE-03 | Cevap dilekçesi süresi otomatik hesaplama: dava tebligatı + 14 takvim günü | Same pattern as SURE-01 |
| SURE-04 | Manuel süre girişi: isim, tarih, dosyaya bağlı, notlar | New tRPC `sure.createManuel` mutation + form in case detail page |
| SURE-05 | Adli tatil döneminde hesaplanan sürelere uyarı gösterilir — otomatik uzatma yok | `isWithinInterval` check in deadline service + badge in UI |
| DASH-01 | Ana panel: yaklaşan süreler (7 ve 14 günlük uyarı), bugünkü duruşmalar, özet istatistikler | Single `dashboard.stats` tRPC query aggregating dosya counts + deadline list + today's hearings |
| DASH-02 | Yaklaşan duruşma ve sürelerin renk kodlu gösterimi (kırmızı: < 3 gün, sarı: < 7 gün) | Client-side `cn()` variant computation from daysUntil value; no server computation needed |
</phase_requirements>

---

## Summary

Phase 4 is a focused data-layer + dashboard feature set built entirely on the existing Next.js 15 / tRPC / Drizzle / SQLite stack. No new packages are required. The core challenge is the deadline calculation engine — three rules with calendar-day arithmetic and adli tatil overlap detection — plus wiring the auto-trigger into the existing `surec.updateStkData` and `surec.updateMahkemeData` mutations without introducing silent failures.

`date-fns` v4.1.0 is already installed and verified to export all needed functions: `addDays`, `parseISO`, `differenceInCalendarDays`, `isWithinInterval`, `format`. The adli tatil check requires constructing year-specific start/end dates (July 20 – August 31 of the deadline's year), which is straightforward with plain `Date` constructors.

The dashboard page is a stub (`<h1>Dashboard</h1>`) waiting to be filled. Data fetching follows the existing pattern: a single `protectedProcedure` query on the server side, called via `useTRPC` on the client. The `sure` table is a new addition to `lib/schema.ts` and requires a Drizzle migration.

**Primary recommendation:** Implement a pure `lib/deadline-service.ts` module (no DB imports) containing the three calculation functions and the adli tatil detector; import it from both the `surec` mutation (auto-calc trigger) and the `sure` router (validation). This keeps business logic testable in isolation without DB setup.

---

## Standard Stack

### Core (already installed — verified from package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `date-fns` | ^4.1.0 | Calendar-day arithmetic, date parsing, range checks | Already installed; `addDays`, `parseISO`, `differenceInCalendarDays`, `isWithinInterval` all verified present [VERIFIED: node_modules inspection] |
| `drizzle-orm` | ^0.45.2 | `sure` table schema, migrations, queries | Established project ORM [VERIFIED: package.json] |
| `drizzle-kit` | ^0.31.10 | `db:generate` + `db:migrate` workflow | Established migration workflow [VERIFIED: package.json] |
| `zod` | ^3.24.0 | Input validation for sure CRUD mutations | Established pattern for all routers [VERIFIED: package.json] |
| `@trpc/server` | ^11.16.0 | `sure` router, `dashboard` router | Established pattern [VERIFIED: package.json] |
| `sonner` | ^2.0.7 | Toast on manual deadline save; NOT for auto-calc (D-07) | Established notification pattern [VERIFIED: package.json] |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | ^7.72.1 | Manual deadline entry form | Follows pattern from Phase 2/3 forms |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for RHF | Required alongside react-hook-form |
| `lucide-react` | ^1.8.0 | Icons: Clock, AlertTriangle, Calendar icons in dashboard | Established icon library |
| `vitest` | ^4.1.4 | Unit tests for deadline-service.ts | Already configured — tests/04-*.test.ts pattern |

### No New Installations Required

All dependencies are already present. No `npm install` step needed for this phase.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── deadline-service.ts     # Pure functions: calculateDeadline(), isInAdliTatil(), getDaysUntil()
├── schema.ts               # ADD: sure table + sureRelations
├── trpc/
│   └── routers/
│       ├── sure.ts         # NEW: list, createManuel, delete procedures
│       ├── dashboard.ts    # NEW: stats query (file counts + deadlines + today's hearings)
│       ├── surec.ts        # MODIFY: auto-calc trigger in updateStkData + updateMahkemeData
│       └── _app.ts         # MODIFY: register sure + dashboard routers

app/(dashboard)/
├── page.tsx                # REPLACE stub with full dashboard component
└── dosyalar/[id]/
    └── (tabs)/
        └── surec-tab.tsx   # MODIFY: add "Süreler" subsection with manual deadline form

components/
└── dashboard/
    ├── stat-cards.tsx      # 3 summary stat cards
    ├── upcoming-deadlines.tsx  # Deadline list widget with color badges
    └── todays-hearings.tsx     # Today's hearing list

tests/
└── 04-deadline-service.test.ts  # Unit tests for pure calc functions
```

### Pattern 1: Pure Deadline Service Module

**What:** A module with no DB imports containing all calculation logic. Imported by both `surec.ts` mutations and the `sure` router.

**When to use:** Any time calculation logic needs to be testable in isolation. Keeps DB-touching code out of unit tests.

**Example:**
```typescript
// lib/deadline-service.ts
import { addDays, parseISO, isWithinInterval, differenceInCalendarDays } from 'date-fns'

// Adli tatil: 20 July – 31 August of the deadline's year
export function isInAdliTatil(dateStr: string): boolean {
  const d = parseISO(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 6, 20)  // July 20 (month 0-indexed)
  const end = new Date(year, 7, 31)    // August 31
  return isWithinInterval(d, { start, end })
}

// D-08: STK itiraz süresi = tebligat + 10 calendar days
export function calcStkItirazSuresi(tebligatTarihi: string): string {
  return addDays(parseISO(tebligatTarihi), 10).toISOString().split('T')[0]
}

// D-09: İstinaf başvurusu = mahkeme karar tebligat + 14 calendar days
export function calcIstinafBasvurusu(kararTebligatTarihi: string): string {
  return addDays(parseISO(kararTebligatTarihi), 14).toISOString().split('T')[0]
}

// D-10: Cevap dilekçesi = dava tebligat + 14 calendar days
export function calcCevapDilekce(davaTebligatTarihi: string): string {
  return addDays(parseISO(davaTebligatTarihi), 14).toISOString().split('T')[0]
}

// Returns calendar days from today to deadline (negative = overdue)
export function getDaysUntil(sonTarihStr: string): number {
  return differenceInCalendarDays(parseISO(sonTarihStr), new Date())
}
```

### Pattern 2: Auto-Calculation Trigger in surec.ts

**What:** After saving `stk.tebligat_tarihi`, `mahkeme.tebligat_tarihi`, or `mahkeme.dava_tarihi`, the mutation silently upserts a row in the `sure` table. D-07: no extra toast.

**When to use:** Only when the relevant date field transitions from null to a non-null value, OR when the value changes (recalculate). Use upsert logic (delete + insert, or update-if-exists) keyed on `(dosya_id, tur)`.

**Example:**
```typescript
// Inside surec.updateStkData mutation, after writing surec_detay:
// Source: established pattern in surec.ts + D-07 decision
if (input.data.tebligat_tarihi) {
  const sonTarih = calcStkItirazSuresi(input.data.tebligat_tarihi)
  // Upsert: delete existing auto-calc for this rule, then insert fresh
  await db.delete(sure)
    .where(and(eq(sure.dosya_id, input.dosya_id), eq(sure.tur, 'stk_itiraz')))
  await db.insert(sure).values({
    dosya_id: input.dosya_id,
    ad: 'STK Karara İtiraz Süresi',
    son_tarih: sonTarih,
    tur: 'stk_itiraz',
  })
}
```

### Pattern 3: Dashboard tRPC Query

**What:** A single `dashboard.stats` query returns all data needed for the dashboard page in one round-trip: file counts, upcoming deadlines (0–14 days) with muvekkil name, today's hearings.

**When to use:** Dashboard is read-only (D-02) — a single aggregated query avoids multiple waterfall fetches.

**Example:**
```typescript
// lib/trpc/routers/dashboard.ts
// Source: established Drizzle patterns from dosya.ts (count, leftJoin, sql)
dashboardStats: protectedProcedure.query(async () => {
  const today = new Date().toISOString().split('T')[0]
  const in14Days = addDays(new Date(), 14).toISOString().split('T')[0]

  const [totalRows, activeRows, thisMonthRows, deadlineRows, hearingRows] = await Promise.all([
    db.select({ count: count() }).from(dosya),
    db.select({ count: count() }).from(dosya).where(eq(dosya.durum, 'aktif')),
    db.select({ count: count() }).from(dosya).where(
      sql`strftime('%Y-%m', ${dosya.created_at}) = strftime('%Y-%m', 'now')`
    ),
    db.select({
      id: sure.id, ad: sure.ad, son_tarih: sure.son_tarih, tur: sure.tur,
      dosya_id: sure.dosya_id, dosya_no: dosya.dosya_no,
      muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
    })
      .from(sure)
      .leftJoin(dosya, eq(sure.dosya_id, dosya.id))
      .leftJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
      .where(and(sql`${sure.son_tarih} >= ${today}`, sql`${sure.son_tarih} <= ${in14Days}`))
      .orderBy(asc(sure.son_tarih)),
    db.select({
      id: durusma.id, tarih: durusma.tarih, saat: durusma.saat,
      mahkeme_kurum: durusma.mahkeme_kurum, tur: durusma.tur,
      dosya_id: durusma.dosya_id, dosya_no: dosya.dosya_no,
    })
      .from(durusma)
      .leftJoin(dosya, eq(durusma.dosya_id, dosya.id))
      .where(eq(durusma.tarih, today))
      .orderBy(asc(durusma.saat)),
  ])

  return {
    toplam_dosya: totalRows[0]?.count ?? 0,
    aktif_dosya: activeRows[0]?.count ?? 0,
    bu_ay_acilan: thisMonthRows[0]?.count ?? 0,
    yaklasan_sureler: deadlineRows,
    bugunki_durusmalar: hearingRows,
  }
})
```

### Pattern 4: Color-Coded Urgency Badge (Client Side)

**What:** Compute urgency class client-side from `daysUntil` number. Use `cn()` with conditional classes.

**When to use:** On every deadline row in the dashboard widget and anywhere else urgency is displayed.

**Example:**
```typescript
// Source: D-03 decision + established cn() pattern from lib/utils.ts
function urgencyClass(daysUntil: number): string {
  if (daysUntil < 3) return 'bg-red-100 text-red-700 border-red-200'
  if (daysUntil < 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}
```

### Anti-Patterns to Avoid

- **Storing computed `daysUntil` in DB:** `son_tarih` is the source of truth. `daysUntil` is always computed at query time on the server (or client). Never persist it.
- **Rebuilding deadlines in a cron job or background process:** This app is offline-first, single-user. Compute deadlines at insertion time and update them on date change. No scheduler needed.
- **Duplicate auto-calculated deadlines:** The upsert pattern (delete existing `tur='stk_itiraz'` for this `dosya_id` before inserting) prevents accumulation. Do NOT use plain `insert` without a prior delete or conflict resolution.
- **Using SQLite `DATE('now')` for today's date in deadline comparison:** Prefer passing `today` as a parameter from Node.js — SQLite's `DATE('now')` uses UTC, which may misalign if the user's local time crosses midnight. Pass `new Date().toISOString().split('T')[0]` from server code.
- **Skipping the adli tatil check for manual deadlines:** SURE-05 says all deadlines in adli tatil period show the warning — both auto-calculated AND manually entered. The badge must be computed for both `tur` values.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar-day date arithmetic | Custom day-counting loop | `date-fns` `addDays` + `parseISO` | Handles month-end wrap, DST edge cases correctly [VERIFIED: tested in project node_modules] |
| Date range overlap check | Manual month/day comparisons | `date-fns` `isWithinInterval` | Handles boundary days correctly (inclusive) [VERIFIED: tested] |
| Days-until calculation | Manual subtraction | `date-fns` `differenceInCalendarDays` | Handles DST, ignores time component [VERIFIED: function present] |
| Aggregated query pattern | Multiple sequential DB round-trips | `Promise.all([...])` with parallel Drizzle queries | Established pattern in dosya.ts; avoids N+1 |
| Urgency CSS classes | CSS-in-JS or dynamic style objects | `cn()` with conditional Tailwind classes | Established pattern; Tailwind v4 works with static class strings |

**Key insight:** All date logic for this phase reduces to "add N calendar days to an ISO date string." `date-fns` v4 makes this a one-liner and is already installed.

---

## Common Pitfalls

### Pitfall 1: Adli Tatil Year Boundary

**What goes wrong:** If the deadline falls on December 31 and the next year's adli tatil period is used in the check, dates around New Year may be incorrectly flagged.

**Why it happens:** Building start/end dates from a hardcoded year instead of the deadline's own year.

**How to avoid:** Always extract `year` from `parseISO(deadlineDate).getFullYear()` and construct `new Date(year, 6, 20)` / `new Date(year, 7, 31)` — not from the current year or hardcoded constant.

**Warning signs:** Test case with a June 15 deadline being flagged as adli tatil, or an August 20 date NOT being flagged.

### Pitfall 2: Duplicate Auto-Calculated Deadlines on Re-Save

**What goes wrong:** Every time the user saves the STK data form (even without changing `tebligat_tarihi`), a new `sure` row is inserted, creating duplicates in the dashboard.

**Why it happens:** Using plain `db.insert(sure)` without prior existence check or delete.

**How to avoid:** Use the delete-then-insert pattern keyed on `(dosya_id, tur)`. Alternatively, add a `UNIQUE(dosya_id, tur)` constraint on the `sure` table for auto-calculated types and use `INSERT OR REPLACE` (Drizzle: `.onConflictDoUpdate()`).

**Warning signs:** Dashboard shows "STK Karara İtiraz Süresi" twice for the same file after saving the form twice.

### Pitfall 3: Null Date Trigger — Calculating Deadline from Null

**What goes wrong:** `addDays(parseISO(null), 10)` throws or returns `Invalid Date`, polluting the `sure` table with null/invalid rows.

**Why it happens:** The trigger fires unconditionally on any `updateStkData` call, including calls that don't update `tebligat_tarihi`.

**How to avoid:** Guard with `if (input.data.tebligat_tarihi)` before the auto-calc block. Only upsert when the relevant date field is present and non-empty in the input.

**Warning signs:** TypeScript catches this if the deadline service's function parameter is typed as `string` (not `string | null`).

### Pitfall 4: Dashboard Query Using `DATE('now')` for "Today"

**What goes wrong:** SQLite's `DATE('now')` is UTC. If the user is in UTC+3 (Turkey) and saves at 23:30 local time (20:30 UTC), "today" in SQLite differs from "today" in the browser.

**Why it happens:** Using raw `sql\`date('now')\`` in the WHERE clause for today's hearings.

**How to avoid:** Pass today's date from Node.js server code: `const today = new Date().toISOString().split('T')[0]`. This still uses server UTC, but the server is local (localhost), so server and user are in the same timezone — acceptable for a single-user local app.

### Pitfall 5: `sure` Table Missing `dosya` Relation for Dashboard Query

**What goes wrong:** Dashboard query joins `sure → dosya → muvekkil` but `sure` has no Drizzle relation defined, causing type errors or requiring raw SQL.

**Why it happens:** Adding the `sure` table to schema without adding relations.

**How to avoid:** In `lib/schema.ts`, add both `sureRelations` (sure belongs to dosya) and update `dosyaRelations` (dosya has many sures). This enables Drizzle `with` clauses and typed joins.

### Pitfall 6: Tailwind v4 Dynamic Class Generation

**What goes wrong:** Classes like `bg-${color}-100` are not present in the Tailwind v4 generated CSS because v4 scans for static strings.

**Why it happens:** This project uses Tailwind v4 (confirmed by package.json `tailwindcss: ^4.2.2`). Dynamic class construction with template literals is not picked up by the scanner.

**How to avoid:** Always use full static class strings in `cn()` calls. Use an object lookup or conditional ternary:
```typescript
// CORRECT:
const cls = daysUntil < 3 ? 'bg-red-100 text-red-700' : daysUntil < 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
// WRONG:
const cls = `bg-${color}-100`
```

---

## Code Examples

Verified patterns from the existing codebase:

### `sure` Table Schema (new table in lib/schema.ts)
```typescript
// Source: established drizzle-orm/sqlite-core pattern from schema.ts
import { integer, text, sqliteTable, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const SURE_TUR = ['stk_itiraz', 'istinaf', 'cevap_dilekce', 'manuel'] as const
export type SureTur = typeof SURE_TUR[number]

export const sure = sqliteTable('sure', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  ad: text('ad').notNull(),
  son_tarih: text('son_tarih').notNull(),   // ISO date string 'YYYY-MM-DD'
  tur: text('tur').notNull(),               // SureTur
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  index('idx_sure_dosya').on(t.dosya_id),
  index('idx_sure_son_tarih').on(t.son_tarih),
])
```

### Adli Tatil Detection (verified by running in project node_modules)
```typescript
// lib/deadline-service.ts
// Source: [VERIFIED: manual test in project, 2026-04-12]
import { addDays, parseISO, isWithinInterval, differenceInCalendarDays } from 'date-fns'

export function isInAdliTatil(dateStr: string): boolean {
  const d = parseISO(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 6, 20)  // July 20
  const end = new Date(year, 7, 31)    // August 31
  return isWithinInterval(d, { start, end })
}
```

### Drizzle Upsert for Auto-Calculated Deadlines
```typescript
// Source: established Drizzle delete + insert pattern; onConflictDoUpdate alternative
import { and, eq } from 'drizzle-orm'
import { sure } from '@/lib/schema'
import { db } from '@/lib/db'

// Called from within surec.updateStkData mutation
async function upsertAutoDeadline(
  dosyaId: number,
  tur: 'stk_itiraz' | 'istinaf' | 'cevap_dilekce',
  ad: string,
  sonTarih: string
) {
  await db.delete(sure).where(and(eq(sure.dosya_id, dosyaId), eq(sure.tur, tur)))
  await db.insert(sure).values({ dosya_id: dosyaId, ad, son_tarih: sonTarih, tur })
}
```

### tRPC Sure Router Skeleton
```typescript
// lib/trpc/routers/sure.ts
// Source: established pattern from surec.ts and dosya.ts
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sure, dosya, muvekkil } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'

export const sureRouter = createTRPCRouter({
  listByDosya: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) =>
      db.select().from(sure)
        .where(eq(sure.dosya_id, input.dosya_id))
        .orderBy(asc(sure.son_tarih))
    ),

  createManuel: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      ad: z.string().min(1).max(200),
      son_tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notlar: z.string().max(2000).optional().or(z.literal('')),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(sure).values({ ...input, tur: 'manuel' }).returning()
      return row
    }),

  updateManuel: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      ad: z.string().min(1).max(200),
      son_tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notlar: z.string().max(2000).optional().or(z.literal('')),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db.update(sure).set(data).where(eq(sure.id, id)).returning()
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(sure).where(eq(sure.id, input.id))
      return { success: true }
    }),
})
```

### Dashboard Page Data Consumption
```typescript
// app/(dashboard)/page.tsx — Server Component using tRPC server-side caller
// Source: established Next.js App Router + tRPC pattern from existing detail pages
// Use useTRPC hook on client OR createCaller on server — client component is simpler
// for dashboard (needs no SSR SEO); follow existing client component pattern

'use client'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(trpc.dashboard.stats.queryOptions())
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `moment.js` for date arithmetic | `date-fns` v4 tree-shakeable functions | ~2020 | No import needed — already in project |
| Custom deadline tables with `status` field | Simple `son_tarih` + computed `daysUntil` at query time | N/A | Less DB state to maintain; deadline color is always fresh |
| React class components for dashboard stats | Functional components + React Query `useQuery` | ~2019 | Already the project pattern |

**Deprecated/outdated:**
- Drizzle `push` command: explicitly rejected in project decisions — always `generate` + `migrate`.
- SQLite `DATE('now')` in WHERE for today's hearings: use JS `new Date()` passed as parameter (see Pitfall 4).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `sure` table `tur` enum: `'stk_itiraz' \| 'istinaf' \| 'cevap_dilekce' \| 'manuel'` — CONTEXT.md says Claude's discretion; these names are proposed | Standard Stack / Code Examples | Minor naming refactor; no logic change |
| A2 | Dashboard uses a client component with `useTRPC` + `useQuery` (same as existing pattern) rather than a React Server Component with a tRPC server caller | Architecture Patterns | If server component is preferred, the data fetching code changes but the tRPC procedure itself stays the same |
| A3 | `sure` rows for auto-calculated deadlines are re-upserted when dates change (not just on first entry) | Architecture Patterns | If only first-entry is handled, stale deadlines persist after date corrections |

**All other claims are verified via codebase inspection, package.json, or live node_modules execution.**

---

## Open Questions

*All open questions resolved by user decision.*

1. **Deletion of auto-calculated deadlines when source date is cleared** → **RESOLVED (D-11)**
   - Decision: Yes — delete the `sure` row when trigger date is set to null/empty. Guard: `if (!input.data.tebligat_tarihi)` in mutation block.

2. **`sure` row for manual deadlines — can they be edited after creation?** → **RESOLVED (D-12)**
   - Decision: Yes — `sureRouter.updateManuel` procedure is required. Edit UI in case detail Süreler subsection.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 is purely code/schema changes within the existing local SQLite + Next.js stack. No new external tools, services, or runtimes are required. All dependencies confirmed present in `package.json` and `node_modules`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 |
| Config file | `vitest.config.ts` (present, configured) |
| Quick run command | `npx vitest run tests/04-deadline-service.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SURE-01 | `calcStkItirazSuresi('2024-07-15')` returns `'2024-07-25'` | unit | `npx vitest run tests/04-deadline-service.test.ts` | Wave 0 |
| SURE-02 | `calcIstinafBasvurusu('2024-08-01')` returns `'2024-08-15'` | unit | same | Wave 0 |
| SURE-03 | `calcCevapDilekce('2024-06-01')` returns `'2024-06-15'` | unit | same | Wave 0 |
| SURE-04 | `sureRouter._def.procedures` has `createManuel`, `listByDosya`, `delete` | unit | `npx vitest run tests/04-sure.test.ts` | Wave 0 |
| SURE-05 | `isInAdliTatil('2024-07-20')` → `true`; `isInAdliTatil('2024-09-01')` → `false` | unit | `npx vitest run tests/04-deadline-service.test.ts` | Wave 0 |
| DASH-01 | `dashboardRouter._def.procedures` has `stats` | unit | `npx vitest run tests/04-dashboard.test.ts` | Wave 0 |
| DASH-02 | `getDaysUntil` returns correct integer for urgency classification | unit | `npx vitest run tests/04-deadline-service.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/04-deadline-service.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/04-deadline-service.test.ts` — covers SURE-01, SURE-02, SURE-03, SURE-05, DASH-02
- [ ] `tests/04-sure.test.ts` — covers SURE-04 (router procedure existence)
- [ ] `tests/04-dashboard.test.ts` — covers DASH-01 (router procedure existence)

*(No framework install needed — Vitest already configured and working)*

---

## Security Domain

This phase adds new tRPC procedures. All existing procedures use `protectedProcedure` (requires valid session cookie). The `sure` and `dashboard` routers must follow the same pattern.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (inherited) | `protectedProcedure` on all sure + dashboard routes |
| V3 Session Management | yes (inherited) | `iron-session` HttpOnly cookie — no changes needed |
| V4 Access Control | yes | All `sure` mutations check session; `dosya_id` ownership is implicit (single-user app) |
| V5 Input Validation | yes | Zod schemas on all `sure` router inputs; `son_tarih` validated with `/^\d{4}-\d{2}-\d{2}$/` regex |
| V6 Cryptography | no | No new cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Direct object reference (delete arbitrary `sure` row by id) | Tampering | Single-user app — session check on `protectedProcedure` is sufficient; no per-row ownership check needed |
| Malformed date string causing service crash | Tampering | Zod regex validation on `son_tarih`; `parseISO` on unvalidated input would throw without Zod guard |

---

## Sources

### Primary (HIGH confidence)

- `D:/sigorta-takip/lib/schema.ts` — existing table structures, established patterns
- `D:/sigorta-takip/lib/trpc/routers/surec.ts` — mutation pattern to extend with auto-calc
- `D:/sigorta-takip/lib/trpc/routers/dosya.ts` — `Promise.all` parallel query pattern, count, leftJoin
- `D:/sigorta-takip/package.json` — all installed package versions verified
- `D:/sigorta-takip/vitest.config.ts` — test infrastructure configuration
- `D:/sigorta-takip/.planning/phases/04-deadline-engine-dashboard/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Live node_modules execution: verified `date-fns` v4 exports `addDays`, `parseISO`, `isWithinInterval`, `differenceInCalendarDays`, `format` and tested adli tatil boundary behavior

### Tertiary (LOW confidence — see Assumptions Log)

- `sure` table `tur` enum naming: Claude's discretion per CONTEXT.md (A1)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json + node_modules
- Architecture: HIGH — patterns extracted directly from existing Phase 2/3 code
- Pitfalls: HIGH — derived from codebase inspection (duplicate insert risk, null guard, Tailwind v4 static class requirement)
- Deadline calculations: HIGH — verified running `date-fns` functions in project node_modules

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable stack — date-fns, drizzle, tRPC APIs unlikely to change in 30 days)
