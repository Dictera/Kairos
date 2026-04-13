# Pitfalls Research — v1.1: Form Field Modifications

**Domain:** Modifying production legal/insurance case management system — removing email field from müvekkil, adding driver info to taraf (case party) section, tab restructuring, UI/UX improvements
**Researched:** 2026-04-13
**Confidence:** MEDIUM

> Note: Research draws from general database migration patterns, React form state management best practices, and legal software UX principles. No external sources directly address this specific Turkish legal case management context. Findings are based on established software engineering patterns applied to this domain.

---

## Critical Pitfalls

### Pitfall 1: Production Data Loss During Column Removal

**What goes wrong:**
Dropping the `email` column from `muvekkil` table without proper migration causes permanent data loss. Existing email data is permanently deleted from production.

**Why it happens:**
Developers focus on the "remove field" task as a simple schema change. They forget that `DROP COLUMN` in SQLite permanently deletes data. With 200+ active files, even if only some `muvekkil` records have email data, that data is lost forever.

**How to avoid:**
1. **Backup before migration** — Create a backup of `./data/db.sqlite` before any schema change
2. **Two-phase removal** — First mark column as deprecated (application stops writing), wait, then drop in a separate migration
3. **Data retention option** — Consider keeping the column but hiding from UI (soft remove)

```bash
# Backup before any migration
cp ./data/db.sqlite ./data/db.sqlite.backup-$(date +%Y%m%d%H%M%S)
```

**Warning signs:**
- No backup exists before running migration
- Migration script runs directly on production database
- No test migration run on copy of production data first

**Phase to address:** Schema migration phase — must be first action before any code changes

---

### Pitfall 2: Form Validation Schema Mismatch After Email Removal

**What goes wrong:**
Removing `email` from the Zod schema but forgetting to remove it from:
- `defaultValues` initialization in `muvekkil-form.tsx`
- The form component's data mapping in edit mode
- The tRPC mutation input type

This causes TypeScript errors or runtime crashes when editing existing `muvekkil` records.

**Why it happens:**
React Hook Form with Zod creates tight coupling between schema and form. When you remove a field from Zod but the component still references it, the form state management breaks. The edit mode data mapping at line 248-257 still tries to read `data.email` which doesn't exist after removal.

**How to avoid:**
Remove the field systematically in this order:
1. Remove from Zod schema (`formSchema`) — line 27
2. Remove from `defaultValues` initialization — line 52
3. Remove from `MuvekkilFormInner` component's form fields — lines 147-159
4. Remove from edit mode `defaultValues` mapping — line 253
5. Update tRPC router to exclude email from create/update inputs

```typescript
// muvekkil-form.tsx — CORRECT removal order

// 1. Zod schema — remove email
const formSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur'),
  soyad: z.string().min(1, 'Soyad zorunludur'),
  telefon: z.string().max(20).optional().or(z.literal('')),
  // email REMOVED
  tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
  adres: z.string().max(500).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

// 2. defaultValues — remove email
const form = useForm<FormValues>({
  defaultValues: {
    ad: '',
    soyad: '',
    telefon: '',
    // email REMOVED
    tc_vergi_no: '',
    adres: '',
    notlar: '',
    ...defaultValues,
  },
})

// 3. Edit mode mapping — remove email
const defaultValues = props.mode === 'edit' && data
  ? {
      ad: data.ad,
      soyad: data.soyad,
      telefon: data.telefon ?? '',
      // email REMOVED
      tc_vergi_no: data.tc_vergi_no ?? '',
      adres: data.adres ?? '',
      notlar: data.notlar ?? '',
    }
  : props.defaultValues
```

**Warning signs:**
- TypeScript error: "Property 'email' does not exist on type..."
- Runtime error when loading edit form: "Cannot read properties of undefined (reading 'email')"
- Form submission works but tRPC rejects with validation error

**Phase to address:** Form component development phase

---

### Pitfall 3: Missing Database Migration for New Driver Fields

**What goes wrong:**
Adding new columns (`surucu_ad`, `surucu_soyad`, `surucu_plaka`, `surucu_telefon`, `surucu_police_no`) to `taraf` table without running migration. Application compiles but crashes on first save attempt because the columns don't exist in the database.

**Why it happens:**
Next.js dev server doesn't automatically sync Drizzle schema to SQLite. With `drizzle-kit push` or migrations, the schema change must be explicitly applied. Developers assume TypeScript types are enough.

