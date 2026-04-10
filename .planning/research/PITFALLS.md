# PITFALLS.md — Sigorta Uyuşmazlık Takip

**Domain:** Next.js 15 App Router + SQLite (better-sqlite3) + tRPC v11 + Drizzle ORM  
**Researched:** 2026-04-10  
**Confidence note:** Web search tools unavailable. All findings are from training data (cutoff August 2025). Confidence levels reflect this. Validate HIGH-impact items against official docs before building.

---

## Critical Pitfalls (will break the app)

### 1. better-sqlite3 bundling failure with Next.js / Turbopack
**What goes wrong:** better-sqlite3 is a native Node.js addon (`.node` binary). Webpack and Turbopack attempt to bundle it and fail — you get `Module not found` or `Cannot find module '...better_sqlite3.node'` errors at build time or runtime.  
**Why it happens:** Bundlers try to inline native modules; they cannot.  
**Consequence:** App fails to start or crashes on first DB call.  
**Prevention:**
- In `next.config.ts`, mark better-sqlite3 as external for the server bundle:
  ```ts
  // next.config.ts
  experimental: { serverComponentsExternalPackages: ['better-sqlite3'] }
  // Next.js 15 renamed this to:
  serverExternalPackages: ['better-sqlite3']
  ```
- With Turbopack (`next dev --turbo`), add the same under `experimental.turbo.resolveExtensions` if needed, or avoid Turbopack until native module support stabilizes.  
**Detection:** Build error mentioning `.node` file or `Module parse failed`.  
**Confidence:** HIGH — this is a well-established requirement for all native Node addons in Next.js.

---

### 2. better-sqlite3 called in React Server Components (RSC) — "synchronous in async context" confusion
**What goes wrong:** better-sqlite3 is fully synchronous — `.prepare().all()` blocks the thread. In RSC you `await` everything. The danger is not a crash but a misunderstanding: developers wrap DB calls in `async/await` thinking it's safe, which is fine, BUT if the DB call is accidentally placed in a client component or a shared module that runs on the client, it explodes.  
**The real trap:** Next.js 15 App Router allows server-only code in server components. If you forget the `'use server'` / `'use client'` boundary, DB calls leak to the client bundle.  
**Prevention:**
- Add `import 'server-only'` at the top of every file that uses the DB connection.
- Keep all DB access inside tRPC procedures (server-side). Never import the db singleton in a client component.
- Create a single `lib/db.ts` that exports the connection — import it only from tRPC routers and server actions.  
**Detection:** `window is not defined` or `fs is not defined` errors in browser console — these mean server-only code ran on the client.  
**Confidence:** HIGH.

---

### 3. SQLite "database is locked" errors under concurrent Next.js requests
**What goes wrong:** SQLite allows only one writer at a time. In development, Next.js hot-reload + React Strict Mode + concurrent server component renders can fire multiple write requests simultaneously, causing `SQLITE_BUSY` / `database is locked`.  
**Why it happens:** SQLite default journal mode is DELETE (rollback journal). Each write takes an exclusive lock. Multiple in-flight requests contend.  
**Prevention:**
- Enable WAL mode immediately after opening the connection:
  ```ts
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL'); // safe with WAL
  db.pragma('busy_timeout = 5000');  // wait up to 5s before throwing
  ```
- WAL allows concurrent readers + one writer without blocking reads.
- For this single-user local app, WAL + busy_timeout of 5000ms is sufficient.  
**Detection:** Occasional 500 errors in dev with `SqliteError: database is locked` in terminal.  
**Confidence:** HIGH — WAL mode is the standard SQLite recommendation for any web server usage.

---

### 4. Drizzle ORM migrations: `drizzle-kit push` vs `drizzle-kit migrate` confusion causing data loss
**What goes wrong:** `drizzle-kit push` directly alters the DB schema to match your Drizzle schema — it may **drop columns or tables** without warning when you remove a field from the schema definition.  
**Why it happens:** `push` is designed for prototyping, not production. It reconciles schema differences destructively.  
**Consequence:** Irreversible data loss on a live 200+ case database.  
**Prevention:**
- Use `drizzle-kit generate` + `drizzle-kit migrate` for all schema changes from day one. This creates SQL migration files you can review.
- Never use `drizzle-kit push` after initial setup on a database with real data.
- Keep migrations in version control.
- Back up `data.db` before every migration run: `cp data.db data.db.bak`.  
**Detection:** Missing rows, empty tables, or columns disappearing after a `push`.  
**Confidence:** HIGH — documented Drizzle behavior.

