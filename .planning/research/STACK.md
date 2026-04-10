# STACK.md — Sigorta Uyuşmazlık Takip

**Researched:** 2026-04-10
**Confidence note:** External network access was unavailable during research. All versions are from training data (knowledge cutoff August 2025). Treat every version as a floor, not a ceiling — run `npm view <pkg> version` before installing to confirm the current latest. Confidence is MEDIUM unless noted otherwise.

---

## Core Framework

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `next` | `15.2.x` | MEDIUM | App Router is stable in 15.x; React 19 compatibility landed in 15.1. Use latest 15.x patch. Do NOT use 14.x — canary caching behaviour and server actions have breaking differences with tRPC v11 patterns. |
| `react` | `19.x` | MEDIUM | Next.js 15 ships React 19 by default. Required for `use()` hook patterns and concurrent features that tRPC v11's React integration leverages. |
| `react-dom` | `19.x` | MEDIUM | Must match React version exactly. |
| `typescript` | `5.5.x` | HIGH | TypeScript 5.5 introduced `isolatedDeclarations` and tighter inference — required for strict mode + Zod + tRPC to produce accurate end-to-end types without manual annotation. |

---

## Data Layer

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `better-sqlite3` | `11.x` | MEDIUM | **Use this, not libsql.** libsql is Turso's fork designed for remote/embedded hybrid use — it adds network overhead and dependency weight that is pointless for a fully local deployment. `better-sqlite3` is synchronous, zero-config, well-maintained, and the correct driver for a local SQLite file at `./data/db.sqlite`. Ships native bindings; Node.js 20+ is required. |
| `@types/better-sqlite3` | `7.6.x` | MEDIUM | Type declarations for better-sqlite3; install as dev dependency. |
| `drizzle-orm` | `0.36.x` | MEDIUM | Current stable as of mid-2025. Drizzle's SQLite dialect maps directly to better-sqlite3. Provides type-safe query builder without ORM runtime overhead. Schema-as-code in TypeScript keeps migrations readable. |
| `drizzle-kit` | `0.28.x` | MEDIUM | CLI companion for drizzle-orm. Handles `drizzle-kit push` (push schema directly to SQLite without migration files — ideal for solo dev workflow) and `drizzle-kit generate` + `drizzle-kit migrate` when migration history matters. For this project, prefer `push` during active development, switch to `generate`/`migrate` before v1 freeze. |
| `drizzle-zod` | `0.5.x` | MEDIUM | Generates Zod schemas directly from Drizzle table definitions. Eliminates the need to maintain parallel schema definitions for the ORM and the API validation layer. Critical for this project because tRPC procedures take Zod inputs and the same shapes are stored in SQLite. |

**Why not libsql/turso:** The `@libsql/client` package is designed for Turso's cloud-edge SQLite, which requires a network endpoint. Even in "embedded" mode it introduces a WASM runtime dependency and has different transaction semantics than `better-sqlite3`. For a localhost-only app, it is the wrong tool.

**Why not Prisma:** Prisma's SQLite support is solid but its query engine is a separate binary process (Rust-based). For a local dev server that starts and stops frequently, the engine startup time is noticeable. Drizzle is a zero-runtime query builder — all types and queries resolve at compile time.

---

## API Layer

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `@trpc/server` | `11.x` | MEDIUM | tRPC v11 is the first version with native Next.js App Router support. The v10 `withTRPC` HOC pattern does not work with App Router's server component model. |
| `@trpc/client` | `11.x` | MEDIUM | Must match `@trpc/server` major version. Used in the browser-side fetch link. |
| `@trpc/react-query` | `11.x` | MEDIUM | tRPC's React Query adapter. v11 is built against TanStack Query v5 — do not mix with v4. Provides `useSuspenseQuery`, `useMutation` with the tRPC router type parameter for full end-to-end type safety. |
| `@tanstack/react-query` | `5.x` (5.56+) | HIGH | TanStack Query v5 is a full rewrite with breaking API changes from v4. `@trpc/react-query@11` requires v5. For this app, React Query provides client-side cache, background refetch, and optimistic update primitives — all relevant for the case list and calendar views. |
| `@tanstack/react-query-devtools` | `5.x` | MEDIUM | Dev-only panel for inspecting query cache. Install as devDependency. |
| `superjson` | `2.x` | MEDIUM | tRPC v11's default serializer cannot round-trip `Date`, `BigInt`, or `Map` over JSON. `superjson` transformer handles these transparently. Required because the app has many date fields (hearing dates, deadlines). Configure in `initTRPC.create({ transformer: superjson })`. |
| `zod` | `3.23.x` | HIGH | tRPC v11 uses Zod for procedure input/output validation. Zod v3 is stable; v4 is in beta as of mid-2025 — do not use v4 yet, the ecosystem (drizzle-zod, @trpc/server) has not fully migrated. |