**How to avoid:**
1. Use `drizzle-kit generate` to create migration file
2. Run migration with `drizzle-kit migrate` OR use `drizzle-kit push` for direct sync
3. Verify migration completed before testing the form

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration  
npx drizzle-kit migrate

# OR push directly (faster for development, but use with caution on production)
npx drizzle-kit push
```

**Warning signs:**
- SQLite error: "no such column: surucu_ad"
- Form saves but data doesn't persist
- Query returns undefined for new fields

**Phase to address:** Database migration phase — must run before form testing

---

### Pitfall 4: tRPC Router Type Drift After Schema Change

**What goes wrong:**
After removing `email` from `muvekkil` table and form, the tRPC router's input type still expects `email`. Edit operations fail with type errors or silent data loss because the mutation receives extra fields it doesn't expect.

**Why it happens:**
tRPC uses Zod for input validation at the router level. If the router's input schema includes `email` but the form no longer sends it, behavior depends on whether `email` is optional in the router. If required, validation fails. If optional, old cached queries may still try to send it.

**How to avoid:**
1. Update tRPC router input schema to match the new form schema
2. Clear React Query cache after deployment (or let TTL handle it)
3. Check all mutation inputs that reference `muvekkil`

```typescript
// Router should match form schema — email removed
const createMuvekkil = muvekkilRouter.createMutation.input(z.object({
  ad: z.string().min(1),
  soyad: z.string().min(1),
  telefon: z.string().optional(),
  // email REMOVED
  tc_vergi_no: z.string().optional(),
  adres: z.string().optional(),
  notlar: z.string().optional(),
})).mutation(...)
```

**Warning signs:**
- tRPC validation errors on form submit
- TypeScript error about excess properties
- Data appears to save but `email` column becomes NULL in existing records

**Phase to address:** tRPC router update phase — should coincide with form schema changes

---

### Pitfall 5: Tab State Reset on Restructure

**What goes wrong:**
When reorganizing tabs in the case detail page (6-tab shell), users lose their place. If the user is on "Taraflar" tab (index 2) and the restructure changes tab order, Next.js React key-based routing may cause the wrong tab content to display, or state may be lost.

**Why it happens:**
React uses component identity to preserve state. If tab components aren't given stable keys, rearranging tab order can cause React to unmount the wrong component or lose form input state.

**How to avoid:**
1. Use stable `key` props on tab content components based on tab identifier, not index
2. Test with active form inputs — fill a field, switch tabs, verify data persists
3. Don't reorder existing tabs — add new content at the end or in a new tab

```tsx
// WRONG: Key based on array index
{tabs.map((tab, index) => (
  <TabContent key={index} ... />
))}

// CORRECT: Key based on stable identifier
{tabs.map((tab) => (
  <TabContent key={tab.id} ... />
))}

// BEST: Key based on actual tab content type
<TabContent key="taraflar" tabId="taraflar" ... />
```

**Warning signs:**
- Form data disappears after switching tabs
- Active tab indicator shows wrong tab after navigation
- Scrolling position resets unexpectedly

**Phase to address:** Tab restructuring phase — verify with form state preservation test

---

### Pitfall 6: Drizzle `push` Destructive Schema Sync on Production Data

**What goes wrong:**
Using `drizzle-kit push` after removing the email column — this directly modifies the SQLite schema without migration files. If the column was already removed from the TypeScript schema but the DB still has it, `push` may drop other columns it considers "extra" based on the current schema state.

**Why it happens:**
`drizzle-kit push` is designed for prototyping. It reconciles schema differences by forcing the DB to match the TypeScript schema. On a database with real data, this can cause unexpected column removal.

**Prevention:**
- Use `drizzle-kit generate` + `drizzle-kit migrate` instead of `push` for all schema changes on production data
- If using `push` in development, always backup first

```bash
# Backup before any push
cp ./data/db.sqlite ./data/db.sqlite.backup-$(date +%Y%m%d%H%M%S)

# Generate migration (creates SQL file you can review)
npx drizzle-kit generate

