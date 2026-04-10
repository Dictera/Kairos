# Phase 1: Foundation - Research

**Researched:** 2026-04-10
**Domain:** Next.js 15 App Router + SQLite (better-sqlite3) + Drizzle ORM + tRPC v11 + iron-session + shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Sidebar is collapsible — toggles between full (icon + label) and icon-only rail
- **D-02:** Navigation order: Dashboard → Dosyalar → Müvekkiller → [sep] → Takvim → Belgeler → Finans → Dilekçeler → Raporlar → [sep] → Ayarlar (bottom)
- **D-03:** All 9 top-level route links wired in sidebar in Phase 1 (placeholder pages acceptable)
- **D-04:** Warm teal palette: sidebar bg `#134e4a`, accent `#14b8a6`, sidebar text/icon `#f0fdfa`
- **D-05:** Light mode only — no dark mode toggle in Phase 1
- **D-06:** Minimal schema stubs — one proof-of-concept table only (schema_test or equivalent)
- **D-07:** Phase 2 owns all real entity schemas; no entity structure in Phase 1
- **D-08:** iron-session cookie lifetime: 7 days
- **D-09:** Auth flow: `.env` password → signed HttpOnly cookie via iron-session → `middleware.ts` redirects all routes except `/login` and `/api/trpc`

### Claude's Discretion

