# STACK.md — v1.1 Incremental Changes: Form Field Modifications + UI/UX

**Project:** Sigorta Uyuşmazlık Takip
**Milestone:** v1.1 — Form field removal/addition + UI/UX improvements
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

**No new libraries needed.** The existing stack fully supports all v1.1 requirements. The changes are:

1. **Remove `email` from `muvekkil`** — Drizzle migration + schema edit + form removal
2. **Add driver info fields to `taraf`** — Drizzle migration + schema + form + tRPC mutation
3. **UI/UX improvements** — via existing Tailwind CSS v4 + shadcn/ui patterns

All form handling uses the existing react-hook-form + Zod + tRPC + Drizzle stack unchanged.

---

## Current Stack — No Changes Required

The v1.0 shipped stack already handles all v1.1 requirements:

| Technology | Current Version | Status | For v1.1 Use |
|------------|----------------|--------|---------------|
| react-hook-form | 7.72.1 | ✅ Installed | Removing/adding form fields = schema edit |
| Zod | 3.24.0 | ✅ Installed | Input validation — field removal/addition is trivial |
| @hookform/resolvers | 5.2.2 | ✅ Installed | Zod integration already working |
| Drizzle ORM | 0.45.2 | ✅ Installed | `dropColumn()` for email; `addColumns()` for driver fields |
| drizzle-kit | 0.31.10 | ✅ Installed | `generate` + `migrate` for schema changes |
| tRPC | 11.16.0 | ✅ Installed | Input schemas are Zod — minimal change |
| shadcn/ui | CLI-based | ✅ Installed | Existing components + extend as needed |
| Tailwind CSS | 4.2.2 | ✅ Installed | UI/UX improvements via utilities |

> **Note:** The PROJECT.md says "Tailwind CSS v3" but `package.json` shows `^4.2.2`. The codebase uses Tailwind v4 (CSS-first config via `@tailwindcss/postcss`). This is already working — no action needed.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any new form library | react-hook-form v7 already in use | Keep existing |
| Zod v4 (beta) | v3.24.0 is stable and compatible | Keep v3 |
| Formik | Redundant — react-hook-form already working | Keep react-hook-form |
| Prisma | Would require full rewrite | Keep Drizzle |
| Any new UI component library | shadcn/ui covers all needs | Extend existing components |
| TanStack Form | Not needed | Keep react-hook-form |

---

## Required Changes by Component

### 1. Remove Email Field from Müvekkil (Client)

**Files to modify:**

| Layer | File | Change |
|-------|------|--------|
| Schema | `lib/schema.ts` | Remove `email: text('email')` from `muvekkil` table |
| Zod schema | `components/muvekkil/muvekkil-form.tsx` | Remove `email` field from `formSchema` and `<FormField email>` JSX block |
| tRPC input | `lib/trpc/routers/muvekkil.ts` | Remove `email` from `muvekkilSchema`, `create`, `update` |
| tRPC output | `lib/trpc/routers/muvekkil.ts` `list` query | Remove `email` from select columns |

**Migration (Drizzle):**
```bash
npm run db:generate   # → generates migration with dropColumn for email
npm run db:migrate    # → applies to ./data/db.sqlite
```

**Backward compatibility:** The `email` column in the existing schema is nullable (no `.notNull()`). Existing data is preserved. Test migration on a copy of `./data/db.sqlite` first.

---

### 2. Add Driver Info to Taraf (Case Party Section)

**New fields to add to `taraf` table:**

| Field | Type | Notes |
|-------|------|-------|
| `diger_surucu_ad` | `text` | Driver first name |
| `diger_surucu_soyad` | `text` | Driver last name |
| `diger_surucu_plaka` | `text` | Driver's vehicle plate |
| `diger_surucu_telefon` | `text` | Driver phone |
| `diger_surucu_police_no` | `text` | Driver policy number |

**Files to modify:**

| Layer | File | Change |
|-------|------|--------|
| Schema | `lib/schema.ts` | Add 5 columns to `taraf` table definition |
| Zod schema | `components/dosya/karsitaraflar-tab.tsx` | Add fields to `editSchema` + form UI + InfoRow display |
| tRPC input | `lib/trpc/routers/dosya.ts` | Add fields to `tarafSchema` + `upsertTaraf` mutation |

**Migration (Drizzle):**
```bash
npm run db:generate   # → generates migration with addColumns for 5 new fields
npm run db:migrate    # → applies to ./data/db.sqlite
```

**Form integration pattern** (follow existing `karsitaraf_plaka` pattern):
```typescript
// In karsitaraflar-tab.tsx editSchema:
const editSchema = z.object({
  // ... existing fields ...
  diger_surucu_ad: z.string().max(100).optional().or(z.literal('')),
  diger_surucu_soyad: z.string().max(100).optional().or(z.literal('')),
  diger_surucu_plaka: z.string().max(10).optional().or(z.literal('')),
  diger_surucu_telefon: z.string().max(20).optional().or(z.literal('')),
  diger_surucu_police_no: z.string().max(100).optional().or(z.literal('')),
})
```

---

### 3. UI/UX Improvements

No stack changes needed. All improvements use existing:
- **Tailwind CSS v4** utility classes (spacing, typography, responsive grid)
- **shadcn/ui** components (Card, Button, Input, Form, Badge)
- **Existing component patterns** in `components/dosya/` and `components/muvekkil/`

---

## Drizzle Migration Commands

```bash
# After editing lib/schema.ts:
npm run db:generate    # Creates migration in drizzle/ folder
npm run db:migrate     # Applies migration to ./data/db.sqlite

# Development shortcut (push schema directly, no migration files):
npx drizzle-kit push

# Inspect pending migrations:
npx drizzle-kit status
```

---

## Stack Patterns for This Milestone

### Pattern: Remove a Form Field

```
1. lib/schema.ts → remove column from table definition
2. npm run db:generate → Drizzle generates dropColumn migration
3. npm run db:migrate → apply to SQLite
4. components/X/form.tsx → remove from Zod schema + JSX
5. lib/trpc/routers/X.ts → remove from input/output schemas
```

### Pattern: Add Fields to Existing Form Section

```
1. lib/schema.ts → add columns to existing table
2. npm run db:generate → Drizzle generates addColumns migration
3. npm run db:migrate → apply to SQLite
4. components/X/form.tsx → add to Zod schema + form fields + display rows
5. lib/trpc/routers/X.ts → add to mutation input schema
```

---

## Version Compatibility

| Package | Current | Compatible With | Notes |
|---------|---------|-----------------|-------|
| react-hook-form | 7.72.1 | Zod 3.x, @hookform/resolvers 5.x | ✅ All good |
| Zod | 3.24.0 | react-hook-form 7.x, tRPC 11.x | ✅ Stable |
| Drizzle ORM | 0.45.2 | better-sqlite3 12.x, drizzle-kit 0.31.x | ✅ All good |
| tRPC | 11.16.0 | Next.js 16, TanStack Query 5 | ✅ All good |
| Tailwind CSS | 4.2.2 | PostCSS, shadcn v4 | ✅ Already in use |

---

## Sources

- **Existing codebase** — confirmed working patterns in:
  - `lib/schema.ts` — Drizzle table definitions
  - `components/muvekkil/muvekkil-form.tsx` — react-hook-form + Zod form pattern
  - `components/dosya/karsitaraflar-tab.tsx` — taraf form with edit/display modes
  - `lib/trpc/routers/muvekkil.ts` — tRPC procedure with Zod input
  - `lib/trpc/routers/dosya.ts` — tRPC upsertTaraf mutation
- **package.json** — confirmed installed versions
- **Drizzle docs** — `dropColumn`, `addColumn` migration syntax

---

## Relationship to Initial STACK.md

This document is a targeted update for v1.1. The [original STACK.md](./STACK.md) (researched 2026-04-10) covers the full project stack decisions. This document addresses only what changes — or doesn't change — for the v1.1 milestone scope.

All base stack decisions (Next.js 15, SQLite/Drizzle, tRPC v11, react-hook-form, Zod, shadcn/ui, iron-session) remain unchanged.

---
*Stack research for: v1.1 form field modifications*
*Researched: 2026-04-13*
*Confidence: HIGH*
