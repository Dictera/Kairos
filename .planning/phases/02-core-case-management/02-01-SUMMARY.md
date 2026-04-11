---
phase: "02"
plan: "02-01"
name: "Schema + tRPC Foundation"
subsystem: "data-layer"
status: complete
completed_date: "2026-04-12"
duration_minutes: 7
tasks_completed: 4
files_created: 9
files_modified: 3

tags:
  - drizzle-orm
  - trpc
  - sqlite
  - schema
  - vitest

dependency_graph:
  requires:
    - "01-05: base layout + tRPC provider"
  provides:
    - "lib/schema.ts — all entity table definitions"
    - "lib/trpc/routers/muvekkil.ts — muvekkil CRUD"
    - "lib/trpc/routers/ayarlar.ts — settings CRUD"
    - "lib/trpc/routers/dosya.ts — dosya CRUD + taraf upsert"
    - "data/db.sqlite — migrated with 6 entity tables + 4 seed rows"
  affects:
    - "02-02: müvekkil UI (consumes muvekkillRouter)"
    - "02-03: dosya UI (consumes dosyaRouter)"
    - "02-04: ayarlar UI (consumes ayarlarRouter)"

tech_stack:
  added:
    - "vitest ^4.1.4 (test runner)"
    - "@vitest/coverage-v8 ^4.1.4 (coverage)"
  patterns:
    - "Drizzle manual migration SQL for non-TTY environments"
    - "lower_tr() SQLite scalar for Turkish-aware LIKE search"
    - "makeCrudRouter factory pattern for repetitive ayarlar entities"
    - "dosya_no uniqueness enforced at tRPC layer (not DB constraint)"

key_files:
  created:
    - path: "lib/trpc/routers/muvekkil.ts"
      description: "muvekkil CRUD + D-07 hard delete block + dosya_count in list"
    - path: "lib/trpc/routers/ayarlar.ts"
      description: "sigortaSirketi, sigortaTuru, mahkeme CRUD via factory router"
    - path: "lib/trpc/routers/dosya.ts"
      description: "dosya CRUD + archive/unarchive + upsertTaraf (DOSYA-05)"
    - path: "drizzle/0001_core_entities.sql"
      description: "Migration SQL for 6 entity tables"
    - path: "drizzle/meta/0001_snapshot.json"
      description: "Drizzle schema snapshot for future generate diffs"
    - path: "scripts/seed-sigorta-turu.ts"
      description: "One-time seed: Kasko, Trafik/ZMSS, Sağlık, Hayat"
    - path: "vitest.config.ts"
      description: "Vitest config with @/ alias and node environment"
    - path: "tests/setup.ts"
      description: "Shared test setup hooks"
    - path: "tests/02-schema.test.ts"
      description: "23 .todo() test stubs for schema + 3 routers"
  modified:
    - path: "lib/schema.ts"
      description: "Replaced schemaTest stub with 6 entity tables + relations"
    - path: "lib/db.ts"
      description: "Added lower_tr() SQLite scalar before drizzle() call"
    - path: "lib/trpc/routers/_app.ts"
      description: "Mounted muvekkil, ayarlar, dosya sub-routers"

decisions:
  - id: "D-02-01-A"
    description: "dosya_no uniqueness enforced at tRPC layer via SELECT+CONFLICT error, not DB UNIQUE constraint — avoids SQLite migration complexity while meeting the requirement"
  - id: "D-02-01-B"
    description: "lower_tr() uses unknown param type for SQLite scalar compatibility — better-sqlite3 scalar callbacks receive unknown, not string"
  - id: "D-02-01-C"
    description: "Manual migration SQL created for 0001_core_entities — drizzle-kit generate requires TTY for schema_test→removal prompt; manual SQL + journal update avoids CI blockage"
---

# Phase 02 Plan 01: Schema + tRPC Foundation Summary

