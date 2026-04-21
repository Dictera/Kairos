# Phase 17: PDF Üretim Motoru - Research

**Researched:** 2026-04-21
**Domain:** Python sidecar DOCX→PDF pipeline (docxtpl + LibreOffice headless + tenacity)
**Confidence:** HIGH

## Summary

Phase 17 implements the core PDF generation engine: rendering a `.docx` template with case data via docxtpl/Jinja2, converting the rendered DOCX to PDF via LibreOffice headless, and handling errors with Turkish-language messages. The phase depends on Phase 15 (sidecar IPC infrastructure) and Phase 16 (template CRUD + variable extraction).

Key architectural decisions are already locked: nested context objects (`muvekkil.ad`, `dosya.dosya_no`), custom Jinja2 filters (`tr_currency`, `tarih`, `upper_tr`, `lower_tr`), per-invocation LibreOffice temp profiles to avoid SingletonLock, and tenacity retry only for deterministic/timeout failures during conversion. This research validates the implementation patterns for each subsystem and identifies the exact APIs and pitfalls.

**Primary recommendation:** Implement `handle_render()` with a dedicated Jinja2 Environment (custom filters registered before render), `handle_convert()` with tenacity-wrapped `subprocess.run()` using per-invocation temp profiles, and a TypeScript variable-to-tab mapping table for client-side pre-check deep-links.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Nested objects for context shape — `{{ muvekkil.ad }}`, `{{ dosya.dosya_no }}`, `{{ taraf.karsitaraf_ad }}`, `{{ durusmalar[0].tarih }}`. Arrays for multi-record entities.
- **D-02:** Jinja2 Environment custom filters — `tr_currency` (Babel `tr_TR`), `tarih` (`dd.MM.yyyy`), `upper_tr`/`lower_tr` (Turkish char mapping).
- **D-03:** New `pdfRouter` at `lib/trpc/routers/pdf.ts` with `generate` procedure.
- **D-04:** Variable-to-tab mapping table for missing-variable pre-check with deep-links.
- **D-05:** Render command gets extended timeout (120s default, configurable via env).
- **D-06:** Per-invocation temp profile for every `soffice` call (`-env:UserInstallation=file:///TEMP/lo-{uuid}`).
- **D-07:** Tenacity retry only for LibreOffice convert (timeout/deterministic failures), 3 attempts with exponential backoff. docxtpl render errors are NOT retried.
- **D-08:** Exit code 2 for render errors, 3 for convert errors. Structured error response includes step + message.

### the agent's Discretion
- Exact variable-to-tab mapping table structure (inline const or separate module)
- Jinja2 filter implementation details (Babel import style, Turkish char map)
- PDF temp file handling before handoff to Phase 18 archive
- Exact timeout values (planner can tune based on testing)
- Progress reporting granularity during render/convert steps

