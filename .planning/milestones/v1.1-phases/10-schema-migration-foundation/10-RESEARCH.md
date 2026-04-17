# Phase 10: Schema & Migration Foundation - Research

**Researched:** 2026-04-14
**Domain:** Drizzle ORM + SQLite migrations, Zod validation, Turkish phone format
**Confidence:** HIGH

## Summary

Phase 10 adds 5 driver fields to the `taraf` table (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no), adds Turkish phone validation to tRPC layer, and prepares for email column removal. The project uses Drizzle ORM 0.45.2 with SQLite via `better-sqlite3`, drizzle-kit 0.31.10, and Zod 3.24.0 for validation.

Key decisions already locked: Turkish phone format is `05XXXXXXXXX` (11 digits), no plate validation in schema/trRPC, all fields nullable, email drop deferred to separate migration after driver fields confirmed working.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 | Type-safe SQL schema | [VERIFIED: package.json] |
| drizzle-kit | 0.31.10 | Migration generation/apply | [VERIFIED: package.json] |
| better-sqlite3 | 12.8.0 | SQLite driver | [VERIFIED: package.json] |
| zod | 3.24.0 | Input validation | [VERIFIED: package.json] |

### No Additional Dependencies
This phase only modifies existing schema and adds Zod validation—no new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
drizzle/
├── 0000_lowly_sleepwalker.sql   # Initial schema
├── 0001_core_entities.sql        # Core tables
├── 0002_stk_mahkeme_process_tracking.sql
├── 0003_chunky_charles_xavier.sql
├── 0004_add_dilekce_sablonu.sql
└── 0005_add_taraf_driver_fields.sql  # ← NEW (Phase 10)
```

### Pattern 1: Drizzle SQLite Column Addition
**What:** Adding nullable columns via `ALTER TABLE ADD COLUMN`
**When to use:** For optional fields that don't require defaults or data migration

**Source:** [VERIFIED: drizzle-orm SQLite docs, existing migrations]

SQLite migration file structure (from existing patterns):
```sql
-- Migration: 0005_add_taraf_driver_fields.sql
-- Phase 10: Schema & Migration Foundation

ALTER TABLE `taraf` ADD COLUMN `surucu_ad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_soyad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_plaka` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_telefon` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_police_no` text;
```

### Pattern 2: tRPC Zod Schema Extension
**What:** Extending existing tarafSchema with new optional fields
**When to use:** When adding fields to existing tRPC mutations/queries

**Source:** [VERIFIED: lib/trpc/routers/dosya.ts lines 19-26]

```typescript
const tarafSchema = z.object({
  dosya_id: z.number().int(),
  sigorta_sirketi_id: z.number().int().nullable().optional(),
  karsitaraf_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  karsitaraf_vekil: z.string().max(200).nullable().optional().or(z.literal('')),
  police_no: z.string().max(100).nullable().optional().or(z.literal('')),
  karsitaraf_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  // NEW FIELDS - surucu_ prefix
  surucu_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_soyad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  surucu_telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .nullable()
    .optional()
    .or(z.literal('')),
  surucu_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
})
```

### Pattern 3: Zod Regex for Turkish Phone
**What:** Validating Turkish mobile numbers with regex
**When to use:** For Turkish phone validation

**Source:** [VERIFIED: Zod 3.24.0 API, existing validation patterns in codebase]

Pattern: `/^05[0-9]{9}$/`
- Starts with `05` (Turkish mobile prefix)
- Followed by exactly 9 digits
- Total: 11 digits

```typescript
// Standard pattern from Zod docs
z.string().regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration generation | Write SQL manually | `drizzle-kit generate` | Detects schema diff, maintains snapshots |
| Phone validation | Custom validation function | Zod `.regex()` | Built-in, composable, typed errors |
| Column addition | Direct SQL without migration | Drizzle schema + generate | Keeps schema.ts in sync |

**Key insight:** Drizzle's `drizzle-kit generate` compares schema.ts to migration snapshots and auto-generates ALTER TABLE statements for column additions.

## Common Pitfalls

### Pitfall 1: Schema/DB Drift
**What goes wrong:** Database schema and schema.ts get out of sync
**Why it happens:** Manual SQL changes without updating TypeScript schema
**How to avoid:** Always modify schema.ts first, then run `drizzle-kit generate`
**Warning signs:** Migration SQL doesn't match schema.ts types

### Pitfall 2: SQLite ALTER TABLE Limitations
**What goes wrong:** Trying to add NOT NULL columns without defaults
**Why it happens:** SQLite requires defaults for NOT NULL on existing rows
**How to avoid:** Use nullable columns (`.nullable()`) for all new taraf fields per D-03
**Warning signs:** "Cannot add NOT NULL column without default value" errors

### Pitfall 3: tRPC Schema Missing New Fields
**What goes wrong:** Database has column but tRPC rejects it
**Why it happens:** tarafSchema in dosya.ts not updated to accept new fields
**How to avoid:** Update tRPC schema BEFORE generating migration
**Warning signs:** tRPC errors about unknown fields on upsertTaraf mutation

