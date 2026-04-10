---
phase: 01-foundation
plan: 03
subsystem: infra/trpc
tags: [trpc-v11, superjson, iron-session, fetchRequestHandler, next-app-router]

# Dependency graph
requires:
  - 01-02 (lib/db.ts, lib/schema.ts, drizzle config must exist)
provides:
  - lib/session.ts: SessionData interface + sessionOptions (iron-session config, 7-day TTL)
  - lib/trpc/init.ts: createTRPCContext (async cookies), publicProcedure, protectedProcedure (UNAUTHORIZED guard), createCallerFactory, createTRPCRouter
  - lib/trpc/routers/_app.ts: appRouter with health procedure + AppRouter type export
  - app/api/trpc/[trpc]/route.ts: fetchRequestHandler with GET+POST exports
  - lib/trpc/client.ts: createTRPCClient with httpBatchLink + superjson transformer
affects: [01-04, 01-05, all-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fetchRequestHandler: correct Next.js App Router adapter (not createNextApiHandler)"
    - "async cookies(): Next.js 15 requires await cookies() in server context factories"
    - "superjson transformer: set in both initTRPC.create() and httpBatchLink to match wire format"
    - "protectedProcedure middleware: checks session.isLoggedIn, throws TRPCError UNAUTHORIZED"
    - "typeof AppRouter: client imports type-only, never imports server runtime code"

key-files:
  created:
    - lib/session.ts
    - lib/trpc/init.ts
    - lib/trpc/routers/_app.ts
    - app/api/trpc/[trpc]/route.ts
    - lib/trpc/client.ts
  modified: []

key-decisions:
  - "lib/trpc/client.ts imports AppRouter as type-only — no server/DB code leaks into client bundle"
  - "session.ts is a minimal stub; Plan 01-04 will add the login route handler using these exports"
  - "TRPCProvider + QueryClientProvider deferred to Plan 01-05 (tightly coupled with root layout)"

requirements-completed: [FOUND-04]

# Metrics
duration: 2min
completed: 2026-04-11
---

# Phase 01 Plan 03: tRPC v11 Route Handler Summary

**Full tRPC v11 stack wired: initTRPC with superjson transformer, async iron-session context, publicProcedure/protectedProcedure with UNAUTHORIZED guard, health procedure, and fetchRequestHandler route handler at /api/trpc**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T23:17:16Z
- **Completed:** 2026-04-10T23:19:14Z
- **Tasks:** 2
- **Files modified:** 5 created, 0 modified

## Accomplishments

- lib/session.ts: SessionData interface (isLoggedIn: boolean), sessionOptions with 7-day TTL per D-08, HttpOnly + sameSite: lax cookie config
- lib/trpc/init.ts: createTRPCContext using async cookies() (Next.js 15 requirement), getIronSession with SessionData type, superjson transformer in initTRPC.create()
- lib/trpc/init.ts: publicProcedure, protectedProcedure (UNAUTHORIZED guard when session.isLoggedIn is false), createCallerFactory, createTRPCRouter all exported
- lib/trpc/routers/_app.ts: appRouter with health procedure returning {ok: true, timestamp: new Date()} — Date object survives wire via superjson
- app/api/trpc/[trpc]/route.ts: fetchRequestHandler with endpoint '/api/trpc', exports handler as both GET and POST
- lib/trpc/client.ts: createTRPCClient with httpBatchLink, url '/api/trpc', transformer: superjson (matches server transformer)
- npx tsc --noEmit passes with zero errors after all files created

## Task Commits

Each task was committed atomically:

1. **Task 01-03-01: Create lib/session.ts stub and lib/trpc/init.ts with procedures** - `aaef14a` (feat)
2. **Task 01-03-02: Create tRPC route handler and client module** - `03f19d8` (feat)

## Files Created/Modified

- `lib/session.ts` - SessionData interface + sessionOptions (iron-session config, 7-day TTL per D-08)
- `lib/trpc/init.ts` - createTRPCContext with async cookies(), superjson transformer, publicProcedure, protectedProcedure (UNAUTHORIZED guard), createCallerFactory, createTRPCRouter
- `lib/trpc/routers/_app.ts` - appRouter with health procedure, AppRouter type export
- `app/api/trpc/[trpc]/route.ts` - fetchRequestHandler adapter, GET and POST exports
- `lib/trpc/client.ts` - createTRPCClient with httpBatchLink, superjson transformer, url /api/trpc

## Decisions Made

- lib/trpc/client.ts uses `import type { AppRouter }` — type-only import ensures no server/DB code (lib/db.ts, lib/schema.ts) is pulled into the client bundle. This satisfies the threat model requirement for ASVS 13.1 information disclosure prevention.
- lib/session.ts is intentionally minimal. It provides the SessionData type and sessionOptions that Plan 01-04 will use to implement the login route handler and auth check.
- TRPCProvider + QueryClientProvider wiring is deferred to Plan 01-05 (base layout plan) as documented in the plan — it is tightly coupled with the root layout structure.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `lib/session.ts`: Minimal stub per plan design. Plan 01-04 will add the login route handler that uses `sessionOptions` and `SessionData`. The stub does not prevent this plan's goal (wiring the tRPC v11 stack with iron-session context).

## Threat Surface Check

New network endpoint introduced: `/api/trpc` (GET and POST)

Security mitigations verified per threat model:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthenticated caller invokes protectedProcedure | protectedProcedure checks ctx.session.isLoggedIn, throws TRPCError UNAUTHORIZED | IMPLEMENTED |
| lib/db.ts imported in client bundle | lib/trpc/client.ts imports AppRouter as type-only, never imports runtime DB code | IMPLEMENTED |
| Tampered session cookie sets isLoggedIn: true | iron-session seals cookie with SESSION_PASSWORD — decryption rejects tampered cookies | IMPLEMENTED (iron-session handles) |
| superjson deserializes malicious payload | superjson 2.x does not use eval, no prototype pollution risk | N/A (localhost-only) |

## Self-Check: PASSED

- lib/session.ts: FOUND (contains SessionData with isLoggedIn: boolean, ttl: 60 * 60 * 24 * 7)
- lib/trpc/init.ts: FOUND (contains transformer: superjson, await cookies(), UNAUTHORIZED, all 4 exports)
- lib/trpc/routers/_app.ts: FOUND (contains appRouter, AppRouter type, health procedure)
- app/api/trpc/[trpc]/route.ts: FOUND (contains fetchRequestHandler, handler as GET, handler as POST)
- lib/trpc/client.ts: FOUND (contains httpBatchLink, url: '/api/trpc', transformer: superjson)
- Commit aaef14a: VERIFIED (feat(01-03): create lib/session.ts stub and lib/trpc/init.ts with procedures)
- Commit 03f19d8: VERIFIED (feat(01-03): create tRPC route handler and client module)
- npx tsc --noEmit: PASSED (zero errors)

---
*Phase: 01-foundation*
*Completed: 2026-04-11*