- Login page visual design (within the teal theme)
- Icon set choice for sidebar icons (Lucide is standard with shadcn/ui)
- Exact shadcn/ui component initialisation list for Phase 1 (only what's needed for the base layout)
- Page background color (white or very light teal tint — stay consistent with the teal theme)
- Exact `iron-session` cookie name and encryption key env var name

### Deferred Ideas (OUT OF SCOPE)

- Dark mode support — explicitly deferred to a future phase; do not wire up toggle in Phase 1
- sitemap.html referenced in PROJECT.md — not present in repo yet
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js 15 App Router project; `serverExternalPackages: ['better-sqlite3']` | next.config.ts syntax; NextConfig type; serverExternalPackages config |
| FOUND-02 | SQLite connection singleton with WAL, busy_timeout, foreign_keys pragmas | globalThis singleton pattern; better-sqlite3 pragma API; drizzle() call |
| FOUND-03 | Drizzle ORM schema + generate+migrate workflow | drizzle.config.ts; drizzle-kit generate/migrate commands; sqliteTable API |
| FOUND-04 | tRPC v11 fetchRequestHandler route handler + superjson | fetchRequestHandler; initTRPC with transformer; publicProcedure; protectedProcedure |
| FOUND-05 | Env-based single-user auth: `.env` password → iron-session cookie → middleware guard | getIronSession; SessionOptions; middleware.ts pattern; await cookies() |
| FOUND-06 | shadcn/ui + Tailwind CSS v3 + base layout (sidebar + header) | shadcn init; sidebar add; SidebarProvider; collapsible="icon"; Lucide icons |
</phase_requirements>

---

## Summary

This phase establishes the complete technical skeleton for a Next.js 15 App Router application with SQLite persistence via Drizzle ORM, end-to-end type safety via tRPC v11, stateless cookie auth via iron-session, and a collapsible sidebar UI via shadcn/ui. All five sub-plans (project scaffold, SQLite/Drizzle, tRPC, auth, layout) are straightforward greenfield wiring with well-documented patterns.

**Critical finding:** npm `latest` tag for `next` now resolves to 16.2.3 (released 2026). The project targets Next.js 15. Install with explicit `next@15.5.15` (latest 15.x as of research date) to avoid accidentally pulling Next.js 16. Next.js 15 supports React 18 or 19; use React 19.2.5.

**Critical finding:** In Next.js 15, `cookies()`, `headers()`, and `params` are **async**. All iron-session calls using `cookies()` must `await cookies()` first. Failing to do this is the single most common Next.js 15 migration mistake.

**Primary recommendation:** Follow the exact patterns documented below. Every component of this stack has first-class Next.js App Router support and excellent documentation. The main pitfalls are version pinning, the async `cookies()` change, and the SQLite WAL pragma placement.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.15 | App Router framework | Project constraint; pin to 15.x — npm `latest` is now Next.js 16 |
| react | 19.2.5 | UI library | Next.js 15 supports React 18 or 19; React 19 stable since Dec 2024 |
| react-dom | 19.2.5 | DOM rendering | Matches React version |
| typescript | ^5 | Type safety | Next.js 15 requires TS >=5.7.2 per tRPC peer dep |
| better-sqlite3 | 12.8.0 | SQLite driver | Synchronous API; ideal for server-only Next.js usage |
| drizzle-orm | 0.45.2 | ORM query builder | TypeScript-native; first-class better-sqlite3 support |
| drizzle-kit | 0.31.10 | Migration CLI | Pairs with drizzle-orm; generate+migrate workflow |
| @trpc/server | 11.16.0 | tRPC server core | v11 released stable; fetchRequestHandler for App Router |
| @trpc/client | 11.16.0 | tRPC client | Same version as server |
| @trpc/tanstack-react-query | 11.16.0 | tRPC React client | New recommended integration for tRPC v11 (replaces @trpc/react-query for new projects) |
| @tanstack/react-query | 5.97.0 | Server state | Required peer dep for tRPC TanStack integration |
| superjson | 2.2.6 | tRPC serialization | Handles Date, Map, Set over JSON wire |
| iron-session | 8.0.4 | Cookie-based session | Stateless; no DB needed; HttpOnly signed cookie |
| zod | 3.24.x | Input validation | tRPC validator standard |
| tailwindcss | 3.4.x | CSS framework | shadcn/ui requires Tailwind v3 (not v4) |
| lucide-react | 1.8.0 | Icon library | shadcn/ui default; sidebar icons |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/better-sqlite3 | latest | TypeScript types for driver | Always — better-sqlite3 ships without types |
| class-variance-authority | 0.7.1 | Component variants | shadcn/ui dependency |
| clsx | 2.1.1 | Class string merging | shadcn/ui utility |
| tailwind-merge | 3.5.0 | Tailwind class dedup | shadcn/ui utility |
| dotenv | — | Env loading in drizzle.config.ts | Used in config file only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @trpc/tanstack-react-query | @trpc/react-query | @trpc/react-query is the legacy "classic" client — still maintained but receives no new features; new projects should use @trpc/tanstack-react-query |
| iron-session | next-auth / lucia | Both are overkill for single-user env-based auth; iron-session is minimal, stateless, no DB required |
| better-sqlite3 | @libsql/client | @libsql needs Turso cloud or libSQL server; overkill for local-only app |
| Tailwind v3 | Tailwind v4 | shadcn/ui requires v3; v4 support not yet stable in shadcn ecosystem as of research date |

### Installation

```bash
# Core framework — pin to 15.x explicitly
npm install next@15.5.15 react@^19 react-dom@^19

# SQLite + ORM
npm install better-sqlite3 drizzle-orm
npm install --save-dev @types/better-sqlite3 drizzle-kit

# tRPC v11
npm install @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query superjson zod

# Auth
npm install iron-session

# UI (shadcn uses its own CLI for components)
npm install tailwindcss@^3 postcss autoprefixer lucide-react
npx shadcn@latest init
npx shadcn@latest add sidebar button input label
```

**Version verification (confirmed 2026-04-10):**
- `better-sqlite3`: 12.8.0 (published 2026-03-14)
- `drizzle-orm`: 0.45.2 (published 2026-04-10)
- `drizzle-kit`: 0.31.10 (published 2026-04-10)
- `@trpc/server`: 11.16.0 (published 2026-03-29)
- `iron-session`: 8.0.4 (published 2024-11-12)
- `next` latest 15.x: 15.5.15

---

## Architecture Patterns

### Recommended Project Structure

```
D:/sigorta-takip/
├── app/
│   ├── layout.tsx              # Root layout — SidebarProvider, TRPCProvider, QueryClientProvider
│   ├── page.tsx                # Dashboard (placeholder)
│   ├── login/
│   │   └── page.tsx            # Login form
│   ├── dosyalar/page.tsx       # Placeholder
│   ├── muvekiller/page.tsx     # Placeholder
│   ├── takvim/page.tsx         # Placeholder
│   ├── belgeler/page.tsx       # Placeholder
│   ├── finans/page.tsx         # Placeholder
│   ├── dilekçeler/page.tsx     # Placeholder
│   ├── raporlar/page.tsx       # Placeholder
│   ├── ayarlar/page.tsx        # Placeholder
│   └── api/
│       └── trpc/
│           └── [trpc]/
│               └── route.ts    # tRPC route handler
├── components/
│   ├── app-sidebar.tsx         # Collapsible sidebar with 9 nav links
│   └── providers.tsx           # TRPCProvider + QueryClientProvider (client component)
├── lib/
│   ├── db.ts                   # SQLite singleton + Drizzle instance
│   ├── schema.ts               # Drizzle schema (schema_test table)
│   ├── session.ts              # iron-session config (SessionOptions)
│   └── trpc/
│       ├── init.ts             # initTRPC, publicProcedure, protectedProcedure, createCallerFactory
│       ├── routers/
│       │   └── _app.ts         # Root appRouter with health procedure
│       └── client.ts           # createTRPCClient + TRPCProvider (client-side)
├── data/
│   └── .gitkeep               # db.sqlite created here by drizzle-kit migrate
├── drizzle/                    # Migration output folder (drizzle-kit generate writes here)
├── drizzle.config.ts           # Drizzle Kit config
├── middleware.ts               # Auth guard — runs on all routes except /login and /api/trpc
├── next.config.ts              # serverExternalPackages: ['better-sqlite3']
├── tsconfig.json               # strict: true, paths: {"@/*": ["./src/*"]} or root alias
└── .env                        # SESSION_PASSWORD, SESSION_COOKIE_NAME, APP_PASSWORD
```

### Pattern 1: next.config.ts with serverExternalPackages

**What:** Tells Next.js bundler to leave better-sqlite3 as a Node.js native require, not bundle it.
**When to use:** Required — without this, Next.js attempts to bundle the native addon and fails.

```typescript
// Source: nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
```

**Note:** `better-sqlite3` may already appear in Next.js's built-in exclusion list, but explicit declaration is required per project constraint D-01 and ensures correctness across Next.js patch updates. Always declare it explicitly.

### Pattern 2: SQLite Singleton with WAL Pragmas

**What:** Single DB connection per process; pragmas set at construction time.
**When to use:** Server-only module (`lib/db.ts`); import path must only be used in server components/route handlers.

```typescript
// Source: Drizzle ORM docs (orm.drizzle.team) + better-sqlite3 API
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// globalThis pattern prevents multiple connections during Next.js hot reload
const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> | undefined }

function createDb() {
  const sqlite = new Database('./data/db.sqlite')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('foreign_keys = ON')
  return drizzle({ client: sqlite, schema })
}

export const db = globalForDb.db ?? (globalForDb.db = createDb())
```

**Important:** `./data/` directory must exist before Drizzle creates `db.sqlite`. Add `data/.gitkeep` to ensure the directory is tracked.

### Pattern 3: Drizzle Config + generate+migrate Workflow

**What:** Code-first migrations — generate SQL from schema changes, apply with migrate command.
**When to use:** Every schema change — never use `drizzle-kit push` in this project.

```typescript
// drizzle.config.ts — Source: orm.drizzle.team/docs/get-started/sqlite-new
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: './data/db.sqlite',
  },
})
```

```json
// package.json scripts
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

**Phase 1 minimal schema stub:**

```typescript
// lib/schema.ts — Source: [VERIFIED: npm registry + drizzle docs]
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Proof-of-concept table: proves generate+migrate works
// Phase 2 will add all real entity tables
export const schemaTest = sqliteTable('schema_test', {
  id: int().primaryKey({ autoIncrement: true }),
  value: text().notNull(),
})
```

### Pattern 4: tRPC v11 Initialization

**What:** initTRPC with superjson transformer; export publicProcedure, protectedProcedure, createCallerFactory.
**When to use:** Single init file; all routers import from here.

```typescript
// lib/trpc/init.ts — Source: trpc.io/docs/client/nextjs/app-router-setup + dev.to guide
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '../session'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  return {
    session,
    headers: opts.headers,
  }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  })

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session.isLoggedIn) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { session: ctx.session } })
})
```

### Pattern 5: tRPC App Router Route Handler

**What:** fetchRequestHandler exports GET and POST for the Next.js App Router catch-all segment.
**When to use:** `app/api/trpc/[trpc]/route.ts` — this file is the only entry point for all tRPC calls.

```typescript
// app/api/trpc/[trpc]/route.ts — Source: trpc.io/docs/client/nextjs/app-router-setup
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '~/lib/trpc/routers/_app'
import { createTRPCContext } from '~/lib/trpc/init'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
```

### Pattern 6: tRPC Root Router with Health-Check

```typescript
// lib/trpc/routers/_app.ts
import { createTRPCRouter, publicProcedure } from '../init'

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true, timestamp: new Date() })),
})