---

### 5. Turkish characters (ş, ç, ğ, ü, ö, ı, İ) silently corrupted or missing in generated PDFs
**What goes wrong:** PDF libraries (especially `pdfmake`, `jsPDF`) default to built-in Latin fonts (Helvetica, Times) that do not include Turkish-specific glyphs (ğ, ş, İ, ı). Characters render as squares, question marks, or are silently dropped.  
**Why it happens:** PDF fonts must explicitly include every glyph. Standard PDF built-in fonts cover Latin-1 but not full Latin Extended (ISO 8859-9 / Windows-1254).  
**Critical note on ı (dotless i) and İ (dotted I):** Turkish has a unique lowercase/uppercase i distinction. Many fonts include `ı` but map it incorrectly, causing broken casing in petition text.  
**Prevention:**
- Embed a full Unicode TTF font that includes Turkish characters. Recommended fonts (free, TTF):
  - **Roboto** (Google Fonts) — covers all Turkish glyphs
  - **DejaVu Sans** — specifically designed for broad Unicode coverage
  - **Noto Sans** — Google's universal coverage font
- With `pdfmake`: register the font as a custom font with base64-encoded TTF data.
- With `@react-pdf/renderer`: use `<Font src="...">` with a hosted or bundled TTF.
- With `puppeteer` (headless Chrome HTML-to-PDF): ensure the system or Docker image has Turkish fonts installed.  
**Test:** Generate a PDF containing `"Değerlendirme: Şirket, ışık gören İstanbul'daki çözümü önerdi."` and visually verify all characters appear.  
**Confidence:** HIGH — Turkish PDF font issues are a known, well-documented problem in the Turkish dev community.

---

### 6. Next.js API route body size limit (4MB default) breaking PDF/file uploads
**What goes wrong:** Next.js API routes (both `pages/api` and App Router Route Handlers) have a **4MB default body size limit**. Large PDF uploads or base64-encoded file data silently fails or returns a 413 error.  
**Prevention:**
- For App Router Route Handlers, disable the default body parser per route:
  ```ts
  export const config = {
    api: { bodyParser: { sizeLimit: '20mb' } }
  };
  ```
  In App Router, this is handled differently — use `Request.formData()` and configure `next.config.ts`:
  ```ts
  // next.config.ts
  experimental: {
    serverActions: { bodySizeLimit: '20mb' }
  }
  ```
- For tRPC uploads, consider bypassing tRPC entirely for file uploads: use a direct Route Handler that streams to disk, then pass the file path through tRPC.
- Store files on the local filesystem (e.g., `public/uploads/` or an `uploads/` directory outside `public`), not in SQLite as BLOBs — SQLite BLOBs over 1MB degrade performance significantly.  
**Confidence:** HIGH for the 4MB limit. MEDIUM for the exact App Router config key (verify against Next.js 15 docs).

---

### 7. tRPC v11: `httpBatchStreamLink` is now the default — old `httpBatchLink` behavior changed
**What goes wrong:** tRPC v11 introduced streaming as a first-class concept. The default link in v11 examples is `httpBatchStreamLink`, not `httpBatchLink`. If you use v10 client setup code with v11, requests may hang, return partial results, or fail with content-type mismatches.  
**Key v10→v11 breaking changes (training data, MEDIUM confidence):**
- The `createTRPCProxyClient` API was reorganized. In v11, you use `createTRPCClient`.
- `httpBatchStreamLink` replaces `httpBatchLink` as the recommended default.
- React Query integration moved from `@trpc/react-query` with slightly different initialization — `createTRPCReact` still exists but the `QueryClient` setup pattern changed.
- Server-side caller creation: `appRouter.createCaller(ctx)` is deprecated in favor of `createCallerFactory`.
- The `transformer` option (for superjson) is now passed at the router level, not the client link level.  
**Prevention:**
- Start with the official tRPC v11 starter template, not adapted v10 code.
- Use `createCallerFactory` for server-side tRPC calls in RSC.
- If you see `No "query" procedure` errors, the client/server transformer config is mismatched.  
**Confidence:** MEDIUM — based on tRPC changelog knowledge through August 2025. Verify against https://trpc.io/docs/v11/migrate-from-v10-to-v11.