**tRPC v11 + Next.js 15 App Router integration pattern:**

Use the **fetch adapter** (`fetchRequestHandler`), not the HTTP adapter. Mount it at `app/api/trpc/[trpc]/route.ts`:

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

The `httpBatchLink` on the client side points to `/api/trpc`. This is the canonical App Router pattern; the older `@trpc/next` package is v10-only and should not be installed.

**Server-side calls (React Server Components):** Create a server-side caller with `appRouter.createCaller(ctx)` for initial data loads in Server Components. This avoids a network round-trip for the first render.

---

## UI / Components

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `tailwindcss` | `3.4.x` | HIGH | shadcn/ui v2 is built against Tailwind v3. Tailwind v4 has a different config format (CSS-first) that shadcn/ui does not yet support cleanly. Stay on v3 until shadcn explicitly supports v4. |
| `shadcn/ui` | CLI-based (no npm version) | HIGH | Not installed as a package — components are copied into `src/components/ui/` via `npx shadcn@latest add`. This is intentional: you own the source and can modify it. Run `npx shadcn@latest init` to bootstrap. |
| `@radix-ui/react-*` | `2.x` | HIGH | shadcn/ui's primitive layer. Installed automatically when you `npx shadcn add`. Do not install these manually. |
| `lucide-react` | `0.400+` | MEDIUM | shadcn/ui's default icon set. Consistent with the component library. |
| `class-variance-authority` | `0.7.x` | HIGH | Used internally by shadcn components for variant composition. Installed by shadcn CLI. |
| `clsx` + `tailwind-merge` | latest | HIGH | The `cn()` utility function for conditional class merging. Scaffolded by shadcn CLI into `src/lib/utils.ts`. |
| `@tanstack/react-table` | `8.x` | MEDIUM | TanStack Table v8 for the case list (200+ records with filtering, sorting, pagination). shadcn/ui's DataTable is built on top of this. Handles virtual scrolling via `@tanstack/react-virtual` if you add it later. |

**Calendar / date picker:** shadcn/ui's `Calendar` component is built on `react-day-picker` v8. For the hearing calendar view and date pickers, this is the correct choice — it integrates directly with `date-fns` for locale.

---

## PDF / Export

### PDF Generation

**Recommendation: `@react-pdf/renderer`** for petition templates (dilekçe şablonları); **`puppeteer` is a backup only**.

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `@react-pdf/renderer` | `3.4.x` | MEDIUM | Pure JavaScript PDF renderer using React components. Works entirely in Node.js without a headless browser. Renders in a Next.js API route or Server Action. Ideal for structured legal documents where you define layout in JSX. Supports Turkish UTF-8 characters when you embed a font (embed Noto Serif or a Turkish-compatible OTF). No Chromium process, no memory spikes, no process cleanup. |
| `@react-pdf/font` | bundled with renderer | — | Font registration API. Call `Font.register({ family: 'NotoSerif', src: '/fonts/NotoSerif-Regular.ttf' })` to embed Turkish-compatible fonts. |

**Why not puppeteer for primary PDF:**
- Puppeteer downloads a ~170MB Chromium binary at install time. For a localhost app that is fine, but it is a heavyweight dependency for a use case that does not require pixel-perfect HTML rendering.
- In a Next.js server context, Puppeteer requires careful process management (browser instances must be reused, not spawned per request). This is non-trivial to get right.
- However: if the lawyer needs to print complex tables with precise formatting that react-pdf cannot replicate, Puppeteer is a valid escape hatch. Keep it as an optional second renderer.

