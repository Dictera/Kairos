# Phase 20: Eski Sistemler Temizliği - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all old Tiptap-based `dilekce` and `.odt`-based `dilekce-odt` pipelines — routers, routes, API, services, tables, uploaded files, navigation, and unused npm dependencies — from the system permanently. Phase 20 executes only after Phase 19 is validated end-to-end so rollback stays possible.

</domain>

<decisions>
## Implementation Decisions

### Cleanup Trigger Mechanism
- **D-01:** Retirement triggers **automatically on first app launch** when old tables (`dilekce_sablonu`, `dilekce_odt_sablonu`) are detected in the database.
- **D-02:** **One-time execution** — a flag is stored after the first check to prevent re-running the detection logic on subsequent launches.
- **D-03:** Confirmation modal offers **"Onayla" and "Vazgeç" only** — no permanent skip option. If the user cancels, the modal will reappear on the next launch until they approve.
- **D-04:** On successful completion: **page auto-refreshes + success toast** appears. Old "Dilekçeler" link disappears and "Şablon Yönetimi" becomes visible.

### Pre-cleanup Safety Gate
- **D-05:** **No pipeline health verification** before showing the retirement modal. The modal appears unconditionally regardless of whether Python/LibreOffice are reachable.
- **D-06:** Modal is **simple and focused** — contains only the retirement confirmation message: "Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?" No pipeline status, no extra information.

### Navigation Transition Timing
- **D-07:** Sidebar **"Dilekçeler" link is replaced with "Şablon Yönetimi" in code before retirement runs**. The navigation change ships with the code update; retirement is a runtime/data cleanup that follows.
- **D-08:** Old `/dilekce` routes (and all sub-routes) **redirect to `/ayarlar`** instead of returning 404. This preserves any bookmarks and provides a soft landing.

### Post-cleanup Verification
- **D-09:** **Import scan first** — grep/scan for any remaining references to deleted modules (`dilekce`, `jspdf`, `adm-zip`, `@xmldom/xmldom`, etc.) for fast feedback.
- **D-10:** **`next build` as final validation gate** — run after all deletions to confirm no stale imports or missing dependencies remain.
- **D-11:** Both verifications are **automated within the retirement flow/script**, not left as manual developer steps.

### the agent's Discretion
- Exact modal wording and styling (beyond the confirmation message)
- Flag storage mechanism for one-time detection (DB table, settings file, or localStorage)
- Import scan exact command, target patterns, and pass/fail criteria
- Redirect implementation approach (Next.js `redirect` config, middleware, or page-level redirect)
- Order of deletions within the retirement script (DB tables vs files vs code removal)
- Exact success toast message wording

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 20 Requirements
- `.planning/REQUIREMENTS.md` §TEMIZ-01–TEMIZ-08 — Temizlik (Retirement) gereksinimleri
- `.planning/ROADMAP.md` §Phase 20 — Phase goal, success criteria, and dependencies

### Prior Phase Context
- `.planning/phases/19-belgeler-ui-ve-sablon-yonetimi-ekrani/19-CONTEXT.md` — Phase 19 decisions; Phase 20 depends on Phase 19 being validated end-to-end
- `.planning/phases/18-arsiv-ve-belge-entegrasyonu/18-CONTEXT.md` — Archive and transactional decisions
- `.planning/phases/17-pdf-uretim-motoru/17-CONTEXT.md` — PDF engine and pipeline decisions
- `.planning/phases/16-sablon-semasi-ve-crud/16-CONTEXT.md` — Template CRUD and schema decisions
- `.planning/phases/15-pipeline-temeli/15-CONTEXT.md` — Sidecar architecture and protocol

### Project State & Decisions
- `.planning/STATE.md` §Accumulated Context — "Retirement last" decision, "No data export on retirement", DB backup `.pre-v1.2.bak` policy
- `.planning/PROJECT.md` — Tech stack, constraints, Out of Scope (Tiptap/ODT deletion confirmed)

### Schema & Code to be Removed
- `lib/schema.ts` — `dilekceSablonu` and `dilekceOdtSablonu` table definitions (lines ~381–410)
- `lib/trpc/routers/_app.ts` — `dilekceRouter` and `dilekceOdtRouter` registrations
- `components/app-sidebar.tsx` — "Dilekçeler" nav link (line ~46)
- `package.json` — `jspdf`, `adm-zip`, `@xmldom/xmldom`, `@types/adm-zip` dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Assets Being Removed
- `lib/trpc/routers/dilekce.ts` — Tiptap-based petition router (to be deleted)
- `lib/trpc/routers/dilekce-odt.ts` — ODT-based template router (to be deleted)
- `app/(dashboard)/dilekce/` — 6 route files including `[id]/page.tsx`, `yeni/page.tsx`, `odt-yukle/page.tsx` (to be deleted)
- `app/api/dilekce/[id]/pdf/route.ts` — API route for Tiptap PDF generation (to be deleted)
- `app/api/dilekce-odt/[id]/pdf/route.ts` — API route for ODT PDF generation (to be deleted)
- `lib/services/odt-to-pdf.ts` — ODT-to-PDF conversion service (to be deleted)
- `lib/pdf/pdf-generator.ts` — Tiptap-based PDF generator (to be deleted)
- `dilekce_sablonu` table — Tiptap template storage (DROP via migration)
- `dilekce_odt_sablonu` table — ODT template storage (DROP via migration)
- `./uploads/odt-templates/` — 4 `.odt` files on disk (delete folder)

### Established Patterns
- tRPC router registration: `lib/trpc/routers/{feature}.ts` → `lib/trpc/routers/_app.ts` — unregister by removing imports and object keys
- Drizzle migration: `drizzle/` folder with timestamped SQL files — add DROP TABLE migration
- Sidebar navigation: `components/app-sidebar.tsx` nav items array — replace label and href
- File cleanup: `fs.rmSync()` or `fs.rmdirSync()` with `recursive: true` for `./uploads/odt-templates/`
- Dependency removal: `npm uninstall jspdf adm-zip @xmldom/xmldom` + remove `@types/adm-zip` from devDependencies

### Integration Points
- `lib/trpc/routers/_app.ts` — Remove `dilekceRouter` and `dilekceOdtRouter` from the app router
- `components/app-sidebar.tsx` — Replace `{ label: 'Dilekçeler', href: '/dilekce', icon: FileEdit }` with `{ label: 'Şablon Yönetimi', href: '/ayarlar', icon: Settings }` (or appropriate icon)
- `lib/schema.ts` — Remove `dilekceSablonu` and `dilekceOdtSablonu` table definitions
- `package.json` — Remove 4 npm packages; run `npm install` to update lockfile
- `next.config.js` / `next.config.ts` — May need redirect rule for `/dilekce` → `/ayarlar`

</code_context>

<specifics>
## Specific Ideas

- No data export — user pre-approved permanent deletion of Tiptap + ODT data (PROJECT.md Out of Scope)
- Windows-first deployment — all paths are Windows-aware (D:\sigorta-takip)
- Retirement modal message: "Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-eski-sistemler-temizligi*
*Context gathered: 2026-04-22*
