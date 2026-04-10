# ARCHITECTURE.md — Sigorta Uyuşmazlık Takip

**Domain:** Local-first legal case management web app
**Researched:** 2026-04-10
**Confidence note:** WebSearch/WebFetch disabled. Based on training data (cutoff Aug 2025) covering tRPC v11, Next.js 15 GA, Drizzle ORM 0.30+. Flag items marked LOW are worth verifying against current docs.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (localhost:3000)              │
│                                                           │
│  ┌─────────────┐    ┌──────────────────────────────────┐ │
│  │  Next.js 15  │    │    React Query + tRPC Client     │ │
│  │  App Router  │◄──►│  (type-safe RPC over HTTP/fetch) │ │
│  │  (RSC + CC)  │    └──────────────────────────────────┘ │
│  └──────┬──────┘                                          │
└─────────┼───────────────────────────────────────────────┘
          │ HTTP (localhost only)
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js Server Process                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  App Router Route Handler: /api/trpc/[...trpc]   │    │
│  │  (fetchRequestHandler — tRPC v11 fetch adapter)  │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │            tRPC Router (appRouter)                │    │
│  │   dosya • muvekkil • takvim • finans • dilekce   │    │
│  │   rapor • belge • ayarlar                        │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │             Service / Query Layer                 │    │
│  │    Pure functions — no HTTP, just DB calls        │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │         Drizzle ORM (better-sqlite3)              │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │         ./data/db.sqlite  (single file)           │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │       ./public/uploads/  (file storage)           │    │
│  │       Next.js static serving — no extra server    │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Why this shape:**
- Single Next.js process handles both SSR and API — no separate Express server needed for a local app
- tRPC over a single catch-all route handler gives full type safety without code-gen
- better-sqlite3 (sync) is simpler than libsql/async; perfectly adequate for single-user localhost
- `./public/uploads` is served as static files by Next.js itself — zero config, no CDN needed

---

## Directory Structure

```
sigorta-takip/
├── .env.local                    # APP_PASSWORD=..., DATABASE_URL=./data/db.sqlite
├── data/
│   └── db.sqlite                 # gitignored — the database
├── public/
│   └── uploads/                  # gitignored — uploaded documents
│       └── {dosyaId}/            # one subfolder per case
│           └── {uuid}-{filename}
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # redirect to /dosyalar or /login
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dosyalar/
│   │   │   ├── page.tsx          # list view
│   │   │   └── [id]/
│   │   │       └── page.tsx      # detail view (tabs)
│   │   ├── takvim/
│   │   │   └── page.tsx
│   │   ├── muvekkilller/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── finans/
│   │   │   └── page.tsx
│   │   ├── raporlar/
│   │   │   └── page.tsx
│   │   ├── ayarlar/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── trpc/
│   │       │   └── [...trpc]/
│   │       │       └── route.ts  # tRPC fetch adapter entry point
│   │       └── upload/
│   │           └── route.ts      # multipart file upload handler
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts          # Drizzle client singleton
│   │   │   └── schema/
│   │   │       ├── index.ts      # re-exports all schemas
│   │   │       ├── dosya.ts
│   │   │       ├── muvekkil.ts
│   │   │       ├── taraf.ts
│   │   │       ├── durusma.ts
│   │   │       ├── belge.ts
│   │   │       ├── finans.ts
│   │   │       ├── dilekce.ts
│   │   │       └── ayarlar.ts
│   │   ├── trpc/
│   │   │   ├── init.ts           # createTRPCContext, t, publicProcedure, protectedProcedure
│   │   │   ├── root.ts           # appRouter — merges sub-routers
│   │   │   └── routers/
│   │   │       ├── dosya.ts
│   │   │       ├── muvekkil.ts
│   │   │       ├── takvim.ts
│   │   │       ├── finans.ts
│   │   │       ├── dilekce.ts
│   │   │       ├── belge.ts
│   │   │       └── raporlar.ts
│   │   └── services/             # pure business logic, called by tRPC procedures
│   │       ├── dosya.service.ts
│   │       └── pdf.service.ts
│   ├── trpc/
│   │   ├── client.ts             # createTRPCReact() + httpBatchLink
│   │   ├── server.ts             # createTRPCContext for RSC (caller directly)
│   │   └── provider.tsx          # TRPCProvider + QueryClientProvider
│   ├── components/
│   │   ├── ui/                   # shadcn/ui generated components
│   │   └── [feature]/            # feature-scoped components
│   ├── lib/
│   │   ├── auth.ts               # checkPassword(), createSession(), getSession()
│   │   ├── pdf.ts                # PDF generation wrapper
│   │   └── utils.ts              # shadcn cn() and misc helpers
│   └── middleware.ts             # auth guard — protects all routes except /login and /api/trpc
├── drizzle/
│   └── migrations/               # drizzle-kit generated SQL files
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

---

## Data Model

### Core Entities and Relationships

```
muvekkil (1) ─────────────────── (∞) dosya
dosya (1) ─────────────────────── (∞) durusma
dosya (1) ─────────────────────── (∞) belge
dosya (1) ─────────────────────── (∞) finans_kalemi
dosya (1) ─────────────────────── (∞) taraf
dosya (1) ─────────────────────── (∞) not_kaydi
dilekce_sablonu (∞) ──────────── dosya (used to generate)
```

### Discriminated Union for Dosya Type: Single Table with JSON Extension

**Decision: One `dosya` table with `tur` enum + type-specific JSON column**

This is the right call for a solo app with 200 records. Separate tables (STK vs Mahkeme) force JOINs everywhere and complicate list queries. A `surec_detay` JSON column holds the type-specific state without schema churn.

```typescript
// src/server/db/schema/dosya.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const dosyaTuru = ['STK_TAHKIM', 'ASLIYE_TICARET', 'ASLIYE_HUKUK'] as const
export type DosyaTuru = typeof dosyaTuru[number]