export type AppRouter = typeof appRouter
```

### Pattern 7: TRPCProvider + QueryClientProvider (Client Component)

```typescript
// components/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { TRPCProvider } from '@trpc/tanstack-react-query'
import superjson from 'superjson'
import type { AppRouter } from '~/lib/trpc/routers/_app'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

### Pattern 8: iron-session Configuration

```typescript
// lib/session.ts — Source: github.com/vvo/iron-session
import type { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,          // must be >=32 chars
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'sigorta-session',
  ttl: 60 * 60 * 24 * 7,                           // 7 days in seconds
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // false for localhost http
    sameSite: 'lax',
    path: '/',
  },
}
```

**Login route handler (simplified):**

```typescript
// app/api/auth/login/route.ts (or Server Action)
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '~/lib/session'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.APP_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }
  const cookieStore = await cookies()  // MUST await in Next.js 15
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.isLoggedIn = true
  await session.save()
  return Response.json({ ok: true })
}
```

### Pattern 9: middleware.ts Auth Guard

**What:** Intercepts all requests; checks iron-session cookie; redirects to `/login` if not authenticated.
**When to use:** Root `middleware.ts` — protects the entire app except public routes.

```typescript
// middleware.ts — Source: github.com/vvo/iron-session (examples/next/src/middleware.ts)
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '~/lib/session'

const PUBLIC_PATHS = ['/login', '/api/trpc']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through without auth check
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Note:** iron-session in middleware is read-only (cannot write/set cookies). This is fine for auth checking — session creation happens in route handlers only.

### Pattern 10: shadcn/ui Sidebar with Collapsible Icon Rail

**What:** SidebarProvider manages open/closed state; `collapsible="icon"` gives icon-only collapsed mode.
**When to use:** Root layout wraps everything in SidebarProvider; AppSidebar component holds nav links.

```typescript
// app/layout.tsx (simplified)
import { SidebarProvider } from '~/components/ui/sidebar'
import { AppSidebar } from '~/components/app-sidebar'
import { Providers } from '~/components/providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1">{children}</main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
```

```typescript
// components/app-sidebar.tsx (key structure)
import { Sidebar, SidebarContent, SidebarMenu,
         SidebarMenuItem, SidebarMenuButton, SidebarTrigger,
         SidebarHeader, SidebarFooter, SidebarRail } from '~/components/ui/sidebar'

