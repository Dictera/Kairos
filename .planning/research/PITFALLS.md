# Pitfalls Research — v1.2 Şablon Belgeler

**Domain:** Node.js (Next.js 15) ↔ Python sidecar ↔ LibreOffice headless pipeline on Windows 11, SQLite/Drizzle data migration, Turkish `.docx` templating
**Researched:** 2026-04-20
**Confidence:** HIGH on LibreOffice + Node↔Python subprocess + docxtpl pitfalls (well-documented ecosystem traps, confirmed by direct inspection of existing `lib/services/odt-to-pdf.ts` and `lib/trpc/routers/dilekce-odt.ts`); MEDIUM on slug+seq race specifics (depends on concurrency level — solo user low, but v1.2 adds parallel "Belgeler sekmesinde tek tuşla" generation that can be double-clicked).

All pitfalls below are specific to **adding** this pipeline to this app on **Windows 11** for a solo avukat, not generic advice. WebSearch was unavailable during research; claims are based on ecosystem-known traps and direct code inspection. Items marked `[verify via Context7]` should be re-checked against current library docs before implementation, per CLAUDE.md policy.

---

## Critical Pitfalls

### Pitfall 1: LibreOffice `soffice --headless` hangs on first invocation because user profile is locked

**What goes wrong:**
The first `soffice --headless --convert-to pdf input.docx` call on Windows spawns `soffice.bin`, which tries to open the user profile under `%APPDATA%\LibreOffice\4\user\`. If any LibreOffice UI instance (Writer, Calc) is open — even a Quickstarter in the tray — or if a previous headless call crashed, a `SingletonLock` / `.~lock.*` file remains and `soffice.bin` silently waits for that UI instance to release the profile. The Node-side `spawn()` then hangs indefinitely; no stdout, no stderr, no exit code. Users see "İhtarname Üret" spinner that never completes.

**Why it happens:**
LibreOffice uses a single shared user profile and enforces one-process-per-profile via the `SingletonLock` file. Headless mode does **not** bypass this lock — it still loads the profile. Solo avukat is likely to have LibreOffice Writer open to edit templates, then click "Üret" in the app → deadlock.

**How to avoid:**
- Pass `-env:UserInstallation=file:///C:/Users/.../AppData/Local/Temp/lo-{uuid}` (or a per-invocation temp dir) to every `soffice` call. This gives the headless process its own isolated profile and sidesteps the global lock entirely. `[verify via Context7: libreoffice cli user installation]`
- Create the temp profile dir per request; delete in `finally` block.
- Windows path: use `file:///` URL with forward slashes — `file:///C:/...`, not `C:\...`.
- Python sidecar should build this argv, not Node — keeps LibreOffice knowledge in one place.

Example Python call (conceptual — verify argv via Context7):
```python
subprocess.run([
    str(LIBREOFFICE_PATH),
    f"-env:UserInstallation=file:///{tempdir.replace(chr(92), '/')}",
    "--headless", "--nologo", "--nofirststartwizard",
    "--convert-to", "pdf:writer_pdf_Export",
    "--outdir", str(out_dir),
    str(docx_path),
], check=True, timeout=120, capture_output=True)
```

**Warning signs:**
- First PDF generation after reboot takes > 30s
- Any generation while Writer is open hangs forever
- `tasklist | findstr soffice` shows `soffice.bin` lingering after Node thinks the call failed
- `.~lock.*` file appears inside user profile

**Phase to address:** **Phase 4 — PDF Pipeline (LibreOffice)**. Must ship with per-invocation `UserInstallation` from day one; retrofitting is painful because test environments won't reproduce the lock unless Writer is intentionally opened.

---

### Pitfall 2: Calling `soffice.exe` instead of `soffice.com` on Windows — silent async behavior

