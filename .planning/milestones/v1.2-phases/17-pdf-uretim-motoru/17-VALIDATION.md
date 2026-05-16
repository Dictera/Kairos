# Phase 17: PDF Üretim Motoru — Plan Validation Report

**Validated:** 2026-04-21  
**Validator:** gsd-plan-checker  
**Phase Directory:** `.planning/phases/17-pdf-uretim-motoru/`  
**Plans Checked:** 4 (17-01, 17-02, 17-03, 17-04)

---

## Executive Summary

| Metric | Result |
|--------|--------|
| Overall Status | **PASS with warnings** |
| Blockers | 0 |
| Warnings | 2 |
| Info | 1 |
| Requirements Coverage (PDF-01..PDF-10) | 10/10 ✅ |
| Decision Coverage (D-01..D-08) | 8/8 ✅ |
| Dependency Graph | Acyclic, wave-ordered ✅ |
| Scope Sanity | All plans ≤ 3 tasks, ≤ 4 files ✅ |
| Deferred Items | None included ✅ |

**Recommendation:** **PROCEED** with execution. Address warnings before or during execution.

---

## Per-Plan Status

| Plan | Wave | Tasks | Files | Status | Notes |
|------|------|-------|-------|--------|-------|
| **17-01** | 1 | 3 | 4 | **PASS** | Python sidecar filters + convert + wiring |
| **17-02** | 1 | 2 | 4 | **PASS** | Protocol extension + variable registry |
| **17-03** | 2 | 3 | 4 | **PASS** | pdfRouter + context builder + registration |
| **17-04** | 3 | 2 | 2 | **PASS** | Integration test + human verification checkpoint |

---

## Coverage Matrix

### Requirements → Plans

| Requirement | Description | Plan(s) | Task(s) | Status |
|-------------|-------------|---------|---------|--------|
| **PDF-01** | Dosya detayından şablon seçip "Üret" butonuyla PDF üretme | 17-03 | Task 2 (`pdfRouter.generate`) | ✅ Covered |
| **PDF-02** | Tüm dosya verisi Jinja2 context'ine beslenir | 17-03 | Task 1 (`buildJinja2Context`) | ✅ Covered |
| **PDF-03** | `tr_currency` Babel `tr_TR` locale ile `150.000,00 ₺` | 17-01 | Task 1 (`filters.py:tr_currency`) | ✅ Covered |
| **PDF-04** | `tarih` filtresi `dd.MM.yyyy` formatı | 17-01 | Task 1 (`filters.py:tarih`) | ✅ Covered |
| **PDF-05** | `upper_tr`/`lower_tr` Türkçe karakter duyarlı case | 17-01 | Task 1 (`filters.py:upper_tr`, `lower_tr`) | ✅ Covered |
| **PDF-06** | Jinja2 koşullu bloklar docxtpl üzerinden desteklenir | 17-04 | Task 1 (canary template `{% if %}`, `{% for %}`) | ✅ Covered |
| **PDF-07** | docxtpl render + LibreOffice headless convert | 17-01 | Task 3 (`handle_render`, `handle_convert`) | ✅ Covered |
| **PDF-08** | Her `soffice` çağrısına `-env:UserInstallation=file:///TEMP/lo-{uuid}` | 17-01 | Task 2 (`convert.py` temp profile) | ✅ Covered |
| **PDF-09** | LibreOffice timeout aşılırsa tenacity ile 3 deneme | 17-01 | Task 2 (`convert.py` `@retry`) | ✅ Covered |
| **PDF-10** | Eksik değişken varsa client-side pre-check + deep-link | 17-02, 17-03 | 17-02 Task 2 (`getMissingVariables`), 17-03 Task 2 (pre-check in `generate`) | ✅ Covered |

### Decisions → Plans

