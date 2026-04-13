# Phase 10: Schema & Migration Foundation - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema changes to support new driver fields in `taraf` table and prepare for müvekkil email removal. Adds 5 new columns, Turkish phone validation, and drops the email column. UI forms and display are Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Phone validation
- **D-01:** Turkish phone validation uses `05XXXXXXXXX` format (digits only, no spaces)
- Zod regex: `/^05[0-9]{9}$/`
- Error message: "Geçersiz telefon formatı (05XXXXXXXXX gerekli)"

### Plate validation
- **D-02:** No plate validation in schema/trRPC — user validates manually

### Field nullability
- **D-03:** All 5 new driver fields are nullable (`CAN BE NULL`)
- Fields: surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no
- tRPC schema uses `.nullable().optional()` for all

### Email backup
- **D-04:** No backup needed — skip email data backup before dropping column
- User confirmed emails are not used anywhere in the system

### Migration approach
- **D-05:** Drizzle migration generated via `drizzle-kit generate`
- Migration file naming: `0005_add_taraf_driver_fields.sql`
- Email column drop: separate migration after driver fields confirmed working

### the agent's Discretion
- Exact migration SQL structure
- Column order in schema
- Index strategy for new fields

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `lib/schema.ts` — Existing taraf table schema, taraf relations, validation patterns
- `lib/trpc/routers/dosya.ts` — Existing tarafSchema zod pattern, upsertTaraf mutation
- `drizzle.config.ts` — Drizzle configuration, migration out directory
- `drizzle/*.sql` — Existing migration patterns

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `lib/schema.ts` taraf table: Can extend with new columns
- `lib/trpc/routers/dosya.ts` tarafSchema: Existing Zod validation pattern to extend
- `drizzle/*.sql` migrations: Pattern to follow for new migration

### Established Patterns
- Zod validation with `.nullable().optional()` for optional fields
- Date validation via regex: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
- Drizzle migration naming: sequential numbers (0000, 0001, etc.)

### Integration Points
- `taraf` table: dosya_id FK, sigorta_sirketi_id FK
- upsertTaraf mutation in dosyaRouter
- tarafSchema extends to accept new fields

</codebase_context>

<specifics>
## Specific Ideas

- User prefers digits-only phone format — no spaces
- User will handle plate validation manually — no regex needed in schema
- Email data is not used anywhere — safe to skip backup

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-schema-migration-foundation*
*Context gathered: 2026-04-13*