// STK aşama sırası: BASVURU → KABUL → RAPORTÖR → HAKEM_KARARI → ITIRAZ → KARAR_KESINLESTI
export const stkAsamalari = [
  'BASVURU',
  'KABUL',
  'RAPORTÖR_ATANDI',
  'RAPORTÖR_INCELEME',
  'HAKEM_KURULU',
  'HAKEM_KARARI',
  'ITIRAZ_SURESI',
  'ITIRAZ_DAVASI',
  'KARAR_KESINLESTI',
] as const

// Mahkeme aşama sırası: DAVA_ACILDI → TEBLİGAT → CEVAP → TAHKIKAT → KARAR → İSTİNAF
export const mahkemeAsamalari = [
  'DAVA_ACILDI',
  'DAVA_KARTI_OLUSTURULDU',
  'DAVA_DILI_TEBLIGAT',
  'CEVAP_DILEKCE_SURESI',
  'TARAF_BEYANLAR',
  'TAHKIKAT',
  'BILIRKISI',
  'SÖZLÜ_YARGILAMA',
  'KARAR',
  'ISTINAF',
  'TEMYIZ',
  'KESINLESTI',
] as const

export const dosyaDurumu = ['AKTIF', 'KAPALI', 'BEKLEMEDE', 'ARSIV'] as const