---

## Moderate Pitfalls (will cause pain)

### 1. React Strict Mode double-invocation causing duplicate DB writes in development
**What goes wrong:** React 18+ Strict Mode (enabled by default in Next.js dev mode) intentionally mounts, unmounts, and remounts components. Server Actions and mutations can fire twice in development.  
**Prevention:**
- Use tRPC mutations (not direct Server Actions) for writes — tRPC mutations are not affected by React's double-invoke because they're called imperatively, not on mount.
- If you see duplicate records in development, this is the cause. It does not happen in production builds.
- Never disable Strict Mode to fix this — fix the root cause.  
**Confidence:** HIGH.

---

### 2. Turkish timezone (Europe/Istanbul, UTC+3) date storage and display bugs
**What goes wrong:** SQLite stores dates as TEXT (ISO 8601) or INTEGER (Unix timestamp). JavaScript `new Date()` uses the system timezone. If the machine's timezone is set to Europe/Istanbul but dates are stored as UTC ISO strings, display calculations will be off by 3 hours for time-sensitive fields (court hearing times, deadline timestamps).  
**Specific gotcha:** SQLite's `CURRENT_TIMESTAMP` returns UTC. If Drizzle uses `defaultNow()` backed by SQLite's `CURRENT_TIMESTAMP`, stored values are UTC but display assumes local time.  
**Prevention:**
- Store all datetimes as **Unix timestamps (INTEGER)** in SQLite — avoids timezone ambiguity entirely.
- Or store as ISO 8601 with explicit `Z` suffix (UTC) and format for display using `date-fns` with `Europe/Istanbul` timezone.
- In Drizzle schema, use `integer('created_at', { mode: 'timestamp' })` — this stores as Unix timestamp and hydrates as JS `Date`.
- For display, use `date-fns-tz`: `formatInTimeZone(date, 'Europe/Istanbul', 'dd.MM.yyyy HH:mm')`.
- For deadline dates (no time component, e.g., "dava açma süresi"), store as `TEXT` in `YYYY-MM-DD` format to avoid any timezone shift.  
**Confidence:** HIGH for the storage pitfall. MEDIUM for the specific Drizzle mode recommendation.

---

### 3. date-fns Turkish locale (tr) incomplete or incorrect for legal date formatting
**What goes wrong:** `date-fns` v3 ships with a `tr` locale. However, Turkish legal documents use specific date formats (`10 Nisan 2026`, ordinal months) that may not match the default `date-fns` `tr` locale formatting.  
**The ı/i problem:** Turkish `toLowerCase()` / `toUpperCase()` in JavaScript follows Unicode rules but `"I".toLowerCase()` returns `"i"` (not `"ı"`) in most JS engines unless locale-aware methods are used. `date-fns` month names in Turkish locale may have this bug for month names containing `I`.  
**Prevention:**
- Use `toLocaleLowerCase('tr-TR')` and `toLocaleUpperCase('tr-TR')` when manipulating Turkish strings, not plain `.toLowerCase()`.
- For legal date formatting, write a small utility function rather than relying entirely on `date-fns` format strings.
- Test: `format(new Date('2026-01-15'), 'd MMMM yyyy', { locale: tr })` should return `"15 Ocak 2026"` — verify the output manually.  
**Confidence:** MEDIUM — the ı/i JavaScript issue is well-known; the specific date-fns tr locale completeness is MEDIUM confidence.

---

### 4. React Query + tRPC: stale cache showing outdated case data after mutations
**What goes wrong:** After a tRPC mutation (e.g., updating a case status), the query cache still holds the old data. The UI shows stale information until a page refresh.  
**Why it happens:** React Query does not automatically know which queries are invalidated by a mutation. You must tell it.  
**Prevention:**
  ```ts
  const utils = trpc.useUtils();
  const updateCase = trpc.cases.update.useMutation({
    onSuccess: () => {
      // Invalidate the specific query
      utils.cases.getById.invalidate({ id: caseId });
      // Or invalidate the whole namespace
      utils.cases.invalidate();
    }
  });
  ```
- For list + detail pattern (common in case management): always invalidate both `cases.list` and `cases.getById` on any write.
- Consider `onSettled` instead of `onSuccess` so invalidation runs even on partial errors.  
**Confidence:** HIGH.

