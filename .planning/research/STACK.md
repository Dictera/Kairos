# STACK.md — v1.2 Şablon Belgeler Pipeline

**Project:** Sigorta Uyuşmazlık Takip
**Milestone:** v1.2 — `.docx` template + Python sidecar + LibreOffice headless → PDF pipeline
**Researched:** 2026-04-20
**Confidence:** MEDIUM (training-data cutoff January 2026; Context7, WebFetch, WebSearch, and the ctx7 CLI via Bash were all denied at research time, so version pins rely on training-data knowledge; downstream MUST run `pip index versions <pkg>` + `npm view execa version` before committing requirements files)

## Scope Boundary

This document covers ONLY the new v1.2 document-pipeline additions. The existing Node.js stack (Next.js 15.5.15, tRPC v11, Drizzle ORM, better-sqlite3 with WAL, iron-session, shadcn/ui v4, Tailwind CSS v3, React Query, Zod, @xmldom/xmldom, AdmZip) is already validated and NOT re-researched. `jspdf` and the AdmZip-based `.odt` pipeline are being removed along with the Tiptap `dilekce` router — they are explicit anti-features of this milestone.

## Runtime Prerequisites

| Runtime | Version | Why | Windows Notes |
|---|---|---|---|
| Python | 3.11.x or 3.12.x (pin one) | docxtpl, pydantic v2, Babel, structlog, tenacity all fully supported; 3.10 is the hard floor for pydantic v2's performance path; 3.13 can lag on transitive Windows wheels | Install from **python.org only** — Microsoft Store Python sandboxes paths under `%LOCALAPPDATA%\Packages\...` and that breaks venv subprocess activation from Node. Add to PATH. |
| LibreOffice | 24.8.x LTS (preferred) or 25.2.x | `soffice --headless --convert-to pdf` is the locked conversion step. 24.8 is the "Still" LTS branch — safer default for a single-user desktop. | Default install path `C:\Program Files\LibreOffice\program\soffice.exe`. First headless run creates `%APPDATA%\LibreOffice\4\user` — warm once. |
| Node.js | 20.x LTS (already in project) | Execa 9 needs Node ≥18; repo is on 20 for better-sqlite3 | — |

## New Python Stack (Sidecar)

### Core

| Package | Pin | Purpose | Why this pin |
|---|---|---|---|
| `docxtpl` | `>=0.19.1,<0.21.0` | Jinja2-in-Word templating. Reads Word-authored `.docx`, fills `{{ variable }}`, `{% for %}`, `{% if %}` while preserving letterhead, styles, images, and headers/footers | 0.19 stabilized nested-table loop bugs; 0.20 added subdocument improvements. Cap below 0.21 because docxtpl has a history of breaking on minor bumps — validate before raising. |
| `python-docx` | `>=1.1.2,<2.0.0` | Transitive of docxtpl. Pin directly so docxtpl upgrades can't surprise us. | 1.1.x is the stable line. 1.2 adds stricter XML validation that can reject hand-edited templates; hold at 1.1 until tested. |
| `Jinja2` | `>=3.1.4,<4.0.0` | Template engine used internally by docxtpl. We also register custom filters (`tr_currency`, `tr_date`) against docxtpl's Jinja environment. | `>=3.1.4` patches CVE-2024-56201 / CVE-2024-56326 (sandbox escape). Never below. |
| `pydantic` | `>=2.9.0,<3.0.0` | Validate the render-context dict received from Node over stdin **before** Jinja2 touches it. Bad data → structured error → Node surfaces a user-friendly banner. | 2.9 is the settled v2 line (`model_validate`, `Field`, `computed_field`). Do NOT pin v1 — v1 is maintenance-only and the API is incompatible. |
| `Babel` | `>=2.16.0,<3.0.0` | ISO 4217 + CLDR Turkish currency (`format_currency(12345.67, 'TRY', locale='tr_TR')` → `₺12.345,67`) and date formatting for the `tr_currency` / `tr_date` Jinja filters | 2.16 bundles CLDR 45 — modern TR currency/date patterns. Do not roll `.replace(',', '.')` tricks; they break on negatives, thousands separators, and formal legal formats. |
| `python-slugify` | `>=8.0.4,<9.0.0` | Filesystem-safe slugs from Turkish strings: `"Müvekkil Özçelik"` → `muvekkil-ozcelik`. Used for `{müvekkil-slug}-{plaka-slug}-{seq}.pdf` and `{kategori-slug}` archive folder | 8.0 defaults to `text-unidecode` (Apache-licensed). **Critical:** `Unidecode` is GPL and would taint a proprietary distributable — do not swap the backend. |
| `structlog` | `>=24.4.0,<26.0.0` | Structured JSON logs on stderr so Node can parse one event per line (template load, render, convert, archive) and correlate with tRPC request IDs | 24.x is stable; 2-year upper bound is safe because structlog's API is deliberately frozen. JSON on stderr keeps stdout clean for the IPC payload. |
| `tenacity` | `>=9.0.0,<10.0.0` | Retry `soffice` conversion on transient failures (profile lock, post-write file-handle race) with exponential backoff, max 3 attempts | 9.0 drops Python 3.7, cleans up the decorator API. LibreOffice headless does occasionally fail the first shot when another soffice process is starting — this is the fix. |

