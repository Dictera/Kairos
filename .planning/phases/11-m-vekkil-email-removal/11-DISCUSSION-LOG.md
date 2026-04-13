# Phase 11: Müvekkil Email Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 11-m-vekkil-email-removal
**Areas discussed:** Drizzle metadata cleanup, Test update scope, Verification approach

---

## Drizzle metadata cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerate via drizzle-kit | Run drizzle-kit generate to regenerate snapshots and journal from current schema | ✓ |
| Manually patch journal + snapshots | Add missing entries by hand — error-prone | |
| Drop and regenerate all migrations | Nuclear option — loses migration history | |

**User's choice:** Regenerate via drizzle-kit (Recommended)

**Follow-up:** Keep existing migrations as-is?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing migrations as-is | Only regenerate snapshots/journal to match 7 SQL files | ✓ |
| Consolidate into fewer migrations | Merge small migrations — loses granularity | |

**User's choice:** Keep existing migrations as-is (Recommended)

---

## Test update scope

| Option | Description | Selected |
|--------|-------------|----------|
| Real column-verification test | Replace it.todo with a real test asserting muvekkil columns (no email) | ✓ |
| Just remove email from the it.todo | Quick fix — still a todo, not enforced | |
| Remove the it.todo entirely | Delete the stale test line | |

**User's choice:** Real column-verification test (Recommended)

---

## Verification approach

| Option | Description | Selected |
|--------|-------------|----------|
| Automated tests + manual review | Write real tests for all 4 criteria plus manual visual check | ✓ |
| Automated tests only | Tests covering all 4 criteria — if they pass, done | |
| Manual review only | No new tests — just verify by reading code and running app | |

**User's choice:** Automated tests + manual review (Recommended)

---

## the agent's Discretion

- Exact test implementation details
- Whether to add more granular tests beyond column-verification test
- How to handle drizzle-kit regeneration if it produces unexpected output

## Deferred Ideas

None — discussion stayed within phase scope.