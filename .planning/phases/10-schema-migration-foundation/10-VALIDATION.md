---
phase: 10
slug: schema-migration-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TARAF-06 | — | N/A | unit | `npx vitest run tests/lib/schema.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | TARAF-09 | — | Zod regex validates phone | unit | `npx vitest run tests/lib/validation.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | TARAF-10 | D-02 | No schema validation for plate | unit | `npx vitest run tests/lib/trpc.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | MUVEK-06 | — | N/A | unit | `npx vitest run tests/lib/schema.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/schema.test.ts` — validates new columns exist in taraf schema and email removed from muvekkil
- [ ] `tests/lib/validation.test.ts` — validates Turkish phone regex `/^05[0-9]{9}$/`
- [ ] `tests/lib/trpc.test.ts` — validates tarafSchema accepts new fields and rejects invalid phone
- [ ] Framework already present in package.json (vitest)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration applied to dev database | TARAF-06, MUVEK-06 | Visual inspection of DB state | Run `npm run db:studio` and verify columns exist in taraf table, email column absent from muvekkil |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending