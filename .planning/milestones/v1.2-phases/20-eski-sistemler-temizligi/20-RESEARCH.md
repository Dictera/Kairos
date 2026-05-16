# Phase 20: Eski Sistemler Temizliği - Research

**Researched:** 2026-04-22
**Domain:** Code retirement, dependency cleanup, database migration, Next.js route removal
**Confidence:** HIGH

## Summary

Phase 20 is a **destructive cleanup phase** that permanently removes two legacy petition (dilekçe) pipelines — Tiptap-based HTML editor and ODT template upload — along with all supporting code, database tables, uploaded files, and unused npm dependencies. The phase executes only after Phase 19 (new DOCX pipeline) is validated end-to-end.

The primary research discovery is a **dependency conflict** that the user has resolved: `lib/pdf/pdf-generator.ts` (which uses `jspdf`) is required by two report routes (`/api/raporlar/finans/pdf` and `/api/raporlar/portfy/pdf`) that are **not** part of the legacy dilekçe system. The user has decided to **migrate these report routes to `pdfmake`** (already in `package.json`) as a sub-task of Phase 20.

Additionally, four `@tiptap/extension-*` packages exist in `package.json` but have **zero imports** in source files — they were installed for the Tiptap editor that is being removed and should be uninstalled.

**Primary recommendation:** Migrate report PDF routes to `pdfmake` first, then delete all legacy dilekçe/ODT code, uninstall `jspdf` + `adm-zip` + `@xmldom/xmldom` + Tiptap extensions, and finally run `next build` as the validation gate.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Retirement triggers automatically on first app launch when old tables (`dilekce_sablonu`, `dilekce_odt_sablonu`) are detected in the database.
- **D-02:** One-time execution — a flag is stored after the first check to prevent re-running the detection logic on subsequent launches.
- **D-03:** Confirmation modal offers "Onayla" and "Vazgeç" only — no permanent skip option. If the user cancels, the modal will reappear on the next launch until they approve.
- **D-04:** On successful completion: page auto-refreshes + success toast appears.
- **D-05:** No pipeline health verification before showing the retirement modal.
- **D-06:** Modal is simple and focused — contains only the retirement confirmation message.
- **D-07:** Sidebar "Dilekçeler" link is replaced with "Şablon Yönetimi" in code before retirement runs.
- **D-08:** Old `/dilekce` routes (and all sub-routes) redirect to `/ayarlar` instead of returning 404.
- **D-09:** Import scan first — grep/scan for any remaining references to deleted modules for fast feedback.
- **D-10:** `next build` as final validation gate — run after all deletions to confirm no stale imports or missing dependencies remain.
- **D-11:** Both verifications are automated within the retirement flow/script, not left as manual developer steps.