**Why not jsPDF:**
- jsPDF is client-side JavaScript. It generates PDFs in the browser. For a lawyer app where templates are server-rendered and potentially contain sensitive data, server-side generation is the correct architecture. jsPDF also has poor Turkish character support without manual font embedding work that react-pdf handles more cleanly.

### Excel Export

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `exceljs` | `4.4.x` | MEDIUM | **Use exceljs, not xlsx/SheetJS.** ExcelJS generates real `.xlsx` files with cell styling, column widths, and number formats — important for financial reports (Turkish lira amounts, date columns). Runs on Node.js in a Server Action or API route. The commercial `@xlsxjs/xlsx` package and the community `xlsx` package both have licensing ambiguity (SheetJS went proprietary for the npm package in 2022). ExcelJS is MIT. |

---

## Utilities

| Library | Version (floor) | Confidence | Rationale |
|---------|----------------|------------|-----------|
| `date-fns` | `4.x` (4.1+) | MEDIUM | **Use date-fns v4, not day.js.** date-fns v4 is a pure TypeScript rewrite with tree-shaking per-function. Turkish locale (`tr`) is included: `import { tr } from 'date-fns/locale'`. Used with shadcn/ui's Calendar (react-day-picker accepts a `locale` prop). For legal deadlines, date-fns's `addDays`, `differenceInDays`, `isBefore`, `format` are the core API — all typed, all tree-shakeable. day.js is smaller but its locale/plugin system adds cognitive overhead and the TypeScript types are weaker. |
| `react-day-picker` | `8.x` | MEDIUM | Installed as shadcn/ui's Calendar dependency. Do not upgrade to v9 independently — wait for shadcn to track it. Pass `locale={tr}` from date-fns for Turkish month/day names. |
| `iron-session` | `8.x` | MEDIUM | Lightweight cookie-based session for the env-based auth. Encrypts a signed cookie with a secret from `.env`. No database, no JWT library. The login flow is: POST `/api/auth/login` → compare `req.body.password` against `process.env.APP_PASSWORD` → set iron-session cookie → redirect. This is the correct complexity level for a single-user local app. **Do not use next-auth for this** — it expects OAuth providers or a database adapter and is overkill. |
| `@t3-oss/env-nextjs` | `0.10.x` | MEDIUM | Type-safe `.env` validation with Zod schemas. Validates at server startup that `APP_PASSWORD`, `SESSION_SECRET`, etc. are present. Fails loudly at boot rather than silently at runtime. |
| `nanoid` | `5.x` | MEDIUM | Tiny URL-safe unique ID generator. Use for generating case reference numbers (`IS-2025-0001` style) or document IDs where SQLite's `INTEGER PRIMARY KEY` autoincrement is not enough. |
| `sharp` | `0.33.x` | LOW | Only needed if you add image processing (e.g., thumbnail generation for uploaded photos of documents). Include in `devDependencies` or add later if needed. |

**File uploads (multipart):** Next.js 15 App Router handles multipart natively via the Web `Request` API. In a Route Handler:
```typescript
const formData = await req.formData();
const file = formData.get('file') as File;
const buffer = Buffer.from(await file.arrayBuffer());
await fs.writeFile(`./public/uploads/${nanoid()}-${file.name}`, buffer);
```
No additional library needed. Files land in `./public/uploads` and are served statically by Next.js dev server. For production-like usage, move uploads outside `public/` and serve them via a route handler to avoid caching issues.

---

## What NOT to Use

