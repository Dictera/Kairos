---
phase: 10-schema-migration-foundation
plan: "01"
subsystem: taraf-table
tags:
  - schema
  - drizzle
  - trpc
  - validation
  - driver-fields
dependency_graph:
  requires: []
  provides:
    - TARAF-06
    - TARAF-09
    - TARAF-10
  affects:
    - lib/schema.ts
    - lib/trpc/routers/dosya.ts
tech_stack:
  added:
    - Drizzle ORM column definitions
    - Zod validation with Turkish phone regex
  patterns:
    - TDD RED-GREEN workflow (test scaffolds created first, then implementation)
    - Migration-first database schema updates
key_files:
  created:
    - drizzle/0005_add_taraf_driver_fields.sql
    - tests/lib/schema.test.ts
    - tests/lib/validation.test.ts
    - tests/lib/trpc.test.ts
  modified:
    - lib/schema.ts
    - lib/trpc/routers/dosya.ts
decisions:
  - "All 5 driver columns are nullable (no .notNull()) per D-03"
  - "surucu_telefon uses /^05[0-9]{9}$/ regex per D-01"
  - "surucu_plaka has no format validation per D-02"
  - "Migration applied directly via ALTER TABLE (drizzle-kit push had TTY issues)"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-14T01:01:00Z"
---

# Phase 10 Plan 01: Add Driver Fields to Taraf Table Summary

## One-liner

Added 5 nullable driver information columns (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no) to the taraf table with Turkish phone format validation in tRPC schema.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | Create test scaffolds (RED phase) | ab7afb2 | tests/lib/schema.test.ts, tests/lib/validation.test.ts, tests/lib/trpc.test.ts |
| 1 | Add 5 driver columns to Drizzle schema | db45d05 | lib/schema.ts |
| 2 | Update tRPC tarafSchema with new fields + phone validation | d42507e | lib/trpc/routers/dosya.ts |
| 3 | Generate Drizzle migration and apply to database | 2d9a0cc | drizzle/0005_add_taraf_driver_fields.sql |

## Must-Haves Verification

- [x] taraf table has 5 new columns: surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no
- [x] tRPC tarafSchema validates surucu_telefon with /^05[0-9]{9}$/ regex
- [x] tRPC tarafSchema accepts surucu_plaka without format validation
- [x] All 5 new fields are nullable and optional in both Drizzle and Zod schemas
- [x] Drizzle migration generated and applied

## Key Implementation Details

### Drizzle Schema (lib/schema.ts)
Added nullable text columns to taraf table:
```typescript
surucu_ad: text('surucu_ad'),
surucu_soyad: text('surucu_soyad'),
surucu_plaka: text('surucu_plaka'),
surucu_telefon: text('surucu_telefon'),
surucu_police_no: text('surucu_police_no'),
```

### tRPC Schema (lib/trpc/routers/dosya.ts)
- Exported `tarafSchema` for testability
- Added 5 new fields with proper Zod validation
- surucu_telefon uses `.regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')`
- All fields use `.nullable().optional().or(z.literal(''))` pattern

### Migration (drizzle/0005_add_taraf_driver_fields.sql)
Applied via direct ALTER TABLE statements (drizzle-kit push had TTY prompt issues):
```sql
ALTER TABLE `taraf` ADD COLUMN `surucu_ad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_soyad` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_plaka` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_telefon` text;
ALTER TABLE `taraf` ADD COLUMN `surucu_police_no` text;
```

## Test Results

All 21 tests pass:
- `tests/lib/schema.test.ts` — 5 tests (column existence)
- `tests/lib/validation.test.ts` — 8 tests (Turkish phone regex)
- `tests/lib/trpc.test.ts` — 8 tests (tarafSchema validation)

## Deviations from Plan

### Auto-fixed Issues

**None** — plan executed exactly as written.

### Deviation Notes

- drizzle-kit push required workaround due to TTY prompt issues — migration applied directly via Node.js/better-sqlite3

## Threat Surface

| Flag | File | Description |
|------|------|-------------|
| None | - | No new security surface introduced |

## Commits

- `ab7afb2` test(10-01): add failing tests for driver fields and Turkish phone validation
- `db45d05` feat(10-01): add 5 driver columns to taraf table in Drizzle schema
- `d42507e` feat(10-01): update tarafSchema with 5 driver fields and Turkish phone validation
- `2d9a0cc` feat(10-01): generate Drizzle migration for 5 driver columns and apply to database

## Self-Check

- [x] All 4 tasks executed
- [x] Each task committed individually
- [x] 5 new columns present in taraf table (verified via pragma)
- [x] All 21 tests pass
- [x] TypeScript compiles without errors
- [x] SUMMARY.md created at .planning/phases/10-schema-migration-foundation/10-01-SUMMARY.md

## Self-Check: PASSED