export const dosyalar = sqliteTable('dosyalar', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dosyaNo:        text('dosya_no').notNull().unique(),   // e.g. "2024/001"
  tur:            text('tur', { enum: dosyaTuru }).notNull(),
  durum:          text('durum', { enum: dosyaDurumu }).notNull().default('AKTIF'),

  // Current stage — value comes from stkAsamalari or mahkemeAsamalari depending on tur
  mevcutAsama:    text('mevcut_asama').notNull(),

  // Parties
  muvekkilId:     text('muvekkil_id').references(() => muvekkillar.id),
  sigortaSirketi: text('sigorta_sirketi').notNull(),
  sigortaTuru:    text('sigorta_turu').notNull(),        // 'KASKO', 'TRAFIK', 'SAGLIK', etc.

  // Claim amounts
  talep:          real('talep_tutari'),
  para_birimi:    text('para_birimi').default('TRY'),

  // Key dates
  olayTarihi:     text('olay_tarihi'),                  // ISO 8601 date string
  basvuruTarihi:  text('basvuru_tarihi'),
  sonKararTarihi: text('son_karar_tarihi'),

  // Type-specific data as JSON — avoids schema explosion
  // STK: { komisyonNo, raportorAdi, hakemKuruluNo, kararOzeti }
  // Mahkeme: { mahkemeAdi, esasNo, hakimAdi, tebligatDurumu }
  surecDetay:     text('surec_detay', { mode: 'json' }).$type<SurecDetay>(),

  // Free text
  aciklama:       text('aciklama'),
  etiketler:      text('etiketler', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),

  olusturmaTarihi: text('olusturma_tarihi').default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  guncellemeTarihi: text('guncelleme_tarihi').default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

// TypeScript discriminated union for surecDetay
export type StkDetay = {
  tur: 'STK_TAHKIM'
  komisyonNo?: string
  raportorAdi?: string
  raportorAtamaTarihi?: string
  hakemKuruluNo?: string
  kararOzeti?: string
  kararTarihi?: string
}

export type MahkemeDetay = {
  tur: 'ASLIYE_TICARET' | 'ASLIYE_HUKUK'
  mahkemeAdi?: string
  mahkemeSehri?: string
  esasNo?: string            // "2024/1234 E."
  kararNo?: string           // "2024/5678 K."
  hakimAdi?: string
  harciOdendi?: boolean
  tebligatDurumu?: string
}

export type SurecDetay = StkDetay | MahkemeDetay
```

### Other Core Tables

```typescript
// src/server/db/schema/muvekkil.ts
export const muvekkillar = sqliteTable('muvekkillar', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ad:        text('ad').notNull(),
  soyad:     text('soyad').notNull(),
  tcKimlik:  text('tc_kimlik'),
  telefon:   text('telefon'),
  email:     text('email'),
  adres:     text('adres'),
  notlar:    text('notlar'),
  olusturmaTarihi: text('olusturma_tarihi')
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

// src/server/db/schema/durusma.ts
export const durusmalar = sqliteTable('durusmalar', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dosyaId:     text('dosya_id').notNull().references(() => dosyalar.id, { onDelete: 'cascade' }),
  tarih:       text('tarih').notNull(),            // ISO 8601
  saat:        text('saat'),                       // "09:30"
  tur:         text('tur').notNull(),              // 'DURUSMA', 'HAKEM_OTURUMU', 'BILIRKISI', etc.
  mahkeme:     text('mahkeme'),
  notlar:      text('notlar'),
  tamamlandi:  integer('tamamlandi', { mode: 'boolean' }).default(false),
  hatirlatici: integer('hatirlatici_gun').default(3), // days before to alert
})

// src/server/db/schema/belge.ts
export const belgeler = sqliteTable('belgeler', {
  id:          text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dosyaId:     text('dosya_id').notNull().references(() => dosyalar.id, { onDelete: 'cascade' }),
  ad:          text('ad').notNull(),
  aciklama:    text('aciklama'),
  dosyaYolu:   text('dosya_yolu').notNull(),       // /uploads/{dosyaId}/{uuid}-{name}
  mimeType:    text('mime_type').notNull(),
  boyut:       integer('boyut').notNull(),          // bytes
  tur:         text('tur'),                        // 'DILEKCE', 'KARAR', 'SOZLESME', etc.
  yuklemeTarihi: text('yukleme_tarihi')
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

// src/server/db/schema/finans.ts
export const finansKalemleri = sqliteTable('finans_kalemleri', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  dosyaId:   text('dosya_id').notNull().references(() => dosyalar.id, { onDelete: 'cascade' }),
  tur:       text('tur', {
    enum: ['GELEN_ODEME', 'GIDEN_ODEME', 'MASRAF', 'HARC', 'VEKALET_UCRETI']
  }).notNull(),
  tutar:     real('tutar').notNull(),
  aciklama:  text('aciklama'),
  tarih:     text('tarih').notNull(),
  belgeId:   text('belge_id').references(() => belgeler.id), // optional receipt link
  olusturmaTarihi: text('olusturma_tarihi')
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})

// src/server/db/schema/dilekce.ts
export const dilkeceSablonlari = sqliteTable('dilekce_sablonlari', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ad:        text('ad').notNull(),
  tur:       text('tur').notNull(),          // 'STK_ITIRAZ', 'DAVA_DILEKCE', etc.
  sablon:    text('sablon').notNull(),       // Handlebars/Mustache template string
  degiskenler: text('degiskenler', { mode: 'json' }).$type<string[]>(),
  aktif:     integer('aktif', { mode: 'boolean' }).default(true),
  olusturmaTarihi: text('olusturma_tarihi')
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
})
```

### Indexes to Add

```typescript
// In the table definitions, add these indexes:
import { index } from 'drizzle-orm/sqlite-core'

// On dosyalar: frequently filtered columns
export const dosyalarDurumIdx = index('dosyalar_durum_idx').on(dosyalar.durum)
export const dosyalarTurIdx = index('dosyalar_tur_idx').on(dosyalar.tur)
export const dosyalarMuvekkilIdx = index('dosyalar_muvekkil_idx').on(dosyalar.muvekkilId)

// On durusmalar: calendar queries by date
export const durusmalarTarihIdx = index('durusmalar_tarih_idx').on(durusmalar.tarih)
export const durusmalarDosyaIdx = index('durusmalar_dosya_idx').on(durusmalar.dosyaId)
```

---

## tRPC Setup Pattern

**Decision: Route handler (not Server Actions) for tRPC**

Server Actions work for simple form submissions, but tRPC over a route handler gives:
- Full React Query integration (caching, invalidation, optimistic updates)
- Consistent mutation + query pattern — one mental model
- Batch requests out of the box via `httpBatchLink`
- Type inference flows from server router → client without any extra step

### 1. tRPC Context and Initialization

```typescript
// src/server/trpc/init.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { getSession } from '@/lib/auth'
import { db } from '@/server/db'
import { ZodError } from 'zod'

export type Context = {
  db: typeof db
  session: { authenticated: boolean } | null
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<Context> => {
  const session = await getSession(opts.headers)
  return { db, session }
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure  // only used for /login check

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.authenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})
```

### 2. Route Handler (App Router)

```typescript
// src/app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/trpc/root'
import { createTRPCContext } from '@/server/trpc/init'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: process.env.NODE_ENV === 'development'
      ? ({ path, error }) => console.error(`tRPC error on ${path}:`, error)
      : undefined,
  })