| Decision | Description | Plan(s) | Task(s) | Status |
|----------|-------------|---------|---------|--------|
| **D-01** | Nested objects context shape (`muvekkil.ad`, `dosya.dosya_no`, …) | 17-02, 17-03 | 17-02 Task 2 (`VARIABLE_REGISTRY` paths), 17-03 Task 1 (`buildJinja2Context` shape) | ✅ Covered |
| **D-02** | Jinja2 Environment custom filters (`tr_currency`, `tarih`, `upper_tr`, `lower_tr`) | 17-01 | Task 1 (`filters.py`), Task 3 (register in `jinja_env`) | ✅ Covered |
| **D-03** | New `pdfRouter` at `lib/trpc/routers/pdf.ts` | 17-03 | Task 2 (`pdfRouter` creation), Task 3 (`_app.ts` registration) | ✅ Covered |
| **D-04** | Variable-to-tab mapping table for missing-variable pre-check | 17-02, 17-03 | 17-02 Task 2 (`VARIABLE_REGISTRY`, `getMissingVariables`), 17-03 Task 2 (pre-check call) | ✅ Covered |
| **D-05** | Render command extended timeout (120s default) | 17-01, 17-02, 17-03 | 17-01 Task 2 (`timeout=120`), 17-02 Task 1 (`timeout?: number`), 17-03 Task 2 (120s / 180s envelope) | ✅ Covered |
| **D-06** | Per-invocation LibreOffice temp profile | 17-01 | Task 2 (`convert.py` `lo-{uuid}` profile) | ✅ Covered |
| **D-07** | Tenacity retry only for LibreOffice convert (3× exponential backoff) | 17-01 | Task 2 (`@retry` on `convert_with_libreoffice`); render errors NOT retried | ✅ Covered |
| **D-08** | Exit code 2 for render, 3 for convert; structured error + TR toast | 17-01, 17-03 | 17-01 Task 3 (return codes 2, 3 in main.py), 17-03 Task 2 (`TRPCError` with Turkish messages) | ✅ Covered |

---

## Validation Dimensions

### Dimension 1: Requirement Coverage ✅
All 10 PDF requirements (PDF-01 through PDF-10) are explicitly mapped to plan tasks via `requirements` frontmatter and task actions. No requirement is orphaned.

### Dimension 2: Task Completeness ✅
All `<task>` elements have required fields:
- `auto` tasks: `<files>`, `<action>`, `<verify>`, `<done>` — all present
- `checkpoint:human-verify` (17-04 Task 2): correctly exempt from file/action/verify/done requirements
- TDD tasks (17-01 Task 1, 17-02 Task 2): include `<behavior>` with explicit test cases

### Dimension 3: Dependency Correctness ✅
Dependency graph:
```
17-01 (wave 1) ─┐
                ├──→ 17-03 (wave 2) ──→ 17-04 (wave 3)
17-02 (wave 1) ─┘
```
- No cycles
- No forward references
- No references to non-existent plans
- Wave numbers consistent with `max(deps) + 1`

### Dimension 4: Key Links Planned ✅
All critical artifacts are wired:
- `filters.py` → `main.py` (import in `handle_render`)
- `convert.py` → `main.py` (import in `handle_convert`)
- `protocol.ts` → `docx-pipeline.ts` (schema imports)
- `variable-registry.ts` → `pdf.ts` (`getMissingVariables` call)
- `context-builder.ts` → `pdf.ts` (`buildJinja2Context` call)
- `docx-pipeline.ts` → `pdf.ts` (`runSidecarCommand` calls)
- `pdf.ts` → `_app.ts` (router registration)
- `test_integration.py` → `main.py` (subprocess IPC calls)

### Dimension 5: Scope Sanity ✅
| Plan | Tasks | Files | Assessment |
|------|-------|-------|------------|
| 17-01 | 3 | 4 | ✅ Well-scoped |
| 17-02 | 2 | 4 | ✅ Well-scoped |
| 17-03 | 3 | 4 | ✅ Well-scoped |
| 17-04 | 2 | 2 | ✅ Well-scoped |

No plan exceeds thresholds. Auth/payments-level complexity is appropriately split across 4 plans.