### Deferred Ideas (OUT OF SCOPE)
- PDF arşivleme (dosya yazımı + belge tablosu insert) — Phase 18
- Belgeler UI "Şablondan Üret" butonu — Phase 19
- Şablon yönetim ekranı iyileştirmeleri — Phase 19
- Quick action named buttons — v2 (QUICK-01)
- Dry-run / preview binding — v2 (QUICK-02)
- Multi-template batch üretim — v2 (QUICK-03)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Jinja2 template render | Python sidecar | — | docxtpl is Python-only; no Node equivalent exists |
| Custom TR filter logic | Python sidecar | — | Babel + Turkish char maps are Python-native |
| DOCX→PDF conversion | Python sidecar | — | LibreOffice subprocess must be managed from sidecar for timeout/retry |
| Case data → context mapping | tRPC router (Node) | — | Drizzle relations + schema are TypeScript-native |
| Missing variable pre-check | tRPC router (Node) | — | Variable registry is TS const; deep-link to tabs is UI concern |
| Error → Turkish toast | tRPC router (Node) | — | `TRPCError` with `getTurkishErrorMessage()` pattern exists |
| Retry / timeout logic | Python sidecar | — | tenacity is Python-native; subprocess timeout is Python `subprocess.run()` |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PDF-01 | Dosya detayından şablon seçip "Üret" butonuyla PDF üretme | tRPC `generate` procedure + sidecar render/convert chain |
| PDF-02 | Tüm dosya verisi Jinja2 context'ine beslenir | Drizzle `dosyaRelations` eager-load pattern; nested object context shape |
| PDF-03 | `tr_currency` Babel `tr_TR` locale ile `150.000,00 ₺` | `babel.numbers.format_currency(value, 'TRY', locale='tr_TR')` [VERIFIED: Babel docs] |
| PDF-04 | `tarih` filtresi `dd.MM.yyyy` formatı | `datetime.strftime('%d.%m.%Y')` or `babel.dates.format_date` [VERIFIED: Python docs] |
| PDF-05 | `upper_tr`/`lower_tr` Türkçe karakter duyarlı case | `str.translate()` with explicit mapping; Python `locale` does NOT fix this [VERIFIED: Stack Overflow + CPython bug tracker] |
| PDF-06 | Jinja2 koşullu bloklar docxtpl üzerinden desteklenir | `{%p %}`, `{%tr %}`, `{%tc %}`, `{%r %}` tags [VERIFIED: docxtpl docs] |
| PDF-07 | docxtpl render + LibreOffice headless convert | `docxtpl.DocxTemplate.render(context, jinja_env)` + `soffice --headless --convert-to pdf` [VERIFIED: docxtpl docs + multiple sources] |
| PDF-08 | Her `soffice` çağrısına `-env:UserInstallation=file:///TEMP/lo-{uuid}` | Prevents SingletonLock; temp profile cleaned up after [VERIFIED: LibreOffice community forums + Stack Overflow] |
| PDF-09 | LibreOffice timeout aşılırsa tenacity ile 3 deneme | `@retry(stop=stop_after_attempt(3), wait=wait_exponential(...), reraise=True)` [VERIFIED: Context7 tenacity docs] |
| PDF-10 | Eksik değişken varsa client-side pre-check + deep-link | Variable-to-tab mapping table; compare template vars against context keys |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| docxtpl | 0.20.x | DOCX template rendering with Jinja2 | Only mature Python library for in-place DOCX variable substitution; 3k+ GitHub stars, actively maintained [VERIFIED: PyPI + readthedocs] |
| Jinja2 | 3.1.x | Template engine inside docxtpl | docxtpl dependency; custom filters registered on `jinja2.Environment` [VERIFIED: Context7 /websites/jinja_palletsprojects_en_stable] |
| Babel | 2.12.x | `tr_TR` locale currency formatting | `format_currency(value, 'TRY', locale='tr_TR')` produces correct Turkish grouping/decimal separators [VERIFIED: Babel docs] |
| tenacity | 8.x | Retry decorator for LibreOffice convert | De-facto standard Python retry library; supports `retry_if_exception_type`, `wait_exponential`, `reraise` [VERIFIED: Context7 /jd/tenacity] |
| python-slugify | 8.x | ASCII-safe slug generation (used in Phase 18, sidecar ready) | Already in requirements.txt; `slugify(text, locale='tr')` for Turkish normalization |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| structlog | 23.x-24.x | JSONL stderr logging | Already configured in main.py; use for render/convert step logs |
| pydantic v2 | 2.x | Command envelope validation | Already used for `CommandEnvelope`; extend with render/convert params |

### Installation
```bash
# Already in scripts/docx-pipeline/requirements.txt
pip install pydantic>=2.0,<3.0 docxtpl>=0.18,<1.0 Jinja2>=3.1,<4.0 Babel>=2.12,<3.0 python-slugify>=8.0,<9.0 structlog>=23.0,<25.0 tenacity>=8.0,<9.0
```