### Pitfall 4: Migration Not Applied
**What goes wrong:** schema.ts updated but migration not run
**Why it happens:** `drizzle-kit migrate` not executed
**How to avoid:** Run `npm run db:migrate` after generation
**Warning signs:** "no such column" errors at runtime

## Code Examples

### Drizzle Schema Extension for taraf
**Source:** [VERIFIED: lib/schema.ts lines 156-164]

Current `taraf` table definition to extend:
```typescript
export const taraf = sqliteTable('taraf', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').references(() => sigortaSirketi.id),
  karsitaraf_ad: text('karsitaraf_ad'),
  karsitaraf_vekil: text('karsitaraf_vekil'),
  police_no: text('police_no'),
  karsitaraf_plaka: text('karsitaraf_plaka'),
})
```

New columns to add:
```typescript
// Add to taraf table definition
surucu_ad: text('surucu_ad'),
surucu_soyad: text('surucu_soyad'),
surucu_plaka: text('surucu_plaka'),
surucu_telefon: text('surucu_telefon'),
surucu_police_no: text('surucu_police_no'),
```

### Migration Workflow
**Source:** [VERIFIED: drizzle.config.ts, drizzle/*.sql patterns]

```bash
# 1. Update schema.ts with new columns
# 2. Generate migration
npm run db:generate

# 3. Review generated SQL (should be ALTER TABLE ADD COLUMN)
# 4. Apply migration
npm run db:migrate

# 5. Verify in SQLite
npm run db:studio
```

### Zod Optional String with Regex
**Source:** [VERIFIED: Zod 3.24.0, existing patterns in lib/trpc/routers/dosya.ts]

```typescript
// For nullable phone with Turkish format
surucu_telefon: z.string()
  .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
  .nullable()
  .optional()
  .or(z.literal(''))

// For plain nullable strings (no validation)
surucu_ad: z.string().max(200).nullable().optional().or(z.literal(''))
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SQL migrations | drizzle-kit generate | Drizzle adoption | Auto-detects schema diff |
| Prisma ORM | Drizzle ORM 0.45.2 | Project v1.0 | Lighter, SQL-first, less abstraction |
| No phone validation | Zod regex `/^05[0-9]{9}$/` | Phase 10 | Consistent Turkish format |

**Deprecated/outdated:**
- None for this phase

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Turkish phone regex `/^05[0-9]{9}$/` is correct | Zod validation | Low — user confirmed this format |
| A2 | Email column drop is safe without backup | Email handling | Low — user confirmed emails unused |
| A3 | All 5 driver fields should be nullable | Field nullability | Low — user decision explicitly documented |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Column order in schema.ts**
   - What we know: Drizzle doesn't care about column order in TypeScript
   - What's unclear: Whether any specific ordering preference exists
   - Recommendation: Follow alphabetical order for new columns (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no)

2. **Index strategy for new fields**
   - What we know: Existing taraf fields have no indexes
   - What's unclear: Whether surucu_telefon or surucu_plaka would benefit from indexes
   - Recommendation: No indexes needed — per D-02 decision, no plate validation in schema, and phone lookups not a primary query pattern

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 24.13.0 | — |
| npm | Package manager | ✓ | (bundled) | — |
| better-sqlite3 | SQLite driver | ✓ | 12.8.0 | — |
| drizzle-kit | Migrations | ✓ | 0.31.10 | — |

**Missing dependencies with no fallback:**
- None — all dependencies satisfied

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| TARAF-06 | 5 driver fields added to taraf table | unit | `vitest run tests/lib/schema.test.ts` | ❌ Wave 0 |
| TARAF-09 | Turkish phone validation works | unit | `vitest run tests/lib/validation.test.ts` | ❌ Wave 0 |
| MUVEK-06 | Email column drop migration | unit | `vitest run tests/lib/schema.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- `tests/lib/schema.test.ts` — validates new columns exist in schema
- `tests/lib/validation.test.ts` — validates Turkish phone regex
- `tests/lib/trpc.test.ts` — validates tarafSchema accepts new fields
- Framework install: Already present in package.json

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod regex for Turkish phone format |
| V4 Access Control | no | Not changing auth/permissions |

### Known Threat Patterns for SQLite + Drizzle

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via tRPC | Tampering | Parameterized queries via Drizzle ORM |
| Invalid phone format | Information | Zod `.regex()` validation |

## Sources

### Primary (HIGH confidence)
- `lib/schema.ts` — Existing taraf table definition
- `lib/trpc/routers/dosya.ts` — tarafSchema validation pattern
- `drizzle.config.ts` — Drizzle configuration
- `drizzle/*.sql` — Existing migration patterns
- `package.json` — Versions confirmed

### Secondary (MEDIUM confidence)
- [orm.drizzle.team/docs/migrations](https://orm.drizzle.team/docs/migrations) — Migration strategy overview
- [zod.dev/basics](https://zod.dev/basics) — Zod API for regex validation

### Tertiary (LOW confidence)
- None — all claims verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified in package.json
- Architecture: HIGH — patterns verified against existing codebase
- Pitfalls: HIGH — based on established SQLite/Drizzle best practices

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (30 days for stable domain)