export { handler as GET, handler as POST }
```

### 3. Client Setup

```typescript
// src/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/trpc/root'

export const trpc = createTRPCReact<AppRouter>()
```

```typescript
// src/trpc/provider.tsx — wrap app layout
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './client'
import { useState } from 'react'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }))
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

### 4. Example Router

```typescript
// src/server/trpc/routers/dosya.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import { dosyalar, dosyaTuru, dosyaDurumu } from '@/server/db/schema/dosya'
import { eq, like, and, desc } from 'drizzle-orm'

export const dosyaRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      tur: z.enum(dosyaTuru).optional(),
      durum: z.enum(dosyaDurumu).optional(),
      ara: z.string().optional(),
      sayfa: z.number().default(1),
      sayfaBoyutu: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { sayfa, sayfaBoyutu, ara, tur, durum } = input
      const offset = (sayfa - 1) * sayfaBoyutu

      const conditions = [
        tur    ? eq(dosyalar.tur, tur)       : undefined,
        durum  ? eq(dosyalar.durum, durum)   : undefined,
        ara    ? like(dosyalar.dosyaNo, `%${ara}%`) : undefined,
      ].filter(Boolean)

      const rows = await ctx.db
        .select()
        .from(dosyalar)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(dosyalar.olusturmaTarihi))
        .limit(sayfaBoyutu)
        .offset(offset)

      return rows
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [dosya] = await ctx.db
        .select().from(dosyalar).where(eq(dosyalar.id, input.id))
      if (!dosya) throw new TRPCError({ code: 'NOT_FOUND' })
      return dosya
    }),

  create: protectedProcedure
    .input(/* Zod schema matching dosyalar insert */)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(dosyalar).values(input).returning()
      return created
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(/* partial schema */))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const [updated] = await ctx.db
        .update(dosyalar).set({ ...data, guncellemeTarihi: new Date().toISOString() })
        .where(eq(dosyalar.id, id)).returning()
      return updated
    }),
})
```