### Dimension 6: Verification Derivation ✅
`must_haves.truths` are user-observable or test-observable:
- "Python sidecar can render a .docx template…" — observable via test output
- "tRPC pdfRouter.generate accepts dosyaId + sablonId…" — observable via API call
- "Missing variables are detected before sidecar call…" — observable via error response
- "Integration test renders a canary DOCX…" — observable via exit code 0

### Dimension 7: Context Compliance ✅
- **Locked Decisions (D-01..D-08):** Every decision has implementing tasks. No contradictions.
- **Deferred Ideas:** None of the deferred items (PDF archive, UI button, quick actions, dry-run, batch, template management improvements) appear in any plan.
- **Discretion Areas:** Appropriately handled — variable-to-tab mapping structure (inline const), filter implementation details, temp file handling, timeout values, progress granularity are left to implementer discretion as intended.

### Dimension 7b: Scope Reduction Detection ✅
No scope reduction language detected. All tasks deliver full decisions:
- No "v1"/"v2" split invented
- No "static for now" or "placeholder" for core requirements
- No "will be wired later" on critical paths
- D-26 (or equivalent) does not apply to this phase

### Dimension 7c: Architectural Tier Compliance ✅
Per RESEARCH.md Architectural Responsibility Map:
| Capability | Expected Tier | Actual Tier | Status |
|------------|--------------|-------------|--------|
| Jinja2 render | Python sidecar | Python sidecar (17-01) | ✅ |
| TR filters | Python sidecar | Python sidecar (17-01) | ✅ |
| DOCX→PDF convert | Python sidecar | Python sidecar (17-01) | ✅ |
| Case data → context | tRPC router (Node) | tRPC router (17-03) | ✅ |
| Missing var pre-check | tRPC router (Node) | tRPC router (17-02/03) | ✅ |
| Error → TR toast | tRPC router (Node) | tRPC router (17-03) | ✅ |
| Retry / timeout | Python sidecar | Python sidecar (17-01) | ✅ |

### Dimension 8: Nyquist Compliance ✅
All implementation tasks have `<automated>` verification commands:
| Task | Plan | Wave | Automated Command |
|------|------|------|-------------------|
| T1 | 17-01 | 1 | `python test_filters.py` |
| T2 | 17-01 | 1 | `python -c "from convert import ..."` |
| T3 | 17-01 | 1 | `python -c "import main; ..."` |
| T1 | 17-02 | 1 | `npx tsc --noEmit ...` |
| T2 | 17-02 | 1 | `npm test -- variable-registry.test.ts` |
| T1 | 17-03 | 2 | `npx tsc --noEmit ...` |
| T2 | 17-03 | 2 | `npx tsc --noEmit ...` |
| T3 | 17-03 | 2 | `npx tsc --noEmit ...` |
| T1 | 17-04 | 3 | `python test_integration.py` |
| T2 | 17-04 | 3 | checkpoint:human-verify (N/A) |

- No watch-mode flags
- No full E2E suite in fast-feedback path (integration test is per-wave)
- Wave 0 test gaps from RESEARCH.md are closed by inline TDD/test tasks within Wave 1

### Dimension 9: Cross-Plan Data Contracts ✅
Shared data paths:
- **Jinja2 context** (Plan 03 → Plan 01): Plan 03 builds nested TS object; Plan 01 consumes as Python dict. JSON serialization across IPC preserves structure. No transform conflicts.
- **Variable registry** (Plan 02 → Plan 03): Plan 02 defines paths/labels; Plan 03 uses for pre-check. Compatible.
- **Template variables** (Phase 16 → Plan 02/03): `template.degiskenler` JSON array consumed directly. No transform.

No conflicting transforms on shared entities.

### Dimension 10: AGENTS.md Compliance ✅
- Plans respect TS/Drizzle stack mandate
- No forbidden patterns introduced
- tRPC router pattern matches existing `sablon.ts` reference
- Sidecar IPC pattern matches existing protocol
- Playwright verification referenced in 17-04 success criteria (human checkpoint)

