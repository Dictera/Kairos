# Security Assessment — Phase 02 (02-core-case-management)

**Phase:** 02 — Core Case Management
**ASVS Level:** 1
**Block On:** open
**Assessed Plans:** 02-01 · 02-02 · 02-03 · 02-04
**Date:** 2026-04-13

---

## Threat Verification Summary

**Total:** 22 threats | **Closed:** 22 | **Open:** 0

### Plan 02-01 — Schema + tRPC Foundation
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-02-01-01 | Injection | mitigate | `muvekkil.ts:31` — Drizzle `sql` template with `${'%' + search + '%'}` bound as parameterized arg; `dosya.ts:47` same pattern |
| T-02-01-02 | Auth | mitigate | `init.ts:28-31` — `protectedProcedure` throws `UNAUTHORIZED` if `!ctx.session.isLoggedIn`; all router procedures use `protectedProcedure` |
| T-02-01-03 | Data Exposure | mitigate | `muvekkil.ts:23` — `z.number().int().min(1).max(100)` caps `pageSize` at 100; `dosya.ts:37` same |
| T-02-01-04 | Integrity | mitigate | `schema.ts:158` — `taraf.dosya_id` FK with `onDelete: 'cascade'`; `schema.ts:168` — `durusma.dosya_id` FK with `onDelete: 'cascade'`; `db.ts:23` — `sqlite.pragma('foreign_keys = ON')` |
| T-02-01-05 | Config | mitigate | `drizzle.config.ts:6` — `out: './drizzle'`; no `push` command in `package.json` scripts |
| T-02-01-06 | Injection | mitigate | `db.ts:28-37` — `lower_tr()` scalar registered before `drizzle()` call; `muvekkil.ts:31` and `dosya.ts:47` — search pattern bound as parameterized arg via `sql` template |

### Plan 02-02 — Müvekkil UI
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-02-02-01 | Auth | mitigate | `muvekkil.ts` all 5 procedures use `protectedProcedure`; `init.ts:28-31` blocks unauthenticated callers |
| T-02-02-02 | CSRF | mitigate | tRPC mutations over same-origin Next.js `fetch`; iron-session cookie is `HttpOnly` with `SameSite` policy |
| T-02-02-03 | XSS | mitigate | `muvekkil-list.tsx`, `muvekkil-form.tsx`, `muvekkil-detail.tsx` — all data rendered via React JSX; no `dangerouslySetInnerHTML` usage |
| T-02-02-04 | Auth | accept | Single-user solo-lawyer application; all records belong to the one authenticated user. Rationale: no multi-tenancy, no cross-user data isolation required |
| T-02-02-05 | Input Validation | mitigate | `muvekkil-form.tsx:23-31` — Zod `max()` on all string fields: `ad`/`soyad` (100), `telefon` (20), `tc_vergi_no` (11), `adres` (500), `notlar` (2000); server rejects oversized input before DB write |

### Plan 02-03 — Dosya UI
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-02-03-01 | Auth | mitigate | `dosya.ts` all 8 procedures use `protectedProcedure`; `init.ts:28-31` blocks unauthenticated callers |
| T-02-03-02 | Injection | mitigate | `dosya.ts:47` — `sql` template with `lower_tr()` and bound `${'%' + search + '%'}` param; `tarih_baslangic`/`tarih_bitis` bound as params at lines 52-53 |
| T-02-03-03 | Injection | mitigate | `dosya.ts:47` — `lower_tr()` scalar applied to both column and search pattern; registered in `db.ts:28-37` before `drizzle()` call |
| T-02-03-04 | Data Exposure | mitigate | `dosya.ts:37` — `pageSize: z.number().int().min(1).max(100).default(25)`; capped at 100 |
| T-02-03-05 | Integrity | mitigate | `dosya-form.tsx:389-417` — `AlertDialog` confirmation required before archive; `dosya-detail-tabs.tsx` delete action requires `AlertDialog` confirmation |
| T-02-03-06 | Auth | mitigate | `dosya.ts:196` — `upsertTaraf` queries existing `taraf` by `dosya_id` before insert/update; `getById` validates `dosya_id` exists; single-user app, no cross-user isolation required |
| T-02-03-07 | XSS | mitigate | `genel-bilgiler-tab.tsx`, `karsitaraflar-tab.tsx`, `dosya-list.tsx` — all data rendered via React JSX; no `dangerouslySetInnerHTML` |

### Plan 02-04 — Ayarlar UI
| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-02-04-01 | Auth | mitigate | `ayarlar.ts` — all CRUD procedures (`list`, `create`, `update`, `delete` for sigortaSirketi, mahkeme, sigortaTuru) use `protectedProcedure` |
| T-02-04-02 | Integrity | mitigate | `db.ts:23` — `sqlite.pragma('foreign_keys = ON')`; `schema.ts:158` — `taraf.dosya_id` FK with `onDelete: 'cascade'`; `schema.ts:168` — `durusma.dosya_id` FK with `onDelete: 'cascade'`; delete of referenced `sigorta_sirketi` fails at DB with FK constraint error |
| T-02-04-03 | Integrity | accept | Single-user trusted environment; no need to protect seed values (Kasko, Trafik/ZMSS, Sağlık, Hayat) from deletion. Future: add `is_system` flag if needed |
| T-02-04-04 | Input Validation | mitigate | `ayarlar.ts:8` — `z.string().min(1, 'Ad zorunludur').max(200)` on all `ad` fields; `mahkemeSchema` line 41 same |
| T-02-04-05 | XSS | mitigate | `ayarlar-crud-section.tsx` — all data rendered via React JSX; no `dangerouslySetInnerHTML`; `ayarlar-page.tsx` static şifre kılavuzu section has no user-data rendering |

---

## Accepted Risks Log

| Threat ID | Rationale |
|-----------|-----------|
| T-02-02-04 | Single-user solo-lawyer application — no multi-tenancy, all records belong to the one authenticated user. No cross-user authorization checks required |
| T-02-04-03 | Single-user trusted environment — seed values (Kasko, Trafik/ZMSS, Sağlık, Hayat) may be deleted by the owner. Future enhancement: add `is_system` flag if protection needed |

---

## Threat Flags (Unregistered)

No new attack surface detected during implementation. No `## Threat Flags` sections found in any plan SUMMARY.md.

---

## Security Posture

- **SQL Injection**: Fully mitigated. All user inputs validated by Zod before use; all DB queries use Drizzle's query builder or `sql` template with bound parameters; no raw string concatenation in SQL
- **Authentication**: Fully mitigated. All tRPC procedures use `protectedProcedure` which throws `UNAUTHORIZED` if `session.isLoggedIn` is false; no public mutation endpoints exist
- **CSRF**: Mitigated. tRPC mutations use same-origin Next.js `fetch`; iron-session cookie is HttpOnly with appropriate SameSite policy
- **XSS**: Fully mitigated. All React components render data via JSX (auto-escaped); no `dangerouslySetInnerHTML` usage found in any component
- **Data Exposure**: Mitigated. `pageSize` capped at 100 via Zod schema; default pageSize is 25
- **Referential Integrity**: Mitigated. SQLite `foreign_keys = ON` pragma; cascade delete defined on `taraf.dosya_id` and `durusma.dosya_id` FKs; FK constraint enforced at DB level for `sigorta_sirketi`/`sigorta_turu` references
- **Configuration**: Mitigated. Migration output directory is `./drizzle`; no `drizzle-kit push` in package.json scripts

---

## Conclusion

**Phase 02 — SECURED**

All 22 threats have been verified. No open threats remain.