// collapsible="icon" enables icon-only rail when collapsed
<Sidebar collapsible="icon" style={{ '--sidebar-background': '#134e4a' } as React.CSSProperties}>
```

### Anti-Patterns to Avoid

- **`drizzle-kit push` in development:** This command syncs schema directly without generating migration files. Use `generate` + `migrate` exclusively to maintain a clean migration history for Phase 2+.
- **WAL pragma in migration SQL:** WAL cannot be set via Drizzle migration files reliably. Set it on the Database instance directly before calling drizzle().
- **Synchronous `cookies()` in Next.js 15:** `cookies()` is async in Next.js 15. Always `await cookies()` before passing to `getIronSession`. Failing to do this is silently broken in dev but causes runtime errors.
- **Importing `lib/db.ts` in client components:** better-sqlite3 is Node-only. Only import from server components, route handlers, tRPC procedures.
- **Missing `serverExternalPackages`:** Without it, better-sqlite3 native bindings fail to load at runtime with an opaque module error.
- **Using `next@latest` in install command:** As of April 2026, `npm install next` installs Next.js 16. Always pin: `npm install next@15.5.15`.
- **`@trpc/react-query` for new projects:** This is the legacy client. Use `@trpc/tanstack-react-query` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie encryption/signing | Custom crypto | iron-session | Uses iron to seal data; handles key rotation, TTL, HttpOnly all correctly |
| Session management | Custom JWT or DB sessions | iron-session | Stateless; no session table needed; single-user is perfect use case |
| SQLite type mapping | Raw SQL with manual serialization | drizzle-orm | Type inference, migrations, joins |
| tRPC serialization of Dates | JSON.parse/stringify workarounds | superjson transformer | Dates survive the wire as Date objects |
| React state management for server data | useState + fetch | @tanstack/react-query via tRPC | Caching, deduplication, loading states |
| Icon SVGs | Custom SVG files | lucide-react | shadcn/ui default; tree-shakeable; 1000+ icons |
| Sidebar collapse toggle state | localStorage + useState | SidebarProvider | Handles cookie persistence, mobile/desktop breakpoints |
| TypeScript config validation | Manual type assertions | NextConfig type | next.config.ts + `import type { NextConfig }` gives full IntelliSense |

**Key insight:** Every component of this stack was designed for exactly this use case. Custom solutions introduce edge cases (WAL mode + concurrent reads, cookie tampering, hydration mismatches) that the libraries handle correctly.

---

## Common Pitfalls

### Pitfall 1: `cookies()` Not Awaited in Next.js 15

**What goes wrong:** `getIronSession(cookies(), ...)` compiles and seems to work in some cases, but `cookies()` in Next.js 15 returns a Promise. Passing the Promise object (not its resolved value) to getIronSession causes incorrect behavior or runtime errors.

**Why it happens:** Next.js 15 made all dynamic APIs (`cookies`, `headers`, `params`) async as a breaking change. Pre-15 tutorials show the synchronous pattern.

**How to avoid:** Always `const cookieStore = await cookies()` before using.

**Warning signs:** TypeScript might not catch this if the types still have compatibility shims.

### Pitfall 2: Next.js 16 Installed Instead of 15

**What goes wrong:** `npm install next` or `npm install next@latest` installs Next.js 16.2.x (as of April 2026). Next.js 16 has breaking changes: removed synchronous access to dynamic APIs, new proxy.ts replaces some middleware patterns, Turbopack default.

**Why it happens:** npm `latest` tag moved to 16 in early 2026.

**How to avoid:** Always install with explicit version: `npm install next@15.5.15` (or `next@"^15"`).

**Warning signs:** Build errors about removed synchronous APIs; Turbopack enabled by default; `next.config.ts` warnings about deprecated options.

### Pitfall 3: WAL Pragma in Migration File

**What goes wrong:** Setting `journal_mode = WAL` inside a Drizzle migration SQL file causes errors or is silently ignored in some SQLite driver configurations.

**Why it happens:** WAL mode changes affect the journal file, not just the database schema. Drizzle's migrate runner wraps statements in transactions; WAL pragma cannot run inside a transaction.

**How to avoid:** Set WAL on the Database instance directly: `sqlite.pragma('journal_mode = WAL')` before `drizzle({ client: sqlite })`.

**Warning signs:** GitHub issue #4968 on drizzle-orm explicitly documents this.

### Pitfall 4: `better-sqlite3` Not in `serverExternalPackages`

**What goes wrong:** Next.js bundler tries to process the native `.node` addon file, fails with an error like "Module not found" or "Cannot resolve native module".

**Why it happens:** Webpack and Turbopack don't handle native addons.

**How to avoid:** `serverExternalPackages: ['better-sqlite3']` in `next.config.ts`. Explicit declaration is required even if it may appear in the default list — the project spec mandates it.

**Warning signs:** Error during `next build` or `next dev` about native modules.

### Pitfall 5: Multiple Database Connections in Development

**What goes wrong:** Next.js hot module replacement causes `lib/db.ts` to re-execute on every file save. Without the globalThis singleton, each reload opens a new SQLite connection. SQLite allows only one writer; multiple connections with WAL mode can cause SQLITE_BUSY errors.

**Why it happens:** HMR re-imports modules fresh, bypassing Node.js module cache in some bundlers.

**How to avoid:** Use the `globalThis` singleton pattern shown in Pattern 2.

**Warning signs:** `SQLITE_BUSY` errors in dev; connection count increasing in SQLite PRAGMA checks.

### Pitfall 6: `data/` Directory Missing at Migration Time

**What goes wrong:** `drizzle-kit migrate` tries to open `./data/db.sqlite` but `./data/` directory doesn't exist.

**Why it happens:** Git doesn't track empty directories.

**How to avoid:** Add `data/.gitkeep` to the repo. The `db.sqlite` file itself should be in `.gitignore`.

**Warning signs:** `SQLITE_CANTOPEN` error from drizzle-kit migrate.

### Pitfall 7: Tailwind v4 Installed Accidentally

**What goes wrong:** shadcn/ui still requires Tailwind CSS v3 (as of April 2026). Installing `tailwindcss@latest` gives v4.x, which has a different configuration format (`tailwind.config.js` vs CSS-first approach) that breaks shadcn/ui.

**Why it happens:** npm `latest` for tailwindcss is v4.

**How to avoid:** `npm install tailwindcss@^3 postcss autoprefixer`. Shadcn's CLI init should handle this if run correctly.

**Warning signs:** shadcn init fails; PostCSS config errors; component styles broken.

### Pitfall 8: tRPC `@trpc/react-query` Package Used

**What goes wrong:** `@trpc/react-query` is the classic/legacy integration for tRPC v11. It still works but lacks new features. tRPC v11 expects `@trpc/tanstack-react-query` for new projects.

**Why it happens:** Many tutorials still show `@trpc/react-query`.

**How to avoid:** Install `@trpc/tanstack-react-query` and use `TRPCProvider` from that package. The hook syntax changes from `trpc.foo.useQuery()` to `useQuery(trpc.foo.queryOptions())`.

---

## Code Examples

### SQLite Schema Test Table

```typescript
// lib/schema.ts — Source: [VERIFIED: orm.drizzle.team]
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const schemaTest = sqliteTable('schema_test', {
  id: int().primaryKey({ autoIncrement: true }),
  value: text().notNull(),
})
```

### drizzle.config.ts

```typescript
// drizzle.config.ts — Source: [VERIFIED: orm.drizzle.team/docs/get-started/sqlite-new]
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: './data/db.sqlite',
  },
})
```

### Generate + Migrate Commands

```bash
# Generate migration files from schema (run after any schema change)
npx drizzle-kit generate

