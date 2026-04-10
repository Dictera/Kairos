# Phase 1: Foundation - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the full technical skeleton of the app: Next.js 15 project scaffold, SQLite connection (better-sqlite3) with Drizzle ORM migration workflow, tRPC v11 route handler, env-based single-user auth, and shadcn/ui base layout with sidebar navigation. No feature data or business logic — only the verified infrastructure that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Sidebar & Navigation
- **D-01:** Sidebar is collapsible — toggles between full (icon + label) and icon-only rail to give more screen space for content
- **D-02:** Navigation order follows daily workflow top to bottom:
  - Dashboard
  - Dosyalar ← primary section
  - Müvekkiller
  - ── separator ──
  - Takvim
  - Belgeler
  - Finans
  - Dilekçeler
  - Raporlar
  - ── separator ──
  - Ayarlar (bottom)
- **D-03:** All 9 top-level route links wired in sidebar in Phase 1 (even if routes are placeholder pages for now)

### Visual Theme
- **D-04:** Warm teal color palette:
  - Sidebar background: `#134e4a` (teal-900)
  - Accent / interactive color: `#14b8a6` (teal-500)
  - Sidebar text / icon: `#f0fdfa`
  - Page background: `#f0fdfa` (or white — Claude's discretion)
- **D-05:** Light mode only — no dark mode toggle in Phase 1; dark mode deferred to a future phase

### Schema Stubs
- **D-06:** Minimal schema stubs — a single `schema_test` (or equivalent) table whose sole purpose is to prove that `drizzle-kit generate` produces a migration and `drizzle-kit migrate` applies it to `./data/db.sqlite` without errors
- **D-07:** Phase 2 owns all real entity schemas (muvekkil, dosya, taraf, etc.) with a clean migration history — no entity structure seeded in Phase 1

### Auth / Session
- **D-08:** iron-session cookie lifetime: **7 days** — lawyer logs in once per week at most; acceptable for a local-only tool with no remote exposure
- **D-09:** Auth flow: password from `.env` → signed HttpOnly cookie via iron-session → `middleware.ts` redirects all routes except `/login` and `/api/trpc` to `/login` when cookie absent

### Claude's Discretion
- Login page visual design (within the teal theme)
- Icon set choice for sidebar icons (Lucide is standard with shadcn/ui)
- Exact shadcn/ui component initialisation list for Phase 1 (only what's needed for the base layout)
- Page background color (white or very light teal tint — stay consistent with the teal theme)
- Exact `iron-session` cookie name and encryption key env var name

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Requirements
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01 through FOUND-06 define acceptance criteria for every deliverable in this phase

### Project Constraints
- `.planning/PROJECT.md` §Constraints — locked tech stack, auth approach, deployment model, performance targets
- `.planning/PROJECT.md` §Key Decisions — pre-made decisions (serverExternalPackages, WAL pragmas, generate+migrate workflow)

### State Notes
- `.planning/STATE.md` §Accumulated Context → Decisions — implementation notes recorded at project init (SQLite pragma requirements, migration workflow rationale)

[No external specs or ADRs — all requirements fully captured above and in decisions]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is completely greenfield. No existing components, hooks, or utilities.

### Established Patterns
- None yet — Phase 1 establishes all baseline patterns that subsequent phases will follow.

### Integration Points
- `./data/db.sqlite` — SQLite file location (must be created by Drizzle migrate in Phase 1)
- `./public/uploads/` — file upload directory (referenced in Phase 6; must exist or be created then)
- `next.config.ts` — `serverExternalPackages: ['better-sqlite3']` is a hard requirement; this config must be set before any DB code runs
- `middleware.ts` — auth guard; must explicitly allow `/login` and `/api/trpc` as public routes

</code_context>

<specifics>
## Specific Ideas

- Sidebar visual preview selected by user for workflow order with separators (after Müvekkiller, and Ayarlar isolated at bottom)
- Warm teal palette is preferred over blue/navy or neutral gray — user explicitly chose the "modern" register over "conservative legal"
- No entity schemas in Phase 1 — this was a conscious choice to keep migration history clean; Phase 2 starts with its own generate+migrate

</specifics>

<deferred>
## Deferred Ideas

- Dark mode support — explicitly deferred to a future phase; do not wire up toggle in Phase 1
- sitemap.html referenced in PROJECT.md as a navigation reference — not present in repo yet; if it becomes available before planning starts, the planner should consult it for route structure confirmation

[None — discussion stayed within Phase 1 scope]

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-10*