### Agent's Discretion
- Exact modal wording and styling (beyond the confirmation message)
- Flag storage mechanism for one-time detection (DB table, settings file, or localStorage)
- Import scan exact command, target patterns, and pass/fail criteria
- Redirect implementation approach (Next.js `redirect` config, middleware, or page-level redirect)
- Order of deletions within the retirement script (DB tables vs files vs code removal)
- Exact success toast message wording

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEMIZ-01 | `lib/trpc/routers/dilekce.ts` and `lib/trpc/routers/dilekce-odt.ts` deletion + router unregistration | Verified: both files exist; unregister by removing imports+keys from `_app.ts` |
| TEMIZ-02 | `app/(dashboard)/dilekce/` route folder deletion | Verified: 6 files exist including `[id]/page.tsx`, `yeni/page.tsx`, `odt-yukle/page.tsx` |
| TEMIZ-03 | `app/api/dilekce/` and `app/api/dilekce-odt/` API route deletion | Verified: 2 API route files exist |
| TEMIZ-04 | `lib/services/odt-to-pdf.ts`, `lib/pdf/pdf-generator.ts` deletion + `jspdf`, `adm-zip`, `@xmldom/xmldom` npm uninstall | **RESOLVED**: Report routes will be migrated to `pdfmake` before `jspdf` + `pdf-generator.ts` are removed. |
| TEMIZ-05 | Drizzle migration dropping `dilekce_sablonu` and `dilekce_odt_sablonu` tables | Verified: tables defined in `lib/schema.ts` lines 381–408; migration pattern confirmed in `drizzle/` folder |
| TEMIZ-06 | `./uploads/odt-templates/` folder deletion | Verified: 4 `.odt` files exist in folder |
| TEMIZ-07 | Sidebar nav "Dilekçeler" → "Şablon Yönetimi" | Verified: nav item in `components/app-sidebar.tsx` line 46 |
| TEMIZ-08 | Retirement confirmation modal before cleanup runs | Verified: `AlertDialog` component exists in `components/ui/alert-dialog.tsx` |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route deletion | Frontend Server (SSR) | — | Next.js app router file system |
| API route deletion | API / Backend | — | Next.js Route Handlers |
| tRPC router unregistration | API / Backend | — | Central `_app.ts` registry |
| Database table DROP | Database / Storage | — | Drizzle migration SQL |
| File system cleanup | API / Backend | — | Node.js `fs.rmSync` on server |
| npm dependency removal | Build / Static | — | `npm uninstall` + lockfile update |
| Navigation update | Browser / Client | — | Sidebar React component |
| Redirect rules | Frontend Server (SSR) | — | `next.config.ts` or middleware |
| Retirement modal | Browser / Client | — | React dialog in dashboard layout |
| Retirement flag storage | Database / Storage | — | One-time persistent flag |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.3 | App Router, redirects, build gate | Project standard [VERIFIED: package.json] |
| Drizzle ORM | 0.45.2 | Migration runner, schema management | Project standard [VERIFIED: package.json] |
| better-sqlite3 | 12.8.0 | SQLite DB for flag storage + migrations | Project standard [VERIFIED: package.json] |
| tRPC v11 | 11.16.0 | Router registration/unregistration | Project standard [VERIFIED: package.json] |
| shadcn/ui AlertDialog | radix-ui based | Retirement confirmation modal | Project standard [VERIFIED: components/ui/alert-dialog.tsx] |
| sonner | 2.0.7 | Success toast after retirement | Project standard [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pdfmake | 0.3.7 | **Replacement** for report PDF generation if `jspdf` removed | Migrate `/api/raporlar/*/pdf` routes |
| zod | 3.24.0 | Input validation for retirement API | If adding a tRPC retirement mutation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next.config.ts` redirects | Next.js middleware (`middleware.ts`) | Middleware adds runtime overhead; redirects in config are static and simpler for this use case |
| DB table for retirement flag | `localStorage` | localStorage is client-only and can be cleared; DB is persistent across devices/sessions |
| `AlertDialog` | Custom modal | AlertDialog already enforces accessible focus trap and action/cancel semantics |

**Installation:**
```bash
# No new packages needed — use existing stack
# If migrating report routes to pdfmake, it is ALREADY in package.json
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                          │
│  ┌──────────────┐   ┌──────────────────┐                   │
│  │ Dashboard    │──▶│ RetirementModal  │──▶ "Onayla"       │
│  │ Layout       │   │ (AlertDialog)    │    triggers POST   │
│  └──────────────┘   └──────────────────┘    to /api/retire  │
│         │                      ▲            or tRPC mut.    │
│         │                      └────────────────────────────│
│         │                                                   │
│  ┌──────▼──────┐   ┌──────────────────┐                    │
│  │ Sidebar     │──▶│ "Şablon Yönetimi"│  (replaces         │
│  │ Navigation  │   │ link → /ayarlar  │   "Dilekçeler")    │
│  └─────────────┘   └──────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND SERVER (Next.js)                    │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │ Old Routes   │   │ Redirect Rules   │   │ tRPC App     │ │
│  │ /dilekce/*   │──▶│ /dilekce →       │   │ Router       │ │
│  │ (DELETED)    │   │ /ayarlar         │   │ (unregister) │ │
│  └──────────────┘   └──────────────────┘   └──────────────┘ │
│  ┌──────────────┐   ┌──────────────────┐                    │
│  │ API Routes   │   │ Report PDF       │                    │
│  │ /api/dilekce │   │ Routes (keep or  │                    │
│  │ (DELETED)    │   │ migrate)         │                    │
│  └──────────────┘   └──────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API / BACKEND (tRPC + SQLite)                   │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │ Retirement Check │   │ retirement_flag  │               │
│  │ (on app launch)  │──▶│ table or setting │               │
│  └──────────────────┘   └──────────────────┘               │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ DROP TABLE       │  drizzle/000X_drop_legacy_tables.sql │
│  │ dilekce_sablonu  │                                       │
│  │ dilekce_odt_...  │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FILE SYSTEM + BUILD ARTIFACTS                   │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │ uploads/odt-     │   │ npm uninstall    │               │
│  │ templates/       │   │ jspdf adm-zip    │               │
│  │ (DELETED)        │   │ @xmldom/xmldom   │               │
│  └──────────────────┘   └──────────────────┘               │
│  ┌──────────────────┐                                       │
│  │ next build       │  ← FINAL VALIDATION GATE              │
│  │ (must pass)      │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (post-cleanup)

```
lib/
├── trpc/
│   └── routers/
│       ├── _app.ts          # dilekceRouter + dilekceOdtRouter removed
│       ├── sablon.ts        # new template router (from Phase 16)
│       ├── pdf.ts           # new PDF router (from Phase 17)
│       └── ...              # remaining routers
├── schema.ts                # dilekceSablonu + dilekceOdtSablonu removed
├── services/
│   ├── docx-pipeline.ts     # new pipeline (Phase 15)
│   └── odt-to-pdf.ts        # DELETED
├── pdf/
│   └── pdf-generator.ts     # DELETED or MIGRATED to pdfmake
├── docx/                    # new docx system (Phases 16–19)
└── ...
app/
├── (dashboard)/
│   └── dilekce/             # ENTIRE FOLDER DELETED
├── api/
│   ├── dilekce/             # DELETED
│   ├── dilekce-odt/         # DELETED
│   └── raporlar/            # report routes (may need migration)
components/
├── app-sidebar.tsx          # nav updated
├── dilekce/                 # ENTIRE FOLDER DELETED
└── ui/                      # AlertDialog available
uploads/
└── odt-templates/           # ENTIRE FOLDER DELETED
```

### Pattern 1: tRPC Router Unregistration
**What:** Remove legacy router imports and object keys from the central app router.
**When to use:** Any time a feature router is deleted.
**Example:**
```typescript
// Source: lib/trpc/routers/_app.ts (current state)
// BEFORE:
import { dilekceRouter } from './dilekce'
import { dilekceOdtRouter } from './dilekce-odt'
export const appRouter = createTRPCRouter({
  // ...
  dilekce: dilekceRouter,
  dilekceOdt: dilekceOdtRouter,
  // ...
})

// AFTER:
export const appRouter = createTRPCRouter({
  // ...
  // dilekce and dilekceOdt removed
  // ...
})
```

### Pattern 2: Drizzle DROP TABLE Migration
**What:** Create a timestamped SQL file in `drizzle/` with `DROP TABLE` statements.
**When to use:** Removing tables that are no longer referenced by application code.
**Example:**
```sql
-- Source: drizzle/0006_drop_legacy_dilekce_tables.sql
DROP TABLE IF EXISTS "dilekce_sablonu";
DROP TABLE IF EXISTS "dilekce_odt_sablonu";
```

### Pattern 3: Next.js Static Redirects
**What:** Add `redirects` array to `next.config.ts` for permanent URL migrations.
**When to use:** Old routes need to land users on a new page without 404s.
**Example:**
```typescript
// Source: next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  redirects: async () => [
    {
      source: '/dilekce',
      destination: '/ayarlar',
      permanent: false, // soft redirect; may change later
    },
    {
      source: '/dilekce/:path*',
      destination: '/ayarlar',
      permanent: false,
    },
  ],
}
```

### Pattern 4: Retirement Flag with One-Time Execution
**What:** Check DB on dashboard mount; show modal if old tables exist and flag is not set.
**When to use:** One-time data migration or cleanup that requires user consent.
**Example:**
```typescript
// Conceptual pattern based on project stack
// In dashboard layout or a client component:
const [retirementChecked, setRetirementChecked] = useState(false)

useEffect(() => {
  const flag = localStorage.getItem('retirement_v1_2_done')
  if (!flag) {
    // Query tRPC or API to check if old tables exist
    checkLegacyTables.mutate(undefined, {
      onSuccess: (hasTables) => {
        if (hasTables) setShowModal(true)
        else localStorage.setItem('retirement_v1_2_done', '1')
      }
    })
  }
}, [])
```

### Anti-Patterns to Avoid
- **Deleting files before removing imports:** Always update `_app.ts`, schema exports, and any cross-references BEFORE deleting the target files, or `next build` will fail with module-not-found errors.
- **Running `npm uninstall` before code deletion:** Uninstalling a package while source files still import it causes build failures. Delete code → then uninstall packages.
- **Using `localStorage` as the sole retirement flag:** Users can clear browser storage or access from another device. Combine with a server-side check.
- **Hard-deleting without a DB backup:** The project policy (STATE.md) requires a `.pre-v1.2.bak` backup before retirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialog for destructive action | Custom `<div>` overlay | `AlertDialog` from `components/ui/alert-dialog.tsx` | Already handles focus trap, ESC key, accessible roles, and action/cancel semantics |
| URL redirect after route deletion | Custom 404 page with `<meta refresh>` | Next.js `redirects` in `next.config.ts` | Static, server-side, preserves SEO, zero client JS |
| Import/stale reference detection | Manual file-by-file review | `grep` / `ripgrep` scan + `next build` | Automated, exhaustive, catches transitive imports |
| PDF generation for reports | Custom canvas/SVG renderer | `pdfmake` (already in `package.json`) | Battle-tested, supports Turkish fonts via VFS, table layouts |
| One-time flag persistence | `localStorage` only | SQLite table + localStorage cache | Cross-device persistence; localStorage is just a cache |
| DB table removal | `db.run('DROP TABLE...')` in app code | Drizzle migration SQL file | Version-controlled, reproducible, runs via `drizzle-kit migrate` |

**Key insight:** The biggest risk in a retirement phase is not the deletion itself — it's the **hidden dependencies** that survive the cleanup. `next build` is the canonical verifier; if it passes, the dependency graph is clean.

## Runtime State Inventory

### Stored Data
| Category | Items Found | Action Required |
|----------|-------------|----------------|
| SQLite tables | `dilekce_sablonu` (Tiptap templates), `dilekce_odt_sablonu` (ODT metadata) | DROP via Drizzle migration |
| SQLite indexes | `idx_sablon_kategori` on `dilekce_sablonu`, `idx_odt_sablon_kategori` on `dilekce_odt_sablonu` | Dropped automatically with tables |
| Uploaded files | 4 `.odt` files in `./uploads/odt-templates/` | `fs.rmSync('./uploads/odt-templates', { recursive: true })` |

### Live Service Config
| Category | Items Found | Action Required |
|----------|-------------|----------------|
| None | No external services reference old system | None — verified by codebase grep |

### OS-Registered State
| Category | Items Found | Action Required |
|----------|-------------|----------------|
| None | No Windows Task Scheduler, registry, or systemd entries | None — verified by project inspection |

### Secrets/Env Vars
| Category | Items Found | Action Required |
|----------|-------------|----------------|
| None | No env vars reference `dilekce`, `odt`, or `jspdf` | None — verified by `.env` inspection |

### Build Artifacts
| Category | Items Found | Action Required |
|----------|-------------|----------------|
| package-lock.json | References to `jspdf`, `adm-zip`, `@xmldom/xmldom`, `@types/adm-zip` | Auto-updated by `npm uninstall` |
| node_modules | Installed copies of above packages | Auto-removed by `npm uninstall` |
| `.next/` cache | May contain stale page manifests for `/dilekce` | `rm -rf .next` before final build |

## Common Pitfalls

### Pitfall 1: Report PDF Routes Break After `jspdf` Removal
**What goes wrong:** `app/api/raporlar/finans/pdf/route.ts` and `app/api/raporlar/portfy/pdf/route.ts` import `generatePdfBuffer` from `lib/pdf/pdf-generator.ts`, which depends on `jspdf`. Deleting `pdf-generator.ts` and uninstalling `jspdf` breaks these routes.
**Why it happens:** The report routes are not part of the legacy dilekçe system, but they share the PDF generation utility.
**How to avoid:** **Migrate the two report routes to `pdfmake` (already in `package.json`) BEFORE deleting `pdf-generator.ts` and uninstalling `jspdf`.** See Code Examples section for a `pdfmake` pattern. This is now a confirmed sub-task of Phase 20.
**Warning signs:** `next build` fails with `Module not found: Can't resolve 'jspdf'` or `Cannot find module '@/lib/pdf/pdf-generator'`.

### Pitfall 2: Tiptap Packages Left Behind
**What goes wrong:** `@tiptap/extension-table`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-table-row` remain in `package.json` even though the Tiptap editor is deleted.
**Why it happens:** These packages have **zero imports** in source files — they were only used by the now-deleted `components/dilekce/sablon-editor.tsx`.
**How to avoid:** Add them to the uninstall list alongside `jspdf`, `adm-zip`, and `@xmldom/xmldom`.
**Warning signs:** `node_modules` still contains `@tiptap` after cleanup; `package-lock.json` retains entries.

### Pitfall 3: Schema Export References Cause Build Errors
**What goes wrong:** `lib/schema.ts` exports `dilekceSablonu`, `dilekceSablonuRelations`, `dilekceOdtSablonu`, etc. If these exports are removed while other files still import them (e.g., old API routes not yet deleted), TypeScript compilation fails.
**Why it happens:** Schema is the central type source; many files reference it.
**How to avoid:** Delete all consumers (routers, API routes, components) BEFORE removing exports from `schema.ts`, or delete them in the same atomic commit.
**Warning signs:** `tsc` or `next build` reports `TS2307: Cannot find module '@/lib/schema' or its corresponding type declarations`.

### Pitfall 4: Drizzle Migration Runs Before Code is Updated
**What goes wrong:** If the DROP TABLE migration is applied while `dilekceRouter` or `dilekceOdtRouter` still queries those tables, the app crashes on startup or during requests.
**Why it happens:** The migration runner (`drizzle-kit migrate`) applies pending migrations automatically if called in a deploy script.
**How to avoid:** Ensure all code that reads from `dilekce_sablonu` / `dilekce_odt_sablonu` is deleted BEFORE creating/running the DROP TABLE migration. The retirement API should be the only code that runs the migration, and it should run after user confirmation.
**Warning signs:** Runtime `SQLITE_ERROR: no such table: dilekce_sablonu` errors.

### Pitfall 5: Missing Redirect Causes 404s for Bookmarks
**What goes wrong:** Users with `/dilekce` bookmarks see a 404 after cleanup.
**Why it happens:** Next.js app router returns 404 for non-existent routes by default.
**How to avoid:** Add `redirects` to `next.config.ts` BEFORE deploying the cleanup (D-08 decision).
**Warning signs:** Playwright e2e tests or manual navigation to `/dilekce` returns 404.

## Code Examples

### Verified patterns from official sources:

### Next.js Redirects Configuration
```typescript
// Source: Next.js docs (https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  redirects: async () => [
    {
      source: '/dilekce/:path*',
      destination: '/ayarlar',
      permanent: false,
    },
  ],
}

export default nextConfig
```

### Drizzle DROP TABLE Migration
```sql
-- Source: drizzle/0006_drop_legacy_dilekce_tables.sql
-- Safe DROP with IF EXISTS to handle cases where table may already be gone
DROP TABLE IF EXISTS "dilekce_sablonu";
DROP TABLE IF EXISTS "dilekce_odt_sablonu";
```

### pdfmake Report Route Replacement (for migrating away from jspdf)
```typescript
// Source: adapted from pdfmake docs + project patterns
// app/api/raporlar/finans/pdf/route.ts
import PdfPrinter from 'pdfmake'
import type { TDocumentDefinitions } from 'pdfmake/build/pdfmake'

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
}

const printer = new PdfPrinter(fonts)

export async function GET() {
  // ... fetch data ...
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'FİNANSAL RAPOR', fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
      { text: `Toplam Gelen: ${gelen.toLocaleString('tr-TR')} TL` },
      // ...
    ],
    defaultStyle: { font: 'Roboto' },
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks: Buffer[] = []
  pdfDoc.on('data', (chunk) => chunks.push(chunk))
  await new Promise<void>((resolve) => pdfDoc.on('end', resolve))
  pdfDoc.end()

  const pdfBuffer = Buffer.concat(chunks)
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="finansal-rapor.pdf"',
    },
  })
}
```

### AlertDialog Retirement Confirmation
```tsx
// Source: components/ui/alert-dialog.tsx (project component)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

<AlertDialog open={showModal} onOpenChange={setShowModal}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Eski Sistemleri Temizle</AlertDialogTitle>
      <AlertDialogDescription>
        Eski dilekçe ve ODT şablonları kalıcı olarak silinecek — onaylıyor musunuz?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Vazgeç</AlertDialogCancel>
      <AlertDialogAction onClick={handleRetire}>Onayla</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Server-Side File Deletion (Node.js fs)
```typescript
// Source: Node.js fs docs + project patterns
import fs from 'fs'
import path from 'path'

function deleteLegacyUploads() {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'odt-templates')
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true })
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jspdf for report PDFs | pdfmake (already in deps) | Phase 20 (proposed) | Consistent font embedding, better table support, no Unicode issues |
| Tiptap HTML editor | DOCX template upload (Phase 16) | Phase 20 | Word-native authoring surface, no in-app editor maintenance |
| ODT templates | DOCX + Python sidecar (Phase 15) | Phase 20 | Reliable PDF generation via LibreOffice headless |
| Manual route deletion | `next.config.ts` redirects | Phase 20 | Preserves bookmarks, soft landing for users |

**Deprecated/outdated:**
- `jspdf`: Replaced by `pdfmake` for report generation; removed for dilekçe system.
- `adm-zip`: Only used for ODT extraction; ODT support removed.
- `@xmldom/xmldom`: Only used for ODT XML parsing; ODT support removed.
- `@tiptap/extension-*`: Tiptap editor removed; no remaining imports.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pdfmake` can fully replace `jspdf` for the two report routes (`finans/pdf`, `portfy/pdf`) | Standard Stack | If pdfmake cannot produce equivalent simple text-based PDFs, report feature breaks. Needs validation during implementation. |
| A2 | No other code outside the identified files references `dilekceSablonu`, `dilekceOdtSablonu`, or the deleted services | Runtime State Inventory | If missed references exist, `next build` will catch them (D-10 gate). |
| A3 | The retirement flag can be stored in a new SQLite table (`app_settings`) without schema conflicts | Architecture Patterns | SQLite is flexible; adding a simple key-value table is safe. No conflicts expected. |
| A4 | `drizzle-kit migrate` is the project's standard way to apply migrations | Standard Stack | Confirmed by `package.json` scripts. If migrations are applied differently, the DROP TABLE script may not run automatically. |

## Open Questions

1. ~~**Report PDF migration priority**~~ — **RESOLVED by user decision:** Report routes (`/api/raporlar/finans/pdf` and `/api/raporlar/portfy/pdf`) will be migrated to `pdfmake` as a sub-task of Phase 20 before `jspdf` and `pdf-generator.ts` are removed.

2. **Tiptap core packages**
   - What we know: `@tiptap/extension-*` packages have zero imports.
   - What's unclear: Does `@tiptap/core` or `@tiptap/pm` get pulled in as transitive dependencies for anything else? They appear only in `package-lock.json` as deps of the extensions.
   - Recommendation: Uninstall all four extension packages; `npm uninstall` will clean up unused transitive deps from lockfile.

3. **Retirement API endpoint design**
   - What we know: The modal needs a server action to perform cleanup.
   - What's unclear: Should this be a tRPC mutation, a Next.js Route Handler (`/api/retire`), or a server action?
   - Recommendation: Use a tRPC mutation in a new `retirement.ts` router (or extend `ayarlarRouter`) for consistency with the rest of the app. It can run the DROP TABLE migration and delete files.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + runtime | ✓ | ^20 (from package.json engines implied) | — |
| npm | Package removal | ✓ | Bundled with Node.js | — |
| SQLite (better-sqlite3) | DB migrations + flag storage | ✓ | 12.8.0 | — |
| Drizzle Kit | Migration generation | ✓ | 0.31.10 | — |
| Next.js CLI | `next build` validation gate | ✓ | 16.2.3 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEMIZ-01 | No `dilekce` or `dilekce-odt` router in `_app.ts` | unit (grep) | `rg "dilekceRouter\|dilekceOdtRouter" lib/trpc/routers/_app.ts` | ❌ Wave 0 |
| TEMIZ-02 | `/dilekce` route folder does not exist | unit (fs) | `test -d app/\(dashboard\)/dilekce` (inverted) | ❌ Wave 0 |
| TEMIZ-04 | `jspdf`, `adm-zip`, `@xmldom/xmldom` not in package.json | unit (grep) | `rg "jspdf|adm-zip|@xmldom/xmldom" package.json` (inverted) | ❌ Wave 0 |
| TEMIZ-05 | Old tables do not exist in DB | integration | SQLite query `SELECT name FROM sqlite_master WHERE name IN (...)` | ❌ Wave 0 |
| TEMIZ-08 | Modal renders with correct text | unit (render) | Vitest + React Testing Library | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build` (fast gate, <30s for this project)
- **Per wave merge:** `npm test && npm run build`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/retirement/retirement-modal.test.tsx` — covers TEMIZ-08 modal rendering
- [ ] `tests/retirement/cleanup-integration.test.ts` — covers TEMIZ-05 table DROP + file deletion
- [ ] `tests/retirement/stale-imports.test.ts` — covers TEMIZ-01/04 grep-based validation
- [ ] Framework install: already installed (`vitest` in devDependencies)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Retirement is behind existing auth (protectedProcedure) |
| V3 Session Management | no | No new session mechanism |
| V4 Access Control | yes | Retirement mutation must use `protectedProcedure` (existing pattern) |
| V5 Input Validation | yes | Retirement endpoint takes no user input for table names; use hardcoded names |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for Retirement Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized retirement trigger | Elevation of Privilege | `protectedProcedure` gate + session check |
| Path traversal during file deletion | Tampering | Hardcode `uploads/odt-templates` path; do not accept user-supplied paths |
| SQL injection in DROP TABLE | Tampering | Use hardcoded table names in migration; never interpolate user input |
| Replay / repeated retirement | Denial of Service | One-time flag prevents re-execution |

## Sources

### Primary (HIGH confidence)
- `lib/trpc/routers/_app.ts` — current router registration state
- `lib/schema.ts` — table definitions for `dilekceSablonu` and `dilekceOdtSablonu`
- `package.json` — dependency list confirming `jspdf`, `adm-zip`, `@xmldom/xmldom`, `@tiptap/extension-*`
- `app/api/raporlar/finans/pdf/route.ts` and `app/api/raporlar/portfy/pdf/route.ts` — confirmed usage of `pdf-generator.ts`
- `components/ui/alert-dialog.tsx` — project dialog component implementation
- `drizzle.config.ts` — migration configuration
- `drizzle/0004_phase16_docx_sablon.sql` — migration pattern reference

### Secondary (MEDIUM confidence)
- Next.js documentation on `redirects` in `next.config.ts` — standard pattern for route migration
- pdfmake documentation for server-side PDF generation — migration path for report routes
- Node.js `fs.rmSync` docs — safe recursive directory deletion

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json and codebase
- Architecture: HIGH — file structure, router patterns, and migration patterns confirmed empirically
- Pitfalls: HIGH — dependency conflicts discovered via explicit grep of all imports

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable stack, no fast-moving dependencies)