---

### 5. shadcn/ui hydration mismatch with SSR in Next.js 15 App Router
**What goes wrong:** shadcn/ui components like `<Popover>`, `<Dialog>`, `<DropdownMenu>` use Radix UI primitives that read `window` or `document` during render. In SSR, these are undefined, causing hydration mismatches — the server-rendered HTML differs from the client, producing a React hydration error.  
**Also:** The `useTheme` hook from `next-themes` (commonly paired with shadcn) always causes a hydration warning if you render theme-dependent content on the server.  
**Prevention:**
- Wrap interactive shadcn components that show/hide based on client state in `dynamic(() => import(...), { ssr: false })` if hydration errors appear.
- For `next-themes`, wrap the theme toggle in a `mounted` state check:
  ```ts
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  ```
- Most shadcn/ui components work fine with SSR in practice — only add `ssr: false` when you actually see a hydration error, not preemptively.  
**Confidence:** HIGH.

---

### 6. Single-user env-password auth: token leakage via Next.js public env vars
**What goes wrong:** Next.js exposes any env variable prefixed with `NEXT_PUBLIC_` to the client bundle. If you accidentally name your password env var `NEXT_PUBLIC_APP_PASSWORD`, it appears in the JavaScript bundle served to the browser — visible to anyone who opens DevTools.  
**Prevention:**
- Use `APP_PASSWORD` (no `NEXT_PUBLIC_` prefix) — it is only available server-side.
- For session management, use `iron-session` or `next-auth` credentials provider — both keep the secret server-side.
- Validate the password in a tRPC procedure or Route Handler, return a signed cookie/session token, and check the token on subsequent requests via middleware.
- Add `.env.local` to `.gitignore` (Next.js does this by default, but verify).  
**Confidence:** HIGH.

---

### 7. Drizzle `relations` vs foreign keys — silently missing cascade deletes
**What goes wrong:** Drizzle ORM's `relations()` API defines relationships for the query builder (`db.query.cases.findMany({ with: { documents: true } })`). These are **JavaScript-level only** — they do not create foreign key constraints or cascade rules in the actual SQLite schema.  
**Consequence:** Deleting a case does not delete its associated documents, calendar events, or finance records. Orphaned records accumulate, queries return ghost data.  
**Prevention:**
- Define foreign keys in the schema using Drizzle's `references()` with explicit `onDelete: 'cascade'`:
  ```ts
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' })
  ```
- Enable SQLite foreign key enforcement (off by default):
  ```ts
  db.pragma('foreign_keys = ON');
  ```
  This must be called every time you open the connection — SQLite does not persist this pragma.  
**Confidence:** HIGH — SQLite foreign keys off by default is a famous SQLite gotcha.

---

## Minor Gotchas (good to know)

### 1. better-sqlite3 must be rebuilt for each Node.js major version
Running `nvm use 22` after having installed for Node 20 will break better-sqlite3 with `was compiled against a different Node.js version`. Run `npm rebuild better-sqlite3` after any Node version change.

### 2. Turbopack in Next.js 15 is still experimental for complex setups
As of late 2024/early 2025, Turbopack (`next dev --turbo`) had known issues with some native modules and certain webpack plugins. For production-adjacent development, use the default webpack dev server until Turbopack is marked stable for your specific dependency set. Check the Next.js canary release notes.  
**Confidence:** MEDIUM — Turbopack stability improves with each release.

### 3. SQLite file locking on Windows
Windows file locking is stricter than Linux/macOS. If you open the SQLite file in DB Browser for SQLite while the Next.js server is running, you may get `SQLITE_BUSY` or fail to open the file. Close external DB tools before running the dev server. WAL mode helps here too.

### 4. pdfmake/jsPDF font registration requires large base64 blobs
Embedding a full Unicode TTF font (Roboto Regular is ~170KB) as base64 adds ~230KB to your bundle or to every PDF generation call. Keep font files on the filesystem and load them with `fs.readFileSync` in the server-side PDF generation function — never import TTF as a static asset in client bundle.

### 5. React Query devtools adds significant bundle size
`@tanstack/react-query-devtools` should be imported conditionally:
```ts
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? (await import('@tanstack/react-query-devtools')).ReactQueryDevtools
  : () => null;
```

