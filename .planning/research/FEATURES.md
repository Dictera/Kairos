# Feature Research — v1.1 Modifications

**Domain:** Legal case management / insurance dispute tracking (Turkish law)
**Researched:** 2026-04-13
**Confidence:** HIGH for client fields; MEDIUM for driver info (based on schema analysis + domain knowledge)

## Context

This is a **modification phase** — not building from scratch. The system already has:
- Full client (müvekkil) CRUD with Turkish search
- Case (dosya) CRUD with 6-tab detail shell
- Party (taraf) fields already exist

**Changes being made:**
1. Remove email field from client (müvekkil) forms
2. Add driver info to case party section (Ad, Soyad, Plaka, Telefon, Poliçe No)

---

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken.

### Client (Müvekkil) Fields

| Feature | Why Expected | Current Status | Complexity | Notes |
|---------|--------------|---------------|------------|-------|
| Client name (ad/soyad) | Legal identification required | EXISTS | LOW | First + last name separate fields |
| Client phone (telefon) | Primary contact for solo lawyer | EXISTS | LOW | Already primary contact method |
| Client TC/Vergi No | Tax/legal ID in Turkish context | EXISTS | LOW | Essential for court filings |
| Client address (adres) | For correspondence | EXISTS | LOW | Physical address field |
| Client notes (notlar) | Special circumstances | EXISTS | LOW | Free text |
| **Client email** | **"Standard contact"** | **EXISTS** | **LOW** | **REMOVING — see rationale below** |

### Case Party (Taraf) Fields — Current

| Feature | Why Expected | Current Status | Complexity | Notes |
|---------|--------------|---------------|------------|-------|
| Counter-party name (karsitaraf_ad) | Identifies opposing party | EXISTS | LOW | Insurance company or individual |
| Counter-party lawyer (karsitaraf_vekil) | Opposing counsel | EXISTS | LOW | Optional |
| Counter-party insurance (sigorta_sirketi_id) | Links to insurance company | EXISTS | LOW | FK to sigorta_sirketi |
| Policy number (police_no) | Insurance contract reference | EXISTS | LOW | Policy from opposing insurer |
| Client plate (muvekkil_plaka) | On dosya — client's vehicle | EXISTS | LOW | Plaka for client's car |
| Counter-party plate (karsitaraf_plaka) | Opposing vehicle | EXISTS | LOW | In taraf table |

---

## New Fields Being Added (v1.1)

### Driver Info — To Be Added to Taraf

| Field | Turkish Label | Purpose | Complexity | Implementation |
|-------|--------------|---------|------------|----------------|
| Driver name | Sürücü Adı | Other driver's first name | LOW | Add `surucu_ad` TEXT to taraf |
| Driver surname | Sürücü Soyadı | Other driver's last name | LOW | Add `surucu_soyad` TEXT to taraf |
| Driver plate | Sürücü Plaka | Other vehicle plate | LOW | Add `surucu_plaka` TEXT to taraf |
| Driver phone | Sürücü Telefon | Other driver's contact | LOW | Add `surucu_telefon` TEXT to taraf |
| Driver policy | Sürücü Poliçe | Other driver's policy number | LOW | Add `surucu_police` TEXT to taraf |

---

## Anti-Features

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|----------------|-------------|
| Email field for clients | "Standard contact info" | Solo lawyer uses phone primarily; adds schema complexity; privacy concern for local-only app | Keep telefon as primary; skip email entirely |
| Multiple user/role auth | "What if I hire?" | Over-engineering for solo use; adds auth complexity | Single .env password is sufficient |
| Cloud sync | "Access from anywhere" | Conflicts with offline-first value; adds hosting cost | Local SQLite backup |

---

## Feature Analysis: Email Removal

### Why Remove Email from Müvekkil?

1. **Solo lawyer workflow is phone-first** — Primary contact method is telefon, not email
2. **No court filing requirement** — Email is not used in legal documents
3. **Schema simplification** — Fewer fields = simpler forms, less data entry
4. **Privacy surface reduction** — Local-only app; fewer data fields = less to protect
5. **Consistent with existing behavior** — User already indicated email is unneeded by asking to remove it

### Current Müvekkil Schema (email present)

```typescript
export const muvekkil = sqliteTable('muvekkil', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ad: text('ad').notNull(),
  soyad: text('soyad').notNull(),
  telefon: text('telefon'),
  email: text('email'),           // ← REMOVING
  tc_vergi_no: text('tc_vergi_no'),
  adres: text('adres'),
  notlar: text('notlar'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
})
```

### Required Migration

```sql
ALTER TABLE muvekkil DROP COLUMN email;
```

**Risk:** Low. Email is not referenced in any court document templates (all use telefon for contact).

---

## Feature Analysis: Driver Info Addition

### Why Add Driver Info to Taraf Section?

In Turkish insurance disputes (Kasko/Trafik), the party structure involves:

1. **Sigortalı/Müvekkil** (Insured Client) — Policy holder filing the claim
2. **Karşı Taraf** (Counter-Party) — Other driver/party involved in the incident

The **driver** of the counter-party vehicle is often **different from** the counter-party insurance company. For example:
- Counter-party is "Allianz Sigorta A.Ş." (insurance company)
- Driver of the other vehicle is "Ahmet Yılmaz" (individual driver, not the insurance company)

**Current gap:** The `taraf` table has `karsitaraf_ad` which could be the insurance company OR the driver — this is ambiguous. The new `surucu_*` fields make the distinction explicit.

### Current Taraf Schema vs Proposed

```typescript
// CURRENT
export const taraf = sqliteTable('taraf', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dosya_id: integer('dosya_id').notNull().references(() => dosya.id, { onDelete: 'cascade' }),
  sigorta_sirketi_id: integer('sigorta_sirketi_id').references(() => sigortaSirketi.id),
  karsitaraf_ad: text('karsitaraf_ad'),           // Ambiguous: company name OR driver name?
  karsitaraf_vekil: text('karsitaraf_vekil'),
  police_no: text('police_no'),
  karsitaraf_plaka: text('karsitaraf_plaka'),
})

// PROPOSED — Add these fields:
surucu_ad: text('surucu_ad'),           // Driver's first name
surucu_soyad: text('surucu_soyad'),     // Driver's last name  
surucu_plaka: text('surucu_plaka'),     // Driver's vehicle plate
surucu_telefon: text('surucu_telefon'), // Driver's phone
surucu_police: text('surucu_police'),   // Driver's policy number
```

### Required Migration

```sql
ALTER TABLE taraf ADD COLUMN surucu_ad TEXT;
ALTER TABLE taraf ADD COLUMN surucu_soyad TEXT;
ALTER TABLE taraf ADD COLUMN surucu_plaka TEXT;
ALTER TABLE taraf ADD COLUMN surucu_telefon TEXT;
ALTER TABLE taraf ADD COLUMN surucu_police TEXT;
```

### Semantic Clarification Needed

| Field | Use When... |
|-------|-------------|
| `karsitaraf_ad` | Name of insurance company OR driver name (ambiguous) |
| `police_no` | Policy number of client's policy OR counter-party's? |
| `karsitaraf_plaka` | Plate of counter-party vehicle |
| `surucu_*` | **NEW** — Explicit driver-specific info |

**Recommendation:** The new `surucu_*` fields should be used for driver info. `karsitaraf_*` can remain for backward compatibility but `surucu_*` makes the intent clear.

---

## Feature Dependencies

```
Client form (remove email)
└── Form field removal only
└── DB migration: DROP COLUMN email
└── No dependent features (email not used elsewhere)

Taraf section (add driver info)
└── Add 5 new fields to taraf table
└── Form UI update in Dosya > Taraflar tab
└── tRPC input schema update
└── No blocking dependencies
```

---

## Priority Matrix

| Change | User Value | Implementation Cost | Priority |
|--------|-----------|-------------------|----------|
| Remove email from muvekkil | LOW — unneeded field | LOW — simple migration | P1 |
| Add surucu_ad/soyad | HIGH — core driver identification | LOW — simple text fields | P1 |
| Add surucu_plaka | HIGH — vehicle identification | LOW — simple text field | P1 |
| Add surucu_telefon | MEDIUM — driver contact | LOW — simple text field | P2 |
| Add surucu_police | MEDIUM — insurance reference | LOW — simple text field | P2 |

---

## Integration Points

| Component | Files to Modify |
|-----------|----------------|
| Schema | `lib/schema.ts` — add surucu_* columns to taraf, remove email from muvekkil |
| tRPC Router | Input validation schemas for taraf create/update |
| UI Forms | `muvekkil/form.tsx` — remove email field; `dosya/taraf/form.tsx` — add surucu_* fields |
| DB Migration | New migration file for column changes |

---

## Competitor Feature Analysis

| Feature | Clio (US legal) | j-lawyer.org (EU) | Our Approach |
|---------|-----------------|-------------------|--------------|
| Client email | Usually required | Common field | **Removed** — solo lawyer doesn't need it |
| Client phone | Common | Common | **Kept** — primary contact |
| Driver/contact info | Separate contact type | Party contact | **In taraf section** — per PROJECT.md |

---

## Sources

- Existing schema analysis: `lib/schema.ts` — current muvekkil and taraf tables
- PROJECT.md v1.1 requirements: remove email, add driver info
- Clio practice management: https://www.clio.com/features/case-management/
- j-lawyer.org open source: https://github.com/jlawyerorg/j-lawyer-org
- Legal case management principles: https://en.wikipedia.org/wiki/Legal_case_management

---

*Feature research for: Sigorta Uyuşmazlık Takip v1.1*
*Focused on: Email removal from client forms, driver info addition to party section*
*Researched: 2026-04-13*