# Apply migration (safer — creates migration history)
npx drizzle-kit migrate
```

**Warning signs:**
- Columns missing after `push` that were in the schema
- SQLite error about missing columns when the app queries
- Data in unexpected state after schema sync

**Phase to address:** All schema change phases

---

## Moderate Pitfalls

### Pitfall 7: Edit Mode Fetching Old Schema Data

**What goes wrong:**
After removing `email` from the database, editing an existing `muvekkil` record still tries to fetch `email` from the query. The query or the data mapping breaks because the column no longer exists.

**Why it happens:**
React Query caches the old query result. The tRPC query for `muvekkil.getById` still selects `email` but the column doesn't exist.

**How to avoid:**
1. Update the tRPC query to not select `email`
2. Clear React Query cache after migration:
   ```ts
   queryClient.invalidateQueries({ queryKey: ['muvekkil'] })
   ```
3. Verify the query works after schema change by testing edit mode

**Warning signs:**
- SQLite error on query: "no such column: email"
- Edit form crashes when loading existing record

**Phase to address:** After migration, before testing edit mode

---

### Pitfall 8: Form State Not Reset on Field Removal

**What goes wrong:**
Removing the email field from the form but the form's internal state still has `email` in its values. On submit, the old `email` value is sent, causing tRPC validation failures or unexpected behavior.

**Why it happens:**
React Hook Form accumulates all values in the `formState.values` object. Removing the field from the JSX doesn't remove it from the internal state if the field was previously touched.

**How to avoid:**
After removing a field, verify `formState.values` doesn't contain the old field. Use browser DevTools to check the form state, or add a console log temporarily.

```typescript
// Verify form values don't include removed field
console.log('Form values:', form.getValues())
// Should NOT contain 'email' after removal
```

**Warning signs:**
- tRPC error: "Unexpected field 'email' in mutation input"
- Form seems to work but old email value persists in state

**Phase to address:** Form component development phase

---

### Pitfall 9: Missing Turkish Validation for New Driver Fields

**What goes wrong:**
Adding new fields (driver name, plate, phone, policy number) without proper Turkish validation. Turkish license plates have specific format, phone numbers vary, and the app stores invalid data.

**Why it happens:**
Generic string validation doesn't account for Turkish-specific formats:
- Turkish license plates: XX XXX XX format (old) or XX-XXXX-XX format (new)
- Phone numbers: 05XX XXX XX XX format for mobile
- Policy numbers: insurance-specific formats

**How to avoid:**
Add appropriate validation in Zod schema:

```typescript
// Example: Turkish phone validation
const turkishPhoneRegex = /^(05[0-9]{9}|0[0-9]{10})$/