---

## Auth Flow

**Decision: Signed HttpOnly cookie + Next.js middleware**

Env-based password means no user table. Pattern: user submits password → server compares to `process.env.APP_PASSWORD` → if match, sets signed session cookie → middleware checks cookie on every request.

**Why cookie over JWT for localhost:**
- HttpOnly cookie is unreachable by XSS (irrelevant locally, but free protection)
- No token storage decision (`localStorage` vs memory) — cookie is automatic
- `iron-session` (or `jose`) handles signing with a secret; 1 dependency, no boilerplate

```typescript
// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'change-this-in-production-32-chars-min'
)
const COOKIE_NAME = 'sat_session'  // sat = sigorta uyuşmazlık takip

export async function createSession(res: NextResponse): Promise<void> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,   // 7 days
  })
}

export async function getSession(headers: Headers) {
  const cookieHeader = headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { authenticated: !!payload.authenticated }
  } catch {
    return null
  }
}

// In login route handler:
export async function checkPassword(password: string): Promise<boolean> {
  return password === process.env.APP_PASSWORD
}
```

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/trpc/auth']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = await getSession(req.headers)
  if (!session?.authenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
}
```

**Login flow:**
1. `GET /login` → renders login form (no session required)
2. `POST /login` (route handler or tRPC `auth.login` mutation) → compare password → `createSession()` → redirect to `/dosyalar`
3. Middleware checks cookie on every non-public path
4. `GET /api/logout` clears cookie

---

## File Upload Flow

**Decision: Dedicated `/api/upload` route handler with `formidable` or native Web API**

Next.js 15 server actions can handle FormData but have a 4MB body size limit by default that requires config to raise. A dedicated route handler gives explicit control over limits, destination, and error handling.

**Storage: `./public/uploads/{dosyaId}/`**

Already mandated by the project constraints. This means files are accessible as static URLs (`/uploads/{dosyaId}/{file}`) — no separate serving logic.

**Important: `.gitignore` `public/uploads/` and `data/` — these are runtime data, not source.**

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { db } from '@/server/db'
import { belgeler } from '@/server/db/schema/belge'

const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20MB — reasonable for PDFs and scanned docs
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function POST(req: NextRequest) {
  const session = await getSession(req.headers)
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const dosyaId = formData.get('dosyaId') as string | null

  if (!file || !dosyaId) {
    return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Dosya 20MB limitini aşıyor' }, { status: 413 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Desteklenmeyen dosya türü' }, { status: 415 })
  }

  const ext = file.name.split('.').pop()
  const safeName = `${randomUUID()}.${ext}`
  const dir = join(UPLOAD_DIR, dosyaId)
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(dir, safeName), Buffer.from(bytes))

  // Record in DB
  const dosyaYolu = `/uploads/${dosyaId}/${safeName}`
  const [belge] = await db.insert(belgeler).values({
    dosyaId,
    ad: file.name,
    dosyaYolu,
    mimeType: file.type,
    boyut: file.size,
  }).returning()

  return NextResponse.json({ belge })
}
```

**Next.js body size limit:** Next.js 15 uses the Web `Request` API for route handlers; the 4MB limit in older versions applied to the Node.js `bodyParser`. With route handlers and `request.formData()`, the limit is controlled by the OS and Node.js memory, not Next.js itself. For safety, add to `next.config.ts`:

```typescript
// next.config.ts
export default {
  experimental: {
    serverActions: { bodySizeLimit: '20mb' }  // only needed if you use Server Actions for upload
  }
}
```

