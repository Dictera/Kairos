# Phase 10: Schema & Migration Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 10-schema-migration-foundation
**Areas discussed:** Phone validation, Plate validation, Field nullability, Email backup

---

## Phone validation

| Option | Description | Selected |
|--------|-------------|----------|
| 05XX XXX XX XX (with spaces) | Traditional format with space separators — more readable, 10 digits + spaces | |
| 05XXXXXXXXX (digits only) | Simple digit-only format — easier to store and search | ✓ |
| You decide | Standard Turkish mobile format — agent discretion for exact regex | |

**User's choice:** 05XXXXXXXXX (digits only)

---

## Plate validation

| Option | Description | Selected |
|--------|-------------|----------|
| XX XXX XX (legacy 7-char) | Old format: 2 letters + 3 digits + 2 letters — most existing plates use this | |
| 77 XXX 777 (new 8-char) | New format introduced 2022: 2 digits + 3 letters + 3 digits | |
| Both formats | Support both legacy and new plate formats — more future-proof | |

**User's choice:** No plate validation — user handles validation manually

---

## Field nullability

| Option | Description | Selected |
|--------|-------------|----------|
| Nullable (can be empty) | Database column allows NULL — form can submit with empty fields | ✓ |
| Optional (omit from insert) | Field not sent if empty — uses DB default of NULL anyway in SQLite | |

**User's choice:** Nullable (can be empty)

---

## Email backup

| Option | Description | Selected |
|--------|-------------|----------|
| Export to JSON file | Create JSON backup file before migration — simple, human-readable | |
| Keep in separate table | Archive table for email data — keeps history in database | |
| Skip backup (data not needed) | No backup needed — user confirmed emails are not used anywhere | ✓ |

**User's choice:** Skip backup — emails not needed

---

## the agent's Discretion

- Exact migration SQL structure
- Column order in schema
- Index strategy for new fields