**What goes wrong:**
LibreOffice on Windows ships two launchers in `C:\Program Files\LibreOffice\program\`:
- `soffice.exe` — GUI subsystem; when launched from a Node subprocess it **detaches** immediately, returns exit code 0, but the actual conversion runs asynchronously. Node sees success, tries to read the PDF, and gets `ENOENT` because conversion isn't done yet.
- `soffice.com` — console subsystem; blocks until conversion completes, streams stderr back, returns the real exit code.

Developers assume "soffice on Windows = soffice.exe" (mirroring `soffice` on Linux) and get intermittent "file not found" errors that look like race conditions.

**Why it happens:**
Windows PE subsystem flag. `.exe` is GUI subsystem → fire-and-forget when invoked from a non-console parent. `.com` is console subsystem → synchronous. Documentation usually shows `soffice` (no extension).

**How to avoid:**
- `LIBREOFFICE_PATH` env var must point to `soffice.com` on Windows, not `soffice.exe`.
- Python sidecar startup check: if `sys.platform == "win32"` and path ends in `.exe`, warn (or auto-rewrite to `.com`).
- Document in `.env.example`: `LIBREOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.com`.
- Banner uyarı in UI if `LIBREOFFICE_PATH` is missing or points to `.exe`.

**Warning signs:**
- PDF generation returns success but file doesn't appear, then appears ~50ms later
- Intermittent `ENOENT` on downstream `fs.readFile`
- Flaky tests that pass when `sleep(500)` is added

**Phase to address:** **Phase 1 — Foundation (env validation + startup banner)**. Check is cheap; debug time without it is large.

---

### Pitfall 3: Turkish characters (ş, ğ, İ) render as tofu boxes in generated PDF

**What goes wrong:**
Template uses Arial or Calibri (works in Word), but LibreOffice substitutes a fallback font that lacks Turkish glyphs for the specific weights used, producing boxes or generic glyphs. Worst case: capital İ (dotted I, U+0130) renders as regular I — document sent to court looks unprofessional.

**Why it happens:**
- LibreOffice font substitution table is independent from the Windows font cache; even if Arial is installed, LO may not see it until the profile has been opened once.
- `.docx` stores font names as text; if LO can't find "Arial", it substitutes without warning.
- Per-invocation profile dir (Pitfall 1) starts fresh each time → font cache rebuilds → occasional mis-substitution on first run of a fresh profile.
- v1.0 already hit this with pdfmake and solved with Arial TTF (per PROJECT.md Key Decisions).

**How to avoid:**
- Embed fonts into PDF via filter options: `pdf:writer_pdf_Export:{"EmbedStandardFonts":{"type":"boolean","value":"true"}}` — `[verify via Context7: libreoffice pdf export filter embed fonts]`.
- Smoke-test: include a canary template containing "çÇğĞıİöÖşŞüÜ İstanbul şirket müvekkil"; assert PDF text layer contains all glyphs.
- Don't rely on system font install; copy Arial TTF (already in repo for pdfmake) into a known dir and point LO at it.
- Playwright verification step per CLAUDE.md: render canary template, extract PDF text layer, assert all Turkish chars present.

**Warning signs:**
- Tofu boxes (▯) visible in generated PDF
- Turkish letters missing accents
- Different machines produce visibly different output

**Phase to address:** **Phase 4 — PDF Pipeline**. Add canary template + text-extraction assertion to acceptance criteria.

---

### Pitfall 4: Concurrent LibreOffice invocations corrupt each other when sharing a profile

**What goes wrong:**
User clicks "İhtarname Üret" twice quickly (double-click not debounced), or generates two different belgeler from different tabs in parallel. Two `soffice` processes start, both try to grab the same user profile → one succeeds, the other hangs (Pitfall 1) or silently exits with a half-written PDF.

**Why it happens:**
Single-user-profile model. Even with `--headless`, LibreOffice is not designed for concurrent invocations against one profile. Per-invocation `UserInstallation` (Pitfall 1) fixes this — but only if the temp dir is **unique** per call.

**How to avoid:**
- Per-invocation `UserInstallation` with unique temp dir: `tempfile.mkdtemp(prefix="lo-")`; delete in `finally`.
- Serialize generation at the tRPC layer with a simple in-process Mutex OR queue requests in the Python sidecar — start with serialization, optimize only if felt.
- UI: disable the "Üret" button during the request; show spinner.
- Idempotency key at tRPC mutation so accidental retries don't double-run.

**Warning signs:**
- Occasional 0-byte PDF
- "Document is already open" errors in soffice stderr
- Two `.pdf` files produced by one user action (one is corrupt)

**Phase to address:** **Phase 4 — PDF Pipeline** (per-invocation profile) + **Phase 6 — UI** (button debounce).

---

### Pitfall 5: Python subprocess from Node deadlocks on large stdout / stderr

**What goes wrong:**
Node calls `child_process.spawn('python', ['sidecar.py', ...])` and reads stdout via `'data'` events. When docxtpl throws a long traceback to stderr (e.g., missing variable with full Jinja2 context dump), the OS pipe buffer for stderr fills (~4-64KB on Windows depending on the API), Python blocks on `write`, Node is only reading stdout → deadlock. Both sides wait forever.

**Why it happens:**
Windows pipe buffers are small and per-stream. If any single stream isn't being actively drained, the child blocks. Common mistake: listening to stdout only, or using `execFile` without appropriate buffer sizing.

**How to avoid:**
- Drain both stdout AND stderr unconditionally — even if stderr content is ignored:
```ts
child.stderr.on('data', chunk => stderrBuf.push(chunk))
child.stdout.on('data', chunk => stdoutBuf.push(chunk))
```
- Prefer structured IPC: sidecar writes a single JSON line to stdout per request; structured logs go to a **file** (not stderr); errors go as JSON on stdout with `{"ok": false, "error": {...}}`. Keeps stderr near-empty.
- Never use `shell: true` — launches `cmd.exe`, double-escapes Turkish paths, loses exit-code fidelity. Pass argv as an array.
- Use `maxBuffer` guard if using `execFile`.
- Timeout every call (e.g., 120s) — kill the child on timeout so Node doesn't hang.

**Warning signs:**
- Python sidecar "completes" in its own log but Node callback never fires
- Works in dev with small templates, hangs with real templates
- Error path hangs, happy path is fast

**Phase to address:** **Phase 3 — Pipeline Core (Node↔Python IPC contract)**. Define the JSON protocol before writing callers.

---

### Pitfall 6: Python executable / venv resolution fails on Windows

**What goes wrong:**
Developer ships app; lawyer installs; clicks "Üret" → `spawn('python', ...)` → `ENOENT` because Windows has `py` launcher (not `python`) or has no Python on PATH, or user has Python 3.8 but docxtpl needs ≥ 3.10. Worst case: `python` resolves to the Microsoft Store stub, which **opens the Store** when invoked → user confusion.

Alternatively: dev venv at `.venv/Scripts/python.exe` works locally but lawyer's machine has no venv.

**Why it happens:**
- Windows Python installer does not add `python` to PATH by default (opt-in checkbox).
- `py` launcher exists instead.
- Microsoft Store stub intercepts `python.exe` if Python is not actually installed.
- venv paths are Windows-specific: `Scripts\python.exe`, not `bin/python`.
- "Activating" a venv via `activate.bat` in a subprocess does nothing — env vars don't propagate back.

**How to avoid:**
- `PYTHON_PATH` env var required and validated at startup (mirrors `LIBREOFFICE_PATH`). Point directly at `.venv\Scripts\python.exe` — never rely on PATH.
- Don't "activate" the venv — just call the venv's python directly; it self-resolves site-packages.
- Startup check: spawn `<PYTHON_PATH> --version`, parse output, assert ≥ 3.10. Banner uyarı if missing.
- Ship a Windows setup script: create venv, `pip install -r requirements.txt`, write `PYTHON_PATH` into `.env`.
- Pin exact Python version range in `requirements.txt` comments; pin docxtpl version exactly.

**Warning signs:**
- `ENOENT: python` on fresh install
- Microsoft Store opens when running the app
- `ModuleNotFoundError: docxtpl` despite `pip install` (wrong interpreter invoked)

**Phase to address:** **Phase 1 — Foundation (env validation, startup banner, setup script)**.

---

### Pitfall 7: docxtpl — Jinja2 tag split across Word "runs" leaves literal `{{ ... }}` in output

**What goes wrong:**
Lawyer types `{{ muvekkil_adi }}` in Word. During typing, Word autocorrects, applies spellcheck, or the lawyer italicizes part of it — Word internally splits the tag across multiple `<w:r>` (run) elements in the OOXML. docxtpl's matcher cannot find `{{` and `}}` within a single run and leaves the text literal. Output PDF contains raw `{{ muvekkil_adi }}`.

**Why it happens:**
Word's `.docx` XML wraps every formatting change in a new `<w:r>`. Any spellcheck red-underline, autocorrect, or mid-word cursor movement can split a run. docxtpl has some run-joining heuristics but they fail when runs have different formatting (bold, font size, spellcheck mark).

**How to avoid:**
- **Cardinal rule for templates:** type the entire `{{ tag }}` in one go, without autocomplete, without formatting changes mid-tag. If it looks wrong, delete the whole tag and retype.
- Upload-time "Şablon Sağlığı Kontrolü": parse the `.docx`, extract all `w:t` text, count `{{` and `}}`. If unbalanced, refuse upload with a clear Turkish error pointing at the offending paragraph. Compare against `docxtpl.DocxTemplate(...).undeclared_template_variables` — if docxtpl sees fewer tags than the raw text, some are split. `[verify via Context7: docxtpl jinja run split]`
- Documentation page in the app: "Word şablonu nasıl hazırlanır — `{{ }}` yazarken dikkat edilecekler", with screenshots.
- For Jinja2 control tags (`{% for %}`, `{% if %}`) use docxtpl's `{%p ... %}` (paragraph) and `{%tr ... %}` (table row) forms — they are designed for Word's run model.

**Warning signs:**
- Output PDF contains literal `{{ var }}` strings
- The same template works when retyped from scratch
- `undeclared_template_variables` returns variables the lawyer swears are defined

**Phase to address:** **Phase 2 — Template CRUD (upload-time sağlık kontrolü)** + **Phase 6 — UI (help page)**.

---

### Pitfall 8: docxtpl — images and tables silently break when using wrong tag form

**What goes wrong:**
Lawyer writes a conditional section: `{% if plaka %}...{% endif %}` inline in a paragraph → docxtpl renders content but leaves empty paragraphs, orphaned `</w:p>`, or broken table rows because the control tag is inside a paragraph, not wrapping it. PDF looks fine on a quick glance; document sent to court has a weird blank row.

Similarly: inline image with `{{ logo | image }}` without using docxtpl's `InlineImage` helper → literal "InlineImage(...)" text in output.

**Why it happens:**
docxtpl requires special tag prefixes to specify the tag's scope:
- `{%p ... %}` — control tag removes the whole paragraph containing it
- `{%tr ... %}` — removes the whole table row
- `{%tc ... %}` — removes the whole table cell
- `{{ var }}` — inline substitution

Standard Jinja2 users don't know these exist; Jinja2 docs don't mention them.

**How to avoid:**
- Ship a documentation + example template inside the app.
- Upload-time lint: detect `{% if %}` / `{% for %}` that are not preceded by `{%p`/`{%tr`/`{%tc` and warn.
- Anti-feature: per PROJECT.md scope, template images are **out of scope for v1.2**. List "Şablonda görsel/logo desteği" explicitly in FEATURES.md anti-features so no one adds it mid-milestone.

**Warning signs:**
- Empty paragraph or row where a conditional should be
- Table alignment broken after conditional row
- Literal `InlineImage(...)` text in output

**Phase to address:** **Phase 2 — Template CRUD (upload-time lint + help doc)**.

---

### Pitfall 9: Retiring `dilekce` + `dilekce_odt` tables leaves orphaned files, stale imports, and broken FKs

**What goes wrong:**
v1.2 removes two old systems. Developer writes `DROP TABLE dilekce_sablonu; DROP TABLE dilekce_odt_sablonu;` but forgets:
- `uploads/odt-templates/*.odt` files on disk (per `dilekce-odt.ts` line 36) become orphaned — slow disk-space leak.
- `belge` table rows previously generated from Tiptap/ODT system reference deleted workflow in UI/typing: any `olay_gunlugu` entries with template-specific `aciklama` now point at nothing.
- Stale imports: `lib/services/odt-to-pdf.ts`, `lib/pdf/pdf-generator.ts` (if only used by retired routers), Tiptap editor UI components, `dilekceSablonuRelations`, router registrations in `lib/trpc/routers/_app.ts`.
- FK semantics in SQLite: `PRAGMA foreign_keys` is **OFF by default** per connection in better-sqlite3. If not enabled in `lib/db.ts`, cascade deletes and FK integrity checks simply don't run. Inspection confirms `dilekceSablonu` and `dilekceOdtSablonu` have **no** incoming FKs (schema lines 354–381), so drop is safe — but verify with grep before dropping.

**Why it happens:**
"Delete tables and files" sounds atomic; it isn't. File cleanup and table drop are separate steps; neither is transactional with the other. TypeScript build can pass with stale types if the imports are in files not yet touched by tsc this session.

**How to avoid:**
- Pre-migration audit grep:
```bash
grep -rn 'dilekceSablonu\|dilekceOdtSablonu\|dilekce_sablonu\|dilekce_odt_sablonu\|odt-templates\|extractVariablesFromOdt\|processOdtTemplate\|extractStyledContentFromOdt' lib/ app/ components/
```
Confirm every match is intentional before dropping.
- **Backup first** (per PROJECT.md "no export" decision — backup is still free insurance):
```bash
cp data/db.sqlite data/db.sqlite.pre-v1.2.bak
```
- Ordered retirement migration:
  1. `SELECT dosya_yolu FROM dilekce_odt_sablonu` → collect file paths to delete after row deletion.
  2. `DELETE FROM dilekce_sablonu; DELETE FROM dilekce_odt_sablonu;` (in a single transaction if possible).
  3. `DROP TABLE dilekce_sablonu; DROP TABLE dilekce_odt_sablonu;`
  4. `rm -rf ./uploads/odt-templates/` — and any v1.0 Tiptap upload dir.
  5. Delete source files: `lib/trpc/routers/dilekce.ts`, `lib/trpc/routers/dilekce-odt.ts`, `lib/services/odt-to-pdf.ts`, any Tiptap editor components.
  6. Remove router registrations from `lib/trpc/routers/_app.ts` and any Tiptap provider/menu entries.
  7. `npm run build` — must pass with zero warnings about unused imports or missing modules.
  8. Delete old migration files only if retained for history; typically keep for audit.
- `VACUUM` after `DROP TABLE` to reclaim SQLite space (not automatic).

**Warning signs:**
- `npm run build` fails after migration with stale import errors
- `uploads/odt-templates/` or old Tiptap dir has files with no DB rows
- tRPC client type errors in components that still reference removed routers
- Database file size doesn't shrink after drop (`VACUUM` not run)

**Phase to address:** **Phase 7 — Retirement (Eski Sistemler Temizliği)**. Must be the **last phase** — after the new pipeline is user-accepted. Never start retirement before the replacement is user-validated.

---

### Pitfall 10: Filename slug + sequence counter race produces duplicates or skipped numbers

**What goes wrong:**
Filename pattern from PROJECT.md: `{müvekkil-slug}-{plaka-slug}-{seq}.pdf`. Naive implementation:
```ts
const files = fs.readdirSync(dir)
const max = Math.max(...files.map(parseSeqFromName), 0)
const next = max + 1
fs.writeFileSync(path.join(dir, `${slug}-${next}.pdf`), buf)
```
If "Üret" is double-clicked (or two requests overlap), both see `max = 3`, both write `slug-4.pdf` — second overwrites first. On NTFS, `writeFileSync` to the same path does not fail — it silently clobbers.

**Turkish slug specifics:**
- `python-slugify` default (`allow_unicode=False`) strips non-ASCII. Via `unidecode`:
  - `ş → s`, `ı → i`, `ğ → g`, `ü → u`, `ö → o`, `ç → c` — correct
  - `İ` (U+0130, Turkish dotted capital I) → `I`, which `.lower()` turns into `i` — acceptable
  - `I` (regular I) → `I` → `i` — but in Turkish this should be `ı` — wrong in pure-ASCII output, but since we want ASCII filenames, the loss is acceptable provided documented.
- Run `str.casefold()` with Turkish-aware mapping **before** slugify if preserving Turkish phonetics matters. For filenames, default `python-slugify` output is acceptable.
- Empty plaka (per PROJECT.md): skip the segment — produce `mehmet-ozkan-1.pdf` not `mehmet-ozkan--1.pdf`.
- Plaka format "34 ABC 123" → `34-abc-123` via default slugify. Fine.

**Why it happens:**
`readdir` → compute → write is not atomic. Filesystem doesn't provide a compare-and-swap primitive for file creation unless you use exclusive-open flags.

**How to avoid:**
- Store sequence per `(muvekkil_id, plaka_slug, kategori)` in SQLite, incremented in a single UPDATE ... RETURNING transaction. SQLite serializes writes per DB file, so no race. Schema sketch:
```ts
export const belgeSeq = sqliteTable('belge_seq', {
  muvekkil_id: integer('muvekkil_id').notNull().references(() => muvekkil.id, { onDelete: 'cascade' }),
  plaka_slug: text('plaka_slug').notNull().default(''),
  kategori: text('kategori').notNull(),
  seq: integer('seq').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.muvekkil_id, t.plaka_slug, t.kategori] })])
```
Atomic increment:
```ts
db.transaction((tx) => {
  tx.insert(belgeSeq).values({ muvekkil_id, plaka_slug, kategori, seq: 1 })
    .onConflictDoUpdate({ target: [...], set: { seq: sql`${belgeSeq.seq} + 1` } })
  const [row] = tx.select().from(belgeSeq).where(...)
  return row.seq
})
```
`[verify via Context7: drizzle orm onConflictDoUpdate returning]`
- Fallback: `fs.writeFileSync(path, buf, { flag: 'wx' })` — fails if file exists → catch `EEXIST` and retry with seq+1. Belt + suspenders.
- Debounce UI button minimum 1000ms + disable during request.

**Warning signs:**
- Two generations in the same minute → only one PDF on disk
- Sequence jumps (4, then 7) — silent overwrites
- Two `belge` rows with identical `dosya_yolu`

**Phase to address:** **Phase 5 — Archive & Filename (DB seq counter)** + **Phase 6 — UI (debounce)**.

---

### Pitfall 11: structlog / sidecar logs balloon disk because there is no rotation

**What goes wrong:**
structlog is configured to write `logs/sidecar.log` per request + per tenacity retry. Solo avukat generates ~10 docs/day → fine for a week. Six months later the file is 500MB, project-folder backup takes forever, nobody opens the file.

**Why it happens:**
Python logging has no rotation by default. structlog is a frontend; the actual writer is `logging.FileHandler` — which appends forever unless given `RotatingFileHandler` or `TimedRotatingFileHandler`.

**How to avoid:**
- Configure Python sidecar with `logging.handlers.RotatingFileHandler(filename, maxBytes=10_000_000, backupCount=5)` — hard cap at ~50MB total. `[verify via Context7: structlog python standard library integration rotation]`
- Alternative: sidecar logs JSON to stdout only (captured by Node). Node aggregates with daily-rotated log (`winston-daily-rotate-file` or `pino` with `pino-roll`). Single source of truth.
- Log at INFO: request started / completed, template name, dosya_id, pdf size. At DEBUG only when `DEBUG=1` env var set — not default.
- **Never log the full Jinja2 context** — it contains müvekkil PII (TC kimlik, phone, hasar detayı). KVKK risk. Log only keys and scalar types, not values.

**Warning signs:**
- `logs/` > 100MB
- `find logs/ -mtime +30` shows unrotated files
- Backup time grows month-over-month
- Lawyer asks "why is the app folder so big?"

**Phase to address:** **Phase 3 — Pipeline Core (logging contract)**.

---

### Pitfall 12: tenacity retry masks real errors, user waits 3× the actual failure time

**What goes wrong:**
Developer wraps `subprocess.run(soffice, ...)` with `@retry(stop=stop_after_attempt(3), wait=wait_exponential())`. LibreOffice is misconfigured (wrong path, missing font, locked profile) → fails instantly on every attempt. Tenacity retries 3× with backoff → user waits 15s then sees generic "conversion failed". Root cause (e.g., "soffice.exe not found") is buried inside the retry loop.

**Why it happens:**
- Tenacity's default re-raises only the last exception; the stack often points to `tenacity.__call__` not the true call site unless `reraise=True` is set.
- Retry is appropriate for **transient** errors (profile lock, temp-file handle); **not** for deterministic ones (missing binary, malformed template).
- Developers copy tenacity examples wholesale and wrap everything.

**How to avoid:**
- Retry **only** on an exception allowlist:
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    retry=retry_if_exception_type((FileExistsError, subprocess.TimeoutExpired, LibreOfficeLockError)),
    reraise=True,
    before_sleep=before_sleep_log(logger, logging.WARNING),
)
```
`[verify via Context7: tenacity retry_if_exception_type before_sleep]`
- Never retry on `FileNotFoundError` (wrong binary), `PermissionError`, `docxtpl.TemplateError` (deterministic).
- Fail fast at startup: validate LibreOffice binary + Python binary + template dir writable — before first user click.
- Structured error response to Node: `{ "ok": false, "error": { "type": "LibreOfficeLockError", "detail": "...", "retries": 3 } }` so UI can surface actionable Turkish message.

**Warning signs:**
- "Bir hata oluştu" toasts with no detail
- Every failure takes 3× expected duration
- Tests intentionally triggering deterministic errors hang longer than they should

**Phase to address:** **Phase 3 — Pipeline Core (error contract + allowlist)**.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip per-invocation `UserInstallation` | One less arg to configure | Deadlocks when Writer is open — solo lawyer WILL have Writer open | **Never** |
| `shell: true` in Node spawn | Paths with spaces "just work" | `cmd.exe` mangles Turkish paths, breaks argv escaping, hides exit codes | Never |
| Log full Jinja2 context at DEBUG | Easier debugging | KVKK risk — logs contain TC, phone, hasar detayı | Dev-local only, never shipped |
| Keep old `dilekce` / `dilekce_odt` tables "just in case" | Reversible | Dead routers, stale types, user confusion about which pipeline is live | Only during Phase 7 transition window (< 1 week); hard delete after user acceptance |
| FS sequence counter (readdir + max+1) | No DB schema change | Race, silent overwrites | Never (even solo user double-clicks) |
| Rely on PATH for `python` / `soffice` | No env config step | Breaks on new machines, Microsoft Store stub hijack | Never on Windows |
| Regex variable substitution instead of real Jinja2 | Simpler code | No conditionals/loops — defeats docxtpl's purpose | Never (was v1.0's approach; being replaced) |
| No sağlık kontrolü on template upload | Faster to ship | Lawyer generates 50 PDFs before noticing literal `{{ }}` | Only if dry-run is part of upload flow |
| Tenacity on everything | "Resilient by default" | Masks deterministic errors, user waits longer | Never without exception allowlist |
| Skip `PRAGMA foreign_keys=ON` in `lib/db.ts` | One less line | Cascade delete doesn't run; orphan rows accumulate | Never going forward — add in Foundation phase |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Node → Python spawn | `exec` (shell parsing) with Turkish paths | `spawn(pythonPath, ['sidecar.py', ...args], { shell: false })`, argv array |
| Node → Python spawn | Only reading stdout | Drain stdout **and** stderr; structured JSON on stdout |
| Python → LibreOffice | No `-env:UserInstallation` | Per-invocation temp profile dir, deleted in finally |
| Python → LibreOffice | Using `soffice.exe` on Windows | Use `soffice.com` for synchronous behavior |
| Python → LibreOffice | No subprocess timeout | `timeout=120` + kill on expire |
| Python → LibreOffice | Expecting output filename = input filename | LO writes `{input_stem}.pdf` into `--outdir`; predict the path |
| Python → filesystem | Writing PDF directly to final path | Write to `.tmp` sibling then `os.replace()` atomically |
| Node → tRPC client | Base64 `.docx` via JSON (current `dilekce-odt.ts` pattern) | OK for small templates; multipart upload for > 1MB |
| Node → SQLite (better-sqlite3) | Assuming FKs are enforced | `db.pragma('foreign_keys = ON')` at connection init |
| Python → SQLite | Writing to the app DB from sidecar | **Don't** — sidecar returns data via stdout; Node owns all DB writes |
| `belge` table insert | Insert row then generate PDF (order reversed) | Generate PDF to temp, insert row with real size/mime on success, `os.replace` into archive path |
| Turkish filenames | Passing unslugified names to `fs.writeFileSync` | Always slugify to ASCII + limit length to 120 chars |
| LibreOffice filter opts | Using positional `:` syntax incorrectly | Use JSON filter data format for anything non-trivial; `[verify via Context7]` |

---

## Performance Traps

Scale: solo avukat, ≤ 200 active dosya, ~10 PDF generations per day. Most traps below are about avoiding surprise, not throughput.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Cold-starting LO each call | 3–5s per conversion | Acceptable at this scale; don't build a persistent daemon | > 1 gen/minute (not realistic here) |
| Reading full `.docx` into memory twice | RAM spike on large templates | Cap upload at 10MB in Zod | Templates > 20MB (rare) |
| `readdirSync` for filename seq | Slow after 10k files | Keep seq in DB; shard archive by YYYY/AA | ~5 years of use |
| Log every Jinja2 variable access | Log grows fast | Log only at request boundaries | Any sustained use |
| No index on `belge.dosya_id` | Slow dosya detail | Already indexed (schema L306) | N/A |
| `SELECT MAX(seq)` each time | Lock contention + race | Dedicated `belge_seq` table with atomic UPDATE | Only with concurrency |
| Unbounded PDF buffer in tRPC response | Memory balloon | Return `{ belgeId, dosyaYolu }`; client downloads via `belge` route | PDFs > 5MB |
| `VACUUM` never run after big DROP TABLE | DB file stays large | Run `VACUUM` after Phase 7 retirement | Always after major deletes |

---

## Security Mistakes

App is **lokal only** (PROJECT.md — `.env` auth, localhost), so classic web attack surface is minimal. Focus on domain-specific issues.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Jinja2 autoescape off because output "looks like plain text" | Template injection: opposing-counsel text with `{{ ... }}` gets evaluated on second render | docxtpl's default behavior is Word-XML aware; **never** `eval` user-supplied expressions; `[verify via Context7: docxtpl autoescape]` |
| Path traversal in archive filename | Lawyer name `../../Windows/System32/x` → write outside archive dir | `path.resolve()` + assert `startsWith(baseArchiveDir)` (same pattern as `belge.ts` L54–58) |
| Logging müvekkil TC / phone / hasar detayı | KVKK violation if logs are emailed for support | No PII in logs; log dosya_id + template_name only |
| `.docx` upload without content validation | Lawyer uploads `.exe` renamed to `.docx` → no execution (we don't run it), but docxtpl raises an obscure error | Validate ZIP magic bytes (`PK\x03\x04`) + presence of `word/document.xml` |
| Reading template path from DB without validation | DB tampering → arbitrary file read | Resolve template path against fixed base dir, assert `startsWith` |
| Subprocess argv injection via template filename | Filename `$(rm -rf ~).docx` — irrelevant with `shell: false` but dangerous if switched | Keep `shell: false`; validate filename against strict regex before passing to sidecar |
| KVKK retention — old `dilekce` rows contain müvekkil data | Backup `db.sqlite.pre-v1.2.bak` lingers forever | Document deletion of backup after user signs off on v1.2 |
| Generated PDF served without auth | Lokal only so low risk; if ever remote-exposed, lawyer's müvekkil PII leaks | Reuse existing `belge` download route which is behind `protectedProcedure` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Üret" button gives no feedback for 5s while LO warms up | Lawyer clicks again → Pitfall 4 | Disable button immediately; progressive status text ("Şablon hazırlanıyor…" → "PDF üretiliyor…" → "Kaydediliyor…"); minimum 1s debounce |
| Generic "PDF conversion failed" | Lawyer can't diagnose | Surface structured error: "Şablonda hatalı değişken: `{{ plka }}` — muhtemelen `plaka` yazmak istediniz?" |
| Silent success when variable missing → empty string | Document sent to court with "...sayın     bey" gaps | Use `docxtpl.DocxTemplate(...).undeclared_template_variables` vs context keys; fail with "Şu değişkenler için veri yok: plaka, muvekkil_vekil" |
| Generated PDF opens in new tab but isn't saved to `belge` | Lawyer thinks it's saved, loses it on tab close | Per PROJECT.md: auto-insert into `belge` table; UI confirms "Belgeler sekmesine eklendi" with link |
| No way to preview without generating | Iteration via generate → open → edit → regenerate | Show variable list + sample values on template detail; optional watermarked "ÖRNEK" preview |
| Retiring old UI without grace period | Lawyer's muscle memory broken | One release where new pipeline ships and old UI is hidden behind an "Eski Sistemler" toggle in Ayarlar; full removal next release after user confirms |
| Variable names exposed as `muvekkil_adi` with underscores | Cryptic for non-technical user | Show human labels: "Müvekkil Adı → `{{ muvekkil_adi }}`", copy-to-clipboard — carry the pattern from v1.0 dilekce |
| Turkish char in filename breaks when emailing | Opponent mail server rejects `.pdf` with ş | python-slugify ASCII-only (default) — verify in Phase 5 |
| Kategori chosen at upload but no way to change later | Lawyer miscategorizes | Allow editing `kategori` on template detail page |
| "Generate" button shown even when `LIBREOFFICE_PATH` is missing | Click → cryptic backend error | Banner uyarı + disable generate button when env vars missing |

---

## "Looks Done But Isn't" Checklist

- [ ] **LibreOffice PDF generation:** Works once → verify works **twice in a row** + **while Writer is open** + **on cold machine after reboot**
- [ ] **Python sidecar:** Runs in dev → verify runs with a **different Windows user** who has no venv / different Python version (setup script bootstraps)
- [ ] **docxtpl template:** Renders OK → verify a **lawyer-authored** template (with autocorrect/spellcheck artifacts) renders all `{{ }}` without literals
- [ ] **Turkish characters:** Display on screen → verify in **generated PDF text layer** (open PDF, copy text, paste to notepad — should be copyable Turkish, not glyph images)
- [ ] **Filename sequence:** First 3 produce seq 1, 2, 3 → verify **double-click** produces distinct 1 and 2 (not both 1)
- [ ] **Archive path:** PDF written to `./uploads/sablon-pdf/YYYY/AA/{kategori}/` → verify **year boundary** (Dec 31 23:59 vs Jan 1 00:01 → different folders)
- [ ] **`belge` table insertion:** Row inserted → verify `logOlay` entry created + dosya's belgeler count reflects the new file
- [ ] **Error surface:** Happy path works → verify missing LO binary / syntax error / missing variable each show **actionable Turkish message**, not stack trace
- [ ] **Old system retirement:** `/dilekceler` and `/dilekce-odt` routes gone → verify **no broken links** from menus, **zero stale imports** in `lib/trpc/routers/_app.ts`, old upload dirs deleted
- [ ] **Old data deletion:** Tables dropped → `uploads/odt-templates/` + old Tiptap dir removed; `VACUUM` run; DB file size decreased
- [ ] **Tenacity retries:** Failure handled → verify **total failure time bounded** (not 3× a 30s timeout = 90s user wait)
- [ ] **Log rotation:** Logs appear → after filling rotation threshold, old log is renamed, not appended forever
- [ ] **LO profile cleanup:** Per-invocation `UserInstallation` → `%TEMP%` has no lingering `lo-*` dirs after 10 generations
- [ ] **Env var banner:** `.env` missing `LIBREOFFICE_PATH` / `PYTHON_PATH` → banner appears in UI, **blocks generation** with clear Turkish message
- [ ] **Button debounce:** Mouse debounced → verify **keyboard Enter spam** also debounced
- [ ] **FK pragma:** `db.pragma('foreign_keys')` returns `1` at runtime (not just in schema intent)
- [ ] **KVKK audit:** `grep -r 'logger' lib/sidecar/` — no log call passes PII values (only keys / dosya_id)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| LibreOffice hang (1, 4) | LOW | `taskkill /F /IM soffice.bin /IM soffice.exe`; delete `%TEMP%\lo-*` dirs; retry |
| Wrong `.exe` vs `.com` (2) | LOW | Update `LIBREOFFICE_PATH` in `.env`; restart Next.js |
| Tofu chars (3) | MEDIUM | Enable `EmbedStandardFonts` in LO filter; regenerate affected PDFs (identifiable from `belge` table) |
| Python not found (6) | LOW | Run setup script; set `PYTHON_PATH` in `.env` |
| docxtpl run-split (7) | MEDIUM | Lawyer retypes the tag cleanly in Word; re-uploads template; existing generated PDFs unaffected |
| Filename collision (10) | HIGH | If data loss: restore from NTFS volume shadow copy or recent project backup; rebuild `belge_seq` from `SELECT COUNT(*)` per archive folder |
| Dropped table with orphan files (9) | MEDIUM | Files still on disk; cross-reference against `data/db.sqlite.pre-v1.2.bak`; delete orphans after audit |
| Log disk full (11) | LOW | Delete old logs; retroactively add rotation; audit trail for that period lost (acceptable — not legally required) |
| Tenacity hiding error (12) | LOW | Add `reraise=True`, allowlist, per-attempt logging |
| Accidental deletion of lawyer's old templates (9) | HIGH | Restore from `data/db.sqlite.pre-v1.2.bak` within grace window; per PROJECT.md user accepted "no export" but backup buys safety |
| PDF in `belge` table but file missing on disk | MEDIUM | Admin command: compare `belge.dosya_yolu` against filesystem; mark orphan rows as broken; offer regenerate-from-template option if template still exists |

---

## Pitfall-to-Phase Mapping

Suggested phase names aligned with downstream consumer: **Foundation / Template CRUD / Pipeline Core / PDF / Archive / UI / Retirement**.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. LO profile lock / SingletonLock | **Phase 4 — PDF** | Generate 2× in parallel while Writer is open; both succeed |
| 2. soffice.exe vs .com | **Phase 1 — Foundation** | Startup log prints resolved `LIBREOFFICE_PATH`; banner if wrong extension |
| 3. Turkish font fallback | **Phase 4 — PDF** | Canary template with `çÇğĞıİöÖşŞüÜ`; extract PDF text layer, assert all chars present |
| 4. Concurrent LO invocations | **Phase 4 — PDF** (isolation) + **Phase 6 — UI** (debounce) | Double-click "Üret" → two distinct PDFs produced |
| 5. Node↔Python stdout deadlock | **Phase 3 — Pipeline Core** | Intentional error → sidecar returns JSON error within timeout, no hang |
| 6. Python / venv resolution | **Phase 1 — Foundation** (setup script + env validation) | Fresh Windows user with no venv; setup script bootstraps |
| 7. docxtpl run-split | **Phase 2 — Template CRUD** (upload-time sağlık kontrolü) | Upload a known-split template; app rejects with actionable Turkish message |
| 8. docxtpl `{%p %}` / images | **Phase 2 — Template CRUD** (lint + docs) | Template with `{% if %}` inside paragraph; app warns |
| 9. Retiring old tables / orphans | **Phase 7 — Retirement** | Post-migration audit: zero stale imports + zero orphaned files + `VACUUM` run |
| 10. Filename seq race | **Phase 5 — Archive** (DB seq) + **Phase 6 — UI** (debounce) | Scripted double mutation; both PDFs exist with distinct seqs |
| 11. Log disk balloon | **Phase 3 — Pipeline Core** | 1000 generations in test loop; log dir stays under cap |
| 12. Tenacity masking errors | **Phase 3 — Pipeline Core** | Deliberately misconfigure LO path; error appears within 1s with specific `error.type` |

---

## Sources

- Direct code inspection: `lib/trpc/routers/dilekce-odt.ts`, `lib/services/odt-to-pdf.ts`, `lib/trpc/routers/belge.ts`, `lib/schema.ts` (belge, dilekceSablonu, dilekceOdtSablonu definitions), `.planning/PROJECT.md`.
- CLAUDE.md (repo policy) — mandates Context7 verification before finalizing Jinja/docxtpl/Drizzle syntax; recommends Playwright for visual PDF verification (drives the "Looks Done But Isn't" checklist).
- Ecosystem-known traps: LibreOffice profile lock (tdf# bug tracker), `soffice.com` Windows subsystem behavior, docxtpl run-split (GitHub issue tracker), Node.js `child_process` Windows pipe buffer behavior, python-slugify Turkish transliteration via `unidecode`, Jinja2 autoescape in docxtpl, SQLite FK pragma in better-sqlite3 (docs explicitly note default OFF).
- **WebSearch was unavailable** during this research session. Items marked `[verify via Context7]` must be re-checked before implementation: docxtpl (run-split semantics + `{%p %}`/`{%tr %}` forms + autoescape defaults), tenacity (`retry_if_exception_type`, `before_sleep_log` signatures), structlog (RotatingFileHandler integration pattern), python-slugify (Turkish char mapping defaults), LibreOffice CLI (`-env:UserInstallation`, `pdf:writer_pdf_Export` filter data JSON form, `EmbedStandardFonts` key name), drizzle-orm (`onConflictDoUpdate` with `RETURNING` on SQLite).
- Confidence notes: HIGH on pitfalls 1, 2, 4, 5, 6, 9, 10, 11, 12 (direct code evidence or strong ecosystem consensus); MEDIUM on 3 (depends on installed fonts — needs smoke test), 7, 8 (specifics depend on docxtpl version — verify before Phase 2).

---
*Pitfalls research for: v1.2 Şablon Belgeler — Python sidecar + LibreOffice headless pipeline on Windows 11*
*Researched: 2026-04-20*