**One-liner:** Drizzle schema with 6 entity tables, Turkish-aware lower_tr() SQLite scalar, and three tRPC routers (muvekkil/ayarlar/dosya) wired into the app router.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 02-01-00 | Vitest Setup + Test Stubs | 5c6e934 | vitest.config.ts, tests/setup.ts, tests/02-schema.test.ts |
| 02-01-01 | Drizzle Schema Definition | 7d212b2 | lib/schema.ts, lib/db.ts |
| 02-01-02 | Schema Migration + Seed | 9700117 | drizzle/0001_core_entities.sql, data/db.sqlite, scripts/seed-sigorta-turu.ts |
| 02-01-03 | tRPC Routers muvekkil + ayarlar | f38ed10 | lib/trpc/routers/muvekkil.ts, ayarlar.ts, dosya.ts (stub), _app.ts |
| 02-01-04 | tRPC Router dosya | 8a23b97 | lib/trpc/routers/dosya.ts |

## What Was Built

### Schema (`lib/schema.ts`)
Six entity tables with Drizzle ORM:
- **muvekkil** — client: ad, soyad, telefon, email, tc_vergi_no, adres, notlar, timestamps
- **dosya** — case file: FK→muvekkil, dosya_no, tur (STK/AT/AH), sigorta_turu_id, karsitaraf_sigorta_id, talep_tutari, muvekkil_plaka (D-12), durum, aciklama, timestamps; indexes on muvekkil_id, durum, tur
- **taraf** — counter-party: FK→dosya (onDelete cascade), sigorta_sirketi_id, karsitaraf_ad, karsitaraf_vekil, police_no, karsitaraf_plaka (D-12)
- **sigorta_sirketi** — insurance company lookup: id, ad
- **sigorta_turu** — insurance type lookup: id, ad (seeded with 4 values)
- **mahkeme** — court lookup: id, ad, sehir

Full Drizzle relations for relational query API (`db.query.x.findFirst({ with: ... })`).

### lower_tr() SQLite Scalar (`lib/db.ts`)
Registered before `drizzle()` call. Normalizes Turkish characters (ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i, İ→i) for case-insensitive LIKE search. Used in all list queries: `lower_tr(col) LIKE lower_tr('%search%')`.

### tRPC Routers
- **muvekkillRouter**: list (paginated, Turkish search, dosya_count), getById (with dosyalar), create, update, delete (D-07: hard block if dosyalar exist)
- **ayarlarRouter**: sigortaSirketi CRUD, sigortaTuru CRUD, mahkeme CRUD (extra sehir field)
- **dosyaRouter**: list (joins muvekkil+sigortaTuru+sigortaSirketi, police_no from taraf, filters: tur/durum/tarih), getById (full relations), create (dosya_no uniqueness), update (uniqueness excluding self), archive, unarchive, delete, upsertTaraf

All procedures use `protectedProcedure` — zero public CRUD endpoints.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit generate requires TTY**

- **Found during:** Task 02-01-02
- **Issue:** `drizzle-kit generate` prompts interactively when detecting a removed table (`schema_test` removed from schema.ts). Non-TTY CI environment causes immediate crash.
- **Fix:** Wrote `drizzle/0001_core_entities.sql` manually with correct CREATE TABLE + FK + INDEX statements; updated `_journal.json` to add idx=1 entry; created `0001_snapshot.json` with full schema state. Applied via `drizzle-kit migrate` which does not require TTY.
- **Files modified:** `drizzle/0001_core_entities.sql`, `drizzle/meta/_journal.json`, `drizzle/meta/0001_snapshot.json`
- **Commit:** 9700117

**2. [Rule 2 - Missing functionality] lower_tr() scalar param type**

- **Found during:** Task 02-01-01
- **Issue:** Plan showed `(s: string)` for the scalar callback, but better-sqlite3 scalar functions receive `unknown`. TypeScript strict mode would reject direct `.toLowerCase()` on `unknown`.
- **Fix:** Changed param type to `unknown` with `String(s ?? '')` coercion before operations.
- **Files modified:** `lib/db.ts`
- **Commit:** 7d212b2

## Known Stubs

None — all routers are fully implemented. `tests/02-schema.test.ts` contains 23 `.todo()` stubs intentionally — these are test placeholders per the plan's Wave 0 design; actual implementations belong in a future testing plan.

## Threat Surface Scan

No new network endpoints or auth paths introduced beyond what the threat model covers. All mutations go through `protectedProcedure`. The `lower_tr()` scalar uses parameterized binding (no string concatenation in SQL). `pageSize` is capped at 100 via Zod.

## Self-Check: PASSED

All 11 key files confirmed present. All 5 task commits confirmed in git log.
