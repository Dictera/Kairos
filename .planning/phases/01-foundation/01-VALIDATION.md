---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (greenfield — Wave 0 installs jest or uses CLI smoke tests) |
| **Config file** | None — Wave 0 creates if needed |
| **Quick run command** | `npx jest --testPathPattern="foundation" --passWithNoTests` |
| **Full suite command** | `npm run build` (zero TypeScript/Next.js errors) |
| **Estimated runtime** | ~30 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run applicable CLI smoke test (e.g., `npx drizzle-kit migrate`, `npx tsc --noEmit`)
- **After every plan wave:** `npm run build` — zero TypeScript/Next.js errors
- **Before `/gsd-verify-work`:** Full build succeeds + all manual checks pass
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FOUND-01 | — | serverExternalPackages locks better-sqlite3 server-side | smoke | `node -e "const c = require('./next.config.ts'); console.assert(c.default.serverExternalPackages.includes('better-sqlite3'))"` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | FOUND-02 | — | SQLite WAL mode + foreign_keys enforced at connection | integration | `npx tsx tests/db.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | FOUND-03 | — | drizzle-kit generate produces migration; migrate creates db.sqlite | smoke | `npx drizzle-kit migrate && sqlite3 data/db.sqlite ".tables"` | ❌ W0 (CLI) | ⬜ pending |
| 1-03-01 | 03 | 2 | FOUND-04 | — | tRPC endpoint returns 200 + `{ok:true}` | smoke | `curl -s http://localhost:3000/api/trpc/health \| grep ok` | ❌ W0 (manual) | ⬜ pending |
| 1-04-01 | 04 | 2 | FOUND-05 | T-session | Unauthenticated → redirect to /login; authenticated → pass | e2e | Manual browser test | ❌ W0 (manual) | ⬜ pending |
| 1-04-02 | 04 | 2 | FOUND-05 | T-cookie | Wrong password rejected; correct password sets HttpOnly cookie | e2e | Manual browser test | ❌ W0 (manual) | ⬜ pending |
| 1-05-01 | 05 | 3 | FOUND-06 | — | Sidebar renders 9 links; collapses to icon rail | visual | Manual browser verification | ❌ W0 (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `data/.gitkeep` — directory must exist for SQLite file creation
- [ ] `.env.local` — SESSION_PASSWORD, APP_PASSWORD, SESSION_COOKIE_NAME env vars
- [ ] `package.json` db scripts — `db:generate`, `db:migrate`
- [ ] TypeScript `tsconfig.json` with `strict: true`

*All Wave 0 items are setup prerequisites, not test stubs — Wave 0 in each plan creates the necessary infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| tRPC health endpoint returns `{ok:true}` | FOUND-04 | Requires running dev server | Start `npm run dev`, open browser to `http://localhost:3000/api/trpc/health` |
| Unauthenticated redirect to /login | FOUND-05 | Requires browser + middleware | Open `http://localhost:3000` — should redirect to `/login` |
| Correct password sets cookie; wrong password rejected | FOUND-05 | Requires browser session | Test login form with correct/wrong passwords |
| Sidebar 9 links visible; icon-only collapse | FOUND-06 | Visual/UI | Open app, verify sidebar items, click collapse toggle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