### Transitive (do not direct-pin)

| Package | Why called out |
|---|---|
| `lxml` | Pulled by python-docx. Windows wheels exist for CPython 3.10–3.12; no C compiler needed. Don't pin directly — python-docx owns the range. |
| `MarkupSafe` | Pulled by Jinja2. Wheels on Windows. No direct pin. |
| `text-unidecode` | Pulled by python-slugify (default backend). Keep default — see license note above. |

### Python packages explicitly NOT to add

| Package | Reason | Instead |
|---|---|---|
| `unoconv` | Abandoned, Python-2 era, fragile UNO bindings on Windows | Direct `soffice.exe --convert-to pdf` subprocess |
| `pywin32` + Word COM | Requires MS Word licensed; leaves COM zombies on error | LibreOffice (already locked) |
| `aspose-words`, `spire.doc` | Commercial, watermarks, 200 MB DLLs | LibreOffice |
| `docx2pdf` | Delegates to Word on Windows, LibreOffice on Linux — inconsistent output, no letterhead fidelity guarantees | Direct `soffice` subprocess |
| `Unidecode` (GPL) | License taint | `text-unidecode` (default in python-slugify) |
| `pydantic<2` | Maintenance-only, incompatible API | pydantic v2.9+ |
| `loguru` | Pretty for humans, not structured by default — harder for Node to parse | `structlog` with JSON renderer |
| `reportlab`, `fpdf2`, `weasyprint` | Re-open the "PDF from code" problem we're leaving behind with jspdf | LibreOffice `--convert-to pdf` |
| `click` / `typer` on the sidecar | Sidecar takes one JSON blob on stdin — no CLI flags | `sys.stdin.read()` + `json.loads` + Pydantic |
| `docxcompose` | Only needed for merging multi-docx into one; we render one template per PDF | — |
| `Jinja2<3.1.4` | Known sandbox-escape CVEs | 3.1.4+ |

## New Node.js Stack

Only one new npm dependency:

| Package | Pin | Purpose | Why this pin |
|---|---|---|---|
| `execa` | `^9.5.0` | Spawn the Python sidecar and `soffice.exe` with Promise API, stdin/stdout piping, timeouts, tree-kill on cancel, and safe Windows argument quoting for paths with spaces (`C:\Program Files\LibreOffice\program\soffice.exe`) | Execa 9 is ESM-first (aligns with Next.js 15 module resolution) and fixes the footguns of raw `child_process.spawn` on Windows: `shell:false` by default, proper quoting, `forceKillAfterDelay`. Used for BOTH the Python sidecar invocation AND the soffice call. |

### Node packages explicitly NOT to add

| Package | Reason | Instead |
|---|---|---|
| `python-shell` | Low-maintenance upstream; opinionated mode system; worse Windows quoting than execa; binary/large JSON piping harder | `execa` + a tiny internal wrapper (`lib/doc-pipeline/run-sidecar.ts`) |
| `node-python`, `python-bridge` | In-process CPython via FFI — a crash takes Next.js down, adds a build-time compiler dep, GIL interactions unpredictable | Out-of-process subprocess via execa |
| `zeromq` / `nanomsg` | Over-engineered for one short-lived render per request | JSON over stdin/stdout |
| npm registry wrappers (`regedit`, `winreg`, `node-winreg`) | Either shell out to `reg.exe` (flaky) or require a native rebuild; registry data for LibreOffice is unreliable (HKCU vs HKLM, WOW6432Node, portable installs) | Static candidate-path array + `fs.access` (see "LibreOffice Path Detection" below) |
| Alternate subprocess libs (`cross-spawn`, `spawn-please`) | Partial subsets of execa's functionality | `execa` |