### Dimension 11: Research Resolution ⚠️
RESEARCH.md `## Open Questions` section lacks `(RESOLVED)` suffix and inline `RESOLVED` markers, despite all three questions having clear resolutions implemented in the plans:
1. Null values → resolved by `sanitize_context()` in 17-01 Task 3
2. Array access → resolved by `getNestedValue()` array-index support in 17-02 Task 2
3. Timeout → resolved by 120s default + configurable override in 17-01/02/03

**Severity:** Warning (documentation formality; execution is not blocked).

### Dimension 12: Pattern Compliance ✅
No PATTERNS.md exists for this phase; skipped per instructions.

---

## Findings

### Warnings

**1. [research_resolution] Open Questions section not marked resolved**
- **File:** `17-RESEARCH.md`
- **Description:** The `## Open Questions` section lacks the `(RESOLVED)` suffix and individual questions lack inline `RESOLVED` markers, even though all three questions are answered in the plans.
- **Fix:** Update section header to `## Open Questions (RESOLVED)` and prepend `RESOLVED:` to each question's recommendation before execution begins.

**2. [dependency_risk] 17-04 integration test depends on LibreOffice binary availability**
- **Plan:** 17-04
- **Task:** Task 1
- **Description:** The integration test requires a working LibreOffice installation. If LibreOffice is not installed or not on PATH, the automated verify will fail. This is an environment risk, not a plan flaw.
- **Fix:** Ensure `LIBREOFFICE_PATH` is configured (from Phase 15) before executing 17-04. The test already includes a fallback path for Windows (`C:\Program Files\LibreOffice\program\soffice.exe`).

### Info

**1. [requirements_inconsistency] PDF-03 currency symbol: TL vs ₺**
- **Description:** `REQUIREMENTS.md` specifies `150.000,00 TL` for PDF-03, but `CONTEXT.md`, `RESEARCH.md`, and the plans all specify `150.000,00 ₺` (the modern Turkish Lira sign, produced by Babel `format_currency(..., 'TRY', locale='tr_TR')`). Babel's output is the more correct symbol.
- **Disposition:** The plans follow the correct Babel behavior. Consider updating `REQUIREMENTS.md` to match `₺` for consistency.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation in Plans |
|------|-----------|--------|---------------------|
| LibreOffice not found on Windows | Low | High | 17-03 Task 2 checks `getLibreOfficePath()` and throws `TRPCError` if null |
| LibreOffice SingletonLock hang | Low | High | 17-01 Task 2 uses per-invocation temp profile (`-env:UserInstallation=file:///TEMP/lo-{uuid}`) |
| Turkish character rendering failure | Low | High | 17-04 Task 1 (canary template with `çÇğĞıİöÖşŞüÜ`) + Task 2 (human visual verify) |
| Tenacity retry exhausts all 3 attempts | Low | Medium | 17-03 Task 2 returns structured error to client; no silent failure |
| Missing variable false negative | Low | Medium | 17-02 Task 2 registry covers all schema fields; unknown vars fallback to `tab: 'genel'` |
| Large case data causes timeout | Low | Medium | 17-03 Task 2 uses 180s envelope for convert (120s sidecar + buffer) |

---

## Recommendation

**PROCEED with execution.**

The Phase 17 plans are comprehensive, well-structured, and trace directly to the phase goal and all 10 requirements. The 4-plan wave structure (01+02 parallel → 03 → 04) correctly respects dependencies and keeps scope within context budget.

### Pre-Execution Checklist
- [ ] Ensure Phase 15 (Pipeline Temeli) is complete — sidecar IPC and LibreOffice path detection must work
- [ ] Ensure Phase 16 (Şablon Şeması ve CRUD) is complete — `docx_sablon` table and `degiskenler` JSON field must exist
- [ ] Mark `17-RESEARCH.md` `## Open Questions` as resolved (documentation update)
- [ ] Confirm `LIBREOFFICE_PATH` env var or system default is accessible before running 17-04

### Execution Order
1. **Wave 1 (parallel):** Execute 17-01 and 17-02 simultaneously
2. **Wave 2:** Execute 17-03 (depends on 01 + 02)
3. **Wave 3:** Execute 17-04 (depends on 03)

---

*Validation complete. Ready for `/gsd-execute-phase 17`.*