### 6. tRPC superjson transformer required for Date objects
Without the `superjson` transformer configured on both client and server, `Date` objects passed through tRPC procedures are serialized as strings. Receiving code gets a `string` instead of a `Date`, causing subtle date comparison bugs. Add `transformer: superjson` to both `initTRPC.create()` and the client link.

### 7. Next.js `cookies()` and `headers()` are now async in Next.js 15
In Next.js 15, `cookies()` and `headers()` from `next/headers` became async functions. If your tRPC context factory calls `cookies()` synchronously (as was correct in Next.js 14), it will either throw or return a thenable that looks like an object. Update to `await cookies()`.

### 8. `Date` objects in SQLite via Drizzle `timestamp` mode and DST
Turkey abolished daylight saving time in 2016 — Europe/Istanbul is always UTC+3. This is actually an advantage: no DST transitions to worry about. However, confirm the server/machine timezone is correctly set to `Europe/Istanbul` so `new Date()` behaves as expected.

### 9. Large PDF files stored in `public/` are publicly accessible
If you store generated petition PDFs in `public/uploads/`, they are served statically by Next.js with no auth check. For sensitive legal documents, store files outside `public/` (e.g., `./uploads/`) and serve them through an authenticated Route Handler that checks the session cookie.

### 10. shadcn/ui `<Calendar>` component locale for Turkish
shadcn/ui's Calendar is built on `react-day-picker`. Pass the `locale` prop explicitly:
```tsx
import { tr } from 'date-fns/locale';
<Calendar locale={tr} weekStartsOn={1} />
```
Without this, month names and day names appear in English, and the week starts on Sunday instead of Monday (Turkish convention: Monday first).

---

## Recommended Mitigations

| Risk | Mitigation | Priority |
|------|-----------|----------|
| Native module bundling failure | `serverExternalPackages: ['better-sqlite3']` in next.config.ts | CRITICAL — do first |
| DB locked errors | Enable WAL mode + `busy_timeout = 5000` on connection open | CRITICAL — do first |
| Data loss from `drizzle-kit push` | Use `generate` + `migrate` workflow from day one | CRITICAL — do first |
| Turkish PDF characters missing | Embed Roboto or DejaVu TTF; test with full Turkish alphabet | CRITICAL — validate before shipping petition feature |
| Orphaned records on delete | Enable `foreign_keys = ON` pragma + `onDelete: 'cascade'` in schema | HIGH |
| Timezone date bugs | Store dates as Unix timestamps; use `date-fns-tz` for display | HIGH |
| File upload 413 errors | Configure `bodySizeLimit` in next.config; store files on filesystem not as BLOBs | HIGH |
| tRPC v11 API mismatch | Start from official v11 template; use `createCallerFactory`; verify transformer config | HIGH |
| Stale React Query cache | Always call `utils.[namespace].invalidate()` in mutation `onSuccess` | HIGH |
| Password in client bundle | Never use `NEXT_PUBLIC_` prefix for secrets; validate server-side only | HIGH |
| Sensitive PDF files exposed | Serve from outside `public/` via authenticated Route Handler | MEDIUM |
| Hydration mismatches (shadcn) | Add `dynamic({ ssr: false })` only when hydration error occurs | MEDIUM |
| `cookies()` async in Next.js 15 | Await `cookies()` in tRPC context factory | MEDIUM |
| superjson Date serialization | Add `transformer: superjson` to both server and client tRPC config | MEDIUM |
| Font size bloat in PDF | Load TTF from filesystem with `fs.readFileSync`, never bundle in client | LOW |
| Windows SQLite file locking | Close DB Browser / external tools before dev server; use WAL mode | LOW |
| Turkish i/İ case conversion | Use `.toLocaleLowerCase('tr-TR')` not `.toLowerCase()` | LOW |
| React Strict Mode double writes | Use tRPC mutations (not on-mount effects) for writes | LOW |

---

## Sources

All findings are from training data (knowledge cutoff August 2025). No live web sources were accessible during this research session.

**Validate these against current official docs before implementation:**
- Next.js 15 external packages config: https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages
- tRPC v11 migration guide: https://trpc.io/docs/v11/migrate-from-v10-to-v11
- Drizzle ORM SQLite: https://orm.drizzle.team/docs/get-started/sqlite-new
- better-sqlite3 WAL mode: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
- Next.js 15 cookies() async change: https://nextjs.org/blog/next-15#async-request-apis-breaking-change