## Installation

### Python (one-time per install, Windows cmd/PowerShell)

```powershell
# 1. From repo root — isolated venv so the app never touches system Python
py -3.12 -m venv .venv-docpipe

# 2. Activate
.\.venv-docpipe\Scripts\Activate.ps1

# 3. Upgrade pip + wheel (important for lxml wheel selection on Windows)
python -m pip install --upgrade pip wheel

# 4. Install pinned deps (put these in scripts/doc-pipeline/requirements.txt)
pip install ^
  "docxtpl>=0.19.1,<0.21.0" ^
  "python-docx>=1.1.2,<2.0.0" ^
  "Jinja2>=3.1.4,<4.0.0" ^
  "pydantic>=2.9.0,<3.0.0" ^
  "Babel>=2.16.0,<3.0.0" ^
  "python-slugify>=8.0.4,<9.0.0" ^
  "structlog>=24.4.0,<26.0.0" ^
  "tenacity>=9.0.0,<10.0.0"

# 5. Freeze for reproducibility
pip freeze > scripts/doc-pipeline/requirements.lock.txt
```

### Node.js

```bash
npm install execa@^9.5.0
```

No new dev dependencies. TypeScript, Vitest, and type packages are already present.

## Python venv Strategy for Windows

**Decision:** Per-repo venv at `./.venv-docpipe/`, added to `.gitignore`, bootstrapped by a `scripts/doc-pipeline/setup.ps1` + `setup.sh` pair; path committed to `.env.example` as `PYTHON_PATH=./.venv-docpipe/Scripts/python.exe`.

| Option | Verdict | Why |
|---|---|---|
| Per-repo `.venv-docpipe` (chosen) | ✓ | Deterministic path for Node to spawn; no conflict with lawyer's other Python; delete-to-reset; ships with the repo |
| System Python | ✗ | Pollutes lawyer's machine; version drift; pip permissions issues on Windows |
| `pipx` | ✗ | For CLI tools, not library bundles we import programmatically |
| `uv` / `poetry` / `pdm` | ✗ for v1.2 | Adds a new toolchain the user must install. Plain venv + requirements.txt needs zero extra deps. Revisit for v1.3+ if sidecar grows. |
| Conda / Miniconda | ✗ | Heavyweight; PATH-order conflicts with system Python; no gain here |
| PyInstaller frozen binary | ✗ for v1.2 | Loses transparency when debugging Jinja template errors; optimization for a later milestone |

### `.env` additions (to document in milestone README — not created by this agent)

```
PYTHON_PATH=./.venv-docpipe/Scripts/python.exe
LIBREOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.exe
DOC_PIPELINE_TIMEOUT_MS=30000
DOC_PIPELINE_RETRY_MAX=3
```

## LibreOffice Path Detection on Windows

**Decision:** Deterministic candidate-path array + `fs.promises.access(path, fs.constants.X_OK)`. **No npm package.**

**Rationale:** Registry detection is unreliable on Windows — LibreOffice writes to `HKLM\SOFTWARE\LibreOffice\UNO\InstallPath` *or* `HKCU\...`, 32-bit installs land under `WOW6432Node`, portable installs touch no registry at all. Every npm wrapper either shells out to `reg.exe` (another fragile subprocess) or uses a native addon (rebuild on Node upgrade). A static fallback list catches real-world installs with zero dependencies.

### Detection order (pseudocode — for roadmap, do not implement here)

```typescript
// lib/doc-pipeline/detect-libreoffice.ts
const candidates = [
  process.env.LIBREOFFICE_PATH,                                          // 1. explicit override
  "C:/Program Files/LibreOffice/program/soffice.exe",                     // 2. x64 default (current)
  "C:/Program Files (x86)/LibreOffice/program/soffice.exe",               // 3. legacy 32-bit
  "C:/Program Files/LibreOffice 24/program/soffice.exe",                  // 4. versioned install
  "C:/Program Files/LibreOffice 25/program/soffice.exe",                  // 5. versioned install
  `${process.env.LOCALAPPDATA}/Programs/LibreOffice/program/soffice.exe`, // 6. per-user install
].filter(Boolean);
```

Return the first path where `fs.access` succeeds. If none → banner: *"LibreOffice bulunamadı — [libreoffice.org](https://www.libreoffice.org) adresinden indirip kurun veya `.env` dosyasına `LIBREOFFICE_PATH` ekleyin."* (matches milestone spec: "kurulum kontrol + banner uyarı").