**Client-side upload (React component pattern):**
```typescript
const uploadFile = async (file: File, dosyaId: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('dosyaId', dosyaId)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

---

## PDF Generation Approach

**Decision: `@react-pdf/renderer` on the server via a Route Handler**

| Option | Verdict | Reason |
|--------|---------|--------|
| `@react-pdf/renderer` (server) | **RECOMMENDED** | React component DSL, runs in Node.js, streams PDF bytes |
| Puppeteer / headless Chrome | Avoid | 300MB+ binary, slow startup, overkill for templates |
| `jsPDF` (client-side) | Avoid | Canvas-based, poor Turkish character support, no server-side reuse |
| `pdfkit` | Fallback | Good but imperative API — harder for complex layouts |

`@react-pdf/renderer` lets you write PDF templates as React components (with its own layout engine), runs entirely server-side, produces standards-compliant PDFs with proper Unicode/Turkish support, and the output is a Node.js `Readable` stream that can be directly returned as a response.

### Template Architecture

```typescript
// src/server/services/pdf.service.ts
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

// Generic template filler using Handlebars-like replacement
export async function renderDilkcePDF(
  sablon: string,        // raw text template with {{variable}} markers
  degiskenler: Record<string, string>
): Promise<Buffer> {
  const doldurulmus = fillTemplate(sablon, degiskenler)
  const element = React.createElement(DilkecePDFTemplate, { content: doldurulmus })
  return renderToBuffer(element)
}

function fillTemplate(sablon: string, vars: Record<string, string>): string {
  return sablon.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`)
}
```

```tsx
// src/components/pdf/DilkecePDFTemplate.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register a Turkish-capable font (DejaVu or a bundled OTF)
Font.register({
  family: 'DejaVu',
  src: '/fonts/DejaVuSans.ttf',   // place in public/fonts/
})

const styles = StyleSheet.create({
  page:    { padding: '2cm', fontFamily: 'DejaVu', fontSize: 11, lineHeight: 1.5 },
  header:  { marginBottom: 20, textAlign: 'center', fontSize: 13, fontWeight: 'bold' },
  body:    { whiteSpace: 'pre-wrap' },
})

export function DilkecePDFTemplate({ content }: { content: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>SİGORTA UYUŞMAZLIK TAKİP</Text>
        </View>
        <View style={styles.body}>
          <Text>{content}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

```typescript
// src/app/api/pdf/route.ts — dedicated PDF generation endpoint
import { NextRequest, NextResponse } from 'next/server'
import { renderDilkcePDF } from '@/server/services/pdf.service'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req.headers)
  if (!session?.authenticated) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { sablon, degiskenler } = await req.json()
  const buffer = await renderDilkcePDF(sablon, degiskenler)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="dilekce.pdf"',
    },
  })
}
```

**Turkish font note:** The default PDF fonts do not support Turkish characters (ş, ğ, ü, ı, ö, ç). You must register a Unicode font. DejaVu Sans is a good free option; Noto Sans is another. Place the `.ttf` file in `public/fonts/` so it is accessible as a file path at runtime.

**CONFIDENCE: MEDIUM** — `@react-pdf/renderer` server-side rendering is well-established as of Aug 2025. Verify that the current version still exports `renderToBuffer` (some older versions only had `renderToStream`).

---

## Offline-First Considerations

**Decision: No service worker needed — localhost = always available**

This is a localhost-only app running under `next dev` (or `next start`). "Offline-first" in this context means:
- Data lives in `./data/db.sqlite` — not a remote API that can fail
- Files live in `./public/uploads/` — served by the local Next.js process
- The only dependency is the local machine running Node.js

**No PWA/service worker needed.** Adding one would complicate the dev workflow (service workers cache aggressively and interfere with hot reload) with zero benefit.

**What "offline" actually means here:**
- The machine can have no internet connection — app still works fully
- Not about network resilience — about data locality

**Backup strategy (document in README):**
- Copy `./data/db.sqlite` to a cloud drive or external disk
- `./public/uploads/` is the other half of a complete backup
- Together these two paths are the entire state of the application

---

## Database Migration Strategy

**Decision: Drizzle Kit with `generate` + `migrate` — not `push`**

`drizzle-kit push` (schema push mode) is tempting for a solo app but it's destructive — it compares the schema to the live DB and applies changes directly, potentially dropping columns or data. For production data (real case files), use explicit migrations.

### Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out:    './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/db.sqlite',
  },
})
```