| Library | Reason to Avoid |
|---------|----------------|
| `@libsql/client` / `libsql` | Designed for Turso cloud SQLite. Adds WASM runtime, network client, and different transaction semantics. Pointless overhead for a localhost-only app. Use `better-sqlite3`. |
| `prisma` | Rust query engine binary adds startup overhead. Drizzle is zero-runtime and generates better TypeScript types for this use case. |
| `next-auth` (v4 or v5) | Built for OAuth/credential flows with user tables. Overkill for single-user env-based auth. Use `iron-session` instead. |
| `@trpc/next` | This is the v10 compatibility shim for Pages Router. It does not work with App Router. Use `fetchRequestHandler` directly. |
| `axios` | `fetch` is native in Node.js 18+ and Next.js 15. tRPC client uses fetch internally. No need for axios. |
| `moment.js` | 67KB gzipped, mutable API, no tree-shaking. Use `date-fns` v4. |
| `day.js` | Smaller than moment but weaker TypeScript types than date-fns. Plugin system is fragile. |
| `jsPDF` | Client-side PDF only. No server-side generation. Poor Turkish font support without manual embedding. |
| `xlsx` / `SheetJS` (npm package) | Went proprietary/source-available in 2022. Use `exceljs` (MIT). |
| `@xlsxjs/xlsx` | Commercial license variant of SheetJS. Use `exceljs`. |
| `puppeteer` (as primary PDF) | 170MB Chromium download, process management complexity. Use `@react-pdf/renderer` for templates; keep puppeteer only as escape hatch. |
| `tailwindcss@4.x` | shadcn/ui is not fully compatible with Tailwind v4's CSS-first config format as of mid-2025. Stay on v3.4.x until shadcn tracks it. |
| `zod@4.x` (beta) | drizzle-zod and @trpc/server ecosystem has not migrated. Stay on Zod v3. |
| `react-query@4.x` | tRPC v11 requires v5. Do not install v4. |
| `@tanstack/react-virtual` | Defer until you observe actual performance issues with 200+ rows. TanStack Table with simple pagination handles this count easily without virtualization. |

---

## Recommended package.json excerpt

```json
{
  "dependencies": {
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.36.0",
    "drizzle-zod": "^0.5.0",

    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.56.0",
    "superjson": "^2.2.0",
    "zod": "^3.23.0",

    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.400.0",
    "@tanstack/react-table": "^8.20.0",

    "@react-pdf/renderer": "^3.4.0",
    "exceljs": "^4.4.0",

    "date-fns": "^4.1.0",
    "react-day-picker": "^8.10.0",
    "iron-session": "^8.0.0",
    "@t3-oss/env-nextjs": "^0.10.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "drizzle-kit": "^0.28.0",
    "@tanstack/react-query-devtools": "^5.56.0"
  }
}
```

> **Before installing:** Run `npm view <package> version` for each dependency to get the actual current latest. The versions above are floors based on the August 2025 knowledge cutoff — patch versions will be higher by now.

---

## Installation Order

```bash
# 1. Bootstrap Next.js 15 project
npx create-next-app@latest sigorta-takip --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Bootstrap shadcn/ui (do this before installing other UI deps)
npx shadcn@latest init

# 3. Install data + API layer
npm install drizzle-orm better-sqlite3 @trpc/server @trpc/client @trpc/react-query @tanstack/react-query superjson zod drizzle-zod

# 4. Install utilities
npm install iron-session @t3-oss/env-nextjs nanoid date-fns exceljs @react-pdf/renderer @tanstack/react-table

# 5. Dev dependencies
npm install -D drizzle-kit @types/better-sqlite3 @tanstack/react-query-devtools

# 6. Add shadcn components as needed
npx shadcn@latest add button input table dialog calendar form select textarea badge
```

---

## Key Integration Notes

### Drizzle + better-sqlite3 initialisation
Create `src/server/db.ts` as a module-level singleton. In Next.js dev mode, Hot Module Replacement can create multiple DB connections; guard with a global:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> };

export const db = globalForDb.db ?? drizzle(new Database('./data/db.sqlite'), { schema });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
```

### tRPC context with iron-session
The tRPC context factory reads the iron-session cookie to confirm the user is authenticated before any procedure runs. All procedures go through this check — no per-procedure auth guard needed.

### date-fns Turkish locale
```typescript
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

format(hearingDate, 'dd MMMM yyyy', { locale: tr }); // "15 Ocak 2025"
```

### react-day-picker Turkish locale
```tsx
import { tr } from 'date-fns/locale';
<Calendar locale={tr} />
```

---

*Confidence: MEDIUM overall. Versions verified against training data (cutoff August 2025). Verify with `npm view` before pinning.*