**Python side:** Mirror the same list in the sidecar as a fallback when `LIBREOFFICE_PATH` env is unset, so the sidecar is independently debuggable (`python sidecar.py < sample.json`).

## Node ↔ Python IPC Protocol

**Decision:** JSON over stdin/stdout; structured JSON logs over stderr. No sockets. No temp JSON files.

| Channel | Content | Rationale |
|---|---|---|
| Node → Python stdin | One JSON document: `{ template_path, output_path, context, meta }` | Single one-shot render per spawn; no streaming required at our scale |
| Python stdout → Node | One JSON document: `{ status, pdf_path, bytes, duration_ms, warnings[] }` | Execa captures full stdout; parse once |
| Python stderr → Node | One structlog JSON event per line | Node streams stderr, parses line-by-line, persists to `olay_gunlugu` |
| Exit code | Suggested taxonomy: 0 success, 1 validation (pydantic), 2 render (docxtpl/Jinja), 3 convert (soffice), 4 archive | Lets Node branch error handling without parsing strings; roadmap should lock the exact codes |

**Why not HTTP/gRPC/ZeroMQ:** Zero extra ports, zero Windows Firewall prompts, no long-lived process to manage across laptop sleep. Short-lived spawn-per-render is cheap at solo-user scale (<100 renders/day).

**Why not temp JSON files:** stdin is atomic and doesn't leak secrets in `%TEMP%`; no cleanup needed.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| LibreOffice headless (locked) | MS Word COM via pywin32 | Never in v1.2 — user has locked LibreOffice; reconsider only if PDF fidelity regresses on complex Word features |
| `docxtpl` (Jinja2-in-Word) | `python-docx` direct manipulation | If templates need programmatic layout (tables built at runtime); more code, less Word-authored flexibility. Skip for v1.2 |
| `pydantic` v2 | `attrs` + `cattrs`, plain `dataclasses` + manual validation | Team fluency + ecosystem weight favor pydantic; attrs is faster at very large scale but we validate <100 fields/render |
| `execa@9` | Native `child_process.spawn` | If avoiding one more dep were critical; execa's Windows quoting + timeout/tree-kill is worth it for a path that hits `C:\Program Files\...` |
| Per-repo venv | `uv` | v1.3 candidate if Python sidecar grows to 10+ deps |
| Static candidate-path list | Windows registry read | Never — registry wrappers are consistently flakier on Windows than path probes |
| LibreOffice 24.8 LTS | LibreOffice 25.2 Fresh | If user already has 25.2 installed — detection list covers both |

## Version Compatibility Matrix

| Pair | Status | Notes |
|---|---|---|
| docxtpl 0.19.x ↔ python-docx 1.1.2 | ✓ | Tested compatible |
| docxtpl 0.19.x ↔ Jinja2 3.1.4+ | ✓ | No changes to the Jinja2 Environment API affect docxtpl |
| pydantic 2.9+ ↔ Python 3.10 | ✓ | pydantic 2.9 officially supports 3.8+ |
| pydantic 2.9+ ↔ Python 3.13 | ⚠ | Transitive wheels can lag on 3.13 — prefer 3.12 for the venv |
| Babel 2.16 ↔ Python 3.10+ | ✓ | CLDR 45 bundled |
| python-slugify 8.0.4 ↔ text-unidecode | ✓ | Default backend; Apache license preserved |
| execa 9 ↔ Node 20 LTS | ✓ | Execa 9 requires Node ≥18; project is on 20 |
| LibreOffice 24.8 ↔ docxtpl output | ✓ | Reads Word 2007+ `.docx` output of docxtpl with fidelity for typical letterhead + paragraph + table templates |
| structlog 24 ↔ Python 3.10+ | ✓ | — |
| tenacity 9 ↔ everything | ✓ | Pure Python, no native deps |

## Stack Patterns by Variant

**If the lawyer installs LibreOffice Portable:**
- Set `LIBREOFFICE_PATH` manually in `.env`
- The static fallback list will miss it; accept this as an advanced-user scenario and document it

**If render performance becomes a problem (>5 s per doc):**
- Do NOT switch to a long-lived sidecar in v1.2 — complexity not justified
- Pre-warm the LibreOffice user profile once at app startup (`soffice --headless --terminate_after_init`) so first real render is fast
- Consider caching `docxtpl.DocxTemplate` per template in a persistent-mode sidecar — v1.3 only

