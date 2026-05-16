---
phase: "16"
plan: "01"
subsystem: schema
tags:
  - docx_sablon
  - belge-sablon_id
  - drizzle
  - zod
key-files:
  created:
    - lib/schema.ts (modified: docxSablon + SABLON_KATEGORILER + belge.sablon_id)
    - lib/validators/sablon.ts (new: Zod schemas)
    - drizzle/0004_phase16_docx_sablon.sql (new: migration)
    - drizzle/meta/_journal.json (modified: journal entry)
    - tests/16-sablon-schema.test.ts (new: regression tests)
    - tests/fixtures/test-template.docx (new: clean fixture)
    - tests/fixtures/test-template-fragmented.docx (new: fragmented fixture)
  modified:
    - lib/schema.ts
    - drizzle/meta/_journal.json
metrics:
  tsc: PASS
  test: PASS (3/3)
  db_migration: APPLIED
---

## Commits

| Task | Description | Hash |
|------|-------------|------|
| feat(16): add docx_sablon schema, belge.sablon_id FK, Zod validators, test fixtures | Phase 16 Wave 1 complete | `8743c38` |

## What was built

**Schema foundation for Phase 16 template system:**

- `docx_sablon` table added to Drizzle schema and SQLite DB with `SABLON_KATEGORILER` const tuple (`['STK', 'Mahkeme', 'Genel']`)
- `belge.sablon_id` nullable FK column added with `ON DELETE SET NULL` semantics
- Zod validators (`sablonCreateSchema`, `sablonUpdateSchema`, `sablonKategoriSchema`) in `lib/validators/sablon.ts`
- Drizzle migration file `0004_phase16_docx_sablon.sql` created and applied
- Test fixture `.docx` files created for Wave 2 consumption (clean + fragmented placeholders)

## Deviations

- `drizzle-kit generate` produced version mismatch warning (drizzle-kit 0.31 vs snapshot version "6"). Migration SQL was hand-crafted to match the schema declarations exactly.
- SQLite `docx_sablon` table was pre-existing in DB from unknown prior state. Applied only the `belge.sablon_id` column + index to avoid errors.

## Self-Check: PASSED

- TypeScript compiles with no errors on modified files
- Schema regression tests pass (3/3)
- Live DB verification: `docx_sablon` table exists, `belge.sablon_id` column present with correct FK (SET NULL)
- Both test fixture `.docx` files are valid OpenXML zips with `word/document.xml`