// Example: Turkish license plate (new format)
const turkishPlateRegex = /^[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{2,3}$/

const formSchema = z.object({
  // ... existing fields
  surucu_telefon: z.string()
    .regex(turkishPhoneRegex, 'Geçersiz telefon formatı')
    .optional()
    .or(z.literal('')),
  surucu_plaka: z.string()
    .regex(turkishPlateRegex, 'Geçersiz plaka formatı')
    .optional()
    .or(z.literal('')),
})
```

**Warning signs:**
- Invalid plate/phone data in database
- User confusion about expected format

**Phase to address:** Form validation phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip migration, only update TypeScript types | Faster development | Runtime crashes, data loss | Never in production |
| Remove field from UI but keep DB column | Avoids migration complexity | Schema drift, confusion | Only as intermediate step during phased removal |
| Hard-code tab order changes | No refactoring needed | Breaks user muscle memory | Never — use stable keys |
| Don't clear React Query cache after schema change | Preserves cached data | Shows stale data with new structure | Only if cache TTL is short |
| Use `drizzle-kit push` instead of migrations | Faster sync | Potential data loss | Only in initial dev, never on production data |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React Hook Form | Removing field from schema but not `defaultValues` | Systematic removal: schema → defaultValues → JSX → tRPC |
| tRPC + Zod | Router input doesn't match client schema | Use shared schema file imported by both |
| Drizzle ORM | Forgetting to run `drizzle-kit push` after schema edit | Add migration verification to pre-commit |
| SQLite | `DROP COLUMN` doesn't reclaim space immediately | Space reclamation happens on `VACUUM` |
| React Query | Cached data has old schema after deployment | Clear cache on app load or accept TTL |
| Form state | Field removed from UI but still in internal state | Verify `form.getValues()` after removal |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Large SQLite table with dropped column | Query performance degrades, file size unchanged | Run `VACUUM` after column removal | At 1000+ records |
| Form re-renders on every keystroke | Typing lag, high CPU | Use `useForm` with controlled inputs properly | Forms with 10+ fields |
| React Query cache with stale types | Old data shown after schema change | Clear cache or short TTL | After any schema migration |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Keeping email field but hiding from UI | Data still accessible via API | Actually remove from schema and migration |
| Not validating new driver info fields | Invalid plate/phone data enters system | Zod validation with appropriate Turkish patterns |
| Old form data in React Query cache | Sensitive data leakage | Clear cache on logout and after migrations |

---

## UX Pitfalls

### Form Field Removal (Email)

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Removing email field without notice | Users who relied on it feel their workflow is broken | Show migration notice, export email data first if needed |
| Field removed but space remains | Visual inconsistency, confusion | Rearrange remaining fields to fill space |
| Edit mode crashes on old records | Users can't edit existing clients | Handle missing email field gracefully in edit mode |

### Tab Restructuring

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Tab order changes | Muscle memory broken | Keep existing order, add new tabs at end |
| Content reflow on restructure | Loses place in document | Anchor scroll position, preserve tab state |
| Adding fields mid-form | User has to scroll past new required field | Add new fields at end of form section |

### Driver Info Addition

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Too many fields at once | Overwhelming | Group related fields visually, use fieldset/accordion |
| Missing field labels in Turkish | Can't complete form | Turkish labels with placeholder showing expected format |
| No examples for plate/phone format | Incorrect data entry | Placeholder text showing expected format (e.g., "06 ABC 06") |
| All fields required by default | User frustration | Make optional unless legally required |

---

## "Looks Done But Isn't" Checklist

- [ ] **Database backup exists** — `cp ./data/db.sqlite ./data/db.sqlite.backup-$(date +%Y%m%d)` — verify backup file exists and has content
- [ ] **Database migration applied** — Schema change applied to `./data/db.sqlite` — verify with `sqlite3 ./data/db.sqlite ".schema muvekkil"`
- [ ] **Form compilation** — `npm run build` succeeds without email field references — verify TypeScript strict mode passes
- [ ] **tRPC router updated** — Create/update mutations accept new schema without email — verify with type-check
- [ ] **React Query cache cleared** — Old muvekkil data cleared or refreshed — verify edit mode loads fresh data
- [ ] **Default values** — New muvekkil form has no email field — verify in UI
- [ ] **Edit mode** — Existing muvekkil records load without email field errors — verify in UI with existing record
- [ ] **Tab state** — Switching tabs preserves form input state — verify by typing, switching tabs, returning
- [ ] **Driver fields** — New taraf fields (surucu_ad, surucu_soyad, surucu_plaka, surucu_telefon, surucu_police_no) save to database and retrieve correctly — verify CRUD cycle
- [ ] **Turkish validation** — New driver fields have appropriate Turkish format validation (phone, plate)
- [ ] **Vacuum run** — `VACUUM` executed after column removal to reclaim disk space

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Accidental data loss | HIGH | Restore from backup: `cp ./data/db.sqlite.backup-YYYYMMDDHHMMSS ./data/db.sqlite` |
| Form crashes on edit | LOW | Fix form mapping, hot reload fixes immediately |
| Missing migration | LOW | Run `drizzle-kit push` to sync schema |
| Tab state loss | MEDIUM | Implement stable keys, user must re-fill lost data |
| tRPC type mismatch | LOW | Update router schema, redeploy |
| Email data needed after removal | HIGH | Restore from backup only — no other way |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Data loss during removal | Pre-migration backup | Verify backup exists before any code changes |
| Form validation mismatch | Form component development | TypeScript strict mode, test edit mode |
| Missing DB migration | Database migration | Run `drizzle-kit migrate`, verify with query |
| Tab state reset | Tab restructuring | Test form preservation across tab switches |
| tRPC type drift | tRPC router update | Build verification, test mutations |
| Drizzle push destructive | Migration discipline | Use `generate` + `migrate`, not `push` on production |
| Missing Turkish validation | Form validation phase | Add Zod patterns for phone/plate formats |

---

## Sources

- PostgreSQL ALTER TABLE documentation (DROP COLUMN behavior) — https://www.postgresql.org/docs/current/sql-altertable.html
- Drizzle ORM migrations documentation — https://orm.drizzle.team/docs/migrations
- React Hook Form advanced usage patterns — https://react-hook-form.com/advanced-usage
- React Managing State best practices — https://react.dev/learn/managing-state
- SQLite VACUUM documentation — implicit in DROP COLUMN behavior

---

*Pitfalls research for: Sigorta Uyuşmazlık Takip v1.1 — form field removal and addition milestone*
*Researched: 2026-04-13*