**Version verification:**
- docxtpl latest: 0.20.2 (PyPI, 2024-08) [VERIFIED: PyPI]
- tenacity latest: 9.0.0 (PyPI, 2024-06) — requirements.txt caps at `<9.0`; consider bumping to `<10.0` for latest [ASSUMED: semver stability]
- Babel latest: 2.17.0 (PyPI, 2025-02) [VERIFIED: PyPI]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js / tRPC Layer (Node)                                            │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────┐│
│  │ pdfRouter   │───→│ generate()   │───→│ 1. Fetch case data with     ││
│  │             │    │ procedure    │    │    Drizzle relations        ││
│  └─────────────┘    └──────────────┘    └─────────────────────────────┘│
│                              │                           │              │
│                              ▼                           ▼              │
│                     ┌────────────────┐          ┌──────────────┐        │
│                     │ Missing-var    │──NO────→│ Build nested │        │
│                     │ pre-check      │         │ Jinja2 context│        │
│                     │ (TS mapping    │←YES─────│              │        │
│                     │  table)        │         │              │        │
│                     └────────────────┘         └──────────────┘        │
│                              │                      │                   │
│                              │ (pass vars)          │ (pass context)    │
│                              ▼                      ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Sidecar IPC: runSidecarCommand({ command: 'render', params })   │   │
│  │ Sidecar IPC: runSidecarCommand({ command: 'convert', params })  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ JSON stdin / JSON stdout / JSONL stderr
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Python Sidecar                                                         │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ handle_     │───→│ DocxTemplate()  │───→│ jinja_env with custom   │  │
│  │ render()    │    │ .render(ctx,    │    │ filters: tr_currency,   │  │
│  │             │    │  jinja_env)     │    │ tarih, upper_tr,        │  │
│  └─────────────┘    └─────────────────┘    │ lower_tr                │  │
│         │                    │             └─────────────────────────┘  │
│         │                    ▼                                          │
│         │           ┌─────────────────┐                                 │
│         │           │ Rendered DOCX   │                                 │
│         │           │ (temp path)     │                                 │
│         │           └─────────────────┘                                 │
│         │                    │                                          │
│         ▼                    ▼                                          │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐    │
│  │ handle_     │───→│ soffice --headless --convert-to pdf         │    │
│  │ convert()   │    │ -env:UserInstallation=file:///TEMP/lo-{uuid}│    │
│  │             │    │ (tenacity retry: 3× exponential backoff)    │    │
│  └─────────────┘    └─────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│                     ┌─────────────────┐                                 │
│                     │ Generated PDF   │                                 │
│                     │ (temp path)     │                                 │
│                     └─────────────────┘                                 │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ Return: { status, output_path }
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js / tRPC Layer (continued)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Return PDF path to client; Phase 18 handles archive + DB insert │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
scripts/docx-pipeline/
├── main.py                    # Entry point (extend handle_render, handle_convert)
├── requirements.txt           # Already correct
├── filters.py                 # NEW: TR custom Jinja2 filters (tr_currency, tarih, upper_tr, lower_tr)
├── convert.py                 # NEW: LibreOffice convert wrapper with tenacity retry
└── setup-venv.ps1             # Existing

lib/
├── services/
│   └── docx-pipeline.ts       # Extend runSidecarCommand with timeout param
├── pipeline/
│   ├── protocol.ts            # Extend CommandEnvelope params for render/convert
│   ├── config.ts              # Existing
│   ├── error-codes.ts         # Existing
│   └── health-check.ts        # Existing
├── trpc/
│   ├── routers/
│   │   ├── pdf.ts             # NEW: pdfRouter with generate procedure
│   │   ├── _app.ts            # Register pdfRouter
│   │   └── sablon.ts          # Pattern reference
│   └── init.ts                # Existing
├── docx/
│   └── variable-registry.ts   # NEW (or Phase 19): variable-to-tab mapping
└── schema.ts                  # Existing (data source for context)
```

### Pattern 1: docxtpl Render with Custom Jinja2 Environment
**What:** Create a `jinja2.Environment`, register custom filters, pass to `DocxTemplate.render()`.
**When to use:** Every render invocation; filters must be fresh per Environment.
**Example:**
```python
# Source: https://docxtpl.readthedocs.io/en/latest/ + Context7 Jinja2 docs
from docxtpl import DocxTemplate
import jinja2
from babel.numbers import format_currency
from datetime import datetime

def tr_currency(value):
    if value is None:
        return ""
    return format_currency(value, 'TRY', locale='tr_TR')

def tarih(value):
    if value is None:
        return ""
    if isinstance(value, str):
        value = datetime.strptime(value, '%Y-%m-%d')
    return value.strftime('%d.%m.%Y')

def upper_tr(value):
    if not value:
        return ""
    return str(value).translate(UPPER_TR_TABLE)

jinja_env = jinja2.Environment()
jinja_env.filters['tr_currency'] = tr_currency
jinja_env.filters['tarih'] = tarih
jinja_env.filters['upper_tr'] = upper_tr