### Workflow

```bash
# 1. After changing schema files, generate a new migration SQL file:
npx drizzle-kit generate

# 2. Review the generated SQL in ./drizzle/migrations/ before applying

# 3. Apply all pending migrations:
npx drizzle-kit migrate

# 4. For development introspection:
npx drizzle-kit studio   # opens browser-based DB viewer
```

### Auto-migrate on App Start (recommended for solo app)

```typescript
// src/server/db/index.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_URL ?? './data/db.sqlite'
const DB_DIR = path.dirname(path.resolve(DB_PATH))

// Ensure data/ directory exists
fs.mkdirSync(DB_DIR, { recursive: true })

const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Run migrations on every startup — safe because Drizzle tracks applied migrations
migrate(db, { migrationsFolder: './drizzle/migrations' })
```

This means the DB is always up to date when the app starts. For a solo local app this is the right tradeoff: no manual migration step, no "forgot to migrate" bugs.

---

## Key Architectural Decisions

| ID | Decision | Chosen | Rejected | Rationale |
|----|----------|--------|----------|-----------|
| ADR-1 | tRPC transport | Route handler (`/api/trpc`) | Server Actions for all mutations | React Query integration, batch link, uniform mental model |
| ADR-2 | SQLite driver | `better-sqlite3` (sync) | `libsql` / `@libsql/client` (async) | Sync API simpler for single-user; no connection pooling needed |
| ADR-3 | Dosya type modeling | Single table + JSON `surecDetay` | Separate `stk_dosyalar` + `mahkeme_dosyalar` tables | List queries stay simple; 200 records, not millions |
| ADR-4 | Auth mechanism | `jose` JWT in HttpOnly cookie | `iron-session`, NextAuth, no auth | Lightweight, no extra deps beyond `jose`; HttpOnly cookie is secure by default |
| ADR-5 | File storage | `./public/uploads/` (static) | S3/MinIO, separate file server | Zero config; Next.js serves static files from `public/` automatically |
| ADR-6 | PDF generation | `@react-pdf/renderer` (server-side) | Puppeteer, jsPDF | No headless browser binary; React DSL; proper Unicode/Turkish font support |
| ADR-7 | Service worker | None | Workbox PWA | Localhost = always available; service workers complicate dev with zero benefit |
| ADR-8 | Migrations | `drizzle-kit generate` + auto-migrate on start | `drizzle-kit push` (schema push) | Push mode is destructive; explicit migrations protect real case data |
| ADR-9 | Date storage | ISO 8601 text in SQLite | SQLite `DATETIME`, Unix timestamps | Drizzle + SQLite best practice; readable in drizzle-kit studio; timezone-safe |
| ADR-10 | Search | SQL `LIKE` queries | Full-text search (FTS5) | 200 records makes FTS5 unnecessary; add later if needed |

---

## Confidence Notes

| Area | Confidence | Basis |
|------|------------|-------|
| tRPC v11 fetch adapter pattern | HIGH | Stable API since tRPC v10; v11 kept same adapter interface |
| Next.js 15 App Router route handlers | HIGH | Stable since Next.js 13.4; unchanged in 15 |
| Drizzle ORM schema patterns | HIGH | Training covers Drizzle 0.30+; SQLite JSON column mode is stable |
| `better-sqlite3` sync API | HIGH | Well-established; single-process local app |
| `@react-pdf/renderer` server-side | MEDIUM | Verify `renderToBuffer` export name in current version |
| `jose` for JWT cookie auth | HIGH | `jose` v5 is the standard choice for Next.js edge-compatible JWT |
| Auto-migrate on start pattern | MEDIUM | Verify `migrate()` import path from `drizzle-orm/better-sqlite3/migrator` matches current Drizzle version |
| Next.js route handler formData upload | HIGH | Web API-based; no size limit issue in route handlers (only Server Actions have the default limit) |
