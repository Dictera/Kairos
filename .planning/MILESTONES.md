# Milestones

## v1.0 MVP (Shipped: 2026-04-13)

**Phases completed:** 9 phases, 31 plans, 52 tasks

**Key accomplishments:**

- Next.js 15.5.15 App Router project bootstrapped with all Phase 1 dependencies, serverExternalPackages: ['better-sqlite3'] configured, TypeScript strict mode enabled, and environment variable template created
- SQLite connection singleton with WAL mode, globalThis hot-reload protection, and Drizzle ORM generate+migrate workflow producing verified data/db.sqlite with schema_test table
- Full tRPC v11 stack wired: initTRPC with superjson transformer, async iron-session context, publicProcedure/protectedProcedure with UNAUTHORIZED guard, health procedure, and fetchRequestHandler route handler at /api/trpc
- Env-based single-user auth: POST login route validates APP_PASSWORD against iron-session cookie, middleware.ts guards all routes except /login and /api/trpc, standalone login page with exact Turkish copy per UI-SPEC.md
- shadcn v4 initialized with teal theme, collapsible icon-rail sidebar (9 nav links), TRPCProvider+QueryClientProvider client boundary, route-group layout isolation for login page, and 9 placeholder dashboard pages — full Phase 1 skeleton complete
- One-liner:
- Drizzle schema with STK/Mahkeme stage enums, SurecDetay JSON column, durusma table, and tRPC router with 9 procedures for process tracking
- SurecStepper generic stage stepper with 9 STK stages, StkDataForm with 8 data fields and date pickers, YargilamaSureciTab orchestrator integrated into dosya detail tabs
- MahkemeDataForm with 6 fields, DurusmaDialog for add/edit hearings, DurusmaList with chronological table and full CRUD, all wired into YargilamaSureciTab
- sure table schema, pure deadline calculation service, Drizzle migration, and Wave 0 test stubs established
- sure and dashboard tRPC routers created with full CRUD; auto-calc wired into surec mutations; SureList component delivers deadline CRUD UI on case detail page
- Dashboard page with 3 stat cards, Yaklaşan Süreler urgency badges, and Bugünkü Duruşmalar widget — all powered by tRPC dashboardStats query
- Fixed 3 code review findings: timezone off-by-one, unused import, silent delete
- tRPC calendar.getMonthEvents procedure with Zod validation, querying durusma and sure tables for monthly view
- Calendar page UI with monthly grid, inline event badge counts per day, and popover event list linking to case detail pages
- Phase 6 UAT gap closures applied - multiple UI fixes
- Plan:
- Plan:
- Plan:
- Plan:
- Shared DatePickerField component with Turkish locale (dd.MM.yyyy, Monday week start) extracted and applied to SureList create and edit forms
- Reference forms import shared DatePickerField from components/ui/date-picker.tsx, dosya-list filter inputs updated to use DatePickerField with Turkish locale and Monday-first calendar

---