**If Word opens the generated PDF with font issues:**
- Install `fonts-dejavu` (LibreOffice default substitutes) or ensure Word fonts used in the template are installed on the lawyer's machine — LibreOffice substitutes missing fonts silently

## What NOT to Use (consolidated)

| Avoid | Why | Use Instead |
|---|---|---|
| `unoconv` | Abandoned | `soffice --convert-to pdf` |
| `docx2pdf` | Inconsistent cross-platform backend | Same |
| `aspose-words`, `spire.doc` | Commercial, watermarks | LibreOffice |
| `pywin32` / `comtypes` + Word COM | Needs Word license; COM zombies | LibreOffice |
| `Unidecode` (GPL) | License | `text-unidecode` (python-slugify default) |
| `pydantic<2` | Maintenance-only, incompatible | pydantic v2.9+ |
| `loguru` | Not structured by default | `structlog` |
| `python-shell` | Stale + Windows quoting | `execa` |
| `node-python`, `python-bridge` | In-process FFI brittleness | `execa` subprocess |
| winreg npm wrappers | Flaky | Static candidate-path list |
| `reportlab`, `fpdf2`, `weasyprint`, `jspdf` | Re-opens the rendering-from-code problem | LibreOffice `--convert-to pdf` |
| Microsoft Store Python | Sandboxed path breaks venv subprocess | python.org installer |
| `Jinja2<3.1.4` | CVE-2024-56201 sandbox escape | 3.1.4+ |
| `docxcompose` | Not needed for single-template render | — |

## Sources

- `D:/sigorta-takip/.planning/PROJECT.md` — canonical milestone scope, locked dependencies, anti-features (HIGH)
- `D:/sigorta-takip/.claude/get-shit-done/templates/research-project/STACK.md` — output template (HIGH)
- Training data (January 2026 cutoff) — package lineage, license positions, API stability, CVE history, ecosystem reputations (MEDIUM — documented as such)
- **NOT consulted (tool access denied at research time):** Context7 MCP, PyPI JSON API via WebFetch, npm registry via WebFetch, Brave Search, generic WebSearch, ctx7 CLI via Bash. **Downstream roadmap author must run `pip index versions <pkg>` and `npm view execa versions --json` to confirm upper bounds haven't been exceeded by post-cutoff releases before writing the final `requirements.txt` and `package.json` entries.**
- User-referenced `C:/Users/Koese/Desktop/new 1.html` — **could not read** (filesystem permission denied). Sidecar design here is inferred from the feature list in PROJECT.md. If the HTML specifies deviating library or protocol choices, they are not reflected — recommend validating with the user that this pin list matches their design doc.

## Confidence Assessment

| Claim | Confidence | Reason |
|---|---|---|
| Package identity + roles (docxtpl, pydantic v2, Babel, etc.) | HIGH | Stable, well-known libraries in their respective domains |
| License safety (python-slugify → text-unidecode default, no GPL taint) | HIGH | Documented in python-slugify packaging |
| `Jinja2<3.1.4` has CVE-2024-56201/56326 sandbox escape — floor is 3.1.4 | HIGH | CVE well-publicized before training cutoff |
| Upper-bound version caps | MEDIUM | Conservative; needs `pip index versions` before requirements.txt is final |
| Lower-bound version floors | MEDIUM-HIGH | CVE/feature-driven (e.g., Jinja2 3.1.4, execa 9 for ESM); defensible |
| `execa@9` > `child_process` on Windows | HIGH | Execa's Windows argument quoting and tree-kill are well-known wins |
| `execa` > `python-shell` | MEDIUM-HIGH | python-shell is low-maintenance per last known status; verify latest activity before rejecting outright |
| Static LibreOffice path detection > registry parsing | HIGH | Registry wrappers for LibreOffice on Windows are consistently flakier than path probes in community reports |
| Per-repo venv > uv/poetry for v1.2 | MEDIUM | Opinionated but defensible for a solo-user desktop app; acceptable to revisit |
| Exit-code taxonomy (0/1/2/3/4) | LOW-MEDIUM | Suggested convention — roadmap should lock the exact codes |
| Microsoft Store Python breaks venv subprocess | MEDIUM-HIGH | Reported widely; worth calling out as a deployment gotcha |
| User's HTML design alignment with this stack | LOW | Could not read the referenced HTML — flag for user validation |

---
*Stack research for: v1.2 Şablon Belgeler — Python sidecar .docx → PDF pipeline on Windows 11*
*Researched: 2026-04-20*
*Confidence: MEDIUM (see assessment table)*
