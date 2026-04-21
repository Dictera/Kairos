---
phase: 17-pdf-uretim-motoru
plan: 01
type: execute
completed: "2026-04-21"
---

# Plan 17-01 Summary: Python Sidecar Render & Convert

## Objective
Implement the Python sidecar's core rendering and conversion pipeline: Jinja2 custom filters for Turkish locale, docxtpl template rendering, and LibreOffice headless PDF conversion with tenacity retry and per-invocation temp profiles.

## Tasks Completed

### Task 1: TR Custom Jinja2 Filters Module
- **File:** `scripts/docx-pipeline/filters.py`
- Implemented `tr_currency` using `babel.numbers.format_currency` with `tr_TR` locale
- Implemented `tarih` for ISO string / datetime / date → `dd.MM.yyyy`
- Implemented `upper_tr` and `lower_tr` with Turkish-specific `i↔İ` and `ı↔I` mappings
- All functions guard against `None` and empty string inputs

### Task 2: LibreOffice Convert Wrapper with Tenacity Retry
- **File:** `scripts/docx-pipeline/convert.py`
- `LibreOfficeError` custom exception for convert failures
- `convert_with_libreoffice` decorated with `@retry`:
  - Max 3 attempts with exponential backoff (1×, 4–10s)
  - Retries on `subprocess.TimeoutExpired` and `LibreOfficeError`
  - `reraise=True` propagates the original exception after max attempts
- Per-invocation temp profile via `tempfile.mkdtemp(prefix="lo-{uuid}")`
- Command built as list (no `shell=True`)
- Profile cleanup in `finally` block via `shutil.rmtree`

### Task 3: Wire handle_render and handle_convert into main.py
- **File:** `scripts/docx-pipeline/main.py`
- `handle_render`: validates params, creates Jinja2 env with 4 custom filters, sanitizes context (recursively replaces `None` → `""`), renders via `DocxTemplate`, saves output
- `handle_convert`: validates params, calls `convert_with_libreoffice`, returns PDF path
- Error handling:
  - Code 1 for missing/validation errors
  - Code 2 for render errors
  - Code 3 for convert errors (including timeout after retries)
  - Code 99 for unexpected errors
- Existing `handle_health_check` and `handle_extract_vars` unchanged

## Verification
- `python test_filters.py` → all 10 assertions pass
- `python -c "import main; import convert; import filters"` → no import errors
- `main.py` still handles `health-check` and `extract-vars` correctly

## Deviations
- None

## Key Files Created/Modified
| File | Action |
|------|--------|
| `scripts/docx-pipeline/filters.py` | Created |
| `scripts/docx-pipeline/test_filters.py` | Created |
| `scripts/docx-pipeline/convert.py` | Created |
| `scripts/docx-pipeline/main.py` | Modified (added handle_render + handle_convert) |

## Commits
- `7822c80` test(17-01): add failing test for Turkish Jinja2 filters
- `13106ce` feat(17-01): implement Turkish Jinja2 custom filters
- `a3ea078` feat(17-01): add LibreOffice DOCX-to-PDF converter with tenacity retry
- `c6834b2` feat(17-01): wire handle_render and handle_convert into main.py
- `258b6ce` docs(17-01): complete PDF render & convert plan
