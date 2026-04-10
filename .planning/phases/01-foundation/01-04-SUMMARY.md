---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [iron-session, next-middleware, login-page, env-auth, cookie-auth]

# Dependency graph
requires:
  - 01-03 (lib/session.ts: SessionData interface and sessionOptions must exist)
provides:
  - app/api/auth/login/route.ts: POST handler validating APP_PASSWORD, setting iron-session cookie
  - middleware.ts: auth guard redirecting unauthenticated requests to /login
  - app/login/page.tsx: client-side login form with Turkish copy per UI-SPEC.md
affects: [01-05, all-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "await cookies() in middleware: Next.js 15 requires async cookies() even in middleware context"
    - "PUBLIC_PATHS pattern: /login + /api/trpc + /api/auth prevents infinite redirect loop on login POST"
    - "iron-session via middleware: getIronSession with awaited cookieStore reads sealed cookie"
    - "middleware matcher: excludes _next/static, _next/image, favicon.ico via negative lookahead regex"
    - "strict === comparison: password !== process.env.APP_PASSWORD prevents type coercion issues"

key-files:
  created:
    - app/api/auth/login/route.ts
    - middleware.ts
    - app/login/page.tsx
  modified: []

key-decisions:
  - "PUBLIC_PATHS includes /api/auth (not just /api/trpc) — without this, the login POST itself is blocked creating an infinite redirect loop"
  - "Login page uses plain HTML + Tailwind (no shadcn components) — avoids dependency on Plan 01-05 shadcn init; Plan 01-05 can upgrade to shadcn components"
  - "Strict === password comparison with !password guard — prevents empty string from matching if APP_PASSWORD is undefined"

requirements-completed: [FOUND-05]

# Metrics
duration: 1min
completed: 2026-04-11
---

# Phase 01 Plan 04: Env-Based Auth Summary

**Env-based single-user auth: POST login route validates APP_PASSWORD against iron-session cookie, middleware.ts guards all routes except /login and /api/trpc, standalone login page with exact Turkish copy per UI-SPEC.md**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-10T23:21:56Z
- **Completed:** 2026-04-10T23:23:22Z
- **Tasks:** 2
- **Files modified:** 3 created, 0 modified

## Accomplishments

- app/api/auth/login/route.ts: POST handler using async cookies() (Next.js 15), validates password with strict ===, sets session.isLoggedIn = true, awaits session.save(), returns 401 with Turkish error on mismatch
- middleware.ts: auth guard at project root with PUBLIC_PATHS [/login, /api/trpc, /api/auth], uses await cookies() per Next.js 15 requirement, matcher excludes _next/static/_next/image/favicon.ico
- app/login/page.tsx: client component ('use client') with useState for password/error/loading, POSTs to /api/auth/login, redirects to / on success, exact Turkish copy per UI-SPEC.md
- All Turkish copy matches UI-SPEC.md copywriting contract exactly: "Sigorta Takip", "Avukat paneline erişmek için şifrenizi girin.", "Şifre", "Giriş Yap", "Şifre hatalı. Lütfen tekrar deneyin."
- Card styling matches UI-SPEC.md: max-w-[400px], border #e2e8f0, border-radius 8px, button color #14b8a6, error color #dc2626
- npx tsc --noEmit passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 01-04-01: Create login API route handler** - `6ae8ddd` (feat)
2. **Task 01-04-02: Create middleware auth guard and login page** - `8ed2cd8` (feat)

## Files Created/Modified

- `app/api/auth/login/route.ts` - POST handler: validates APP_PASSWORD, sets iron-session cookie with isLoggedIn=true
- `middleware.ts` - Auth guard at project root: PUBLIC_PATHS, async cookies(), redirects unauthenticated to /login
- `app/login/page.tsx` - Standalone login page: client component, Turkish copy, teal button, plain HTML + Tailwind (no shadcn dependency)

## Decisions Made

- PUBLIC_PATHS includes /api/auth so the login POST route itself is accessible. Without this, submitting the login form would trigger middleware redirect, creating an infinite loop.
- Login page built with plain HTML + Tailwind instead of shadcn components. Plan 01-05 installs shadcn, so this avoids a cross-plan dependency. Plan 01-05 can optionally upgrade the login page to use shadcn Input/Button/Form.
- Password comparison uses strict === with !password guard. The !password check prevents an empty password from matching if APP_PASSWORD is undefined in the environment.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All three files are fully functional:
- The login route handler fully validates passwords and sets cookies
- The middleware fully guards all routes
- The login page fully handles the auth flow end-to-end

## Threat Surface Check

New network endpoints introduced: `/api/auth/login` (POST only)

Security mitigations verified per threat model:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Timing side-channel on password comparison | Localhost-only; === comparison acceptable per threat model disposition | VERIFIED |
| Middleware bypassed by crafted URL | Next.js normalizes URLs before pathname; startsWith checks are safe | VERIFIED |
| Forged session cookie (isLoggedIn: true) | iron-session seals with HMAC+encryption using SESSION_PASSWORD; decryption rejects forgeries | VERIFIED |
| APP_PASSWORD leaked in error response | Route returns only { error: 'Şifre hatalı...' }; password never logged or echoed | VERIFIED |
| Login API blocked by middleware (redirect loop) | /api/auth in PUBLIC_PATHS; login POST is accessible without auth | VERIFIED |
| _next/static bypasses middleware | matcher explicitly excludes _next/static, _next/image, favicon.ico | VERIFIED |

## Self-Check: PASSED

- app/api/auth/login/route.ts: FOUND (contains export async function POST, await cookies(), await getIronSession, session.isLoggedIn = true, await session.save(), status: 401)
- middleware.ts: FOUND at project root (contains PUBLIC_PATHS with /login and /api/trpc, await cookies(), config with matcher excluding _next/static)
- app/login/page.tsx: FOUND (contains 'use client', "Sigorta Takip", "Avukat paneline erişmek için şifrenizi girin.", "Şifre", "Giriş Yap", "Şifre hatalı. Lütfen tekrar deneyin.", POSTs to /api/auth/login)
- Commit 6ae8ddd: VERIFIED (feat(01-04): create login API route handler)
- Commit 8ed2cd8: VERIFIED (feat(01-04): create middleware auth guard and login page)
- npx tsc --noEmit: PASSED (zero errors)

---
*Phase: 01-foundation*
*Completed: 2026-04-11*