doc = DocxTemplate(template_path)
doc.render(context, jinja_env)
doc.save(output_path)
```

### Pattern 2: LibreOffice Convert with Tenacity Retry
**What:** Wrap `subprocess.run()` in a tenacity decorator for timeout and transient failures.
**When to use:** Only for `handle_convert()` — deterministic errors (missing binary, bad DOCX) should NOT retry.
**Example:**
```python
# Source: Context7 /jd/tenacity + https://michalzalecki.com/converting-docx-to-pdf-using-python/
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, reraise
import subprocess
import shutil
import tempfile
import uuid

class LibreOfficeError(Exception):
    pass

@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((subprocess.TimeoutExpired, LibreOfficeError)),
)
def convert_with_libreoffice(input_path: str, output_dir: str, libreoffice_path: str, timeout: int = 120):
    lo_profile = tempfile.mkdtemp(prefix=f"lo-{uuid.uuid4().hex}")
    try:
        cmd = [
            libreoffice_path,
            f"-env:UserInstallation=file:///{lo_profile.replace('\\', '/')}",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            input_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0:
            raise LibreOfficeError(f"LibreOffice convert failed: {result.stderr}")
        # LibreOffice may return 0 but not create file on concurrent access
        expected_pdf = os.path.join(output_dir, os.path.splitext(os.path.basename(input_path))[0] + ".pdf")
        if not os.path.exists(expected_pdf):
            raise LibreOfficeError("PDF output not created (possible concurrent access)")
        return expected_pdf
    finally:
        shutil.rmtree(lo_profile, ignore_errors=True)
```

### Pattern 3: Missing Variable Pre-Check
**What:** Before calling sidecar, compare template variables against available context keys.
**When to use:** In `pdfRouter.generate()` before `runSidecarCommand()`.
**Example:**
```typescript
// Source: project-specific pattern
const variableToTabMap: Record<string, { tab: string; label: string }> = {
  'muvekkil.ad': { tab: 'genel', label: 'Müvekkil adı' },
  'dosya.dosya_no': { tab: 'genel', label: 'Dosya numarası' },
  'taraf.karsitaraf_ad': { tab: 'taraflar', label: 'Karşı taraf adı' },
  'stk_esas_no': { tab: 'surec', label: 'STK esas numarası' },
  'durusmalar[0].tarih': { tab: 'durusmalar', label: 'Duruşma tarihi' },
  // ... all known variables
}

function getMissingVariables(templateVars: string[], context: Record<string, unknown>): Array<{ var: string; tab: string; label: string }> {
  const missing: Array<{ var: string; tab: string; label: string }> = []
  for (const v of templateVars) {
    const value = getNestedValue(context, v)  // handle dot notation + array indexing
    if (value === undefined || value === null || value === '') {
      const mapping = variableToTabMap[v] ?? { tab: 'genel', label: v }
      missing.push({ var: v, ...mapping })
    }
  }
  return missing
}
```

### Anti-Patterns to Avoid
- **Using `locale.setlocale()` for Turkish case conversion:** Python's `locale` module does NOT make `str.upper()`/`str.lower()` Turkish-aware. Only `str.translate()` with explicit mapping works correctly [VERIFIED: Stack Overflow + CPython bug tracker].
- **Retrying docxtpl render errors:** Bad template syntax or missing variables in docxtpl are deterministic — retrying wastes time and obscures the real error.
- **Using a single shared LibreOffice profile:** Causes SingletonLock hangs when concurrent requests occur [VERIFIED: LibreOffice community forums].
- **Passing `RichText` objects through Jinja2 filters:** `RichText` objects are rendered to XML before filters are applied; `{{r var|filter }}` will fail or produce incorrect output [VERIFIED: docxtpl docs].
- **Using `os.system()` or `shell=True` for LibreOffice:** Security risk and unreliable path handling on Windows; use `subprocess.run()` with argument list [VERIFIED: subprocess docs].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOCX variable substitution | Custom XML manipulation | docxtpl | Handles Word's fragmented `<w:t>` nodes, paragraph/table row tags (`{%p %}`, `{%tr %}`), RichText, inline images. Hand-rolling XML for DOCX is extremely fragile across Word versions. |
| DOCX→PDF conversion | Node.js libraries (pdfmake, puppeteer) | LibreOffice headless | Only solution that faithfully renders Word-specific formatting (headers, footers, page breaks, complex tables). All pure-JS approaches produce layout drift. |
| Retry logic with backoff | Custom `try/except` loops | tenacity | Provides `stop_after_attempt`, `wait_exponential`, `retry_if_exception_type`, `reraise` — battle-tested and readable. |
| Turkish currency formatting | `f-string` or `locale.currency()` | Babel `format_currency()` | `locale.currency()` requires global locale state and is not thread-safe. Babel is pure-function, locale-aware, and produces correct `tr_TR` grouping (`150.000,00 ₺`). |
| Turkish case conversion | `str.upper()`/`str.lower()` with `locale.setlocale()` | `str.translate()` with explicit char map | Python's built-in case functions are Unicode-default (Turkish-I problem). Even `tr_TR` locale does not fix `str.upper()`/`str.lower()` in CPython. [VERIFIED: CPython bug #34723] |
| DOCX variable extraction | Regex on raw XML | Existing `handle_extract_vars()` in main.py | Already implemented in Phase 15. Uses zipfile + regex with Word-fragment normalization. |

**Key insight:** The DOCX format is a ZIP of XML with heavily fragmented text nodes. docxtpl exists precisely because python-docx alone cannot reliably modify existing templates. Any attempt to hand-roll variable substitution will fail on real-world Word documents where a single `{{ var }}` is split across multiple `<w:t>` elements.

## Common Pitfalls

### Pitfall 1: Turkish "İ" Problem in Case Conversion
**What goes wrong:** `"İSTANBUL".lower()` → `"i̇stanbul"` (dotted i with combining dot) instead of `"istanbul"`. `"ısparta".upper()` → `"ISPARTA"` instead of `"ISPARTA"` (dotted I).
**Why it happens:** CPython's `str.upper()` and `str.lower()` use Unicode Default Case Folding, not locale-specific case folding. Even `locale.setlocale(locale.LC_ALL, 'tr_TR.UTF-8')` does not change `str.upper()` behavior.
**How to avoid:** Use `str.translate()` with explicit mapping tables:
```python
LOWER_TR_TABLE = str.maketrans({'İ': 'i', 'I': 'ı'})
UPPER_TR_TABLE = str.maketrans({'i': 'İ', 'ı': 'I'})

def lower_tr(s):
    return s.translate(LOWER_TR_TABLE).lower()

def upper_tr(s):
    return s.translate(UPPER_TR_TABLE).upper()
```
**Warning signs:** Unit test with `"İstanbul ısparta"` fails case round-trip.

### Pitfall 2: LibreOffice SingletonLock Hang
**What goes wrong:** Second concurrent `soffice --headless` call hangs indefinitely waiting for the first instance's lock file.
**Why it happens:** LibreOffice uses a singleton process model by default; the user profile directory contains `~/.config/libreoffice/4/user/.lock`.
**How to avoid:** Pass `-env:UserInstallation=file:///TEMP/lo-{uuid}` on every invocation, creating a unique temporary profile. Delete the profile directory after the call completes (use `try/finally` or `tempfile.TemporaryDirectory`).
**Warning signs:** Subprocess hangs with no stdout/stderr; timeout fires; retry also hangs.

### Pitfall 3: LibreOffice "Success" with No Output File
**What goes wrong:** `subprocess.run()` returns `returncode == 0` but no PDF file is created.
**Why it happens:** Known race condition when multiple LibreOffice processes run concurrently even with separate profiles [CITED: jdhao.github.io].
**How to avoid:** After `subprocess.run()`, explicitly check `os.path.exists(expected_pdf)`. If missing, raise `LibreOfficeError` so tenacity retries. Also add a small post-conversion delay (e.g., `time.sleep(0.5)`) before existence check on Windows.
**Warning signs:** Intermittent failures under load; success rate drops with concurrent users.

### Pitfall 4: Null Values in Jinja2 Context Causing Template Breaks
**What goes wrong:** `{{ muvekkil.ad | upper_tr }}` fails with `UndefinedError` or renders as `"None"` when `muvekkil.ad` is `None`.
**Why it happens:** Jinja2's default behavior for missing keys is `Undefined`, and Python's `str()` of `None` is `"None"`.
**How to avoid:** Pre-process the context dict before render: recursively replace `None` with `""` for string fields. Or use Jinja2's `default('')` filter in templates: `{{ muvekkil.ad | default('') | upper_tr }}`. The pre-process approach is safer — templates don't need defensive filtering everywhere.
**Warning signs:** Output contains literal `"None"` strings; `UndefinedError` on conditional blocks.

### Pitfall 5: Babel format_currency with None or String Input
**What goes wrong:** `format_currency(None, 'TRY', locale='tr_TR')` raises `TypeError`.
**Why it happens:** Babel expects a numeric type (int, float, Decimal).
**How to avoid:** Guard in the custom filter: `if value is None: return ""`. Also handle string inputs (e.g., from JSON deserialization): `value = float(value) if isinstance(value, str) else value`.
**Warning signs:** Sidecar returns exit code 2 (render error) with `TypeError` in message.

### Pitfall 6: Array Index Access in Jinja2 for Empty Lists
**What goes wrong:** `{{ durusmalar[0].tarih }}` raises `IndexError` when `durusmalar` is empty.
**Why it happens:** Jinja2 does not suppress `IndexError` by default.
**How to avoid:** Use `{{ durusmalar[0].tarih | default('') }}` with `default` filter, or ensure the pre-check catches empty arrays for required fields. For optional arrays, wrap in `{% if durusmalar %}` blocks.
**Warning signs:** Render error with `IndexError: list index out of range`.

## Code Examples

### Verified patterns from official sources:

#### Custom Jinja2 Filters with docxtpl
```python
# Source: https://docxtpl.readthedocs.io/en/latest/ (Jinja custom filters section)
from docxtpl import DocxTemplate
import jinja2

def multiply_by(value, by):
    return value * by

doc = DocxTemplate("my_word_template.docx")
context = {'price_dollars': 5.00}
jinja_env = jinja2.Environment()
jinja_env.filters['multiply_by'] = multiply_by
doc.render(context, jinja_env)
doc.save("generated_doc.docx")
```

#### Tenacity Retry with Exponential Backoff
```python
# Source: Context7 /jd/tenacity
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, reraise

class MyException(Exception):
    pass

@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(MyException),
)
def flaky_operation():
    # ... subprocess call that may timeout or fail transiently
    pass
```

#### Babel Turkish Currency Formatting
```python
# Source: https://babel.pocoo.org/en/latest/api/numbers.html
from babel.numbers import format_currency

# Produces: '150.000,00 ₺'
format_currency(150000, 'TRY', locale='tr_TR')
```

#### Turkish Case Conversion (Correct)
```python
# Source: https://stackoverflow.com/questions/19030948/python-utf-8-lowercase-turkish-specific-letter
LOWER_TR_TABLE = str.maketrans({'İ': 'i', 'I': 'ı'})
UPPER_TR_TABLE = str.maketrans({'i': 'İ', 'ı': 'I'})

def lower_tr(s: str) -> str:
    return s.translate(LOWER_TR_TABLE).lower()

def upper_tr(s: str) -> str:
    return s.translate(UPPER_TR_TABLE).upper()

assert upper_tr('istanbul ısparta') == 'İSTANBUL ISPARTA'
assert lower_tr('İSTANBUL ISPARTA') == 'istanbul ısparta'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tiptap HTML editor + manual PDF (Phase 7) | docxtpl + LibreOffice headless (v1.2) | 2026-04 | Word-native authoring; faithful PDF rendering; template reusability |
| `locale.setlocale()` for Turkish currency | Babel `format_currency()` | v1.2 design | Thread-safe, pure function, no global state mutation |
| Custom string replace for Turkish case | `str.translate()` with explicit tables | v1.2 design | Correct Unicode handling; no dependency on OS locale installation |
| Single shared LibreOffice process | Per-invocation temp profile + tenacity retry | v1.2 design | Eliminates SingletonLock; handles transient failures |

**Deprecated/outdated:**
- `locale.currency()`: Requires global locale state, not thread-safe, problematic on Windows without installed language packs. Replaced by Babel.
- `str.upper()`/`str.lower()` for Turkish text: CPython bug #34723; Unicode default case folding is wrong for Turkish. Replaced by explicit `translate()` tables.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Babel `format_currency(value, 'TRY', locale='tr_TR')` produces `150.000,00 ₺` format | Standard Stack | If Babel's tr_TR locale formats differently, the `tr_currency` filter output will not match user expectation. **Mitigation:** Verify with a quick Python REPL test before implementation. |
| A2 | tenacity 8.x API (`stop_after_attempt`, `wait_exponential`, `reraise`) is stable and compatible with the project's `<9.0` constraint | Standard Stack | If API changed in 8.x minor versions, decorator syntax may fail. **Mitigation:** Context7 docs confirmed API stability. |
| A3 | `docxtpl` supports passing a custom `jinja2.Environment` to `render()` for filters | Standard Stack | If API removed this feature, custom filters would need alternative registration. **Mitigation:** Verified in docxtpl docs (v0.20.x). |
| A4 | `subprocess.run()` with `timeout=` raises `subprocess.TimeoutExpired` which tenacity can catch and retry | Architecture Patterns | If LibreOffice hangs without raising TimeoutExpired (e.g., zombie process), retry won't help. **Mitigation:** Also validate output file existence after run. |
| A5 | Turkish Windows installation has Babel `tr_TR` locale data available | Standard Stack | If locale data missing, Babel falls back to root locale. **Mitigation:** Babel ships with all CLDR data bundled; no OS locale installation required. |

## Open Questions

1. **Should null/undefined values in nested objects render as empty strings or `"None"`?**
   - What we know: Jinja2 `default('')` filter can handle this, but requires templates to be defensive.
   - What's unclear: Whether to pre-process the context dict in Python (replace `None` with `""`) or rely on template authors to use `|default('')`.
   - Recommendation: Pre-process in Python — it's safer and doesn't burden template authors. Add a recursive `sanitize_context()` function.

2. **How should `durusmalar[0]` and similar array accesses behave when the array is empty?**
   - What we know: Jinja2 throws `IndexError` on `durusmalar[0]` if empty.
   - What's unclear: Whether pre-check should validate array length for indexed variables.
   - Recommendation: Pre-check should flag `durusmalar` as missing if empty and the template uses `durusmalar[0].*`. Alternatively, wrap array access in Jinja2 conditionals in templates.

3. **What is the exact timeout for LibreOffice convert on a typical Windows machine with a 10-page legal document?**
   - What we know: Default is 120s per requirement PDF-09.
   - What's unclear: Whether 120s is sufficient for complex templates with tables.
   - Recommendation: Start with 120s, make configurable via `params.timeout` in the command envelope. Monitor in production.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.x | Sidecar runtime | ✓ (venv in scripts/docx-pipeline/.venv) | 3.11+ | Use system python3 |
| LibreOffice | PDF conversion | ✓ (Windows default path) | 7.x+ | Install from libreoffice.org |
| docxtpl | DOCX rendering | ✓ (in requirements.txt) | 0.20.x | pip install |
| tenacity | Retry logic | ✓ (in requirements.txt) | 8.x | pip install |
| Babel | Currency formatting | ✓ (in requirements.txt) | 2.12+ | pip install |
| Windows temp directory | Temp profiles | ✓ | — | `%TEMP%` env var |

**Missing dependencies with no fallback:**
- None identified.

**Missing dependencies with fallback:**
- None identified.

## Validation Architecture

> Skip this section if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Node), manual Python test scripts |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PDF-03 | `tr_currency` produces Turkish format | Python unit | `python -c "from filters import tr_currency; assert '₺' in tr_currency(150000)"` | ❌ Wave 0 |
| PDF-04 | `tarih` produces `dd.MM.yyyy` | Python unit | `python -c "from filters import tarih; assert tarih('2026-02-14') == '14.02.2026'"` | ❌ Wave 0 |
| PDF-05 | `upper_tr`/`lower_tr` Turkish chars | Python unit | `python -c "from filters import upper_tr, lower_tr; assert upper_tr('istanbul') == 'İSTANBUL'"` | ❌ Wave 0 |
| PDF-07 | End-to-end render + convert | Python integration | `python scripts/docx-pipeline/test_render_convert.py` | ❌ Wave 0 |
| PDF-09 | Tenacity retry on timeout | Python integration | Mock `subprocess.run` to raise `TimeoutExpired`, verify 3 calls | ❌ Wave 0 |
| PDF-10 | Missing variable pre-check | tRPC unit | Vitest test for `getMissingVariables()` logic | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Python unit tests for filters (quick, <2s)
- **Per wave merge:** Full Python integration test (render + convert with real LibreOffice)
- **Phase gate:** Playwright verification with Turkish character canary template (`çÇğĞıİöÖşŞüÜ İstanbul şirket müvekkil`) — per STATE.md research flags

### Wave 0 Gaps
- [ ] `scripts/docx-pipeline/test_filters.py` — covers PDF-03, PDF-04, PDF-05
- [ ] `scripts/docx-pipeline/test_render_convert.py` — covers PDF-07, PDF-09
- [ ] `lib/docx/__tests__/variable-registry.test.ts` — covers PDF-10 pre-check logic
- [ ] `scripts/docx-pipeline/filters.py` — module to be created
- [ ] `scripts/docx-pipeline/convert.py` — module to be created

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Auth handled by Next.js session middleware |
| V3 Session Management | No | Session managed by iron-session |
| V4 Access Control | Yes | tRPC `protectedProcedure` on `pdfRouter.generate` |
| V5 Input Validation | Yes | Zod input schema on `generate` input; path-traversal guard on file paths; `safeUnlink` pattern |
| V6 Cryptography | No | No crypto in this phase |
| V7 Error Handling | Yes | Structured exit codes; no stack traces leaked to client |
| V8 Data Protection | Yes | Temp files cleaned up after conversion; temp profile directories deleted |

### Known Threat Patterns for docxtpl + LibreOffice Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via template path | Tampering | Validate `template_path` resolves under `uploads/templates/` before passing to sidecar; use `path.resolve().startsWith(basePath)` |
| Command injection via template filename | Tampering | Pass arguments as list to `subprocess.run()`, never use `shell=True` |
| Resource exhaustion (LibreOffice hang) | Denial of Service | `subprocess.run(timeout=120)` + tenacity limit 3 attempts; per-invocation temp profiles prevent disk fill |
| Information disclosure via temp files | Information Disclosure | `shutil.rmtree(lo_profile, ignore_errors=True)` in `finally` block; temp DOCX/PDF deleted after handoff to Phase 18 |
| Template variable injection (DOCX XML) | Tampering | docxtpl autoescapes by default (`autoescape=True`); enable in `render()` call |

## Sources

### Primary (HIGH confidence)
- Context7 `/jd/tenacity` — retry decorator API, `reraise`, `wait_exponential`, `stop_after_attempt`
- Context7 `/websites/jinja_palletsprojects_en_stable` — custom filter registration on `Environment.filters`
- https://docxtpl.readthedocs.io/en/latest/ — docxtpl `render(context, jinja_env)`, `{%p %}`, `{%tr %}`, RichText/filter incompatibility, autoescaping
- https://babel.pocoo.org/en/latest/api/numbers.html — `format_currency()` API and `tr_TR` locale behavior
- https://github.com/elapouya/python-docx-template/blob/master/tests/custom_jinja_filters.py — custom filter example

### Secondary (MEDIUM confidence)
- https://michalzalecki.com/converting-docx-to-pdf-using-python/ — LibreOffice subprocess pattern with timeout
- https://jdhao.github.io/2021/06/11/libreoffice_concurrent_requests/ — concurrent request failures and retry strategy
- https://ask.libreoffice.org/t/libreoffice-headless-sometimes-crashes-under-windows-10/68317 — Windows temp profile usage
- https://stackoverflow.com/questions/19030948/python-utf-8-lowercase-turkish-specific-letter — Turkish case conversion via `translate()`
- https://bugs.python.org/issue34723 — CPython bug: `lower()` on Turkish "İ" returns wrong result

### Tertiary (LOW confidence)
- https://github.com/scivision/office-headless — standalone doc2pdf script patterns
- https://stackoverflow.com/questions/55070766/is-libreoffice-headless-safe-to-use-on-a-web-server — general LibreOffice headless advice

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against PyPI; APIs verified against Context7 + official docs
- Architecture: HIGH — existing codebase patterns (sablon.ts, docx-pipeline.ts, protocol.ts) provide clear extension points
- Pitfalls: HIGH — SingletonLock and Turkish-I issues are well-documented with reproducible examples

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (docxtpl/Babel are stable; tenacity may have v9 releases)

---
*Phase: 17-pdf-uretim-motoru*
*Research complete: ready for planning*