# Apply pending migrations to ./data/db.sqlite
npx drizzle-kit migrate
```

### tRPC Client Usage (in client components)

```typescript
// In a client component — Source: [CITED: trpc.io/docs/client/tanstack-react-query/setup]
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@trpc/tanstack-react-query'

function HealthCheck() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.health.queryOptions())
  return <div>{data?.ok ? 'Connected' : 'Offline'}</div>
}
```

### .env Template

```bash
# .env.local
APP_PASSWORD=your-secure-app-password-here
SESSION_PASSWORD=a-random-32-character-minimum-secret-key-here
SESSION_COOKIE_NAME=sigorta-session
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@trpc/react-query` | `@trpc/tanstack-react-query` | tRPC v11 (2024) | New hook syntax; `trpc.foo.useQuery()` → `useQuery(trpc.foo.queryOptions())` |
| Synchronous `cookies()` | Async `await cookies()` | Next.js 15 (Oct 2024) | All dynamic APIs now async; breaking change |
| `next.config.js` | `next.config.ts` | Next.js 15 | First-class TypeScript config support |
| `npm install next` → 15.x | `npm install next` → 16.x | Early 2026 | Must pin version explicitly |
| `drizzle-kit push` for dev | `generate` + `migrate` | Best practice | `push` destroys migration history |

**Deprecated/outdated:**
- `@trpc/next`: This package is for Pages Router SSR mode only. Do not use with App Router.
- `next-iron-session`: This is the old package name. Use `iron-session` directly.
- Synchronous `cookies()`: Deprecated in Next.js 15, removed in Next.js 16.
- `tailwindcss@latest` in new projects targeting shadcn/ui: Installs v4, which breaks shadcn.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn/ui requires Tailwind v3 (not v4) for full compatibility | Standard Stack, Pitfall 7 | If shadcn now supports v4, Tailwind v3 install is unnecessary but harmless |
| A2 | `better-sqlite3` may already be in Next.js built-in serverExternalPackages exclusion list | Pattern 1 | Low risk — explicit declaration overrides/supplements built-in list; no harm in declaring explicitly |
| A3 | iron-session 8.0.4 accepts `await cookies()` (the Promise result from Next.js 15) | Pattern 8 | If iron-session expects the raw cookie store, API call would need adjustment; mitigated by seeing the pattern in official examples |

---

## Open Questions

1. **Login page route: Server Action vs Route Handler**
   - What we know: iron-session works with both Server Actions (`'use server'` functions) and API Route Handlers
   - What's unclear: Which approach is cleaner for the login flow in this app (no OAuth, simple password check)
   - Recommendation: Use a Route Handler (`app/api/auth/login/route.ts`) for clarity and explicit HTTP semantics; Server Actions are valid but less conventional for a login endpoint

2. **TRPCProvider placement with auth middleware**
   - What we know: TRPCProvider is a client component that wraps the app; middleware redirects unauthenticated users before they hit the app shell
   - What's unclear: Whether the TRPCProvider should be inside or outside the auth-gated layout
   - Recommendation: Place TRPCProvider in root layout.tsx — it initializes before page renders and does not make network calls on render; this is the standard T3 pattern

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | v24.13.0 | — |
| npm | Package manager | ✓ | (with Node 24) | — |
| npx/shadcn CLI | shadcn component init | ✓ | via npx | — |

Node.js v24.13.0 exceeds Next.js 15 minimum requirement (`^18.18.0 || ^19.8.0 || >= 20.0.0`).

**Missing dependencies with no fallback:** None. All required tooling is available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected (greenfield project) |
| Config file | None — must be created in Wave 0 |
| Quick run command | `npx jest --testPathPattern="foundation" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | next.config.ts exports serverExternalPackages with better-sqlite3 | smoke | `node -e "const c = require('./next.config.ts'); console.assert(c.default.serverExternalPackages.includes('better-sqlite3'))"` | ❌ Wave 0 |
| FOUND-02 | SQLite connection opens; WAL mode confirmed | integration | `npx tsx tests/db.test.ts` | ❌ Wave 0 |
| FOUND-03 | drizzle-kit generate produces migration; migrate creates db.sqlite + schema_test table | smoke | `npx drizzle-kit migrate && sqlite3 data/db.sqlite ".tables"` | ❌ Wave 0 (CLI-based) |
| FOUND-04 | tRPC health endpoint returns 200 + `{ok: true}` | smoke | `curl http://localhost:3000/api/trpc/health` | ❌ Wave 0 (manual) |
| FOUND-05 | Unauthenticated request to `/` redirects to `/login`; authenticated request passes | e2e | Playwright or manual browser test | ❌ Wave 0 (manual) |
| FOUND-06 | Sidebar renders with 9 nav links; collapses to icon rail | visual | Manual browser verification | ❌ Wave 0 (manual) |

### Sampling Rate

- **Per task commit:** Run any applicable CLI smoke test (drizzle-kit migrate, next build)
- **Per wave merge:** `npm run build` — zero TypeScript/Next.js errors
- **Phase gate:** `npm run build` succeeds + all manual checks pass before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `data/.gitkeep` — directory must exist for SQLite file creation
- [ ] `.env.local` — SESSION_PASSWORD, APP_PASSWORD, SESSION_COOKIE_NAME
- [ ] `package.json` db scripts — `db:generate`, `db:migrate`
- [ ] TypeScript configured with `strict: true` in `tsconfig.json`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | iron-session signed cookie; APP_PASSWORD in .env |
| V3 Session Management | yes | iron-session: HttpOnly, 7-day TTL, signed |
| V4 Access Control | yes | middleware.ts — all routes except /login and /api/trpc require valid session |
| V5 Input Validation | yes | zod schemas on tRPC procedures |
| V6 Cryptography | yes | iron-session uses iron (AES-256-CBC + HMAC); never hand-rolled |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session cookie theft | Spoofing | HttpOnly + Secure flags prevent JS access; iron-session encryption prevents forgery |
| Password brute force | Elevation of privilege | localhost-only deployment — no external exposure; no rate limiting needed in v1 |
| CSRF | Tampering | SameSite=Lax on cookie; tRPC mutations require same-origin requests |
| SQLite injection | Tampering | Drizzle ORM uses parameterized queries — never string-concat SQL |
| Middleware bypass (CVE-2025-29927) | Elevation of privilege | Use Next.js >=15.2.3 (patch included); 15.5.15 is fully patched |

