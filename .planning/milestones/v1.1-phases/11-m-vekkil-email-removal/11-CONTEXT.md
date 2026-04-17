# Phase 11: Müvekkil Email Removal - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Email field completely removed from müvekkil forms, tRPC routes, and display components. Phase 10 already performed the schema-level work (dropped email column, removed email from tRPC schemas, removed email from UI components). This phase handles remaining cleanup: fixing stale references, regenerating drizzle metadata, and adding verification tests.

</domain>

<decisions>
## Implementation Decisions

### Drizzle metadata cleanup
- **D-01:** Regenerate drizzle metadata via `drizzle-kit generate` — ensures snapshots and journal are consistent with current schema
- **D-02:** Keep existing 7 SQL migration files as-is — only regenerate snapshots and journal to match, preserving full migration history

### Test update scope
- **D-03:** Replace stale `it.todo` in `tests/02-schema.test.ts` line 4 with a real column-verification test that asserts muvekkil table has the correct columns (id, ad, soyad, telefon, tc_vergi_no, adres, notlar, created_at, updated_at) — explicitly no email column
- This provides ongoing regression protection against accidentally re-adding email

### Verification approach
- **D-04:** Verify all 4 success criteria with both automated tests and manual review
- Automated: real tests for schema, tRPC, form, and list assertions
- Manual: visual check that müvekkil pages render correctly without email

### the agent's Discretion
- Exact test implementation details (assertion library, test structure)
- Whether to add more granular tests beyond the column-verification test
- How to handle drizzle-kit regeneration if it produces unexpected output

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Müvekkil schema and email removal
- `lib/schema.ts` — Muvekkil table schema (email column already removed)
- `lib/trpc/routers/muvekkil.ts` — tRPC router (email already removed from schemas/queries)
- `drizzle/0006_drop_muvekkil_email.sql` — Migration that drops email column
- `drizzle/meta/_journal.json` — Journal missing entries for 0004-0006
- `tests/02-schema.test.ts` — Stale it.todo listing email as muvekkil column

### Phase 10 context
- `.planning/phases/10-schema-migration-foundation/10-CONTEXT.md` — Prior decisions on email backup (D-04: no backup needed) and migration approach (D-05: Drizzle migration via drizzle-kit generate)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/02-schema.test.ts`: Existing test file with it.todo entries for schema verification — can be extended with real test
- `drizzle.config.ts`: Drizzle configuration for migrations
- `lib/trpc/routers/muvekkil.ts`: Already-clean router serving as reference for verification

### Established Patterns
- Drizzle migration naming: sequential numbers (0000, 0001, etc.)
- Zod validation with `.nullable().optional()` for optional fields (from Phase 10 D-03)
- tRPC procedure patterns in muvekkil router

### Integration Points
- `drizzle/meta/` — Journal and snapshots need regeneration to reflect migrations 0004-0006
- `tests/02-schema.test.ts` line 4 — Stale reference needs replacement

</code_context>

<specifics>
## Specific Ideas

- Phase 10 already completed the core work — this is primarily a cleanup and verification phase
- The drizzle metadata inconsistency (journal has 5 entries for 7 SQL files) should be the starting point
- A real column-verification test provides regression protection for future changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-m-vekkil-email-removal*
*Context gathered: 2026-04-14*