**Security note:** CVE-2025-29927 (March 2025) was a critical middleware bypass vulnerability patched in Next.js 15.2.3. Installing Next.js 15.5.15 ensures this is resolved. [VERIFIED: WebSearch + nextjs.org]

---

## Sources

### Primary (HIGH confidence)

- `npm view [package] version` — All package versions verified against npm registry 2026-04-10
- [trpc.io/docs/client/nextjs/app-router-setup](https://trpc.io/docs/client/nextjs/app-router-setup) — fetchRequestHandler, TRPCProvider pattern
- [trpc.io/docs/client/tanstack-react-query/setup](https://trpc.io/docs/client/tanstack-react-query/setup) — @trpc/tanstack-react-query setup
- [orm.drizzle.team/docs/get-started/sqlite-new](https://orm.drizzle.team/docs/get-started/sqlite-new) — Drizzle SQLite init, drizzle.config.ts, migration commands
- [github.com/vvo/iron-session](https://github.com/vvo/iron-session) — SessionOptions API, getIronSession, middleware pattern
- [github.com/vvo/iron-session/discussions/658](https://github.com/vvo/iron-session/discussions/658) — Middleware read-only limitation confirmed by maintainer
- [trpc.io/docs/server/server-side-calls](https://trpc.io/docs/server/server-side-calls) — createCallerFactory export pattern

### Secondary (MEDIUM confidence)

- [dev.to/matowang/trpc-11-setup-for-nextjs-app-router-2025](https://dev.to/matowang/trpc-11-setup-for-nextjs-app-router-2025-33fo) — Community tRPC v11 App Router guide (corroborates official docs)
- [nextjs.org/blog/next-15](https://nextjs.org/blog/next-15) + upgrade guides — async cookies() breaking change
- [nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) — Config syntax (WebFetch hit redirect, result from search)
- [ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next) — shadcn init command
- [ui.shadcn.com/docs/components/sidebar](https://ui.shadcn.com/docs/components/sidebar) — Sidebar component API, collapsible="icon", SidebarProvider

### Tertiary (LOW confidence)

- WebSearch result about better-sqlite3 being in Next.js built-in exclusion list — could not verify from official docs directly; explicit declaration is safer [ASSUMED partially]

---

## Metadata

**Confidence breakdown:**
- Standard stack versions: HIGH — all verified via npm registry 2026-04-10
- Next.js 15 async APIs: HIGH — official Next.js upgrade docs confirm
- tRPC v11 patterns: HIGH — official trpc.io docs fetched directly
- Drizzle + SQLite patterns: HIGH — official orm.drizzle.team docs fetched directly
- iron-session middleware: HIGH — official GitHub repo + maintainer discussion fetched
- shadcn/ui sidebar: MEDIUM — docs fetched but some details from search (cookie persistence mechanism)
- Tailwind v3 requirement for shadcn: MEDIUM — documented in shadcn install guides, not verified against shadcn v3 changelog

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days — stack is stable but Next.js releases frequently)
